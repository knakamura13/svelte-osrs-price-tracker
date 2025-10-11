import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    isFiniteNumber,
    isPositive,
    normalizeFilters,
    handleNumericFilterChange,
    setSort,
    computeFilterStats,
    migrateTimeFiltersToDurations
} from './filters';

// Mock the tax utility
vi.mock('./tax', () => ({
    calculateBreakEvenPrice: vi.fn((sellPrice, itemId) => {
        if (sellPrice === null) return null;
        return Math.floor(sellPrice * 1.02); // Simple mock calculation
    }),
    calculatePostTaxProfit: vi.fn((buyPrice, sellPrice, itemId) => {
        if (buyPrice === null || sellPrice === null) return null;
        return sellPrice - buyPrice - Math.floor(sellPrice * 0.02); // Simple mock calculation
    })
}));

// Mock types
const mockPriceRow = {
    id: 1,
    name: 'Test Item',
    icon: 'icon.png',
    members: false,
    buyLimit: 100,
    buyPrice: 1000,
    buyTime: 1704067200, // 2024-01-01 00:00:00 UTC
    sellPrice: 1100,
    sellTime: 1704067200,
    margin: 100,
    dailyVolume: 1000,
    dailyLow: 950,
    dailyHigh: 1150,
    averageBuy: 980,
    averageSell: 1120,
    potentialProfit: 5000,
    examine: 'A test item',
    wikiUrl: 'https://example.com',
    highalch: 600,
    lowalch: 400,
    value: 500
};

const mockFilters = {
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
};

