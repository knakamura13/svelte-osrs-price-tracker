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

    import { onDestroy } from 'svelte';
    onDestroy(() => clearTimeout(timer));
</script>

<input
    id="search-input"
    name="search"
    class="border rounded p-2 w-full md:w-1/2"
    {placeholder}
    value={draft}
    on:input={handleInput}
    aria-label="Search"
/>
