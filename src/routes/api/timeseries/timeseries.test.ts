import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './+server';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('API timeseries endpoint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset environment variables
        vi.stubEnv('USER_AGENT', 'test-user-agent');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('GET handler', () => {
        it('should require item ID parameter', async () => {
            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/timeseries')
            } as any);

            expect(response.status).toBe(400);
            const responseText = await response.text();
            expect(JSON.parse(responseText)).toEqual({ error: 'Item ID required' });
        });

        it('should proxy successful requests with default timestep (5m)', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue(
                    JSON.stringify({
                        data: [
                            {
                                timestamp: 1704067200,
                                avgHighPrice: 100,
                                avgLowPrice: 90,
                                highPriceVolume: 1000,
                                lowPriceVolume: 900
                            }
                        ]
                    })
                ),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/timeseries?id=123')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=5m&id=123',
                {
                    headers: {
                        'User-Agent': 'test-user-agent'
                    }
                }
            );

            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('application/json');
            expect(response.headers.get('cache-control')).toBe('public, max-age=60');

            const responseText = await response.text();
            expect(JSON.parse(responseText)).toEqual({
                data: [
                    {
                        timestamp: 1704067200,
                        avgHighPrice: 100,
                        avgLowPrice: 90,
                        highPriceVolume: 1000,
                        lowPriceVolume: 900
                    }
                ]
            });
        });

        it('should proxy requests with custom timestep', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue('{}'),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/timeseries?id=123&timestep=1h')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=1h&id=123',
                {
                    headers: {
                        'User-Agent': 'test-user-agent'
                    }
                }
            );
        });

        it('should convert 1y timestep to 24h for external API', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue('{}'),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/timeseries?id=123&timestep=1y')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=24h&id=123',
                {
                    headers: {
                        'User-Agent': 'test-user-agent'
                    }
                }
            );
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
                url: new URL('http://localhost/api/timeseries?id=123')
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
                url: new URL('http://localhost/api/timeseries?id=123')
            } as any);

            expect(response.status).toBe(500);
            const responseText = await response.text();
            expect(JSON.parse(responseText)).toEqual({
                error: 'Network error'
            });
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
                url: new URL('http://localhost/api/timeseries?id=123')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=5m&id=123',
                {
                    headers: {
                        'User-Agent': 'custom-user-agent'
                    }
                }
            );
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
                url: new URL('http://localhost/api/timeseries?id=123')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=5m&id=123',
                {
                    headers: {
                        'User-Agent': 'osrs-price-tracker (dev)'
                    }
                }
            );
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
                url: new URL('http://localhost/api/timeseries?id=123')
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
                url: new URL('http://localhost/api/timeseries?id=123')
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
                url: new URL('http://localhost/api/timeseries?id=test%20item')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=5m&id=test%20item',
                {
                    headers: {
                        'User-Agent': 'test-user-agent'
                    }
                }
            );
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
                url: new URL('http://localhost/api/timeseries?id=123')
            } as any);

            expect(response.status).toBe(200);
            const responseText = await response.text();
            expect(responseText).toBe('');
        });

        it('should handle different timestep values', async () => {
            const timesteps = ['5m', '1h', '6h', '24h'];

            for (const timestep of timesteps) {
                const mockResponse = {
                    ok: true,
                    status: 200,
                    text: vi.fn().mockResolvedValue('{}'),
                    headers: new Map([['content-type', 'application/json']])
                };

                fetchMock.mockResolvedValue(mockResponse);

                await GET({
                    fetch: fetchMock,
                    url: new URL(`http://localhost/api/timeseries?id=123&timestep=${timestep}`)
                } as any);

                expect(fetchMock).toHaveBeenCalledWith(
                    `https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=${timestep}&id=123`,
                    {
                        headers: {
                            'User-Agent': 'test-user-agent'
                        }
                    }
                );
            }
        });
    });
});
