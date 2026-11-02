import type { ImageMetadata } from 'astro';
import { imageMetadata } from 'astro/assets/utils';
import type { Storage } from 'emdash';
import { getKnownImageDimensions, rememberImageDimensions } from './photo-gallery';

export { getKnownImageDimensions, rememberImageDimensions };

// Vite/Astro supplies metadata and manages emitted assets; originals keep their
// public URLs for downloads and historic links. No rendition manifest is needed.
const photos = import.meta.glob<{ default: ImageMetadata }>([
  '/public/**/*.{jpg,jpeg,png,webp,avif}',
]);
const mediaPrefix = '/_emdash/api/media/file/';

export async function imageSource(src: string, origin: string, storage?: Storage | null, width?: number, height?: number): Promise<{ src: ImageMetadata | string; width?: number; height?: number }> {
  if ((!width || !height) && src) {
    const known = getKnownImageDimensions(src);
    if (known.width && known.height) {
      width = width || known.width;
      height = height || known.height;
    }
  }
  const fallback = { src, width, height };
  let url: URL;
  try { url = new URL(src, origin); } catch { return fallback; }
  const configuredOrigin = import.meta.env.SITE ? new URL(import.meta.env.SITE).origin : undefined;
  if (url.origin !== origin && url.origin !== configuredOrigin) return fallback;
  if (/\.(gif|svg)$/i.test(url.pathname)) return fallback;
  let pathname: string;
  try { pathname = decodeURIComponent(url.pathname); } catch { return fallback; }
  const imported = photos[`/public${pathname}`];
  if (imported) {
    try {
      const image = (await imported()).default;
      return { src: image, width: image.width, height: image.height };
    } catch { return fallback; }
  }
  if (!pathname.startsWith(mediaPrefix)) return fallback;
  const key = pathname.slice(mediaPrefix.length);
  if (!/^[A-Za-z0-9._-]+$/.test(key)) return fallback;
  if (!width || !height) {
    const cachedByPath = getKnownImageDimensions(pathname).width ? getKnownImageDimensions(pathname) : getKnownImageDimensions(`${mediaPrefix}${key}`);
    if (cachedByPath.width && cachedByPath.height) {
      width = width || cachedByPath.width;
      height = height || cachedByPath.height;
    }
  }
  if ((!width || !height) && !storage) return fallback;
  try {
    // Field dimensions avoid reading bytes. Legacy URL-only fields are probed
    // through the public storage API once and cached in memory across requests.
    if (!width || !height) {
      const file = await storage!.download(key);
      if (!/^image\/(jpeg|png|webp|avif)$/.test(file.contentType)) return fallback;
      const reader = file.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        while (length < 1024 * 1024) {
          const part = await reader.read();
          if (part.done) break;
          chunks.push(part.value); length += part.value.length;
          const bytes = new Uint8Array(length);
          let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
          try {
            const metadata = await imageMetadata(bytes, src);
            width = metadata.width; height = metadata.height;
            rememberImageDimensions(src, width, height);
            rememberImageDimensions(pathname, width, height);
            break;
          } catch { /* Header may span more than one storage chunk. */ }
        }
      } finally { await reader.cancel(); }
    } else {
      rememberImageDimensions(src, width, height);
      rememberImageDimensions(pathname, width, height);
    }
    // Only the configured site origin is authorized in a production build.
    // EmDash reads these bytes directly from storage rather than over HTTP.
    const mediaOrigin = configuredOrigin || origin;
    return { src: new URL(`${mediaPrefix}${encodeURIComponent(key)}`, mediaOrigin).href, width, height };
  } catch {
    // Missing/unreadable media remains visible through the original URL.
    return fallback;
  }
}
