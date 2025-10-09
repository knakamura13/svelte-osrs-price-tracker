<script lang="ts">
    import { slide } from 'svelte/transition';
    import type { Filters, FilterStats } from '$lib/types';
    import { isPositive } from '$lib/utils/filters';
    import { secondsFromParts, partsFromSeconds } from '$lib/utils/duration';
    import { ChevronDown, Trash2 } from 'lucide-svelte';
    import DurationInput from '../forms/DurationInput.svelte';

    export let expanded: boolean = false;
    export let filters: Filters;
    export let filtersNormalized: Filters;
    export let filterStats: FilterStats;
    export let activeFiltersCount: number = 0;
    export let onToggle: (() => void) | undefined;
    export let onClear: (() => void) | undefined;
    export let onNumericChange: ((key: keyof Filters, bound: 'min' | 'max', value: string) => void) | undefined;
    export let onTimeChange:
        | ((key: 'buyTime' | 'sellTime', bound: 'min' | 'max', value: number | null) => void)
        | undefined;

    type FilterKey = keyof Filters;

    // OSRS integer limits
    const OSRS_MIN_INTEGER = -2147483647;
    const OSRS_MAX_INTEGER = 2147483647;

    // Define filter groups in logical table column order
    const filterGroups: Array<{
        title: string;
        filters: Array<{
            key: FilterKey;
            label: string;
            type: 'numeric' | 'time';
            min?: string | number;
            max?: string | number;
            step?: string | number;
        }>;
    }> = [
        {
            title: 'Item Info',
            filters: [{ key: 'buyLimit', label: 'Buy limit', type: 'numeric', min: '0', step: '1' }]
        },
        {
            title: 'Current Trading',
            filters: [
                { key: 'buyPrice', label: 'Insta-buy price', type: 'numeric', min: '0', step: '1' },
                { key: 'sellPrice', label: 'Insta-sell price', type: 'numeric', min: '0', step: '1' },
                { key: 'buyTime', label: 'Last buy', type: 'time' },
                { key: 'sellTime', label: 'Last sell', type: 'time' }
            ]
        },
        {
            title: 'Profit Analysis',
            filters: [
                {
                    key: 'margin',
                    label: 'Margin',
                    type: 'numeric',
                    min: OSRS_MIN_INTEGER,
                    max: OSRS_MAX_INTEGER,
                    step: '1'
                },
                { key: 'breakEvenPrice', label: 'Break-even price', type: 'numeric', min: '0', step: '1' },
                {
                    key: 'postTaxProfit',
                    label: 'Post-tax profit',
                    type: 'numeric',
                    min: OSRS_MIN_INTEGER,
                    max: OSRS_MAX_INTEGER,
                    step: '1'
                },
                {
                    key: 'postTaxProfitAvg',
                    label: 'Post-tax profit (avg)',
                    type: 'numeric',
                    min: OSRS_MIN_INTEGER,
                    max: OSRS_MAX_INTEGER,
                    step: '1'
                },
                {
                    key: 'potentialProfit',
                    label: 'Potential profit',
                    type: 'numeric',
                    min: OSRS_MIN_INTEGER,
                    max: OSRS_MAX_INTEGER,
                    step: '1'
                },
                {
                    key: 'potentialProfitAvg',
                    label: 'Potential profit (avg)',
                    type: 'numeric',
                    min: OSRS_MIN_INTEGER,
                    max: OSRS_MAX_INTEGER,
                    step: '1'
                }
            ]
        },
        {
            title: 'Historical Data',
            filters: [
                { key: 'dailyVolume', label: 'Daily volume', type: 'numeric', min: '0', step: '1' },
                { key: 'dailyLow', label: 'Daily low', type: 'numeric', min: '0', step: '1' },
                { key: 'dailyHigh', label: 'Daily high', type: 'numeric', min: '0', step: '1' },
                { key: 'averageBuy', label: 'Avg buy', type: 'numeric', min: '0', step: '1' },
                { key: 'averageSell', label: 'Avg sell', type: 'numeric', min: '0', step: '1' }
            ]
        }
    ];

    // Flatten for backward compatibility
    const allFilterDefs = filterGroups.flatMap((group) => group.filters);

    // Check if any filters are currently active (have values)
    $: hasActiveFilters = (() => {
        // Check numeric filters
        for (const group of filterGroups) {
            for (const filter of group.filters) {
                if (filter.type === 'numeric') {
                    const minVal = filters[filter.key].min;
                    const maxVal = filters[filter.key].max;

                    // Check if min has a non-empty value
                    if (minVal !== null && minVal !== undefined) {
                        const minStr = String(minVal).trim();
                        if (minStr !== '' && minStr !== '0') {
                            return true;
                        }
                    }

                    // Check if max has a non-empty value
                    if (maxVal !== null && maxVal !== undefined) {
                        const maxStr = String(maxVal).trim();
                        if (maxStr !== '' && maxStr !== '0') {
                            return true;
                        }
                    }
                } else if (filter.type === 'time') {
                    // Check time filters (buyTime/sellTime)
                    if (filters[filter.key].min ?? 0 > 0) {
                        return true;
                    }
                    if (filters[filter.key].max ?? 0 > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    })();

    // local time parts state for buy/sell durations
    let timeState = {
        buyTime: {
            min: { days: 0, hours: 0, minutes: 0, seconds: 0 },
            max: { days: 0, hours: 0, minutes: 0, seconds: 0 }
        },
        sellTime: {
            min: { days: 0, hours: 0, minutes: 0, seconds: 0 },
            max: { days: 0, hours: 0, minutes: 0, seconds: 0 }
        }
    };

    $: {
        // Update time state from filters
        const bm = partsFromSeconds(filters.buyTime.min);
        timeState.buyTime.min = { days: bm.days, hours: bm.hours, minutes: bm.minutes, seconds: bm.seconds };
        const bx = partsFromSeconds(filters.buyTime.max);
        timeState.buyTime.max = { days: bx.days, hours: bx.hours, minutes: bx.minutes, seconds: bx.seconds };
        const sm = partsFromSeconds(filters.sellTime.min);
        timeState.sellTime.min = { days: sm.days, hours: sm.hours, minutes: sm.minutes, seconds: sm.seconds };
        const sx = partsFromSeconds(filters.sellTime.max);
        timeState.sellTime.max = { days: sx.days, hours: sx.hours, minutes: sx.minutes, seconds: sx.seconds };
    }

    // Emit updates for duration fields via callback; avoid mutating parent props directly
    $: {
        const s = secondsFromParts(
            timeState.buyTime.min.days,
            timeState.buyTime.min.hours,
            timeState.buyTime.min.minutes,
            timeState.buyTime.min.seconds
        );
        const next = s > 0 ? s : null;
        if (onTimeChange && next !== filters.buyTime.min) onTimeChange('buyTime', 'min', next);
    }
    $: {
        const s = secondsFromParts(
            timeState.buyTime.max.days,
            timeState.buyTime.max.hours,
            timeState.buyTime.max.minutes,
            timeState.buyTime.max.seconds
        );
        const next = s > 0 ? s : null;
        if (onTimeChange && next !== filters.buyTime.max) onTimeChange('buyTime', 'max', next);
    }
    $: {
        const s = secondsFromParts(
            timeState.sellTime.min.days,
            timeState.sellTime.min.hours,
            timeState.sellTime.min.minutes,
            timeState.sellTime.min.seconds
        );
        const next = s > 0 ? s : null;
        if (onTimeChange && next !== filters.sellTime.min) onTimeChange('sellTime', 'min', next);
    }
    $: {
        const s = secondsFromParts(
            timeState.sellTime.max.days,
            timeState.sellTime.max.hours,
            timeState.sellTime.max.minutes,
            timeState.sellTime.max.seconds
        );
        const next = s > 0 ? s : null;
        if (onTimeChange && next !== filters.sellTime.max) onTimeChange('sellTime', 'max', next);
    }
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
        <ChevronDown class="w-4 h-4 transform transition-transform {expanded ? 'rotate-180' : ''}" />
    </button>

    {#if expanded}
        <div
            transition:slide={{ duration: 200 }}
            class="accordion-content p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg border border-t-0 border-gray-300 dark:border-gray-600"
        >
            <div class="space-y-6">
                <!-- Filter groups -->
                {#each filterGroups as group}
                    <div class="filter-group-section">
                        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{group.title}</h4>
                        <div class="space-y-4">
                            {#each group.filters as f}
                                {#if f.type !== 'time'}
                                    <div class="filter-item">
                                        <div
                                            class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                            class:text-yellow-600={f.type === 'numeric'
                                                ? isPositive(filtersNormalized[f.key].min) ||
                                                  isPositive(filtersNormalized[f.key].max)
                                                : isPositive(filters[f.key].min) || isPositive(filters[f.key].max)}
                                            class:dark:text-yellow-400={f.type === 'numeric'
                                                ? isPositive(filtersNormalized[f.key].min) ||
                                                  isPositive(filtersNormalized[f.key].max)
                                                : isPositive(filters[f.key].min) || isPositive(filters[f.key].max)}
                                            id={`${f.key}-label`}
                                        >
                                            {f.label}
                                        </div>

                                        {#if f.type === 'numeric'}
                                            <!-- Numeric range filter -->
                                            <div class="flex gap-2">
                                                <input
                                                    id={`${f.key}-min`}
                                                    name={`${f.key}-min`}
                                                    type="number"
                                                    placeholder={filterStats[f.key as keyof FilterStats].min !== null
                                                        ? `Min (${filterStats[f.key as keyof FilterStats].min})`
                                                        : 'Min'}
                                                    aria-labelledby={`${f.key}-label`}
                                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                                    bind:value={filters[f.key].min}
                                                    on:change={(e) =>
                                                        onNumericChange &&
                                                        onNumericChange(
                                                            f.key as any,
                                                            'min',
                                                            (e.currentTarget as HTMLInputElement).value
                                                        )}
                                                    min={f.min}
                                                    max={f.max}
                                                    step={f.step}
                                                />
                                                <input
                                                    id={`${f.key}-max`}
                                                    name={`${f.key}-max`}
                                                    type="number"
                                                    placeholder={filterStats[f.key as keyof FilterStats].max !== null
                                                        ? `Max (${filterStats[f.key as keyof FilterStats].max})`
                                                        : 'Max'}
                                                    aria-labelledby={`${f.key}-label`}
                                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                                    bind:value={filters[f.key].max}
                                                    on:change={(e) =>
                                                        onNumericChange &&
                                                        onNumericChange(
                                                            f.key as any,
                                                            'max',
                                                            (e.currentTarget as HTMLInputElement).value
                                                        )}
                                                    min={f.min}
                                                    max={f.max}
                                                    step={f.step}
                                                />
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    </div>
                {/each}

                <!-- Time-based filters (buyTime/sellTime) -->
                {#if filterGroups.some( (group) => group.filters.some((f) => f.key === 'buyTime' || f.key === 'sellTime') )}
                    <div class="filter-group-section">
                        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Time Filters</h4>
                        <div class="space-y-4">
                            {#each filterGroups as group}
                                {#each group.filters as f}
                                    {#if f.type === 'time'}
                                        <div class="filter-item">
                                            <div
                                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                                class:text-yellow-600={isPositive(filters[f.key].min) ||
                                                    isPositive(filters[f.key].max)}
                                                class:dark:text-yellow-400={isPositive(filters[f.key].min) ||
                                                    isPositive(filters[f.key].max)}
                                                id={`${f.key}-label`}
                                            >
                                                {f.label}
                                            </div>

                                            <!-- Duration filter using reusable component -->
                                            <DurationInput
                                                timeKey={f.key as 'buyTime' | 'sellTime'}
                                                bound="min"
                                                days={timeState[f.key as 'buyTime' | 'sellTime'].min.days}
                                                hours={timeState[f.key as 'buyTime' | 'sellTime'].min.hours}
                                                minutes={timeState[f.key as 'buyTime' | 'sellTime'].min.minutes}
                                                seconds={timeState[f.key as 'buyTime' | 'sellTime'].min.seconds}
                                                labelId={`${f.key}-label`}
                                                onInput={(days, hours, minutes, seconds) => {
                                                    timeState[f.key as 'buyTime' | 'sellTime'].min = {
                                                        days,
                                                        hours,
                                                        minutes,
                                                        seconds
                                                    };
                                                }}
                                            />

                                            <DurationInput
                                                timeKey={f.key as 'buyTime' | 'sellTime'}
                                                bound="max"
                                                days={timeState[f.key as 'buyTime' | 'sellTime'].max.days}
                                                hours={timeState[f.key as 'buyTime' | 'sellTime'].max.hours}
                                                minutes={timeState[f.key as 'buyTime' | 'sellTime'].max.minutes}
                                                seconds={timeState[f.key as 'buyTime' | 'sellTime'].max.seconds}
                                                labelId={`${f.key}-label`}
                                                onInput={(days, hours, minutes, seconds) => {
                                                    timeState[f.key as 'buyTime' | 'sellTime'].max = {
                                                        days,
                                                        hours,
                                                        minutes,
                                                        seconds
                                                    };
                                                }}
                                            />
                                        </div>
                                    {/if}
                                {/each}
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <div class="mt-4 flex justify-end">
                <button
                    class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:!cursor-default disabled:hover:!bg-red-600 disabled:focus:!bg-red-600 disabled:opacity-50"
                    disabled={!hasActiveFilters}
                    on:click={() => onClear && onClear()}
                >
                    <Trash2 class="w-4 h-4 mr-1 inline" /> Clear filters
                </button>
            </div>
        </div>
    {/if}
</div>
