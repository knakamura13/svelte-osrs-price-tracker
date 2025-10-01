<script lang="ts">
    import PriceTable from '$lib/components/PriceTable.svelte';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import type { PriceRow } from '$lib/types';

    type SortKey = 'name' | 'buyPrice' | 'sellPrice' | 'margin' | 'buyTime' | 'sellTime';

    let search = '';
    let sortKey: SortKey = 'margin';
    let sortDir: 'asc' | 'desc' = 'desc';
    let page = 1;
    let pageSize = 25;
    let auto = false;
    let refreshSec = 60;

    let allRows: PriceRow[] = [];

    async function loadRows() {
        const res = await fetch('/api/rows');
        if (!res.ok) return;
        const data = await res.json();
        allRows = data.rows as PriceRow[];
    }

    function filteredSorted(): PriceRow[] {
        let rows = allRows;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) => r.name.toLowerCase().includes(q));
        }
        rows = [...rows].sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1;
            const va = (a as any)[sortKey];
            const vb = (b as any)[sortKey];
            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;
            if (typeof va === 'string' && typeof vb === 'string') return dir * va.localeCompare(vb);
            return dir * (va - vb);
        });
        return rows;
    }

    $effect(() => {
        loadRows();
    });

    let timer: any;
    $effect(() => {
        clearInterval(timer);
        if (auto) {
            timer = setInterval(loadRows, Math.max(5, refreshSec) * 1000);
        }
        return () => clearInterval(timer);
    });

    function setSort(key: SortKey) {
        if (sortKey === key) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            sortKey = key;
            sortDir = key === 'name' ? 'asc' : 'desc';
        }
    }

    let rows: PriceRow[] = $derived(filteredSorted());
</script>

<svelte:head>
    <title>OSRS Price Tracker</title>
</svelte:head>

<div class="page" id="home">
    <section class="intro p-4 flex gap-4 items-end flex-wrap">
        <div class="grow">
            <h1 class="text-2xl font-semibold">OSRS Price Tracker</h1>
            <p class="text-base opacity-80">Real-time GE prices with search, sort, pagination, and auto‑refresh.</p>
        </div>
        <div class="flex gap-3 items-center">
            <label class="text-sm">Auto‑refresh <input type="checkbox" bind:checked={auto} /></label>
            <label class="text-sm">Every <input class="w-16 text-right border p-1" type="number" min="5" bind:value={refreshSec} /> s</label>
            <button class="border px-3 py-1 rounded" on:click={loadRows}>Refresh</button>
        </div>
    </section>

    <section class="px-4 pb-2">
        <input
            class="border rounded p-2 w-full md:w-80"
            placeholder="Search for an item..."
            bind:value={search}
        />
    </section>

    {#key `${search}-${sortKey}-${sortDir}-${page}-${pageSize}-${allRows.length}`}
            <section class="px-4">
                <div class="flex items-center justify-between py-2">
                    <div class="flex gap-2 items-center text-sm">
                        <label>Rows per page</label>
                        <select class="border p-1" bind:value={pageSize} on:change={() => (page = 1)}>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={250}>250</option>
                        </select>
                    </div>
                    <div class="flex gap-2 items-center text-sm">
                        <button class="border px-2 py-1" on:click={() => (page = Math.max(1, page - 1))}>Prev</button>
                        <span>Page {page}</span>
                        <button
                            class="border px-2 py-1"
                            on:click={() => (page = Math.min(Math.ceil(rows.length / pageSize) || 1, page + 1))}
                        >
                            Next
                        </button>
                    </div>
                </div>

                <div class="overflow-auto rounded border border-gray-300 dark:border-gray-700">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th class="text-left p-2 cursor-pointer" on:click={() => setSort('name')}>Name</th>
                                <th class="text-right p-2">Buy limit</th>
                                <th class="text-right p-2 cursor-pointer" on:click={() => setSort('buyPrice')}>Buy price</th>
                                <th class="text-right p-2 cursor-pointer" on:click={() => setSort('buyTime')}>Most recent buy</th>
                                <th class="text-right p-2 cursor-pointer" on:click={() => setSort('sellPrice')}>Sell price</th>
                                <th class="text-right p-2 cursor-pointer" on:click={() => setSort('sellTime')}>Most recent sell</th>
                                <th class="text-right p-2 cursor-pointer" on:click={() => setSort('margin')}>Margin</th>
                                <th class="text-right p-2">Daily volume</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize) as r (r.id)}
                                <tr class="border-t border-gray-200 dark:border-gray-800">
                                    <td class="p-2 flex gap-2 items-center">
                                        {#if r.icon}
                                            <img src={r.icon} alt="" class="h-5 w-5" />
                                        {/if}
                                        <span>{r.name}</span>
                                    </td>
                                    <td class="p-2 text-right">{r.buyLimit ?? '—'}</td>
                                    <td class="p-2 text-right">{r.buyPrice ?? '—'}</td>
                                    <td class="p-2 text-right">{secondsAgoFromUnix(r.buyTime)}</td>
                                    <td class="p-2 text-right">{r.sellPrice ?? '—'}</td>
                                    <td class="p-2 text-right">{secondsAgoFromUnix(r.sellTime)}</td>
                                    <td class="p-2 text-right">{r.margin ?? '—'}</td>
                                    <td class="p-2 text-right">{r.dailyVolume ?? '—'}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </section>
    {/key}
</div>

<style lang="scss">
</style>
