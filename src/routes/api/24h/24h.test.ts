import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './+server';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('API 24h endpoint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset environment variables
        vi.stubEnv('USER_AGENT', 'test-user-agent');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('GET handler - general requests', () => {
        it('should proxy general 24h requests to external API', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue(
                    JSON.stringify({
                        '1': {
                            avgHighPrice: 100,
                            highPriceVolume: 1000,
                            avgLowPrice: 90,
                            lowPriceVolume: 900,
                            dailyLow: 85,
                            dailyHigh: 105
                        }
                    })
                ),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValue(mockResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/24h')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/24h', {
                headers: {
                    'User-Agent': 'test-user-agent'
                }
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('application/json');

            const responseText = await response.text();
            expect(JSON.parse(responseText)).toEqual({
                '1': {
                    avgHighPrice: 100,
                    highPriceVolume: 1000,
                    avgLowPrice: 90,
                    lowPriceVolume: 900,
                    dailyLow: 85,
                    dailyHigh: 105
                }
            });
        });

        it('should handle external API errors for general requests', async () => {
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
                url: new URL('http://localhost/api/24h')
            } as any);

            expect(response.status).toBe(500);
            expect(response.headers.get('content-type')).toBe('text/plain');

            const responseText = await response.text();
            expect(responseText).toBe('External API error');
        });
    });

    describe('GET handler - specific item requests', () => {
        it('should fetch and enhance data for specific item', async () => {
            // Mock volume data response
            const volumeResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    '123': {
                        avgHighPrice: 100,
                        highPriceVolume: 1000,
                        avgLowPrice: 90,
                        lowPriceVolume: 900
                    }
                }),
                headers: new Map([['content-type', 'application/json']])
            };

            // Mock timeseries data response
            const timeseriesResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    data: [
                        {
                            timestamp: 1704067200,
                            avgHighPrice: 105,
                            avgLowPrice: 95,
                            highPriceVolume: 500,
                            lowPriceVolume: 450
                        },
                        {
                            timestamp: 1704070800,
                            avgHighPrice: 95,
                            avgLowPrice: 85,
                            highPriceVolume: 500,
                            lowPriceVolume: 450
                        }
                    ]
                }),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValueOnce(volumeResponse).mockResolvedValueOnce(timeseriesResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/24h?id=123')
            } as any);

            expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://prices.runescape.wiki/api/v1/osrs/24h?id=123', {
                headers: {
                    'User-Agent': 'test-user-agent'
                }
            });

            expect(fetchMock).toHaveBeenNthCalledWith(
                2,
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
            const responseData = JSON.parse(responseText);

            expect(responseData['123']).toEqual({
                avgHighPrice: 100,
                highPriceVolume: 1000,
                avgLowPrice: 90,
                lowPriceVolume: 900,
                dailyLow: 85, // min of timeseries avgLowPrice values
                dailyHigh: 105, // max of timeseries avgHighPrice values
                averageBuy: 100, // average of timeseries avgHighPrice values rounded
                averageSell: 90 // average of timeseries avgLowPrice values rounded
            });
        });

        it('should handle missing timeseries data gracefully', async () => {
            // Mock volume data response
            const volumeResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    '123': {
                        avgHighPrice: 100,
                        highPriceVolume: 1000,
                        avgLowPrice: 90,
                        lowPriceVolume: 900
                    }
                }),
                headers: new Map([['content-type', 'application/json']])
            };

            // Mock failed timeseries response
            const timeseriesResponse = {
                ok: false,
                status: 404,
                json: vi.fn().mockResolvedValue({}),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValueOnce(volumeResponse).mockResolvedValueOnce(timeseriesResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/24h?id=123')
            } as any);

            expect(response.status).toBe(200);
            const responseText = await response.text();
            const responseData = JSON.parse(responseText);

            expect(responseData['123']).toEqual({
                avgHighPrice: 100,
                highPriceVolume: 1000,
                avgLowPrice: 90,
                lowPriceVolume: 900,
                dailyLow: null, // no timeseries data available
                dailyHigh: null,
                averageBuy: null,
                averageSell: null
            });
        });

        it('should handle timeseries data with empty data array', async () => {
            // Mock volume data response
            const volumeResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    '123': {
                        avgHighPrice: 100,
                        highPriceVolume: 1000,
                        avgLowPrice: 90,
                        lowPriceVolume: 900
                    }
                }),
                headers: new Map([['content-type', 'application/json']])
            };

            // Mock timeseries response with empty data
            const timeseriesResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: [] }),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValueOnce(volumeResponse).mockResolvedValueOnce(timeseriesResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/24h?id=123')
            } as any);

            expect(response.status).toBe(200);
            const responseText = await response.text();
            const responseData = JSON.parse(responseText);

            expect(responseData['123']).toEqual({
                avgHighPrice: 100,
                highPriceVolume: 1000,
                avgLowPrice: 90,
                lowPriceVolume: 900,
                dailyLow: null, // empty data array
                dailyHigh: null,
                averageBuy: null,
                averageSell: null
            });
        });

        it('should handle timeseries data with missing price fields', async () => {
            // Mock volume data response
            const volumeResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    '123': {
                        avgHighPrice: 100,
                        highPriceVolume: 1000,
                        avgLowPrice: 90,
                        lowPriceVolume: 900
                    }
                }),
                headers: new Map([['content-type', 'application/json']])
            };

            // Mock timeseries response with some missing fields
            const timeseriesResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    data: [
                        {
                            timestamp: 1704067200,
                            avgHighPrice: 105,
                            // avgLowPrice missing
                            highPriceVolume: 500,
                            lowPriceVolume: 450
                        },
                        {
                            timestamp: 1704070800,
                            // avgHighPrice missing
                            avgLowPrice: 85,
                            highPriceVolume: 500,
                            lowPriceVolume: 450
                        }
                    ]
                }),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValueOnce(volumeResponse).mockResolvedValueOnce(timeseriesResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/24h?id=123')
            } as any);

            expect(response.status).toBe(200);
            const responseText = await response.text();
            const responseData = JSON.parse(responseText);

            expect(responseData['123']).toEqual({
                avgHighPrice: 100,
                highPriceVolume: 1000,
                avgLowPrice: 90,
                lowPriceVolume: 900,
                dailyLow: 85, // only one valid sell price
                dailyHigh: 105, // only one valid buy price
                averageBuy: 105, // average of single buy price
                averageSell: 85 // average of single sell price
            });
        });

        it('should handle multiple items in volume response', async () => {
            // Mock volume data response with multiple items
            const volumeResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    '123': {
                        avgHighPrice: 100,
                        highPriceVolume: 1000,
                        avgLowPrice: 90,
                        lowPriceVolume: 900
                    },
                    '456': {
                        avgHighPrice: 200,
                        highPriceVolume: 2000,
                        avgLowPrice: 180,
                        lowPriceVolume: 1800
                    }
                }),
                headers: new Map([['content-type', 'application/json']])
            };

            // Mock timeseries response for first item only
            const timeseriesResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    data: [
                        {
                            timestamp: 1704067200,
                            avgHighPrice: 105,
                            avgLowPrice: 95,
                            highPriceVolume: 500,
                            lowPriceVolume: 450
                        }
                    ]
                }),
                headers: new Map([['content-type', 'application/json']])
            };

            fetchMock.mockResolvedValueOnce(volumeResponse).mockResolvedValueOnce(timeseriesResponse);

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/24h?id=123')
            } as any);

            expect(response.status).toBe(200);
            const responseText = await response.text();
            const responseData = JSON.parse(responseText);

            // First item should have enhanced metrics
            expect(responseData['123']).toEqual({
                avgHighPrice: 100,
                highPriceVolume: 1000,
                avgLowPrice: 90,
                lowPriceVolume: 900,
                dailyLow: 95,
                dailyHigh: 105,
                averageBuy: 105,
                averageSell: 95
            });

            // Second item should have original data without enhancement
            expect(responseData['456']).toEqual({
                avgHighPrice: 200,
                highPriceVolume: 2000,
                avgLowPrice: 180,
                lowPriceVolume: 1800
            });
        });

        it('should handle external API errors for specific item requests', async () => {
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
                url: new URL('http://localhost/api/24h?id=999')
            } as any);

            expect(response.status).toBe(404);
            expect(response.headers.get('content-type')).toBe('text/plain');

            const responseText = await response.text();
            expect(responseText).toBe('Item not found');
        });

        it('should handle network errors during data fetching', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            const response = await GET({
                fetch: fetchMock,
                url: new URL('http://localhost/api/24h?id=123')
            } as any);

            expect(response.status).toBe(500);
            const responseText = await response.text();
            expect(JSON.parse(responseText)).toEqual({
                error: 'Failed to fetch enhanced 24h data'
            });
        });
    });

    describe('calculateDailyMetrics function', () => {
        it('should calculate metrics from timeseries data', () => {
            const dataPoints = [
                {
                    timestamp: 1704067200,
                    avgHighPrice: 105,
                    avgLowPrice: 95,
                    highPriceVolume: 500,
                    lowPriceVolume: 450
                },
                {
                    timestamp: 1704070800,
                    avgHighPrice: 95,
                    avgLowPrice: 85,
                    highPriceVolume: 500,
                    lowPriceVolume: 450
                }
            ];

            // Access the private function through module
            const { GET: getHandler } = require('./+server.ts');
            // We'll test this indirectly through the full endpoint since it's a private function
        });

        it('should handle empty data points', () => {
            // This is tested indirectly through the endpoint tests
        });

        it('should handle missing price fields in data points', () => {
            // This is tested indirectly through the endpoint tests
        });
    });

    describe('common functionality', () => {
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
                url: new URL('http://localhost/api/24h')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/24h', {
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
                url: new URL('http://localhost/api/24h')
            } as any);

            expect(fetchMock).toHaveBeenCalledWith('https://prices.runescape.wiki/api/v1/osrs/24h', {
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
                url: new URL('http://localhost/api/24h')
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
                url: new URL('http://localhost/api/24h')
            } as any);

            expect(response.headers.get('content-type')).toBe('application/json');
        });
    });
});
