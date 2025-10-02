<script lang="ts">
    import PriceTable from '$lib/components/PriceTable.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import type { PriceRow } from '$lib/types';

    type SortKey =
        | 'name'
        | 'buyLimit'
        | 'buyPrice'
        | 'sellPrice'
        | 'margin'
        | 'breakEvenPrice'
        | 'postTaxProfit'
        | 'dailyVolume'
        | 'buyTime'
        | 'sellTime';

    export let data: { rows: PriceRow[] };

    let search = '';
    let searchRaw = '';
    let sortKey: SortKey | null = 'name';
    let sortDir: 'asc' | 'desc' = 'desc';
    let lastSortKey: SortKey | null = 'name';
    let page = 1;
    let pageSize = 25;
    let auto = false;
    let refreshSec = 60;

    let allRows: PriceRow[] = data?.rows ?? [];
    let lastUpdated: number | null = null;
    let nowSec: number = Math.floor(Date.now() / 1000);
    let lastUpdatedLabel: string = '—';
    let errorMsg: string | null = null;
    let failCount = 0;
    let loading = false;

    // Types and helpers for filters
    type NumericFilter = { min: number | null; max: number | null };
    type Filters = {
        buyLimit: NumericFilter;
        buyPrice: NumericFilter;
        buyTime: NumericFilter;
        sellPrice: NumericFilter;
        sellTime: NumericFilter;
        breakEvenPrice: NumericFilter;
        margin: NumericFilter;
        postTaxProfit: NumericFilter;
        dailyVolume: NumericFilter;
    };

    function isFiniteNumber(n: number | null): n is number {
        return typeof n === 'number' && Number.isFinite(n);
    }

    function normalizeFilters(f: Filters): Filters {
        return {
            buyLimit: {
                min: isFiniteNumber(f.buyLimit.min) ? f.buyLimit.min : null,
                max: isFiniteNumber(f.buyLimit.max) ? f.buyLimit.max : null
            },
            buyPrice: {
                min: isFiniteNumber(f.buyPrice.min) ? f.buyPrice.min : null,
                max: isFiniteNumber(f.buyPrice.max) ? f.buyPrice.max : null
            },
            buyTime: {
                min: isFiniteNumber(f.buyTime.min) ? f.buyTime.min : null,
                max: isFiniteNumber(f.buyTime.max) ? f.buyTime.max : null
            },
            sellPrice: {
                min: isFiniteNumber(f.sellPrice.min) ? f.sellPrice.min : null,
                max: isFiniteNumber(f.sellPrice.max) ? f.sellPrice.max : null
            },
            sellTime: {
                min: isFiniteNumber(f.sellTime.min) ? f.sellTime.min : null,
                max: isFiniteNumber(f.sellTime.max) ? f.sellTime.max : null
            },
            breakEvenPrice: {
                min: isFiniteNumber(f.breakEvenPrice.min) ? f.breakEvenPrice.min : null,
                max: isFiniteNumber(f.breakEvenPrice.max) ? f.breakEvenPrice.max : null
            },
            margin: {
                min: isFiniteNumber(f.margin.min) ? f.margin.min : null,
                max: isFiniteNumber(f.margin.max) ? f.margin.max : null
            },
            postTaxProfit: {
                min: isFiniteNumber(f.postTaxProfit.min) ? f.postTaxProfit.min : null,
                max: isFiniteNumber(f.postTaxProfit.max) ? f.postTaxProfit.max : null
            },
            dailyVolume: {
                min: isFiniteNumber(f.dailyVolume.min) ? f.dailyVolume.min : null,
                max: isFiniteNumber(f.dailyVolume.max) ? f.dailyVolume.max : null
            }
        };
    }

    // Filter state
    let filtersExpanded = false;
    let filters: Filters = {
        buyLimit: { min: null as number | null, max: null as number | null },
        buyPrice: { min: null as number | null, max: null as number | null },
        buyTime: { min: null as number | null, max: null as number | null },
        sellPrice: { min: null as number | null, max: null as number | null },
        sellTime: { min: null as number | null, max: null as number | null },
        breakEvenPrice: { min: null as number | null, max: null as number | null },
        margin: { min: null as number | null, max: null as number | null },
        postTaxProfit: { min: null as number | null, max: null as number | null },
        dailyVolume: { min: null as number | null, max: null as number | null }
    };

    // Normalized filters (convert NaN/undefined to null) to drive reactivity
    let filtersNormalized: Filters;
    $: filtersNormalized = normalizeFilters(filters);

    // Whenever filters change, jump back to the first page for clarity
    $: {
        filtersNormalized;
        page = 1;
    }

    // Computed active filters count
    $: activeFiltersCount = Object.values(filtersNormalized).reduce((count, filter) => {
        return count + (isFiniteNumber(filter.min) ? 1 : 0) + (isFiniteNumber(filter.max) ? 1 : 0);
    }, 0);

    async function loadRows() {
        try {
            loading = true;
            errorMsg = null;
            const res = await fetch('/api/rows', { cache: 'no-store' });
            if (!res.ok) throw new Error(`Failed /api/rows: ${res.status}`);
            const json = await res.json();
            const rows = Array.isArray(json?.rows) ? (json.rows as PriceRow[]) : [];
            allRows = rows;
            lastUpdated = Date.now();
            failCount = 0;
            page = 1;
        } catch (err: any) {
            failCount = failCount + 1;
            errorMsg = err?.message ?? 'Failed to load prices';
            if (failCount >= 3 && auto) {
                auto = false;
            }
        } finally {
            loading = false;
        }
    }

    function filteredSorted(
        source: PriceRow[],
        qStr: string,
        key: SortKey | null,
        dirStr: 'asc' | 'desc',
        filterSet: Filters
    ): PriceRow[] {
        let rows = source;
        if (qStr.trim()) {
            const q = qStr.toLowerCase();
            rows = rows.filter((r) => r.name.toLowerCase().includes(q));
        }

        // Apply column filters
        rows = rows.filter((row) => {
            // Buy limit filter
            if (filterSet.buyLimit.min !== null && row.buyLimit !== null && row.buyLimit < filterSet.buyLimit.min)
                return false;
            if (filterSet.buyLimit.max !== null && row.buyLimit !== null && row.buyLimit > filterSet.buyLimit.max)
                return false;

            // Buy price filter
            if (filterSet.buyPrice.min !== null && row.buyPrice !== null && row.buyPrice < filterSet.buyPrice.min)
                return false;
            if (filterSet.buyPrice.max !== null && row.buyPrice !== null && row.buyPrice > filterSet.buyPrice.max)
                return false;

            // Buy time filter (timestamp in seconds)
            if (filterSet.buyTime.min !== null && row.buyTime !== null && row.buyTime < filterSet.buyTime.min)
                return false;
            if (filterSet.buyTime.max !== null && row.buyTime !== null && row.buyTime > filterSet.buyTime.max)
                return false;

            // Sell price filter
            if (filterSet.sellPrice.min !== null && row.sellPrice !== null && row.sellPrice < filterSet.sellPrice.min)
                return false;
            if (filterSet.sellPrice.max !== null && row.sellPrice !== null && row.sellPrice > filterSet.sellPrice.max)
                return false;

            // Sell time filter (timestamp in seconds)
            if (filterSet.sellTime.min !== null && row.sellTime !== null && row.sellTime < filterSet.sellTime.min)
                return false;
            if (filterSet.sellTime.max !== null && row.sellTime !== null && row.sellTime > filterSet.sellTime.max)
                return false;

            // Break-even price filter
            const breakEvenPrice = row.sellPrice !== null ? Math.ceil(row.sellPrice / (1 - 0.02)) : null;
            if (
                filterSet.breakEvenPrice.min !== null &&
                breakEvenPrice !== null &&
                breakEvenPrice < filterSet.breakEvenPrice.min
            )
                return false;
            if (
                filterSet.breakEvenPrice.max !== null &&
                breakEvenPrice !== null &&
                breakEvenPrice > filterSet.breakEvenPrice.max
            )
                return false;

            // Margin filter
            if (filterSet.margin.min !== null && row.margin !== null && row.margin < filterSet.margin.min) return false;
            if (filterSet.margin.max !== null && row.margin !== null && row.margin > filterSet.margin.max) return false;

            // Daily volume filter
            if (
                filterSet.dailyVolume.min !== null &&
                row.dailyVolume != null &&
                row.dailyVolume < filterSet.dailyVolume.min
            )
                return false;
            if (
                filterSet.dailyVolume.max !== null &&
                row.dailyVolume != null &&
                row.dailyVolume > filterSet.dailyVolume.max
            )
                return false;

            // Post-tax profit filter
            const taxRate = 0.02;
            const postTaxProfit =
                row.buyPrice !== null && row.sellPrice !== null
                    ? Math.floor(row.buyPrice * (1 - taxRate) - row.sellPrice)
                    : null;
            if (
                filterSet.postTaxProfit.min !== null &&
                postTaxProfit !== null &&
                postTaxProfit < filterSet.postTaxProfit.min
            )
                return false;
            if (
                filterSet.postTaxProfit.max !== null &&
                postTaxProfit !== null &&
                postTaxProfit > filterSet.postTaxProfit.max
            )
                return false;

            return true;
        });

        // If no sorting key is selected, return in original order
        if (!key) {
            return rows;
        }

        const dir = dirStr === 'asc' ? 1 : -1;
        rows = [...rows].sort((a, b) => {
            let va: any;
            let vb: any;

            if (key === 'breakEvenPrice') {
                // Break-even price for sorting: ceil(sellPrice / (1 - taxRate))
                const taxRate = 0.02;
                va = a.sellPrice !== null ? Math.ceil(a.sellPrice / (1 - taxRate)) : null;
                vb = b.sellPrice !== null ? Math.ceil(b.sellPrice / (1 - taxRate)) : null;
            } else if (key === 'postTaxProfit') {
                // Post-tax profit for sorting: floor(buyPrice * (1 - taxRate) - sellPrice)
                const taxRate = 0.02;
                va =
                    a.buyPrice !== null && a.sellPrice !== null
                        ? Math.floor(a.buyPrice * (1 - taxRate) - a.sellPrice)
                        : null;
                vb =
                    b.buyPrice !== null && b.sellPrice !== null
                        ? Math.floor(b.buyPrice * (1 - taxRate) - b.sellPrice)
                        : null;
            } else {
                va = (a as any)[key];
                vb = (b as any)[key];
            }

            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;
            if (typeof va === 'string' && typeof vb === 'string') return dir * va.localeCompare(vb);
            return dir * (va - vb);
        });
        return rows;
    }

    onMount(() => {
        if (!allRows?.length) {
            loadRows();
        } else {
            lastUpdated = Date.now();
        }
        // Hydrate prefs once
        try {
            const raw = localStorage.getItem('osrs:prefs');
            if (raw) {
                const prefs = JSON.parse(raw);
                if (prefs.hasOwnProperty('sortKey')) sortKey = prefs.sortKey;
                if (prefs.sortDir) sortDir = prefs.sortDir;
                if (prefs.pageSize) pageSize = prefs.pageSize;
            }
        } catch {}
        prefsHydrated = true;
        tickTimer = setInterval(() => {
            nowSec = Math.floor(Date.now() / 1000);
        }, 1000);
    });

    let timer: any;
    let tickTimer: any;
    $: {
        clearInterval(timer);
        if (auto) {
            timer = setInterval(loadRows, Math.max(5, refreshSec) * 1000);
        }
    }

    onDestroy(() => {
        clearInterval(timer);
        clearInterval(tickTimer);
        clearTimeout(searchTimer);
    });

    // Debounced search input -> search
    let searchTimer: any;
    $: {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            search = searchRaw;
            page = 1;
        }, 200);
    }

    // Persist preferences (sort + page size)
    let prefsHydrated = false;
    $: if (prefsHydrated) {
        try {
            localStorage.setItem('osrs:prefs', JSON.stringify({ sortKey, sortDir, pageSize }));
        } catch {}
    }

    function setSort(key: SortKey) {
        if (sortKey === key) {
            // Cycling through states for the same column
            if (sortDir === 'asc') {
                sortDir = 'desc';
            } else if (sortDir === 'desc') {
                sortKey = null; // Go to unsorted
                sortDir = 'asc';
                lastSortKey = key;
            } else {
                // We're in unsorted state, clicking the same column - restart with asc
                sortKey = key;
                sortDir = 'asc';
            }
        } else if (lastSortKey === key && sortKey === null) {
            // Clicking the same column that was previously sorted but is now unsorted - restart cycle
            sortKey = key;
            sortDir = 'asc';
        } else {
            // Clicking a different column - start fresh with default direction
            sortKey = key;
            sortDir = key === 'name' ? 'asc' : 'desc';
            lastSortKey = key;
        }
    }
    function handleSort(key: string) {
        setSort(key as SortKey);
    }

    function clearFilters() {
        filters = {
            buyLimit: { min: null, max: null },
            buyPrice: { min: null, max: null },
            buyTime: { min: null, max: null },
            sellPrice: { min: null, max: null },
            sellTime: { min: null, max: null },
            breakEvenPrice: { min: null, max: null },
            margin: { min: null, max: null },
            postTaxProfit: { min: null, max: null },
            dailyVolume: { min: null, max: null }
        };
        page = 1;
    }

    let visibleRows: PriceRow[] = [];
    $: visibleRows = filteredSorted(allRows, search, sortKey, sortDir, filtersNormalized);

    // Recompute label once per second using nowSec as a dependency
    $: {
        nowSec;
        lastUpdatedLabel = secondsAgoFromUnix(lastUpdated ? Math.floor(lastUpdated / 1000) : null);
    }
