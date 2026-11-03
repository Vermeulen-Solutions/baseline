import type { APIRoute } from 'astro';
import { publishedPosts, postUrl } from '../lib/posts';
import { site } from '../config/site';
import { generateRssFeed } from '../lib/publication-feed';

export const GET: APIRoute = async (context) => {
  const posts = await publishedPosts();
  const siteUrl = context.site?.href || 'https://example.com';
  const xml = generateRssFeed({
    title: site.title,
    description: site.description,
    siteUrl,
    language: site.language,
    items: posts.map((p) => ({
      title: p.data.title,
      link: postUrl(p.id),
      description: p.data.description,
      pubDate: p.data.publishedAt,
    })),
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
