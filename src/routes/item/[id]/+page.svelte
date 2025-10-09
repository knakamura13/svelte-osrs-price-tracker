<script lang="ts">
    import type { PageData } from './$types';
    import PriceChart from '$lib/components/charts/PriceChart.svelte';
    import { formatInt, formatPrice } from '$lib/utils/format';
    import { secondsAgoFromUnix } from '$lib/utils/time';
    import { calculatePostTaxProfit } from '$lib/utils/tax';
    import { settingsStore } from '$lib/utils/settings';
    import { Star, DollarSign, ArrowLeft, ChevronDown } from 'lucide-svelte';

    export let data: PageData;

    $: item = data.item;
    $: timeseries = data.timeseries;
    $: settings = $settingsStore;

    // Tooltip titles for stats
    const statTitles = {
        'insta-buy-price':
            'The current insta-buy price for this item from the Grand Exchange. This is also sometimes referred to as the "Slow-sell price", since it is the highest price you could currently sell the item for.',
        'insta-sell-price':
            'The current insta-sell price for this item on the Grand Exchange. This is also sometimes referred to as the "Slow-buy price", since it is the lowest price you could currently buy the item for.',
        'daily-volume': 'The number of items traded in the last 24 hours.',
        'post-tax-profit':
            "Your profit if you buy at 'Insta-sell price' and sell at 'Insta-buy price', after GE tax (2% rounded down, capped at 5M gp).",
        'post-tax-profit-avg':
            "Your profit if you buy at 'Avg sell (24h)' and sell at 'Avg buy (24h)', after GE tax (2% rounded down, capped at 5M gp).",
        'potential-profit':
            'The total profit if you buy and sell at the buy limit quantity, calculated using insta-buy/sell prices after GE tax (2% rounded down, capped at 5M gp).',
        'potential-profit-avg':
            'The total profit using daily volume x post-tax profit (avg), calculated using average buy/sell prices after GE tax (2% rounded down, capped at 5M gp).',
        'daily-low': 'The lowest price the item was traded for in the past 24 hours.',
        'daily-high': 'The highest price the item was traded for in the past 24 hours.',
        'avg-buy-24h': 'The mean of all insta-buy price values in the past 24 hours.',
        'avg-sell-24h': 'The mean of all insta-sell price values in the past 24 hours.',
        'buy-limit': 'The maximum number of items you can buy in 4 hours.',
        'high-alch': 'The price you receive when using High Level Alchemy on this item.',
        'low-alch': 'The price you receive when using Low Level Alchemy on this item.',
        members: 'Whether this item is members-only or available to free-to-play players.',
        examine: 'The examine text for this item as it appears in-game.'
    };

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
    $: postTaxProfit = calculatePostTaxProfit(item.buyPrice, item.sellPrice, item.id);
    $: potentialProfit = item.buyLimit && postTaxProfit ? item.buyLimit * postTaxProfit : null;
    $: postTaxProfitAvg = calculatePostTaxProfit(item.averageBuy ?? null, item.averageSell ?? null, item.id);
    $: potentialProfitAvg = postTaxProfitAvg && item.dailyVolume ? postTaxProfitAvg * item.dailyVolume : null;

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
            <ArrowLeft class="w-4 h-4" />
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
                <img src={item.icon} alt={item.name} class="w-16 h-16 object-contain" loading="lazy" />
            {/if}
            <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                    <h1 class="text-3xl font-bold">{item.name}</h1>
                    {#if item.members}
                        <Star class="w-5 h-5 text-yellow-500" />
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

    <!-- Stats grid - 3 columns -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column -->
            <div class="space-y-3">
                <!-- Buy price -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <DollarSign class="w-5 h-5" />
                        <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['insta-buy-price']}
                            >Insta-buy price:</span
                        >
                    </div>
                    <div class="text-right">
                        <div
                            class="text-lg font-bold text-orange-600 dark:text-orange-400"
                            title={statTitles['insta-buy-price']}
                        >
                            {item.buyPrice !== null
                                ? formatPrice(item.buyPrice, settings.decimalView, settings.decimalPlaces)
                                : '—'}
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
                        <DollarSign class="w-5 h-5" />
                        <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['insta-sell-price']}
                            >Insta-sell price:</span
                        >
                    </div>
                    <div class="text-right">
                        <div
                            class="text-lg font-bold text-green-600 dark:text-green-400"
                            title={statTitles['insta-sell-price']}
                        >
                            {item.sellPrice !== null
                                ? formatPrice(item.sellPrice, settings.decimalView, settings.decimalPlaces)
                                : '—'}
                        </div>
                        {#if item.sellTime}
                            <div class="text-xs text-gray-500">
                                Last trade: {secondsAgoFromUnix(item.sellTime)}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Divider -->
            <div class="w-full h-px bg-gray-200 dark:bg-gray-700 lg:hidden"></div>

            <!-- Middle Column -->
            <div class="space-y-3">
                <!-- Daily volume -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['daily-volume']}
                        >Daily volume:</span
                    >
                    <div class="text-right">
                        <div
                            class="text-lg font-bold text-orange-600 dark:text-orange-400"
                            title={statTitles['daily-volume']}
                        >
                            {item.dailyVolume !== null
                                ? formatPrice(item.dailyVolume, settings.decimalView, settings.decimalPlaces)
                                : '—'}
                        </div>
                    </div>
                </div>

                <!-- Post-tax profit -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['post-tax-profit']}
                        >Post-tax profit:</span
                    >
                    <div
                        class="text-lg font-bold text-green-600 dark:text-green-400"
                        title={statTitles['post-tax-profit']}
                    >
                        {postTaxProfit !== null
                            ? formatPrice(postTaxProfit, settings.decimalView, settings.decimalPlaces)
                            : '—'}
                    </div>
                </div>

                <!-- Potential profit -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['potential-profit']}
                        >Potential profit:</span
                    >
                    <div
                        class="text-lg font-bold text-green-600 dark:text-green-400"
                        title={statTitles['potential-profit']}
                    >
                        {potentialProfit !== null
                            ? formatPrice(potentialProfit, settings.decimalView, settings.decimalPlaces)
                            : '—'}
                    </div>
                </div>

                <!-- Post-tax profit (avg) -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['post-tax-profit-avg']}
                        >Post-tax profit (avg):</span
                    >
                    <div
                        class="text-lg font-bold text-green-600 dark:text-green-400"
                        title={statTitles['post-tax-profit-avg']}
                    >
                        {postTaxProfitAvg !== null
                            ? formatPrice(postTaxProfitAvg, settings.decimalView, settings.decimalPlaces)
                            : '—'}
                    </div>
                </div>

                <!-- Potential profit (avg) -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['potential-profit-avg']}
                        >Potential profit (avg):</span
                    >
                    <div
                        class="text-lg font-bold text-green-600 dark:text-green-400"
                        title={statTitles['potential-profit-avg']}
                    >
                        {potentialProfitAvg !== null
                            ? formatPrice(potentialProfitAvg, settings.decimalView, settings.decimalPlaces)
                            : '—'}
                    </div>
                </div>

                <!-- Daily low -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['daily-low']}
                        >Daily low:</span
                    >
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400" title={statTitles['daily-low']}>
                        {item.dailyLow !== null && item.dailyLow !== undefined
                            ? formatPrice(item.dailyLow, settings.decimalView, settings.decimalPlaces)
                            : '—'}
                    </div>
                </div>

                <!-- Daily high -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['daily-high']}
                        >Daily high:</span
                    >
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400" title={statTitles['daily-high']}>
                        {item.dailyHigh !== null && item.dailyHigh !== undefined
                            ? formatPrice(item.dailyHigh, settings.decimalView, settings.decimalPlaces)
                            : '—'}
                    </div>
                </div>

                <!-- Average buy -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['avg-buy-24h']}
                        >Avg buy (24h):</span
                    >
                    <div
                        class="text-lg font-bold text-purple-600 dark:text-purple-400"
                        title={statTitles['avg-buy-24h']}
                    >
                        {item.averageBuy !== null && item.averageBuy !== undefined
                            ? formatPrice(item.averageBuy, settings.decimalView, settings.decimalPlaces)
                            : '—'}
                    </div>
                </div>

                <!-- Average sell -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['avg-sell-24h']}
                        >Avg sell (24h):</span
                    >
                    <div
                        class="text-lg font-bold text-purple-600 dark:text-purple-400"
                        title={statTitles['avg-sell-24h']}
                    >
                        {item.averageSell !== null && item.averageSell !== undefined
                            ? formatPrice(item.averageSell, settings.decimalView, settings.decimalPlaces)
                            : '—'}
                    </div>
                </div>
            </div>

            <!-- Divider -->
            <div class="w-full h-px bg-gray-200 dark:bg-gray-700 lg:hidden"></div>

            <!-- Right Column -->
            <div class="space-y-3">
                <!-- Buy limit -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['buy-limit']}
                        >Buy limit:</span
                    >
                    <div class="text-lg font-bold" title={statTitles['buy-limit']}>
                        {item.buyLimit !== null
                            ? formatPrice(item.buyLimit, settings.decimalView, settings.decimalPlaces)
                            : '∞'}
                    </div>
                </div>

                <!-- High alch -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['high-alch']}
                        >High alch:</span
                    >
                    <div class="text-right">
                        <div class="text-lg font-bold" title={statTitles['high-alch']}>
                            {item.highalch !== null
                                ? formatPrice(item.highalch, settings.decimalView, settings.decimalPlaces)
                                : '—'}
                        </div>
                        {#if item.highalch !== null && item.highalch !== undefined && item.sellPrice !== null}
                            <div class="text-xs text-red-600 dark:text-red-400">
                                ({formatPrice(
                                    item.highalch - item.sellPrice,
                                    settings.decimalView,
                                    settings.decimalPlaces
                                )})
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Low alch -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['low-alch']}
                        >Low alch:</span
                    >
                    <div class="text-lg font-bold" title={statTitles['low-alch']}>
                        {item.lowalch !== null
                            ? formatPrice(item.lowalch, settings.decimalView, settings.decimalPlaces)
                            : '—'}
                    </div>
                </div>

                <!-- Members -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['members']}>Members:</span>
                    <div
                        class="text-lg"
                        title={item.members ? 'This is a members-only item' : 'This is a free-to-play item'}
                    >
                        {#if item.members}
                            <Star class="w-5 h-5 text-yellow-500" />
                        {:else}
                            <Star class="w-5 h-5 grayscale opacity-50" />
                        {/if}
                    </div>
                </div>

                <!-- Examine -->
                {#if item.examine}
                    <div class="flex items-start justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400" title={statTitles['examine']}
                            >Examine:</span
                        >
                        <div class="text-right max-w-xs">
                            <div class="text-sm italic text-gray-700 dark:text-gray-300" title={statTitles['examine']}>
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
                    <ChevronDown class="w-4 h-4 text-gray-600 dark:text-gray-300" />
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
