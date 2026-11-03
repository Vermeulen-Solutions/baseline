import type { APIRoute } from 'astro';
import { publishedPosts, postUrl } from '../lib/posts';
import { routing } from '../config/routing';
import { routePath } from '../lib/metadata';
import { generateSitemapXml } from '../lib/sitemap';

export const GET: APIRoute = async (context) => {
  if (!context.site?.href) {
    throw new Error('Refusing to generate public XML sitemap without a configured public origin (set SITE_URL in build environment).');
  }
  const posts = await publishedPosts();
  const siteUrl = context.site.href;
  const xml = generateSitemapXml({
    siteUrl,
    basePath: routing.base,
    items: [
      { url: routePath('/', routing), priority: 1.0, changeFrequency: 'daily' },
      { url: routePath('/posts/', routing), priority: 0.8, changeFrequency: 'daily' },
      ...posts.map((p) => ({
        url: postUrl(p.id),
        lastModified: p.data.publishedAt,
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
