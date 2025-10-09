<script lang="ts">
    import type { TimeseriesDataPoint } from '$lib/types';
    import { formatInt } from '$lib/utils/format';

    let {
        data = $bindable([]),
        timeRange = $bindable('5m'),
        minTime = 0,
        maxTime = 1,
        timeSpan = 1
    } = $props<{
        data: TimeseriesDataPoint[];
        timeRange: '5m' | '1h' | '6h' | '1y';
        minTime: number;
        maxTime: number;
        timeSpan: number;
    }>();

    // Mouse tracking
    let svgElement = $state<SVGSVGElement | undefined>(undefined);
    let mouseX = $state(0);
    let mouseY = $state(0);
    let hovering = $state(false);
    let hoveredPointIndex = $state(-1);

    // Calculate chart dimensions and scales
    const chartWidth = 1200;
    const chartHeight = 200;
    const padding = { top: 10, right: 60, bottom: 60, left: 140 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    // Add horizontal padding to prevent bars from bleeding past the axes
    const horizontalPadding = 10; // pixels of padding on each side
    const scalableWidth = innerWidth - 2 * horizontalPadding;

    // Get min/max volume for scaling
    const volumes = $derived(
        data
            .flatMap((d: TimeseriesDataPoint) => [d.highPriceVolume, d.lowPriceVolume])
            .filter((v: number | null) => v !== null) as number[]
    );
    const maxVolume = $derived(volumes.length > 0 ? Math.max(...volumes) : 100);

    // Scale functions with horizontal padding
    const scaleX = (timestamp: number) => horizontalPadding + ((timestamp - minTime) / timeSpan) * scalableWidth;
    const scaleY = (volume: number) => innerHeight - (volume / maxVolume) * innerHeight;

    // Calculate bar width based on data density
    const barWidth = $derived(data.length > 1 ? Math.min(6, scalableWidth / (data.length * 2.5)) : 4);

    // Format timestamp for axis labels based on time range
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);

        if (timeRange === '5m') {
            // 24 hours: show time only
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (timeRange === '1h') {
            // 7 days: show month/day and time
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            // 30 days or 1 year: show month/day only
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    // Generate Y-axis ticks (4 ticks for volume)
    const yTicks = $derived(
        Array.from({ length: 5 }, (_, i) => {
            return (maxVolume / 4) * i;
        })
    );

    // Generate X-axis ticks (same as price chart)
    const xTicks = $derived(
        data.length > 0
            ? data.filter((_: TimeseriesDataPoint, i: number) => i % Math.max(1, Math.floor(data.length / 6)) === 0)
            : []
    );

    // Mouse event handlers
    function handleMouseMove(event: MouseEvent) {
        if (!svgElement || data.length === 0) return;

        const rect = svgElement.getBoundingClientRect();

        // Account for SVG viewBox scaling
        const scaleXRatio = chartWidth / rect.width;
        const scaleYRatio = chartHeight / rect.height;

        // Convert client coordinates to SVG coordinates for data point detection
        const svgX = (event.clientX - rect.left) * scaleXRatio;
        const svgY = (event.clientY - rect.top) * scaleYRatio;

        // Calculate coordinates relative to the inner chart area for data point detection
        const x = svgX - padding.left;
        const y = svgY - padding.top;

        // Store actual screen coordinates (relative to the container) for tooltip positioning
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;

        // Find nearest data point
        if (x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight) {
            hovering = true;
            const timestamp = minTime + (x / innerWidth) * timeSpan;

            // Find closest data point
            let closestIndex = 0;
            let minDistance = Math.abs(data[0].timestamp - timestamp);

            for (let i = 1; i < data.length; i++) {
                const distance = Math.abs(data[i].timestamp - timestamp);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = i;
                }
            }

            hoveredPointIndex = closestIndex;
        } else {
            hovering = false;
            hoveredPointIndex = -1;
        }
    }

    function handleMouseLeave() {
        hovering = false;
        hoveredPointIndex = -1;
    }

    // Get hovered point data
    const hoveredPoint = $derived(hoveredPointIndex >= 0 ? data[hoveredPointIndex] : null);
    const hoveredX = $derived(hoveredPoint ? scaleX(hoveredPoint.timestamp) : 0);

    // Format volume number with K/M suffixes
    const formatVolume = (volume: number | null) => {
        if (volume === null) return 'N/A';
        if (volume >= 1000000) return (volume / 1000000).toFixed(1) + 'M';
        if (volume >= 1000) return (volume / 1000).toFixed(1) + 'K';
        return volume.toString();
    };
</script>

<div class="volume-chart-container bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mt-4">
    <h3 class="text-lg font-semibold mb-4 text-center">Trade Volume</h3>

    {#if data.length === 0}
        <div class="flex items-center justify-center h-48">
            <p class="text-gray-500">No volume data available</p>
        </div>
    {:else}
        <div class="relative w-full">
            <svg
                bind:this={svgElement}
                width="100%"
                height={chartHeight}
                class="mx-auto"
                viewBox="0 0 {chartWidth} {chartHeight}"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Trade volume chart"
                onmousemove={handleMouseMove}
                onmouseleave={handleMouseLeave}
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

                    <!-- Volume bars -->
                    {#each data as point}
                        {#if point.highPriceVolume !== null}
                            <rect
                                x={scaleX(point.timestamp) - barWidth - 0.5}
                                y={scaleY(point.highPriceVolume)}
                                width={barWidth}
                                height={innerHeight - scaleY(point.highPriceVolume)}
                                fill="#f97316"
                                opacity="0.7"
                                class="volume-bar"
                            />
                        {/if}
                        {#if point.lowPriceVolume !== null}
                            <rect
                                x={scaleX(point.timestamp) + 0.5}
                                y={scaleY(point.lowPriceVolume)}
                                width={barWidth}
                                height={innerHeight - scaleY(point.lowPriceVolume)}
                                fill="#10b981"
                                opacity="0.7"
                                class="volume-bar"
                            />
                        {/if}
                    {/each}

                    <!-- Crosshair vertical line when hovering -->
                    {#if hovering && hoveredPoint}
                        <line
                            x1={hoveredX}
                            y1="0"
                            x2={hoveredX}
                            y2={innerHeight}
                            stroke="currentColor"
                            stroke-width="1"
                            stroke-dasharray="4,4"
                            opacity="0.5"
                            class="crosshair"
                        />
                    {/if}

                    <!-- Y-axis -->
                    <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="currentColor" stroke-width="2" />

                    <!-- Y-axis labels -->
                    {#each yTicks as tick}
                        <text
                            x="-10"
                            y={scaleY(tick)}
                            text-anchor="end"
                            dominant-baseline="middle"
                            class="text-xs fill-current"
                        >
                            {formatVolume(tick)}
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

                    <!-- Axis label -->
                    <text
                        x={-innerHeight / 2}
                        y="-100"
                        text-anchor="middle"
                        transform="rotate(-90)"
                        class="text-sm fill-current font-medium"
                    >
                        Volume (units)
                    </text>
                </g>
            </svg>

            <!-- Tooltip -->
            {#if hovering && hoveredPoint}
                <div
                    class="tooltip-container"
                    style="left: {mouseX > 600 ? mouseX - 200 : mouseX + 10}px; top: {mouseY > 150
                        ? mouseY - 100
                        : mouseY + 10}px;"
                >
                    <div class="tooltip-content">
                        <div class="tooltip-time">
                            {new Date(hoveredPoint.timestamp * 1000).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                        {#if hoveredPoint.highPriceVolume !== null}
                            <div class="tooltip-row">
                                <span class="tooltip-dot buy-dot"></span>
                                <span class="tooltip-label">Buy volume:</span>
                                <span class="tooltip-value">{formatInt(hoveredPoint.highPriceVolume)}</span>
                            </div>
                        {/if}
                        {#if hoveredPoint.lowPriceVolume !== null}
                            <div class="tooltip-row">
                                <span class="tooltip-dot sell-dot"></span>
                                <span class="tooltip-label">Sell volume:</span>
                                <span class="tooltip-value">{formatInt(hoveredPoint.lowPriceVolume)}</span>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>

        <!-- Legend -->
        <div class="flex justify-center gap-6 mt-4">
            <div class="flex items-center gap-2">
                <div class="w-8 h-3 bg-orange-500 opacity-70"></div>
                <span class="text-sm">Buy Volume</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-8 h-3 bg-green-500 opacity-70"></div>
                <span class="text-sm">Sell Volume</span>
            </div>
        </div>
    {/if}
</div>

<style>
    .volume-bar {
        transition: opacity 0.2s;
    }

    .volume-bar:hover {
        opacity: 1;
    }

    .tooltip-container {
        position: absolute;
        pointer-events: none;
        z-index: 1000;
        animation: fadeIn 0.15s ease-out;
    }

    .tooltip-content {
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        min-width: 180px;
        font-size: 13px;
    }

    .tooltip-time {
        font-weight: 600;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        text-align: center;
    }

    .tooltip-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
    }

    .tooltip-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .buy-dot {
        background-color: #f97316;
    }

    .sell-dot {
        background-color: #10b981;
    }

    .tooltip-label {
        flex: 1;
        opacity: 0.8;
    }

    .tooltip-value {
        font-weight: 600;
        text-align: right;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    :global(.dark) .tooltip-content {
        background: rgba(17, 24, 39, 0.95);
        border: 1px solid rgba(75, 85, 99, 0.5);
    }
</style>
