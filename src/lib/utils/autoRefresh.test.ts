import { describe, it, expect } from 'vitest';
import { calculateBackoff } from './autoRefresh';

describe('autoRefresh utilities', () => {
    describe('calculateBackoff', () => {
        it('should return base delay when failCount is 0', () => {
            expect(calculateBackoff(0, 60)).toBe(60);
            expect(calculateBackoff(0, 30)).toBe(30);
        });

        it('should apply exponential backoff for increasing fail counts', () => {
            const baseDelay = 60;
            
            // failCount 1: 60 * 2^0 = 60
            expect(calculateBackoff(1, baseDelay)).toBe(60);
            
            // failCount 2: 60 * 2^1 = 120
            expect(calculateBackoff(2, baseDelay)).toBe(120);
            
            // failCount 3: 60 * 2^2 = 240
            expect(calculateBackoff(3, baseDelay)).toBe(240);
            
            // failCount 4: 60 * 2^3 = 480, but capped at 300
            expect(calculateBackoff(4, baseDelay)).toBe(300);
        });

        it('should cap at 300 seconds (5 minutes)', () => {
            expect(calculateBackoff(5, 60)).toBe(300);
            expect(calculateBackoff(10, 60)).toBe(300);
            expect(calculateBackoff(100, 60)).toBe(300);
        });

        it('should work with different base delays', () => {
            // Base delay 30s
            expect(calculateBackoff(1, 30)).toBe(30);
            expect(calculateBackoff(2, 30)).toBe(60);
            expect(calculateBackoff(3, 30)).toBe(120);
            expect(calculateBackoff(4, 30)).toBe(240);
            expect(calculateBackoff(5, 30)).toBe(300); // capped
            
            // Base delay 5s (minimum)
            expect(calculateBackoff(1, 5)).toBe(5);
            expect(calculateBackoff(2, 5)).toBe(10);
            expect(calculateBackoff(3, 5)).toBe(20);
        });

        it('should handle edge cases', () => {
            // Negative failCount (edge case)
            expect(calculateBackoff(-1, 60)).toBe(60 * Math.pow(2, -2)); // 15
            
            // Very high failCount
            expect(calculateBackoff(1000, 60)).toBe(300); // capped
        });
    });
});

