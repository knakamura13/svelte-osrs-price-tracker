import type { Filters, SortKey } from '$lib/types';
import { migrateTimeFiltersToDurations } from './filters';

export type Prefs = {
    sortKey: SortKey | null;
    sortDir: 'asc' | 'desc';
    pageSize: number;
    columnVisibility: Record<string, boolean>;
    filters: Filters;
};

export type Settings = {
    autoRefresh: boolean;
    decimalView: boolean;
    decimalPlaces: number;
};

export type AllPrefs = Prefs & Settings;

const STORAGE_KEY = 'osrs:prefs';

export function loadPrefs(nowSeconds: number): Partial<Prefs> | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const prefs = JSON.parse(raw);
        if (prefs?.filters) {
            prefs.filters = migrateTimeFiltersToDurations(prefs.filters, nowSeconds);
        }
        return prefs;
    } catch {
        return null;
    }
}

export function savePrefs(prefs: Prefs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
}
