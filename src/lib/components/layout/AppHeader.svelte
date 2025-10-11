<script lang="ts">
    import SettingsDropdown from '../controls/SettingsDropdown.svelte';
    import ItemSearch from '../forms/ItemSearch.svelte';
    import { itemsStore } from '$lib/utils/settings';

    export let title: string = 'OSRS Price Tracker';

    // Subscribe to items store for global item data
    $: items = $itemsStore || [];
</script>

<header
    class="flex items-center justify-between h-12 pl-4 pr-4 bg-gray-800 text-white border-b border-gray-700 sticky top-0 z-10 shadow-lg"
>
    <div class="flex gap-3 items-center justify-start">
        <img alt="Site logo" class="h-5" src="/icons/logo.svg" title="Site logo" loading="lazy" />
        <a class="font-bold uppercase tracking-wide hover:underline whitespace-nowrap" href="/">{title}</a>
        <ItemSearch {items} />
    </div>

    <div class="flex items-center">
        <SettingsDropdown />
    </div>
</header>

<style lang="scss">
</style>
