import type { APIRoute } from 'astro';
import { gatedRoutes, publishedPosts, postUrl } from '../lib/posts';
import { routing } from '../config/routing';
import { routePath } from '../lib/metadata';
import { generateSitemapXml } from '../lib/sitemap';

export const GET: APIRoute = async (context) => {
  if (!context.site?.href) {
    throw new Error('Refusing to generate public XML sitemap without a configured public origin (set SITE_URL in build environment).');
  }
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
