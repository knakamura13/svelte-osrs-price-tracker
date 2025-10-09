<script lang="ts">
    export let timeKey: 'buyTime' | 'sellTime';
    export let bound: 'min' | 'max';
    export let days: number;
    export let hours: number;
    export let minutes: number;
    export let seconds: number;
    export let onInput: ((days: number, hours: number, minutes: number, seconds: number) => void) | undefined;
    export let labelId: string;

    function handleInput() {
        if (onInput) {
            onInput(days, hours, minutes, seconds);
        }
    }
</script>

<div class="flex flex-col gap-2" aria-labelledby={labelId}>
    <div class="flex items-center gap-1">
        <span class="text-xs opacity-70 w-10">{bound === 'min' ? 'Min' : 'Max'}</span>
        <input
            id="{timeKey}-{bound}-days"
            name="{timeKey}-{bound}-days"
            type="number"
            min="0"
            max="999"
            placeholder="0"
            class="w-14 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            bind:value={days}
            on:input={handleInput}
        />
        <span class="opacity-60">d :</span>
        <input
            id="{timeKey}-{bound}-hours"
            name="{timeKey}-{bound}-hours"
            type="number"
            min="0"
            max="23"
            placeholder="0"
            class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            bind:value={hours}
            on:input={handleInput}
        />
        <span class="opacity-60">h :</span>
        <input
            id="{timeKey}-{bound}-minutes"
            name="{timeKey}-{bound}-minutes"
            type="number"
            min="0"
            max="59"
            placeholder="0"
            class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            bind:value={minutes}
            on:input={handleInput}
        />
        <span class="opacity-60">m :</span>
        <input
            id="{timeKey}-{bound}-seconds"
            name="{timeKey}-{bound}-seconds"
            type="number"
            min="0"
            max="59"
            placeholder="0"
            class="w-12 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            bind:value={seconds}
            on:input={handleInput}
        />
        <span class="opacity-60">s</span>
    </div>
</div>
