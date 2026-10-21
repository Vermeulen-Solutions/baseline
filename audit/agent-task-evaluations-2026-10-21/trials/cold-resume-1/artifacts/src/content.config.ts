import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: ({ image }) => z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    publishedAt: z.coerce.date(),
    draft: z.boolean().default(false),
    hero: image().optional(),
    heroAlt: z.string().trim().optional(),
  }).superRefine((post, context) => {
    if (post.hero && !post.heroAlt) context.addIssue({ code: 'custom', path: ['heroAlt'], message: 'Describe the meaningful hero image.' });
  }),
});

const workshops = defineCollection({
  loader: glob({ base: './src/content/workshops', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().trim().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, hyphen-separated slug.'),
    summary: z.string().trim().min(1),
    date: z.coerce.date(),
    venue: z.string().trim().min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, workshops };
