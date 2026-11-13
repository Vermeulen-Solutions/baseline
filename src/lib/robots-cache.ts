export const ROBOTS_CACHE_CAP = 'public, max-age=3600, must-revalidate';

/**
 * Cache policy for the native /robots.txt response.
 *
 * The native route caches publicly for 24 hours; cap that at one hour. A response that
 * already refuses shared or stored caching is returned unchanged: EmDash answers `no-store`
 * while a site is in staging so crawlers see the change as soon as it goes live.
 */
export function robotsCacheControl(native: string | null): string {
  if (native && /\b(?:no-store|no-cache|private)\b/i.test(native)) return native;
  return ROBOTS_CACHE_CAP;
}
