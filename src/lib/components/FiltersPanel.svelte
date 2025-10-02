<script lang="ts">
    import type { Filters, FilterStats } from '$lib/types';
    import { isPositive } from '$lib/utils/filters';
    import { secondsFromParts, partsFromSeconds } from '$lib/utils/duration';

    export let expanded: boolean = false;
    export let filters: Filters;
    export let filtersNormalized: Filters;
    export let filterStats: FilterStats;
    export let activeFiltersCount: number = 0;
    export let onToggle: (() => void) | undefined;
    export let onClear: (() => void) | undefined;
    export let onNumericChange: ((key: keyof Filters, bound: 'min' | 'max', value: string) => void) | undefined;

    type NumericFilterKey = Exclude<keyof Filters, 'buyTime' | 'sellTime'>;
    const numericFilterDefs: Array<{ key: NumericFilterKey; label: string }> = [
        { key: 'buyLimit', label: 'Buy limit' },
        { key: 'buyPrice', label: 'Buy price' },
        { key: 'sellPrice', label: 'Sell price' },
        { key: 'margin', label: 'Margin' },
        { key: 'postTaxProfit', label: 'Post-tax profit' },
        { key: 'dailyVolume', label: 'Daily volume' }
    ];

    // local time parts state for buy/sell durations
    let buyMinDays = 0,
        buyMinHours = 0,
        buyMinMinutes = 0,
        buyMinSeconds = 0;
    let buyMaxDays = 0,
        buyMaxHours = 0,
        buyMaxMinutes = 0,
        buyMaxSeconds = 0;
    let sellMinDays = 0,
        sellMinHours = 0,
        sellMinMinutes = 0,
        sellMinSeconds = 0;
    let sellMaxDays = 0,
        sellMaxHours = 0,
        sellMaxMinutes = 0,
        sellMaxSeconds = 0;

    $: {
        const bm = partsFromSeconds(filters.buyTime.min);
        buyMinDays = bm.days;
        buyMinHours = bm.hours;
        buyMinMinutes = bm.minutes;
        buyMinSeconds = bm.seconds;
        const bx = partsFromSeconds(filters.buyTime.max);
        buyMaxDays = bx.days;
        buyMaxHours = bx.hours;
        buyMaxMinutes = bx.minutes;
        buyMaxSeconds = bx.seconds;
        const sm = partsFromSeconds(filters.sellTime.min);
        sellMinDays = sm.days;
        sellMinHours = sm.hours;
        sellMinMinutes = sm.minutes;
        sellMinSeconds = sm.seconds;
        const sx = partsFromSeconds(filters.sellTime.max);
        sellMaxDays = sx.days;
        sellMaxHours = sx.hours;
        sellMaxMinutes = sx.minutes;
        sellMaxSeconds = sx.seconds;
    }

    // Emit updates for duration fields to the parent by mutating filters directly via bindings
    $: filters.buyTime.min = (() => {
        const s = secondsFromParts(buyMinDays, buyMinHours, buyMinMinutes, buyMinSeconds);
        return s > 0 ? s : null;
    })();
    $: filters.buyTime.max = (() => {
        const s = secondsFromParts(buyMaxDays, buyMaxHours, buyMaxMinutes, buyMaxSeconds);
        return s > 0 ? s : null;
    })();
    $: filters.sellTime.min = (() => {
        const s = secondsFromParts(sellMinDays, sellMinHours, sellMinMinutes, sellMinSeconds);
        return s > 0 ? s : null;
    })();
    $: filters.sellTime.max = (() => {
        const s = secondsFromParts(sellMaxDays, sellMaxHours, sellMaxMinutes, sellMaxSeconds);
        return s > 0 ? s : null;
    })();
</script>

