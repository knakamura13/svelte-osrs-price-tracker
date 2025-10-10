import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ItemMapping, LatestResponse, PriceRow, Volume24hResponse, TimeseriesResponse } from '$lib/types';

// Extract the row transformation logic for testing
function transformToRow(mapping: ItemMapping, latestMap: LatestResponse, volumeMap: Volume24hResponse): PriceRow {
    const l = latestMap[String(mapping.id)];
    const high = l?.high ?? null;
    const low = l?.low ?? null;

    // First try to get volume from 24h API
    let dailyVolume: number | null = null;
    const volEntry = volumeMap[String(mapping.id)];
    if (volEntry) {
        const highVol = volEntry.highPriceVolume ?? 0;
        const lowVol = volEntry.lowPriceVolume ?? 0;
        const totalVol = highVol + lowVol;
        if (totalVol > 0) {
            dailyVolume = totalVol;
        }
    }

    // If no volume data from 24h API, this would be null (in real implementation we'd fetch from timeseries)
    // For testing purposes, we'll simulate this

    // Calculate margin (buy price - sell price)
    const margin = high != null && low != null ? high - low : null;

    return {
        id: mapping.id,
        name: mapping.name,
        icon: mapping.icon,
        members: mapping.members,
        buyLimit: mapping.limit ?? null,
        buyPrice: high,
        buyTime: l?.highTime ?? null,
        sellPrice: low,
        sellTime: l?.lowTime ?? null,
        margin,
        dailyVolume,
        examine: mapping.examine,
        wikiUrl: `https://oldschool.runescape.wiki/w/${encodeURIComponent(mapping.name)}`,
        highalch: mapping.highalch ?? null,
        lowalch: mapping.lowalch ?? null,
        value: mapping.value ?? null
    };
}

