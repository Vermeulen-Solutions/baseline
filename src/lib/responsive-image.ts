import type { ImageMetadata } from 'astro';

/** Presentation inputs only. CMS/storage resolution belongs to the caller. */
export interface ResponsiveImageProps {
  src: ImageMetadata | string;
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

export function responsiveImageInput(src: ImageMetadata | string, width?: number, height?: number) {
  const metadata = typeof src === 'string' ? undefined : src;
  const original = metadata?.src ?? (src as string);
  const validDimension = (value?: number) => value !== undefined && Number.isFinite(value) && value > 0;
  // Imported assets carry native bounds. Preserve their ratio when a display
  // width is authored, and never generate a candidate beyond the native width.
  const nativeWidth = metadata?.width ?? width;
  const nativeHeight = metadata?.height ?? height;
  const resolvedWidth = width ?? nativeWidth;
  const resolvedHeight = height ?? (metadata && resolvedWidth ? Math.round(resolvedWidth * metadata.height / metadata.width) : nativeHeight);
  const widths = validDimension(nativeWidth) && validDimension(nativeHeight) && nativeWidth! >= 800
    ? [...new Set([480, 800, 1400].map(candidate => Math.min(candidate, nativeWidth!)))]
    : [];
  return { original, src, width: resolvedWidth, height: resolvedHeight, nativeWidth, nativeHeight, widths };
}
