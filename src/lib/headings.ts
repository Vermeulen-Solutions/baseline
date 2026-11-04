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
 *
 * Preserves unicode letter and mark characters (\p{L}\p{M}) such as Indic vowel signs,
 * strips HTML tags safely even with quotes containing brackets, and collapses whitespace.
 */
export function slugifyHeading(text: string): string {
  return text
    .replace(/<(?:'[^']*'|"[^"]*"|[^"'>])+>/g, '') // strip HTML tags safely
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritical marks (Latin/Greek accents)
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '') // keep letters, combining marks (Indic/Arabic/etc), numbers, spaces, hyphens
    .trim()
    .replace(/[\s_]+/g, '-') // spaces and underscores to hyphens
    .replace(/-+/g, '-'); // collapse multiple hyphens
}

/**
 * Deduplicates a base heading ID against a tracking set or map of previously seen/emitted IDs.
 *
 * Ensures that generated suffixed IDs (e.g. repeat-2) are themselves reserved so subsequent
 * headings whose base text naturally slugifies to that suffix (e.g. "Repeat 2") never collide.
 */
export function deduplicateHeadingId(
  baseId: string,
  seenIds: Set<string> | Map<string, number>
): string {
  let usedSet: Set<string>;
  let countsMap: Map<string, number>;

  if (seenIds instanceof Set) {
    usedSet = seenIds;
    countsMap = new Map();
  } else {
    countsMap = seenIds;
    usedSet = new Set(seenIds.keys());
  }

  if (!usedSet.has(baseId)) {
    usedSet.add(baseId);
    countsMap.set(baseId, 1);
    if (seenIds instanceof Map) {
      seenIds.set(baseId, 1);
    }
    return baseId;
  }

  let count = countsMap.get(baseId) ?? 1;
  let candidate: string;
  do {
    count++;
    candidate = `${baseId}-${count}`;
  } while (usedSet.has(candidate));

  countsMap.set(baseId, count);
  usedSet.add(candidate);
  if (seenIds instanceof Map) {
    seenIds.set(candidate, 1);
  }
  return candidate;
}
