import { z } from 'astro/zod';

export const readingMinutesSchema = z.number().int().min(1).max(60).optional();
