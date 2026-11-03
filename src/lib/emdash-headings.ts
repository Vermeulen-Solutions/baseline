/**
 * EmDash CMS Portable Text Headings Adapter
 *
 * Extracts heading records from raw Portable Text blocks without introducing
 * CMS runtime dependencies. Uses stable namespaced block keys (_key) to guarantee
 * that editorial text edits do not invalidate existing incoming heading anchor links.
 */

import type { HeadingDepth, HeadingRecord } from './headings.ts';
import { slugifyHeading } from './headings.ts';

interface PortableTextSpan {
  _type?: string;
  text?: string;
  [key: string]: unknown;
}

interface PortableTextBlock {
  _type?: string;
  _key?: string;
  style?: string;
  children?: PortableTextSpan[];
  [key: string]: unknown;
}

/**
 * Extracts HeadingRecord items from an array of Portable Text blocks.
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

  const results: HeadingRecord[] = [];
  const validStyles = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

  for (let i = 0; i < blocks.length; i++) {
    const rawBlock = blocks[i];
    if (!rawBlock || typeof rawBlock !== 'object') continue;

    const block = rawBlock as PortableTextBlock;
    if (block._type !== 'block' || !block.style || !validStyles.has(block.style)) {
      continue;
    }

    const depth = parseInt(block.style.slice(1), 10) as HeadingDepth;

    // Concatenate text across all inline spans within the block
    const text = Array.isArray(block.children)
      ? block.children
          .filter((c): c is PortableTextSpan => Boolean(c && typeof c === 'object' && typeof c.text === 'string'))
          .map((c) => c.text as string)
          .join('')
          .trim()
      : '';

    if (!text) continue;

    // Stable anchor ID: prefer block._key, sanitized for URL safety
    let id: string;
    if (block._key && typeof block._key === 'string' && block._key.trim()) {
      const sanitizedKey = block._key.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
      id = scopeId ? `${scopeId}-${sanitizedKey}` : sanitizedKey;
    } else {
      const slug = slugifyHeading(text) || `heading-${i + 1}`;
      id = scopeId ? `${scopeId}-${slug}` : slug;
    }

    results.push({
      id,
      text,
      depth,
    });
  }

  return results;
}
