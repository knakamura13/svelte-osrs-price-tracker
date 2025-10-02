import type { RequestHandler } from '@sveltejs/kit';
import type { ItemMapping, LatestResponse, PriceRow } from '$lib/types';
import { TtlCache } from '$lib/server/cache';

const cache = new TtlCache<any>(60_000); // 60s default TTL

async function fetchJson(fetchFn: typeof fetch, url: string): Promise<any> {
    const res = await fetchFn(url, {
        headers: { 'User-Agent': process.env.USER_AGENT ?? 'osrs-price-tracker (dev)' }
    });
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    return res.json();
}

export const GET: RequestHandler = async ({ fetch }) => {
    const cacheKey = 'rows:v1';
    const cached = cache.get(cacheKey);
    if (cached) {
        return new Response(JSON.stringify(cached), { headers: { 'content-type': 'application/json' } });
    }

    const [mapping, latest] = (await Promise.all([
        fetchJson(fetch, '/api/mapping'),
        fetchJson(fetch, '/api/latest')
    ])) as [ItemMapping[], { data: LatestResponse }];

    const latestMap = latest.data;
    const rows: PriceRow[] = mapping.map((m) => {
        const l = latestMap[String(m.id)];
        const high = l?.high ?? null;
        const low = l?.low ?? null;
        return {
            id: m.id,
            name: m.name,
            icon: m.icon ? `https://oldschool.runescape.wiki/images/${encodeURIComponent(m.icon)}` : undefined,
            members: m.members,
            buyLimit: m.limit ?? null,
            buyPrice: high,
            buyTime: l?.highTime ?? null,
            sellPrice: low,
            sellTime: l?.lowTime ?? null,
            margin: high != null && low != null ? high - low : null,
            dailyVolume: null,
            examine: m.examine,
            wikiUrl: `https://oldschool.runescape.wiki/w/${encodeURIComponent(m.name)}`
        };
    });

    const payload = { rows };
    cache.set(cacheKey, payload);
    return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } });
};
