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
