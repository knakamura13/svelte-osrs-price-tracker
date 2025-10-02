<script lang="ts">
    import type { PriceRow } from '$lib/types';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import { formatInt } from '$lib/utils/format';
    export let rows: PriceRow[] = [];
    export let sortable: boolean = false;
    export let sortBy: ((key: string) => void) | undefined;
    export let sortKey: string | null = null;
    export let sortDir: 'asc' | 'desc' = 'asc';

    let sortIcon: (key: string) => string = () => '';
    $: sortIcon = (key: string): string => {
        if (!sortable) return '';
        if (sortKey === key) return sortDir === 'asc' ? '▲' : '▼';
        return '↕';
    };
</script>

<table class="w-full text-sm">
    <thead class="bg-gray-50 dark:bg-[#2a3138] dark:text-gray-200 sticky top-0">
        <tr>
            <th class="p-2 select-none">
                <!-- Image column -->
            </th>
            <th
                class="text-left p-2 select-none {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('name')}
            >
                Name <span class="ml-1 opacity-60 select-none">{sortIcon('name')}</span>
            </th>
            <th
                class="text-right p-2 select-none {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('buyLimit')}
            >
                Buy limit <span class="ml-1 opacity-60 select-none">{sortIcon('buyLimit')}</span>
            </th>
            <th
                class="text-right p-2 select-none {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('buyPrice')}
            >
                Buy price <span class="ml-1 opacity-60 select-none">{sortIcon('buyPrice')}</span>
            </th>
            <th
                class="text-right p-2 {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('buyTime')}
            >
                Most recent buy <span class="ml-1 opacity-60 select-none">{sortIcon('buyTime')}</span>
            </th>
            <th
                class="text-right p-2 select-none{sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('sellPrice')}
            >
                Sell price <span class="ml-1 opacity-60 select-none">{sortIcon('sellPrice')}</span>
            </th>
            <th
                class="text-right p-2 select-none{sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('sellTime')}
            >
                Most recent sell <span class="ml-1 opacity-60 select-none">{sortIcon('sellTime')}</span>
            </th>
            <th
                class="text-right p-2 select-none {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('margin')}
            >
                Margin <span class="ml-1 opacity-60 select-none">{sortIcon('margin')}</span>
            </th>
            <th
                class="text-right p-2 select-none {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('dailyVolume')}
            >
                Daily volume <span class="ml-1 opacity-60 select-none">{sortIcon('dailyVolume')}</span>
            </th>
        </tr>
    </thead>
    <tbody>
        {#if rows.length === 0}
            <tr>
                <td class="p-3 text-center text-gray-500" colspan="8">No data yet</td>
            </tr>
        {:else}
            {#each rows as r (r.id)}
                <tr class="border-t border-gray-200 dark:border-gray-800">
                    <td class="p-2">
                        {#if r.icon}
                            <img class="h-5 w-5" src={r.icon} alt={r.name} />
                        {/if}
                    </td>
                    <td class="p-2 flex gap-2 items-center">
                        {#if r.wikiUrl}
                            <a
                                class="hover:underline"
                                href={r.wikiUrl}
                                target="_blank"
                                rel="noreferrer"
                                title={r.examine ?? r.name}>{r.name}</a
                            >
                        {:else}
                            <span title={r.examine ?? r.name}>{r.name}</span>
                        {/if}
                    </td>
                    <td class="p-2 text-right">{r.buyLimit ?? '—'}</td>
                    <td class="p-2 text-right">{formatInt(r.buyPrice)}</td>
                    <td class="p-2 text-right">{secondsAgoFromUnix(r.buyTime)}</td>
                    <td class="p-2 text-right">{formatInt(r.sellPrice)}</td>
                    <td class="p-2 text-right">{secondsAgoFromUnix(r.sellTime)}</td>
                    <td class="p-2 text-right">{formatInt(r.margin)}</td>
                    <td class="p-2 text-right">{r.dailyVolume ?? '—'}</td>
                </tr>
            {/each}
        {/if}
    </tbody>
</table>

<style lang="scss">
</style>
