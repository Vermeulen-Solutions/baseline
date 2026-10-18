// Explicit fixture routing: locale lives in /view/<collection>/<locale>/<slug>.
// This test does not certify Astro's automatic locale-prefix routing.
import { defineMiddleware } from 'astro:middleware';
export const onRequest = defineMiddleware((_context, next) => next());
