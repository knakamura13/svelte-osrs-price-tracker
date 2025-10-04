<script lang="ts">
    import PriceTable from '$lib/components/PriceTable.svelte';
    import ColumnsToggle from '$lib/components/ColumnsToggle.svelte';
    import ErrorAlert from '$lib/components/ErrorAlert.svelte';
    import SearchBar from '$lib/components/SearchBar.svelte';
    import FiltersPanel from '$lib/components/FiltersPanel.svelte';
    import HeaderControls from '$lib/components/HeaderControls.svelte';
    import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
    import Toast from '$lib/components/Toast.svelte';
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
    import type { PriceRow, Filters, SortKey, FilterStats } from '$lib/types';

    export let data: { rows: PriceRow[] };

    let search: string = '';
    let sortKey: SortKey | null = 'name';
    let sortDir: 'asc' | 'desc' = 'desc';
    let lastSortKey: SortKey | null = 'name';
    let page = 1;
    let pageSize = 25;
    let auto = false;
    // Refresh interval is hardcoded to 60 seconds
    const refreshSec = 60;

    let allRows: PriceRow[] = data?.rows ?? [];
    let lastUpdated: number | null = null;
    let nowSec: number = Math.floor(Date.now() / 1000);
    let lastUpdatedLabel: string = '—';
    let errorMsg: string | null = null;
    let failCount = 0;
    let loading = false;
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
        dailyVolume: { min: null as number | null, max: null as number | null }
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
        dailyVolume: true
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
        filters.dailyVolume.max
    ].filter((v) => isFiniteNumber(v)).length;

    async function loadRows() {
        try {
            loading = true;
            errorMsg = null;
            nextRetryAt = null;
            nextRetryIn = null;
            const res = await fetch('/api/rows', { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
            const json = await res.json();
            const rows = Array.isArray(json?.rows) ? (json.rows as PriceRow[]) : [];
            allRows = rows;
            lastUpdated = Date.now();
            failCount = 0; // Reset fail count on success
            page = 1;
            // Show success toast
            toastMessage = `Updated ${rows.length} items`;
            toastType = 'success';
            toastVisible = true;
        } catch (err: any) {
            failCount = failCount + 1;
            errorMsg = err?.message ?? 'Failed to load prices';

            // Schedule next retry with backoff if auto-refresh is enabled
            if (auto) {
                const backoffDelay = calculateBackoff(failCount, refreshSec);
                nextRetryAt = Math.floor(Date.now() / 1000) + backoffDelay;

                // Disable auto-refresh after 5 consecutive failures
                if (failCount >= 5) {
                    auto = false;
                    nextRetryAt = null;
                }
            }
        } finally {
            loading = false;
        }
    }

    // filteredSorted is imported from $lib/utils/filters

    onMount(() => {
        if (!allRows?.length) {
            loadRows();
        } else {
            lastUpdated = Date.now();
        }
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
    $: timer = setupAutoRefreshWithBackoff(timer, auto, refreshSec, failCount, loadRows);

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
            dailyVolume: { min: null, max: null }
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
            if (auto && diff >= 59) {
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
    <HeaderControls {lastUpdatedLabel} {auto} onToggleAuto={(v) => (auto = v)} />

    <section class="px-4 pb-2 mt-4">
        <SearchBar
            value={search}
            placeholder="Search for an item..."
            onInput={(v) => {
                search = v;
                page = 1;
            }}
        />
    </section>

    <ErrorAlert message={errorMsg} {failCount} {nextRetryIn} autoDisabled={failCount >= 5} />

    <section class="px-4 mt-2">
        <ColumnsToggle
            expanded={columnsExpanded}
            {columnVisibility}
            onToggle={() => (columnsExpanded = !columnsExpanded)}
            onChange={(k, checked) => (columnVisibility = { ...columnVisibility, [k]: checked })}
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

        {#if loading && allRows.length === 0}
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
            />
        {/if}
    </section>
</div>

<Toast bind:visible={toastVisible} message={toastMessage} type={toastType} duration={3000} />

<style lang="scss">
</style>
