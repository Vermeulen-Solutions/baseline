import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { webManifest } from '../lib/web-manifest';

/**
 * /site.webmanifest: the site's name and app icons for Android and installed shortcuts. The
 * icons are written by `npm run icons` (scripts/generate-icons.mjs).
 */
export const GET: APIRoute = () => new Response(JSON.stringify(webManifest({ name: site.title, base: import.meta.env.BASE_URL }), null, 2), {
  headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
});
