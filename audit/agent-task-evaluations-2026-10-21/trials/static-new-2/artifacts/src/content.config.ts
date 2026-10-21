import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().trim().min(1),
    heading: z.string().trim().min(1),
    description: z.string().trim().min(1),
    path: z.enum(['', 'services', 'about', 'contact']),
    draft: z.boolean().default(false),
  }),
});
const services = defineCollection({
  loader: glob({ base: './src/content/services', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    order: z.number().int().positive(),
    draft: z.boolean().default(false),
  }),
});
export const collections = { pages, services };
