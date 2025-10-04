<script lang="ts">
    export let lastUpdatedLabel: string = '—';
    export let auto: boolean = false;
    export let onToggleAuto: ((v: boolean) => void) | undefined;
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
            <p class="text-sm opacity-80 font-medium">
                Last updated: <span class="text-blue-600 dark:text-blue-400">{lastUpdatedLabel}</span>
            </p>
        </div>
    </div>
    <div class="flex gap-3 items-center">
        <label class="flex gap-1 text-sm items-center">
            Auto-refresh
            <input
                type="checkbox"
                class="cursor-pointer"
                bind:checked={auto}
                on:change={() => onToggleAuto && onToggleAuto(auto)}
            />
        </label>
        <span class="text-sm opacity-80">Every 60s</span>
    </div>
</section>
