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

    // Column configuration for table headers
    const columnConfig = [
        {
            key: 'name',
            label: 'Name',
            title: 'The name of the item',
            align: 'left',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'buyLimit',
            label: 'Buy limit',
            title: 'The maximum number of items you can buy in 4 hours',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'buyPrice',
            label: 'Insta-buy price',
            title: 'The current insta-buy price for this item from the Grand Exchange',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'buyTime',
            label: 'Last buy',
            title: 'When the last buy transaction occurred',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'sellPrice',
            label: 'Insta-sell price',
            title: 'The current insta-sell price for this item on the Grand Exchange',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'sellTime',
            label: 'Last sell',
            title: 'When the last sell transaction occurred',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'margin',
            label: 'Margin',
            title: 'The profit margin (sell price - buy price)',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'breakEvenPrice',
            label: 'Break-even price',
            title: 'The minimum sell price needed to recover your cost after GE tax (2%, capped at 5M gp, no tax below 50 gp).',
            align: 'right',
            sortable: true,
            hasHelpIcon: true
        },
        {
            key: 'postTaxProfit',
            label: 'Post-tax profit',
            title: "Your profit if you insta-buy at 'Insta-sell price' and insta-sell at 'Insta-buy price', after GE tax (2% rounded down, capped at 5M gp).",
            align: 'right',
            sortable: true,
            hasHelpIcon: true
        },
        {
            key: 'potentialProfit',
            label: 'Potential profit',
            title: "Your total profit if you buy at 'Insta-sell price' and sell at 'Insta-buy price' for the full buy limit, after GE tax (2% rounded down, capped at 5M gp).",
            align: 'right',
            sortable: true,
            hasHelpIcon: true
        },
        {
            key: 'dailyVolume',
            label: 'Daily volume',
            title: 'The number of items traded in the last 24 hours.',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'dailyLow',
            label: 'Daily low',
            title: 'The lowest price the item was traded for in the past 24 hours.',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'dailyHigh',
            label: 'Daily high',
            title: 'The highest price the item was traded for in the past 24 hours.',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'averageBuy',
            label: 'Avg buy',
            title: 'The mean of all insta-buy price values in the past 24 hours.',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        },
        {
            key: 'averageSell',
            label: 'Avg sell',
            title: 'The mean of all insta-sell price values in the past 24 hours.',
            align: 'right',
            sortable: true,
            hasHelpIcon: false
        }
    ];

    // Column rendering configuration for tbody
    type CellData =
        | {
              content: string;
              title?: string;
              class?: string;
          }
        | {
              content: string;
              isSpecial: true;
              link: string;
              wikiUrl?: string;
              examine?: string;
          };

    const tbodyColumnConfig = [
        {
            key: 'name',
            render: (row: PriceRow) => ({
                content: row.name,
                isSpecial: true, // Special handling needed for name column
                link: `/item/${row.id}`,
                wikiUrl: row.wikiUrl,
                examine: row.examine
            })
        },
        {
            key: 'buyLimit',
            render: (row: PriceRow) => ({
                content: row.buyLimit !== null ? row.buyLimit.toString() : '∞',
                title: row.buyLimit !== null ? undefined : 'This item has no buy limit',
                class: row.buyLimit === null ? 'cursor-help' : undefined
            })
        },
        {
            key: 'buyPrice',
            render: (row: PriceRow) => ({
                content: row.buyPrice == null ? '—' : formatPrice(row.buyPrice, decimalView, decimalPlaces),
                title: row.buyPrice == null ? 'No insta-buy price data available for this item' : undefined,
                class: row.buyPrice == null ? 'cursor-help' : undefined
            })
        },
        {
            key: 'buyTime',
            render: (row: PriceRow) => ({
                content: row.buyTime ? secondsAgoFromUnix(row.buyTime) : '—',
                class: 'opacity-70'
            })
        },
        {
            key: 'sellPrice',
            render: (row: PriceRow) => ({
                content: row.sellPrice == null ? '—' : formatPrice(row.sellPrice, decimalView, decimalPlaces),
                title: row.sellPrice == null ? 'No insta-sell price data available for this item' : undefined,
                class: row.sellPrice == null ? 'cursor-help' : undefined
            })
        },
        {
            key: 'sellTime',
            render: (row: PriceRow) => ({
                content: row.sellTime ? secondsAgoFromUnix(row.sellTime) : '—',
                class: 'opacity-70'
            })
        },
        {
            key: 'margin',
            render: (row: PriceRow) => ({
                content: row.margin == null ? '—' : formatPrice(row.margin, decimalView, decimalPlaces),
                title: row.margin == null ? 'No margin data available for this item' : undefined,
                class: row.margin == null ? 'cursor-help' : row.margin < 0 ? 'red-text' : 'green-text'
            })
        },
        {
            key: 'breakEvenPrice',
            render: (row: PriceRow) => {
                const breakEvenPrice = calculateBreakEvenPrice(row.sellPrice, row.id);
                if (breakEvenPrice == null) {
                    return {
                        content: '—',
                        title: 'No break-even price data available for this item',
                        class: 'cursor-help'
                    };
                }
                if (breakEvenPrice <= 0) {
                    return {
                        content: 'ERROR',
                        title: 'Unexpected negative break-even price - please report this bug',
                        class: 'cursor-help text-red-500'
                    };
                }
                return {
                    content: formatPrice(breakEvenPrice, decimalView, decimalPlaces)
                };
            }
        },
        {
            key: 'postTaxProfit',
            render: (row: PriceRow) => {
                const profitValue = getPostTaxProfitValue(row.buyPrice, row.sellPrice, row.id);
                if (profitValue == null) {
                    return {
                        content: '—',
                        title: 'No post-tax profit data available for this item',
                        class: 'cursor-help'
                    };
                }
                return {
                    content: formatPrice(profitValue, decimalView, decimalPlaces),
                    class: profitValue < 0 ? 'red-text' : 'green-text'
                };
            }
        },
        {
            key: 'potentialProfit',
            render: (row: PriceRow) => ({
                content:
                    row.potentialProfit == null ? '—' : formatPrice(row.potentialProfit, decimalView, decimalPlaces),
                title: row.potentialProfit == null ? 'No potential profit data available for this item' : undefined,
                class: row.potentialProfit == null ? 'cursor-help' : row.potentialProfit < 0 ? 'red-text' : 'green-text'
            })
        },
        {
            key: 'dailyVolume',
            render: (row: PriceRow) => {
                if (row.dailyVolume !== null && row.dailyVolume !== undefined && row.dailyVolume > 0) {
                    return { content: formatPrice(row.dailyVolume, decimalView, decimalPlaces) };
                }
                return {
                    content: '—',
                    title: 'No volume data available for this item',
                    class: 'cursor-help red-text'
                };
            }
        },
        {
            key: 'dailyLow',
            render: (row: PriceRow) => ({
                content:
                    row.dailyLow !== null && row.dailyLow !== undefined
                        ? formatPrice(row.dailyLow, decimalView, decimalPlaces)
                        : '—',
                title: !(row.dailyLow !== null && row.dailyLow !== undefined)
                    ? 'No daily low data available for this item'
                    : undefined,
                class: !(row.dailyLow !== null && row.dailyLow !== undefined) ? 'cursor-help' : undefined
            })
        },
        {
            key: 'dailyHigh',
            render: (row: PriceRow) => ({
                content:
                    row.dailyHigh !== null && row.dailyHigh !== undefined
                        ? formatPrice(row.dailyHigh, decimalView, decimalPlaces)
                        : '—',
                title: !(row.dailyHigh !== null && row.dailyHigh !== undefined)
                    ? 'No daily high data available for this item'
                    : undefined,
                class: !(row.dailyHigh !== null && row.dailyHigh !== undefined) ? 'cursor-help' : undefined
            })
        },
        {
            key: 'averageBuy',
            render: (row: PriceRow) => ({
                content:
                    row.averageBuy !== null && row.averageBuy !== undefined
                        ? formatPrice(row.averageBuy, decimalView, decimalPlaces)
                        : '—',
                title: !(row.averageBuy !== null && row.averageBuy !== undefined)
                    ? 'No average buy data available for this item'
                    : undefined,
                class: !(row.averageBuy !== null && row.averageBuy !== undefined) ? 'cursor-help' : undefined
            })
        },
        {
            key: 'averageSell',
            render: (row: PriceRow) => ({
                content:
                    row.averageSell !== null && row.averageSell !== undefined
                        ? formatPrice(row.averageSell, decimalView, decimalPlaces)
                        : '—',
                title: !(row.averageSell !== null && row.averageSell !== undefined)
                    ? 'No average sell data available for this item'
                    : undefined,
                class: !(row.averageSell !== null && row.averageSell !== undefined) ? 'cursor-help' : undefined
            })
        }
    ];
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
                {#each columnConfig as column}
                    {#if columnVisibility[column.key]}
                        <th
                            class="p-2 select-none hover:text-white transition-colors whitespace-nowrap {column.align ===
                            'left'
                                ? 'text-left'
                                : 'text-right'} {sortable ? 'cursor-pointer' : ''}"
                            title={column.title}
                            on:click={() => sortable && sortBy && sortBy(column.key)}
                        >
                            <div
                                class="inline-flex items-center gap-1 {column.align === 'left'
                                    ? ''
                                    : 'justify-end w-full'}"
                            >
                                {column.label}
                                {#if column.hasHelpIcon}
                                    <span
                                        class="mr-1 text-xs opacity-70 cursor-help inline-block align-top relative"
                                        style="font-size: 0.75em; vertical-align: super; top: -0.2em;"
                                        aria-label="{column.label} tooltip">?</span
                                    >
                                {/if}
                                <span class="opacity-60 select-none"
                                    >{#if sortIcon(column.key)}<svelte:component
                                            this={sortIcon(column.key)}
                                            class="w-3 h-3"
                                        />{/if}</span
                                >
                            </div>
                        </th>
                    {/if}
                {/each}
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
                        {#each tbodyColumnConfig as column}
                            {#if columnVisibility[column.key]}
                                {@const cellData = column.render(r)}
                                <td class="p-2 text-right">
                                    {#if 'isSpecial' in cellData}
                                        <!-- Special handling for name column -->
                                        <div class="flex gap-2 items-center">
                                            <a
                                                href={cellData.link}
                                                class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                title={cellData.examine ?? cellData.content}
                                            >
                                                {cellData.content}
                                            </a>
                                            {#if cellData.wikiUrl}
                                                <a
                                                    href={cellData.wikiUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex items-center"
                                                    title="View on OSRS Wiki"
                                                >
                                                    <BookOpen class="w-3 h-3" />
                                                </a>
                                            {/if}
                                        </div>
                                    {:else}
                                        <span
                                            class={cellData.class || ''}
                                            title={'title' in cellData ? cellData.title : undefined}
                                        >
                                            {cellData.content}
                                        </span>
                                    {/if}
                                </td>
                            {/if}
                        {/each}
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
