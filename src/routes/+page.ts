import type { PageLoad } from './$types';
import type { PriceRow } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
    const res = await fetch('/api/rows');
    if (!res.ok) {
        return { rows: [] as PriceRow[] };
    }
    const data = await res.json();
    return { rows: (data.rows ?? []) as PriceRow[] };
};
