import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    /* Maximum time one test can run for. */
    timeout: 30 * 1000,
    use: { baseURL: 'http://127.0.0.1:5173', headless: true },
    webServer: {
        command: 'yarn dev',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    testDir: './tests',
    testMatch: '*.spec.ts',
    workers: 10 // Set the default number of workers
});
