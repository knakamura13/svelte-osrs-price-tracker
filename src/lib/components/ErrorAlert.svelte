<script lang="ts">
    export let message: string | null = null;
    export let failCount: number = 0;
</script>

{#if message}
    <section class="px-4 pb-2">
        <div
            class="border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded p-2 text-sm"
        >
            Failed to refresh data{failCount > 1 ? ` (x${failCount})` : ''}: {message}
        </div>
    </section>
{/if}
