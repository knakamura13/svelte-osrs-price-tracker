<script lang="ts">
    import type { PriceRow } from '$lib/types';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import { formatInt } from '$lib/utils/format';
    import PaginationControls from './PaginationControls.svelte';

    export let rows: PriceRow[] = [];
    export let sortable: boolean = false;
    export let sortBy: ((key: string) => void) | undefined;
    export let sortKey: string | null = null;
    export let sortDir: 'asc' | 'desc' = 'asc';
    export let columnVisibility: { [key: string]: boolean } = {
        name: true,
        buyLimit: true,
        buyPrice: true,
        buyTime: true,
        sellPrice: true,
        sellTime: true,
        breakEvenPrice: true,
        margin: true,
        postTaxProfit: true,
        dailyVolume: true
    };

    // Pagination props
    export let page: number = 1;
    export let pageSize: number = 25;
    export let totalRows: number = 0;
    export let onPageChange: ((page: number) => void) | undefined;
    export let onPageSizeChange: ((pageSize: number) => void) | undefined;

    // Calculate visible column count for colspan
    $: visibleColumnCount = Object.values(columnVisibility).filter(Boolean).length + 1; // +1 for image column

    let sortIcon: (key: string) => string = () => '';
    $: sortIcon = (key: string): string => {
        if (!sortable) return '';
        if (sortKey === key) return sortDir === 'asc' ? '▲' : '▼';
        return '↕';
    };

    // Calculate break-even sell price after 2% GE tax
    // Formula: sellNeeded * (1 - taxRate) = cost => sellNeeded = ceil(cost / (1 - taxRate))
    const calculateBreakEvenPrice = (_buyPrice: number | null, sellPrice: number | null): number | null => {
        if (sellPrice === null) return null;
        const taxRate = 0.02;
        return Math.ceil(sellPrice / (1 - taxRate));
    };

    // Calculate post-tax profit if buying at sellPrice and selling at buyPrice
    // Formula: floor(buyPrice * (1 - taxRate) - sellPrice)
    const calculatePostTaxProfit = (buyPrice: number | null, sellPrice: number | null): number | null => {
        if (buyPrice === null || sellPrice === null) return null;
        const taxRate = 0.02;
        return Math.floor(buyPrice * (1 - taxRate) - sellPrice);
    };

    const getPostTaxProfitValue = (buyPrice: number | null, sellPrice: number | null): number | null => {
        return calculatePostTaxProfit(buyPrice, sellPrice);
    };
</script>

<!-- Pagination Controls (Top) -->
<PaginationControls {page} {pageSize} {totalRows} {onPageChange} {onPageSizeChange} />

