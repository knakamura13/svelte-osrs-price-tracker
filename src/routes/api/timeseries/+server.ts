import type { RequestHandler } from '@sveltejs/kit';

const BASE = 'https://prices.runescape.wiki/api/v1/osrs';

export const GET: RequestHandler = async ({ fetch, url }) => {
    const id = url.searchParams.get('id');
    const timestep = url.searchParams.get('timestep') || '5m'; // 5m, 1h, 6h, or 24h

    if (!id) {
        return new Response(JSON.stringify({ error: 'Item ID required' }), {
            status: 400,
            headers: { 'content-type': 'application/json' }
        });
    }

    const endpoint = `${BASE}/timeseries?timestep=${timestep}&id=${encodeURIComponent(id)}`;

    try {
        const res = await fetch(endpoint, {
            headers: {
                'User-Agent': process.env.USER_AGENT ?? 'osrs-price-tracker (dev)'
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch timeseries: ${res.status}`);
        }

        return new Response(await res.text(), {
            status: res.status,
            headers: {
                'content-type': res.headers.get('content-type') ?? 'application/json',
                'cache-control': 'public, max-age=60' // Cache for 1 minute
            }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error?.message ?? 'Failed to fetch timeseries' }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
};

