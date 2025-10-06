<script lang="ts">
    import { AlertCircle } from 'lucide-svelte';

    export let message: string | null = null;
    export let failCount: number = 0;
    export let nextRetryIn: number | null = null; // seconds until next retry
    export let autoDisabled: boolean = false;
</script>

{#if message}
    <section class="px-4 pb-2">
        <div
            class="border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded p-3 text-sm"
            role="alert"
            aria-live="polite"
        >
            <div class="flex items-start gap-2">
                <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div class="flex-1">
                    <p class="font-medium">
                        Failed to load data{failCount > 1 ? ` (attempt ${failCount})` : ''}
                    </p>
                    <p class="mt-1 opacity-90">{message}</p>
                    {#if nextRetryIn !== null && nextRetryIn > 0}
                        <p class="mt-2 text-xs opacity-75">
                            Retrying in {nextRetryIn} second{nextRetryIn !== 1 ? 's' : ''}...
                        </p>
                    {/if}
                    {#if autoDisabled}
                        <p class="mt-2 text-xs opacity-75 font-medium">
                            Auto-refresh disabled after multiple failures. Click refresh to try again.
                        </p>
                    {/if}
                </div>
            </div>
        </div>
    </section>
{/if}
