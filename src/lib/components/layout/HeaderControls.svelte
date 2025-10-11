<script lang="ts">
    import { Clock } from 'lucide-svelte';
    import ItemSearch from '$lib/components/forms/ItemSearch.svelte';
    import type { PriceRow } from '$lib/types';

    export let lastUpdatedLabel: string = '—';
    export let backgroundRefreshing: boolean = false;
    export let allItems: PriceRow[] = [];
</script>

<section class="intro p-4 flex gap-4 items-end flex-wrap">
    <div class="grow">
        <h1 class="text-2xl font-semibold">OSRS Price Tracker</h1>
        <p class="text-base opacity-80">Real-time OSRS GE prices</p>
        <div class="mt-1 flex items-center gap-2">
            <Clock class="w-4 h-4 opacity-60" aria-hidden="true" />
            <div class="text-sm opacity-80 font-medium">
                <span>Last updated: <span class="text-blue-600 dark:text-blue-400">{lastUpdatedLabel}</span></span>
                {#if backgroundRefreshing}
                    <span class="ml-2 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <div class="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent"></div>
                        <span class="text-xs">Refreshing</span>
                    </span>
                {/if}
            </div>
        </div>
    </div>

    <div class="w-full lg:w-auto">
        <ItemSearch items={allItems} />
    </div>
</section>
