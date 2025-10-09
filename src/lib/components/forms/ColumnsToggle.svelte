<script lang="ts">
    import { slide } from 'svelte/transition';
    import { ChevronDown, RefreshCw } from 'lucide-svelte';
    import ColumnToggle from './ColumnToggle.svelte';

    export let expanded: boolean = false;
    export let columnVisibility: {
        name: boolean;
        buyLimit: boolean;
        buyPrice: boolean;
        buyTime: boolean;
        sellPrice: boolean;
        sellTime: boolean;
        breakEvenPrice: boolean;
        margin: boolean;
        postTaxProfit: boolean;
        postTaxProfitAvg: boolean;
        dailyVolume: boolean;
        dailyLow: boolean;
        dailyHigh: boolean;
        averageBuy: boolean;
        averageSell: boolean;
        potentialProfit: boolean;
        potentialProfitAvg: boolean;
    } = {
        name: true,
        buyLimit: true,
        buyPrice: true,
        buyTime: true,
        sellPrice: true,
        sellTime: true,
        breakEvenPrice: true,
        margin: true,
        postTaxProfit: true,
        postTaxProfitAvg: true,
        dailyVolume: true,
        dailyLow: true,
        dailyHigh: true,
        averageBuy: true,
        averageSell: true,
        potentialProfit: true,
        potentialProfitAvg: true
    };

    export let onToggle: (() => void) | undefined;
    export let onChange: ((key: keyof typeof columnVisibility, checked: boolean) => void) | undefined;
    export let onReset: (() => void) | undefined;

    // Column configuration organized by groups
    const columnGroups = [
        {
            title: 'Item Info',
            columns: [
                { key: 'name', label: 'Name' },
                { key: 'buyLimit', label: 'Buy limit' }
            ]
        },
        {
            title: 'Current Trading',
            columns: [
                { key: 'buyPrice', label: 'Insta-buy price' },
                { key: 'sellPrice', label: 'Insta-sell price' }
            ]
        },
        {
            title: 'Profit Analysis',
            columns: [
                { key: 'margin', label: 'Margin' },
                { key: 'breakEvenPrice', label: 'Break-even price' },
                { key: 'postTaxProfit', label: 'Post-tax profit' },
                { key: 'postTaxProfitAvg', label: 'Post-tax profit (avg)' },
                { key: 'potentialProfit', label: 'Potential profit' },
                { key: 'potentialProfitAvg', label: 'Potential profit (avg)' }
            ]
        },
        {
            title: 'Historical Data',
            columns: [
                { key: 'dailyVolume', label: 'Daily volume' },
                { key: 'dailyLow', label: 'Daily low' },
                { key: 'dailyHigh', label: 'Daily high' },
                { key: 'averageBuy', label: 'Avg buy' },
                { key: 'averageSell', label: 'Avg sell' }
            ]
        },
        {
            title: 'Time Filters',
            columns: [
                { key: 'buyTime', label: 'Last buy' },
                { key: 'sellTime', label: 'Last sell' }
            ]
        }
    ];

    function handleColumnChange(key: string, checked: boolean) {
        if (onChange) {
            onChange(key as keyof typeof columnVisibility, checked);
        }
    }
</script>

<div class="mb-4">
    <button
        class="accordion-trigger w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg border border-gray-300 dark:border-gray-600 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        class:rounded-b-lg={!expanded}
        on:click={() => onToggle && onToggle()}
    >
        <span class="font-medium">Toggle columns</span>
        <ChevronDown class="w-4 h-4 transform transition-transform {expanded ? 'rotate-180' : ''}" />
    </button>

    {#if expanded}
        <div
            transition:slide={{ duration: 200 }}
            class="accordion-content p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg border border-t-0 border-gray-300 dark:border-gray-600"
        >
            <div class="space-y-4">
                {#each columnGroups as group}
                    <div class="space-y-2">
                        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">{group.title}</h4>
                        <div class="flex flex-row flex-wrap gap-4 ml-2">
                            {#each group.columns as column}
                                <ColumnToggle
                                    columnKey={column.key}
                                    label={column.label}
                                    checked={columnVisibility[column.key as keyof typeof columnVisibility]}
                                    onChange={handleColumnChange}
                                />
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>

            <div class="mt-4 flex justify-end">
                <button
                    class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors flex items-center gap-2"
                    on:click={() => onReset && onReset()}
                    title="Reset all columns to visible"
                >
                    <RefreshCw class="w-4 h-4" />
                    Reset columns
                </button>
            </div>
        </div>
    {/if}
</div>
