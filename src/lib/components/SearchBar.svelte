<script lang="ts">
    export let value: string = '';
    export let delay: number = 200;
    export let placeholder: string = 'Search...';
    export let onInput: ((value: string) => void) | undefined;

    let draft: string = value;
    let timer: any;

    $: if (value !== draft) {
        draft = value;
    }

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const newValue = target.value;
        draft = newValue;
        clearTimeout(timer);
        timer = setTimeout(
            () => {
                if (onInput) onInput(newValue);
            },
            Math.max(0, delay)
        );
    }

    function clearSearch() {
        draft = '';
        if (onInput) onInput('');
    }

    import { onDestroy } from 'svelte';
    import { X } from 'lucide-svelte';

    onDestroy(() => clearTimeout(timer));
</script>

<div class="relative inline-block w-full md:w-1/2">
    <input
        id="search-input"
        name="search"
        class="border rounded p-2 w-full pr-10"
        {placeholder}
        value={draft}
        on:input={handleInput}
        aria-label="Search"
    />
    {#if draft}
        <button
            type="button"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-300 transition-colors hover:text-gray-100 focus:outline-none focus:text-gray-100"
            on:click={clearSearch}
            aria-label="Clear search"
        >
            <X class="w-5 h-5" />
        </button>
    {/if}
</div>
