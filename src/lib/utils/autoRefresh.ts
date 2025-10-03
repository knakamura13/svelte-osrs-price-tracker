/**
 * Calculate exponential backoff delay in seconds
 * @param failCount Number of consecutive failures (0 = no failures)
 * @param baseDelay Base delay in seconds
 * @returns Delay in seconds with exponential backoff (capped at 5 minutes)
 */
export function calculateBackoff(failCount: number, baseDelay: number): number {
    if (failCount === 0) return baseDelay;
    // Exponential backoff: baseDelay * 2^(failCount-1)
    // e.g., 60s, 120s, 240s, 300s (capped at 5 minutes)
    const backoffDelay = baseDelay * Math.pow(2, failCount - 1);
    return Math.min(backoffDelay, 300); // Cap at 5 minutes
}

export function setupAutoRefresh(currentTimer: any, enabled: boolean, refreshSec: number, callback: () => void) {
    clearInterval(currentTimer);
    if (enabled) {
        return setInterval(callback, Math.max(5, refreshSec) * 1000);
    }
    return undefined;
}

/**
 * Setup auto-refresh with exponential backoff on failures
 * @param currentTimer Current timer reference to clear
 * @param enabled Whether auto-refresh is enabled
 * @param refreshSec Base refresh interval in seconds
 * @param failCount Number of consecutive failures
 * @param callback Function to call on each refresh
 * @returns Timer reference
 */
export function setupAutoRefreshWithBackoff(
    currentTimer: any,
    enabled: boolean,
    refreshSec: number,
    failCount: number,
    callback: () => void
) {
    clearInterval(currentTimer);
    if (enabled) {
        const delay = calculateBackoff(failCount, Math.max(5, refreshSec));
        return setInterval(callback, delay * 1000);
    }
    return undefined;
}
