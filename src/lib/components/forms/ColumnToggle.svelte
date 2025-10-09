<script lang="ts">
    export let columnKey: string;
    export let label: string;
    export let checked: boolean;
    export let onChange: ((key: string, checked: boolean) => void) | undefined;

    function handleChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (onChange) {
            onChange(columnKey, target.checked);
        }
    }
</script>

<label class="flex items-center gap-2">
    <input id="{columnKey}-toggle" name="{columnKey}-toggle" type="checkbox" {checked} on:change={handleChange} />
    <span class="text-sm">{label}</span>
</label>
