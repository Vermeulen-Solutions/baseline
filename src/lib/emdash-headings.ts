/**
 * EmDash CMS Portable Text Headings Adapter
 *
 * Extracts heading records from raw Portable Text blocks without introducing
 * CMS runtime dependencies. Uses stable namespaced block keys (_key) to guarantee
 * that editorial text edits do not invalidate existing incoming heading anchor links.
 *
 * Shares the exact same deterministic ID policy and deduplication with RichText's
 * heading renderer.
 */

import type { HeadingDepth, HeadingRecord } from './headings.ts';
import { slugifyHeading, deduplicateHeadingId } from './headings.ts';

export interface PortableTextSpan {
  _type?: string;
  text?: string;
  [key: string]: unknown;
}

export interface PortableTextBlock {
  _type?: string;
  _key?: string;
  style?: string;
  children?: PortableTextSpan[];
  [key: string]: unknown;
}

const VALID_HEADING_STYLES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * Deterministically sanitizes a Portable Text block _key into an anchor ID segment.
 *
 * Replaces non-alphanumeric, non-hyphen, non-underscore characters with a distinct hex-encoded
 * sequence (_xx_) to guarantee that distinct keys such as "a.b" and "a?b" never collide.
 */
export function sanitizeBlockKey(key: string): string {
  return key.trim().replace(/[^a-zA-Z0-9_-]/g, (ch) => `_${ch.charCodeAt(0).toString(16)}_`);
}

/**
 * Extracts plain text from inline spans of a Portable Text block.
 */
export function extractBlockText(block: PortableTextBlock): string {
  return Array.isArray(block.children)
    ? block.children
        .filter((c): c is PortableTextSpan => Boolean(c && typeof c === 'object' && typeof c.text === 'string'))
        .map((c) => c.text as string)
        .join('')
        .trim()
    : '';
}

/**
 * Resolves a heading ID for a single block using the stable key or slugified text.
 */
export function getPortableHeadingId(
  block: unknown,
  scopeId: string = ''
): string {
  if (!block || typeof block !== 'object') return '';
  const b = block as PortableTextBlock;

  if (typeof (b as Record<string, unknown>).__emdash_heading_id === 'string') {
    return (b as Record<string, unknown>).__emdash_heading_id as string;
  }

  if (b._key && typeof b._key === 'string' && b._key.trim()) {
    const sanitizedKey = sanitizeBlockKey(b._key);
    return scopeId ? `${scopeId}-${sanitizedKey}` : sanitizedKey;
  }

  const text = extractBlockText(b);
  const slug = slugifyHeading(text) || 'heading';
  return scopeId ? `${scopeId}-${slug}` : slug;
}

/**
 * Decorates an array of Portable Text blocks in-place with pre-computed, collision-free
 * heading IDs (`__emdash_heading_id`).
 *
 * If a block already has an `__emdash_heading_id` and no explicit non-empty `scopeId` is passed,
 * the existing ID is preserved to maintain alignment with previously extracted TOC records.
 */
export function decoratePortableHeadingBlocks(
  blocks: readonly unknown[],
  scopeId: string = ''
): void {
  if (!Array.isArray(blocks) || blocks.length === 0) return;

  const seenIds = new Map<string, number>();

  for (let i = 0; i < blocks.length; i++) {
    const rawBlock = blocks[i];
    if (!rawBlock || typeof rawBlock !== 'object') continue;
    const block = rawBlock as PortableTextBlock;

    if (block._type !== 'block' || !block.style || !VALID_HEADING_STYLES.has(block.style)) {
      continue;
    }

    // Preserve existing decorated ID if scopeId was not explicitly overridden
    const existingId = (block as Record<string, unknown>).__emdash_heading_id;
    if (typeof existingId === 'string' && existingId && !scopeId) {
      // Track seen to prevent duplicate collisions later in the document
      seenIds.set(existingId, (seenIds.get(existingId) ?? 0) + 1);
      continue;
    }

    let baseId: string;
    if (block._key && typeof block._key === 'string' && block._key.trim()) {
      const sanitizedKey = sanitizeBlockKey(block._key);
      baseId = scopeId ? `${scopeId}-${sanitizedKey}` : sanitizedKey;
    } else {
      const text = extractBlockText(block);
      const slug = slugifyHeading(text) || `heading-${i + 1}`;
      baseId = scopeId ? `${scopeId}-${slug}` : slug;
    }

    const uniqueId = deduplicateHeadingId(baseId, seenIds);
    (block as Record<string, unknown>).__emdash_heading_id = uniqueId;
  }
}

/**
 * Extracts HeadingRecord items from an array of Portable Text blocks and ensures
 * that blocks receive matching decorated IDs.
 *
 * @param blocks - Array of raw block objects from an EmDash field
 * @param scopeId - Optional namespace prefix for anchor IDs (e.g. field or document ID)
 */
export function headingsFromPortableBlocks(
  blocks: readonly unknown[],
  scopeId: string = ''
): HeadingRecord[] {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return [];
  }

  decoratePortableHeadingBlocks(blocks, scopeId);

  const results: HeadingRecord[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const rawBlock = blocks[i];
    if (!rawBlock || typeof rawBlock !== 'object') continue;

    const block = rawBlock as PortableTextBlock;
    if (block._type !== 'block' || !block.style || !VALID_HEADING_STYLES.has(block.style)) {
      continue;
    }

    const depth = parseInt(block.style.slice(1), 10) as HeadingDepth;
    const text = extractBlockText(block);
    if (!text) continue;

    const id = (block as Record<string, unknown>).__emdash_heading_id as string || getPortableHeadingId(block, scopeId);

    results.push({
      id,
      text,
      depth,
    });
  }

  return results;
}
