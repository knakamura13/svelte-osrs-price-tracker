<script lang="ts">
    import type { PriceRow } from '$lib/types';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import { formatPrice } from '$lib/utils/format';
    import {
        calculateBreakEvenPrice as calcBreakEven,
        calculatePostTaxProfit as calcPostTaxProfit
    } from '$lib/utils/tax';
    import PaginationControls from './PaginationControls.svelte';
    import { ChevronUp, ChevronDown, Minus, BookOpen } from 'lucide-svelte';

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
        dailyVolume: true,
        dailyLow: true,
        dailyHigh: true,
        averageBuy: true,
        averageSell: true,
        potentialProfit: true
    };

    // Settings props for decimal formatting
    export let decimalView: boolean = false;
    export let decimalPlaces: number = 2;

    // Pagination props
    export let page: number = 1;
    export let pageSize: number = 25;
    export let totalRows: number = 0;
    export let onPageChange: ((page: number) => void) | undefined;
    export let onPageSizeChange: ((pageSize: number) => void) | undefined;

    // Calculate visible column count for colspan
    $: visibleColumnCount = Object.values(columnVisibility).filter(Boolean).length + 1; // +1 for image column

    let sortIcon: (key: string) => any = () => null;
    $: sortIcon = (key: string) => {
        if (!sortable) return null;
        if (sortKey === key) return sortDir === 'asc' ? ChevronUp : ChevronDown;
        return Minus;
    };

    // Wrapper functions for break-even and post-tax profit calculations
    const calculateBreakEvenPrice = (cost: number | null, itemId: number): number | null => {
        // For break-even price in flipping context, we want to know:
        // "What price do I need to sell at to break even if I bought at the insta-sell price?"
        // So we use sellPrice as the cost (what we paid to acquire the item)
        return calcBreakEven(cost, itemId);
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

<div class="overflow-x-auto">
    <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-[#2a3138] dark:text-gray-200 sticky top-0">
            <tr>
                <th class="p-2 select-none whitespace-nowrap">
                    <!-- Image column -->
                </th>
                <!-- Item Info -->
                {#if columnVisibility.name}
                    <th
                        class="text-left p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The name of the item"
                        on:click={() => sortable && sortBy && sortBy('name')}
                    >
                        <div class="inline-flex items-center gap-1">
                            Name
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('name')}<svelte:component
                                        this={sortIcon('name')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.buyLimit}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The maximum number of items you can buy in 4 hours"
                        on:click={() => sortable && sortBy && sortBy('buyLimit')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Buy limit
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('buyLimit')}<svelte:component
                                        this={sortIcon('buyLimit')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}

                <!-- Current Trading -->
                {#if columnVisibility.buyPrice}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The current insta-buy price for this item from the Grand Exchange"
                        on:click={() => sortable && sortBy && sortBy('buyPrice')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Insta-buy price
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('buyPrice')}<svelte:component
                                        this={sortIcon('buyPrice')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.buyTime}
                    <th
                        class="text-right p-2 whitespace-nowrap {sortable ? 'cursor-pointer' : ''}"
                        title="When the last buy transaction occurred"
                        on:click={() => sortable && sortBy && sortBy('buyTime')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Last buy
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('buyTime')}<svelte:component
                                        this={sortIcon('buyTime')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.sellPrice}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The current insta-sell price for this item on the Grand Exchange"
                        on:click={() => sortable && sortBy && sortBy('sellPrice')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Insta-sell price
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('sellPrice')}<svelte:component
                                        this={sortIcon('sellPrice')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.sellTime}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="When the last sell transaction occurred"
                        on:click={() => sortable && sortBy && sortBy('sellTime')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Last sell
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('sellTime')}<svelte:component
                                        this={sortIcon('sellTime')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}

                <!-- Profit Analysis -->
                {#if columnVisibility.margin}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The profit margin (sell price - buy price)"
                        on:click={() => sortable && sortBy && sortBy('margin')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Margin
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('margin')}<svelte:component
                                        this={sortIcon('margin')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.breakEvenPrice}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The minimum sell price needed to recover your cost after GE tax (2%, capped at 5M gp, no tax below 50 gp)."
                        on:click={() => sortable && sortBy && sortBy('breakEvenPrice')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Break-even price
                            <span
                                class="mr-1 text-xs opacity-70 cursor-help inline-block align-top relative"
                                style="font-size: 0.75em; vertical-align: super; top: -0.2em;"
                                aria-label="Break-even Price tooltip">?</span
                            >
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('breakEvenPrice')}<svelte:component
                                        this={sortIcon('breakEvenPrice')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.postTaxProfit}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="Your profit if you insta-buy at 'Insta-sell price' and insta-sell at 'Insta-buy price', after GE tax (2% rounded down, capped at 5M gp)."
                        on:click={() => sortable && sortBy && sortBy('postTaxProfit')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Post-tax profit
                            <span
                                class="mr-1 text-xs opacity-70 cursor-help inline-block align-top relative"
                                style="font-size: 0.75em; vertical-align: super; top: -0.2em;"
                                aria-label="Post-tax Profit tooltip">?</span
                            >
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('postTaxProfit')}<svelte:component
                                        this={sortIcon('postTaxProfit')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.potentialProfit}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="Your total profit if you buy at 'Insta-sell price' and sell at 'Insta-buy price' for the full buy limit, after GE tax (2% rounded down, capped at 5M gp)."
                        on:click={() => sortable && sortBy && sortBy('potentialProfit')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Potential profit
                            <span
                                class="mr-1 text-xs opacity-70 cursor-help inline-block align-top relative"
                                style="font-size: 0.75em; vertical-align: super; top: -0.2em;"
                                aria-label="Potential Profit tooltip">?</span
                            >
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('potentialProfit')}<svelte:component
                                        this={sortIcon('potentialProfit')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}

                <!-- Historical Data -->
                {#if columnVisibility.dailyVolume}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The number of items traded in the last 24 hours."
                        on:click={() => sortable && sortBy && sortBy('dailyVolume')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Daily volume
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('dailyVolume')}<svelte:component
                                        this={sortIcon('dailyVolume')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.dailyLow}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The lowest price the item was traded for in the past 24 hours."
                        on:click={() => sortable && sortBy && sortBy('dailyLow')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Daily low
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('dailyLow')}<svelte:component
                                        this={sortIcon('dailyLow')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.dailyHigh}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The highest price the item was traded for in the past 24 hours."
                        on:click={() => sortable && sortBy && sortBy('dailyHigh')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Daily high
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('dailyHigh')}<svelte:component
                                        this={sortIcon('dailyHigh')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.averageBuy}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The mean of all insta-buy price values in the past 24 hours."
                        on:click={() => sortable && sortBy && sortBy('averageBuy')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Avg buy
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('averageBuy')}<svelte:component
                                        this={sortIcon('averageBuy')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
                {#if columnVisibility.averageSell}
                    <th
                        class="text-right p-2 select-none hover:text-white transition-colors whitespace-nowrap {sortable
                            ? 'cursor-pointer'
                            : ''}"
                        title="The mean of all insta-sell price values in the past 24 hours."
                        on:click={() => sortable && sortBy && sortBy('averageSell')}
                    >
                        <div class="inline-flex items-center gap-1 justify-end w-full">
                            Avg sell
                            <span class="opacity-60 select-none"
                                >{#if sortIcon('averageSell')}<svelte:component
                                        this={sortIcon('averageSell')}
                                        class="w-3 h-3"
                                    />{/if}</span
                            >
                        </div>
                    </th>
                {/if}
            </tr>
        </thead>
        <tbody>
            {#if rows.length === 0}
                <tr>
                    <td colspan={visibleColumnCount} class="p-8 text-center">
                        <div class="flex flex-col items-center gap-3 opacity-60">
                            <svg
                                class="w-12 h-12"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
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
                                <img class="object-contain" src={r.icon} alt={r.name} loading="lazy" />
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
                                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex items-center"
                                            title="View on OSRS Wiki"
                                        >
                                            <BookOpen class="w-3 h-3" />
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
                                    <span title="No insta-buy price data available for this item" class="cursor-help"
                                        >—</span
                                    >
                                {:else}
                                    {formatPrice(r.buyPrice, decimalView, decimalPlaces)}
                                {/if}
                            </td>
                        {/if}
                        {#if columnVisibility.buyTime}
                            <td class="p-2 text-right opacity-70">{secondsAgoFromUnix(r.buyTime)}</td>
                        {/if}
                        {#if columnVisibility.sellPrice}
                            <td class="p-2 text-right">
                                {#if r.sellPrice == null}
                                    <span title="No insta-sell price data available for this item" class="cursor-help"
                                        >—</span
                                    >
                                {:else}
                                    {formatPrice(r.sellPrice, decimalView, decimalPlaces)}
                                {/if}
                            </td>
                        {/if}
                        {#if columnVisibility.sellTime}
                            <td class="p-2 text-right opacity-70">{secondsAgoFromUnix(r.sellTime)}</td>
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
                                    {formatPrice(r.margin, decimalView, decimalPlaces)}
                                {/if}
                            </td>
                        {/if}
                        {#if columnVisibility.breakEvenPrice}
                            {@const breakEvenPrice = calculateBreakEvenPrice(r.sellPrice, r.id)}
                            <td class="p-2 text-right">
                                {#if breakEvenPrice == null}
                                    <span title="No break-even price data available for this item" class="cursor-help"
                                        >—</span
                                    >
                                {:else if breakEvenPrice <= 0}
                                    <span
                                        title="Unexpected negative break-even price - please report this bug"
                                        class="cursor-help text-red-500">ERROR</span
                                    >
                                {:else}
                                    {formatPrice(breakEvenPrice, decimalView, decimalPlaces)}
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
                                    {formatPrice(
                                        calculatePostTaxProfit(r.buyPrice, r.sellPrice, r.id),
                                        decimalView,
                                        decimalPlaces
                                    )}
                                {/if}
                            </td>
                        {/if}
                        {#if columnVisibility.potentialProfit}
                            <td
                                class="p-2 text-right"
                                class:red-text={r.potentialProfit !== null && r.potentialProfit! < 0}
                                class:green-text={r.potentialProfit !== null && r.potentialProfit! >= 0}
                            >
                                {#if r.potentialProfit == null}
                                    <span title="No potential profit data available for this item" class="cursor-help"
                                        >—</span
                                    >
                                {:else}
                                    {formatPrice(r.potentialProfit, decimalView, decimalPlaces)}
                                {/if}
                            </td>
                        {/if}
                        {#if columnVisibility.dailyVolume}
                            <td class="p-2 text-right">
                                {#if r.dailyVolume !== null && r.dailyVolume !== undefined && r.dailyVolume > 0}
                                    {formatPrice(r.dailyVolume, decimalView, decimalPlaces)}
                                {:else}
                                    <span
                                        title="No volume data available for this item"
                                        class="cursor-help"
                                        class:red-text={true}>—</span
                                    >
                                {/if}
                            </td>
                        {/if}
                        {#if columnVisibility.dailyLow}
                            <td class="p-2 text-right">
                                {#if r.dailyLow !== null && r.dailyLow !== undefined}
                                    {formatPrice(r.dailyLow, decimalView, decimalPlaces)}
                                {:else}
                                    <span title="No daily low data available for this item" class="cursor-help">—</span>
                                {/if}
                            </td>
                        {/if}
                        {#if columnVisibility.dailyHigh}
                            <td class="p-2 text-right">
                                {#if r.dailyHigh !== null && r.dailyHigh !== undefined}
                                    {formatPrice(r.dailyHigh, decimalView, decimalPlaces)}
                                {:else}
                                    <span title="No daily high data available for this item" class="cursor-help">—</span
                                    >
                                {/if}
                            </td>
                        {/if}
                        {#if columnVisibility.averageBuy}
                            <td class="p-2 text-right">
                                {#if r.averageBuy !== null && r.averageBuy !== undefined}
                                    {formatPrice(r.averageBuy, decimalView, decimalPlaces)}
                                {:else}
                                    <span title="No average buy data available for this item" class="cursor-help"
                                        >—</span
                                    >
                                {/if}
                            </td>
                        {/if}
                        {#if columnVisibility.averageSell}
                            <td class="p-2 text-right">
                                {#if r.averageSell !== null && r.averageSell !== undefined}
                                    {formatPrice(r.averageSell, decimalView, decimalPlaces)}
                                {:else}
                                    <span title="No average sell data available for this item" class="cursor-help"
                                        >—</span
                                    >
                                {/if}
                            </td>
                        {/if}
                    </tr>
                {/each}
            {/if}
        </tbody>
    </table>
</div>

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
