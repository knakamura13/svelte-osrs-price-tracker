import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { secondsAgoFromUnix } from './time';

describe('time utilities', () => {
    describe('secondsAgoFromUnix', () => {
        let originalNow: () => number;

        beforeEach(() => {
            // Mock Date.now() to return a fixed timestamp
            originalNow = Date.now;
            const mockNow = 1704067200000; // 2024-01-01 00:00:00 UTC
            Date.now = vi.fn(() => mockNow);
        });

        afterEach(() => {
            Date.now = originalNow;
        });

        it('should return "—" for null input', () => {
            expect(secondsAgoFromUnix(null)).toBe('—');
        });

        it('should return "—" for undefined input', () => {
            expect(secondsAgoFromUnix(undefined as any)).toBe('—');
        });

        it('should format seconds ago (< 1 minute)', () => {
            const nowSeconds = Math.floor(Date.now() / 1000);
            expect(secondsAgoFromUnix(nowSeconds - 30)).toBe('30s ago');
            expect(secondsAgoFromUnix(nowSeconds - 1)).toBe('1s ago');
            expect(secondsAgoFromUnix(nowSeconds)).toBe('0s ago');
        });

        it('should format minutes ago (< 1 hour)', () => {
            const nowSeconds = Math.floor(Date.now() / 1000);
            expect(secondsAgoFromUnix(nowSeconds - 60)).toBe('1m ago');
            expect(secondsAgoFromUnix(nowSeconds - 120)).toBe('2m ago');
            expect(secondsAgoFromUnix(nowSeconds - 3540)).toBe('59m ago');
        });

        it('should format hours ago (< 1 day)', () => {
            const nowSeconds = Math.floor(Date.now() / 1000);
            expect(secondsAgoFromUnix(nowSeconds - 3600)).toBe('1h ago');
            expect(secondsAgoFromUnix(nowSeconds - 7200)).toBe('2h ago');
            expect(secondsAgoFromUnix(nowSeconds - 82800)).toBe('23h ago');
        });

        it('should format days ago', () => {
            const nowSeconds = Math.floor(Date.now() / 1000);
            expect(secondsAgoFromUnix(nowSeconds - 86400)).toBe('1d ago');
            expect(secondsAgoFromUnix(nowSeconds - 172800)).toBe('2d ago');
            expect(secondsAgoFromUnix(nowSeconds - 604800)).toBe('7d ago');
        });

        it('should handle future timestamps (edge case)', () => {
            const nowSeconds = Math.floor(Date.now() / 1000);
            // Future timestamp should return 0s ago or negative
            const result = secondsAgoFromUnix(nowSeconds + 100);
            expect(result).toMatch(/ago$/);
        });

        it('should handle very large time differences', () => {
            const nowSeconds = Math.floor(Date.now() / 1000);
            expect(secondsAgoFromUnix(nowSeconds - 31536000)).toBe('365d ago'); // 1 year
        });
    });
});

