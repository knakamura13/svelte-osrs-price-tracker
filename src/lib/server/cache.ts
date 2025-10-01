type CacheEntry<T> = { value: T; expiresAt: number };

export class TtlCache<T> {
	private store = new Map<string, CacheEntry<T>>();

	constructor(private defaultTtlMs: number) {}

	get(key: string): T | undefined {
		const hit = this.store.get(key);
		if (!hit) return undefined;
		if (Date.now() > hit.expiresAt) {
			this.store.delete(key);
			return undefined;
		}
		return hit.value;
	}

	set(key: string, value: T, ttlMs?: number): void {
		this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
	}

	clear(): void {
		this.store.clear();
	}
}
