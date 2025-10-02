import type { RequestHandler } from '@sveltejs/kit';
import type { ItemMapping, LatestResponse, PriceRow } from '$lib/types';
import { TtlCache } from '$lib/server/cache';
import { createHash } from 'node:crypto';

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

    function buildWikiImageUrl(fileName: string | undefined): string | undefined {
        if (!fileName) return undefined;
        const normalized = fileName.replace(/ /g, '_');
        const md5 = createHash('md5').update(normalized).digest('hex');
        const d1 = md5[0];
        const d2 = md5.slice(0, 2);
        return `https://oldschool.runescape.wiki/images/${d1}/${d2}/${encodeURIComponent(normalized)}`;
    }

    const rows: PriceRow[] = mapping.map((m) => {
        const l = latestMap[String(m.id)];
        const high = l?.high ?? null;
        const low = l?.low ?? null;
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
            dailyVolume: null,
            examine: m.examine,
            wikiUrl: `https://oldschool.runescape.wiki/w/${encodeURIComponent(m.name)}`
        };
    });

    const payload = { rows };
    cache.set(cacheKey, payload);
    return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } });
};
