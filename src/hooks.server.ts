import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);

    // Set aggressive caching headers for static assets
    const url = new URL(event.request.url);

    // Cache static assets (favicons, icons, etc.) for 1 year
    if (
        url.pathname.startsWith('/favicons/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.gif') ||
        url.pathname.endsWith('.webp')
    ) {
        // Static assets - cache for 1 year
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        response.headers.set('CDN-Cache-Control', 'public, max-age=31536000');
        response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=31536000');
    }

    // Cache API-served item icons for 24 hours (since these come from external sources)
    else if (
        url.pathname.includes('/api/') &&
        (url.pathname.includes('icon') || response.headers.get('content-type')?.includes('image/'))
    ) {
        // API images - cache for 24 hours
        response.headers.set('Cache-Control', 'public, max-age=86400');
        response.headers.set('CDN-Cache-Control', 'public, max-age=86400');
        response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=86400');
    }

    return response;
};
