<script lang="ts">
    export let lastUpdatedLabel: string = '—';
    export let backgroundRefreshing: boolean = false;
</script>

<section class="intro p-4 flex gap-4 items-end flex-wrap">
    <div class="grow">
        <h1 class="text-2xl font-semibold">OSRS Price Tracker</h1>
        <p class="text-base opacity-80">Real-time OSRS GE prices</p>
        <div class="mt-1 flex items-center gap-2">
            <svg class="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
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
</section>
