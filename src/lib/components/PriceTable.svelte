<script lang="ts">
    import type { PriceRow } from '$lib/types';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import { formatInt } from '$lib/utils/format';
    import {
        calculateBreakEvenPrice as calcBreakEven,
        calculatePostTaxProfit as calcPostTaxProfit
    } from '$lib/utils/tax';
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

    // Wrapper functions for break-even and post-tax profit calculations
    const calculateBreakEvenPrice = (
        _buyPrice: number | null,
        sellPrice: number | null,
        itemId: number
    ): number | null => {
        return calcBreakEven(sellPrice, itemId);
    };

    const calculatePostTaxProfit = (
        buyPrice: number | null,
        sellPrice: number | null,
        itemId: number
    ): number | null => {
        return calcPostTaxProfit(buyPrice, sellPrice, itemId);
    };

    const getPostTaxProfitValue = (
        buyPrice: number | null,
        sellPrice: number | null,
        itemId: number
    ): number | null => {
        return calculatePostTaxProfit(buyPrice, sellPrice, itemId);
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
                    title="The name of the item"
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
                    title="The maximum number of items you can buy in 4 hours"
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
                    title="The current price to buy this item from the Grand Exchange"
                    on:click={() => sortable && sortBy && sortBy('buyPrice')}
                >
                    Buy price <span class="ml-1 opacity-60 select-none">{sortIcon('buyPrice')}</span>
                </th>
            {/if}
            {#if columnVisibility.buyTime}
                <th
                    class="text-right p-2 {sortable ? 'cursor-pointer' : ''}"
                    title="When the last buy transaction occurred"
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
                    title="The current price to sell this item on the Grand Exchange"
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
                    title="When the last sell transaction occurred"
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
                    title="The minimum sell price needed to recover your cost after GE tax (2%, capped at 5M gp, no tax below 50 gp)."
                    on:click={() => sortable && sortBy && sortBy('breakEvenPrice')}
                >
                    Break-even price
                    <span
                        class="mr-1 text-xs opacity-70 cursor-help inline-block align-top relative"
                        style="font-size: 0.75em; vertical-align: super; top: -0.2em;"
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
                    title="The profit margin (sell price - buy price)"
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
                    title="Your profit if you buy at 'Sell price' and sell at 'Buy price', after GE tax (2% rounded down, capped at 5M gp)."
                    on:click={() => sortable && sortBy && sortBy('postTaxProfit')}
                >
                    Post-tax profit
                    <span
                        class="mr-1 text-xs opacity-70 cursor-help inline-block align-top relative"
                        style="font-size: 0.75em; vertical-align: super; top: -0.2em;"
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
                    title="The number of items traded in the last 24 hours."
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
                <td colspan={visibleColumnCount} class="p-8 text-center">
                    <div class="flex flex-col items-center gap-3 opacity-60">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <div>
                            <p class="font-medium text-base">No items match your filters</p>
                            <p class="text-sm mt-1">Try adjusting your search or filter criteria</p>
                        </div>
                    </div>
                </td>
            </tr>
        {:else}
            {#each rows as r (r.id)}
                <tr
                    class="border-t border-gray-200 dark:border-gray-800 even:bg-gray-50 dark:even:bg-gray-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 animate-fade-in"
                >
                    <td class="h-4 w-4">
                        {#if r.icon}
                            <img class="object-contain" src={r.icon} alt={r.name} />
                        {/if}
                    </td>
                    {#if columnVisibility.name}
                        <td class="p-2">
                            <div class="flex gap-2 items-center">
                                <a
                                    href="/item/{r.id}"
                                    class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                    title={r.examine ?? r.name}
                                >
                                    {r.name}
                                </a>
                                {#if r.wikiUrl}
                                    <a
                                        href={r.wikiUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
                                        title="View on OSRS Wiki"
                                    >
                                        📖
                                    </a>
                                {/if}
                            </div>
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
                            {#if calculateBreakEvenPrice(r.buyPrice, r.sellPrice, r.id) == null}
                                <span title="No break-even price data available for this item" class="cursor-help"
                                    >—</span
                                >
                            {:else}
                                {formatInt(calculateBreakEvenPrice(r.buyPrice, r.sellPrice, r.id))}
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
                            class:red-text={getPostTaxProfitValue(r.buyPrice, r.sellPrice, r.id) !== null &&
                                getPostTaxProfitValue(r.buyPrice, r.sellPrice, r.id)! < 0}
                            class:green-text={getPostTaxProfitValue(r.buyPrice, r.sellPrice, r.id) !== null &&
                                getPostTaxProfitValue(r.buyPrice, r.sellPrice, r.id)! >= 0}
                        >
                            {#if calculatePostTaxProfit(r.buyPrice, r.sellPrice, r.id) == null}
                                <span title="No post-tax profit data available for this item" class="cursor-help"
                                    >—</span
                                >
                            {:else}
                                {formatInt(calculatePostTaxProfit(r.buyPrice, r.sellPrice, r.id))}
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

    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    :global(.animate-fade-in) {
        animation: fade-in 0.3s ease-out;
    }
</style>
