import { z } from 'astro/zod';

export const readingMinutes = z.number().int().min(1).max(60).optional();
