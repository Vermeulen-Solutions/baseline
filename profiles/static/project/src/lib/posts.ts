import { getCollection } from 'astro:content';
import { routePath } from './metadata';
import { routing } from '../config/routing';
import { isPublicationEligible } from './publication-feed';

/** One publication policy for the homepage, listing and generated detail routes. */
export async function publishedPosts() {
  return (await getCollection('posts', ({ data }) => isPublicationEligible(data)))
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime() || a.id.localeCompare(b.id, 'en'));
}

export function postUrl(id: string) {
  return routePath(`/posts/${id.split('/').map(encodeURIComponent).join('/')}/`, routing);
}

/**
 * Sections that open with their first published entry. Until then the page still builds, but it is
 * noindex, out of the sitemap and out of the navigation, so no link points at an empty page. One
 * rule, read in all three places. Add a site's own sections here (for example a gallery that waits
 * for its photographs).
 */
export async function gatedRoutes(): Promise<string[]> {
  const posts = await publishedPosts();
  return posts.length ? [] : [routePath('/posts/', routing)];
}
