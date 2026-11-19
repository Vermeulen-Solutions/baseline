import type { APIRoute } from 'astro';
import { gatedRoutes, publishedPosts, postUrl } from '../lib/posts';
import { routing } from '../config/routing';
import { routePath } from '../lib/metadata';
import { generateSitemapXml } from '../lib/sitemap';

export const GET: APIRoute = async (context) => {
  // Without SITE_URL there is no public origin for absolute URLs: the sitemap is left out of the build
  // (Astro skips an empty error response and logs it), so a local build and preview still work.
  if (!context.site?.href) return new Response(null, { status: 404, statusText: 'SITE_URL is not set' });
  const [posts, gated] = await Promise.all([publishedPosts(), gatedRoutes()]);
  const siteUrl = context.site.href;
  const xml = generateSitemapXml({
    siteUrl,
    basePath: routing.base,
    items: [
      // Sections with nothing published stay out until their first entry (src/lib/posts.ts gatedRoutes).
      ...[
        { url: routePath('/', routing), priority: 1.0, changeFrequency: 'daily' as const },
        { url: routePath('/posts/', routing), priority: 0.8, changeFrequency: 'daily' as const },
      ].filter((item) => !gated.includes(item.url)),
      ...posts.map((p) => ({
        url: postUrl(p.id),
        // Only a date someone wrote down: the update date, else the publication date, never the build date.
        lastModified: p.data.updatedAt ?? p.data.publishedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ],
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
