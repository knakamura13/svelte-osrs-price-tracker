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

    function isPositive(n: number | null): boolean {
        return isFiniteNumber(n) && n > 0;
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

    // Helpers for duration <-> seconds conversions
    function partsFromSeconds(totalSeconds: number | null | undefined): {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } {
        const total =
            typeof totalSeconds === 'number' && Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;
        const days = Math.floor(total / 86400);
        const remainderAfterDays = total % 86400;
        const hours = Math.floor(remainderAfterDays / 3600);
        const remainderAfterHours = remainderAfterDays % 3600;
        const minutes = Math.floor(remainderAfterHours / 60);
        const seconds = remainderAfterHours % 60;
        return { days, hours, minutes, seconds };
    }

    function secondsFromParts(
        days: number | null | undefined,
        hours: number | null | undefined,
        minutes: number | null | undefined,
        seconds: number | null | undefined
    ): number {
        const d = typeof days === 'number' && Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
        const h = typeof hours === 'number' && Number.isFinite(hours) && hours > 0 ? Math.floor(hours) : 0;
        const m = typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0 ? Math.floor(minutes) : 0;
        const s = typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
        return d * 86400 + h * 3600 + m * 60 + s;
    }

    // Generic change handler for numeric filter inputs: if value equals default, reset to null
    type NumericFilterKey = Exclude<keyof Filters, 'buyTime' | 'sellTime'>;
    function handleNumericFilterChange<K extends NumericFilterKey>(key: K, bound: 'min' | 'max', event: Event): void {
        const input = event.currentTarget as HTMLInputElement;
        const raw = input?.value ?? '';
        const value = raw === '' ? null : Number(raw);

        if (value === null || !Number.isFinite(value) || value === 0) {
            (filters as any)[key][bound] = null;
            return;
        }

        (filters as any)[key][bound] = value;
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

    // UI state for time duration inputs (dd:hh:mm:ss)
    let buyMinDays = 0;
    let buyMinHours = 0;
    let buyMinMinutes = 0;
    let buyMinSeconds = 0;
    let buyMaxDays = 0;
    let buyMaxHours = 0;
    let buyMaxMinutes = 0;
    let buyMaxSeconds = 0;

    let sellMinDays = 0;
    let sellMinHours = 0;
    let sellMinMinutes = 0;
    let sellMinSeconds = 0;
    let sellMaxDays = 0;
    let sellMaxHours = 0;
    let sellMaxMinutes = 0;
    let sellMaxSeconds = 0;

    function hydrateTimePartsFromFilters() {
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

    function migrateTimeFiltersToDurations(nowSeconds: number) {
        // If values look like unix timestamps (very large), convert to ages (durations)
        const THRESHOLD_SECONDS = 100_000_000; // ~3.17 years
        const convert = (v: number | null): number | null => {
            if (v == null || !Number.isFinite(v)) return null;
            if (v > THRESHOLD_SECONDS) {
                return Math.max(0, nowSeconds - v);
            }
            return v;
        };
        filters.buyTime.min = convert(filters.buyTime.min);
        filters.buyTime.max = convert(filters.buyTime.max);
        filters.sellTime.min = convert(filters.sellTime.min);
        filters.sellTime.max = convert(filters.sellTime.max);
    }

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
        filterSet: Filters,
        nowSeconds: number
    ): PriceRow[] {
        let rows = source;
        if (qStr.trim()) {
            const q = qStr.toLowerCase();
            rows = rows.filter((r) => r.name.toLowerCase().includes(q));
        }

        // Apply column filters
        rows = rows.filter((row) => {
            // Buy limit filter - special case when min === max === 0 (exact match for 0)
            if (filterSet.buyLimit.min === 0 && filterSet.buyLimit.max === 0) {
                return row.buyLimit === 0;
            }
            // Normal range filtering
            if (filterSet.buyLimit.min !== null && row.buyLimit !== null && row.buyLimit < filterSet.buyLimit.min)
                return false;
            if (filterSet.buyLimit.max !== null && row.buyLimit !== null && row.buyLimit > filterSet.buyLimit.max)
                return false;

            // Buy price filter
            if (filterSet.buyPrice.min !== null && row.buyPrice !== null && row.buyPrice < filterSet.buyPrice.min)
                return false;
            if (filterSet.buyPrice.max !== null && row.buyPrice !== null && row.buyPrice > filterSet.buyPrice.max)
                return false;

            // Last buy age filter (durations in seconds)
            if ((filterSet.buyTime.min !== null || filterSet.buyTime.max !== null) && row.buyTime !== null) {
                const age = Math.max(0, nowSeconds - row.buyTime);
                if (filterSet.buyTime.min !== null && age < filterSet.buyTime.min) return false;
                if (filterSet.buyTime.max !== null && age > filterSet.buyTime.max) return false;
            }

            // Sell price filter
            if (filterSet.sellPrice.min !== null && row.sellPrice !== null && row.sellPrice < filterSet.sellPrice.min)
                return false;
            if (filterSet.sellPrice.max !== null && row.sellPrice !== null && row.sellPrice > filterSet.sellPrice.max)
                return false;

            // Last sell age filter (durations in seconds)
            if ((filterSet.sellTime.min !== null || filterSet.sellTime.max !== null) && row.sellTime !== null) {
                const age = Math.max(0, nowSeconds - row.sellTime);
                if (filterSet.sellTime.min !== null && age < filterSet.sellTime.min) return false;
                if (filterSet.sellTime.max !== null && age > filterSet.sellTime.max) return false;
            }

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

            // Special handling for buyLimit: treat null as infinity
            if (key === 'buyLimit') {
                va = va ?? Number.MAX_SAFE_INTEGER;
                vb = vb ?? Number.MAX_SAFE_INTEGER;
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
                if (prefs.columnVisibility) columnVisibility = { ...columnVisibility, ...prefs.columnVisibility };
                if (prefs.filters) filters = { ...filters, ...prefs.filters };
            }
        } catch {}
        // Migrate saved timestamps (if any) to durations and hydrate UI parts
        migrateTimeFiltersToDurations(Math.floor(Date.now() / 1000));
        hydrateTimePartsFromFilters();
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

    // Persist preferences (sort + page size + columns + filters)
    let prefsHydrated = false;
    $: if (prefsHydrated) {
        try {
            localStorage.setItem(
                'osrs:prefs',
                JSON.stringify({
                    sortKey,
                    sortDir,
                    pageSize,
                    columnVisibility,
                    filters
                })
            );
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
        // Reset duration inputs
        buyMinDays = buyMinHours = buyMinMinutes = buyMinSeconds = 0;
        buyMaxDays = buyMaxHours = buyMaxMinutes = buyMaxSeconds = 0;
        sellMinDays = sellMinHours = sellMinMinutes = sellMinSeconds = 0;
        sellMaxDays = sellMaxHours = sellMaxMinutes = sellMaxSeconds = 0;
        page = 1;
    }

    // Pagination callbacks
    function onPageChange(newPage: number) {
        page = newPage;
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
        lastUpdatedLabel = secondsAgoFromUnix(lastUpdated ? Math.floor(lastUpdated / 1000) : null);
    }

    // Sync duration parts -> filter seconds (treat 0 as null to disable that bound)
    $: {
        const secs = secondsFromParts(buyMinDays, buyMinHours, buyMinMinutes, buyMinSeconds);
        filters.buyTime.min = secs > 0 ? secs : null;
    }
    $: {
        const secs = secondsFromParts(buyMaxDays, buyMaxHours, buyMaxMinutes, buyMaxSeconds);
        filters.buyTime.max = secs > 0 ? secs : null;
    }
    $: {
        const secs = secondsFromParts(sellMinDays, sellMinHours, sellMinMinutes, sellMinSeconds);
        filters.sellTime.min = secs > 0 ? secs : null;
    }
    $: {
        const secs = secondsFromParts(sellMaxDays, sellMaxHours, sellMaxMinutes, sellMaxSeconds);
        filters.sellTime.max = secs > 0 ? secs : null;
    }

    // Computed min/max values for filter placeholders
    $: filterStats = {
        buyLimit: {
            min:
                allRows.length > 0
                    ? Math.min(...allRows.map((r) => r.buyLimit).filter((v): v is number => v !== null))
                    : null,
            max:
                allRows.length > 0
                    ? Math.max(...allRows.map((r) => r.buyLimit).filter((v): v is number => v !== null))
                    : null
        },
        buyPrice: {
            min:
                allRows.length > 0
                    ? Math.min(...allRows.map((r) => r.buyPrice).filter((v): v is number => v !== null))
                    : null,
            max:
                allRows.length > 0
                    ? Math.max(...allRows.map((r) => r.buyPrice).filter((v): v is number => v !== null))
                    : null
        },
        sellPrice: {
            min:
                allRows.length > 0
                    ? Math.min(...allRows.map((r) => r.sellPrice).filter((v): v is number => v !== null))
                    : null,
            max:
                allRows.length > 0
                    ? Math.max(...allRows.map((r) => r.sellPrice).filter((v): v is number => v !== null))
                    : null
        },
        margin: {
            min:
                allRows.length > 0
                    ? Math.min(...allRows.map((r) => r.margin).filter((v): v is number => v !== null))
                    : null,
            max:
                allRows.length > 0
                    ? Math.max(...allRows.map((r) => r.margin).filter((v): v is number => v !== null))
                    : null
        },
        dailyVolume: {
            min:
                allRows.length > 0
                    ? Math.min(...allRows.map((r) => r.dailyVolume).filter((v): v is number => v !== null))
                    : null,
            max:
                allRows.length > 0
                    ? Math.max(...allRows.map((r) => r.dailyVolume).filter((v): v is number => v !== null))
                    : null
        },
        breakEvenPrice: {
            min: null as number | null,
            max: null as number | null
        },
        postTaxProfit: {
            min: null as number | null,
            max: null as number | null
        }
    };

    // Calculate break-even price and post-tax profit stats
    $: {
        if (allRows.length > 0) {
            const taxRate = 0.02;
            const breakEvenPrices: number[] = [];
            const postTaxProfits: number[] = [];

            for (const row of allRows) {
                // Break-even price: ceil(sellPrice / (1 - taxRate))
                if (row.sellPrice !== null) {
                    breakEvenPrices.push(Math.ceil(row.sellPrice / (1 - taxRate)));
                }

                // Post-tax profit: floor(buyPrice * (1 - taxRate) - sellPrice)
                if (row.buyPrice !== null && row.sellPrice !== null) {
                    postTaxProfits.push(Math.floor(row.buyPrice * (1 - taxRate) - row.sellPrice));
                }
            }

            if (breakEvenPrices.length > 0) {
                filterStats.breakEvenPrice.min = Math.min(...breakEvenPrices);
                filterStats.breakEvenPrice.max = Math.max(...breakEvenPrices);
            }

            if (postTaxProfits.length > 0) {
                filterStats.postTaxProfit.min = Math.min(...postTaxProfits);
                filterStats.postTaxProfit.max = Math.max(...postTaxProfits);
            }
        }
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
        <!-- Columns Accordion -->
        <div class="mb-4">
            <button
                class="accordion-trigger w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg border border-gray-300 dark:border-gray-600 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                class:rounded-b-lg={!columnsExpanded}
                on:click={() => (columnsExpanded = !columnsExpanded)}
            >
                <span class="font-medium">Toggle columns</span>
                <span class="transform transition-transform {columnsExpanded ? 'rotate-180' : ''}">▼</span>
            </button>

            {#if columnsExpanded}
                <div
                    class="accordion-content p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg border border-t-0 border-gray-300 dark:border-gray-600"
                >
                    <div class="flex flex-row flex-wrap gap-6">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" bind:checked={columnVisibility.name} />
                            <span class="text-sm">Name</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" bind:checked={columnVisibility.buyLimit} />
                            <span class="text-sm">Buy limit</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" bind:checked={columnVisibility.buyPrice} />
                            <span class="text-sm">Buy price</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" bind:checked={columnVisibility.buyTime} />
                            <span class="text-sm">Last buy</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" bind:checked={columnVisibility.sellPrice} />
                            <span class="text-sm">Sell price</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" bind:checked={columnVisibility.sellTime} />
                            <span class="text-sm">Last sell</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" bind:checked={columnVisibility.breakEvenPrice} />
                            <span class="text-sm">Break-even price</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" bind:checked={columnVisibility.margin} />
                            <span class="text-sm">Margin</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" bind:checked={columnVisibility.postTaxProfit} />
                            <span class="text-sm">Post-tax profit</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" bind:checked={columnVisibility.dailyVolume} />
                            <span class="text-sm">Daily volume</span>
                        </label>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Filters Accordion -->
        <div class="mb-4">
            <button
                class="accordion-trigger w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg border border-gray-300 dark:border-gray-600 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                class:rounded-b-lg={!filtersExpanded}
                on:click={() => (filtersExpanded = !filtersExpanded)}
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
                                class:text-yellow-600={isPositive(filtersNormalized.buyLimit.min) ||
                                    isPositive(filtersNormalized.buyLimit.max)}
                                class:dark:text-yellow-400={isPositive(filtersNormalized.buyLimit.min) ||
                                    isPositive(filtersNormalized.buyLimit.max)}
                                id="buy-limit-label"
                            >
                                Buy limit
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder={filterStats.buyLimit.min !== null
                                        ? `Min (${filterStats.buyLimit.min})`
                                        : 'Min'}
                                    aria-labelledby="buy-limit-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.buyLimit.min}
                                    on:change={(e) => handleNumericFilterChange('buyLimit', 'min', e)}
                                />
                                <input
                                    type="number"
                                    placeholder={filterStats.buyLimit.max !== null
                                        ? `Max (${filterStats.buyLimit.max})`
                                        : 'Max'}
                                    aria-labelledby="buy-limit-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.buyLimit.max}
                                    on:change={(e) => handleNumericFilterChange('buyLimit', 'max', e)}
                                />
                            </div>
                        </div>

                        <!-- Buy price filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                class:text-yellow-600={isPositive(filtersNormalized.buyPrice.min) ||
                                    isPositive(filtersNormalized.buyPrice.max)}
                                class:dark:text-yellow-400={isPositive(filtersNormalized.buyPrice.min) ||
                                    isPositive(filtersNormalized.buyPrice.max)}
                                id="buy-price-label"
                            >
                                Buy price
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder={filterStats.buyPrice.min !== null
                                        ? `Min (${filterStats.buyPrice.min})`
                                        : 'Min'}
                                    aria-labelledby="buy-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.buyPrice.min}
                                    on:change={(e) => handleNumericFilterChange('buyPrice', 'min', e)}
                                />
                                <input
                                    type="number"
                                    placeholder={filterStats.buyPrice.max !== null
                                        ? `Max (${filterStats.buyPrice.max})`
                                        : 'Max'}
                                    aria-labelledby="buy-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.buyPrice.max}
                                    on:change={(e) => handleNumericFilterChange('buyPrice', 'max', e)}
                                />
                            </div>
                        </div>

                        <!-- Last buy filter -->
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

                        <!-- Sell price filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                class:text-yellow-600={isPositive(filtersNormalized.sellPrice.min) ||
                                    isPositive(filtersNormalized.sellPrice.max)}
                                class:dark:text-yellow-400={isPositive(filtersNormalized.sellPrice.min) ||
                                    isPositive(filtersNormalized.sellPrice.max)}
                                id="sell-price-label"
                            >
                                Sell price
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder={filterStats.sellPrice.min !== null
                                        ? `Min (${filterStats.sellPrice.min})`
                                        : 'Min'}
                                    aria-labelledby="sell-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.sellPrice.min}
                                    on:change={(e) => handleNumericFilterChange('sellPrice', 'min', e)}
                                />
                                <input
                                    type="number"
                                    placeholder={filterStats.sellPrice.max !== null
                                        ? `Max (${filterStats.sellPrice.max})`
                                        : 'Max'}
                                    aria-labelledby="sell-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.sellPrice.max}
                                    on:change={(e) => handleNumericFilterChange('sellPrice', 'max', e)}
                                />
                            </div>
                        </div>

                        <!-- Last sell filter -->
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

                        <!-- Break-even price filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                class:text-yellow-600={isPositive(filtersNormalized.breakEvenPrice.min) ||
                                    isPositive(filtersNormalized.breakEvenPrice.max)}
                                class:dark:text-yellow-400={isPositive(filtersNormalized.breakEvenPrice.min) ||
                                    isPositive(filtersNormalized.breakEvenPrice.max)}
                                id="break-even-price-label"
                            >
                                Break-even price
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder={filterStats.breakEvenPrice.min !== null
                                        ? `Min (${filterStats.breakEvenPrice.min})`
                                        : 'Min price'}
                                    aria-labelledby="break-even-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.breakEvenPrice.min}
                                    on:change={(e) => handleNumericFilterChange('breakEvenPrice', 'min', e)}
                                />
                                <input
                                    type="number"
                                    placeholder={filterStats.breakEvenPrice.max !== null
                                        ? `Max (${filterStats.breakEvenPrice.max})`
                                        : 'Max price'}
                                    aria-labelledby="break-even-price-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.breakEvenPrice.max}
                                    on:change={(e) => handleNumericFilterChange('breakEvenPrice', 'max', e)}
                                />
                            </div>
                        </div>

                        <!-- Margin filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                class:text-yellow-600={isPositive(filtersNormalized.margin.min) ||
                                    isPositive(filtersNormalized.margin.max)}
                                class:dark:text-yellow-400={isPositive(filtersNormalized.margin.min) ||
                                    isPositive(filtersNormalized.margin.max)}
                                id="margin-label"
                            >
                                Margin
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder={filterStats.margin.min !== null
                                        ? `Min (${filterStats.margin.min})`
                                        : 'Min'}
                                    aria-labelledby="margin-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.margin.min}
                                    on:change={(e) => handleNumericFilterChange('margin', 'min', e)}
                                />
                                <input
                                    type="number"
                                    placeholder={filterStats.margin.max !== null
                                        ? `Max (${filterStats.margin.max})`
                                        : 'Max'}
                                    aria-labelledby="margin-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.margin.max}
                                    on:change={(e) => handleNumericFilterChange('margin', 'max', e)}
                                />
                            </div>
                        </div>

                        <!-- Post-tax profit filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                class:text-yellow-600={isPositive(filtersNormalized.postTaxProfit.min) ||
                                    isPositive(filtersNormalized.postTaxProfit.max)}
                                class:dark:text-yellow-400={isPositive(filtersNormalized.postTaxProfit.min) ||
                                    isPositive(filtersNormalized.postTaxProfit.max)}
                                id="post-tax-profit-label"
                            >
                                Post-tax profit
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder={filterStats.postTaxProfit.min !== null
                                        ? `Min (${filterStats.postTaxProfit.min})`
                                        : 'Min'}
                                    aria-labelledby="post-tax-profit-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.postTaxProfit.min}
                                    on:change={(e) => handleNumericFilterChange('postTaxProfit', 'min', e)}
                                />
                                <input
                                    type="number"
                                    placeholder={filterStats.postTaxProfit.max !== null
                                        ? `Max (${filterStats.postTaxProfit.max})`
                                        : 'Max'}
                                    aria-labelledby="post-tax-profit-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.postTaxProfit.max}
                                    on:change={(e) => handleNumericFilterChange('postTaxProfit', 'max', e)}
                                />
                            </div>
                        </div>

                        <!-- Daily volume filter -->
                        <div class="filter-group">
                            <div
                                class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                                class:text-yellow-600={isPositive(filtersNormalized.dailyVolume.min) ||
                                    isPositive(filtersNormalized.dailyVolume.max)}
                                class:dark:text-yellow-400={isPositive(filtersNormalized.dailyVolume.min) ||
                                    isPositive(filtersNormalized.dailyVolume.max)}
                                id="daily-volume-label"
                            >
                                Daily volume
                            </div>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    placeholder={filterStats.dailyVolume.min !== null
                                        ? `Min (${filterStats.dailyVolume.min})`
                                        : 'Min'}
                                    aria-labelledby="daily-volume-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.dailyVolume.min}
                                    on:change={(e) => handleNumericFilterChange('dailyVolume', 'min', e)}
                                />
                                <input
                                    type="number"
                                    placeholder={filterStats.dailyVolume.max !== null
                                        ? `Max (${filterStats.dailyVolume.max})`
                                        : 'Max'}
                                    aria-labelledby="daily-volume-label"
                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    bind:value={filters.dailyVolume.max}
                                    on:change={(e) => handleNumericFilterChange('dailyVolume', 'max', e)}
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Clear filters button -->
                    <div class="mt-4 flex justify-end">
                        <button
                            class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:!cursor-default disabled:hover:!bg-red-600 disabled:focus:!bg-red-600 disabled:opacity-50"
                            disabled={activeFiltersCount === 0}
                            on:click={clearFilters}
                        >
                            🗑️ Clear filters
                        </button>
                    </div>
                </div>
            {/if}
        </div>

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
    </section>
</div>

<style lang="scss">
</style>
