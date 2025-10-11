import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './+server';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('API latest endpoint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset environment variables
        vi.stubEnv('USER_AGENT', 'test-user-agent');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('GET handler', () => {
        it('should proxy requests without ID to external API', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue(
                    JSON.stringify({
                        '1': { high: 100, low: 90, highTime: 1704067200, lowTime: 1704067200 },
                        '2': { high: 200, low: 180, highTime: 1704067200, lowTime: 1704067200 }
                    })
                ),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/latest')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/latest', {
                headers: {
                    'User-Agent': 'test-user-agent'
                }
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('application/json');

            const responseText = await response.text();
            expect(JSON.parse(responseText)).toEqual({
                '1': { high: 100, low: 90, highTime: 1704067200, lowTime: 1704067200 },
                '2': { high: 200, low: 180, highTime: 1704067200, lowTime: 1704067200 }
            });
        });

        it('should proxy requests with ID to external API', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue(
                    JSON.stringify({
                        '123': { high: 150, low: 140, highTime: 1704067200, lowTime: 1704067200 }
                    })
                ),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/latest?id=123')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/latest?id=123', {
                headers: {
                    'User-Agent': 'test-user-agent'
                }
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('application/json');

            const responseText = await response.text();
            expect(JSON.parse(responseText)).toEqual({
                '123': { high: 150, low: 140, highTime: 1704067200, lowTime: 1704067200 }
            });
        });

        it('should handle external API errors', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: vi.fn().mockResolvedValue('Item not found'),
                headers: new Map([['content-type', 'text/plain']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/latest?id=999')
            } as any);

            expect(response.status).toBe(404);
            expect(response.headers.get('content-type')).toBe('text/plain');

            const responseText = await response.text();
            expect(responseText).toBe('Item not found');
        });

        it('should handle network errors', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/latest')
            } as any);

            // Should still return a response (the error is handled internally)
            expect(response.status).toBeDefined();
        });

        it('should use custom USER_AGENT when provided', async () => {
            vi.stubEnv('USER_AGENT', 'custom-user-agent');

            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue('{}'),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/latest')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/latest', {
                headers: {
                    'User-Agent': 'custom-user-agent'
                }
            });
        });

        it('should use default USER_AGENT when not provided', async () => {
            vi.unstubAllEnvs();

            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue('{}'),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/latest')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/latest', {
                headers: {
                    'User-Agent': 'osrs-price-tracker (dev)'
                }
            });
        });

        it('should preserve content-type header from external API', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue('{}'),
                headers: new Map([['content-type', 'application/json; charset=utf-8']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/latest')
            } as any);

            expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
        });

        it('should handle missing content-type header', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue('{}'),
                headers: new Map()
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/latest')
            } as any);

            expect(response.headers.get('content-type')).toBe('application/json');
        });

        it('should handle URL encoding for item IDs with special characters', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue('{}'),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/latest?id=test%20item')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/latest?id=test%20item', {
                headers: {
                    'User-Agent': 'test-user-agent'
                }
            });
        });

        it('should handle empty response text', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue(''),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/latest')
            } as any);

            expect(response.status).toBe(200);
            const responseText = await response.text();
            expect(responseText).toBe('');
        });
    });
});
