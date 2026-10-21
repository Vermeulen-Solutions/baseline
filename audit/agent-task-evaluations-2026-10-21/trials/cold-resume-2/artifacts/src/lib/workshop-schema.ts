import { z } from 'astro/zod';

/** Workshop dates are calendar dates, with no implied time or time zone. */
export const workshopSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, hyphen-separated slug.'),
  summary: z.string().trim().min(1),
  date: z.iso.date(),
  venue: z.string().trim().min(1),
  draft: z.boolean(),
});
