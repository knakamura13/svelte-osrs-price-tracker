export function partsFromSeconds(totalSeconds: number | null | undefined): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
} {
    const total =
        typeof totalSeconds === 'number' && Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;
    const days = Math.floor(total / 86400);
    const remainderAfterDays = total % 86400;
    const hours = Math.floor(remainderAfterDays / 3600);
    const remainderAfterHours = remainderAfterDays % 3600;
    const minutes = Math.floor(remainderAfterHours / 60);
    const seconds = remainderAfterHours % 60;
    return { days, hours, minutes, seconds };
}

export function secondsFromParts(
    days: number | null | undefined,
    hours: number | null | undefined,
    minutes: number | null | undefined,
    seconds: number | null | undefined
): number {
    const d = typeof days === 'number' && Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
    const h = typeof hours === 'number' && Number.isFinite(hours) && hours > 0 ? Math.floor(hours) : 0;
    const m = typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0 ? Math.floor(minutes) : 0;
    const s = typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    return d * 86400 + h * 3600 + m * 60 + s;
}
