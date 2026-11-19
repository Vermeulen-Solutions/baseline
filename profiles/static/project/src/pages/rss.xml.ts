import type { APIRoute } from 'astro';
import { publishedPosts, postUrl } from '../lib/posts';
import { site } from '../config/site';
import { routing } from '../config/routing';
import { routePath } from '../lib/metadata';
import { generateRssFeed } from '../lib/publication-feed';

export const GET: APIRoute = async (context) => {
  // Without SITE_URL there is no public origin for absolute URLs: the RSS feed is left out of the build
  // (Astro skips an empty error response and logs it), so a local build and preview still work.
  if (!context.site?.href) return new Response(null, { status: 404, statusText: 'SITE_URL is not set' });
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
