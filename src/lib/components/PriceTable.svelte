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

    // Calculate break-even sell price after 2% GE tax
    // Formula: sellNeeded * (1 - taxRate) = cost => sellNeeded = ceil(cost / (1 - taxRate))
    const calculateBreakEvenPrice = (_buyPrice: number | null, sellPrice: number | null): number | null => {
        if (sellPrice === null) return null;
        const taxRate = 0.02;
        return Math.ceil(sellPrice / (1 - taxRate));
    };

    // Helper function to get break-even price value for conditional logic
    const getBreakEvenPriceValue = (buyPrice: number | null, sellPrice: number | null): number | null => {
        return calculateBreakEvenPrice(buyPrice, sellPrice);
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

<table class="w-full text-sm">
    <thead class="bg-gray-50 dark:bg-[#2a3138] dark:text-gray-200 sticky top-0">
        <tr>
            <th class="p-2 select-none">
                <!-- Image column -->
            </th>
            <th
                class="text-left p-2 select-none hover:text-white transition-colors {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('name')}
            >
                Name <span class="ml-1 opacity-60 select-none">{sortIcon('name')}</span>
            </th>
            <th
                class="text-right p-2 select-none hover:text-white transition-colors {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('buyLimit')}
            >
                Buy limit <span class="ml-1 opacity-60 select-none">{sortIcon('buyLimit')}</span>
            </th>
            <th
                class="text-right p-2 select-none hover:text-white transition-colors {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('buyPrice')}
            >
                Buy price <span class="ml-1 opacity-60 select-none">{sortIcon('buyPrice')}</span>
            </th>
            <th
                class="text-right p-2 {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('buyTime')}
            >
                Last buy <span class="ml-1 opacity-60 select-none">{sortIcon('buyTime')}</span>
            </th>
            <th
                class="text-right p-2 select-none hover:text-white transition-colors {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('sellPrice')}
            >
                Sell price <span class="ml-1 opacity-60 select-none">{sortIcon('sellPrice')}</span>
            </th>
            <th
                class="text-right p-2 select-none hover:text-white transition-colors {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('sellTime')}
            >
                Last sell <span class="ml-1 opacity-60 select-none">{sortIcon('sellTime')}</span>
            </th>
            <th
                class="text-right p-2 select-none hover:text-white transition-colors {sortable ? 'cursor-pointer' : ''}"
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
            <th
                class="text-right p-2 select-none hover:text-white transition-colors {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('margin')}
            >
                Margin <span class="ml-1 opacity-60 select-none">{sortIcon('margin')}</span>
            </th>
            <th
                class="text-right p-2 select-none hover:text-white transition-colors {sortable ? 'cursor-pointer' : ''}"
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
            <th
                class="text-right p-2 select-none hover:text-white transition-colors {sortable ? 'cursor-pointer' : ''}"
                on:click={() => sortable && sortBy && sortBy('dailyVolume')}
            >
                Daily volume <span class="ml-1 opacity-60 select-none">{sortIcon('dailyVolume')}</span>
            </th>
        </tr>
    </thead>
    <tbody>
        {#if rows.length === 0}
            <tr>
                <td class="p-3 text-center text-gray-500" colspan="10">No data yet</td>
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
                    <td class="p-2 text-right">
                        {#if r.buyLimit !== null}
                            {r.buyLimit}
                        {:else}
                            <span title="This item has no buy limit" class="cursor-help">∞</span>
                        {/if}
                    </td>
                    <td class="p-2 text-right">{formatInt(r.buyPrice)}</td>
                    <td class="p-2 text-right opacity-70">{secondsAgoFromUnix(r.buyTime)}</td>
                    <td class="p-2 text-right">{formatInt(r.sellPrice)}</td>
                    <td class="p-2 text-right opacity-70">{secondsAgoFromUnix(r.sellTime)}</td>
                    <td class="p-2 text-right">{formatInt(calculateBreakEvenPrice(r.buyPrice, r.sellPrice))}</td>
                    <td
                        class="p-2 text-right"
                        class:red-text={r.margin !== null && r.margin < 0}
                        class:green-text={r.margin !== null && r.margin >= 0}>{formatInt(r.margin)}</td
                    >
                    <td
                        class="p-2 text-right"
                        class:red-text={getPostTaxProfitValue(r.buyPrice, r.sellPrice) !== null &&
                            getPostTaxProfitValue(r.buyPrice, r.sellPrice)! < 0}
                        class:green-text={getPostTaxProfitValue(r.buyPrice, r.sellPrice) !== null &&
                            getPostTaxProfitValue(r.buyPrice, r.sellPrice)! >= 0}
                        >{formatInt(calculatePostTaxProfit(r.buyPrice, r.sellPrice))}</td
                    >
                    <td class="p-2 text-right">
                        {#if r.dailyVolume !== null}
                            {formatInt(r.dailyVolume)}
                        {:else}
                            <span title="No volume data available for this item" class="cursor-help text-red-500"
                                >0</span
                            >
                        {/if}
                    </td>
                </tr>
            {/each}
        {/if}
    </tbody>
</table>

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
