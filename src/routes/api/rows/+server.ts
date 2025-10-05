import type { RequestHandler } from '@sveltejs/kit';
import type { ItemMapping, LatestResponse, PriceRow, Volume24hResponse } from '$lib/types';
import { TtlCache } from '$lib/server/cache';
import { createHash } from 'node:crypto';
import { calculatePostTaxProfit } from '$lib/utils/tax';

const cache = new TtlCache<any>(60_000); // 60s default TTL

async function fetchJson(fetchFn: typeof fetch, url: string): Promise<any> {
    const res = await fetchFn(url, { headers: { 'User-Agent': process.env.USER_AGENT ?? 'osrs-price-tracker (dev)' } });
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    return res.json();
}

export const GET: RequestHandler = async ({ fetch }) => {
    const cacheKey = 'rows:v1';
    const cached = cache.get(cacheKey);
    if (cached) {
        return new Response(JSON.stringify(cached), { headers: { 'content-type': 'application/json' } });
    }

    const [mapping, latest, day24] = (await Promise.all([
        fetchJson(fetch, '/api/mapping'),
        fetchJson(fetch, '/api/latest'),
        fetchJson(fetch, '/api/24h')
    ])) as [ItemMapping[], { data: LatestResponse }, { data: Volume24hResponse }];

    const latestMap = latest.data;
    const basicVolumeMap = day24.data; // id -> { highPriceVolume, lowPriceVolume }

    // For now, just use basic volume data - enhanced metrics will be calculated per-item as needed
    const volumeMap = basicVolumeMap;

    function buildWikiImageUrl(fileName: string | undefined): string | undefined {
        if (!fileName) return undefined;
        const normalized = fileName.replace(/ /g, '_');
        const md5 = createHash('md5').update(normalized).digest('hex');
        const d1 = md5[0];
        const d2 = md5.slice(0, 2);
        return `https://oldschool.runescape.wiki/images/${d1}/${d2}/${encodeURIComponent(normalized)}`;
    }

    // Helper function to get volume and daily metrics from timeseries data
    async function getTimeseriesData(itemId: number): Promise<{
        dailyVolume: number | null;
        dailyMetrics: {
            dailyLow: number | null;
            dailyHigh: number | null;
            averageBuy: number | null;
            averageSell: number | null;
        } | null;
    }> {
        try {
            const timeseriesRes = await fetch(`/api/timeseries?id=${itemId}&timestep=5m`);
            if (!timeseriesRes.ok) {
                return { dailyVolume: null, dailyMetrics: null };
            }

            const timeseriesData = await timeseriesRes.json();
            const dataPoints = timeseriesData.data || [];

            if (dataPoints.length === 0) {
                return { dailyVolume: null, dailyMetrics: null };
            }

            // Calculate daily volume from all data points
            const totalVolume = dataPoints.reduce((sum: number, point: any) => {
                return sum + (point.highPriceVolume || 0) + (point.lowPriceVolume || 0);
            }, 0);

            // Calculate daily metrics from price data
            const buyPrices: number[] = [];
            const sellPrices: number[] = [];

            for (const point of dataPoints) {
                if (point.avgHighPrice !== null && point.avgHighPrice !== undefined) {
                    buyPrices.push(point.avgHighPrice);
                }
                if (point.avgLowPrice !== null && point.avgLowPrice !== undefined) {
                    sellPrices.push(point.avgLowPrice);
                }
            }

            const dailyMetrics = {
                dailyLow: sellPrices.length > 0 ? Math.min(...sellPrices) : null,
                dailyHigh: buyPrices.length > 0 ? Math.max(...buyPrices) : null,
                averageBuy:
                    buyPrices.length > 0
                        ? Math.round(buyPrices.reduce((sum, price) => sum + price, 0) / buyPrices.length)
                        : null,
                averageSell:
                    sellPrices.length > 0
                        ? Math.round(sellPrices.reduce((sum, price) => sum + price, 0) / sellPrices.length)
                        : null
            };

            return {
                dailyVolume: totalVolume > 0 ? totalVolume : null,
                dailyMetrics
            };
        } catch (error) {
            console.error(`Failed to fetch timeseries for item ${itemId}:`, error);
            return { dailyVolume: null, dailyMetrics: null };
        }
    }

    // Process items in chunks to avoid overwhelming the API with too many concurrent requests
    const CHUNK_SIZE = 50; // Process 50 items at a time
    const chunks = [];
    for (let i = 0; i < mapping.length; i += CHUNK_SIZE) {
        chunks.push(mapping.slice(i, i + CHUNK_SIZE));
    }

    const rows: PriceRow[] = [];

    for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (m) => {
            const l = latestMap[String(m.id)];
            let high = l?.high ?? null;
            let low = l?.low ?? null;

            // Handle data errors - unreasonably high prices (like 2^31-1) are likely data errors
            if (high !== null && high >= 2147483647) high = null;
            if (low !== null && low >= 2147483647) low = null;

            // First try to get volume from 24h API
            let dailyVolume: number | null = null;
            let dailyMetrics = null;
            const volEntry = volumeMap[String(m.id)];

            if (volEntry) {
                const highVol = volEntry.highPriceVolume ?? 0;
                const lowVol = volEntry.lowPriceVolume ?? 0;
                const totalVol = highVol + lowVol;
                if (totalVol > 0) {
                    dailyVolume = totalVol;
                }
                // Use daily metrics from 24h API if available
                if (volEntry.dailyLow !== undefined || volEntry.dailyHigh !== undefined) {
                    dailyMetrics = {
                        dailyLow: volEntry.dailyLow ?? null,
                        dailyHigh: volEntry.dailyHigh ?? null,
                        averageBuy: volEntry.averageBuy ?? null,
                        averageSell: volEntry.averageSell ?? null
                    };
                }
            }

            // If no volume data from 24h API, fetch from timeseries
            if (dailyVolume === null) {
                const timeseriesData = await getTimeseriesData(m.id);
                if (timeseriesData.dailyVolume !== null) {
                    dailyVolume = timeseriesData.dailyVolume;
                }
                if (timeseriesData.dailyMetrics !== null) {
                    dailyMetrics = timeseriesData.dailyMetrics;
                }
            }

            // Calculate margin (buy price - sell price)
            const margin = high != null && low != null ? high - low : null;

            // Calculate potential profit (buyLimit × postTaxProfit)
            const postTaxProfit = calculatePostTaxProfit(high, low, m.id);
            const potentialProfit =
                (m.limit ?? 0) > 0 && postTaxProfit !== null ? (m.limit ?? 0) * postTaxProfit : null;

            return {
                id: m.id,
                name: m.name,
                // Deterministic hashed upload path to avoid client-side redirects
                icon: buildWikiImageUrl(m.icon),
                members: m.members,
                buyLimit: m.limit ?? null,
                buyPrice: high,
                buyTime: l?.highTime ?? null,
                sellPrice: low,
                sellTime: l?.lowTime ?? null,
                margin,
                dailyVolume,
                dailyLow: dailyMetrics?.dailyLow ?? null,
                dailyHigh: dailyMetrics?.dailyHigh ?? null,
                averageBuy: dailyMetrics?.averageBuy ?? null,
                averageSell: dailyMetrics?.averageSell ?? null,
                potentialProfit,
                examine: m.examine,
                wikiUrl: `https://oldschool.runescape.wiki/w/${encodeURIComponent(m.name)}`,
                highalch: m.highalch ?? null,
                lowalch: m.lowalch ?? null,
                value: m.value ?? null
            };
        });

        const chunkResults = await Promise.allSettled(chunkPromises);

        // Process results and filter out any failures
        for (const result of chunkResults) {
            if (result.status === 'fulfilled') {
                rows.push(result.value);
            } else {
                console.error('Failed to process item:', result.reason);
            }
        }
    }

    const payload = { rows };
    cache.set(cacheKey, payload);
    return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } });
};
