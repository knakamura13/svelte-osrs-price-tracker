import { test, expect } from '@playwright/test';

test.describe('TableSearch functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the main page
        await page.goto('/');
        // Wait for the page to load
        await page.waitForLoadState('networkidle');
    });

    test('should render search bar', async ({ page }) => {
        const searchInput = page.locator('#table-search-input');
        await expect(searchInput).toBeVisible();
    });

    test('should accept text input', async ({ page }) => {
        const searchInput = page.locator('#table-search-input');

        // Type into the search bar
        await searchInput.fill('dragon');

        // Verify the input has the text
        await expect(searchInput).toHaveValue('dragon');
    });

    test('should filter results when typing - spade test', async ({ page }) => {
        const searchInput = page.locator('#table-search-input');

        // Wait for table to be visible
        await page.waitForSelector('table', { timeout: 10000 });

        // Get initial row count
        const initialRows = await page.locator('table tbody tr').count();

        // Search for 'spade'
        await searchInput.fill('spade');

        // Wait for debounce (200ms) plus a bit extra
        await page.waitForTimeout(500);

        // Get filtered row count
        const filteredRows = await page.locator('table tbody tr').count();

        // Get all visible item names (name is in second td, first <a> tag in that td)
        const itemNames = await page.locator('table tbody tr td:nth-child(2) a:first-of-type').allTextContents();

        // Should have at least 1 filtered result (more robust than expecting exact count)
        expect(filteredRows).toBeGreaterThan(0);
        expect(filteredRows).toBeLessThan(initialRows); // Should be fewer than all items

        // All filtered items should contain 'spade' (case-insensitive)
        itemNames.forEach((name) => {
            expect(name.toLowerCase()).toContain('spade');
        });

        // Should have at least 2 items (Spade and Gilded spade currently)
        expect(filteredRows).toBeGreaterThanOrEqual(2);
    });

    test('should clear and show all results when input is cleared', async ({ page }) => {
        const searchInput = page.locator('#table-search-input');

        // Wait for table to be visible
        await page.waitForSelector('table', { timeout: 10000 });

        // Get initial row count
        const initialRows = await page.locator('table tbody tr').count();

        // Type to filter
        await searchInput.fill('dragon');
        await page.waitForTimeout(500);

        // Clear the input
        await searchInput.clear();
        await page.waitForTimeout(500);

        // Should be back to initial count
        const finalRows = await page.locator('table tbody tr').count();
        expect(finalRows).toBe(initialRows);
    });

    test('should handle rapid typing (debounce test)', async ({ page }) => {
        const searchInput = page.locator('#table-search-input');

        // Wait for table
        await page.waitForSelector('table', { timeout: 10000 });

        // Type rapidly, character by character
        await searchInput.type('dragon', { delay: 50 });

        // Should eventually filter after debounce
        await page.waitForTimeout(500);

        // Verify it filtered
        const value = await searchInput.inputValue();
        expect(value).toBe('dragon');

        // Check that table updated
        const rows = await page.locator('table tbody tr').count();
        expect(rows).toBeGreaterThan(0);
    });

    test('should show clear button when input has content', async ({ page }) => {
        const searchInput = page.locator('#table-search-input');

        // Initially, clear button should not be visible
        await expect(page.locator('[aria-label="Clear search"]')).not.toBeVisible();

        // Type into the search bar
        await searchInput.fill('dragon');

        // Clear button should now be visible
        await expect(page.locator('[aria-label="Clear search"]')).toBeVisible();
    });

    test('should clear input when clear button is clicked', async ({ page }) => {
        const searchInput = page.locator('#table-search-input');

        // Type into the search bar
        await searchInput.fill('dragon');

        // Verify input has value
        await expect(searchInput).toHaveValue('dragon');

        // Click the clear button
        await page.locator('[aria-label="Clear search"]').click();

        // Input should be empty
        await expect(searchInput).toHaveValue('');

        // Clear button should no longer be visible
        await expect(page.locator('[aria-label="Clear search"]')).not.toBeVisible();
    });
});
