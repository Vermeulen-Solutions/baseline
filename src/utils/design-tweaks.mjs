/** Pure token mapping shared by live preview and CSS export. */
export const paletteTokens = [
  '--color-action', '--color-page', '--color-text', '--color-muted',
  '--color-surface', '--color-border', '--color-on-action', '--color-focus',
];
export const baselineTokens = [
  ...paletteTokens, '--text-step-1', '--text-step-2', '--spacing-content',
  '--spacing-grid', '--spacing-section', '--font-weight-display',
  '--letter-spacing-display', '--hero-filter', '--page-pattern', '--page-pattern-size',
];

export function createTokenMap(baseline, changes) {
  const tokens = {};
  const scale = (key, factor) => {
    if (factor !== undefined && Number(factor) !== 1 && baseline[key]) {
      tokens[key] = `calc(${baseline[key]} * ${Number(factor)})`;
    }
  };
  scale('--text-step-1', changes.typeScale);
  scale('--text-step-2', changes.typeScale);
  for (const key of ['--spacing-content', '--spacing-grid', '--spacing-section']) {
    scale(key, changes.densityScale);
  }
  if (changes.typeWeight !== undefined) tokens['--font-weight-display'] = changes.typeWeight;
  if (changes.tracking !== undefined) tokens['--letter-spacing-display'] = `${changes.tracking}em`;
  for (const key of paletteTokens) {
    if (changes[key] !== undefined) tokens[key] = changes[key];
  }
  if (['heroBrightness', 'heroContrast', 'heroSaturation'].some(key => changes[key] !== undefined)) {
    const original = baseline['--hero-filter'] === 'none' ? '' : baseline['--hero-filter'];
    tokens['--hero-filter'] = `${original || ''} brightness(${changes.heroBrightness ?? 100}%) contrast(${changes.heroContrast ?? 100}%) saturate(${changes.heroSaturation ?? 100}%)`.trim();
  }
  const ink = 'color-mix(in srgb, var(--color-text) 12%, transparent)';
  const patterns = {
    solid: ['none', 'auto'],
    grid: [`linear-gradient(to right, ${ink} 1px, transparent 1px), linear-gradient(to bottom, ${ink} 1px, transparent 1px)`, '28px 28px'],
    dots: [`radial-gradient(${ink} 1px, transparent 1px)`, '20px 20px'],
    noise: [`radial-gradient(color-mix(in srgb, var(--color-text) 5%, transparent) 1px, transparent 0)`, '3px 3px'],
  };
  if (changes.surface && patterns[changes.surface]) {
    [tokens['--page-pattern'], tokens['--page-pattern-size']] = patterns[changes.surface];
  }
  return tokens;
}

export function exportTokens(tokens) {
  const theme = [];
  const root = [];
  for (const [key, value] of Object.entries(tokens)) {
    (key.startsWith('--color-') || key.startsWith('--text-') || key.startsWith('--spacing-') ? theme : root)
      .push(`  ${key}: ${value};`);
  }
  return [
    '/* Calibrated overrides: merge into global.css, then verify with a clean reload. */',
    theme.length ? `@theme {\n${theme.join('\n')}\n}` : '',
    root.length ? `:root {\n${root.join('\n')}\n}` : '',
  ].filter(Boolean).join('\n\n');
}
