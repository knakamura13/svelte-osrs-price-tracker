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

    $: {
        clearTimeout(timer);
        timer = setTimeout(
            () => {
                if (onInput) onInput(draft);
            },
            Math.max(0, delay)
        );
    }

    import { onDestroy } from 'svelte';
    onDestroy(() => clearTimeout(timer));
</script>

<input class="border rounded p-2 w-full md:w-80" {placeholder} bind:value={draft} aria-label="Search" />
