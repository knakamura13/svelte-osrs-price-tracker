import type { RequestHandler } from '@sveltejs/kit';
import type { ItemMapping, LatestResponse, PriceRow, Volume24hResponse, TimeseriesResponse } from '$lib/types';
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
    const cacheKey = 'rows:v2';
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
    const basicVolumeMap = (day24 as any).data || day24; // id -> { highPriceVolume, lowPriceVolume }

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
        const BASE = 'https://prices.runescape.wiki/api/v1/osrs';

        try {
            // Fetch timeseries data for last 24 hours (5-minute intervals)
            const timeseriesRes = await fetch(`${BASE}/timeseries?timestep=5m&id=${itemId}`, {
                headers: { 'User-Agent': process.env.USER_AGENT ?? 'osrs-price-tracker (dev)' }
            });

            if (!timeseriesRes.ok) {
                return { dailyVolume: null, dailyMetrics: null };
            }

            const timeseriesData: TimeseriesResponse = await timeseriesRes.json();
            const dataPoints = timeseriesData.data || [];

            if (dataPoints.length === 0) {
                return { dailyVolume: null, dailyMetrics: null };
            }

            // Calculate daily volume from all data points
            const totalVolume = dataPoints.reduce((sum: number, point: any) => {
                return sum + (point.highPriceVolume || 0) + (point.lowPriceVolume || 0);
            }, 0);

            // Calculate daily metrics using the same logic as /api/24h
            const dailyMetrics = calculateDailyMetrics(dataPoints, String(itemId));

            return {
                dailyVolume: totalVolume > 0 ? totalVolume : null,
                dailyMetrics
            };
        } catch (error) {
            console.error(`Failed to fetch timeseries for item ${itemId}:`, error);
            return { dailyVolume: null, dailyMetrics: null };
        }
    }

    // Calculate daily metrics from timeseries data (reused from /api/24h/+server.ts)
    function calculateDailyMetrics(
        dataPoints: any[],
        itemId: string
    ): {
        dailyLow?: number | null;
        dailyHigh?: number | null;
        averageBuy?: number | null;
        averageSell?: number | null;
    } {
        if (dataPoints.length === 0) {
            return { dailyLow: null, dailyHigh: null, averageBuy: null, averageSell: null };
        }

        const buyPrices: number[] = [];
        const sellPrices: number[] = [];

        for (const point of dataPoints) {
            // Extract insta-buy/sell prices from avgHighPrice and avgLowPrice
            // Note: The external API uses avgHighPrice for insta-buy prices and avgLowPrice for insta-sell prices
            if (point.avgHighPrice !== null && point.avgHighPrice !== undefined) {
                buyPrices.push(point.avgHighPrice);
            }
            if (point.avgLowPrice !== null && point.avgLowPrice !== undefined) {
                sellPrices.push(point.avgLowPrice);
            }
        }

        return {
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

                // Use daily metrics from 24h API if available, otherwise calculate from avg prices
                if (volEntry.dailyLow !== undefined || volEntry.dailyHigh !== undefined) {
                    dailyMetrics = {
                        dailyLow: volEntry.dailyLow ?? null,
                        dailyHigh: volEntry.dailyHigh ?? null,
                        averageBuy: volEntry.averageBuy ?? null,
                        averageSell: volEntry.averageSell ?? null
                    };
                } else if (volEntry.avgHighPrice !== undefined && volEntry.avgLowPrice !== undefined) {
                    // Calculate metrics from the average prices in 24h data
                    const buyPrices = [volEntry.avgHighPrice].filter((p) => p !== null);
                    const sellPrices = [volEntry.avgLowPrice].filter((p) => p !== null);

                    dailyMetrics = {
                        dailyLow: sellPrices.length > 0 ? Math.min(...sellPrices) : null,
                        dailyHigh: buyPrices.length > 0 ? Math.max(...buyPrices) : null,
                        averageBuy: buyPrices.length > 0 ? Math.round(buyPrices[0]) : null,
                        averageSell: sellPrices.length > 0 ? Math.round(sellPrices[0]) : null
                    };
                }
            }

            // Always fetch from timeseries as a validation check
            // If 24h API gave us volume data, compare it with timeseries to detect discrepancies
            const timeseriesData = await getTimeseriesData(m.id);

            // If 24h API gave us no volume data, use timeseries
            if (dailyVolume === null) {
                if (timeseriesData.dailyVolume !== null) {
                    dailyVolume = timeseriesData.dailyVolume;
                }
                if (timeseriesData.dailyMetrics !== null) {
                    dailyMetrics = timeseriesData.dailyMetrics;
                }
            } else if (timeseriesData.dailyVolume !== null) {
                // If both sources have data, compare them to detect potential issues
                const volumeRatio = timeseriesData.dailyVolume / dailyVolume;

                // If timeseries volume is significantly different from 24h API volume,
                // prefer timeseries data (which tends to be more accurate for real-time data)
                // This handles cases where 24h API has stale or incorrect data
                if (volumeRatio < 0.1 || volumeRatio > 10) {
                    console.warn(`Volume discrepancy detected for item ${m.id}: 24h API=${dailyVolume}, timeseries=${timeseriesData.dailyVolume}. Using timeseries data.`);
                    dailyVolume = timeseriesData.dailyVolume;

                    // Also use timeseries metrics if available
                    if (timeseriesData.dailyMetrics !== null) {
                        dailyMetrics = timeseriesData.dailyMetrics;
                    }
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
