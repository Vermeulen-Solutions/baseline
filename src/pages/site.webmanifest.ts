import type { APIRoute } from 'astro';
import { getSiteSettingsWithCacheHint } from 'emdash';
import { webManifest } from '../lib/web-manifest';
import { resolveStarterSiteIdentity } from '../utils/site-identity';

export const prerender = false;

/**
 * /site.webmanifest: the site's name and app icons for Android and installed shortcuts. The
 * icons are written by `npm run icons` (scripts/generate-icons.mjs); the name follows the site
 * title set in EmDash.
 */
export const GET: APIRoute = async ({ cache }) => {
  const { data: settings, cacheHint } = await getSiteSettingsWithCacheHint();
  if (cache?.enabled) cache.set(cacheHint);
  const { siteTitle } = resolveStarterSiteIdentity(settings);
  return new Response(JSON.stringify(webManifest({ name: siteTitle, base: import.meta.env.BASE_URL }), null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
};
