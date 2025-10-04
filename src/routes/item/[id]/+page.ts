import type { PageLoad } from './$types';
import type { PriceRow, TimeseriesResponse } from '$lib/types';

export const load: PageLoad = async ({ params, fetch }) => {
    const itemId = params.id;

    // Fetch all items to get the item details
    const rowsRes = await fetch('/api/rows');
    const rowsData = await rowsRes.json();
    const allItems: PriceRow[] = rowsData.rows || [];

    // Find the specific item
    const item = allItems.find((i) => String(i.id) === itemId);

    if (!item) {
        throw new Error('Item not found');
    }

    // Fetch time-series data (5-minute intervals for last 24 hours)
    const timeseriesRes = await fetch(`/api/timeseries?id=${itemId}&timestep=5m`);
    let timeseries: TimeseriesResponse = { data: [] };

    if (timeseriesRes.ok) {
        timeseries = await timeseriesRes.json();
    }

    return {
        item,
        timeseries: timeseries.data || []
    };
};

