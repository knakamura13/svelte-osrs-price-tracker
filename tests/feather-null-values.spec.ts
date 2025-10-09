import { test, expect } from '@playwright/test';

/**
 * Test case to reproduce the issue where certain values are showing up as null for items.
 * This test should fail initially, demonstrating the problem described in the issue.
 *
 * For the Feather item (id=314), these values should have sane values:
 * - Insta-sell price: typically 2 or 3 gp
 * - Insta-buy price: typically 2 or 3 gp
 * - Post-tax profit (avg): should be calculated from avg buy/sell prices
 * - Potential profit (avg): should be calculated from daily volume x avg profit
 * - Daily low: should be the lowest price in last 24h
 * - Daily high: should be the highest price in last 24h
 * - Avg buy (24h): should be average of insta-buy prices over 24h
 * - Avg sell (24h): should be average of insta-sell prices over 24h
 */
test.describe('Feather item null values issue', () => {
    test('Feather item (id=314) should have non-null daily metrics and profit calculations', async ({ page }) => {
        // Navigate to the home page
        await page.goto('/');

        // Wait for the page to load and table to be visible
        await expect(page.locator('table')).toBeVisible();

        // Search for Feather to filter the table
        const searchInput = page.locator('#search-input');
        await searchInput.fill('Feather');
        await searchInput.press('Enter');

        // Wait for the filtered results
        await page.waitForTimeout(1000);

        // Find the Feather row (it should be the only result)
        const featherRow = page.locator('tr').filter({ hasText: 'Feather' });

        // Wait for the row to be visible
        await expect(featherRow).toBeVisible();

        // Check that these values are NOT null (this should fail initially)
        // For a consistently traded item like Feather, these columns should have values, not '—'

        // Get all table data cells in the Feather row (excluding image)
        const dataCells = featherRow.locator('td').locator('span');

        // Check that we don't have cells showing '—' in positions where we expect values for Feather
        // We'll check specific problematic columns that should have data for this popular item

        // Daily low - should not be null for actively traded item
        const dailyLowText = await dataCells.nth(13).textContent(); // Approximate position
        expect(dailyLowText).not.toBe('—');

        // Daily high - should not be null for actively traded item
        const dailyHighText = await dataCells.nth(14).textContent(); // Approximate position
        expect(dailyHighText).not.toBe('—');

        // Average buy (24h) - should not be null for actively traded item
        const avgBuyText = await dataCells.nth(15).textContent(); // Approximate position
        expect(avgBuyText).not.toBe('—');

        // Average sell (24h) - should not be null for actively traded item
        const avgSellText = await dataCells.nth(16).textContent(); // Approximate position
        expect(avgSellText).not.toBe('—');

        // Post-tax profit (avg) - should not be null for actively traded item
        const postTaxProfitAvgText = await dataCells.nth(9).textContent(); // Approximate position
        expect(postTaxProfitAvgText).not.toBe('—');

        // Potential profit (avg) - should not be null for actively traded item
        const potentialProfitAvgText = await dataCells.nth(11).textContent(); // Approximate position
        expect(potentialProfitAvgText).not.toBe('—');
    });

    test('Feather item API response should include calculated metrics', async ({ request }) => {
        // Test the API directly to verify the data structure
        const response = await request.get('/api/rows');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();
        const rows = data.rows;

        // Find the Feather item
        const featherItem = rows.find((row: any) => row.id === 314);
        expect(featherItem).toBeDefined();

        // These fields should not be null for Feather (id=314)
        // which is a consistently traded item with buy/sell prices of 2-3 gp

        // Daily metrics should be calculated from timeseries data
        expect(featherItem.dailyLow).not.toBeNull();
        expect(featherItem.dailyHigh).not.toBeNull();
        expect(featherItem.averageBuy).not.toBeNull();
        expect(featherItem.averageSell).not.toBeNull();

        // Profit calculations should be based on the daily averages
        expect(featherItem.postTaxProfitAvg).not.toBeNull();
        expect(featherItem.potentialProfitAvg).not.toBeNull();

        // Verify that the prices make sense for Feather (should be 2-3 gp range)
        if (featherItem.averageBuy !== null) {
            expect(featherItem.averageBuy).toBeGreaterThanOrEqual(2);
            expect(featherItem.averageBuy).toBeLessThanOrEqual(3);
        }

        if (featherItem.averageSell !== null) {
            expect(featherItem.averageSell).toBeGreaterThanOrEqual(2);
            expect(featherItem.averageSell).toBeLessThanOrEqual(3);
        }
    });
});
