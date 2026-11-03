import type { APIRoute } from 'astro';
import { publishedPosts, postUrl } from '../lib/posts';
import { site } from '../config/site';
import { routing } from '../config/routing';
import { routePath } from '../lib/metadata';
import { generateRssFeed } from '../lib/publication-feed';

export const GET: APIRoute = async (context) => {
  if (!context.site?.href) {
    throw new Error('Refusing to generate public RSS feed without a configured public origin (set SITE_URL in build environment).');
  }
  const posts = await publishedPosts();
  const siteUrl = context.site.href;
  const xml = generateRssFeed({
    title: site.title,
    description: site.description,
    siteUrl,
    basePath: routing.base,
    channelLink: routePath('/', routing),
    feedPath: routePath('/rss.xml', routing),
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
