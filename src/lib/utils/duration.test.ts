import { describe, it, expect } from 'vitest';
import { partsFromSeconds, secondsFromParts } from './duration';

describe('duration utilities', () => {
    describe('partsFromSeconds', () => {
        it('should return all zeros for zero seconds', () => {
            expect(partsFromSeconds(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        });

        it('should handle null input', () => {
            expect(partsFromSeconds(null)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        });

        it('should handle undefined input', () => {
            expect(partsFromSeconds(undefined)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        });

        it('should handle negative numbers', () => {
            expect(partsFromSeconds(-100)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        });

        it('should handle non-finite numbers', () => {
            expect(partsFromSeconds(Infinity)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            expect(partsFromSeconds(NaN)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        });

        it('should convert seconds correctly', () => {
            expect(partsFromSeconds(59)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 59 });
        });

        it('should convert minutes correctly', () => {
            expect(partsFromSeconds(60)).toEqual({ days: 0, hours: 0, minutes: 1, seconds: 0 });
            expect(partsFromSeconds(3599)).toEqual({ days: 0, hours: 0, minutes: 59, seconds: 59 });
        });

        it('should convert hours correctly', () => {
            expect(partsFromSeconds(3600)).toEqual({ days: 0, hours: 1, minutes: 0, seconds: 0 });
            expect(partsFromSeconds(3661)).toEqual({ days: 0, hours: 1, minutes: 1, seconds: 1 });
            expect(partsFromSeconds(86399)).toEqual({ days: 0, hours: 23, minutes: 59, seconds: 59 });
        });

        it('should convert days correctly', () => {
            expect(partsFromSeconds(86400)).toEqual({ days: 1, hours: 0, minutes: 0, seconds: 0 });
            expect(partsFromSeconds(90061)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 });
        });

        it('should handle large values', () => {
            expect(partsFromSeconds(31536000)).toEqual({ days: 365, hours: 0, minutes: 0, seconds: 0 }); // 1 year
        });

        it('should handle fractional seconds (floored)', () => {
            expect(partsFromSeconds(1.9)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1.9 });
        });
    });

    describe('secondsFromParts', () => {
        it('should return 0 for all zero parts', () => {
            expect(secondsFromParts(0, 0, 0, 0)).toBe(0);
        });

        it('should handle null inputs', () => {
            expect(secondsFromParts(null, null, null, null)).toBe(0);
        });

        it('should handle undefined inputs', () => {
            expect(secondsFromParts(undefined, undefined, undefined, undefined)).toBe(0);
        });

        it('should handle negative inputs', () => {
            expect(secondsFromParts(-1, 0, 0, 0)).toBe(0);
            expect(secondsFromParts(0, -1, 0, 0)).toBe(0);
            expect(secondsFromParts(0, 0, -1, 0)).toBe(0);
            expect(secondsFromParts(0, 0, 0, -1)).toBe(0);
        });

        it('should handle non-finite inputs', () => {
            expect(secondsFromParts(Infinity, 0, 0, 0)).toBe(0);
            expect(secondsFromParts(0, Infinity, 0, 0)).toBe(0);
            expect(secondsFromParts(0, 0, Infinity, 0)).toBe(0);
            expect(secondsFromParts(0, 0, 0, Infinity)).toBe(0);
            expect(secondsFromParts(NaN, 0, 0, 0)).toBe(0);
        });

        it('should convert seconds correctly', () => {
            expect(secondsFromParts(0, 0, 0, 59)).toBe(59);
        });

        it('should convert minutes correctly', () => {
            expect(secondsFromParts(0, 0, 1, 0)).toBe(60);
            expect(secondsFromParts(0, 0, 59, 59)).toBe(3599);
        });

        it('should convert hours correctly', () => {
            expect(secondsFromParts(0, 1, 0, 0)).toBe(3600);
            expect(secondsFromParts(0, 23, 59, 59)).toBe(86399);
        });

        it('should convert days correctly', () => {
            expect(secondsFromParts(1, 0, 0, 0)).toBe(86400);
            expect(secondsFromParts(1, 1, 1, 1)).toBe(90061);
        });

        it('should handle large values', () => {
            expect(secondsFromParts(365, 0, 0, 0)).toBe(31536000); // 1 year
        });

        it('should handle fractional inputs (floored)', () => {
            expect(secondsFromParts(1.9, 0, 0, 0)).toBe(86400);
            expect(secondsFromParts(0, 1.9, 0, 0)).toBe(3600);
        });
    });

    describe('round-trip conversion', () => {
        it('should be able to convert back and forth accurately', () => {
            const testCases = [
                0,
                1,
                59,
                60,
                61,
                3599,
                3600,
                3661,
                86399,
                86400,
                90061,
                31536000 // 1 year
            ];

            for (const seconds of testCases) {
                const parts = partsFromSeconds(seconds);
                const backToSeconds = secondsFromParts(parts.days, parts.hours, parts.minutes, parts.seconds);
                expect(backToSeconds).toBe(seconds);
            }
        });
    });
});
