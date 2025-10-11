import { describe, it, expect } from 'vitest';
import { formatInt, formatPrice } from './format';

describe('format utilities', () => {
    describe('formatInt', () => {
        it('should format integers with locale formatting', () => {
            expect(formatInt(0)).toBe('0');
            expect(formatInt(123)).toBe('123');
            expect(formatInt(1234)).toBe('1,234');
            expect(formatInt(1234567)).toBe('1,234,567');
        });

        it('should handle null input', () => {
            expect(formatInt(null)).toBe('—');
        });

        it('should handle undefined input', () => {
            expect(formatInt(undefined)).toBe('—');
        });

        it('should handle large numbers', () => {
            expect(formatInt(1000000000)).toBe('1,000,000,000');
            expect(formatInt(999999999999)).toBe('999,999,999,999');
        });

        it('should handle negative numbers', () => {
            expect(formatInt(-123)).toBe('-123');
            expect(formatInt(-1234)).toBe('-1,234');
            expect(formatInt(-1234567)).toBe('-1,234,567');
        });

        it('should handle zero', () => {
            expect(formatInt(0)).toBe('0');
        });

        it('should handle decimal numbers (floored)', () => {
            expect(formatInt(123.9)).toBe('123.9');
            expect(formatInt(123.1)).toBe('123.1');
        });
    });

    describe('formatPrice', () => {
        describe('with decimalView = false (default)', () => {
            it('should format integers normally', () => {
                expect(formatPrice(0)).toBe('0');
                expect(formatPrice(123)).toBe('123');
                expect(formatPrice(1234)).toBe('1,234');
                expect(formatPrice(1234567)).toBe('1,234,567');
            });

            it('should handle null input', () => {
                expect(formatPrice(null)).toBe('—');
            });

            it('should handle negative numbers', () => {
                expect(formatPrice(-123)).toBe('-123');
                expect(formatPrice(-1234)).toBe('-1,234');
            });
        });

        describe('with decimalView = true', () => {
            it('should format small numbers with decimals', () => {
                expect(formatPrice(0, true)).toBe('0.00');
                expect(formatPrice(123, true)).toBe('123.00');
                expect(formatPrice(123.456, true)).toBe('123.46');
                expect(formatPrice(123.451, true)).toBe('123.45');
            });

            it('should handle negative decimals', () => {
                expect(formatPrice(-123.456, true)).toBe('-123.46');
                expect(formatPrice(-123.451, true)).toBe('-123.45');
            });

            it('should handle custom decimal places', () => {
                expect(formatPrice(123.456, true, 3)).toBe('123.456');
                expect(formatPrice(123.456, true, 1)).toBe('123.5');
                expect(formatPrice(123.456, true, 0)).toBe('123');
            });
        });

        describe('abbreviated formatting', () => {
            it('should format thousands with k suffix', () => {
                expect(formatPrice(1000, true)).toBe('1.00k');
                expect(formatPrice(1500, true)).toBe('1.50k');
                expect(formatPrice(999999, true)).toBe('999.999k');
            });

            it('should format millions with m suffix', () => {
                expect(formatPrice(1000000, true)).toBe('1.00m');
                expect(formatPrice(1500000, true)).toBe('1.50m');
                expect(formatPrice(999999999, true)).toBe('999.999m');
            });

            it('should format billions with b suffix', () => {
                expect(formatPrice(1000000000, true)).toBe('1.00b');
                expect(formatPrice(1500000000, true)).toBe('1.50b');
                expect(formatPrice(999999999999, true)).toBe('999.999b');
            });

            it('should handle negative abbreviated values', () => {
                expect(formatPrice(-1000, true)).toBe('-1.00k');
                expect(formatPrice(-1000000, true)).toBe('-1.00m');
                expect(formatPrice(-1000000000, true)).toBe('-1.00b');
            });

            it('should handle zero in abbreviated format', () => {
                expect(formatPrice(0, true)).toBe('0.00');
            });

            it('should handle boundary values', () => {
                expect(formatPrice(999, true)).toBe('999.00');
                expect(formatPrice(1000, true)).toBe('1.00k');
                expect(formatPrice(999999, true)).toBe('999.999k');
                expect(formatPrice(1000000, true)).toBe('1.00m');
                expect(formatPrice(999999999, true)).toBe('999.999m');
                expect(formatPrice(1000000000, true)).toBe('1.00b');
            });
        });

        describe('edge cases', () => {
            it('should handle very large numbers', () => {
                expect(formatPrice(999999999999999, true)).toBe('1000000.00b');
            });

            it('should handle very small numbers', () => {
                expect(formatPrice(0.001, true)).toBe('0.00');
                expect(formatPrice(0.01, true)).toBe('0.01');
            });

            it('should handle floating point precision', () => {
                expect(formatPrice(0.1 + 0.2, true)).toBe('0.30');
                expect(formatPrice(1.005, true, 2)).toBe('1.01');
            });

            it('should handle null and undefined', () => {
                expect(formatPrice(null, true)).toBe('—');
                expect(formatPrice(undefined, true)).toBe('—');
            });
        });
    });
});
