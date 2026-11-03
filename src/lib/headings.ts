export type HeadingDepth = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingRecord {
  id: string;
  text: string;
  depth: HeadingDepth;
}

export interface TocNode extends HeadingRecord {
  children: TocNode[];
}

export interface BuildTocOptions {
  minDepth?: HeadingDepth;
  maxDepth?: HeadingDepth;
}

/**
 * Builds a hierarchical Table of Contents tree from a flat array of heading records.
 *
 * Supports skipped heading levels (e.g. h2 followed directly by h4) by nesting
 * under the nearest preceding ancestor. Filters headings outside minDepth/maxDepth.
 */
export function buildToc(
  headings: readonly HeadingRecord[],
  options?: BuildTocOptions
): TocNode[] {
  const minDepth = options?.minDepth ?? 2;
  const maxDepth = options?.maxDepth ?? 3;

  const eligibleHeadings = headings.filter(
    (h) => h.depth >= minDepth && h.depth <= maxDepth && h.id && h.text.trim()
  );

  const rootNodes: TocNode[] = [];
  const stack: TocNode[] = [];

  for (const heading of eligibleHeadings) {
    const node: TocNode = {
      id: heading.id,
      text: heading.text.trim(),
      depth: heading.depth,
      children: [],
    };

    // Pop stack until finding an ancestor with strictly lower depth
    while (stack.length > 0 && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      rootNodes.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return rootNodes;
}

/**
 * Converts a text string into a URL-safe, lowercase slug suitable for heading anchor IDs.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/<[^>]+>/g, '') // strip HTML tags
    .replace(/[^\p{L}\p{N}\s_-]/gu, '') // keep letters, numbers, spaces, hyphens
    .trim()
    .replace(/[\s_]+/g, '-') // spaces and underscores to hyphens
    .replace(/-+/g, '-'); // collapse multiple hyphens
}
