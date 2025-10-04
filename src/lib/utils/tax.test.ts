import { describe, it, expect } from 'vitest';
import {
    calculateGeTax,
    calculateBreakEvenPrice,
    calculatePostTaxProfit,
    getTaxDescription,
    TAX_EXEMPT_ITEMS
} from './tax';

describe('Grand Exchange Tax Calculations', () => {
    describe('calculateGeTax', () => {
        it('should return 0 for items below minimum tax threshold', () => {
            expect(calculateGeTax(0)).toBe(0);
            expect(calculateGeTax(49)).toBe(0); // Below 50 gp (calculated from 1/0.02)
        });

        it('should return 1 gp tax for item at minimum tax threshold', () => {
            expect(calculateGeTax(50)).toBe(1); // 50 gp = ceil(1/0.02)
        });

        it('should calculate 2% tax rounded down', () => {
            expect(calculateGeTax(100)).toBe(2); // floor(100 * 0.02) = 2
            expect(calculateGeTax(150)).toBe(3); // floor(150 * 0.02) = 3
            expect(calculateGeTax(149)).toBe(2); // floor(149 * 0.02) = 2
            expect(calculateGeTax(1000)).toBe(20); // floor(1000 * 0.02) = 20
        });

        it('should cap tax at 5,000,000 gp', () => {
            expect(calculateGeTax(250_000_000)).toBe(5_000_000); // 2% would be 5M
            expect(calculateGeTax(300_000_000)).toBe(5_000_000); // 2% would be 6M, but capped
            expect(calculateGeTax(1_000_000_000)).toBe(5_000_000); // 2% would be 20M, but capped
        });

        it('should return 0 for exempt items regardless of price', () => {
            const bondId = 13190; // Old school bond
            expect(calculateGeTax(1_000_000, bondId)).toBe(0);
            expect(calculateGeTax(100_000_000, bondId)).toBe(0);

            const lobsterId = 379; // Lobster
            expect(calculateGeTax(500, lobsterId)).toBe(0);
        });
    });

    describe('calculateBreakEvenPrice', () => {
        it('should return null for null cost', () => {
            expect(calculateBreakEvenPrice(null)).toBe(null);
        });

        it('should return cost for items below tax threshold (no tax)', () => {
            expect(calculateBreakEvenPrice(10)).toBe(10);
            expect(calculateBreakEvenPrice(49)).toBe(49); // Below minimum (50 gp)
        });

        it('should calculate break-even for normal items', () => {
            // If cost = 98, we need price P such that P - floor(P * 0.02) >= 98
            // P = 100: 100 - floor(100 * 0.02) = 100 - 2 = 98 ✓
            expect(calculateBreakEvenPrice(98)).toBe(100);

            // If cost = 1000, we need P such that P - floor(P * 0.02) >= 1000
            // P = 1021: 1021 - floor(1021 * 0.02) = 1021 - 20 = 1001 ✓
            // P = 1020: 1020 - floor(1020 * 0.02) = 1020 - 20 = 1000 ✓
            expect(calculateBreakEvenPrice(1000)).toBe(1021);
        });

        it('should handle tax cap for very expensive items', () => {
            // For cost >= 245M, tax is capped at 5M
            // So break-even = cost + 5M
            const cost = 245_000_000;
            expect(calculateBreakEvenPrice(cost)).toBe(cost + 5_000_000);

            const cost2 = 300_000_000;
            expect(calculateBreakEvenPrice(cost2)).toBe(cost2 + 5_000_000);
        });

        it('should return cost for exempt items (no tax)', () => {
            const bondId = 13190; // Old school bond
            expect(calculateBreakEvenPrice(1_000_000, bondId)).toBe(1_000_000);
            expect(calculateBreakEvenPrice(100_000_000, bondId)).toBe(100_000_000);

            const lobsterId = 379; // Lobster
            expect(calculateBreakEvenPrice(500, lobsterId)).toBe(500);
        });

        it('should handle large costs correctly', () => {
            // For a cost of 100M, calculate the correct break-even price
            // estimatedPrice = ceil(100M / 0.98) = ceil(102040816.3265) = 102040817
            // taxAtEstimate = floor(102040817 * 0.02) = 2040816
            // Since actualReceived >= cost, return estimatedPrice
            const cost = 100_000_000;
            const result = calculateBreakEvenPrice(cost);
            expect(result).toBeGreaterThan(0);
            expect(result).toBe(102040817); // Correct break-even price for 100M cost
        });

        it('should never return negative or zero values', () => {
            // Test with various edge cases
            expect(calculateBreakEvenPrice(-100)).toBeNull(); // Negative cost should return null
            expect(calculateBreakEvenPrice(0)).toBeNull(); // Zero cost should return null
            expect(calculateBreakEvenPrice(1)).toBe(1); // Minimum positive should work
            expect(calculateBreakEvenPrice(100)).toBeGreaterThan(0); // Normal case should be positive
        });

        it('should handle data errors (unreasonably high prices)', () => {
            // Test with data error value (2^31-1)
            expect(calculateBreakEvenPrice(2147483647)).toBeNull(); // Should return null for data errors
            expect(calculateGeTax(2147483647)).toBe(0); // Should return 0 tax for data errors
            expect(calculatePostTaxProfit(2147483647, 1000)).toBeNull(); // Should return null for data errors
            expect(calculatePostTaxProfit(1000, 2147483647)).toBeNull(); // Should return null for data errors
        });

        it('should handle very small costs correctly', () => {
            expect(calculateBreakEvenPrice(1)).toBe(1); // Below tax threshold
            expect(calculateBreakEvenPrice(49)).toBe(49); // Below tax threshold
        });
    });

    describe('calculatePostTaxProfit', () => {
        it('should return null if either price is null', () => {
            expect(calculatePostTaxProfit(null, 100)).toBe(null);
            expect(calculatePostTaxProfit(100, null)).toBe(null);
            expect(calculatePostTaxProfit(null, null)).toBe(null);
        });

        it('should calculate profit after tax', () => {
            // Buy at 100, sell at 200
            // Tax on 200 = floor(200 * 0.02) = 4
            // Profit = 200 - 4 - 100 = 96
            expect(calculatePostTaxProfit(200, 100)).toBe(96);

            // Buy at 1000, sell at 1200
            // Tax on 1200 = floor(1200 * 0.02) = 24
            // Profit = 1200 - 24 - 1000 = 176
            expect(calculatePostTaxProfit(1200, 1000)).toBe(176);
        });

        it('should handle items below tax threshold (no tax)', () => {
            // Buy at 20, sell at 40
            // Tax on 40 = 0 (below minimum threshold)
            // Profit = 40 - 0 - 20 = 20
            expect(calculatePostTaxProfit(40, 20)).toBe(20);
        });

        it('should handle tax cap for very expensive items', () => {
            // Buy at 240M, sell at 300M
            // Tax on 300M = 5M (capped)
            // Profit = 300M - 5M - 240M = 55M
            const buyPrice = 300_000_000;
            const sellPrice = 240_000_000;
            expect(calculatePostTaxProfit(buyPrice, sellPrice)).toBe(55_000_000);
        });

        it('should handle negative profit', () => {
            // Buy at 1000, sell at 900
            // Tax on 1000 = floor(1000 * 0.02) = 20
            // Profit = 1000 - 20 - 900 = 80
            expect(calculatePostTaxProfit(1000, 900)).toBe(80);

            // Buy at 500, sell at 600
            // Tax on 500 = floor(500 * 0.02) = 10
            // Profit = 500 - 10 - 600 = -110
            expect(calculatePostTaxProfit(500, 600)).toBe(-110);
        });

        it('should calculate profit without tax for exempt items', () => {
            const bondId = 13190; // Old school bond
            // Buy at 1M, sell at 500K
            // No tax
            // Profit = 1,000,000 - 0 - 500,000 = 500,000
            expect(calculatePostTaxProfit(1_000_000, 500_000, bondId)).toBe(500_000);

            const lobsterId = 379; // Lobster
            // Buy at 300, sell at 200
            // No tax
            // Profit = 300 - 0 - 200 = 100
            expect(calculatePostTaxProfit(300, 200, lobsterId)).toBe(100);
        });
    });

    describe('getTaxDescription', () => {
        it('should describe no tax for items below tax threshold', () => {
            expect(getTaxDescription(49)).toBe('No tax (price below 50 gp)');
        });

        it('should describe normal tax', () => {
            expect(getTaxDescription(100)).toBe('2 gp (2% tax)');
            expect(getTaxDescription(1000)).toBe('20 gp (2% tax)');
        });

        it('should describe capped tax', () => {
            expect(getTaxDescription(300_000_000)).toContain('5,000,000 gp');
            expect(getTaxDescription(300_000_000)).toContain('capped at 5M');
        });

        it('should describe exempt items', () => {
            const bondId = 13190; // Old school bond
            expect(getTaxDescription(1_000_000, bondId)).toBe('No tax (exempt item)');

            const lobsterId = 379; // Lobster
            expect(getTaxDescription(500, lobsterId)).toBe('No tax (exempt item)');
        });
    });

    describe('TAX_EXEMPT_ITEMS', () => {
        it('should contain expected exempt items', () => {
            // Old school bond
            expect(TAX_EXEMPT_ITEMS.has(13190)).toBe(true);

            // Some low level food
            expect(TAX_EXEMPT_ITEMS.has(379)).toBe(true); // Lobster
            expect(TAX_EXEMPT_ITEMS.has(315)).toBe(true); // Shrimps

            // Some tools
            expect(TAX_EXEMPT_ITEMS.has(952)).toBe(true); // Spade
            expect(TAX_EXEMPT_ITEMS.has(1755)).toBe(true); // Chisel

            // Some teleports
            expect(TAX_EXEMPT_ITEMS.has(8007)).toBe(true); // Varrock teleport
            expect(TAX_EXEMPT_ITEMS.has(3853)).toBe(true); // Games necklace(8)
        });

        it('should not contain random non-exempt items', () => {
            expect(TAX_EXEMPT_ITEMS.has(19529)).toBe(false); // Zenyte shard
            expect(TAX_EXEMPT_ITEMS.has(10344)).toBe(false); // 3rd age amulet
        });
    });
});
