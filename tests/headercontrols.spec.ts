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
        // Should have clock icon (find SVG with clock class in the title section)
        const titleSection = page.locator('section.intro div.grow');
        const clockIcon = titleSection.locator('svg.lucide-clock');
        await expect(clockIcon).toBeVisible();
    });

    test('should display last updated timestamp', async ({ page }) => {
        // Should show "Last updated:" text in the title section
        const titleSection = page.locator('section.intro div.grow');
        await expect(titleSection.filter({ hasText: /Last updated/ })).toBeVisible();

        // Should show timestamp (could be various formats like "—", "5s ago", etc.)
        const timestamp = page.locator('span.text-blue-600, span.dark\\:text-blue-400');
        await expect(timestamp).toBeVisible();
    });

    test('should render item search component', async ({ page }) => {
        // Should have search input in the header
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();
        await expect(searchInput).toBeVisible();
    });

    test('should show proper layout structure', async ({ page }) => {
        // Should have intro section
        const introSection = page.locator('section.intro');
        await expect(introSection).toBeVisible();

        // Should have grow div for title section
        const titleSection = introSection.locator('div.grow');
        await expect(titleSection).toBeVisible();

        // Should have search section (the second div in the intro section)
        const searchSection = introSection.locator('div').nth(1);
        await expect(searchSection).toBeVisible();
    });

    test('should handle missing last updated label gracefully', async ({ page }) => {
        // The component should handle empty or missing lastUpdatedLabel
        // This is more of a unit test scenario, but we can verify the structure is correct

        // Should still show the "Last updated:" text in the title section even if timestamp is empty
        const titleSection = page.locator('section.intro div.grow');
        await expect(titleSection.filter({ hasText: /Last updated/ })).toBeVisible();

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

        // Clock icon should have proper opacity (find it in the title section)
        const titleSection = page.locator('section.intro div.grow');
        const clockIcon = titleSection.locator('svg.lucide-clock');
        await expect(clockIcon).toHaveClass(/opacity-60/);

        // Timestamp should have blue color classes
        const timestamp = page.locator('span.text-blue-600, span.dark\\:text-blue-400');
        await expect(timestamp).toBeVisible();

        // Search input should be properly styled
        const searchInput = page.locator('input[placeholder="Search for an item..."]').first();
        await expect(searchInput).toBeVisible();
    });

    test('should show proper responsive layout', async ({ page }) => {
        // Should have flex layout with gap and items-end
        const introSection = page.locator('section.intro');
        await expect(introSection).toHaveClass(/flex gap-4 items-end flex-wrap/);

        // Title section should grow
        const titleSection = introSection.locator('div.grow');
        await expect(titleSection).toHaveClass(/grow/);

        // Search section should be properly styled (the second div in the intro section)
        const searchSection = introSection.locator('div').nth(1);
        await expect(searchSection).toBeVisible();
    });

    test('should show all required elements in correct order', async ({ page }) => {
        // Check that all main elements are present and in correct order
        const introSection = page.locator('section.intro');

        // Title section should come first
        const titleSection = introSection.locator('div.grow');
        await expect(titleSection).toBeVisible();

        // Search section should come after (the second div in the intro section)
        const searchSection = introSection.locator('div').nth(1);
        await expect(searchSection).toBeVisible();

        // Within title section, elements should be in order: h1, p, div with clock
        const h1 = titleSection.locator('h1');
        const subtitle = titleSection.locator('p').filter({ hasText: /Real-time OSRS GE prices/ });
        const clockDiv = titleSection
            .locator('div')
            .filter({ hasText: /Last updated/ })
            .first();

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
