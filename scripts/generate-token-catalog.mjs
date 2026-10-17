/**
 * Derive the token catalogue from the stylesheet that actually declares it.
 *
 * `src/styles/global.css` is the only place tokens are authored. This generator reads the
 * `@theme` and `:root` blocks, works out each token's group and semantic role from prefix
 * rules, and writes `src/utils/token-catalog.generated.mjs`. Adding a token to the stylesheet
 * is therefore the only step needed for it to appear in the panel.
 *
 * A stylesheet cannot express a friendly name or whether a value is composed from other
 * tokens, so those live in `scripts/token-catalog-overrides.mjs` and are optional.
 *
 * Run with: npm run tokens:generate
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { labels, deltas, writeOnly } from './token-catalog-overrides.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

/** Group presentation. Written once; not per token. */
export const GROUPS = {
  typography: {
    label: 'Typography',
    help: 'Fluid sizes keep their clamp expressions. Fonts must already be available on the site.',
  },
  spacing: {
    label: 'Spacing & layout',
    help: 'Tune rhythm, container gutters and reading widths. Density scales the entire spacing family.',
  },
  colors: {
    label: 'Colors',
    help: 'Semantic roles accept CSS colors, including OKLCH. Check text and focus contrast on light and dark surfaces.',
  },
  effects: {
    label: 'Shape & effects',
    help: 'Shared radii, layered shadows and motion curves. Hero adjustments affect media marked data-hero-asset.',
  },
};

/** Rendering order of the groups in the panel. */
export const GROUP_ORDER = ['typography', 'spacing', 'colors', 'effects'];

/**
 * Which group a token belongs to. First match wins; `exact` beats `prefix`.
 * Anything unmatched is an error rather than a silent omission.
 */
const GROUP_RULES = [
  { prefix: '--font-', group: 'typography' },
  { prefix: '--text-', group: 'typography' },
  { prefix: '--color-', group: 'colors' },
  { prefix: '--radius-', group: 'effects' },
  { prefix: '--shadow-', group: 'effects' },
  { prefix: '--ease-', group: 'effects' },
  { prefix: '--spacing-', group: 'spacing' },
  { prefix: '--measure-', group: 'spacing' },
  { exact: '--header-height', group: 'spacing' },
  { exact: '--scroll-offset', group: 'spacing' },
];

/** The CSS property each token is expected to drive, used for input validation in the panel. */
const ROLE_RULES = [
  { prefix: '--font-', role: 'font-family' },
  { prefix: '--text-', role: 'font-size' },
  { prefix: '--color-', role: 'color' },
  { prefix: '--radius-', role: 'border-radius' },
  { prefix: '--shadow-', role: 'box-shadow' },
  { prefix: '--ease-', role: 'transition-timing-function' },
  { prefix: '--spacing-', role: 'gap' },
  { prefix: '--measure-', role: 'max-width' },
  { exact: '--header-height', role: 'height' },
  { exact: '--scroll-offset', role: 'scroll-margin-top' },
];

/** Abbreviations expanded when a name is turned into a label, so derived labels read well. */
const ABBREVIATIONS = {
  xs: 'XS', sm: 'SM', md: 'MD', lg: 'LG', xl: 'XL', xxl: '2XL', xxxl: '3XL',
  '2xl': '2XL', '3xl': '3XL', '2xs': '2XS',
};

/** Extract one top-level block, bounded by the next line-start `}`. */
function block(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) throw new Error(`global.css must contain ${marker}`);
  const end = css.indexOf('\n}', start);
  if (end < start) throw new Error(`${marker} block must be closed by a line-start }`);
  return css.slice(start, end);
}

