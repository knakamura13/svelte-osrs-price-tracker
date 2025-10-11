import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './+server';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('API mapping endpoint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset environment variables
        vi.stubEnv('USER_AGENT', 'test-user-agent');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('GET handler', () => {
        it('should proxy successful requests to external API', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue(
                    JSON.stringify([
                        {
                            id: 1,
                            name: 'Test Item',
                            icon: 'test_icon.png',
                            members: false,
                            limit: 100,
                            examine: 'A test item',
                            highalch: 60,
                            lowalch: 40,
                            value: 50
                        }
                    ])
                ),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/mapping')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/mapping', {
                headers: {
                    'User-Agent': 'test-user-agent'
                }
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('application/json');

            const responseText = await response.text();
            expect(JSON.parse(responseText)).toEqual([
                {
                    id: 1,
                    name: 'Test Item',
                    icon: 'test_icon.png',
                    members: false,
                    limit: 100,
                    examine: 'A test item',
                    highalch: 60,
                    lowalch: 40,
                    value: 50
                }
            ]);
        });

        it('should handle external API errors', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: vi.fn().mockResolvedValue('External API error'),
                headers: new Map([['content-type', 'text/plain']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/mapping')
            } as any);

            expect(response.status).toBe(500);
            expect(response.headers.get('content-type')).toBe('text/plain');

            const responseText = await response.text();
            expect(responseText).toBe('External API error');
        });

        it('should handle network errors', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/mapping')
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
                url: new URL('http://localhost/api/mapping')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/mapping', {
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
                url: new URL('http://localhost/api/mapping')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/mapping', {
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
                url: new URL('http://localhost/api/mapping')
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
                url: new URL('http://localhost/api/mapping')
            } as any);

            expect(response.headers.get('content-type')).toBe('application/json');
        });
    });
});
