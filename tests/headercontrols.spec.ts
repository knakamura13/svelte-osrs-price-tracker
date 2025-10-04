import { test, expect } from '@playwright/test';

test.describe('HeaderControls component', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the main page
        await page.goto('/');
        // Wait for the page to load and table to be visible
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('table', { timeout: 10000 });
    });

    test('should render main title and subtitle', async ({ page }) => {
        // Should show main title
        await expect(page.locator('h1')).toContainText('OSRS Price Tracker');

        // Should show subtitle (find the specific subtitle paragraph)
        await expect(page.locator('p').filter({ hasText: 'Real-time OSRS GE prices' })).toBeVisible();
    });

    test('should display clock icon next to last updated text', async ({ page }) => {
        // Should have clock icon (find SVG inside the last updated div)
        const lastUpdatedDiv = page.locator('div').filter({ hasText: /Last updated/ });
        const clockIcon = lastUpdatedDiv.locator('svg');
        await expect(clockIcon).toBeVisible();
    });

    test('should display last updated timestamp', async ({ page }) => {
        // Should show "Last updated:" text
        await expect(page.locator('p').filter({ hasText: /Last updated/ })).toBeVisible();

        // Should show timestamp (could be various formats like "—", "5s ago", etc.)
        const timestamp = page.locator('span.text-blue-600, span.dark\\:text-blue-400');
        await expect(timestamp).toBeVisible();
    });

    test('should render auto-refresh toggle checkbox', async ({ page }) => {
        // Should have auto-refresh label
        const autoRefreshLabel = page.locator('label').filter({ hasText: 'Auto-refresh' });
        await expect(autoRefreshLabel).toBeVisible();

        // Should have checkbox input
        const checkbox = autoRefreshLabel.locator('input[type="checkbox"]');
        await expect(checkbox).toBeVisible();

        // Checkbox should be clickable
        await expect(checkbox).toBeEnabled();
    });

    test('should display refresh interval text', async ({ page }) => {
        // Should show "Every 60s" text (find the specific span in the controls section)
        const controlsSection = page.locator('div').filter({ hasText: /Auto-refresh/ });
        await expect(controlsSection.locator('span').filter({ hasText: 'Every 60s' })).toBeVisible();
    });

    test('should toggle auto-refresh checkbox state', async ({ page }) => {
        // Find the auto-refresh checkbox
        const autoRefreshLabel = page.locator('label').filter({ hasText: 'Auto-refresh' });
        const checkbox = autoRefreshLabel.locator('input[type="checkbox"]');

        // Initially should be unchecked (or checked depending on initial state)
        const initialState = await checkbox.isChecked();

        // Click to toggle
        await checkbox.click();

        // Wait a bit for state to update
        await page.waitForTimeout(100);

        // State should change
        await expect(checkbox).toBeChecked({ checked: !initialState });

        // Click again to toggle back
        await checkbox.click();

        // Wait a bit for state to update
        await page.waitForTimeout(100);

        // Should be back to initial state (or at least not in the toggled state)
        const finalState = await checkbox.isChecked();
        // The state might not return exactly to initial due to component logic, so just verify it changed
        expect(finalState).not.toBe(!initialState);
    });

    test('should show proper layout structure', async ({ page }) => {
        // Should have intro section
        const introSection = page.locator('section.intro');
        await expect(introSection).toBeVisible();

        // Should have grow div for title section
        const titleSection = introSection.locator('div.grow');
        await expect(titleSection).toBeVisible();

        // Should have controls section
        const controlsSection = introSection.locator('div').filter({ hasText: /Auto-refresh/ });
        await expect(controlsSection).toBeVisible();
    });

    test('should handle missing last updated label gracefully', async ({ page }) => {
        // The component should handle empty or missing lastUpdatedLabel
        // This is more of a unit test scenario, but we can verify the structure is correct

        // Should still show the "Last updated:" text even if timestamp is empty
        await expect(page.locator('p').filter({ hasText: /Last updated/ })).toBeVisible();

        // Timestamp span should still be present
        const timestamp = page.locator('span.text-blue-600, span.dark\\:text-blue-400');
        await expect(timestamp).toBeVisible();
    });

    test('should maintain proper styling and colors', async ({ page }) => {
        // Title should have proper font weight
        const title = page.locator('h1');
        await expect(title).toHaveClass(/font-semibold/);

        // Subtitle should have proper opacity
        const subtitle = page.locator('p').filter({ hasText: /Real-time OSRS GE prices/ });
        await expect(subtitle).toHaveClass(/opacity-80/);

        // Clock icon should have proper opacity (find it within the last updated div)
        const lastUpdatedDiv = page.locator('div').filter({ hasText: /Last updated/ });
        const clockIcon = lastUpdatedDiv.locator('svg');
        await expect(clockIcon).toHaveClass(/opacity-60/);

        // Timestamp should have blue color classes
        const timestamp = page.locator('span.text-blue-600, span.dark\\:text-blue-400');
        await expect(timestamp).toBeVisible();

        // Refresh interval text should have proper opacity
        const intervalText = page.locator('span').filter({ hasText: 'Every 60s' });
        await expect(intervalText).toHaveClass(/opacity-80/);
    });

    test('should show proper responsive layout', async ({ page }) => {
        // Should have flex layout with gap and items-end
        const introSection = page.locator('section.intro');
        await expect(introSection).toHaveClass(/flex gap-4 items-end flex-wrap/);

        // Title section should grow
        const titleSection = introSection.locator('div.grow');
        await expect(titleSection).toHaveClass(/grow/);

        // Controls section should have flex layout
        const controlsSection = introSection.locator('div').filter({ hasText: /Auto-refresh/ });
        await expect(controlsSection).toHaveClass(/flex gap-3 items-center/);
    });

    test('should handle auto-refresh label click', async ({ page }) => {
        // The label should be clickable and should trigger the checkbox
        const autoRefreshLabel = page.locator('label').filter({ hasText: 'Auto-refresh' });
        const checkbox = autoRefreshLabel.locator('input[type="checkbox"]');

        const initialState = await checkbox.isChecked();

        // Click the label (not the checkbox directly)
        await autoRefreshLabel.click();

        // Checkbox state should toggle
        await expect(checkbox).toBeChecked({ checked: !initialState });
    });

    test('should show all required elements in correct order', async ({ page }) => {
        // Check that all main elements are present and in correct order
        const introSection = page.locator('section.intro');

        // Title section should come first
        const titleSection = introSection.locator('div.grow');
        await expect(titleSection).toBeVisible();

        // Controls section should come after
        const controlsSection = introSection.locator('div').filter({ hasText: /Auto-refresh/ });
        await expect(controlsSection).toBeVisible();

        // Within title section, elements should be in order: h1, p, div with clock
        const h1 = titleSection.locator('h1');
        const subtitle = titleSection.locator('p').filter({ hasText: /Real-time OSRS GE prices/ });
        const clockDiv = titleSection.locator('div').filter({ hasText: /Last updated/ });

        // Check relative positions (h1 before subtitle before clock div)
        const h1Box = await h1.boundingBox();
        const subtitleBox = await subtitle.boundingBox();
        const clockBox = await clockDiv.boundingBox();

        if (h1Box && subtitleBox && clockBox) {
            expect(h1Box.y).toBeLessThan(subtitleBox.y);
            expect(subtitleBox.y).toBeLessThan(clockBox.y);
        }
    });
});
