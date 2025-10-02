<script lang="ts">
    import type { PriceRow } from '$lib/types';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import { formatInt } from '$lib/utils/format';
    export let rows: PriceRow[] = [];
    export let sortable: boolean = false;
    export let sortBy: ((key: string) => void) | undefined;
</script>

<div class="overflow-auto rounded border border-gray-300 dark:border-gray-700">
    <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
                <th
                    class="text-left p-2 {sortable ? 'cursor-pointer' : ''}"
                    on:click={() => sortable && sortBy && sortBy('name')}>Name</th
                >
                <th class="text-right p-2">Buy limit</th>
                <th
                    class="text-right p-2 {sortable ? 'cursor-pointer' : ''}"
                    on:click={() => sortable && sortBy && sortBy('buyPrice')}>Buy price</th
                >
                <th
                    class="text-right p-2 {sortable ? 'cursor-pointer' : ''}"
                    on:click={() => sortable && sortBy && sortBy('buyTime')}>Most recent buy</th
                >
                <th
                    class="text-right p-2 {sortable ? 'cursor-pointer' : ''}"
                    on:click={() => sortable && sortBy && sortBy('sellPrice')}>Sell price</th
                >
                <th
                    class="text-right p-2 {sortable ? 'cursor-pointer' : ''}"
                    on:click={() => sortable && sortBy && sortBy('sellTime')}>Most recent sell</th
                >
                <th
                    class="text-right p-2 {sortable ? 'cursor-pointer' : ''}"
                    on:click={() => sortable && sortBy && sortBy('margin')}>Margin</th
                >
                <th class="text-right p-2">Daily volume</th>
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
                        <td class="p-2 flex gap-2 items-center">
                            {#if r.icon}
                                <img src={r.icon} alt={r.name} class="h-5 w-5" />
                            {/if}
                            {#if r.wikiUrl}
                                <a
                                    class="underline hover:no-underline"
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
</div>

<style lang="scss">
</style>
