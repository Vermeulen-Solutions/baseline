/** Curated public token catalog shared by the inspector, preview and export. */
/** @type {Array<{id: string, label: string, help: string, tokens: Array<[string, string, string, boolean?]>}>} */
export const tokenGroups = [
  { id: 'typography', label: 'Typography', help: 'Fluid sizes keep their clamp expressions. Fonts must already be available on the site.', tokens: [
    ['--font-body', 'Body font', 'font-family'], ['--font-display', 'Display font', 'font-family'],
    ['--text-step--1', 'Small text', 'font-size'], ['--text-step-0', 'Body text', 'font-size'],
    ['--text-step-1', 'Heading 2', 'font-size'], ['--text-step-2', 'Heading 1', 'font-size'],
    ['--text-step-3-to-1', 'Fluid display pair', 'font-size'], ['--text-step-2-to-0', 'Fluid text pair', 'font-size'],
  ]},
  { id: 'spacing', label: 'Spacing & layout', help: 'Tune rhythm, container gutters and reading widths. Density scales the entire spacing family.', tokens: [
    ['--spacing-content', 'Content rhythm', 'gap'], ['--spacing-grid', 'Grid gap', 'gap'],
    ['--spacing-container', 'Container gutter', 'padding'], ['--spacing-section', 'Section space', 'padding'],
    ['--spacing-2xl-to-md', 'Fluid space 2XL → MD', 'gap'], ['--spacing-xl-to-sm', 'Fluid space XL → SM', 'gap'],
    ['--measure-reading', 'Reading width', 'max-width'], ['--measure-content', 'Content width', 'max-width'],
    ['--measure-wide', 'Wide width', 'max-width'], ['--measure-content-safe', 'Safe content width (derived)', 'max-width', true],
    ['--header-height', 'Header offset', 'height'], ['--scroll-offset', 'Scroll clearance', 'scroll-margin-top'],
  ]},
  { id: 'colors', label: 'Colors', help: 'Semantic roles accept CSS colors, including OKLCH. Check text and focus contrast on light and dark surfaces.', tokens: [
    ['--color-action', 'Action / Accent', 'color'], ['--color-page', 'Page background', 'color'],
    ['--color-text', 'Text', 'color'], ['--color-muted', 'Secondary text', 'color'],
    ['--color-surface', 'Surface', 'color'], ['--color-border', 'Border', 'color'],
    ['--color-on-action', 'Text on action', 'color'], ['--color-focus', 'Focus ring', 'color'],
    ['--color-focus-on-dark', 'Focus on dark', 'color'],
  ]},
  { id: 'effects', label: 'Shape & effects', help: 'Shared radii, layered shadows and motion curves. Hero adjustments affect media marked data-hero-asset.', tokens: [
    ['--radius-control', 'Control radius', 'border-radius'], ['--radius-card', 'Card radius', 'border-radius'],
    ['--shadow-sm', 'Small shadow', 'box-shadow'], ['--shadow-md', 'Medium shadow', 'box-shadow'],
    ['--shadow-lg', 'Large shadow', 'box-shadow'], ['--ease-smooth', 'Smooth easing', 'transition-timing-function'],
    ['--ease-snappy', 'Snappy easing', 'transition-timing-function'], ['--ease-spring', 'Spring easing', 'transition-timing-function'],
  ]},
];
export const tokenDefinitions = tokenGroups.flatMap(group => group.tokens.map(([key, label, property, readonly]) => ({ key, label, property, readonly: !!readonly, group: group.id })));
export const paletteTokens = tokenDefinitions.filter(token => token.property === 'color').map(token => token.key);
export const headingTokens = ['--text-step-1', '--text-step-2', '--text-step-3-to-1', '--text-step-2-to-0'];
export const spacingTokens = tokenDefinitions.filter(token => token.key.startsWith('--spacing-')).map(token => token.key);
export const baselineTokens = [
  ...tokenDefinitions.map(token => token.key), '--font-weight-display',
  '--letter-spacing-display', '--hero-filter', '--page-pattern', '--page-pattern-size',
];

export function createTokenMap(baseline, changes) {
  /** @type {Record<string, string>} */
  const tokens = {};
  const scale = (key, factor) => {
    if (factor !== undefined && Number(factor) !== 1 && baseline[key]) {
      tokens[key] = `calc(${baseline[key]} * ${Number(factor)})`;
    }
  };
  for (const key of headingTokens) scale(key, changes.typeScale);
  for (const key of spacingTokens) {
    scale(key, changes.densityScale);
  }
  if (changes.typeWeight !== undefined) tokens['--font-weight-display'] = changes.typeWeight;
  if (changes.tracking !== undefined) tokens['--letter-spacing-display'] = `${changes.tracking}em`;
  // An explicit token edit wins over family calibration. Derived tokens remain source-owned.
  for (const { key, readonly } of tokenDefinitions) {
    if (!readonly && changes[key] !== undefined) tokens[key] = changes[key];
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
  // Returning a control to its source value removes it from preview and export.
  for (const [key, value] of Object.entries(tokens)) {
    if (String(value).trim() === baseline[key]?.trim()) delete tokens[key];
  }
  return tokens;
}

export function exportTokens(tokens) {
  const theme = [];
  const root = [];
  for (const [key, value] of Object.entries(tokens)) {
    (key.startsWith('--color-') || key.startsWith('--text-') || key.startsWith('--spacing-') || key.startsWith('--font-') && key !== '--font-weight-display' || key.startsWith('--radius-') || key.startsWith('--shadow-') || key.startsWith('--ease-') ? theme : root)
      .push(`  ${key}: ${value};`);
  }
  return [
    '/* Calibrated overrides: merge into global.css, then verify with a clean reload. */',
    theme.length ? `@theme {\n${theme.join('\n')}\n}` : '',
    root.length ? `:root {\n${root.join('\n')}\n}` : '',
  ].filter(Boolean).join('\n\n');
}
