export function secondsAgoFromUnix(unixSeconds: number | null | undefined): string {
    if (!unixSeconds) return '—';
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, now - unixSeconds);
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}
