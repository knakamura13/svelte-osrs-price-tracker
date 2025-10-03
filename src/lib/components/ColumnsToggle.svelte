<script lang="ts">
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
        dailyVolume: true
    };

    export let onToggle: (() => void) | undefined;
    export let onChange: ((key: keyof typeof columnVisibility, checked: boolean) => void) | undefined;
</script>

<div class="mb-4">
    <button
        class="accordion-trigger w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg border border-gray-300 dark:border-gray-600 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        class:rounded-b-lg={!expanded}
        on:click={() => onToggle && onToggle()}
    >
        <span class="font-medium">Toggle columns</span>
        <span class="transform transition-transform {expanded ? 'rotate-180' : ''}">▼</span>
    </button>

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
                    <span class="text-sm">Buy price</span>
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
                    <span class="text-sm">Sell price</span>
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
            </div>
        </div>
    {/if}
</div>
