export type Photo = { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string; url?: string; provider?: string }; alt: string; caption: string; width?: number; height?: number };
const record = (v: unknown): Record<string, any> => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const text = (v: unknown) => typeof v === 'string' ? v : '';
const dimension = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined;
const knownDimensions = new Map<string, { width: number; height: number }>();

export function rememberImageDimensions(src: string | undefined, width?: unknown, height?: unknown): void {
  const w = Number(width);
  const h = Number(height);
  if (!src || !Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) return;
  knownDimensions.set(src, { width: Math.round(w), height: Math.round(h) });
}

export function getKnownImageDimensions(src: string | undefined): { width?: number; height?: number } {
  if (!src) return {};
  return knownDimensions.get(src) ?? {};
}

export function photo(value: unknown, key = ''): Photo | null {
  const n = record(value), a = record(n.asset || value), meta = record(a.meta);
  const id = text(a._ref || a.id);
  const storageKey = text(meta.storageKey);
  const url = text(a.url || a.src) || (storageKey ? `/_emdash/api/media/file/${encodeURIComponent(storageKey)}` : '');
  if (!id && !url) return null;
  const width = dimension(n.width ?? a.width);
  const height = dimension(n.height ?? a.height);
  if (url && width && height) rememberImageDimensions(url, width, height);
  return { _type: 'image', _key: text(n._key) || key, asset: { _type: 'reference', _ref: id, url: url || undefined, provider: text(a.provider) || 'local' }, alt: text(n.alt ?? a.alt), caption: text(n.caption), width, height };
}
export function albumPhotos(value: unknown): Photo[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((node, index) => {
    const n = record(node);
    const images = n._type === 'gallery' && Array.isArray(n.images) ? n.images : n._type === 'image' ? [n] : [];
    return images.map((v: unknown, i: number) => photo(v, `photo-${index}-${i}`)).filter((v: Photo | null): v is Photo => !!v);
  });
}
export function photoUrl(p: Photo, resolve?: (key: string) => string): string {
  const url = p.asset.url || '';
  if (url.startsWith('/_emdash/api/media/file/')) {
    const key = url.slice('/_emdash/api/media/file/'.length);
    const resolved = resolve && /^[A-Za-z0-9._-]+$/.test(key) ? resolve(key) : url;
    if (p.width && p.height) {
      rememberImageDimensions(url, p.width, p.height);
      rememberImageDimensions(resolved, p.width, p.height);
    }
    return resolved;
  }
  if (/^https?:\/\//i.test(url) || (url.startsWith('/') && !url.startsWith('//'))) {
    if (p.width && p.height) rememberImageDimensions(url, p.width, p.height);
    return url;
  }
  return '';
}

/** Builds Schema.org ImageGallery structured data JSON-LD. */
export function galleryJsonLd(
  photos: Photo[],
  options?: { siteUrl?: string | URL; title?: string; resolveUrl?: (key: string) => string }
): Record<string, any> | null {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  const site = options?.siteUrl ? String(options.siteUrl).replace(/\/+$/, '') : '';
  const makeAbsolute = (u: string) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (site && u.startsWith('/')) return `${site}${u}`;
    return u;
  };

  const media = photos
    .map(p => {
      const rawUrl = photoUrl(p, options?.resolveUrl);
      const contentUrl = makeAbsolute(rawUrl);
      if (!contentUrl) return null;
      return {
        '@type': 'ImageObject',
        contentUrl,
        name: p.alt || undefined,
        caption: p.caption || undefined,
        width: p.width,
        height: p.height,
      };
    })
    .filter(Boolean);

  if (!media.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: options?.title || undefined,
    associatedMedia: media,
  };
}
