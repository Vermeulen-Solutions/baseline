/**
 * Token catalogue and calibration maths for the development panel.
 *
 * The catalogue itself is NOT written here. Membership, grouping, roles and the
 * derived-value flag come from `src/utils/token-catalog.generated.mjs`, which is
 * generated from the authored stylesheet by `scripts/generate-token-catalog.mjs`.
 * Adding a token to `src/styles/global.css` is the only step needed for the panel
 * to pick it up; run `npm run tokens:generate` to refresh the generated file.
 *
 * This module owns only what a stylesheet cannot supply: the calibration maths,
 * the fluid family lists, and the tokens the panel can write without an authored value.
 */
import { tokenGroups, writeOnlyTokens } from './token-catalog.generated.mjs';

export { tokenGroups, writeOnlyTokens };

/** Flat view of the catalogue: one entry per token, carrying its group. */
export const tokenDefinitions = tokenGroups.flatMap(group => group.tokens.map(([key, label, property, readonly]) => ({ key, label, property, readonly: !!readonly, group: group.id })));

/** Colour-role tokens, used for swatches and contrast checks. */
export const paletteTokens = tokenDefinitions.filter(token => token.property === 'color').map(token => token.key);

/** Fluid display sizes scaled by the heading calibration control. */
export const headingTokens = ['--text-step-1', '--text-step-2', '--text-step-3-to-1', '--text-step-2-to-0'];

/** Fluid spacing sizes scaled by the density calibration control. */
export const spacingTokens = tokenDefinitions.filter(token => token.key.startsWith('--spacing-')).map(token => token.key);

/** Every token the panel can read a baseline for or write an override to. */
export const baselineTokens = [
  ...tokenDefinitions.map(token => token.key),
  ...writeOnlyTokens.map(({ token }) => token),
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
