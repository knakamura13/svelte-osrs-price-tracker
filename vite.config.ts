import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    build: { target: 'esnext' },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern'
            }
        }
    }
});
