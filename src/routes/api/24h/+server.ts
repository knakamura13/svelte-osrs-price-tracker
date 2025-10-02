import type { RequestHandler } from '@sveltejs/kit';

const BASE = 'https://prices.runescape.wiki/api/v1/osrs';

export const GET: RequestHandler = async ({ fetch }) => {
    const res = await fetch(`${BASE}/24h`, {
        headers: {
            'User-Agent': process.env.USER_AGENT ?? 'osrs-price-tracker (dev)'
        }
    });
    return new Response(await res.text(), {
        status: res.status,
        headers: {
            'content-type': res.headers.get('content-type') ?? 'application/json'
        }
    });
};
