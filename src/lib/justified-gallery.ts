/** Sanitizes photo dimensions to compute an aspect ratio (width / height). */
export function photoAspectRatio(width?: unknown, height?: unknown, fallback = 1.3333): number {
  const w = typeof width === 'number' && Number.isFinite(width) && width > 0 ? width : 0;
  const h = typeof height === 'number' && Number.isFinite(height) && height > 0 ? height : 0;
  if (w > 0 && h > 0) {
    const ratio = Math.round((w / h) * 10000) / 10000;
    return Number.isFinite(ratio) && ratio > 0 ? ratio : fallback;
  }
  return fallback;
}

/** Generates CSS flexbox style properties for a justified gallery item. */
export function justifiedFlexStyle(ratio: number, targetRowHeight = 260) {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1.3333;
  return {
    photoRatio: safeRatio,
    flexGrow: `${safeRatio}`,
    flexBasis: `calc(clamp(160px, 38vw, ${targetRowHeight}px) * ${safeRatio})`,
  };
}

/**
 * Pure mathematical model of pure-CSS flexbox justified row expansion.
 * Proves that proportional flex-grow preserves identical row heights across mixed aspect ratios.
 */
export function simulateFlexRow(
  items: { ratio: number }[],
  containerWidth: number,
  gap: number,
  targetRowHeight = 260
): { widths: number[]; rowHeight: number } {
  if (!items.length || containerWidth <= 0) return { widths: [], rowHeight: 0 };
  const totalGaps = (items.length - 1) * gap;
  const initialWidths = items.map(item => targetRowHeight * item.ratio);
  const totalInitialWidth = initialWidths.reduce((sum, w) => sum + w, 0);
  const freeSpace = containerWidth - totalGaps - totalInitialWidth;
  const totalRatio = items.reduce((sum, item) => sum + item.ratio, 0);

  const widths = items.map(item => {
    const extra = totalRatio > 0 ? freeSpace * (item.ratio / totalRatio) : 0;
    return Math.round((targetRowHeight * item.ratio + extra) * 100) / 100;
  });

  const rowHeight = totalRatio > 0 ? targetRowHeight + freeSpace / totalRatio : targetRowHeight;
  return { widths, rowHeight: Math.round(rowHeight * 100) / 100 };
}
