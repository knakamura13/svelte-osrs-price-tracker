import { test, expect } from '@playwright/test';

test('home page renders and has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/OSRS Price Tracker/);
});

test('header is visible and has site logo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('img', { name: 'Site logo' })).toBeVisible();
});

test('route returns 200', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
});
