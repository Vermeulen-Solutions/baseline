import type { ImageMetadata } from 'astro';

/** Presentation inputs only. CMS/storage resolution belongs to the caller. */
export interface ResponsiveImageProps {
  src?: ImageMetadata | string | null;
  alt: string;
  class?: string;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
  optimize?: boolean;
  /** Original download/fallback URL when a platform resolves src to metadata. */
  originalSrc?: string;
}

export function responsiveImageInput(src: unknown, width?: number, height?: number) {
  const dimension = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) && value >= 1 ? Math.round(value) : undefined;
  const candidate = src && typeof src === 'object' && !Array.isArray(src) ? src as Partial<ImageMetadata> : undefined;
  const source = typeof src === 'string' ? src : candidate?.src;
  let original = '';
  if (typeof source === 'string' && source && !/[\s\\\u0000-\u001f]/.test(source) && !source.startsWith('//')) {
    try { if (['http:', 'https:'].includes(new URL(source, 'https://image.invalid/').protocol)) original = source; }
    catch { /* Malformed sources render reserved fallback space. */ }
  }
  const metadata = original && candidate && dimension(candidate.width) && dimension(candidate.height) && typeof candidate.format === 'string' ? candidate as ImageMetadata : undefined;
  // Imported assets carry native bounds. Preserve their ratio when a display
  // width is authored, and never generate a candidate beyond the native width.
  const nativeWidth = dimension(metadata?.width) ?? dimension(width);
  const nativeHeight = dimension(metadata?.height) ?? dimension(height);
  const resolvedWidth = dimension(width) ?? nativeWidth;
  const resolvedHeight = dimension(height) ?? (metadata && resolvedWidth ? dimension(resolvedWidth * metadata.height / metadata.width) : nativeHeight);
  const widths = original && nativeWidth && nativeHeight && nativeWidth >= 800
    ? [...new Set([480, 800, 1400].map(candidate => Math.min(candidate, nativeWidth)))]
    : [];
  const aspectRatio = resolvedWidth && resolvedHeight ? resolvedWidth / resolvedHeight : 4 / 3;
  return { original, src: metadata ?? original, width: resolvedWidth, height: resolvedHeight, nativeWidth, nativeHeight, widths, aspectRatio };
}
