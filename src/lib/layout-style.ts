import type { HTMLAttributes } from 'astro/types';

/** Steps of the fluid space scale (`--spacing-<step>`). */
export const SPACE_STEPS = ['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl'] as const;
export const SPACE_PAIRS = ['3xs-2xs', '2xs-xs', 'xs-s', 's-m', 'm-l', 'l-xl', 'xl-2xl', '2xl-3xl', 's-l', 'l-2xl', 'xl-3xl'] as const;
export const SEMANTIC_GAPS = ['content', 'grid', 'container', 'section', 'section-m'] as const;
export type SpaceStep = typeof SPACE_STEPS[number] | typeof SPACE_PAIRS[number];
/**
 * A layout gap: a token name, `none`, or (for compatibility) any CSS length string.
 * Prefer a token name; `npm run check:css` reports raw lengths as advisories.
 */
// `string & Record<never, never>` keeps editor completion for the names while accepting any string.
export type LayoutGap = 'none' | typeof SEMANTIC_GAPS[number] | SpaceStep | (string & Record<never, never>);

const GAP_TOKENS = new Set<string>([...SEMANTIC_GAPS, ...SPACE_STEPS, ...SPACE_PAIRS]);

/** Resolves a gap token name to its custom property; other strings pass through unchanged. */
export function gapValue(gap: string) {
  if (gap === 'none') return '0px';
  return GAP_TOKENS.has(gap) ? `var(--spacing-${gap})` : gap;
}

/** A component gap prop wins its local style variable; utilities still own gap. */
export function layoutStyle(style: HTMLAttributes<'div'>['style'], variable: string, rawGap: unknown) {
  const raw = typeof rawGap === 'string' && rawGap.trim() && !/[;{}]/.test(rawGap) ? rawGap.trim() : undefined;
  const gap = raw === undefined ? undefined : gapValue(raw);
  if (!gap) return style;
  return style && typeof style === 'object' ? { ...style, [variable]: gap } : `${style || ''};${variable}:${gap}`;
}
