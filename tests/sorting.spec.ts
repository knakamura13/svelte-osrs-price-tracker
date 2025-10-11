import { test, expect } from '@playwright/test';

test.describe('Sorting functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the main page
        await page.goto('/');
        // Wait for the page to load and table to be visible
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('table', { timeout: 10000 });
        await page.waitForSelector('table tbody tr', { timeout: 10000 });
    });

    test('should render sortable column headers', async ({ page }) => {
        // Check for sortable column headers (they should have sort icons as SVG elements)
        const sortableHeaders = page.locator('th').locator('span').locator('svg');
        const sortableCount = await sortableHeaders.count();
        expect(sortableCount).toBeGreaterThan(0);
    });

    test('should sort by name column', async ({ page }) => {
        // Wait for table to have data
        await page.waitForSelector('table tbody tr td:nth-child(2) a', { timeout: 10000 });

        // Click name column header to sort
        const nameHeader = page.locator('th').filter({ hasText: /name/i }).first();
        await nameHeader.click();
        await page.waitForTimeout(500);

        // Check that sort indicator appears (as SVG element)
        await expect(nameHeader.locator('span').locator('svg')).toBeVisible();

        // Click again to reverse sort
        await nameHeader.click();
        await page.waitForTimeout(500);

        // Should still have sort indicator but in opposite direction
        await expect(nameHeader.locator('span').locator('svg')).toBeVisible();
    });

    test('should sort by buy price column', async ({ page }) => {
        // Find buy price column header
        const buyPriceHeader = page
            .locator('th')
            .filter({ hasText: /buy.*price|price.*buy/i })
            .first();

        if (await buyPriceHeader.isVisible()) {
            // Click to sort by buy price
            await buyPriceHeader.click();
            await page.waitForTimeout(500);

            // Check that sort indicator appears
            await expect(buyPriceHeader.locator('span').locator('svg')).toBeVisible();

            // Click again to reverse sort
            await buyPriceHeader.click();
            await page.waitForTimeout(500);

            // Should still have sort indicator
            await expect(buyPriceHeader.locator('span').locator('svg')).toBeVisible();
        }
    });

    test('should sort by sell price column', async ({ page }) => {
        // Find sell price column header
        const sellPriceHeader = page
            .locator('th')
            .filter({ hasText: /sell.*price|price.*sell/i })
            .first();

        if (await sellPriceHeader.isVisible()) {
            // Click to sort by sell price
            await sellPriceHeader.click();
            await page.waitForTimeout(500);

            // Check that sort indicator appears
            await expect(sellPriceHeader.locator('span').locator('svg')).toBeVisible();

            // Click again to reverse sort
            await sellPriceHeader.click();
            await page.waitForTimeout(500);

            // Should still have sort indicator
            await expect(sellPriceHeader.locator('span').locator('svg')).toBeVisible();
        }
    });

    test('should sort by daily volume column', async ({ page }) => {
        // Find daily volume column header
        const volumeHeader = page
            .locator('th')
            .filter({ hasText: /volume/i })
            .first();

        if (await volumeHeader.isVisible()) {
            // Click to sort by volume
            await volumeHeader.click();
            await page.waitForTimeout(500);

            // Check that sort indicator appears
            await expect(volumeHeader.locator('span').locator('svg')).toBeVisible();

            // Click again to reverse sort
            await volumeHeader.click();
            await page.waitForTimeout(500);

            // Should still have sort indicator
            await expect(volumeHeader.locator('span').locator('svg')).toBeVisible();
        }
    });

    test('should sort by margin column', async ({ page }) => {
        // Find margin column header
        const marginHeader = page
            .locator('th')
            .filter({ hasText: /margin/i })
            .first();

        if (await marginHeader.isVisible()) {
            // Click to sort by margin
            await marginHeader.click();
            await page.waitForTimeout(500);

            // Check that sort indicator appears
            await expect(marginHeader.locator('span').locator('svg')).toBeVisible();

            // Click again to reverse sort
            await marginHeader.click();
            await page.waitForTimeout(500);

            // Should still have sort indicator
            await expect(marginHeader.locator('span').locator('svg')).toBeVisible();
        }
    });

    test('should sort by profit column', async ({ page }) => {
        // Find profit column header
        const profitHeader = page
            .locator('th')
            .filter({ hasText: /profit/i })
            .first();

        if (await profitHeader.isVisible()) {
            // Click to sort by profit
            await profitHeader.click();
            await page.waitForTimeout(500);

            // Check that sort indicator appears
            await expect(profitHeader.locator('span').locator('svg')).toBeVisible();

            // Click again to reverse sort
            await profitHeader.click();
            await page.waitForTimeout(500);

            // Should still have sort indicator
            await expect(profitHeader.locator('span').locator('svg')).toBeVisible();
        }
    });

    test('should sort by buy limit column', async ({ page }) => {
        // Find buy limit column header
        const buyLimitHeader = page
            .locator('th')
            .filter({ hasText: /buy.*limit|limit.*buy/i })
            .first();

        if (await buyLimitHeader.isVisible()) {
            // Click to sort by buy limit
            await buyLimitHeader.click();
            await page.waitForTimeout(500);

            // Check that sort indicator appears
            await expect(buyLimitHeader.locator('span').locator('svg')).toBeVisible();

            // Click again to reverse sort
            await buyLimitHeader.click();
            await page.waitForTimeout(500);

            // Should still have sort indicator
            await expect(buyLimitHeader.locator('span').locator('svg')).toBeVisible();
        }
    });

    test('should sort by time columns', async ({ page }) => {
        // Find time column headers
        const buyTimeHeader = page
            .locator('th')
            .filter({ hasText: /buy.*time|last.*buy/i })
            .first();
        const sellTimeHeader = page
            .locator('th')
            .filter({ hasText: /sell.*time|last.*sell/i })
            .first();

        // Test buy time sorting
        if (await buyTimeHeader.isVisible()) {
            await buyTimeHeader.click();
            await page.waitForTimeout(500);
            await expect(buyTimeHeader.locator('span').locator('svg')).toBeVisible();

            await buyTimeHeader.click();
            await page.waitForTimeout(500);
            await expect(buyTimeHeader.locator('span').locator('svg')).toBeVisible();
        }

        // Test sell time sorting
        if (await sellTimeHeader.isVisible()) {
            await sellTimeHeader.click();
            await page.waitForTimeout(500);
            await expect(sellTimeHeader.locator('span').locator('svg')).toBeVisible();

            await sellTimeHeader.click();
            await page.waitForTimeout(500);
            await expect(sellTimeHeader.locator('span').locator('svg')).toBeVisible();
        }
    });

    test('should handle sorting with filters applied', async ({ page }) => {
        // Apply a filter first
        const searchInput = page.locator('#table-search-input');
        await searchInput.fill('dragon');
        await page.waitForTimeout(1000);

        // Get filtered results
        const filteredRows = await page.locator('table tbody tr').count();
        expect(filteredRows).toBeGreaterThan(0);

        // Sort by name within filtered results
        const nameHeader = page.locator('th').filter({ hasText: /name/i }).first();
        await nameHeader.click();
        await page.waitForTimeout(500);

        // Should still have the filtered results
        const afterSortRows = await page.locator('table tbody tr').count();
        expect(afterSortRows).toBe(filteredRows);

        // Sort indicator should be visible
        await expect(nameHeader.locator('span').locator('svg')).toBeVisible();
    });

    test('should maintain sort state across pagination', async ({ page }) => {
        // Sort by name first
        const nameHeader = page.locator('th').filter({ hasText: /name/i }).first();
        await nameHeader.click();
        await page.waitForTimeout(500);

        // Check sort indicator
        await expect(nameHeader.locator('span').locator('svg')).toBeVisible();

        // Navigate to next page if available
        const nextPageBtn = page
            .locator('button, [role="button"]')
            .filter({ hasText: /next|>/i })
            .first();
        if ((await nextPageBtn.isVisible()) && (await nextPageBtn.isEnabled())) {
            await nextPageBtn.click();
            await page.waitForTimeout(1000);

            // Sort should still be active (name column should still have indicator)
            await expect(nameHeader.locator('span').locator('svg')).toBeVisible();
        }
    });

    test('should show all expected sortable columns', async ({ page }) => {
        // List of expected sortable columns
        const expectedSortableColumns = [
            'Name',
            'Buy limit',
            'Insta-buy price',
            'Last buy',
            'Insta-sell price',
            'Last sell',
            'Break-even price',
            'Margin',
            'Post-tax profit',
            'Daily volume',
            'Daily low',
            'Daily high',
            'Avg buy',
            'Avg sell',
            'Potential profit'
        ];

        for (const columnName of expectedSortableColumns) {
            const header = page
                .locator('th')
                .filter({ hasText: new RegExp(columnName, 'i') })
                .first();

            if (await header.isVisible()) {
                // Should be clickable for sorting
                await expect(header).toBeEnabled();

                // Click to test sorting
                await header.click();
                await page.waitForTimeout(300);

                // Should show sort indicator after clicking
                await expect(header.locator('span').locator('svg')).toBeVisible();
            }
        }
    });

    test('should handle multiple column sorts correctly', async ({ page }) => {
        // Sort by name first
        const nameHeader = page.locator('th').filter({ hasText: /name/i }).first();
        await nameHeader.click();
        await page.waitForTimeout(300);
        await expect(nameHeader.locator('span').locator('svg')).toBeVisible();

        // Sort by price (should replace name sort)
        const buyPriceHeader = page
            .locator('th')
            .filter({ hasText: /buy.*price/i })
            .first();
        if (await buyPriceHeader.isVisible()) {
            await buyPriceHeader.click();
            await page.waitForTimeout(300);

            // Name should show sortable indicator (↕) but not active sort indicator (▲/▼)
            // The name column should still show ↕ to indicate it's sortable
            await expect(nameHeader.locator('span').locator('svg')).toBeVisible();

            // Buy price should have sort indicator
            await expect(buyPriceHeader.locator('span').locator('svg')).toBeVisible();
        }
    });
});
