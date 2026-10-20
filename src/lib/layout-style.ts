import type { HTMLAttributes } from 'astro/types';

/** A component gap prop wins its local style variable; utilities still own gap. */
export function layoutStyle(style: HTMLAttributes<'div'>['style'], variable: string, rawGap: unknown) {
  const gap = typeof rawGap === 'string' && rawGap.trim() && !/[;{}]/.test(rawGap) ? rawGap.trim() : undefined;
  if (!gap) return style;
  return style && typeof style === 'object' ? { ...style, [variable]: gap } : `${style || ''};${variable}:${gap}`;
}
