<script lang="ts">
    type PriceRow = {
        id: number;
        name: string;
        icon: string | null;
        members: boolean;
        buyLimit: number | null;
        buyPrice: number | null;
        buyTime: number | null;
        sellPrice: number | null;
        sellTime: number | null;
        margin: number | null;
        dailyVolume?: number | null;
    };
    export let rows: PriceRow[] = [];
</script>

<div class="overflow-auto rounded border border-gray-300 dark:border-gray-700">
    <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
                <th class="text-left p-2">Name</th>
                <th class="text-right p-2">Buy limit</th>
                <th class="text-right p-2">Buy price</th>
                <th class="text-right p-2">Most recent buy</th>
                <th class="text-right p-2">Sell price</th>
                <th class="text-right p-2">Most recent sell</th>
                <th class="text-right p-2">Margin</th>
                <th class="text-right p-2">Daily volume</th>
            </tr>
        </thead>
        <tbody>
            {#if rows.length === 0}
                <tr>
                    <td class="p-3 text-center text-gray-500" colspan="8">No data yet</td>
                </tr>
            {:else}
                {#each rows as r (r.id)}
                    <tr class="border-t border-gray-200 dark:border-gray-800">
                        <td class="p-2 flex gap-2 items-center">
                            {#if r.icon}
                                <img src={r.icon} alt="" class="h-5 w-5" />
                            {/if}
                            <span>{r.name}</span>
                        </td>
                        <td class="p-2 text-right">{r.buyLimit ?? '—'}</td>
                        <td class="p-2 text-right">{r.buyPrice ?? '—'}</td>
                        <td class="p-2 text-right">{r.buyTime ?? '—'}</td>
                        <td class="p-2 text-right">{r.sellPrice ?? '—'}</td>
                        <td class="p-2 text-right">{r.sellTime ?? '—'}</td>
                        <td class="p-2 text-right">{r.margin ?? '—'}</td>
                        <td class="p-2 text-right">{r.dailyVolume ?? '—'}</td>
                    </tr>
                {/each}
            {/if}
        </tbody>
    </table>
</div>

<style lang="scss">
</style>
