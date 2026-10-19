export interface MetadataImage {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface MetadataSite {
  title: string;
  description: string;
  language: string;
  image?: MetadataImage;
  /** A real default author, when the site's content has one. */
  author?: string;
}

export interface PageMetadata {
  title: string;
  description?: string;
  canonical?: string | null;
  image?: MetadataImage | null;
  pageType?: 'website' | 'article';
  publishedAt?: Date;
  modifiedAt?: Date;
  author?: string;
  robots?: string;
}

export interface MetadataContext {
  siteUrl?: URL;
  url: URL;
  routing: {
    base: string;
    trailingSlash: 'always' | 'never' | 'ignore';
    build: { format: 'directory' | 'file' | 'preserve' };
  };
}

function httpUrl(value: string, base?: URL): URL {
  if (value.startsWith('//')) throw new Error('Use an explicit HTTP(S) URL instead of a protocol-relative URL.');
  const url = new URL(value, base);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Metadata URLs must use HTTP(S) without credentials.');
  }
  return url;
}

/** Prefix local links without changing their query, fragment or file suffix. */
export function withBasePath(pathname: string, baseValue: string): string {
  const base = '/' + baseValue.split('/').filter(Boolean).join('/');
  const boundary = pathname.search(/[?#]/);
  const suffix = boundary < 0 ? '' : pathname.slice(boundary);
  const pathnameOnly = boundary < 0 ? pathname : pathname.slice(0, boundary);
  let path = pathnameOnly.startsWith('/') ? pathnameOnly : '/' + pathnameOnly;
  if (base !== '/' && path !== base && !path.startsWith(base + '/')) path = base + path;
  return path + suffix;
}

/** Apply the deploy base exactly once; never interpret a pathname as a hostname. */
export function routePath(pathname: string, routing: MetadataContext['routing']): string {
  const boundary = pathname.search(/[?#]/);
  const suffix = boundary < 0 ? '' : pathname.slice(boundary);
  const path = withBasePath(boundary < 0 ? pathname : pathname.slice(0, boundary), routing.base);
  if (/\.[^/]+$/.test(path)) return path + suffix;
  const base = '/' + routing.base.split('/').filter(Boolean).join('/');
  if (routing.build.format === 'file' && path.replace(/\/+$/, '') !== base.replace(/\/+$/, '')) return path.replace(/\/+$/, '') + '.html' + suffix;
  if (routing.trailingSlash === 'never') return (path.replace(/\/+$/, '') || '/') + suffix;
  if (routing.trailingSlash === 'always' || (routing.trailingSlash === 'ignore' && routing.build.format === 'directory')) return path.replace(/\/+$/, '') + '/' + suffix;
  return path + suffix;
}

function siteRoot(context: MetadataContext): URL | undefined {
  if (!context.siteUrl) return undefined;
  const url = httpUrl(context.siteUrl.href);
  const base = '/' + context.routing.base.split('/').filter(Boolean).join('/');
  if (url.pathname !== '/' && url.pathname.replace(/\/+$/, '') !== base.replace(/\/+$/, '')) {
    throw new Error('SITE_URL pathname must match the configured routing.base (or use the origin alone).');
  }
  url.pathname = base === '/' ? '/' : base + '/';
  url.search = ''; url.hash = '';
  return url;
}

function canonicalUrl(input: PageMetadata, context: MetadataContext, root?: URL): string | undefined {
  if (input.canonical === null) return undefined;
  if (input.canonical !== undefined) {
    const explicit = httpUrl(input.canonical, root);
    explicit.hash = '';
    return explicit.href;
  }
  if (!root) return undefined;
  const url = new URL(root);
  url.pathname = routePath(context.url.pathname, context.routing);
  return url.href;
}

function resolvedImage(image: MetadataImage | undefined, root?: URL) {
  if (!image) return undefined;
  // Relative assets need a configured public origin; do not leak Astro's build localhost.
  if (!root && !/^https?:\/\//i.test(image.src)) return undefined;
  const url = httpUrl(image.src, root).href;
  for (const dimension of [image.width, image.height]) {
    if (dimension !== undefined && (!Number.isInteger(dimension) || dimension <= 0)) throw new Error('Metadata image dimensions must be positive integers.');
  }
  if (image.mimeType && !/^image\/[a-z0-9.+-]+$/i.test(image.mimeType)) throw new Error('Metadata image MIME type must describe an image.');
  return { ...image, url };
}

function iso(date?: Date): string | undefined {
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

/** Pure data resolution shared by HTML meta and JSON-LD; no CMS, request globals or browser code. */
export function resolveStaticMetadata(input: PageMetadata, site: MetadataSite, context: MetadataContext) {
  const root = siteRoot(context);
  const canonical = canonicalUrl(input, context, root);
  const pageType = input.pageType ?? 'website';
  const description = input.description ?? site.description;
  const image = resolvedImage(input.image === null ? undefined : input.image ?? site.image, root);
  const article = pageType === 'article' ? {
    publishedTime: iso(input.publishedAt), modifiedTime: iso(input.modifiedAt), author: (input.author ?? site.author)?.trim() || undefined,
  } : undefined;
  const graphs: Record<string, unknown>[] = [];
  if (canonical && article) {
    graphs.push({
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: input.title, description, url: canonical, inLanguage: site.language,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      ...(image && { image: image.url }),
      ...(article.publishedTime && { datePublished: article.publishedTime }),
      ...(article.modifiedTime && { dateModified: article.modifiedTime }),
      ...(article.author && { author: { '@type': 'Person', name: article.author } }),
    });
  } else if (canonical && root) {
    graphs.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: site.title, url: root.href, inLanguage: site.language });
  }
  return {
    title: input.title === site.title ? site.title : `${input.title} — ${site.title}`,
    pageTitle: input.title, siteName: site.title, description, language: site.language,
    openGraphLocale: /^[a-z]{2,3}-[A-Z]{2}$/.test(site.language) ? site.language.replace('-', '_') : undefined,
    canonical, pageType, image, article, graphs, robots: input.robots,
  };
}

export type ResolvedMetadata = ReturnType<typeof resolveStaticMetadata>;
