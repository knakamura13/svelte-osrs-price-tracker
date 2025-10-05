export function formatInt(value: number | null | undefined): string {
    if (value == null) return '—';
    return value.toLocaleString('en-US');
}

export function formatPrice(
    value: number | null | undefined,
    decimalView: boolean = false,
    decimalPlaces: number = 2
): string {
    if (value == null) return '—';

    if (!decimalView) {
        return formatInt(value);
    }

    // Handle abbreviated formatting for large numbers
    const absValue = Math.abs(value);

    if (absValue >= 1_000_000_000) {
        // Billions
        return `${(value / 1_000_000_000).toFixed(decimalPlaces)}b`;
    } else if (absValue >= 1_000_000) {
        // Millions
        return `${(value / 1_000_000).toFixed(decimalPlaces)}m`;
    } else if (absValue >= 1_000) {
        // Thousands
        return `${(value / 1_000).toFixed(decimalPlaces)}k`;
    } else {
        // Regular decimal formatting
        return value.toFixed(decimalPlaces);
    }
}
