<script lang="ts">
    export let rows: number = 10;
    export let columns: number = 10;
</script>

<div class="w-full">
    <table class="w-full text-sm">
        <tbody>
            {#each Array(rows) as _, i}
                <tr class="border-t border-gray-200 dark:border-gray-800 even:bg-gray-50 dark:even:bg-gray-800/30">
                    {#each Array(columns) as _, j}
                        <td class="p-2">
                            <div
                                class="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                                style="width: {j === 0 ? '80%' : j === 1 ? '60%' : '70%'}; animation-delay: {i * 50}ms;"
                            ></div>
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.4;
        }
    }

    .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
</style>

