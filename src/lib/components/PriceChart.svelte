<script lang="ts">
    import type { TimeseriesDataPoint } from '$lib/types';
    import { formatInt } from '$lib/utils/format';

    export let data: TimeseriesDataPoint[] = [];
    export let itemName: string = '';

    // Filter out data points with no prices
    $: validData = data.filter((d) => d.avgHighPrice !== null || d.avgLowPrice !== null);

    // Calculate chart dimensions and scales
    $: chartWidth = 800;
    $: chartHeight = 400;
    $: padding = { top: 20, right: 60, bottom: 60, left: 80 };
    $: innerWidth = chartWidth - padding.left - padding.right;
    $: innerHeight = chartHeight - padding.top - padding.bottom;

    // Get min/max for scaling
    $: prices = validData.flatMap((d) => [d.avgHighPrice, d.avgLowPrice]).filter((p) => p !== null) as number[];
    $: minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    $: maxPrice = prices.length > 0 ? Math.max(...prices) : 100;
    $: priceRange = maxPrice - minPrice || 1;
    
    $: minTime = validData.length > 0 ? validData[0].timestamp : 0;
    $: maxTime = validData.length > 0 ? validData[validData.length - 1].timestamp : 1;
    $: timeRange = maxTime - minTime || 1;

    // Scale functions
    const scaleX = (timestamp: number) => ((timestamp - minTime) / timeRange) * innerWidth;
    const scaleY = (price: number) => innerHeight - ((price - minPrice) / priceRange) * innerHeight;

    // Generate SVG path for prices
    $: buyPath = validData
        .filter((d) => d.avgHighPrice !== null)
        .map((d, i) => {
            const x = scaleX(d.timestamp);
            const y = scaleY(d.avgHighPrice!);
            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(' ');

    $: sellPath = validData
        .filter((d) => d.avgLowPrice !== null)
        .map((d, i) => {
            const x = scaleX(d.timestamp);
            const y = scaleY(d.avgLowPrice!);
            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(' ');

    // Format timestamp for axis labels
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Generate Y-axis ticks
    $: yTicks = Array.from({ length: 6 }, (_, i) => {
        return minPrice + (priceRange / 5) * i;
    });

    // Generate X-axis ticks (every 4 hours for 24h data)
    $: xTicks = validData.length > 0
        ? validData.filter((_, i) => i % Math.max(1, Math.floor(validData.length / 6)) === 0)
        : [];
</script>

<div class="chart-container bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
    <h3 class="text-lg font-semibold mb-4 text-center">Price History - {itemName}</h3>
    
    {#if validData.length === 0}
        <div class="flex items-center justify-center h-96">
            <p class="text-gray-500">No price data available</p>
        </div>
    {:else}
        <svg
            width={chartWidth}
            height={chartHeight}
            class="mx-auto"
            viewBox="0 0 {chartWidth} {chartHeight}"
        >
            <!-- Chart area -->
            <g transform="translate({padding.left}, {padding.top})">
                <!-- Grid lines -->
                {#each yTicks as tick}
                    <line
                        x1="0"
                        y1={scaleY(tick)}
                        x2={innerWidth}
                        y2={scaleY(tick)}
                        stroke="currentColor"
                        stroke-opacity="0.1"
                        stroke-width="1"
                    />
                {/each}

                <!-- Price lines -->
                <path
                    d={buyPath}
                    fill="none"
                    stroke="#f97316"
                    stroke-width="2"
                    class="buy-line"
                />
                <path
                    d={sellPath}
                    fill="none"
                    stroke="#10b981"
                    stroke-width="2"
                    class="sell-line"
                />

                <!-- Y-axis -->
                <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={innerHeight}
                    stroke="currentColor"
                    stroke-width="2"
                />

                <!-- Y-axis labels -->
                {#each yTicks as tick}
                    <text
                        x="-10"
                        y={scaleY(tick)}
                        text-anchor="end"
                        dominant-baseline="middle"
                        class="text-xs fill-current"
                    >
                        {formatInt(Math.round(tick))}
                    </text>
                {/each}

                <!-- X-axis -->
                <line
                    x1="0"
                    y1={innerHeight}
                    x2={innerWidth}
                    y2={innerHeight}
                    stroke="currentColor"
                    stroke-width="2"
                />

                <!-- X-axis labels -->
                {#each xTicks as tick}
                    <text
                        x={scaleX(tick.timestamp)}
                        y={innerHeight + 20}
                        text-anchor="middle"
                        class="text-xs fill-current"
                    >
                        {formatTime(tick.timestamp)}
                    </text>
                {/each}

                <!-- Axis labels -->
                <text
                    x={innerWidth / 2}
                    y={innerHeight + 50}
                    text-anchor="middle"
                    class="text-sm fill-current font-medium"
                >
                    Time (5-minute intervals)
                </text>
                <text
                    x={-innerHeight / 2}
                    y="-60"
                    text-anchor="middle"
                    transform="rotate(-90)"
                    class="text-sm fill-current font-medium"
                >
                    Price (gp)
                </text>
            </g>
        </svg>

        <!-- Legend -->
        <div class="flex justify-center gap-6 mt-4">
            <div class="flex items-center gap-2">
                <div class="w-8 h-0.5 bg-orange-500"></div>
                <span class="text-sm">Buy Price (High)</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-8 h-0.5 bg-green-500"></div>
                <span class="text-sm">Sell Price (Low)</span>
            </div>
        </div>
    {/if}
</div>

<style>
    .buy-line,
    .sell-line {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
</style>

