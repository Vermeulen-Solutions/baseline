import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: ({ image }) => z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    publishedAt: z.coerce.date(),
    // Set when a published post changes in substance; it becomes the sitemap lastmod and dateModified.
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    hero: image().optional(),
    heroAlt: z.string().trim().optional(),
  }).superRefine((post, context) => {
    if (post.updatedAt && post.updatedAt < post.publishedAt) context.addIssue({ code: 'custom', path: ['updatedAt'], message: 'The update date cannot be before the publication date.' });
    if (post.hero && !post.heroAlt) context.addIssue({ code: 'custom', path: ['heroAlt'], message: 'Describe the meaningful hero image.' });
  }),
});

export const collections = { posts };
