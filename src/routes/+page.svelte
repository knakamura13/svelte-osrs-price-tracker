<script lang="ts">
    import PriceTable from '$lib/components/tables/PriceTable.svelte';
    import ColumnsToggle from '$lib/components/forms/ColumnsToggle.svelte';
    import ErrorAlert from '$lib/components/feedback/ErrorAlert.svelte';
    import SearchBar from '$lib/components/forms/SearchBar.svelte';
    import FiltersPanel from '$lib/components/controls/FiltersPanel.svelte';
    import HeaderControls from '$lib/components/layout/HeaderControls.svelte';
    import LoadingSkeleton from '$lib/components/layout/LoadingSkeleton.svelte';
    import Toast from '$lib/components/feedback/Toast.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import {
        filteredSorted,
        normalizeFilters,
        isFiniteNumber,
        handleNumericFilterChange as handleNumericChange,
        computeFilterStats,
        setSort as computeNextSort
    } from '$lib/utils/filters';
    import { loadPrefs, savePrefs } from '$lib/utils/preferences';
    import { setupAutoRefreshWithBackoff, calculateBackoff } from '$lib/utils/autoRefresh';
    import { settingsStore, itemsStore } from '$lib/utils/settings';
    import type { PriceRow, Filters, SortKey, FilterStats } from '$lib/types';

    // Data prop is now optional since we load data client-side for better UX
    export let data: { rows?: PriceRow[] } = {};

    let search: string = '';
    let sortKey: SortKey | null = 'name';
    let sortDir: 'asc' | 'desc' = 'desc';
    let lastSortKey: SortKey | null = 'name';
    let page = 1;
    let pageSize = 25;
    // Auto-refresh is now managed by settings store
    let autoRefresh = false;
    // Refresh interval is hardcoded to 60 seconds
    const refreshSec = 60;
    // Throttle instant refreshes to prevent abuse (minimum 1 second between refreshes)
    let lastRefreshTime = 0;

    let allRows: PriceRow[] = data?.rows ?? [];
    let lastUpdated: number | null = null;
    let nowSec: number = Math.floor(Date.now() / 1000);
    let lastUpdatedLabel: string = '—';
    let errorMsg: string | null = null;
    let failCount = 0;
    let loading = true; // Start with loading true for initial load
    let backgroundRefreshing = false; // Separate state for auto-refresh loading
    let nextRetryAt: number | null = null; // Unix timestamp in seconds
    let nextRetryIn: number | null = null; // Countdown in seconds
    let toastVisible = false;
    let toastMessage = '';
    let toastType: 'success' | 'info' | 'warning' | 'error' = 'success';

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
        postTaxProfitAvg: { min: null as number | null, max: null as number | null },
        dailyVolume: { min: null as number | null, max: null as number | null },
        dailyLow: { min: null as number | null, max: null as number | null },
        dailyHigh: { min: null as number | null, max: null as number | null },
        averageBuy: { min: null as number | null, max: null as number | null },
        averageSell: { min: null as number | null, max: null as number | null },
        potentialProfit: { min: null as number | null, max: null as number | null },
        potentialProfitAvg: { min: null as number | null, max: null as number | null }
    };

    // Column visibility state
    let columnsExpanded = false;
    let columnVisibility = {
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

    // Normalized filters (convert NaN/undefined to null) to drive reactivity
    let filtersNormalized: Filters;
    $: filtersNormalized = normalizeFilters(filters);

    // Whenever filters or columns change, jump back to the first page for clarity
    $: {
        filtersNormalized;
        columnVisibility;
        page = 1;
    }

    // Computed active filters count - explicitly list all filter values to ensure reactivity on nested changes
    $: activeFiltersCount = [
        filters.buyLimit.min,
        filters.buyLimit.max,
        filters.buyPrice.min,
        filters.buyPrice.max,
        filters.buyTime.min,
        filters.buyTime.max,
        filters.sellPrice.min,
        filters.sellPrice.max,
        filters.sellTime.min,
        filters.sellTime.max,
        filters.breakEvenPrice.min,
        filters.breakEvenPrice.max,
        filters.margin.min,
        filters.margin.max,
        filters.postTaxProfit.min,
        filters.postTaxProfit.max,
        filters.dailyVolume.min,
        filters.dailyVolume.max,
        filters.dailyLow.min,
        filters.dailyLow.max,
        filters.dailyHigh.min,
        filters.dailyHigh.max,
        filters.averageBuy.min,
        filters.averageBuy.max,
        filters.averageSell.min,
        filters.averageSell.max,
        filters.potentialProfit.min,
        filters.potentialProfit.max
    ].filter((v) => {
        // Handle both string and number values
        if (typeof v === 'string') {
            const num = Number(v);
            return !Number.isNaN(num) && Number.isFinite(num);
        }
        return isFiniteNumber(v);
    }).length;

    async function loadRows(isInitialLoad: boolean = false) {
        try {
            if (isInitialLoad) {
                loading = true;
            } else {
                backgroundRefreshing = true;
            }
            errorMsg = null;
            nextRetryAt = null;
            nextRetryIn = null;
            const res = await fetch('/api/rows', { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
            const json = await res.json();
            const rows = Array.isArray(json?.rows) ? (json.rows as PriceRow[]) : [];
            allRows = rows;
            itemsStore.set(rows); // Update global items store for header search
            lastUpdated = Date.now();
            lastRefreshTime = Date.now(); // Update throttle timestamp
            failCount = 0; // Reset fail count on success

            // Only reset page to 1 on initial load, not on auto-refresh
            if (isInitialLoad) {
                page = 1;
            }

            // Show success toast
            toastMessage = `Updated ${rows.length} items`;
            toastType = 'success';
            toastVisible = true;
        } catch (err: any) {
            failCount = failCount + 1;
            errorMsg = err?.message ?? 'Failed to load prices';

            // Schedule next retry with backoff if auto-refresh is enabled
            if (autoRefresh) {
                const backoffDelay = calculateBackoff(failCount, refreshSec);
                nextRetryAt = Math.floor(Date.now() / 1000) + backoffDelay;

                // Disable auto-refresh after 5 consecutive failures
                if (failCount >= 5) {
                    settingsStore.set({ ...settings, autoRefresh: false });
                    nextRetryAt = null;
                }
            }
        } finally {
            if (isInitialLoad) {
                loading = false;
            } else {
                backgroundRefreshing = false;
            }
        }
    }

    // Subscribe to settings store for auto-refresh
    $: settings = $settingsStore;
    $: autoRefresh = settings.autoRefresh;

    // Track previous auto state to detect when it changes from false to true
    let prevAutoRefresh = false;

    // filteredSorted is imported from $lib/utils/filters

    onMount(() => {
        // Always load data on mount for fresh data and better UX
        loadRows(true);
        // Hydrate prefs once
        const loaded = loadPrefs(Math.floor(Date.now() / 1000));
        if (loaded) {
            if (Object.prototype.hasOwnProperty.call(loaded, 'sortKey')) sortKey = loaded!.sortKey as any;
            if (loaded.sortDir) sortDir = loaded.sortDir;
            if (loaded.pageSize) pageSize = loaded.pageSize;
            if (loaded.columnVisibility) columnVisibility = { ...columnVisibility, ...loaded.columnVisibility };
            if (loaded.filters) filters = { ...filters, ...loaded.filters } as any;
        }
        prefsHydrated = true;
        tickTimer = setInterval(() => {
            nowSec = Math.floor(Date.now() / 1000);
        }, 1000);
    });

    let timer: any;
    let tickTimer: any;
    $: timer = setupAutoRefreshWithBackoff(timer, autoRefresh, refreshSec, failCount, loadRows);

    onDestroy(() => {
        clearInterval(timer);
        clearInterval(tickTimer);
    });

    // Search updates handled via SearchBar's debounce

    // Persist preferences (sort + page size + columns + filters)
    let prefsHydrated = false;
    $: if (prefsHydrated) {
        savePrefs({ sortKey, sortDir, pageSize, columnVisibility, filters } as any);
    }

    function setSort(key: SortKey) {
        const next = computeNextSort(sortKey, sortDir, lastSortKey, key);
        sortKey = next.sortKey;
        sortDir = next.sortDir;
        lastSortKey = next.lastSortKey;
    }
    function handleSort(key: string) {
        setSort(key as SortKey);
    }

    function handleTimeChange(key: 'buyTime' | 'sellTime', bound: 'min' | 'max', value: number | null) {
        // Reassign filters immutably so Svelte tracks the change
        if (key === 'buyTime') {
            filters = { ...filters, buyTime: { ...filters.buyTime, [bound]: value } } as Filters;
        } else {
            filters = { ...filters, sellTime: { ...filters.sellTime, [bound]: value } } as Filters;
        }
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
            postTaxProfitAvg: { min: null, max: null },
            dailyVolume: { min: null, max: null },
            dailyLow: { min: null, max: null },
            dailyHigh: { min: null, max: null },
            averageBuy: { min: null, max: null },
            averageSell: { min: null, max: null },
            potentialProfit: { min: null, max: null },
            potentialProfitAvg: { min: null, max: null }
        };
        page = 1;
    }

    // Pagination callbacks
    function onPageChange(newPage: number) {
        page = newPage;
        // Smooth scroll to top of table
        const tableSection = document.querySelector('.px-4.mt-2');
        if (tableSection) {
            tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function onPageSizeChange(newPageSize: number) {
        pageSize = newPageSize;
        page = 1; // Reset to first page when page size changes
    }

    let visibleRows: PriceRow[] = [];
    $: visibleRows = filteredSorted(allRows, search, sortKey, sortDir, filtersNormalized, nowSec);

    // Total rows for pagination
    $: totalRows = visibleRows.length;

    // Recompute label once per second using nowSec as a dependency
    $: {
        nowSec;
        if (lastUpdated) {
            const unixSeconds = Math.floor(lastUpdated / 1000);
            const now = Math.floor(Date.now() / 1000);
            const diff = Math.max(0, now - unixSeconds);

            // Only cap the display when auto-refresh is enabled and we're close to refresh time
            // This prevents showing "60s ago" before immediately showing "0s ago"
            if (autoRefresh && diff >= 59) {
                lastUpdatedLabel = '59s ago';
            } else {
                lastUpdatedLabel = secondsAgoFromUnix(unixSeconds);
            }
        } else {
            lastUpdatedLabel = '—';
        }
        // Update retry countdown
        if (nextRetryAt !== null) {
            const remaining = nextRetryAt - nowSec;
            nextRetryIn = remaining > 0 ? remaining : 0;
        } else {
            nextRetryIn = null;
        }
    }

    // Computed min/max values for filter placeholders
    let filterStats: FilterStats;
    $: filterStats = computeFilterStats(allRows);
</script>

<svelte:head>
    <title>OSRS Price Tracker</title>
</svelte:head>

<div class="page" id="home">
    <HeaderControls {lastUpdatedLabel} {backgroundRefreshing} />

    <ErrorAlert message={errorMsg} {failCount} {nextRetryIn} autoDisabled={failCount >= 5} />

    <section class="px-4 mt-4">
        <ColumnsToggle
            expanded={columnsExpanded}
            {columnVisibility}
            onToggle={() => (columnsExpanded = !columnsExpanded)}
            onChange={(k, checked) => (columnVisibility = { ...columnVisibility, [k]: checked })}
            onReset={() =>
                (columnVisibility = {
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
                })}
        />

        <FiltersPanel
            expanded={filtersExpanded}
            {filters}
            {filtersNormalized}
            {filterStats}
            {activeFiltersCount}
            onToggle={() => (filtersExpanded = !filtersExpanded)}
            onClear={clearFilters}
            onNumericChange={(key, bound, value) => {
                const next = handleNumericChange(filters, key as any, bound as any, value);
                filters = next;
            }}
            onTimeChange={handleTimeChange}
        />

        <SearchBar
            value={search}
            placeholder="Search for an item..."
            onInput={(v) => {
                search = v;
                page = 1;
            }}
        />

        {#if loading}
            <LoadingSkeleton rows={pageSize} columns={Object.values(columnVisibility).filter(Boolean).length + 1} />
        {:else}
            <PriceTable
                rows={visibleRows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)}
                sortable
                sortBy={handleSort}
                {sortKey}
                {sortDir}
                {columnVisibility}
                {page}
                {pageSize}
                {totalRows}
                {onPageChange}
                {onPageSizeChange}
                decimalView={settings.decimalView}
                decimalPlaces={settings.decimalPlaces}
                {backgroundRefreshing}
            />
        {/if}
    </section>
</div>

<Toast bind:visible={toastVisible} message={toastMessage} type={toastType} duration={3000} />

<style lang="scss">
</style>