describe('API rows join logic', () => {
    describe('transformToRow', () => {
        it('should join mapping with latest prices', () => {
            const mapping: ItemMapping = { id: 2, name: 'Cannonball', members: true, limit: 11000 };

            const latestMap: LatestResponse = {
                '2': { high: 250, highTime: 1704067200, low: 240, lowTime: 1704067100 }
            };

            const volumeMap: Volume24hResponse = {
                '2': { avgHighPrice: 250, highPriceVolume: 50000, avgLowPrice: 240, lowPriceVolume: 45000 }
            };

            const result = transformToRow(mapping, latestMap, volumeMap);

            expect(result).toEqual({
                id: 2,
                name: 'Cannonball',
                icon: undefined,
                members: true,
                buyLimit: 11000,
                buyPrice: 250,
                buyTime: 1704067200,
                sellPrice: 240,
                sellTime: 1704067100,
                margin: 10,
                dailyVolume: 95000,
                examine: undefined,
                wikiUrl: 'https://oldschool.runescape.wiki/w/Cannonball',
                highalch: null,
                lowalch: null,
                value: null
            });
        });

        it('should handle missing latest data', () => {
            const mapping: ItemMapping = { id: 999, name: 'Rare Item', members: true, limit: 2 };

            const latestMap: LatestResponse = {}; // No data for this item
            const volumeMap: Volume24hResponse = {};

            const result = transformToRow(mapping, latestMap, volumeMap);

            expect(result.buyPrice).toBeNull();
            expect(result.sellPrice).toBeNull();
            expect(result.margin).toBeNull();
            expect(result.dailyVolume).toBeNull();
        });

        it('should calculate margin correctly', () => {
            const mapping: ItemMapping = { id: 1, name: 'Test Item', members: false };

            const latestMap: LatestResponse = {
                '1': { high: 1000, highTime: 1704067200, low: 900, lowTime: 1704067100 }
            };

            const result = transformToRow(mapping, latestMap, {});

            expect(result.margin).toBe(100);
        });

        it('should return null margin when only one price is available', () => {
            const mapping: ItemMapping = { id: 1, name: 'Test Item', members: false };

            const latestMapHighOnly: LatestResponse = {
                '1': { high: 1000, highTime: 1704067200, low: null, lowTime: null }
            };

            const result1 = transformToRow(mapping, latestMapHighOnly, {});
            expect(result1.margin).toBeNull();

            const latestMapLowOnly: LatestResponse = {
                '1': { high: null, highTime: null, low: 900, lowTime: 1704067100 }
            };

            const result2 = transformToRow(mapping, latestMapLowOnly, {});
            expect(result2.margin).toBeNull();
        });

        it('should handle negative margins (when buy price < sell price)', () => {
            const mapping: ItemMapping = { id: 1, name: 'Inverted Item', members: false };

            const latestMap: LatestResponse = {
                '1': { high: 800, highTime: 1704067200, low: 1000, lowTime: 1704067100 }
            };

            const result = transformToRow(mapping, latestMap, {});
            expect(result.margin).toBe(-200); // 800 - 1000 = -200
        });

        it('should handle very large margins correctly', () => {
            const mapping: ItemMapping = { id: 1, name: 'Expensive Item', members: false };

            const latestMap: LatestResponse = {
                '1': { high: 500_000_000, highTime: 1704067200, low: 400_000_000, lowTime: 1704067100 }
            };

            const result = transformToRow(mapping, latestMap, {});
            expect(result.margin).toBe(100_000_000); // 500M - 400M = 100M
        });

        it('should handle zero margin', () => {
            const mapping: ItemMapping = { id: 1, name: 'Same Price Item', members: false };

            const latestMap: LatestResponse = {
                '1': { high: 1000, highTime: 1704067200, low: 1000, lowTime: 1704067100 }
            };

            const result = transformToRow(mapping, latestMap, {});
            expect(result.margin).toBe(0);
        });

        it('should calculate daily volume from high and low price volumes', () => {
            const mapping: ItemMapping = { id: 1, name: 'Test Item', members: false };

            const volumeMap: Volume24hResponse = {
                '1': { avgHighPrice: 100, highPriceVolume: 1000, avgLowPrice: 90, lowPriceVolume: 2000 }
            };

            const result = transformToRow(mapping, {}, volumeMap);

            expect(result.dailyVolume).toBe(3000);
        });

        it('should handle null volumes gracefully', () => {
            const mapping: ItemMapping = { id: 1, name: 'Test Item', members: false };

            const volumeMap: Volume24hResponse = {
                '1': { avgHighPrice: 100, highPriceVolume: null, avgLowPrice: 90, lowPriceVolume: 500 }
            };

            const result = transformToRow(mapping, {}, volumeMap);

            expect(result.dailyVolume).toBe(500);
        });

        it('should encode wiki URLs correctly', () => {
            const mapping: ItemMapping = { id: 1, name: 'Dragon longsword', members: true };

            const result = transformToRow(mapping, {}, {});

            expect(result.wikiUrl).toBe('https://oldschool.runescape.wiki/w/Dragon%20longsword');
        });

        it('should handle special characters in item names for wiki URLs', () => {
            const mapping: ItemMapping = { id: 1, name: '3rd age platebody', members: true };

            const result = transformToRow(mapping, {}, {});

            expect(result.wikiUrl).toBe('https://oldschool.runescape.wiki/w/3rd%20age%20platebody');
        });

        it('should handle volume data correctly when 24h API and timeseries agree', () => {
            // This test documents the current behavior where both APIs agree on volume data
            const mapping: ItemMapping = { id: 1877, name: 'Ugthanki & onion', members: true };

            // 24h API returns volume data that matches timeseries
            const volumeMap: Volume24hResponse = {
                '1877': {
                    avgHighPrice: 21000,
                    highPriceVolume: 463525,
                    avgLowPrice: null,
                    lowPriceVolume: 0
                }
            };

            // Latest data
            const latestMap: LatestResponse = {
                '1877': { high: 21000, highTime: 1760043807, low: 1000, lowTime: 1757255436 }
            };

            const result = transformToRow(mapping, latestMap, volumeMap);

            // Both APIs now agree on the volume
            expect(result.dailyVolume).toBe(463525);
        });
    });

    describe('Volume fallback logic integration test', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should use 24h API data when it agrees with timeseries data', async () => {
            // Mock the external API responses - both APIs agree on volume
            const mockTimeseriesData: TimeseriesResponse = {
                data: [
                    {
                        timestamp: 1760043600,
                        avgHighPrice: 21000,
                        avgLowPrice: null,
                        highPriceVolume: 463525, // Matches 24h API volume
                        lowPriceVolume: 0
                    }
                ]
            };

            const mockVolumeData: Volume24hResponse = {
                '1877': {
                    avgHighPrice: 21000,
                    highPriceVolume: 463525, // Agrees with timeseries
                    avgLowPrice: null,
                    lowPriceVolume: 0
                }
            };

            const mockLatestData = {
                '1877': { high: 21000, highTime: 1760043807, low: 1000, lowTime: 1757255436 }
            };

            const mockMapping: ItemMapping[] = [
                { id: 1877, name: 'Ugthanki & onion', members: true }
            ];

            // Mock fetch responses
            global.fetch = vi.fn()
                .mockImplementationOnce(() => Promise.resolve({ // /api/mapping
                    ok: true,
                    json: () => Promise.resolve(mockMapping)
                }))
                .mockImplementationOnce(() => Promise.resolve({ // /api/latest
                    ok: true,
                    json: () => Promise.resolve({ data: mockLatestData })
                }))
                .mockImplementationOnce(() => Promise.resolve({ // /api/24h
                    ok: true,
                    json: () => Promise.resolve({ data: mockVolumeData })
                }))
                .mockImplementationOnce(() => Promise.resolve({ // timeseries fetch for item 1877
                    ok: true,
                    json: () => Promise.resolve(mockTimeseriesData)
                }));

            // Import and call the actual API handler
            const { GET } = await import('./+server.ts');
            const request = new Request('http://localhost:5173/api/rows');
            const response = await GET({ fetch: global.fetch } as any);

            expect(response.status).toBe(200);

            const data = await response.json();
            const item1877 = data.rows.find((item: PriceRow) => item.id === 1877);

            // Both APIs agree, so should use 24h API data
            expect(item1877.dailyVolume).toBe(463525);
        });

    });
});