/** Custom properties declared in a block, in authoring order. */
function declared(blockText) {
  return [...blockText.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((match) => match[1]);
}

function matchingRule(rules, token) {
  return rules.find((rule) => (rule.exact ? rule.exact === token : token.startsWith(rule.prefix)));
}

/** Fallback label: `--spacing-2xl-to-md` becomes "Spacing 2XL To MD". */
function derivedLabel(token) {
  const words = token
    .replace(/^--/, '')
    .split('-')
    .filter((part) => part !== '')
    .map((part) => ABBREVIATIONS[part] ?? part.charAt(0).toUpperCase() + part.slice(1));
  return words.join(' ') || token;
}

/**
 * Build the catalogue from the stylesheet plus the optional annotations.
 * Exported so the guard test can rebuild it and detect a stale generated file.
 */
export function buildCatalog({
  cssPath = resolve(ROOT, 'src/styles/global.css'),
  annotations = { labels, deltas, writeOnly },
} = {}) {
  const css = readFileSync(cssPath, 'utf8');
  const authored = [...new Set([...declared(block(css, '@theme {')), ...declared(block(css, ':root {'))])];

  const buckets = new Map(GROUP_ORDER.map((id) => [id, []]));
  const unmatched = [];

  for (const token of authored) {
    const groupRule = matchingRule(GROUP_RULES, token);
    const roleRule = matchingRule(ROLE_RULES, token);
    if (!groupRule || !roleRule) {
      unmatched.push(token);
      continue;
    }
    const delta = annotations.deltas[token] ?? {};
    const entry = [token, annotations.labels[token] ?? derivedLabel(token), delta.property ?? roleRule.role];
    if (delta.readonly) entry.push(true);
    buckets.get(groupRule.group).push(entry);
  }

  if (unmatched.length > 0) {
    throw new Error(
      `No group/role rule matches: ${unmatched.join(', ')}. Add a rule to scripts/generate-token-catalog.mjs.`,
    );
  }

  const groups = GROUP_ORDER.map((id) => ({
    id,
    label: GROUPS[id].label,
    help: GROUPS[id].help,
    tokens: buckets.get(id),
  })).filter((group) => group.tokens.length > 0);

  const unknownAnnotations = [
    ...Object.keys(annotations.labels),
    ...Object.keys(annotations.deltas),
  ].filter((token) => !authored.includes(token));

  if (unknownAnnotations.length > 0) {
    throw new Error(
      `scripts/token-catalog-overrides.mjs names tokens that global.css does not declare: ${unknownAnnotations.join(', ')}`,
    );
  }

  return { groups, writeOnly: annotations.writeOnly, authored };
}

/** The exact text of the generated module. */
export function renderCatalog(catalog) {
  const line = ([key, label, role, readonly]) =>
    `\t\t['${key}', ${JSON.stringify(label)}, ${JSON.stringify(role)}${readonly ? ', true' : ''}],`;
  const groups = catalog.groups
    .map((group) =>
      [
        `\t{`,
        `\t\tid: ${JSON.stringify(group.id)},`,
        `\t\tlabel: ${JSON.stringify(group.label)},`,
        `\t\thelp: ${JSON.stringify(group.help)},`,
        `\t\ttokens: [`,
        ...group.tokens.map(line),
        `\t\t],`,
        `\t},`,
      ].join('\n'),
    )
    .join('\n');
  const writeOnly = catalog.writeOnly
    .map(([token, reason]) => `\t{ token: ${JSON.stringify(token)}, reason: ${JSON.stringify(reason)} },`)
    .join('\n');

  return `/**
 * GENERATED FILE - DO NOT EDIT BY HAND.
 *
 * Derived from src/styles/global.css by scripts/generate-token-catalog.mjs.
 * Regenerate with: npm run tokens:generate
 * The guard in tests/token-coverage.test.mjs fails when this file is stale.
 */

/** Token catalogue, grouped for the panel. Shape: [key, label, cssProperty, readonly?]. */
/** @type {Array<{id: string, label: string, help: string, tokens: Array<[string, string, string, boolean?]>}>} */
export const tokenGroups = [
${groups}
];

/** Tokens the panel can write that deliberately have no authored value in global.css. */
/** @type {Array<{token: string, reason: string}>} */
export const writeOnlyTokens = [
${writeOnly}
];
`;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const catalog = buildCatalog();
  const output = resolve(ROOT, 'src/utils/token-catalog.generated.mjs');
  writeFileSync(output, renderCatalog(catalog), 'utf8');
  const count = catalog.groups.reduce((total, group) => total + group.tokens.length, 0);
  console.log(`Wrote src/utils/token-catalog.generated.mjs - ${count} tokens in ${catalog.groups.length} groups, ${catalog.writeOnly.length} write-only.`);
}
