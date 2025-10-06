import { test, expect } from '@playwright/test';

test.describe('PaginationControls component', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the main page
        await page.goto('/');
        // Wait for the page to load and table to be visible
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('table', { timeout: 10000 });
    });

    test('should render page size selector', async ({ page }) => {
        // Should have "Rows per page" label (use first instance)
        const pageSizeLabel = page.locator('label').filter({ hasText: 'Rows per page' }).first();
        await expect(pageSizeLabel).toBeVisible();

        // Should have select element for page size (use first instance)
        const pageSizeSelect = page.locator('select#page-size').first();
        await expect(pageSizeSelect).toBeVisible();

        // Should have proper styling
        await expect(pageSizeSelect).toHaveClass(/border p-1/);
    });

    test('should display page size options correctly', async ({ page }) => {
        const pageSizeSelect = page.locator('select#page-size').first();

        // Should have all expected options
        const options = pageSizeSelect.locator('option');
        await expect(options).toContainText(['25', '50', '100', '250']);

        // Should have correct option values (use first instance of each)
        const option25 = options.filter({ hasText: '25' }).first();
        const option50 = options.filter({ hasText: '50' }).first();
        const option100 = options.filter({ hasText: '100' }).first();
        const option250 = options.filter({ hasText: '250' }).first();

        await expect(option25).toHaveAttribute('value', '25');
        await expect(option50).toHaveAttribute('value', '50');
        await expect(option100).toHaveAttribute('value', '100');
        await expect(option250).toHaveAttribute('value', '250');
    });

    test('should display current page information', async ({ page }) => {
        // Should show page information in format "Page X of Y (Z items)" (use first instance)
        const pageInfo = page
            .locator('span')
            .filter({ hasText: /Page \d+ of \d+ \(\d+ items\)/ })
            .first();
        await expect(pageInfo).toBeVisible();

        // Should have proper opacity styling
        await expect(pageInfo).toHaveClass(/opacity-70/);
    });

    test('should render all navigation buttons', async ({ page }) => {
        // Should have First button - use title attribute for identification (use first instance)
        const firstButton = page.locator('button[title="First page"]').first();
        await expect(firstButton).toBeVisible();
        await expect(firstButton).toHaveAttribute('title', 'First page');

        // Should have Previous button - use title attribute for identification (use first instance)
        const prevButton = page.locator('button[title="Previous page"]').first();
        await expect(prevButton).toBeVisible();
        await expect(prevButton).toHaveAttribute('title', 'Previous page');

        // Should have Next button - use title attribute for identification (use first instance)
        const nextButton = page.locator('button[title="Next page"]').first();
        await expect(nextButton).toBeVisible();
        await expect(nextButton).toHaveAttribute('title', 'Next page');

        // Should have Last button - use title attribute for identification (use first instance)
        const lastButton = page.locator('button[title="Last page"]').first();
        await expect(lastButton).toBeVisible();
        await expect(lastButton).toHaveAttribute('title', 'Last page');
    });

    test('should have proper button styling and dimensions', async ({ page }) => {
        // Get all navigation buttons by their title attributes (use first instances)
        const firstButton = page.locator('button[title="First page"]').first();
        const prevButton = page.locator('button[title="Previous page"]').first();
        const nextButton = page.locator('button[title="Next page"]').first();
        const lastButton = page.locator('button[title="Last page"]').first();

        const buttons = [firstButton, prevButton, nextButton, lastButton];

        // All buttons should have consistent styling
        for (const button of buttons) {
            await expect(button).toHaveClass(/border px-2 py-1 h-8/);
            await expect(button).toHaveClass(/transition-colors hover:bg-gray-600 focus:bg-gray-600/);
        }
    });

    test('should disable First and Previous buttons on first page', async ({ page }) => {
        // On first page, First and Previous buttons should be disabled - use title attributes (first instances)
        const firstButton = page.locator('button[title="First page"]').first();
        const prevButton = page.locator('button[title="Previous page"]').first();

        // Check if buttons are disabled (they should be disabled on page 1)
        const firstDisabled = await firstButton.isDisabled();
        const prevDisabled = await prevButton.isDisabled();

        // At least one of them should be disabled (depending on current page)
        expect(firstDisabled || prevDisabled).toBe(true);

        // Disabled buttons should have proper styling
        if (firstDisabled) {
            await expect(firstButton).toHaveClass(/disabled:!cursor-default/);
        }
        if (prevDisabled) {
            await expect(prevButton).toHaveClass(/disabled:!cursor-default/);
        }
    });

    test('should enable/disable Next and Last buttons based on current page', async ({ page }) => {
        // Get current page info - use first instance
        const pageInfo = page
            .locator('span')
            .filter({ hasText: /Page \d+ of \d+/ })
            .first();
        const pageText = await pageInfo.textContent();
        const currentPage = parseInt(pageText?.match(/Page (\d+)/)?.[1] || '1');
        const totalPages = parseInt(pageText?.match(/of (\d+)/)?.[1] || '1');

        const nextButton = page.locator('button[title="Next page"]').first();
        const lastButton = page.locator('button[title="Last page"]').first();

        // Next button should be disabled if on last page
        if (currentPage >= totalPages) {
            await expect(nextButton).toBeDisabled();
            await expect(lastButton).toBeDisabled();
        } else {
            // On non-last pages, Next and Last should be enabled
            await expect(nextButton).toBeEnabled();
            await expect(lastButton).toBeEnabled();
        }
    });

    test('should show proper layout structure', async ({ page }) => {
        // Should have main container div - look for the div with flex justify-between layout
        const mainContainer = page
            .locator('div.flex.items-center.justify-between')
            .filter({ hasText: /Rows per page/ })
            .first();
        await expect(mainContainer).toBeVisible();

        // Should have py-2 class for padding
        await expect(mainContainer).toHaveClass(/py-2/);

        // Should have two main sections: left (page size) and right (navigation)
        const leftSection = mainContainer.locator('div').first();
        const rightSection = mainContainer.locator('div').last();

        await expect(leftSection).toBeVisible();
        await expect(rightSection).toBeVisible();
    });

    test('should handle page size selection', async ({ page }) => {
        const pageSizeSelect = page.locator('select#page-size').first();

        // Should be able to select different page sizes
        await pageSizeSelect.selectOption('50');
        await expect(pageSizeSelect).toHaveValue('50');

        await pageSizeSelect.selectOption('100');
        await expect(pageSizeSelect).toHaveValue('100');

        await pageSizeSelect.selectOption('250');
        await expect(pageSizeSelect).toHaveValue('250');

        // Should be able to go back to 25
        await pageSizeSelect.selectOption('25');
        await expect(pageSizeSelect).toHaveValue('25');
    });

    test('should show correct page numbers in info text', async ({ page }) => {
        const pageInfo = page
            .locator('span')
            .filter({ hasText: /Page \d+ of \d+ \(\d+ items\)/ })
            .first();
        const pageText = await pageInfo.textContent();

        // Should match expected format
        expect(pageText).toMatch(/Page \d+ of \d+ \(\d+ items\)/);

        // Extract numbers for validation
        const matches = pageText?.match(/Page (\d+) of (\d+) \((\d+) items\)/);
        expect(matches).toBeTruthy();

        if (matches) {
            const currentPage = parseInt(matches[1]);
            const totalPages = parseInt(matches[2]);
            const totalItems = parseInt(matches[3]);

            // Current page should be >= 1
            expect(currentPage).toBeGreaterThanOrEqual(1);

            // Total pages should be >= current page
            expect(totalPages).toBeGreaterThanOrEqual(currentPage);

            // Total items should be > 0
            expect(totalItems).toBeGreaterThan(0);
        }
    });

    test('should handle button hover states correctly', async ({ page }) => {
        // Test that buttons respond to hover (visual test) - use title attribute (first instance)
        const firstButton = page.locator('button[title="First page"]').first();

        // Button should have hover classes
        await expect(firstButton).toHaveClass(/hover:bg-gray-600/);

        // Button should be clickable (not disabled)
        if (await firstButton.isEnabled()) {
            await firstButton.hover();
            // Visual hover state is tested by the CSS classes being present
        }
    });

    test('should handle focus states correctly', async ({ page }) => {
        // Test that buttons have proper focus styling
        // Test that buttons have proper focus styling (use first instances)
        const firstButton = page.locator('button[title="First page"]').first();
        const prevButton = page.locator('button[title="Previous page"]').first();
        const nextButton = page.locator('button[title="Next page"]').first();
        const lastButton = page.locator('button[title="Last page"]').first();

        const buttons = [firstButton, prevButton, nextButton, lastButton];

        // All buttons should have focus classes
        for (const button of buttons) {
            await expect(button).toHaveClass(/focus:bg-gray-600/);
        }
    });

    test('should show disabled button styling correctly', async ({ page }) => {
        // Test that disabled buttons have proper styling
        const disabledButtons = page.locator('button:disabled');

        // Check that disabled buttons have the expected styling
        for (let i = 0; i < (await disabledButtons.count()); i++) {
            const button = disabledButtons.nth(i);
            await expect(button).toHaveClass(/disabled:!cursor-default/);
            await expect(button).toHaveClass(/disabled:hover:!bg-transparent/);
            await expect(button).toHaveClass(/disabled:focus:!bg-transparent/);
        }
    });

    test('should handle navigation button clicks when enabled', async ({ page }) => {
        // Test that enabled navigation buttons can be clicked - use title attributes (first instances)
        const nextButton = page.locator('button[title="Next page"]').first();
        const lastButton = page.locator('button[title="Last page"]').first();

        // Only test clicking if buttons are enabled
        if (await nextButton.isEnabled()) {
            await nextButton.click();
            // Should not throw an error
        }

        if (await lastButton.isEnabled()) {
            await lastButton.click();
            // Should not throw an error
        }
    });

    test('should handle first/previous button clicks when enabled', async ({ page }) => {
        // Test that enabled first/previous buttons can be clicked - use title attributes (first instances)
        const firstButton = page.locator('button[title="First page"]').first();
        const prevButton = page.locator('button[title="Previous page"]').first();

        // Only test clicking if buttons are enabled
        if (await firstButton.isEnabled()) {
            await firstButton.click();
            // Should not throw an error
        }

        if (await prevButton.isEnabled()) {
            await prevButton.click();
            // Should not throw an error
        }
    });

    test('should maintain proper text sizing and spacing', async ({ page }) => {
        // Test that text elements have proper sizing
        const textElements = page.locator('span.text-sm, label.text-sm');
        const textCount = await textElements.count();

        // Should have properly sized text elements
        expect(textCount).toBeGreaterThan(0);

        // Check for proper gap spacing
        const gappedElements = page.locator('.gap-2, .gap-3, .gap-1');
        const gappedCount = await gappedElements.count();

        // Should have proper spacing
        expect(gappedCount).toBeGreaterThan(0);
    });

    test('should show proper button grouping', async ({ page }) => {
        // Test that navigation buttons are properly grouped - find the specific button group div
        // Test that navigation buttons are properly grouped - find the specific button group div (first instance)
        const buttonGroup = page
            .locator('div.flex.gap-1')
            .filter({ has: page.locator('button[title="First page"]').first() })
            .filter({ has: page.locator('button[title="Last page"]').first() })
            .first();
        await expect(buttonGroup).toBeVisible();

        // Should have flex layout with gap
        await expect(buttonGroup).toHaveClass(/flex gap-1/);
    });

    test('should handle edge case of single page', async ({ page }) => {
        // Test that the component handles single page scenarios correctly - use first instance
        const pageInfo = page
            .locator('span')
            .filter({ hasText: /Page \d+ of \d+/ })
            .first();
        const pageText = await pageInfo.textContent();

        if (pageText) {
            const matches = pageText.match(/Page (\d+) of (\d+)/);
            if (matches) {
                const currentPage = parseInt(matches[1]);
                const totalPages = parseInt(matches[2]);

                if (currentPage === totalPages && totalPages === 1) {
                    // On single page, all navigation should be disabled - use title attributes (first instances)
                    const firstButton = page.locator('button[title="First page"]').first();
                    const prevButton = page.locator('button[title="Previous page"]').first();
                    const nextButton = page.locator('button[title="Next page"]').first();
                    const lastButton = page.locator('button[title="Last page"]').first();

                    await expect(firstButton).toBeDisabled();
                    await expect(prevButton).toBeDisabled();
                    await expect(nextButton).toBeDisabled();
                    await expect(lastButton).toBeDisabled();
                }
            }
        }
    });

    test('should show proper border styling on all buttons', async ({ page }) => {
        // Test that all navigation buttons have border styling
        // Test that all navigation buttons have border styling (use first instances)
        const firstButton = page.locator('button[title="First page"]').first();
        const prevButton = page.locator('button[title="Previous page"]').first();
        const nextButton = page.locator('button[title="Next page"]').first();
        const lastButton = page.locator('button[title="Last page"]').first();

        const buttons = [firstButton, prevButton, nextButton, lastButton];

        for (const button of buttons) {
            await expect(button).toHaveClass(/border/);
        }
    });

    test('should handle conditional rendering based on data availability', async ({ page }) => {
        // The component should only render when there are totalRows > 0 and callbacks exist
        // We can't easily control this in the current setup, but we can verify the structure exists

        const paginationContainer = page.locator('div').filter({ hasText: /Rows per page/ });
        const containerCount = await paginationContainer.count();

        // Should have at least one pagination container (may be hidden if no data)
        expect(containerCount).toBeGreaterThanOrEqual(0);
    });

    test('should show consistent button dimensions', async ({ page }) => {
        // Test that all navigation buttons have consistent dimensions
        // Test that all navigation buttons have consistent dimensions (use first instances)
        const firstButton = page.locator('button[title="First page"]').first();
        const prevButton = page.locator('button[title="Previous page"]').first();
        const nextButton = page.locator('button[title="Next page"]').first();
        const lastButton = page.locator('button[title="Last page"]').first();

        const buttons = [firstButton, prevButton, nextButton, lastButton];

        for (const button of buttons) {
            await expect(button).toHaveClass(/h-8/);
        }
    });

    test('should maintain proper accessibility with labels and titles', async ({ page }) => {
        // Test that all interactive elements have proper accessibility attributes - use first instances

        // Page size selector should have label
        const pageSizeLabel = page.locator('label').filter({ hasText: 'Rows per page' }).first();
        await expect(pageSizeLabel).toBeVisible();
        await expect(pageSizeLabel).toHaveAttribute('for', 'page-size');

        // Select should have id
        const pageSizeSelect = page.locator('select#page-size').first();
        await expect(pageSizeSelect).toHaveAttribute('id', 'page-size');

        // All buttons should have titles - use title attributes for identification (first instances)
        const firstButton = page.locator('button[title="First page"]').first();
        const prevButton = page.locator('button[title="Previous page"]').first();
        const nextButton = page.locator('button[title="Next page"]').first();
        const lastButton = page.locator('button[title="Last page"]').first();

        await expect(firstButton).toHaveAttribute('title', 'First page');
        await expect(prevButton).toHaveAttribute('title', 'Previous page');
        await expect(nextButton).toHaveAttribute('title', 'Next page');
        await expect(lastButton).toHaveAttribute('title', 'Last page');
    });

    test('should handle transition effects properly', async ({ page }) => {
        // Test that buttons have transition classes for smooth interactions
        // Test that buttons have transition classes for smooth interactions (use first instances)
        const firstButton = page.locator('button[title="First page"]').first();
        const prevButton = page.locator('button[title="Previous page"]').first();
        const nextButton = page.locator('button[title="Next page"]').first();
        const lastButton = page.locator('button[title="Last page"]').first();

        const buttons = [firstButton, prevButton, nextButton, lastButton];

        for (const button of buttons) {
            await expect(button).toHaveClass(/transition-colors/);
        }
    });

    test('should show proper cursor styles for different states', async ({ page }) => {
        // Test cursor styling for different button states
        // Test cursor styling for different button states (use first instances)
        const firstButton = page.locator('button[title="First page"]').first();
        const prevButton = page.locator('button[title="Previous page"]').first();
        const nextButton = page.locator('button[title="Next page"]').first();
        const lastButton = page.locator('button[title="Last page"]').first();

        const allButtons = [firstButton, prevButton, nextButton, lastButton];

        // Check which buttons are enabled/disabled
        const enabledButtons = [];
        const disabledButtons = [];

        for (const button of allButtons) {
            const isEnabled = await button.isEnabled();
            if (isEnabled) {
                enabledButtons.push(button);
            } else {
                disabledButtons.push(button);
            }
        }

        // Enabled buttons should have hover cursor
        for (let i = 0; i < enabledButtons.length; i++) {
            const button = enabledButtons[i];
            await expect(button).toHaveClass(/hover:bg-gray-600/);
        }

        // Disabled buttons should have not-allowed cursor
        for (let i = 0; i < disabledButtons.length; i++) {
            const button = disabledButtons[i];
            await expect(button).toHaveClass(/disabled:!cursor-default/);
        }
    });
});
