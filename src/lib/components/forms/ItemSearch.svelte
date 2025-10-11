<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { PriceRow } from '$lib/types';
    import { goto } from '$app/navigation';

    export let items: PriceRow[] = [];
    export let placeholder: string = 'Search for an item...';

    let searchQuery: string = '';
    let showDropdown: boolean = false;
    let searchInput: HTMLInputElement;

    const dispatch = createEventDispatcher();

    // Search function that returns top 10 matches in ascending alphanumeric order
    $: searchResults = searchQuery.trim()
        ? items
              .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .sort((a, b) => a.name.localeCompare(b.name))
              .slice(0, 10)
        : [];

    $: showDropdown = searchQuery.trim().length > 0;

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        searchQuery = target.value;
        dispatch('search', searchQuery);
    }

    function handleFocus() {
        if (searchQuery.trim() && searchResults.length > 0) {
            showDropdown = true;
        }
    }

    function handleBlur() {
        // Delay hiding dropdown to allow for clicks on results
        setTimeout(() => {
            showDropdown = false;
        }, 150);
    }

    function selectItem(item: PriceRow) {
        searchQuery = item.name;
        showDropdown = false;
        dispatch('select', item);
        goto(`/item/${item.id}`);
    }

    function clearSearch() {
        searchQuery = '';
        showDropdown = false;
        searchInput?.focus();
        dispatch('search', '');
    }

    // Handle keyboard navigation
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            showDropdown = false;
            searchInput?.blur();
        } else if (event.key === 'Enter' && searchResults.length > 0) {
            selectItem(searchResults[0]);
        }
    }
</script>

<div class="relative w-full max-w-md">
    <div class="relative">
        <input
            bind:this={searchInput}
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            {placeholder}
            value={searchQuery}
            on:input={handleInput}
            on:focus={handleFocus}
            on:blur={handleBlur}
            on:keydown={handleKeydown}
            autocomplete="off"
        />

        {#if searchQuery}
            <button
                type="button"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                on:click={clearSearch}
                aria-label="Clear search"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        {/if}
    </div>

    {#if showDropdown}
        <div
            class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-auto"
        >
            {#each searchResults as item}
                <button
                    type="button"
                    class="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    on:click={() => selectItem(item)}
                >
                    <div class="flex items-center">
                        {#if item.icon}
                            <img src={item.icon} alt="" class="w-6 h-6 mr-3 rounded" />
                        {/if}
                        <span class="text-sm text-gray-900">{item.name}</span>
                    </div>
                </button>
            {/each}

            {#if searchQuery.trim() && searchResults.length === 0}
                <div class="px-3 py-2 text-sm text-gray-500">No items found</div>
            {/if}
        </div>
    {/if}
</div>

<style>
    /* Ensure dropdown appears above other content */
    :global(.relative:has(.absolute.z-50)) {
        position: relative;
        z-index: 50;
    }
</style>
