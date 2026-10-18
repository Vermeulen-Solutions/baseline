import { getCollection } from 'astro:content';

/** One publication policy for the homepage, listing and generated detail routes. */
export async function publishedPosts() {
  return (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime() || a.id.localeCompare(b.id, 'en'));
}

export function postUrl(id: string) {
  return `/posts/${id.split('/').map(encodeURIComponent).join('/')}/`;
}
