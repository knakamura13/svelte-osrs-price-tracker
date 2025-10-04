import type { RequestHandler } from '@sveltejs/kit';
import type { Volume24hResponse, TimeseriesResponse, Volume24hEntry } from '$lib/types';

const BASE = 'https://prices.runescape.wiki/api/v1/osrs';

export const GET: RequestHandler = async ({ fetch, url }) => {
    const id = url.searchParams.get('id');

    // If specific item requested, fetch both 24h and timeseries data to calculate daily metrics
    if (id) {
        try {
            // Fetch 24h volume data
            const volumeRes = await fetch(`${BASE}/24h?id=${encodeURIComponent(id)}`, {
                headers: { 'User-Agent': process.env.USER_AGENT ?? 'osrs-price-tracker (dev)' }
            });

            if (!volumeRes.ok) {
                return new Response(await volumeRes.text(), {
                    status: volumeRes.status,
                    headers: { 'content-type': volumeRes.headers.get('content-type') ?? 'application/json' }
                });
            }

            const volumeData = (await volumeRes.json()) as Volume24hResponse;

            // Fetch timeseries data for last 24 hours (5-minute intervals)
            const timeseriesRes = await fetch(`${BASE}/timeseries?timestep=5m&id=${encodeURIComponent(id)}`, {
                headers: { 'User-Agent': process.env.USER_AGENT ?? 'osrs-price-tracker (dev)' }
            });

            let timeseriesData: TimeseriesResponse = { data: [] };
            if (timeseriesRes.ok) {
                timeseriesData = await timeseriesRes.json();
            }

            // Calculate daily metrics from timeseries data
            const dataPoints = timeseriesData.data || [];
            const metrics = calculateDailyMetrics(dataPoints, id!);

            // Combine volume data with calculated metrics
            const enhancedData: Volume24hResponse = {};
            for (const [itemId, volumeEntry] of Object.entries(volumeData)) {
                enhancedData[itemId] = { ...volumeEntry, ...metrics };
            }

            return new Response(JSON.stringify(enhancedData), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                    'cache-control': 'public, max-age=60' // Cache for 1 minute
                }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Failed to fetch enhanced 24h data' }), {
                status: 500,
                headers: { 'content-type': 'application/json' }
            });
        }
    }

    // For general 24h data (all items), just proxy the external API
    const res = await fetch(`${BASE}/24h`, {
        headers: { 'User-Agent': process.env.USER_AGENT ?? 'osrs-price-tracker (dev)' }
    });
    return new Response(await res.text(), {
        status: res.status,
        headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' }
    });
};

// Calculate daily metrics from timeseries data
function calculateDailyMetrics(
    dataPoints: any[],
    itemId: string
): { dailyLow?: number | null; dailyHigh?: number | null; averageBuy?: number | null; averageSell?: number | null } {
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
