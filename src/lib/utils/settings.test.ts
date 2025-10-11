import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { settingsStore, itemsStore } from './settings';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};

// Mock window object
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
});

describe('settings utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset stores to default state
        settingsStore.set({
            autoRefresh: true,
            decimalView: false,
            decimalPlaces: 2
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('settingsStore', () => {
        it('should initialize with default settings', () => {
            const settings = get(settingsStore);
            expect(settings).toEqual({
                autoRefresh: true,
                decimalView: false,
                decimalPlaces: 2
            });
        });

        it('should update settings with set method', () => {
            const newSettings = {
                autoRefresh: false,
                decimalView: true,
                decimalPlaces: 4
            };

            settingsStore.set(newSettings);
            const settings = get(settingsStore);
            expect(settings).toEqual(newSettings);
        });

        it('should update settings with update method', () => {
            settingsStore.update((settings) => ({
                ...settings,
                autoRefresh: false
            }));

            const settings = get(settingsStore);
            expect(settings.autoRefresh).toBe(false);
            expect(settings.decimalView).toBe(false); // unchanged
            expect(settings.decimalPlaces).toBe(2); // unchanged
        });

        it('should toggle autoRefresh', () => {
            // Initially true
            expect(get(settingsStore).autoRefresh).toBe(true);

            settingsStore.toggleAutoRefresh();
            expect(get(settingsStore).autoRefresh).toBe(false);

            settingsStore.toggleAutoRefresh();
            expect(get(settingsStore).autoRefresh).toBe(true);
        });

        it('should toggle decimalView', () => {
            // Initially false
            expect(get(settingsStore).decimalView).toBe(false);

            settingsStore.toggleDecimalView();
            expect(get(settingsStore).decimalView).toBe(true);

            settingsStore.toggleDecimalView();
            expect(get(settingsStore).decimalView).toBe(false);
        });

        it('should set decimal places', () => {
            settingsStore.setDecimalPlaces(4);
            expect(get(settingsStore).decimalPlaces).toBe(4);

            settingsStore.setDecimalPlaces(1);
            expect(get(settingsStore).decimalPlaces).toBe(1);

            settingsStore.setDecimalPlaces(0);
            expect(get(settingsStore).decimalPlaces).toBe(0);
        });

        it('should save settings to localStorage', () => {
            const newSettings = {
                autoRefresh: false,
                decimalView: true,
                decimalPlaces: 3
            };

            settingsStore.set(newSettings);
            settingsStore.save();

            expect(localStorageMock.setItem).toHaveBeenCalledWith('osrs:settings', JSON.stringify(newSettings));
        });

        it('should handle localStorage errors when saving', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            // Should not throw an error
            expect(() => settingsStore.save()).not.toThrow();
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });
    });

    describe('itemsStore', () => {
        it('should initialize as empty array', () => {
            const items = get(itemsStore);
            expect(items).toEqual([]);
        });

        it('should update items with set method', () => {
            const testItems = [
                {
                    id: 1,
                    name: 'Test Item',
                    buyLimit: 100,
                    buyPrice: 1000,
                    buyTime: 1704067200,
                    sellPrice: 1100,
                    sellTime: 1704067200,
                    margin: 100,
                    members: false
                }
            ];

            itemsStore.set(testItems);
            const items = get(itemsStore);
            expect(items).toEqual(testItems);
        });

        it('should be a writable store', () => {
            // Verify it has subscribe and set methods
            expect(typeof itemsStore.subscribe).toBe('function');
            expect(typeof itemsStore.set).toBe('function');
        });
    });

    describe('default settings', () => {
        it('should have correct default values', () => {
            const expectedDefaults = {
                autoRefresh: true,
                decimalView: false,
                decimalPlaces: 2
            };

            const settings = get(settingsStore);
            expect(settings).toEqual(expectedDefaults);
        });
    });
});
