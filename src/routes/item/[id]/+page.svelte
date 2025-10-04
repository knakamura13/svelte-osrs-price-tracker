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
    let timeRange: '5m' | '1h' | '6h' | '1y' = '5m'; // 5m = 24h, 1h = 7d, 6h = 30d, 1y = 1 year
    $: timeseriesData = timeseries; // Make reactive to initial data
    let loading = false;

    // Fetch new data when time range changes
    async function fetchTimeseriesData(range: '5m' | '1h' | '6h' | '1y') {
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
    async function handleTimeRangeChange(range: '5m' | '1h' | '6h' | '1y') {
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

    <!-- Stats grid - 3 columns as shown in screenshot -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column -->
            <div class="space-y-3">
                <!-- Buy price -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">💰</span>
                        <span class="text-sm text-gray-600 dark:text-gray-400">Insta-buy price:</span>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {item.buyPrice !== null ? formatInt(item.buyPrice) : '—'}
                        </div>
                        {#if item.buyTime}
                            <div class="text-xs text-gray-500">
                                Last trade: {secondsAgoFromUnix(item.buyTime)}
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Sell price -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">💰</span>
                        <span class="text-sm text-gray-600 dark:text-gray-400">Insta-sell price:</span>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-green-600 dark:text-green-400">
                            {item.sellPrice !== null ? formatInt(item.sellPrice) : '—'}
                        </div>
                        {#if item.sellTime}
                            <div class="text-xs text-gray-500">
                                Last trade: {secondsAgoFromUnix(item.sellTime)}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Middle Column -->
            <div class="space-y-3">
                <!-- Daily volume -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Daily volume:</span>
                    <div class="text-right">
                        <div class="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {item.dailyVolume !== null ? formatInt(item.dailyVolume) : '—'}
                        </div>
                    </div>
                </div>

                <!-- Potential profit -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Potential profit:</span>
                    <div class="text-lg font-bold text-green-600 dark:text-green-400">
                        {postTaxProfit !== null ? formatInt(postTaxProfit) : '—'}
                    </div>
                </div>

                <!-- Margin × volume -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Margin × volume:</span>
                    <div class="text-lg font-bold text-green-600 dark:text-green-400">
                        {marginVolume || '—'}
                    </div>
                </div>

                <!-- ROI -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">ROI:</span>
                    <div class="text-lg font-bold text-green-600 dark:text-green-400">
                        {roi !== null ? `${roi}%` : '—'}
                    </div>
                </div>

                <!-- Daily low -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Daily low:</span>
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {item.dailyLow !== null && item.dailyLow !== undefined ? formatInt(item.dailyLow) : '—'}
                    </div>
                </div>

                <!-- Daily high -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Daily high:</span>
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {item.dailyHigh !== null && item.dailyHigh !== undefined ? formatInt(item.dailyHigh) : '—'}
                    </div>
                </div>

                <!-- Average buy -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Avg buy (24h):</span>
                    <div class="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {item.averageBuy !== null && item.averageBuy !== undefined ? formatInt(item.averageBuy) : '—'}
                    </div>
                </div>

                <!-- Average sell -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Avg sell (24h):</span>
                    <div class="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {item.averageSell !== null && item.averageSell !== undefined
                            ? formatInt(item.averageSell)
                            : '—'}
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-3">
                <!-- Buy limit -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Buy limit:</span>
                    <div class="text-lg font-bold">
                        {item.buyLimit !== null ? formatInt(item.buyLimit) : '∞'}
                    </div>
                </div>

                <!-- High alch -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">High alch:</span>
                    <div class="text-right">
                        <div class="text-lg font-bold">
                            {item.highalch !== null ? formatInt(item.highalch) : '—'}
                        </div>
                        {#if item.highalch !== null && item.highalch !== undefined && item.sellPrice !== null}
                            <div class="text-xs text-red-600 dark:text-red-400">
                                ({formatInt(item.highalch - item.sellPrice)})
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Low alch -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Low alch:</span>
                    <div class="text-lg font-bold">
                        {item.lowalch !== null ? formatInt(item.lowalch) : '—'}
                    </div>
                </div>

                <!-- Members -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Members:</span>
                    <div class="text-lg">
                        {#if item.members}
                            <span class="text-yellow-500">⭐</span>
                        {:else}
                            <span class="grayscale">⭐</span>
                        {/if}
                    </div>
                </div>

                <!-- Examine -->
                {#if item.examine}
                    <div class="flex items-start justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Examine:</span>
                        <div class="text-right max-w-xs">
                            <div class="text-sm italic text-gray-700 dark:text-gray-300">
                                {item.examine}
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Price chart -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <!-- Time range selector -->
        <div class="flex justify-end mb-6">
            <div class="relative">
                <select
                    class="px-4 py-2 rounded transition-colors bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
                    bind:value={timeRange}
                    on:change={(e) => {
                        if (e.target) {
                            handleTimeRangeChange((e.target as HTMLSelectElement).value as '5m' | '1h' | '6h' | '1y');
                        }
                    }}
                    disabled={loading}
                >
                    <option value="5m">24 Hours</option>
                    <option value="1h">7 Days</option>
                    <option value="6h">30 Days</option>
                    <option value="1y">1 Year</option>
                </select>
                <div class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                        class="w-4 h-4 text-gray-600 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
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
