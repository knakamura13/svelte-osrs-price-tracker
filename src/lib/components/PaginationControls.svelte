<script lang="ts">
    export let page: number = 1;
    export let pageSize: number = 25;
    export let totalRows: number = 0;
    export let onPageChange: ((page: number) => void) | undefined;
    export let onPageSizeChange: ((pageSize: number) => void) | undefined;

    // Only show pagination if we have data and callbacks
    $: showPagination = onPageChange && onPageSizeChange && totalRows > 0;
</script>

{#if showPagination}
    <div class="flex items-center justify-between py-2">
        <div class="flex gap-2 items-center text-sm">
            <label for="page-size">Rows per page</label>
            <select
                id="page-size"
                class="border p-1"
                bind:value={pageSize}
                on:change={() => onPageSizeChange && onPageSizeChange(pageSize)}
            >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
            </select>
        </div>
        <div class="flex gap-3 items-center text-sm">
            <span class="opacity-70">
                Page {page} of {Math.max(1, Math.ceil(totalRows / pageSize))} ({totalRows} items)
            </span>
            <button class="border px-2 py-1" on:click={() => onPageChange && onPageChange(Math.max(1, page - 1))}
                >Prev</button
            >
            <button
                class="border px-2 py-1"
                on:click={() => onPageChange && onPageChange(Math.min(Math.ceil(totalRows / pageSize) || 1, page + 1))}
            >
                Next
            </button>
        </div>
    </div>
{/if}
