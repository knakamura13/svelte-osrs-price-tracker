import { test, expect } from '@playwright/test';

test.describe('ItemSearch functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the main page
        await page.goto('/');
        // Wait for the page to load
        await page.waitForLoadState('networkidle');
    });

    test('should render item search in header', async ({ page }) => {
        // The ItemSearch should be in the header
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();
        await expect(searchInput).toBeVisible();
    });

    test('should show dropdown when typing', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();

        // Type into the search bar
        await searchInput.fill('dagger');

        // Dropdown should appear with results
        await expect(page.locator('.absolute.z-50')).toBeVisible();

        // Should have search results
        const results = page.locator('.absolute.z-50 button');
        await expect(results).toHaveCount(10); // Exactly 10 results as specified
    });

    test('should return exactly 10 dagger results in correct order', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();

        // Type "dagger"
        await searchInput.fill('dagger');

        // Get all search results
        const results = page.locator('.absolute.z-50 button');
        await expect(results).toHaveCount(10);

        // Check that results are in ascending alphanumeric order and match expected items
        const expectedItems = [
            'Abyssal dagger',
            'Abyssal dagger (p)',
            'Abyssal dagger (p+)',
            'Abyssal dagger (p++)',
            'Adamant dagger',
            'Adamant dagger(p)',
            'Adamant dagger(p+)',
            'Adamant dagger(p++)',
            'Black dagger',
            'Black dagger(p)'
        ];

        for (let i = 0; i < expectedItems.length; i++) {
            const resultText = await results.nth(i).textContent();
            expect(resultText?.trim()).toBe(expectedItems[i]);
        }
    });

    test('should return exactly 2 Leaf-bladed results', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();

        // Type "Leaf-bladed"
        await searchInput.fill('Leaf-bladed');

        // Get all search results
        const results = page.locator('.absolute.z-50 button');
        await expect(results).toHaveCount(2);

        // Check that results match expected items
        const expectedItems = ['Leaf-bladed battleaxe', 'Leaf-bladed sword'];

        for (let i = 0; i < expectedItems.length; i++) {
            const resultText = await results.nth(i).textContent();
            expect(resultText?.trim()).toBe(expectedItems[i]);
        }
    });

    test('should hide dropdown when search is cleared', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();

        // Type to show dropdown
        await searchInput.fill('dagger');
        await expect(page.locator('.absolute.z-50')).toBeVisible();

        // Clear the search
        await searchInput.clear();

        // Dropdown should be hidden
        await expect(page.locator('.absolute.z-50')).not.toBeVisible();
    });

    test('should navigate to item page when result is clicked', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();

        // Type "dagger"
        await searchInput.fill('dagger');

        // Click the second result (Abyssal dagger (p))
        const secondResult = page.locator('.absolute.z-50 button').nth(1);
        await secondResult.click();

        // Should navigate to the item page
        await expect(page).toHaveURL(/\/item\/\d+/);

        // Should show the item details - check that it contains "Abyssal dagger"
        await expect(page.locator('h1')).toContainText('Abyssal dagger');
    });

    test('should handle keyboard navigation', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();

        // Focus the search input
        await searchInput.focus();

        // Type "dagger"
        await searchInput.fill('dagger');

        // Press Enter to select first result
        await searchInput.press('Enter');

        // Should navigate to the item page
        await expect(page).toHaveURL(/\/item\/\d+/);
    });

    test('should hide dropdown on Escape key', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();

        // Type to show dropdown
        await searchInput.fill('dagger');
        await expect(page.locator('.absolute.z-50')).toBeVisible();

        // Press Escape
        await searchInput.press('Escape');

        // Dropdown should be hidden
        await expect(page.locator('.absolute.z-50')).not.toBeVisible();
    });

    test('should show no results message when no matches found', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();

        // Type something that won't match
        await searchInput.fill('xyz123nonexistent');

        // Should show "No items found" message
        await expect(page.locator('.absolute.z-50')).toContainText('No items found');
    });
});
