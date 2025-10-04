<script lang="ts">
    import { formatInt } from '$lib/utils/format';

    export let visible: boolean = false;
    export let x: number = 0;
    export let y: number = 0;
    export let timestamp: number = 0;
    export let buyPrice: number | null = null;
    export let sellPrice: number | null = null;

    // Format timestamp
    $: formattedTime = new Date(timestamp * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Position tooltip to avoid going off-screen
    $: tooltipX = x > 600 ? x - 200 : x + 10;
    $: tooltipY = y > 300 ? y - 100 : y + 10;
</script>

{#if visible}
    <div
        class="tooltip-container"
        style="left: {tooltipX}px; top: {tooltipY}px;"
    >
        <div class="tooltip-content">
            <div class="tooltip-time">{formattedTime}</div>
            {#if buyPrice !== null}
                <div class="tooltip-row buy">
                    <span class="tooltip-dot buy-dot"></span>
                    <span class="tooltip-label">Buy price:</span>
                    <span class="tooltip-value">{formatInt(buyPrice)} gp</span>
                </div>
            {/if}
            {#if sellPrice !== null}
                <div class="tooltip-row sell">
                    <span class="tooltip-dot sell-dot"></span>
                    <span class="tooltip-label">Sell price:</span>
                    <span class="tooltip-value">{formatInt(sellPrice)} gp</span>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
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

