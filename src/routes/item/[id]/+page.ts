import type { PageLoad } from './$types';
import type { PriceRow, TimeseriesResponse } from '$lib/types';

export const load: PageLoad = async ({ params, fetch }) => {
    const itemId = params.id;

    // Fetch the specific item details directly
    const itemRes = await fetch(`/api/item/${itemId}`);
    if (!itemRes.ok) {
        throw new Error('Item not found');
    }
    const itemData = await itemRes.json();
    const item: PriceRow = itemData.item;

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
