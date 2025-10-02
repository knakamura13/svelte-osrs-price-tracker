<script lang="ts">
    export let lastUpdatedLabel: string = '—';
    export let auto: boolean = false;
    export let refreshSec: number = 60;
    export let loading: boolean = false;
    export let onToggleAuto: ((v: boolean) => void) | undefined;
    export let onRefresh: (() => void) | undefined;
    export let onIntervalChange: ((v: number) => void) | undefined;
</script>

<section class="intro p-4 flex gap-4 items-end flex-wrap">
    <div class="grow">
        <h1 class="text-2xl font-semibold">OSRS Price Tracker</h1>
        <p class="text-base opacity-80">Real-time OSRS GE prices</p>
        <p class="text-xs opacity-70">Last updated: {lastUpdatedLabel}</p>
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
        <label class="flex gap-1 text-sm items-center">
            <span>Every</span>
            <input
                class="w-16 text-right border-none p-1"
                type="number"
                min="5"
                bind:value={refreshSec}
                on:change={(e) =>
                    onIntervalChange && onIntervalChange(Number((e.currentTarget as HTMLInputElement).value))}
            />
            <span>s</span>
        </label>
        <button
            class="border px-3 py-1 rounded items-center transition-colors hover:bg-gray-600 focus:bg-gray-600"
            on:click={() => onRefresh && onRefresh()}
            disabled={loading}>Refresh</button
        >
    </div>
</section>
