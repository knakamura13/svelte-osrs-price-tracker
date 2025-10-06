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

    // Helper functions for rendering cell content
    const renderCellContent = (r: PriceRow, column: any) => {
        const { key, renderer } = column;

        if (renderer === 'name') {
            return renderNameCell(r);
        }

        if (renderer === 'simple') {
            return renderSimpleCell(r, key);
        }

        if (renderer === 'price') {
            return renderPriceCell(r, key);
        }

        if (renderer === 'time') {
            return renderTimeCell(r, key);
        }

        if (renderer.startsWith('complex.')) {
            const complexType = renderer.split('.')[1];
            return renderComplexCell(r, complexType);
        }

        return '—';
    };

    const renderNameCell = (r: PriceRow) => {
        return {
            content: `
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
            `,
            raw: true
        };
    };

    const renderSimpleCell = (r: PriceRow, key: string) => {
        const value = r[key as keyof PriceRow];
        if (key === 'buyLimit' && value === null) {
            return { content: '∞', title: 'This item has no buy limit' };
        }
        return { content: value, title: value ? null : `No ${key} data available for this item` };
    };

    const renderPriceCell = (r: PriceRow, key: string) => {
        const value = r[key as keyof PriceRow] as number | null;
        if (value == null) {
            return { content: '—', title: `No ${key} data available for this item` };
        }
        return { content: formatPrice(value, decimalView, decimalPlaces) };
    };

    const renderTimeCell = (r: PriceRow, key: string) => {
        const value = r[key as keyof PriceRow] as number | null;
        if (value) {
            return { content: secondsAgoFromUnix(value) };
        }
        return { content: '—', title: `No ${key} data available for this item` };
    };

    const renderComplexCell = (r: PriceRow, type: string) => {
        switch (type) {
            case 'breakEvenPrice':
                const breakEvenPrice = calculateBreakEvenPrice(r.sellPrice, r.id);
                if (breakEvenPrice == null) {
                    return { content: '—', title: 'No break-even price data available for this item' };
                }
                if (breakEvenPrice <= 0) {
                    return {
                        content: 'ERROR',
                        title: 'Unexpected negative break-even price - please report this bug',
                        class: 'text-red-500'
                    };
                }
                return { content: formatPrice(breakEvenPrice, decimalView, decimalPlaces) };

            case 'postTaxProfit':
                const profit = calculatePostTaxProfit(r.buyPrice, r.sellPrice, r.id);
                if (profit == null) {
                    return { content: '—', title: 'No post-tax profit data available for this item' };
                }
                return { content: formatPrice(profit, decimalView, decimalPlaces) };

            case 'potentialProfit':
                const potentialProfit = r.potentialProfit;
                if (potentialProfit == null) {
                    return { content: '—', title: 'No potential profit data available for this item' };
                }
                return { content: formatPrice(potentialProfit, decimalView, decimalPlaces) };

            case 'dailyVolume':
                const volume = r.dailyVolume;
                if (volume !== null && volume !== undefined && volume > 0) {
                    return { content: formatPrice(volume, decimalView, decimalPlaces) };
                }
                return { content: '—', title: 'No volume data available for this item', class: 'red-text' };

            default:
                return { content: '—' };
        }
    };

    const getConditionalClass = (r: PriceRow, column: any) => {
        if (!column.conditionalClass) return null;
        return column.conditionalClass(r);
    };

    // Column configuration for tbody content
    const tbodyColumnConfig = [
        {
            key: 'name',
            renderer: 'name',
            class: 'p-2',
            conditionalClass: null
        },
        {
            key: 'buyLimit',
            renderer: 'simple',
            class: 'p-2 text-right',
            conditionalClass: null
        },
        {
            key: 'buyPrice',
            renderer: 'price',
            class: 'p-2 text-right',
            conditionalClass: null,
            rendererOptions: { fallbackText: 'No insta-buy price data available for this item' }
        },
        {
            key: 'buyTime',
            renderer: 'time',
            class: 'p-2 text-right opacity-70',
            conditionalClass: null
        },
        {
            key: 'sellPrice',
            renderer: 'price',
            class: 'p-2 text-right',
            conditionalClass: null,
            rendererOptions: { fallbackText: 'No insta-sell price data available for this item' }
        },
        {
            key: 'sellTime',
            renderer: 'time',
            class: 'p-2 text-right opacity-70',
            conditionalClass: null
        },
        {
            key: 'margin',
            renderer: 'price',
            class: 'p-2 text-right',
            conditionalClass: (r: PriceRow) => {
                const margin = r.margin;
                if (margin !== null && margin < 0) return 'red-text';
                if (margin !== null && margin >= 0) return 'green-text';
                return null;
            },
            rendererOptions: { fallbackText: 'No margin data available for this item' }
        },
        {
            key: 'breakEvenPrice',
            renderer: 'complex.breakEvenPrice',
            class: 'p-2 text-right',
            conditionalClass: null
        },
        {
            key: 'postTaxProfit',
            renderer: 'complex.postTaxProfit',
            class: 'p-2 text-right',
            conditionalClass: (r: PriceRow) => {
                const profit = getPostTaxProfitValue(r.buyPrice, r.sellPrice, r.id);
                if (profit !== null && profit < 0) return 'red-text';
                if (profit !== null && profit >= 0) return 'green-text';
                return null;
            },
            rendererOptions: { fallbackText: 'No post-tax profit data available for this item' }
        },
        {
            key: 'potentialProfit',
            renderer: 'complex.potentialProfit',
            class: 'p-2 text-right',
            conditionalClass: (r: PriceRow) => {
                const profit = r.potentialProfit;
                if (profit !== null && profit < 0) return 'red-text';
                if (profit !== null && profit >= 0) return 'green-text';
                return null;
            },
            rendererOptions: { fallbackText: 'No potential profit data available for this item' }
        },
        {
            key: 'dailyVolume',
            renderer: 'complex.dailyVolume',
            class: 'p-2 text-right',
            conditionalClass: null
        },
        {
            key: 'dailyLow',
            renderer: 'price',
            class: 'p-2 text-right',
            conditionalClass: null,
            rendererOptions: { fallbackText: 'No daily low data available for this item' }
        },
        {
            key: 'dailyHigh',
            renderer: 'price',
            class: 'p-2 text-right',
            conditionalClass: null,
            rendererOptions: { fallbackText: 'No daily high data available for this item' }
        },
        {
            key: 'averageBuy',
            renderer: 'price',
            class: 'p-2 text-right',
            conditionalClass: null,
            rendererOptions: { fallbackText: 'No average buy data available for this item' }
        },
        {
            key: 'averageSell',
            renderer: 'price',
            class: 'p-2 text-right',
            conditionalClass: null,
            rendererOptions: { fallbackText: 'No average sell data available for this item' }
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
                                class="inline-flex items-center justify-between gap-1 {column.align === 'left'
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
                                {@const cellResult = renderCellContent(r, column)}
                                {@const conditionalClass = getConditionalClass(r, column)}
                                <td class="{column.class} {conditionalClass || ''}">
                                    {#if cellResult.raw}
                                        {@html cellResult.content}
                                    {:else if cellResult.title}
                                        <span title={cellResult.title} class="cursor-help">{cellResult.content}</span>
                                    {:else if cellResult.class}
                                        <span class="cursor-help {cellResult.class}" title={cellResult.title}
                                            >{cellResult.content}</span
                                        >
                                    {:else}
                                        {cellResult.content}
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
