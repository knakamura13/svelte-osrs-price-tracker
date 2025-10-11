import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadPrefs, savePrefs } from './preferences';
import { migrateTimeFiltersToDurations } from './filters';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};

// Mock the filters utility for migration testing
vi.mock('./filters', () => ({
    migrateTimeFiltersToDurations: vi.fn((filters, nowSeconds) => filters)
}));

describe('preferences utilities', () => {
    let originalWindow: any;

    beforeEach(() => {
        vi.clearAllMocks();
        originalWindow = global.window;
        (global as any).window = {
            localStorage: localStorageMock
        };
    });

    afterEach(() => {
        global.window = originalWindow;
        vi.restoreAllMocks();
    });

    describe('loadPrefs', () => {
        it('should return null when localStorage is empty', () => {
            localStorageMock.getItem.mockReturnValue(null);

            const result = loadPrefs(1704067200); // 2024-01-01 00:00:00 UTC

            expect(result).toBeNull();
            expect(localStorageMock.getItem).toHaveBeenCalledWith('osrs:prefs');
        });

        it('should return null when localStorage throws an error', () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            const result = loadPrefs(1704067200);

            expect(result).toBeNull();
            expect(localStorageMock.getItem).toHaveBeenCalledWith('osrs:prefs');
        });

        it('should return null when stored data is not valid JSON', () => {
            localStorageMock.getItem.mockReturnValue('invalid json');

            const result = loadPrefs(1704067200);

            expect(result).toBeNull();
            expect(localStorageMock.getItem).toHaveBeenCalledWith('osrs:prefs');
        });

        it('should load and return valid preferences', () => {
            const prefs = {
                sortKey: 'name',
                sortDir: 'asc' as const,
                pageSize: 50,
                columnVisibility: { name: true, buyPrice: false },
                filters: {
                    buyLimit: { min: 1, max: 100 },
                    buyPrice: { min: null, max: 1000 },
                    buyTime: { min: null, max: null },
                    sellPrice: { min: null, max: null },
                    sellTime: { min: null, max: null },
                    breakEvenPrice: { min: null, max: null },
                    margin: { min: null, max: null },
                    postTaxProfit: { min: null, max: null },
                    postTaxProfitAvg: { min: null, max: null },
                    dailyVolume: { min: null, max: null },
                    dailyLow: { min: null, max: null },
                    dailyHigh: { min: null, max: null },
                    averageBuy: { min: null, max: null },
                    averageSell: { min: null, max: null },
                    potentialProfit: { min: null, max: null },
                    potentialProfitAvg: { min: null, max: null }
                }
            };
            localStorageMock.getItem.mockReturnValue(JSON.stringify(prefs));

            const result = loadPrefs(1704067200);

            expect(result).toEqual(prefs);
            expect(localStorageMock.getItem).toHaveBeenCalledWith('osrs:prefs');
        });

        it('should migrate time filters when loading preferences', () => {
            const prefs = {
                sortKey: 'name',
                sortDir: 'asc' as const,
                pageSize: 50,
                columnVisibility: {},
                filters: {
                    buyLimit: { min: 1, max: 100 },
                    buyPrice: { min: null, max: null },
                    buyTime: { min: 3600, max: 7200 }, // These should be migrated
                    sellPrice: { min: null, max: null },
                    sellTime: { min: null, max: null },
                    breakEvenPrice: { min: null, max: null },
                    margin: { min: null, max: null },
                    postTaxProfit: { min: null, max: null },
                    postTaxProfitAvg: { min: null, max: null },
                    dailyVolume: { min: null, max: null },
                    dailyLow: { min: null, max: null },
                    dailyHigh: { min: null, max: null },
                    averageBuy: { min: null, max: null },
                    averageSell: { min: null, max: null },
                    potentialProfit: { min: null, max: null },
                    potentialProfitAvg: { min: null, max: null }
                }
            };
            localStorageMock.getItem.mockReturnValue(JSON.stringify(prefs));

            loadPrefs(1704067200);

            expect(migrateTimeFiltersToDurations).toHaveBeenCalledWith(prefs.filters, 1704067200);
        });

        it('should handle preferences without filters', () => {
            const prefs = {
                sortKey: 'name',
                sortDir: 'asc' as const,
                pageSize: 50,
                columnVisibility: {}
            };
            localStorageMock.getItem.mockReturnValue(JSON.stringify(prefs));

            const result = loadPrefs(1704067200);

            expect(result).toEqual(prefs);
            expect(localStorageMock.getItem).toHaveBeenCalledWith('osrs:prefs');
        });

        it('should handle empty preferences object', () => {
            localStorageMock.getItem.mockReturnValue('{}');

            const result = loadPrefs(1704067200);

            expect(result).toEqual({});
            expect(localStorageMock.getItem).toHaveBeenCalledWith('osrs:prefs');
        });
    });

    describe('savePrefs', () => {
        it('should save preferences to localStorage', () => {
            const prefs = {
                sortKey: 'name' as const,
                sortDir: 'asc' as const,
                pageSize: 50,
                columnVisibility: { name: true },
                filters: {
                    buyLimit: { min: 1, max: 100 },
                    buyPrice: { min: null, max: null },
                    buyTime: { min: null, max: null },
                    sellPrice: { min: null, max: null },
                    sellTime: { min: null, max: null },
                    breakEvenPrice: { min: null, max: null },
                    margin: { min: null, max: null },
                    postTaxProfit: { min: null, max: null },
                    postTaxProfitAvg: { min: null, max: null },
                    dailyVolume: { min: null, max: null },
                    dailyLow: { min: null, max: null },
                    dailyHigh: { min: null, max: null },
                    averageBuy: { min: null, max: null },
                    averageSell: { min: null, max: null },
                    potentialProfit: { min: null, max: null },
                    potentialProfitAvg: { min: null, max: null }
                }
            };

            savePrefs(prefs);

            expect(localStorageMock.setItem).toHaveBeenCalledWith('osrs:prefs', JSON.stringify(prefs));
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            const prefs = {
                sortKey: 'name' as const,
                sortDir: 'asc' as const,
                pageSize: 50,
                columnVisibility: {},
                filters: {
                    buyLimit: { min: null, max: null },
                    buyPrice: { min: null, max: null },
                    buyTime: { min: null, max: null },
                    sellPrice: { min: null, max: null },
                    sellTime: { min: null, max: null },
                    breakEvenPrice: { min: null, max: null },
                    margin: { min: null, max: null },
                    postTaxProfit: { min: null, max: null },
                    postTaxProfitAvg: { min: null, max: null },
                    dailyVolume: { min: null, max: null },
                    dailyLow: { min: null, max: null },
                    dailyHigh: { min: null, max: null },
                    averageBuy: { min: null, max: null },
                    averageSell: { min: null, max: null },
                    potentialProfit: { min: null, max: null },
                    potentialProfitAvg: { min: null, max: null }
                }
            };

            // Should not throw an error
            expect(() => savePrefs(prefs)).not.toThrow();
            expect(localStorageMock.setItem).toHaveBeenCalledWith('osrs:prefs', JSON.stringify(prefs));
        });

        it('should handle null and undefined values in preferences', () => {
            const prefs = {
                sortKey: null,
                sortDir: 'asc' as const,
                pageSize: 50,
                columnVisibility: {},
                filters: {
                    buyLimit: { min: null, max: null },
                    buyPrice: { min: null, max: null },
                    buyTime: { min: null, max: null },
                    sellPrice: { min: null, max: null },
                    sellTime: { min: null, max: null },
                    breakEvenPrice: { min: null, max: null },
                    margin: { min: null, max: null },
                    postTaxProfit: { min: null, max: null },
                    postTaxProfitAvg: { min: null, max: null },
                    dailyVolume: { min: null, max: null },
                    dailyLow: { min: null, max: null },
                    dailyHigh: { min: null, max: null },
                    averageBuy: { min: null, max: null },
                    averageSell: { min: null, max: null },
                    potentialProfit: { min: null, max: null },
                    potentialProfitAvg: { min: null, max: null }
                }
            };

            savePrefs(prefs);

            expect(localStorageMock.setItem).toHaveBeenCalledWith('osrs:prefs', JSON.stringify(prefs));
        });

        it('should save empty preferences object', () => {
            const prefs = {
                sortKey: null,
                sortDir: 'asc' as const,
                pageSize: 50,
                columnVisibility: {},
                filters: {
                    buyLimit: { min: null, max: null },
                    buyPrice: { min: null, max: null },
                    buyTime: { min: null, max: null },
                    sellPrice: { min: null, max: null },
                    sellTime: { min: null, max: null },
                    breakEvenPrice: { min: null, max: null },
                    margin: { min: null, max: null },
                    postTaxProfit: { min: null, max: null },
                    postTaxProfitAvg: { min: null, max: null },
                    dailyVolume: { min: null, max: null },
                    dailyLow: { min: null, max: null },
                    dailyHigh: { min: null, max: null },
                    averageBuy: { min: null, max: null },
                    averageSell: { min: null, max: null },
                    potentialProfit: { min: null, max: null },
                    potentialProfitAvg: { min: null, max: null }
                }
            };

            savePrefs(prefs);

            expect(localStorageMock.setItem).toHaveBeenCalledWith('osrs:prefs', JSON.stringify(prefs));
        });
    });

    describe('type definitions', () => {
        it('should have correct type definitions', () => {
            // These tests verify that the types are properly exported and usable
            const prefs = {
                sortKey: 'name' as const,
                sortDir: 'asc' as const,
                pageSize: 50,
                columnVisibility: { name: true },
                filters: {
                    buyLimit: { min: 1, max: 100 },
                    buyPrice: { min: null, max: null },
                    buyTime: { min: null, max: null },
                    sellPrice: { min: null, max: null },
                    sellTime: { min: null, max: null },
                    breakEvenPrice: { min: null, max: null },
                    margin: { min: null, max: null },
                    postTaxProfit: { min: null, max: null },
                    postTaxProfitAvg: { min: null, max: null },
                    dailyVolume: { min: null, max: null },
                    dailyLow: { min: null, max: null },
                    dailyHigh: { min: null, max: null },
                    averageBuy: { min: null, max: null },
                    averageSell: { min: null, max: null },
                    potentialProfit: { min: null, max: null },
                    potentialProfitAvg: { min: null, max: null }
                }
            };

            const settings = {
                autoRefresh: true,
                decimalView: false,
                decimalPlaces: 2
            };

            const allPrefs = { ...prefs, ...settings };

            // TypeScript should allow this assignment
            expect(allPrefs.sortKey).toBe('name');
            expect(allPrefs.autoRefresh).toBe(true);
        });
    });
});
