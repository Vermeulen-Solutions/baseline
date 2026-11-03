import type { APIRoute } from 'astro';
import { publishedPosts, postUrl } from '../lib/posts';
import { routing } from '../config/routing';
import { routePath } from '../lib/metadata';
import { generateSitemapXml } from '../lib/sitemap';

export const GET: APIRoute = async (context) => {
  const posts = await publishedPosts();
  const siteUrl = context.site?.href || 'https://example.com';
  const xml = generateSitemapXml({
    siteUrl,
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
