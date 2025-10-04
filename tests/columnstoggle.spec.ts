import { test, expect } from '@playwright/test';

test.describe('ColumnsToggle component', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the main page
        await page.goto('/');
        // Wait for the page to load and table to be visible
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('table', { timeout: 10000 });
    });

    test('should render columns toggle trigger button', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });
        await expect(toggleButton).toBeVisible();
    });

    test('should render reset button next to toggle button', async ({ page }) => {
        const resetButton = page.locator('button').filter({ hasText: 'Reset' });
        await expect(resetButton).toBeVisible();

        // Should have proper styling and title
        await expect(resetButton).toHaveClass(/bg-blue-600/);
        await expect(resetButton).toHaveAttribute('title', 'Reset all columns to visible');
    });

    test('should expand/collapse columns panel when clicked', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Initially collapsed
        await expect(page.locator('.accordion-content')).not.toBeVisible();

        // Click to expand
        await toggleButton.click();
        await page.waitForTimeout(300); // Wait for slide animation

        // Should now be expanded
        await expect(page.locator('.accordion-content')).toBeVisible();

        // Click again to collapse
        await toggleButton.click();
        await page.waitForTimeout(300); // Wait for slide animation

        // Should be collapsed again
        await expect(page.locator('.accordion-content')).not.toBeVisible();
    });

    test('should show correct arrow rotation based on expanded state', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Find the arrow button (it should be the button with ▼ text)
        const arrow = page.locator('button[aria-label="Toggle columns panel"]');

        // Initially collapsed - arrow should point down (no rotation)
        await expect(arrow).toHaveClass(/transform/);

        // Click to expand - arrow should rotate 180 degrees
        await toggleButton.click();
        await page.waitForTimeout(300);
        await expect(arrow).toHaveClass(/rotate-180/);

        // Click to collapse - arrow should return to original position
        await toggleButton.click();
        await page.waitForTimeout(300);
        await expect(arrow).not.toHaveClass(/rotate-180/);
    });

    test('should display all column categories when expanded', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Should show all category titles (check each one individually)
        await expect(page.locator('h4').filter({ hasText: 'Item Info' })).toBeVisible();
        await expect(page.locator('h4').filter({ hasText: 'Current Trading' })).toBeVisible();
        await expect(page.locator('h4').filter({ hasText: 'Profit Analysis' })).toBeVisible();
        await expect(page.locator('h4').filter({ hasText: 'Historical Data' })).toBeVisible();
        await expect(page.locator('h4').filter({ hasText: 'Time Filters' })).toBeVisible();
    });

    test('should display all column checkboxes in Item Info category', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Should show Name and Buy limit checkboxes (find by label text)
        const nameCheckbox = page.locator('label').filter({ hasText: 'Name' }).locator('input[type="checkbox"]');
        const buyLimitCheckbox = page
            .locator('label')
            .filter({ hasText: 'Buy limit' })
            .locator('input[type="checkbox"]');

        await expect(nameCheckbox).toBeVisible();
        await expect(buyLimitCheckbox).toBeVisible();

        // Both should be checked by default
        await expect(nameCheckbox).toBeChecked();
        await expect(buyLimitCheckbox).toBeChecked();
    });

    test('should display all column checkboxes in Current Trading category', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Should show Insta-buy price and Insta-sell price checkboxes
        const buyPriceCheckbox = page
            .locator('label')
            .filter({ hasText: 'Insta-buy price' })
            .locator('input[type="checkbox"]');
        const sellPriceCheckbox = page
            .locator('label')
            .filter({ hasText: 'Insta-sell price' })
            .locator('input[type="checkbox"]');

        await expect(buyPriceCheckbox).toBeVisible();
        await expect(sellPriceCheckbox).toBeVisible();

        // Both should be checked by default
        await expect(buyPriceCheckbox).toBeChecked();
        await expect(sellPriceCheckbox).toBeChecked();
    });

    test('should display all column checkboxes in Profit Analysis category', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Should show all profit analysis checkboxes
        const marginCheckbox = page.locator('label').filter({ hasText: 'Margin' }).locator('input[type="checkbox"]');
        const breakEvenCheckbox = page
            .locator('label')
            .filter({ hasText: 'Break-even price' })
            .locator('input[type="checkbox"]');
        const postTaxProfitCheckbox = page
            .locator('label')
            .filter({ hasText: 'Post-tax profit' })
            .locator('input[type="checkbox"]');
        const potentialProfitCheckbox = page
            .locator('label')
            .filter({ hasText: 'Potential profit' })
            .locator('input[type="checkbox"]');

        await expect(marginCheckbox).toBeVisible();
        await expect(breakEvenCheckbox).toBeVisible();
        await expect(postTaxProfitCheckbox).toBeVisible();
        await expect(potentialProfitCheckbox).toBeVisible();

        // All should be checked by default
        await expect(marginCheckbox).toBeChecked();
        await expect(breakEvenCheckbox).toBeChecked();
        await expect(postTaxProfitCheckbox).toBeChecked();
        await expect(potentialProfitCheckbox).toBeChecked();
    });

    test('should display all column checkboxes in Historical Data category', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Should show all historical data checkboxes
        const volumeCheckbox = page
            .locator('label')
            .filter({ hasText: 'Daily volume' })
            .locator('input[type="checkbox"]');
        const lowCheckbox = page.locator('label').filter({ hasText: 'Daily low' }).locator('input[type="checkbox"]');
        const highCheckbox = page.locator('label').filter({ hasText: 'Daily high' }).locator('input[type="checkbox"]');
        const avgBuyCheckbox = page.locator('label').filter({ hasText: 'Avg buy' }).locator('input[type="checkbox"]');
        const avgSellCheckbox = page.locator('label').filter({ hasText: 'Avg sell' }).locator('input[type="checkbox"]');

        await expect(volumeCheckbox).toBeVisible();
        await expect(lowCheckbox).toBeVisible();
        await expect(highCheckbox).toBeVisible();
        await expect(avgBuyCheckbox).toBeVisible();
        await expect(avgSellCheckbox).toBeVisible();

        // All should be checked by default
        await expect(volumeCheckbox).toBeChecked();
        await expect(lowCheckbox).toBeChecked();
        await expect(highCheckbox).toBeChecked();
        await expect(avgBuyCheckbox).toBeChecked();
        await expect(avgSellCheckbox).toBeChecked();
    });

    test('should display all column checkboxes in Time Filters category', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Should show Last buy and Last sell checkboxes
        const buyTimeCheckbox = page.locator('label').filter({ hasText: 'Last buy' }).locator('input[type="checkbox"]');
        const sellTimeCheckbox = page
            .locator('label')
            .filter({ hasText: 'Last sell' })
            .locator('input[type="checkbox"]');

        await expect(buyTimeCheckbox).toBeVisible();
        await expect(sellTimeCheckbox).toBeVisible();

        // Both should be checked by default
        await expect(buyTimeCheckbox).toBeChecked();
        await expect(sellTimeCheckbox).toBeChecked();
    });

    test('should toggle column visibility when checkbox is clicked', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Find a checkbox and uncheck it
        const nameCheckbox = page.locator('label').filter({ hasText: 'Name' }).locator('input[type="checkbox"]');
        await expect(nameCheckbox).toBeChecked();

        // Click to uncheck
        await nameCheckbox.click();
        await expect(nameCheckbox).not.toBeChecked();

        // Click again to check
        await nameCheckbox.click();
        await expect(nameCheckbox).toBeChecked();
    });

    test('should hide/show table columns when checkboxes are toggled', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Initially, Name column should be visible in table
        const nameHeader = page.locator('th').filter({ hasText: /name/i });
        await expect(nameHeader).toBeVisible();

        // Uncheck Name checkbox
        const nameCheckbox = page.locator('label').filter({ hasText: 'Name' }).locator('input[type="checkbox"]');
        await nameCheckbox.click();

        // Name column should now be hidden from table
        await expect(nameHeader).not.toBeVisible();

        // Check Name checkbox again
        await nameCheckbox.click();

        // Name column should be visible again
        await expect(nameHeader).toBeVisible();
    });

    test('should reset all columns to visible when reset button is clicked', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });
        const resetButton = page.locator('button').filter({ hasText: 'Reset' });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Uncheck several checkboxes
        const nameCheckbox = page.locator('label').filter({ hasText: 'Name' }).locator('input[type="checkbox"]');
        const buyLimitCheckbox = page
            .locator('label')
            .filter({ hasText: 'Buy limit' })
            .locator('input[type="checkbox"]');
        const marginCheckbox = page.locator('label').filter({ hasText: 'Margin' }).locator('input[type="checkbox"]');

        await nameCheckbox.click();
        await buyLimitCheckbox.click();
        await marginCheckbox.click();

        // Verify they're unchecked
        await expect(nameCheckbox).not.toBeChecked();
        await expect(buyLimitCheckbox).not.toBeChecked();
        await expect(marginCheckbox).not.toBeChecked();

        // Click reset button
        await resetButton.click();

        // All checkboxes should be checked again
        await expect(nameCheckbox).toBeChecked();
        await expect(buyLimitCheckbox).toBeChecked();
        await expect(marginCheckbox).toBeChecked();

        // Table columns should be visible again
        const nameHeader = page.locator('th').filter({ hasText: /name/i });
        const buyLimitHeader = page.locator('th').filter({ hasText: /buy.*limit/i });
        const marginHeader = page.locator('th').filter({ hasText: /margin/i });

        await expect(nameHeader).toBeVisible();
        await expect(buyLimitHeader).toBeVisible();
        await expect(marginHeader).toBeVisible();
    });

    test('should maintain column state when collapsing and expanding', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Uncheck Name checkbox
        const nameCheckbox = page.locator('label').filter({ hasText: 'Name' }).locator('input[type="checkbox"]');
        await nameCheckbox.click();
        await expect(nameCheckbox).not.toBeChecked();

        // Collapse panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Expand again
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Name checkbox should still be unchecked
        await expect(nameCheckbox).not.toBeChecked();

        // Name column should still be hidden
        const nameHeader = page.locator('th').filter({ hasText: /name/i });
        await expect(nameHeader).not.toBeVisible();
    });

    test('should show proper checkbox labels and structure', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Check that all expected column labels are visible
        const expectedLabels = [
            'Name',
            'Buy limit',
            'Insta-buy price',
            'Insta-sell price',
            'Margin',
            'Break-even price',
            'Post-tax profit',
            'Potential profit',
            'Daily volume',
            'Daily low',
            'Daily high',
            'Avg buy',
            'Avg sell',
            'Last buy',
            'Last sell'
        ];

        for (const labelText of expectedLabels) {
            const label = page.locator('label').filter({ hasText: labelText });
            await expect(label).toBeVisible();

            // Each label should contain a checkbox
            const checkbox = label.locator('input[type="checkbox"]');
            await expect(checkbox).toBeVisible();
        }
    });

    test('should handle multiple column toggles simultaneously', async ({ page }) => {
        const toggleButton = page.locator('button').filter({ hasText: /Toggle columns/ });

        // Expand columns panel
        await toggleButton.click();
        await page.waitForTimeout(300);

        // Get initial visible column count
        const initialVisibleHeaders = await page.locator('th').count();

        // Uncheck multiple columns
        const nameCheckbox = page.locator('label').filter({ hasText: 'Name' }).locator('input[type="checkbox"]');
        const buyLimitCheckbox = page
            .locator('label')
            .filter({ hasText: 'Buy limit' })
            .locator('input[type="checkbox"]');
        const marginCheckbox = page.locator('label').filter({ hasText: 'Margin' }).locator('input[type="checkbox"]');

        await nameCheckbox.click();
        await buyLimitCheckbox.click();
        await marginCheckbox.click();

        // Wait for state changes to propagate
        await page.waitForTimeout(500);

        // Verify columns are hidden
        const nameHeader = page.locator('th').filter({ hasText: /name/i });
        const buyLimitHeader = page.locator('th').filter({ hasText: /buy.*limit/i });
        const marginHeader = page.locator('th').filter({ hasText: /margin/i });

        await expect(nameHeader).not.toBeVisible();
        await expect(buyLimitHeader).not.toBeVisible();
        await expect(marginHeader).not.toBeVisible();

        // Check them back
        await nameCheckbox.click();
        await buyLimitCheckbox.click();
        await marginCheckbox.click();

        // Wait for state changes to propagate
        await page.waitForTimeout(500);

        // Verify columns are visible again
        await expect(nameHeader).toBeVisible();
        await expect(buyLimitHeader).toBeVisible();
        await expect(marginHeader).toBeVisible();
    });
});