</script>

<svelte:head>
    <title>OSRS Price Tracker</title>
</svelte:head>

<div class="page" id="home">
    <section class="intro p-4 flex gap-4 items-end flex-wrap">
        <div class="grow">
            <h1 class="text-2xl font-semibold">OSRS Price Tracker</h1>
            <p class="text-base opacity-80">Real-time OSRS GE prices</p>
            <p class="text-xs opacity-70">Last updated: {nowSec && lastUpdatedLabel}</p>
        </div>
        <div class="flex gap-3 items-center">
            <label class="flex gap-1 text-sm items-center"
                >Auto-refresh <input type="checkbox" bind:checked={auto} class="cursor-pointer" /></label
            >
            <label class="flex gap-1 text-sm items-center">
                <span>Every</span>
                <input class="w-16 text-right border-none p-1" type="number" min="5" bind:value={refreshSec} />
                <span>s</span>
            </label>
            <button
                class="border px-3 py-1 rounded items-center transition-colors hover:bg-gray-600 focus:bg-gray-600"
                on:click={loadRows}
                disabled={loading}
            >
                Refresh
            </button>
        </div>
    </section>

    <section class="px-4 pb-2 mt-4">
        <input class="border rounded p-2 w-full md:w-80" placeholder="Search for an item..." bind:value={searchRaw} />
    </section>

    {#if errorMsg}
        <section class="px-4 pb-2">
            <div
                class="border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded p-2 text-sm"
            >
                Failed to refresh data{failCount > 1 ? ` (x${failCount})` : ''}: {errorMsg}
            </div>
        </section>
    {/if}

    <section class="px-4 mt-2">
        <!-- Filters Accordion -->
        <div class="mb-4">
            <button
                class="accordion-trigger w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg border border-gray-300 dark:border-gray-600 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                class:rounded-b-lg={!filtersExpanded}
                on:click={() => (filtersExpanded = !filtersExpanded)}
            >
                <span class="font-medium">
                    Apply filters {activeFiltersCount > 0
                        ? `(${activeFiltersCount} filters active)`
                        : '(0 filters active)'}
                </span>
                <span class="transform transition-transform {filtersExpanded ? 'rotate-180' : ''}">▼</span>
            </button>

            {#if filtersExpanded}
                <div
                    class="accordion-content p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg border border-t-0 border-gray-300 dark:border-gray-600"
                >
                    <h3 class="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Filters:</h3>

                    <div class="grid grid-cols-1 gap-4">
                        <!-- Buy limit filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                id="buy-limit-label"
                            >
                                Buy limit
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min (100)"
                                    aria-labelledby="buy-limit-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.buyLimit.min}
                                />
                                <input
                                    type="number"
                                    placeholder="Max (50000)"
                                    aria-labelledby="buy-limit-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.buyLimit.max}
                                />
                            </div>
                        </div>

                        <!-- Buy price filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                id="buy-price-label"
                            >
                                Buy price
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min (1)"
                                    aria-labelledby="buy-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.buyPrice.min}
                                />
                                <input
                                    type="number"
                                    placeholder="Max (50)"
                                    aria-labelledby="buy-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.buyPrice.max}
                                />
                            </div>
                        </div>

                        <!-- Last buy filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                id="buy-time-label"
                            >
                                Last buy
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min time"
                                    aria-labelledby="buy-time-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.buyTime.min}
                                />
                                <input
                                    type="number"
                                    placeholder="Max time"
                                    aria-labelledby="buy-time-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.buyTime.max}
                                />
                            </div>
                        </div>

                        <!-- Sell price filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                id="sell-price-label"
                            >
                                Sell price
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min (1)"
                                    aria-labelledby="sell-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.sellPrice.min}
                                />
                                <input
                                    type="number"
                                    placeholder="Max (50)"
                                    aria-labelledby="sell-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.sellPrice.max}
                                />
                            </div>
                        </div>

                        <!-- Last sell filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                id="sell-time-label"
                            >
                                Last sell
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min time"
                                    aria-labelledby="sell-time-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.sellTime.min}
                                />
                                <input
                                    type="number"
                                    placeholder="Max time"
                                    aria-labelledby="sell-time-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.sellTime.max}
                                />
                            </div>
                        </div>

                        <!-- Break-even price filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                id="break-even-price-label"
                            >
                                Break-even price
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min price"
                                    aria-labelledby="break-even-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.breakEvenPrice.min}
                                />
                                <input
                                    type="number"
                                    placeholder="Max price"
                                    aria-labelledby="break-even-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.breakEvenPrice.max}
                                />
                            </div>
                        </div>

                        <!-- Margin filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                id="margin-label"
                            >
                                Margin
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min (1)"
                                    aria-labelledby="margin-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.margin.min}
                                />
                                <input
                                    type="number"
                                    placeholder="Max (23)"
                                    aria-labelledby="margin-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.margin.max}
                                />
                            </div>
                        </div>

                        <!-- Post-tax profit filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                id="post-tax-profit-label"
                            >
                                Post-tax profit
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min (125)"
                                    aria-labelledby="post-tax-profit-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.postTaxProfit.min}
                                />
                                <input
                                    type="number"
                                    placeholder="Max (198000)"
                                    aria-labelledby="post-tax-profit-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.postTaxProfit.max}
                                />
                            </div>
                        </div>

                        <!-- Daily volume filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                id="daily-volume-label"
                            >
                                Daily volume
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min (10000)"
                                    aria-labelledby="daily-volume-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.dailyVolume.min}
                                />
                                <input
                                    type="number"
                                    placeholder="Max (428130653)"
                                    aria-labelledby="daily-volume-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.dailyVolume.max}
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Clear filters button -->
                    <div class="mt-4 flex justify-end">
                        <button
                            class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                            on:click={clearFilters}
                        >
                            🗑️ Clear filters
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <div class="flex items-center justify-between py-2">
            <div class="flex gap-2 items-center text-sm">
                <label for="page-size">Rows per page</label>
                <select id="page-size" class="border p-1" bind:value={pageSize} on:change={() => (page = 1)}>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                </select>
            </div>
            <div class="flex gap-3 items-center text-sm">
                <span class="opacity-70">
                    Page {page} of {Math.max(1, Math.ceil(visibleRows.length / pageSize))} ({visibleRows.length} items)
                </span>
                <button class="border px-2 py-1" on:click={() => (page = Math.max(1, page - 1))}>Prev</button>
                <button
                    class="border px-2 py-1"
                    on:click={() => (page = Math.min(Math.ceil(visibleRows.length / pageSize) || 1, page + 1))}
                >
                    Next
                </button>
            </div>
        </div>

        <PriceTable
            rows={visibleRows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)}
            sortable
            sortBy={handleSort}
            {sortKey}
            {sortDir}
        />
    </section>
</div>

<style lang="scss">
</style>
