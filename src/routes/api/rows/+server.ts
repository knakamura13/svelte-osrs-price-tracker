import type { RequestHandler } from '@sveltejs/kit';
import type { ItemMapping, LatestResponse, PriceRow, Volume24hResponse } from '$lib/types';
import { TtlCache } from '$lib/server/cache';
import { createHash } from 'node:crypto';

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

    // Helper function to calculate daily volume from timeseries data
    async function getVolumeFromTimeseries(itemId: number): Promise<number | null> {
        try {
            const timeseriesRes = await fetch(`/api/timeseries?id=${itemId}&timestep=5m`);
            if (!timeseriesRes.ok) return null;

            const timeseriesData = await timeseriesRes.json();
            const dataPoints = timeseriesData.data || [];

            // Sum up all volume data points
            const totalVolume = dataPoints.reduce((sum: number, point: any) => {
                return sum + (point.highPriceVolume || 0) + (point.lowPriceVolume || 0);
            }, 0);

            return totalVolume > 0 ? totalVolume : null;
        } catch (error) {
            console.error(`Failed to fetch timeseries for item ${itemId}:`, error);
            return null;
        }
    }

    const rows: PriceRow[] = await Promise.all(
        mapping.map(async (m) => {
            const l = latestMap[String(m.id)];
            const high = l?.high ?? null;
            const low = l?.low ?? null;

            // First try to get volume from 24h API
            let dailyVolume: number | null = null;
            const volEntry = volumeMap[String(m.id)];
            if (volEntry) {
                const highVol = volEntry.highPriceVolume ?? 0;
                const lowVol = volEntry.lowPriceVolume ?? 0;
                const totalVol = highVol + lowVol;
                if (totalVol > 0) {
                    dailyVolume = totalVol;
                }
            }

            // If no volume data from 24h API, try to calculate from timeseries
            if (dailyVolume === null) {
                dailyVolume = await getVolumeFromTimeseries(m.id);
            }

            // Calculate daily metrics from timeseries data
            let dailyMetrics = null;
            try {
                const timeseriesRes = await fetch(`/api/timeseries?id=${m.id}&timestep=5m`);
                if (timeseriesRes.ok) {
                    const timeseriesData = await timeseriesRes.json();
                    const dataPoints = timeseriesData.data || [];

                    if (dataPoints.length > 0) {
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

                        dailyMetrics = {
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
                }
            } catch (error) {
                console.error(`Failed to calculate daily metrics for item ${m.id}:`, error);
            }

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
                margin: high != null && low != null ? high - low : null,
                dailyVolume,
                dailyLow: dailyMetrics?.dailyLow ?? null,
                dailyHigh: dailyMetrics?.dailyHigh ?? null,
                averageBuy: dailyMetrics?.averageBuy ?? null,
                averageSell: dailyMetrics?.averageSell ?? null,
                examine: m.examine,
                wikiUrl: `https://oldschool.runescape.wiki/w/${encodeURIComponent(m.name)}`,
                highalch: m.highalch ?? null,
                lowalch: m.lowalch ?? null,
                value: m.value ?? null
            };
        })
    );

    const payload = { rows };
    cache.set(cacheKey, payload);
    return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } });
};
