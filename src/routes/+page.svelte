<script lang="ts">
    import PriceTable from '$lib/components/PriceTable.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import type { PriceRow } from '$lib/types';

    type SortKey = 'name' | 'buyLimit' | 'buyPrice' | 'sellPrice' | 'margin' | 'dailyVolume' | 'buyTime' | 'sellTime';

    export let data: { rows: PriceRow[] };

    let search = '';
    let searchRaw = '';
    let sortKey: SortKey | null = null;
    let sortDir: 'asc' | 'desc' = 'asc';
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

    function filteredSorted(source: PriceRow[], qStr: string, key: SortKey | null, dirStr: 'asc' | 'desc'): PriceRow[] {
        let rows = source;
        if (qStr.trim()) {
            const q = qStr.toLowerCase();
            rows = rows.filter((r) => r.name.toLowerCase().includes(q));
        }

        // If no sorting key is selected, return in original order
        if (!key) {
            return rows;
        }

        const dir = dirStr === 'asc' ? 1 : -1;
        rows = [...rows].sort((a, b) => {
            const va = (a as any)[key];
            const vb = (b as any)[key];
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
            // Cycle through: asc -> desc -> unsorted (null) -> asc
            if (sortDir === 'asc') {
                sortDir = 'desc';
            } else if (sortDir === 'desc') {
                sortKey = null;
                sortDir = 'asc';
            } else {
                sortKey = key;
                sortDir = 'asc';
            }
        } else {
            sortKey = key;
            sortDir = key === 'name' ? 'asc' : 'desc';
        }
    }
    function handleSort(key: string) {
        setSort(key as SortKey);
    }

    let visibleRows: PriceRow[] = [];
    $: visibleRows = filteredSorted(allRows, search, sortKey, sortDir);

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
            <p class="text-base opacity-80">Real-time GE prices with search, sort, pagination, and auto‑refresh.</p>
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

    <section class="px-4 pb-2">
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

    <section class="px-4">
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
