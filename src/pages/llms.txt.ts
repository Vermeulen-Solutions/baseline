import type { APIRoute } from 'astro';
import { getEmDashCollection, getSiteSettingsWithCacheHint } from 'emdash';
import { buildLlmsTxt, entryLink, isNoIndexEntry, type LlmsLink } from '../lib/llms-txt';
import { resolveStarterSiteIdentity } from '../utils/site-identity';
import { defaultCanonicalUrl, resolvePublicSiteUrl } from '../utils/page-metadata';

export const prerender = false;

/**
 * /llms.txt: a Markdown map of published pages and posts for language-model tools. It reads the
 * same published entries the public routes do and skips entries marked noindex. Change the
 * sections when a site adds collections or routes (docs/site-working-rules.md).
 */
export const GET: APIRoute = async ({ site, url, cache }) => {
  const [{ data: settings, cacheHint: settingsHint }, pages, posts] = await Promise.all([
    getSiteSettingsWithCacheHint(),
    getEmDashCollection('pages'),
    getEmDashCollection('posts', { orderBy: { published_at: 'desc' } }),
  ]);
  if (cache?.enabled) {
    cache.set(settingsHint);
    cache.set(pages.cacheHint);
    cache.set(posts.cacheHint);
  }
  const { siteTitle, siteTagline } = resolveStarterSiteIdentity(settings);
  const origin = resolvePublicSiteUrl(settings.url, site, url);
  const links = (entries: Array<{ id: string; data: unknown }>, base: string): LlmsLink[] => entries
    .filter(entry => !isNoIndexEntry(entry))
    .map(entry => entryLink(entry, defaultCanonicalUrl(origin, `${base}${encodeURIComponent(entry.id)}`)));

  const body = buildLlmsTxt({
    title: siteTitle,
    summary: siteTagline,
    sections: [
      { heading: 'Pages', links: [{ title: 'Home', url: defaultCanonicalUrl(origin, '/') }, ...links(pages.entries, '/')] },
      { heading: 'Posts', links: links(posts.entries, '/posts/') },
    ],
  });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
};
