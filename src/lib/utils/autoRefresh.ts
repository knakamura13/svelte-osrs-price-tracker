export function setupAutoRefresh(currentTimer: any, enabled: boolean, refreshSec: number, callback: () => void) {
    clearInterval(currentTimer);
    if (enabled) {
        return setInterval(callback, Math.max(5, refreshSec) * 1000);
    }
    return undefined;
}
