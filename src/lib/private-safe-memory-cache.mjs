import memoryFactory from 'astro/cache/memory';

/** Native storage/invalidation, with a request bypass before any cache lookup. */
export default function privateSafeMemoryCache(config) {
  const provider = memoryFactory(config);
  return {
    ...provider,
    onRequest(context, next) {
      const request = context.request;
      if (request.method !== 'GET' || request.headers.has('authorization') || request.headers.has('cookie') || new URL(request.url).search) return next();
      return provider.onRequest(context, next);
    },
  };
}
