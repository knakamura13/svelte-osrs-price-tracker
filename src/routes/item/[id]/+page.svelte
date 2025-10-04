<script lang="ts">
    import type { PageData } from './$types';
    import PriceChart from '$lib/components/PriceChart.svelte';
    import { formatInt } from '$lib/utils/format';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import { calculatePostTaxProfit } from '$lib/utils/tax';

    export let data: PageData;

    $: item = data.item;
    $: timeseries = data.timeseries;

    // Time range state
    let timeRange: '5m' | '1h' | '6h' = '5m'; // 5m = 24h, 1h = 7d, 6h = 30d
    $: timeseriesData = timeseries; // Make reactive to initial data
    let loading = false;

    // Fetch new data when time range changes
    async function fetchTimeseriesData(range: '5m' | '1h' | '6h') {
        loading = true;
        try {
            const res = await fetch(`/api/timeseries?id=${item.id}&timestep=${range}`);
            if (res.ok) {
                const data = await res.json();
                timeseriesData = data.data || [];
            }
        } catch (err) {
            console.error('Failed to fetch timeseries:', err);
        } finally {
            loading = false;
        }
    }

    // Handle time range change
    async function handleTimeRangeChange(range: '5m' | '1h' | '6h') {
        timeRange = range;
        await fetchTimeseriesData(range);
    }

    // Calculate stats
    $: margin = item.buyPrice && item.sellPrice ? item.buyPrice - item.sellPrice : null;
    $: postTaxProfit = calculatePostTaxProfit(item.buyPrice, item.sellPrice, item.id);
    $: roi = item.sellPrice && postTaxProfit ? ((postTaxProfit / item.sellPrice) * 100).toFixed(2) : null;
    $: marginVolume = margin && item.dailyVolume ? formatInt(margin * item.dailyVolume) : null;

    // Check if low volume
    $: isLowVolume = item.dailyVolume !== null && item.dailyVolume !== undefined && item.dailyVolume < 100;
</script>

<svelte:head>
    <title>{item.name} - OSRS Price Tracker</title>
</svelte:head>

<div class="container mx-auto px-4 py-6 max-w-7xl">
    <!-- Back navigation -->
    <div class="mb-4">
        <a href="/" class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to all items
        </a>
    </div>

    <!-- Low volume warning -->
    {#if isLowVolume}
        <div
            class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg mb-6"
        >
            <p class="font-medium">
                This is a low volume item. The prices displayed here may fluctuate dramatically, or be somewhat
                inaccurate given the low amount of trades per day.
            </p>
        </div>
    {/if}

    <!-- Item header -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div class="flex items-start gap-4">
            {#if item.icon}
                <img src={item.icon} alt={item.name} class="w-16 h-16 object-contain" />
            {/if}
            <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                    <h1 class="text-3xl font-bold">{item.name}</h1>
                    {#if item.members}
                        <span class="text-yellow-500" title="Members only">⭐</span>
                    {/if}
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Item ID: {item.id}</p>
                {#if item.examine}
                    <p class="text-sm italic text-gray-700 dark:text-gray-300 mt-2">{item.examine}</p>
                {/if}
            </div>
            <div class="flex gap-2">
                {#if item.wikiUrl}
                    <a
                        href={item.wikiUrl}
                        target="_blank"
                        rel="noreferrer"
                        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                    >
                        Wiki
                    </a>
                {/if}
                <a
                    href="https://prices.runescape.wiki/osrs/item/{item.id}"
                    target="_blank"
                    rel="noreferrer"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                    GEDB
                </a>
            </div>
        </div>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Buy price -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">💰 Buy price</div>
            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {item.buyPrice !== null ? formatInt(item.buyPrice) : '—'}
                <span class="text-sm font-normal text-gray-600 dark:text-gray-400">coins</span>
            </div>
            {#if item.buyTime}
                <div class="text-xs text-gray-500 mt-1">
                    Last trade: {secondsAgoFromUnix(item.buyTime)}
                </div>
            {/if}
        </div>

        <!-- Sell price -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">💰 Sell price</div>
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {item.sellPrice !== null ? formatInt(item.sellPrice) : '—'}
                <span class="text-sm font-normal text-gray-600 dark:text-gray-400">coins</span>
            </div>
            {#if item.sellTime}
                <div class="text-xs text-gray-500 mt-1">
                    Last trade: {secondsAgoFromUnix(item.sellTime)}
                </div>
            {/if}
        </div>

        <!-- Daily volume -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Daily volume</div>
            <div class="text-2xl font-bold">
                {item.dailyVolume !== null ? formatInt(item.dailyVolume) : '—'}
            </div>
            <div class="text-xs text-gray-500 mt-1">Based on official OSRS GEDB</div>
        </div>

        <!-- Buy limit -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Buy limit</div>
            <div class="text-2xl font-bold">
                {item.buyLimit !== null ? formatInt(item.buyLimit) : '∞'}
            </div>
            <div class="text-xs text-gray-500 mt-1">
                {item.buyLimit !== null ? 'Per 4 hours' : 'No limit'}
            </div>
        </div>
    </div>

    <!-- Profit stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Margin</div>
            <div class="text-xl font-bold {margin && margin > 0 ? 'text-green-600 dark:text-green-400' : ''}">
                {margin !== null ? formatInt(margin) : '—'}
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Potential profit
                <span class="text-xs opacity-70" title="After 2% GE tax">(?)</span>
            </div>
            <div
                class="text-xl font-bold {postTaxProfit && postTaxProfit > 0
                    ? 'text-green-600 dark:text-green-400'
                    : postTaxProfit && postTaxProfit < 0
                      ? 'text-red-600 dark:text-red-400'
                      : ''}"
            >
                {postTaxProfit !== null ? formatInt(postTaxProfit) : '—'}
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Margin × volume</div>
            <div class="text-xl font-bold">
                {marginVolume || '—'}
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">ROI</div>
            <div class="text-xl font-bold">
                {roi !== null ? `${roi}%` : '—'}
            </div>
        </div>
    </div>

    <!-- Price chart -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <!-- Time range selector -->
        <div class="flex justify-center gap-2 mb-6">
            <button
                class="px-4 py-2 rounded transition-colors {timeRange === '5m'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}"
                on:click={() => handleTimeRangeChange('5m')}
                disabled={loading}
            >
                24 Hours
            </button>
            <button
                class="px-4 py-2 rounded transition-colors {timeRange === '1h'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}"
                on:click={() => handleTimeRangeChange('1h')}
                disabled={loading}
            >
                7 Days
            </button>
            <button
                class="px-4 py-2 rounded transition-colors {timeRange === '6h'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}"
                on:click={() => handleTimeRangeChange('6h')}
                disabled={loading}
            >
                30 Days
            </button>
        </div>

        {#if loading}
            <div class="flex items-center justify-center h-96">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        {:else}
            <PriceChart data={timeseriesData} itemName={item.name} {timeRange} />
        {/if}
    </div>
</div>
