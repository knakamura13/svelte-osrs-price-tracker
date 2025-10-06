<script lang="ts">
    import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-svelte';

    export let page: number = 1;
    export let pageSize: number = 25;
    export let totalRows: number = 0;
    export let onPageChange: ((page: number) => void) | undefined;
    export let onPageSizeChange: ((pageSize: number) => void) | undefined;
    export let id: string = 'page-size';

    // Only show pagination if we have data and callbacks
    $: showPagination = onPageChange && onPageSizeChange && totalRows > 0;

    // Calculate total pages
    $: totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

    // Navigation functions
    function goToFirstPage() {
        if (onPageChange) onPageChange(1);
    }

    function goToPreviousPage() {
        if (onPageChange) onPageChange(Math.max(1, page - 1));
    }

    function goToNextPage() {
        if (onPageChange) onPageChange(Math.min(totalPages, page + 1));
    }

    function goToLastPage() {
        if (onPageChange) onPageChange(totalPages);
    }
</script>

{#if showPagination}
    <div class="flex items-center justify-between py-2">
        <div class="flex gap-2 items-center text-sm">
            <label for={id}>Rows per page</label>
            <select
                {id}
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
                Page {page} of {totalPages} ({totalRows} items)
            </span>
            <div class="flex gap-1">
                <button
                    class="border px-2 py-1 h-8 transition-colors hover:bg-gray-600 focus:bg-gray-600 disabled:!cursor-default disabled:hover:!bg-transparent disabled:focus:!bg-transparent"
                    class:!cursor-default={page === 1}
                    on:click={goToFirstPage}
                    disabled={page === 1}
                    title="First page"
                >
                    <ChevronsLeft size={16} />
                </button>
                <button
                    class="border px-2 py-1 h-8 transition-colors hover:bg-gray-600 focus:bg-gray-600 disabled:!cursor-default disabled:hover:!bg-transparent disabled:focus:!bg-transparent"
                    class:!cursor-default={page === 1}
                    on:click={goToPreviousPage}
                    disabled={page === 1}
                    title="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    class="border px-2 py-1 h-8 transition-colors hover:bg-gray-600 focus:bg-gray-600 disabled:!cursor-default disabled:hover:!bg-transparent disabled:focus:!bg-transparent"
                    on:click={goToNextPage}
                    disabled={page === totalPages}
                    title="Next page"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    class="border px-2 py-1 h-8 transition-colors hover:bg-gray-600 focus:bg-gray-600 disabled:!cursor-default disabled:hover:!bg-transparent disabled:focus:!bg-transparent"
                    on:click={goToLastPage}
                    disabled={page === totalPages}
                    title="Last page"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
