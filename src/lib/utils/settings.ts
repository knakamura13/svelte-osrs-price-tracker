import { writable } from 'svelte/store';
import type { Settings } from './preferences';

// Default settings
const defaultSettings: Settings = {
    autoRefresh: true, // enabled by default
    decimalView: false, // disabled by default
    decimalPlaces: 2, // default 2 decimal places
    darkMode: 'auto' // auto-detect by default
};

// Settings store
function createSettingsStore() {
    const { subscribe, set, update } = writable<Settings>(defaultSettings);

    // Load settings from localStorage on initialization
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem('osrs:settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                set({ ...defaultSettings, ...parsed });
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }
    }

    return {
        subscribe,
        set,
        update,
        // Convenience methods for common operations
        toggleAutoRefresh: () => update((settings) => ({ ...settings, autoRefresh: !settings.autoRefresh })),
        toggleDecimalView: () => update((settings) => ({ ...settings, decimalView: !settings.decimalView })),
        setDecimalPlaces: (places: number) => update((settings) => ({ ...settings, decimalPlaces: places })),
        setDarkMode: (mode: 'light' | 'dark' | 'auto') => update((settings) => ({ ...settings, darkMode: mode })),
        // Save to localStorage whenever settings change
        save: () =>
            update((settings) => {
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.setItem('osrs:settings', JSON.stringify(settings));
                    } catch (error) {
                        console.warn('Failed to save settings to localStorage:', error);
                    }
                }
                return settings;
            })
    };
}

export const settingsStore = createSettingsStore();

// Initialize dark mode on load
if (typeof window !== 'undefined') {
    settingsStore.subscribe((settings) => {
        // Apply dark mode class to document
        const shouldDark =
            settings.darkMode === 'dark' ||
            (settings.darkMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (shouldDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
}

// Helper function to get system preference
export function getSystemDarkMode(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
