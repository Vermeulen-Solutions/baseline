/** Canonicalization is opt-in: first verify that all public slugs are lowercase. */
export function normalizedPageLocation(url: URL, method = 'GET'): string | undefined {
  if (!['GET', 'HEAD'].includes(method)) return undefined;
  const path = url.pathname;
  // Never rewrite storage keys, extension-bearing paths, escaped bytes, APIs,
  // auth/preview routes, or hidden infrastructure. Match exclusions case-insensitively.
  if (/%|\\|\.|\/\//.test(path) || /^\/(?:_|api(?:\/|$)|uploads(?:\/|$))/i.test(path)) return undefined;
  if ([...url.searchParams.keys()].some(key => /^_(?:edit|preview)/i.test(key))) return undefined;
  const canonical = path.toLowerCase().replace(/\/+$/, '') || '/';
  return canonical === path ? undefined : canonical + url.search;
}