<table class="w-full text-sm">
    <thead class="bg-gray-50 dark:bg-[#2a3138] dark:text-gray-200 sticky top-0">
        <tr>
            <th class="p-2 select-none">
                <!-- Image column -->
            </th>
            {#if columnVisibility.name}
                <th
                    class="text-left p-2 select-none hover:text-white transition-colors {sortable
                        ? 'cursor-pointer'
                        : ''}"
                    on:click={() => sortable && sortBy && sortBy('name')}
                >
                    Name <span class="ml-1 opacity-60 select-none">{sortIcon('name')}</span>
                </th>
            {/if}
            {#if columnVisibility.buyLimit}
                <th
                    class="text-right p-2 select-none hover:text-white transition-colors {sortable
                        ? 'cursor-pointer'
                        : ''}"
                    on:click={() => sortable && sortBy && sortBy('buyLimit')}
                >
                    Buy limit <span class="ml-1 opacity-60 select-none">{sortIcon('buyLimit')}</span>
                </th>
            {/if}
            {#if columnVisibility.buyPrice}
                <th
                    class="text-right p-2 select-none hover:text-white transition-colors {sortable
                        ? 'cursor-pointer'
                        : ''}"
                    on:click={() => sortable && sortBy && sortBy('buyPrice')}
                >
                    Buy price <span class="ml-1 opacity-60 select-none">{sortIcon('buyPrice')}</span>
                </th>
            {/if}
            {#if columnVisibility.buyTime}
                <th
                    class="text-right p-2 {sortable ? 'cursor-pointer' : ''}"
                    on:click={() => sortable && sortBy && sortBy('buyTime')}
                >
                    Last buy <span class="ml-1 opacity-60 select-none">{sortIcon('buyTime')}</span>
                </th>
            {/if}
            {#if columnVisibility.sellPrice}
                <th
                    class="text-right p-2 select-none hover:text-white transition-colors {sortable
                        ? 'cursor-pointer'
                        : ''}"
                    on:click={() => sortable && sortBy && sortBy('sellPrice')}
                >
                    Sell price <span class="ml-1 opacity-60 select-none">{sortIcon('sellPrice')}</span>
                </th>
            {/if}
            {#if columnVisibility.sellTime}
                <th
                    class="text-right p-2 select-none hover:text-white transition-colors {sortable
                        ? 'cursor-pointer'
                        : ''}"
                    on:click={() => sortable && sortBy && sortBy('sellTime')}
                >
                    Last sell <span class="ml-1 opacity-60 select-none">{sortIcon('sellTime')}</span>
                </th>
            {/if}
            {#if columnVisibility.breakEvenPrice}
                <th
                    class="text-right p-2 select-none hover:text-white transition-colors {sortable
                        ? 'cursor-pointer'
                        : ''}"
                    on:click={() => sortable && sortBy && sortBy('breakEvenPrice')}
                >
                    Break-even price
                    <span
                        class="mr-1 text-xs opacity-70 cursor-help inline-block"
                        title="The minimum sell price needed to recover your cost after the 2% GE tax."
                        aria-label="Break-even Price tooltip">?</span
                    >
                    <span class="ml-1 opacity-60 select-none">{sortIcon('breakEvenPrice')}</span>
                </th>
            {/if}
            {#if columnVisibility.margin}
                <th
                    class="text-right p-2 select-none hover:text-white transition-colors {sortable
                        ? 'cursor-pointer'
                        : ''}"
                    on:click={() => sortable && sortBy && sortBy('margin')}
                >
                    Margin <span class="ml-1 opacity-60 select-none">{sortIcon('margin')}</span>
                </th>
            {/if}
            {#if columnVisibility.postTaxProfit}
                <th
                    class="text-right p-2 select-none hover:text-white transition-colors {sortable
                        ? 'cursor-pointer'
                        : ''}"
                    on:click={() => sortable && sortBy && sortBy('postTaxProfit')}
                >
                    Post-tax profit
                    <span
                        class="mr-1 text-xs opacity-70 cursor-help inline-block"
                        title="Your profit if you were to buy at 'Sell price' and sell at 'Buy price', after deducting the 2% GE tax."
                        aria-label="Post-tax Profit tooltip">?</span
                    >
                    <span class="ml-1 opacity-60 select-none">{sortIcon('postTaxProfit')}</span>
                </th>
            {/if}
            {#if columnVisibility.dailyVolume}
                <th
                    class="text-right p-2 select-none hover:text-white transition-colors {sortable
                        ? 'cursor-pointer'
                        : ''}"
                    on:click={() => sortable && sortBy && sortBy('dailyVolume')}
                >
                    Daily volume <span class="ml-1 opacity-60 select-none">{sortIcon('dailyVolume')}</span>
                </th>
            {/if}
        </tr>
    </thead>
    <tbody>
        {#if rows.length === 0}
            <tr>
                <td class="p-3 text-center text-gray-500" colspan={visibleColumnCount}>No data yet</td>
            </tr>
        {:else}
            {#each rows as r (r.id)}
                <tr class="border-t border-gray-200 dark:border-gray-800">
                    <td class="h-4 w-4">
                        {#if r.icon}
                            <img class="object-contain" src={r.icon} alt={r.name} />
                        {/if}
                    </td>
                    {#if columnVisibility.name}
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
                    {/if}
                    {#if columnVisibility.buyLimit}
                        <td class="p-2 text-right">
                            {#if r.buyLimit !== null}
                                {r.buyLimit}
                            {:else}
                                <span title="This item has no buy limit" class="cursor-help">∞</span>
                            {/if}
                        </td>
                    {/if}
                    {#if columnVisibility.buyPrice}
                        <td class="p-2 text-right">
                            {#if r.buyPrice == null}
                                <span title="No buy price data available for this item" class="cursor-help">—</span>
                            {:else}
                                {formatInt(r.buyPrice)}
                            {/if}
                        </td>
                    {/if}
                    {#if columnVisibility.buyTime}
                        <td class="p-2 text-right opacity-70">{secondsAgoFromUnix(r.buyTime)}</td>
                    {/if}
                    {#if columnVisibility.sellPrice}
                        <td class="p-2 text-right">
                            {#if r.sellPrice == null}
                                <span title="No sell price data available for this item" class="cursor-help">—</span>
                            {:else}
                                {formatInt(r.sellPrice)}
                            {/if}
                        </td>
                    {/if}
                    {#if columnVisibility.sellTime}
                        <td class="p-2 text-right opacity-70">{secondsAgoFromUnix(r.sellTime)}</td>
                    {/if}
                    {#if columnVisibility.breakEvenPrice}
                        <td class="p-2 text-right">
                            {#if calculateBreakEvenPrice(r.buyPrice, r.sellPrice) == null}
                                <span title="No break-even price data available for this item" class="cursor-help"
                                    >—</span
                                >
                            {:else}
                                {formatInt(calculateBreakEvenPrice(r.buyPrice, r.sellPrice))}
                            {/if}
                        </td>
                    {/if}
                    {#if columnVisibility.margin}
                        <td
                            class="p-2 text-right"
                            class:red-text={r.margin !== null && r.margin < 0}
                            class:green-text={r.margin !== null && r.margin >= 0}
                        >
                            {#if r.margin == null}
                                <span title="No margin data available for this item" class="cursor-help">—</span>
                            {:else}
                                {formatInt(r.margin)}
                            {/if}
                        </td>
                    {/if}
                    {#if columnVisibility.postTaxProfit}
                        <td
                            class="p-2 text-right"
                            class:red-text={getPostTaxProfitValue(r.buyPrice, r.sellPrice) !== null &&
                                getPostTaxProfitValue(r.buyPrice, r.sellPrice)! < 0}
                            class:green-text={getPostTaxProfitValue(r.buyPrice, r.sellPrice) !== null &&
                                getPostTaxProfitValue(r.buyPrice, r.sellPrice)! >= 0}
                        >
                            {#if calculatePostTaxProfit(r.buyPrice, r.sellPrice) == null}
                                <span title="No post-tax profit data available for this item" class="cursor-help"
                                    >—</span
                                >
                            {:else}
                                {formatInt(calculatePostTaxProfit(r.buyPrice, r.sellPrice))}
                            {/if}
                        </td>
                    {/if}
                    {#if columnVisibility.dailyVolume}
                        <td class="p-2 text-right">
                            {#if r.dailyVolume !== null}
                                {formatInt(r.dailyVolume)}
                            {:else}
                                <span
                                    title="No volume data available for this item"
                                    class="cursor-help"
                                    class:red-text={r.dailyVolume === null || r.dailyVolume <= 0}>0</span
                                >
                            {/if}
                        </td>
                    {/if}
                </tr>
            {/each}
        {/if}
    </tbody>
</table>

<!-- Pagination Controls (Bottom) -->
<PaginationControls {page} {pageSize} {totalRows} {onPageChange} {onPageSizeChange} />

<style lang="scss">
    .red-text {
        color: rgb(239 68 68); /* red-500 */
    }

    .green-text {
        color: rgb(34 197 94); /* green-500 */
    }

    :global(.dark) .red-text {
        color: rgb(252 165 165); /* red-300 for dark mode */
    }

    :global(.dark) .green-text {
        color: rgb(134 239 172); /* green-300 for dark mode */
    }
</style>
