import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { purgeCss } from 'vite-plugin-tailwind-purgecss';

export default defineConfig({
    plugins: [sveltekit(), purgeCss()],
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}'],
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
            include: ['src/**/*.{js,ts}'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/*.test.{js,ts}',
                'src/**/*.spec.{js,ts}',
                'src/app.d.ts',
                'src/app.html',
                'src/styles.css'
            ],
            thresholds: {
                global: {
                    branches: 70,
                    functions: 80,
                    lines: 80,
                    statements: 80
                }
            }
        }
    }
});
