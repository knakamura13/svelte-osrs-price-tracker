import { test, expect } from '@playwright/test';

test.describe('API Item Endpoint', () => {
    test('should return item data for valid item ID', async ({ request }) => {
        // Test with a known item ID (Cannonball)
        const res = await request.get('/api/item/2');
        expect(res.status()).toBe(200);

        const data = await res.json();
        expect(data).toHaveProperty('item');
        expect(data.item).toHaveProperty('id', 2);
        expect(data.item).toHaveProperty('name');
        expect(data.item).toHaveProperty('buyPrice');
        expect(data.item).toHaveProperty('sellPrice');
        expect(data.item).toHaveProperty('wikiUrl');
        expect(data.item.id).toBe(2);
    });

    test('should return 404 for non-existent item ID', async ({ request }) => {
        const res = await request.get('/api/item/999999');
        expect(res.status()).toBe(404);
    });

    test('should return 400 for invalid item ID format', async ({ request }) => {
        const res = await request.get('/api/item/invalid');
        expect(res.status()).toBe(400);
    });

    test('should return item data with all expected fields', async ({ request }) => {
        const res = await request.get('/api/item/2');
        expect(res.status()).toBe(200);

        const data = await res.json();
        const item = data.item;

        // Required fields that should always be present
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('wikiUrl');
        expect(item).toHaveProperty('examine');

        // Price-related fields (may be null)
        expect(item).toHaveProperty('buyPrice');
        expect(item).toHaveProperty('sellPrice');
        expect(item).toHaveProperty('buyLimit');
        expect(item).toHaveProperty('margin');
        expect(item).toHaveProperty('dailyVolume');
        expect(item).toHaveProperty('potentialProfit');

        // Time fields (may be null)
        expect(item).toHaveProperty('buyTime');
        expect(item).toHaveProperty('sellTime');

        // Daily metrics (may be null)
        expect(item).toHaveProperty('dailyLow');
        expect(item).toHaveProperty('dailyHigh');
        expect(item).toHaveProperty('averageBuy');
        expect(item).toHaveProperty('averageSell');

        // Alchemy values (may be null)
        expect(item).toHaveProperty('highalch');
        expect(item).toHaveProperty('lowalch');
        expect(item).toHaveProperty('value');

        // Boolean field
        expect(item).toHaveProperty('members');
        expect(typeof item.members).toBe('boolean');
    });

    test('should return consistent data structure with rows API', async ({ request }) => {
        // Get data from both APIs for comparison
        // Add a longer delay between calls to avoid race conditions with external API data
        // Using 2000ms to ensure external APIs have consistent data and avoid rate limiting
        const itemRes = await request.get('/api/item/2');
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2000ms delay
        const rowsRes = await request.get('/api/rows');

        expect(itemRes.status()).toBe(200);
        expect(rowsRes.status()).toBe(200);

        const itemData = await itemRes.json();
        const rowsData = await rowsRes.json();

        // Find the same item in the rows data
        const itemFromRows = rowsData.rows?.find((row: any) => row.id === 2);
        expect(itemFromRows).toBeDefined();

        const newItem = itemData.item;

        // Compare key fields (they should match)
        expect(newItem.id).toBe(itemFromRows.id);
        expect(newItem.name).toBe(itemFromRows.name);
        expect(newItem.buyPrice).toBe(itemFromRows.buyPrice);
        expect(newItem.sellPrice).toBe(itemFromRows.sellPrice);
        expect(newItem.buyLimit).toBe(itemFromRows.buyLimit);
        expect(newItem.wikiUrl).toBe(itemFromRows.wikiUrl);
        expect(newItem.members).toBe(itemFromRows.members);
    });

    test('should handle edge case item IDs', async ({ request }) => {
        // Test with item ID 2 (Cannonball - known to exist)
        const res2 = await request.get('/api/item/2');
        expect(res2.status()).toBe(200);

        // Test with a very high item ID that likely doesn't exist
        const resHigh = await request.get('/api/item/99999');
        expect(resHigh.status()).toBe(404);

        // Test with item ID 0 (edge case)
        const resZero = await request.get('/api/item/0');
        // This might return 404 or 400 depending on implementation
        expect([400, 404]).toContain(resZero.status());
    });

    test('should return cached responses for repeated requests', async ({ request }) => {
        // Make two requests to the same endpoint
        const res1 = await request.get('/api/item/2');
        const res2 = await request.get('/api/item/2');

        expect(res1.status()).toBe(200);
        expect(res2.status()).toBe(200);

        const data1 = await res1.json();
        const data2 = await res2.json();

        // Should return identical data (indicating caching is working)
        expect(data1.item.id).toBe(data2.item.id);
        expect(data1.item.name).toBe(data2.item.name);
        expect(data1.item.buyPrice).toBe(data2.item.buyPrice);
        expect(data1.item.sellPrice).toBe(data2.item.sellPrice);
    });
});
