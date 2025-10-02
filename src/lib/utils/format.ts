export function formatInt(value: number | null | undefined): string {
    if (value == null) return '—';
    return value.toLocaleString('en-US');
}
