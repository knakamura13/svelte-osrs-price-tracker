<script lang="ts">
    import { slide } from 'svelte/transition';

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
        dailyVolume: boolean;
        dailyLow: boolean;
        dailyHigh: boolean;
        averageBuy: boolean;
        averageSell: boolean;
        potentialProfit: boolean;
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
        dailyVolume: true,
        dailyLow: true,
        dailyHigh: true,
        averageBuy: true,
        averageSell: true,
        potentialProfit: true
    };

    export let onToggle: (() => void) | undefined;
    export let onChange: ((key: keyof typeof columnVisibility, checked: boolean) => void) | undefined;
    export let onReset: (() => void) | undefined;
</script>

<div class="mb-4">
    <div class="bg-gray-100 dark:bg-gray-800 rounded-t-lg border border-gray-300 dark:border-gray-600" class:rounded-lg={!expanded}>
        <div class="flex items-center justify-between p-3">
            <button
                class="accordion-trigger text-left flex-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                on:click={() => onToggle && onToggle()}
            >
                <span class="font-medium">Toggle columns</span>
            </button>
            <div class="flex items-center gap-2">
                <button
                    class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    on:click={() => onReset && onReset()}
                    title="Reset all columns to visible"
                >
                    Reset
                </button>
                <button
                    class="transform transition-transform {expanded ? 'rotate-180' : ''} cursor-pointer bg-transparent border-none p-0 text-inherit"
                    on:click={() => onToggle && onToggle()}
                    aria-label="Toggle columns panel"
                >▼</button>
            </div>
        </div>
    </div>

    {#if expanded}
        <div
            transition:slide={{ duration: 200 }}
            class="accordion-content p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg border border-t-0 border-gray-300 dark:border-gray-600"
        >
            <div class="flex flex-row flex-wrap gap-6">
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.name}
                        on:change={(e) => onChange && onChange('name', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Name</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.buyLimit}
                        on:change={(e) =>
                            onChange && onChange('buyLimit', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Buy limit</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.buyPrice}
                        on:change={(e) =>
                            onChange && onChange('buyPrice', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Insta-buy price</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.buyTime}
                        on:change={(e) =>
                            onChange && onChange('buyTime', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Last buy</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.sellPrice}
                        on:change={(e) =>
                            onChange && onChange('sellPrice', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Insta-sell price</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.sellTime}
                        on:change={(e) =>
                            onChange && onChange('sellTime', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Last sell</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.breakEvenPrice}
                        on:change={(e) =>
                            onChange && onChange('breakEvenPrice', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Break-even price</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.margin}
                        on:change={(e) => onChange && onChange('margin', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Margin</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.postTaxProfit}
                        on:change={(e) =>
                            onChange && onChange('postTaxProfit', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Post-tax profit</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.dailyVolume}
                        on:change={(e) =>
                            onChange && onChange('dailyVolume', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Daily volume</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.dailyLow}
                        on:change={(e) =>
                            onChange && onChange('dailyLow', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Daily low</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.dailyHigh}
                        on:change={(e) =>
                            onChange && onChange('dailyHigh', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Daily high</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.averageBuy}
                        on:change={(e) =>
                            onChange && onChange('averageBuy', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Avg buy</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.averageSell}
                        on:change={(e) =>
                            onChange && onChange('averageSell', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Avg sell</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={columnVisibility.potentialProfit}
                        on:change={(e) =>
                            onChange && onChange('potentialProfit', (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span class="text-sm">Potential profit</span>
                </label>
            </div>
        </div>
    {/if}
</div>
