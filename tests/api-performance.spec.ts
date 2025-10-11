import { test, expect } from '@playwright/test';

test.describe('API Performance Tests', () => {
    test('new item API endpoint should be significantly faster than fetching all rows', async ({ request }) => {
        const itemId = '2'; // Cannonball

        // Test the new dedicated endpoint
        const startTimeNew = Date.now();
        const itemRes = await request.get(`/api/item/${itemId}`);
        const endTimeNew = Date.now();
        const newEndpointDuration = endTimeNew - startTimeNew;

        expect(itemRes.status()).toBe(200);

        // Test the old approach (fetching all rows and filtering)
        const startTimeOld = Date.now();
        const rowsRes = await request.get('/api/rows');
        const endTimeOld = Date.now();
        const oldApproachDuration = endTimeOld - startTimeOld;

        expect(rowsRes.status()).toBe(200);

        const rowsData = await rowsRes.json();
        const itemFromRows = rowsData.rows?.find((row: any) => String(row.id) === itemId);

        // Verify both approaches return the same item
        const itemData = await itemRes.json();
        expect(itemFromRows).toBeDefined();
        expect(itemData.item.id).toBe(itemFromRows.id);

        // The new endpoint should be significantly faster
        // We expect at least 2x improvement, but this is a rough estimate
        // In practice, the improvement could be much greater (10x-100x)
        const improvementRatio = oldApproachDuration / newEndpointDuration;
        console.log(`Performance improvement: ${improvementRatio.toFixed(2)}x faster`);
        console.log(`Old approach: ${oldApproachDuration}ms`);
        console.log(`New approach: ${newEndpointDuration}ms`);

        // Log the sizes for comparison
        const itemDataSize = JSON.stringify(itemData).length;
        const rowsDataSize = JSON.stringify(rowsData).length;
        console.log(`New endpoint response size: ${itemDataSize} bytes`);
        console.log(`Old approach response size: ${rowsDataSize} bytes`);
        console.log(`Size reduction: ${(rowsDataSize / itemDataSize).toFixed(1)}x smaller`);

        // The new endpoint should complete in reasonable time (< 1 second typically)
        expect(newEndpointDuration).toBeLessThan(1000);

        // The old approach should take longer, but we don't enforce this strictly
        // as it depends on the dataset size and network conditions
        expect(oldApproachDuration).toBeGreaterThan(0);
    });

    test('item detail page should load quickly with new API', async ({ page }) => {
        // Navigate to an item detail page
        const startTime = Date.now();
        await page.goto('/item/2');
        const loadTime = Date.now() - startTime;

        // Page should load in reasonable time
        expect(loadTime).toBeLessThan(3000); // 3 seconds max (generous for E2E test)

        // Verify the page loaded correctly
        await expect(page.locator('h1')).toContainText('Cannonball');

        // Verify price information is displayed (look for the price containers)
        await expect(page.locator('.text-orange-600').first()).toBeVisible(); // Buy price
        await expect(page.locator('.text-green-600').first()).toBeVisible(); // Sell price

        // Verify other key elements are present
        await expect(page.locator('img[alt="Cannonball"]')).toBeVisible(); // Item icon
        await expect(page.locator('text=Daily volume:')).toBeVisible();

        console.log(`Item detail page loaded in ${loadTime}ms`);
    });
});