describe('filters utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('isFiniteNumber', () => {
        it('should return true for finite numbers', () => {
            expect(isFiniteNumber(0)).toBe(true);
            expect(isFiniteNumber(123)).toBe(true);
            expect(isFiniteNumber(-123)).toBe(true);
            expect(isFiniteNumber(123.456)).toBe(true);
        });

        it('should return false for null', () => {
            expect(isFiniteNumber(null)).toBe(false);
        });

        it('should return false for non-finite numbers', () => {
            expect(isFiniteNumber(Infinity)).toBe(false);
            expect(isFiniteNumber(-Infinity)).toBe(false);
            expect(isFiniteNumber(NaN)).toBe(false);
        });
    });

    describe('isPositive', () => {
        it('should return true for positive finite numbers', () => {
            expect(isPositive(1)).toBe(true);
            expect(isPositive(123)).toBe(true);
            expect(isPositive(0.001)).toBe(true);
        });

        it('should return false for zero', () => {
            expect(isPositive(0)).toBe(false);
        });

        it('should return false for negative numbers', () => {
            expect(isPositive(-1)).toBe(false);
            expect(isPositive(-123)).toBe(false);
        });

        it('should return false for null', () => {
            expect(isPositive(null)).toBe(false);
        });

        it('should return false for non-finite numbers', () => {
            expect(isPositive(Infinity)).toBe(false);
            expect(isPositive(NaN)).toBe(false);
        });
    });

    describe('normalizeFilters', () => {
        it('should preserve valid numeric values', () => {
            const filters = {
                ...mockFilters,
                buyLimit: { min: 1, max: 100 },
                buyPrice: { min: 1000, max: 2000 }
            };

            const result = normalizeFilters(filters);

            expect(result.buyLimit.min).toBe(1);
            expect(result.buyLimit.max).toBe(100);
            expect(result.buyPrice.min).toBe(1000);
            expect(result.buyPrice.max).toBe(2000);
        });

        it('should set null for invalid numeric values', () => {
            const filters = {
                ...mockFilters,
                buyLimit: { min: NaN, max: Infinity },
                buyPrice: { min: NaN, max: null }
            };

            const result = normalizeFilters(filters);

            expect(result.buyLimit.min).toBe(null);
            expect(result.buyLimit.max).toBe(null);
            expect(result.buyPrice.min).toBe(null);
            expect(result.buyPrice.max).toBe(null);
        });

        it('should handle all filter types', () => {
            const filters = {
                ...mockFilters,
                buyLimit: { min: 1, max: 100 },
                buyPrice: { min: 1000, max: 2000 },
                sellPrice: { min: 1100, max: 2200 },
                margin: { min: 100, max: 1000 },
                dailyVolume: { min: 500, max: 2000 }
            };

            const result = normalizeFilters(filters);

            // Should preserve all valid values
            expect(result.buyLimit.min).toBe(1);
            expect(result.buyPrice.min).toBe(1000);
            expect(result.sellPrice.min).toBe(1100);
            expect(result.margin.min).toBe(100);
            expect(result.dailyVolume.min).toBe(500);
        });
    });

    describe('handleNumericFilterChange', () => {
        it('should update filter value for valid number', () => {
            const filters = { ...mockFilters };
            const result = handleNumericFilterChange(filters, 'buyLimit', 'min', '100');

            expect(result.buyLimit.min).toBe(100);
            expect(result.buyLimit.max).toBe(null); // unchanged
        });

        it('should set null for empty string', () => {
            const filters = { ...mockFilters, buyLimit: { min: 50, max: 200 } };
            const result = handleNumericFilterChange(filters, 'buyLimit', 'min', '');

            expect(result.buyLimit.min).toBe(null);
            expect(result.buyLimit.max).toBe(200); // unchanged
        });

        it('should set null for invalid number', () => {
            const filters = { ...mockFilters, buyLimit: { min: 50, max: 200 } };
            const result = handleNumericFilterChange(filters, 'buyLimit', 'min', 'invalid');

            expect(result.buyLimit.min).toBe(null);
            expect(result.buyLimit.max).toBe(200); // unchanged
        });

        it('should set null for zero', () => {
            const filters = { ...mockFilters, buyLimit: { min: 50, max: 200 } };
            const result = handleNumericFilterChange(filters, 'buyLimit', 'min', '0');

            expect(result.buyLimit.min).toBe(null);
            expect(result.buyLimit.max).toBe(200); // unchanged
        });

        it('should handle different filter keys', () => {
            const filters = { ...mockFilters };
            const result = handleNumericFilterChange(filters, 'margin', 'max', '500');

            expect(result.margin.max).toBe(500);
            expect(result.margin.min).toBe(null); // unchanged
        });

        it('should preserve other filter properties', () => {
            const filters = {
                ...mockFilters,
                buyLimit: { min: 1, max: 100 },
                buyPrice: { min: 1000, max: 2000 }
            };

            const result = handleNumericFilterChange(filters, 'buyLimit', 'min', '50');

            expect(result.buyLimit.min).toBe(50);
            expect(result.buyLimit.max).toBe(100); // unchanged
            expect(result.buyPrice.min).toBe(1000); // unchanged
            expect(result.buyPrice.max).toBe(2000); // unchanged
        });
    });

    describe('setSort', () => {
        it('should set descending sort for new column', () => {
            const result = setSort(null, 'asc', null, 'name');

            expect(result).toEqual({
                sortKey: 'name',
                sortDir: 'desc',
                lastSortKey: 'name'
            });
        });

        it('should cycle from descending to ascending on same column', () => {
            const result = setSort('name', 'desc', 'name', 'name');

            expect(result).toEqual({
                sortKey: 'name',
                sortDir: 'asc',
                lastSortKey: 'name'
            });
        });

        it('should cycle from ascending to unsorted on same column', () => {
            const result = setSort('name', 'asc', 'name', 'name');

            expect(result).toEqual({
                sortKey: null,
                sortDir: 'asc',
                lastSortKey: 'name'
            });
        });

        it('should handle unexpected state by starting fresh', () => {
            const result = setSort('name', 'desc', 'buyPrice', 'name');

            expect(result).toEqual({
                sortKey: 'name',
                sortDir: 'asc',
                lastSortKey: 'name'
            });
        });

        it('should handle different sort keys', () => {
            const result = setSort(null, 'asc', null, 'margin');

            expect(result).toEqual({
                sortKey: 'margin',
                sortDir: 'desc',
                lastSortKey: 'margin'
            });
        });
    });

    describe('computeFilterStats', () => {
        it('should return empty stats for empty array', () => {
            const result = computeFilterStats([]);

            expect(result.buyLimit.min).toBe(null);
            expect(result.buyLimit.max).toBe(null);
            expect(result.buyPrice.min).toBe(null);
            expect(result.buyPrice.max).toBe(null);
        });

        it('should compute min/max for numeric fields', () => {
            const rows = [
                { ...mockPriceRow, buyLimit: 50, buyPrice: 1000 },
                { ...mockPriceRow, id: 2, buyLimit: 100, buyPrice: 2000 },
                { ...mockPriceRow, id: 3, buyLimit: 25, buyPrice: 1500 }
            ];

            const result = computeFilterStats(rows);

            expect(result.buyLimit.min).toBe(25);
            expect(result.buyLimit.max).toBe(100);
            expect(result.buyPrice.min).toBe(1000);
            expect(result.buyPrice.max).toBe(2000);
        });

        it('should handle null and undefined values in numeric fields', () => {
            const rows = [
                { ...mockPriceRow, buyLimit: 50, buyPrice: null },
                { ...mockPriceRow, id: 2, buyLimit: null, buyPrice: 2000 },
                { ...mockPriceRow, id: 3, buyLimit: 100, buyPrice: null }
            ];

            const result = computeFilterStats(rows);

            expect(result.buyLimit.min).toBe(50);
            expect(result.buyLimit.max).toBe(100);
            expect(result.buyPrice.min).toBe(2000);
            expect(result.buyPrice.max).toBe(2000);
        });

        it('should compute potential profit correctly', () => {
            const rows = [
                { ...mockPriceRow, buyLimit: 10, buyPrice: 100, sellPrice: 150 }, // profit = 47, total = 470
                { ...mockPriceRow, id: 2, buyLimit: 20, buyPrice: 200, sellPrice: 250 } // profit = 47, total = 940
            ];

            const result = computeFilterStats(rows);

            expect(result.potentialProfit.min).toBe(470);
            expect(result.potentialProfit.max).toBe(940);
        });

        it('should compute break even price correctly', () => {
            const rows = [
                { ...mockPriceRow, sellPrice: 100 },
                { ...mockPriceRow, id: 2, sellPrice: 200 },
                { ...mockPriceRow, id: 3, sellPrice: 150 }
            ];

            const result = computeFilterStats(rows);

            expect(result.breakEvenPrice.min).toBe(102); // Math.floor(100 * 1.02)
            expect(result.breakEvenPrice.max).toBe(204); // Math.floor(200 * 1.02)
        });

        it('should handle items with zero or null buyLimit for potential profit', () => {
            const rows = [
                { ...mockPriceRow, buyLimit: 0, buyPrice: 100, sellPrice: 150 },
                { ...mockPriceRow, id: 2, buyLimit: null, buyPrice: 200, sellPrice: 250 },
                { ...mockPriceRow, id: 3, buyLimit: 10, buyPrice: 300, sellPrice: 350 }
            ];

            const result = computeFilterStats(rows);

            // Should only include the item with positive buyLimit
            expect(result.potentialProfit.min).toBe(430); // 10 * 43
            expect(result.potentialProfit.max).toBe(430); // 10 * 43
        });
    });

    describe('migrateTimeFiltersToDurations', () => {
        it('should convert old time filters to duration format', () => {
            const filters = {
                ...mockFilters,
                buyTime: { min: 1704067200, max: 1704070800 }, // timestamps
                sellTime: { min: 1704067200, max: 1704070800 }
            };

            const nowSeconds = 1704074400; // Later timestamp
            const result = migrateTimeFiltersToDurations(filters, nowSeconds);

            // Should convert to durations (now - timestamp)
            expect(result.buyTime.min).toBe(7200); // 1704074400 - 1704067200
            expect(result.buyTime.max).toBe(3600); // 1704074400 - 1704070800
            expect(result.sellTime.min).toBe(7200);
            expect(result.sellTime.max).toBe(3600);
        });

        it('should handle null values', () => {
            const filters = {
                ...mockFilters,
                buyTime: { min: null, max: 1704070800 },
                sellTime: { min: 1704067200, max: null }
            };

            const nowSeconds = 1704074400;
            const result = migrateTimeFiltersToDurations(filters, nowSeconds);

            expect(result.buyTime.min).toBe(null);
            expect(result.buyTime.max).toBe(3600); // 1704074400 - 1704070800
            expect(result.sellTime.min).toBe(7200); // 1704074400 - 1704067200
            expect(result.sellTime.max).toBe(null);
        });

        it('should handle non-finite values', () => {
            const filters = {
                ...mockFilters,
                buyTime: { min: NaN, max: Infinity },
                sellTime: { min: -Infinity, max: 1704067200 }
            };

            const nowSeconds = 1704074400;
            const result = migrateTimeFiltersToDurations(filters, nowSeconds);

            expect(result.buyTime.min).toBe(null);
            expect(result.buyTime.max).toBe(null);
            expect(result.sellTime.min).toBe(null);
            expect(result.sellTime.max).toBe(7200);
        });

        it('should handle future timestamps', () => {
            const filters = {
                ...mockFilters,
                buyTime: { min: 1704078000, max: 1704078000 } // Future timestamp
            };

            const nowSeconds = 1704074400;
            const result = migrateTimeFiltersToDurations(filters, nowSeconds);

            // Should be 0 for future timestamps
            expect(result.buyTime.min).toBe(0);
            expect(result.buyTime.max).toBe(0);
        });

        it('should preserve other filter properties', () => {
            const filters = {
                ...mockFilters,
                buyTime: { min: 1704067200, max: 1704070800 },
                buyLimit: { min: 1, max: 100 }
            };

            const nowSeconds = 1704074400;
            const result = migrateTimeFiltersToDurations(filters, nowSeconds);

            expect(result.buyLimit.min).toBe(1);
            expect(result.buyLimit.max).toBe(100);
            expect(result.buyTime.min).toBe(7200);
            expect(result.buyTime.max).toBe(3600);
        });
    });
});