<div class="mb-4">
    <button
        class="accordion-trigger w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg border border-gray-300 dark:border-gray-600 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        class:rounded-b-lg={!expanded}
        on:click={() => onToggle && onToggle()}
    >
        <span class="font-medium">
            Apply filters
            <span
                class="font-normal"
                class:opacity-50={activeFiltersCount === 0}
                class:text-yellow-600={activeFiltersCount >= 1}
                class:dark:text-yellow-400={activeFiltersCount >= 1}
            >
                ({`${activeFiltersCount} ${activeFiltersCount === 1 ? 'filter' : 'filters'} active`})
            </span>
        </span>
        <span class="transform transition-transform {expanded ? 'rotate-180' : ''}">▼</span>
    </button>

    {#if expanded}
        <div
            class="accordion-content p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg border border-t-0 border-gray-300 dark:border-gray-600"
        >
            <h3 class="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Filters:</h3>
            <div class="grid grid-cols-1 gap-4">
                <!-- Numeric range filters -->
                {#each numericFilterDefs as f}
                    <div class="filter-group">
                        <div
                            class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                            class:text-yellow-600={isPositive(filtersNormalized[f.key].min) ||
                                isPositive(filtersNormalized[f.key].max)}
                            class:dark:text-yellow-400={isPositive(filtersNormalized[f.key].min) ||
                                isPositive(filtersNormalized[f.key].max)}
                            id={`${f.key}-label`}
                        >
                            {f.label}
                        </div>
                        <div class="flex gap-2">
                            <input
                                type="number"
                                placeholder={filterStats[f.key as keyof FilterStats].min !== null
                                    ? `Min (${filterStats[f.key as keyof FilterStats].min})`
                                    : 'Min'}
                                aria-labelledby={`${f.key}-label`}
                                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={filters[f.key].min}
                                on:change={(e) =>
                                    onNumericChange &&
                                    onNumericChange(f.key as any, 'min', (e.currentTarget as HTMLInputElement).value)}
                            />
                            <input
                                type="number"
                                placeholder={filterStats[f.key as keyof FilterStats].max !== null
                                    ? `Max (${filterStats[f.key as keyof FilterStats].max})`
                                    : 'Max'}
                                aria-labelledby={`${f.key}-label`}
                                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={filters[f.key].max}
                                on:change={(e) =>
                                    onNumericChange &&
                                    onNumericChange(f.key as any, 'max', (e.currentTarget as HTMLInputElement).value)}
                            />
                        </div>
                    </div>
                {/each}

                <!-- Duration filters: Last buy -->
                <div class="filter-group">
                    <div
                        class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                        class:text-yellow-600={isPositive(filtersNormalized.buyTime.min) ||
                            isPositive(filtersNormalized.buyTime.max)}
                        class:dark:text-yellow-400={isPositive(filtersNormalized.buyTime.min) ||
                            isPositive(filtersNormalized.buyTime.max)}
                        id="buy-time-label"
                    >
                        Last buy
                    </div>
                    <div class="flex flex-col gap-2" aria-labelledby="buy-time-label">
                        <div class="flex items-center gap-1">
                            <span class="text-xs opacity-70 w-10">Min</span>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                class="w-14 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={buyMinDays}
                            />
                            <span class="opacity-60">d:</span>
                            <input
                                type="number"
                                min="0"
                                max="23"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={buyMinHours}
                            />
                            <span class="opacity-60">h:</span>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={buyMinMinutes}
                            />
                            <span class="opacity-60">m:</span>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={buyMinSeconds}
                            />
                            <span class="opacity-60">s</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-xs opacity-70 w-10">Max</span>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                class="w-14 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={buyMaxDays}
                            />
                            <span class="opacity-60">d:</span>
                            <input
                                type="number"
                                min="0"
                                max="23"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={buyMaxHours}
                            />
                            <span class="opacity-60">h:</span>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={buyMaxMinutes}
                            />
                            <span class="opacity-60">m:</span>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={buyMaxSeconds}
                            />
                            <span class="opacity-60">s</span>
                        </div>
                    </div>
                </div>

                <!-- Duration filters: Last sell -->
                <div class="filter-group">
                    <div
                        class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                        class:text-yellow-600={isPositive(filtersNormalized.sellTime.min) ||
                            isPositive(filtersNormalized.sellTime.max)}
                        class:dark:text-yellow-400={isPositive(filtersNormalized.sellTime.min) ||
                            isPositive(filtersNormalized.sellTime.max)}
                        id="sell-time-label"
                    >
                        Last sell
                    </div>
                    <div class="flex flex-col gap-2" aria-labelledby="sell-time-label">
                        <div class="flex items-center gap-1">
                            <span class="text-xs opacity-70 w-10">Min</span>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                class="w-14 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={sellMinDays}
                            />
                            <span class="opacity-60">d:</span>
                            <input
                                type="number"
                                min="0"
                                max="23"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={sellMinHours}
                            />
                            <span class="opacity-60">h:</span>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={sellMinMinutes}
                            />
                            <span class="opacity-60">m:</span>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={sellMinSeconds}
                            />
                            <span class="opacity-60">s</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-xs opacity-70 w-10">Max</span>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                class="w-14 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={sellMaxDays}
                            />
                            <span class="opacity-60">d:</span>
                            <input
                                type="number"
                                min="0"
                                max="23"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={sellMaxHours}
                            />
                            <span class="opacity-60">h:</span>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={sellMaxMinutes}
                            />
                            <span class="opacity-60">m:</span>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="0"
                                class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                bind:value={sellMaxSeconds}
                            />
                            <span class="opacity-60">s</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4 flex justify-end">
                <button
                    class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:!cursor-default disabled:hover:!bg-red-600 disabled:focus:!bg-red-600 disabled:opacity-50"
                    disabled={activeFiltersCount === 0}
                    on:click={() => onClear && onClear()}
                >
                    🗑️ Clear filters
                </button>
            </div>
        </div>
    {/if}
</div>
