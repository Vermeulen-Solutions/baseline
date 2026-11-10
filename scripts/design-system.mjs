import postcss from 'postcss';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tokenDiagnostics } from './audit-actionability.mjs';
import { auditFontPreflight } from './font-preflight.mjs';

export const REQUIRED_THEME_TOKENS = [
  '--font-body',
  '--font-display',
  '--font-mono',
  '--font-accent',
  '--text-step--1',
  '--text-step-0',
  '--text-step-1',
  '--text-step-2',
  '--text-step-3-to-1',
  '--text-step-2-to-0',
  '--spacing-content',
  '--spacing-grid',
  '--spacing-container',
  '--spacing-section',
  '--spacing-2xl-to-md',
  '--spacing-xl-to-sm',
  '--color-page',
  '--color-surface',
  '--color-text',
  '--color-muted',
  '--color-border',
  '--color-action',
  '--color-on-action',
  '--color-focus',
  '--color-focus-on-dark',
  '--radius-control',
  '--radius-card',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--ease-smooth',
  '--ease-snappy',
  '--ease-spring',
];

export const REQUIRED_ROOT_TOKENS = [
  '--color-link',
  '--measure-reading',
  '--measure-content',
  '--measure-content-safe',
  '--measure-wide',
  '--header-height',
  '--scroll-offset',
  '--layout-section-padding',
  '--layout-container-gap',
  '--layout-content-gap',
  '--layout-grid-gap',
];

export const REQUIRED_DARK_SURFACE_TOKENS = [
  '--color-link',
  '--color-surface',
  '--color-text',
  '--color-muted',
  '--color-border',
  '--color-focus',
];

export const AESTHETIC_LANES = {
  neutral: {
    name: 'Neutral Baseline',
    description: 'Clean, unopinionated starter tokens ready for brand adaptation.',
    record: {
      lane: 'Custom / existing brand — neutral baseline foundation adapted to client brand requirements',
      metaphor: 'Architectural drafting paper and balanced structural grid lines',
      typography: 'Display: System Sans, Body: System Sans (clean neo-grotesque hierarchy)',
      canvas: 'Crisp daylight page ground (oklch(99% 0.004 250)) with pure white surface cards',
      action: 'High-contrast cobalt action (oklch(43% 0.14 250)) with pure white on-action label ink',
      borders: 'Subtle 1px structural borders (oklch(85% 0.015 260)) with 0.75rem card radius',
      density: 'Balanced section rhythm (clamp(3rem, calc(1rem + 10vi), 9rem)) and 68ch reading measure',
      antiPatterns: 'No unverified low-contrast gray text; no consecutive identical 3-column card grids; no unquarantined client-side animation bloat',
    },
    theme: {
      '--font-body': 'ui-sans-serif, system-ui, sans-serif',
      '--font-display': 'ui-sans-serif, system-ui, sans-serif',
      '--color-page': 'oklch(99% 0.004 250)',
      '--color-surface': 'oklch(100% 0 0)',
      '--color-text': 'oklch(24% 0.02 260)',
      '--color-muted': 'oklch(46% 0.02 260)',
      '--color-border': 'oklch(85% 0.015 260)',
      '--color-action': 'oklch(43% 0.14 250)',
      '--color-on-action': 'oklch(100% 0 0)',
      '--color-focus': 'oklch(52% 0.18 250)',
      '--color-focus-on-dark': 'oklch(76% 0.13 250)',
      '--spacing-section': 'clamp(3rem, calc(1rem + 10vi), 9rem)',
      '--radius-control': '0.375rem',
      '--radius-card': '0.75rem',
    },
    root: {
      '--measure-reading': '68ch',
      '--measure-content': '76rem',
      '--measure-wide': '88rem',
    },
    dark: {
      '--color-surface': 'var(--surface-dark-bg, oklch(18% 0.02 260))',
      '--color-text': 'var(--surface-dark-text, oklch(96% 0.005 250))',
      '--color-muted': 'var(--surface-dark-muted, oklch(72% 0.015 260))',
      '--color-border': 'var(--surface-dark-border, oklch(30% 0.02 260))',
      '--color-focus': 'var(--color-focus-on-dark)',
    },
  },
  'technical-systems': {
    name: 'Technical Systems',
    description: 'Precision slate canvas, crisp 1px borders, high-contrast cobalt action, and compact structural density.',
    record: {
      lane: 'Technical Systems — precision engineering grid and high-density operational clarity',
      metaphor: 'Calibrated laboratory instrumentation and anodized aluminum blueprints',
      typography: 'Display: System Sans, Body: System Sans (tight display tracking with tabular numeral discipline)',
      canvas: 'Cool technical slate ground (oklch(98.5% 0.004 250)) paired with deep carbon dark surfaces (oklch(16% 0.02 250))',
      action: 'Signal cobalt action (oklch(44% 0.17 255)) with crisp focus rings',
      borders: 'Exposed 1px structural hairlines (oklch(84% 0.012 250)) with sharp 0.375rem card corners',
      density: 'Compact, information-rich section pacing (clamp(2.5rem, calc(1rem + 7.5vi), 7rem)) and 66ch measure',
      antiPatterns: 'No soft pastel gradients or blurred blobs; no oversized pill buttons; no decorative illustrations without technical meaning',
    },
    theme: {
      '--font-body': 'ui-sans-serif, system-ui, sans-serif',
      '--font-display': 'ui-sans-serif, system-ui, sans-serif',
      '--color-page': 'oklch(98.5% 0.004 250)',
      '--color-surface': 'oklch(100% 0 0)',
      '--color-text': 'oklch(18% 0.02 250)',
      '--color-muted': 'oklch(43% 0.02 250)',
      '--color-border': 'oklch(84% 0.012 250)',
      '--color-action': 'oklch(44% 0.17 255)',
      '--color-on-action': 'oklch(99% 0.002 255)',
      '--color-focus': 'oklch(50% 0.19 255)',
      '--color-focus-on-dark': 'oklch(78% 0.15 255)',
      '--spacing-section': 'clamp(2.5rem, calc(1rem + 7.5vi), 7rem)',
      '--radius-control': '0.25rem',
      '--radius-card': '0.375rem',
    },
    root: {
      '--measure-reading': '66ch',
      '--measure-content': '78rem',
      '--measure-wide': '90rem',
    },
    dark: {
      '--color-surface': 'var(--surface-dark-bg, oklch(16% 0.02 250))',
      '--color-text': 'var(--surface-dark-text, oklch(97% 0.005 250))',
      '--color-muted': 'var(--surface-dark-muted, oklch(76% 0.015 250))',
      '--color-border': 'var(--surface-dark-border, oklch(30% 0.02 250))',
      '--color-focus': 'var(--color-focus-on-dark)',
    },
  },
  'product-led-minimalism': {
    name: 'Product-Led Minimalism',
    description: 'Airy warm-alabaster canvas, charcoal ink, confident brand action, concentric card radii, and generous section rhythm.',
    record: {
      lane: 'Product-Led Minimalism — daylight-first clarity, generous whitespace, and tactile card geometry',
      metaphor: 'Architectural gallery daylight on matte alabaster surfaces',
      typography: 'Display: System Sans, Body: System Sans (confident display proportions over calm reading prose)',
      canvas: 'Warm alabaster page ground (oklch(99% 0.003 95)) with crisp elevated surface cards',
      action: 'Deep indigo-violet action (oklch(42% 0.18 272)) with high-contrast alabaster ink',
      borders: 'Refined warm borders (oklch(88% 0.008 95)) with concentric 0.875rem card and 0.5rem control radii',
      density: 'Airy, spacious section rhythm (clamp(3.25rem, calc(1.25rem + 10vi), 9.5rem)) and 65ch reading measure',
      antiPatterns: 'No cluttered multi-sidebar layouts; no heavy dark-mode neon glows; no consecutive identical 3-column feature grids',
    },
    theme: {
      '--font-body': 'ui-sans-serif, system-ui, sans-serif',
      '--font-display': 'ui-sans-serif, system-ui, sans-serif',
      '--color-page': 'oklch(99% 0.003 95)',
      '--color-surface': 'oklch(100% 0 0)',
      '--color-text': 'oklch(19% 0.012 265)',
      '--color-muted': 'oklch(44% 0.015 265)',
      '--color-border': 'oklch(88% 0.008 95)',
      '--color-action': 'oklch(42% 0.18 272)',
      '--color-on-action': 'oklch(99.5% 0.002 95)',
      '--color-focus': 'oklch(50% 0.19 272)',
      '--color-focus-on-dark': 'oklch(80% 0.14 272)',
      '--spacing-section': 'clamp(3.25rem, calc(1.25rem + 10vi), 9.5rem)',
      '--radius-control': '0.5rem',
      '--radius-card': '0.875rem',
    },
    root: {
      '--measure-reading': '65ch',
      '--measure-content': '76rem',
      '--measure-wide': '88rem',
    },
    dark: {
      '--color-surface': 'var(--surface-dark-bg, oklch(17% 0.018 265))',
      '--color-text': 'var(--surface-dark-text, oklch(97.5% 0.004 95))',
      '--color-muted': 'var(--surface-dark-muted, oklch(77% 0.012 265))',
      '--color-border': 'var(--surface-dark-border, oklch(31% 0.018 265))',
      '--color-focus': 'var(--color-focus-on-dark)',
    },
  },
  'editorial-paper': {
    name: 'Editorial Paper',
    description: 'Tactile warm paper canvas, deep espresso ink, editorial terracotta accent, crisp rules, and high typographic contrast.',
    record: {
      lane: 'Editorial Paper — warm archival print craft with high serif/sans typographic contrast',
      metaphor: 'Archival cotton bond paper, deep espresso letterpress ink, and engraved column rules',
      typography: 'Display: Georgia, Body: System Sans (high-contrast editorial serif headlines paired with clean humanist sans body)',
      canvas: 'Warm archival paper ground (oklch(97.5% 0.012 82)) with cream card surfaces (oklch(99.2% 0.006 85))',
      action: 'Editorial terracotta action (oklch(42% 0.15 28)) with warm ivory label ink',
      borders: 'Crisp 1px editorial rules (oklch(86% 0.018 78)) and tailored 0.25rem card corners without drop shadows',
      density: 'Generous editorial pacing (clamp(3.25rem, calc(1.25rem + 10vi), 9.25rem)) and 64ch reading measure',
      antiPatterns: 'No floating SaaS card shadows; no neon or purple gradients; no uncaptioned decorative stock widgets',
    },
    theme: {
      '--font-body': 'ui-sans-serif, system-ui, sans-serif',
      '--font-display': 'Georgia, Cambria, "Times New Roman", Times, serif',
      '--color-page': 'oklch(97.5% 0.012 82)',
      '--color-surface': 'oklch(99.2% 0.006 85)',
      '--color-text': 'oklch(20% 0.02 55)',
      '--color-muted': 'oklch(43% 0.025 58)',
      '--color-border': 'oklch(86% 0.018 78)',
      '--color-action': 'oklch(42% 0.15 28)',
      '--color-on-action': 'oklch(99% 0.005 82)',
      '--color-focus': 'oklch(48% 0.16 28)',
      '--color-focus-on-dark': 'oklch(80% 0.12 55)',
      '--spacing-section': 'clamp(3.25rem, calc(1.25rem + 10vi), 9.25rem)',
      '--radius-control': '0.1875rem',
      '--radius-card': '0.25rem',
    },
    root: {
      '--measure-reading': '64ch',
      '--measure-content': '74rem',
      '--measure-wide': '86rem',
    },
    dark: {
      '--color-surface': 'var(--surface-dark-bg, oklch(18% 0.018 55))',
      '--color-text': 'var(--surface-dark-text, oklch(96.5% 0.01 82))',
      '--color-muted': 'var(--surface-dark-muted, oklch(77% 0.016 75))',
      '--color-border': 'var(--surface-dark-border, oklch(32% 0.02 55))',
      '--color-focus': 'var(--color-focus-on-dark)',
    },
  },
  'luminous-futurism': {
    name: 'Luminous Futurism',
    description: 'Atmospheric cool canvas paired with deep obsidian dark surfaces, electric indigo/cyan accents, and smooth motion.',
    record: {
      lane: 'Luminous Futurism — atmospheric precision with deep obsidian dark surfaces and disciplined luminous accents',
      metaphor: 'Optical glass prisms and precision telemetry over deep obsidian slate',
      typography: 'Display: System Sans, Body: System Sans (geometric display headlines with high-clarity body copy)',
      canvas: 'Cool atmospheric daylight ground (oklch(98.2% 0.008 265)) paired with deep obsidian dark sections (oklch(14.5% 0.025 265))',
      action: 'Electric indigo action (oklch(42% 0.19 262)) and luminous cyan dark-surface focus rings (oklch(82% 0.14 215))',
      borders: 'Subtle luminous hairline borders (oklch(86% 0.016 265) light, oklch(29% 0.028 265) dark) with 0.75rem card radius',
      density: 'Dynamic section rhythm (clamp(3rem, calc(1rem + 9.5vi), 8.75rem)) alternating light and dark surface bands',
      antiPatterns: 'No muddy low-contrast text on dark backgrounds; no rainbow gradient text; no un-throttled background canvas animations',
    },
    theme: {
      '--font-body': 'ui-sans-serif, system-ui, sans-serif',
      '--font-display': 'ui-sans-serif, system-ui, sans-serif',
      '--color-page': 'oklch(98.2% 0.008 265)',
      '--color-surface': 'oklch(99.5% 0.004 265)',
      '--color-text': 'oklch(17% 0.025 265)',
      '--color-muted': 'oklch(43% 0.025 265)',
      '--color-border': 'oklch(86% 0.016 265)',
      '--color-action': 'oklch(42% 0.19 262)',
      '--color-on-action': 'oklch(99% 0.004 265)',
      '--color-focus': 'oklch(52% 0.2 230)',
      '--color-focus-on-dark': 'oklch(82% 0.14 215)',
      '--spacing-section': 'clamp(3rem, calc(1rem + 9.5vi), 8.75rem)',
      '--radius-control': '0.4375rem',
      '--radius-card': '0.75rem',
    },
    root: {
      '--measure-reading': '66ch',
      '--measure-content': '78rem',
      '--measure-wide': '90rem',
    },
    dark: {
      '--color-surface': 'var(--surface-dark-bg, oklch(14.5% 0.025 265))',
      '--color-text': 'var(--surface-dark-text, oklch(97% 0.008 250))',
      '--color-muted': 'var(--surface-dark-muted, oklch(76% 0.018 255))',
      '--color-border': 'var(--surface-dark-border, oklch(29% 0.028 265))',
      '--color-focus': 'var(--color-focus-on-dark)',
    },
  },
};

/**
 * Baseline starter values for every required contract token, mirroring the root
 * src/styles/global.css. Older sites use them only as reviewed suggestions when
 * adopting the contract (`--add-missing`); they are not client calibration.
 */
export const CONTRACT_STARTER_VALUES = {
  theme: {
    '--font-body': 'ui-sans-serif, system-ui, sans-serif',
    '--font-display': 'ui-sans-serif, system-ui, sans-serif',
    '--font-mono': 'ui-monospace, Menlo, Consolas, "Liberation Mono", monospace',
    '--font-accent': 'Georgia, Cambria, "Times New Roman", Times, serif',
    '--text-step--1': 'clamp(0.875rem, calc(0.8333rem + 0.2083vi), 1rem)',
    '--text-step-0': 'clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)',
    '--text-step-1': 'clamp(1.25rem, calc(1rem + 1.25vi), 2rem)',
    '--text-step-2': 'clamp(1.75rem, calc(1.25rem + 2.5vi), 3.25rem)',
    '--text-step-3-to-1': 'clamp(1.25rem, calc(0.25rem + 5vi), 4.25rem)',
    '--text-step-2-to-0': 'clamp(1rem, calc(0.25rem + 3.75vi), 3.25rem)',
    '--spacing-content': 'clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem)',
    '--spacing-grid': 'clamp(1.25rem, calc(0.9167rem + 1.6667vi), 2.25rem)',
    '--spacing-container': 'clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)',
    '--spacing-section': 'clamp(3rem, calc(1rem + 10vi), 9rem)',
    '--spacing-2xl-to-md': 'clamp(1.25rem, calc(-0.5rem + 8.75vi), 6.5rem)',
    '--spacing-xl-to-sm': 'clamp(0.75rem, calc(-0.3333rem + 5.4167vi), 4rem)',
    '--color-page': 'oklch(99% 0.004 250)',
    '--color-surface': 'oklch(100% 0 0)',
    '--color-text': 'oklch(24% 0.02 260)',
    '--color-muted': 'oklch(46% 0.02 260)',
    '--color-border': 'oklch(85% 0.015 260)',
    '--color-action': 'oklch(43% 0.14 250)',
    '--color-on-action': 'oklch(100% 0 0)',
    '--color-focus': 'oklch(52% 0.18 250)',
    '--color-focus-on-dark': 'oklch(76% 0.13 250)',
    '--radius-control': '0.375rem',
    '--radius-card': '0.75rem',
    '--shadow-sm': '0 2px 4px -1px oklch(from var(--color-text) l c h / 0.04), 0 4px 6px -1px oklch(from var(--color-text) l c h / 0.06), 0 8px 10px -2px oklch(from var(--color-text) l c h / 0.05)',
    '--shadow-md': '0 2px 4px -2px oklch(from var(--color-text) l c h / 0.05), 0 6px 10px -2px oklch(from var(--color-text) l c h / 0.07), 0 14px 20px -4px oklch(from var(--color-text) l c h / 0.07), 0 24px 32px -6px oklch(from var(--color-text) l c h / 0.05)',
    '--shadow-lg': '0 2px 4px -2px oklch(from var(--color-text) l c h / 0.04), 0 6px 12px -2px oklch(from var(--color-text) l c h / 0.06), 0 16px 24px -4px oklch(from var(--color-text) l c h / 0.07), 0 28px 36px -6px oklch(from var(--color-text) l c h / 0.07), 0 44px 52px -8px oklch(from var(--color-text) l c h / 0.06), 0 64px 72px -12px oklch(from var(--color-text) l c h / 0.05)',
    '--ease-smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
    '--ease-snappy': 'cubic-bezier(0.16, 1, 0.3, 1)',
    '--ease-spring': 'linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)',
  },
  root: {
    '--color-link': 'var(--color-action)',
    '--measure-reading': '68ch',
    '--measure-content': '76rem',
    '--measure-content-safe': 'min(var(--measure-content), calc(100% - var(--spacing-container) * 2))',
    '--measure-wide': '88rem',
    '--header-height': '0px',
    '--scroll-offset': '1.5rem',
    '--layout-section-padding': 'var(--spacing-section)',
    '--layout-container-gap': 'var(--spacing-grid)',
    '--layout-content-gap': 'var(--spacing-content)',
    '--layout-grid-gap': 'var(--spacing-grid)',
  },
  dark: {
    '--color-link': 'var(--surface-dark-link, var(--color-focus-on-dark))',
    '--color-surface': 'var(--surface-dark-bg, oklch(18% 0.02 260))',
    '--color-text': 'var(--surface-dark-text, oklch(96% 0.005 250))',
    '--color-muted': 'var(--surface-dark-muted, oklch(72% 0.015 260))',
    '--color-border': 'var(--surface-dark-border, oklch(30% 0.02 260))',
    '--color-focus': 'var(--color-focus-on-dark)',
  },
};

// Own keys only: a name such as `constructor` must not resolve to an inherited member.
const laneOf = id => (Object.hasOwn(AESTHETIC_LANES, id) ? AESTHETIC_LANES[id] : undefined);

const REQUIRED_BY_SCOPE = { theme: REQUIRED_THEME_TOKENS, root: REQUIRED_ROOT_TOKENS, dark: REQUIRED_DARK_SURFACE_TOKENS };
const SCOPE_SELECTORS = { root: ':root', dark: '[data-surface="dark"]' };

/**
 * Reports which required contract tokens and scope blocks a stylesheet lacks, with
 * Baseline starter values as suggestions. Older sites adopting the token workflow
 * use this to plan their migration; suggestions still need calibration.
 */
export function contractGap(css) {
  const { scopes } = tokenScopes(css);
  const tokens = parseDesignTokens(css);
  const missing = [];
  for (const [scope, list] of Object.entries(REQUIRED_BY_SCOPE)) {
    for (const token of list) {
      if (!tokens[scope][token]) missing.push({ scope, token, suggestion: CONTRACT_STARTER_VALUES[scope][token], source: 'baseline-starter' });
    }
  }
  return {
    complete: missing.length === 0,
    missing,
    missingScopes: Object.keys(REQUIRED_BY_SCOPE).filter(scope => !scopes[scope].length),
  };
}

/**
 * Inserts every missing required token with its starter suggestion, appending to the
 * existing scope block or creating the `:root` / `[data-surface="dark"]` block beside
 * the existing token blocks. Existing declarations are never changed.
 */
export function addMissingContractTokens(css) {
  const gap = contractGap(css);
  if (gap.complete) return css;
  const { ast, scopes } = tokenScopes(css);
  for (const scope of ['theme', 'root', 'dark']) {
    const items = gap.missing.filter(item => item.scope === scope);
    if (!items.length) continue;
    let node = scopes[scope][0];
    if (!node) {
      if (scope === 'theme') throw new Error('Cannot add missing @theme tokens: the stylesheet has no @theme block. Add one first.');
      const anchor = scope === 'dark' ? (scopes.root[0] ?? scopes.theme[0]) : scopes.theme[0];
      if (!anchor) throw new Error(`Cannot place a new ${SCOPE_SELECTORS[scope]} block: the stylesheet has no @theme or :root block.`);
      node = postcss.rule({ selector: SCOPE_SELECTORS[scope], raws: { between: ' ' } });
      anchor.after(node);
      scopes[scope].push(node);
    }
    for (const { token, suggestion } of items) node.append(postcss.decl({ prop: token, value: suggestion }));
  }
  const result = ast.toString();
  tokenScopes(result);
  return result;
}

function tokenScopes(css) {
  const ast = postcss.parse(css);
  const scopes = { theme: [], root: [], dark: [], light: [] };
  ast.walkAtRules('theme', node => { if (node.params.trim() === '') scopes.theme.push(node); });
  ast.walkRules(node => {
    const scope = { ':root':'root', '[data-surface="dark"]':'dark', '[data-surface="light"]':'light' }[node.selector.trim()];
    if (scope) scopes[scope].push(node);
  });
  for (const [scope, nodes] of Object.entries(scopes)) {
    if (nodes.length > 1) throw new Error('Ambiguous token scope: ' + scope);
    const names = new Set();
    for (const node of nodes[0]?.nodes || []) {
      if (node.type !== 'decl' || !node.prop.startsWith('--')) continue;
      if (names.has(node.prop)) throw new Error('Duplicate token ' + scope + ':' + node.prop + ' at line ' + node.source.start.line);
      names.add(node.prop);
    }
  }
  return { ast, scopes };
}

export function parseDesignTokens(css) {
  const { scopes } = tokenScopes(css);
  return Object.fromEntries(Object.entries(scopes).map(([name,nodes]) => [name,Object.fromEntries((nodes[0]?.nodes || []).filter(n=>n.type==='decl' && n.prop.startsWith('--')).map(n=>[n.prop,n.value]))]));
}

function srgbChannelToLinear(c) {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

// The two colour syntaxes the token contract can verify. One grammar serves the
// contrast audit and the palette generator, so they cannot disagree about what is
// a supported colour. Anything else (alpha, `none`, rgb(), 4/8-digit hex, a
// malformed number such as 1.2.3) is unsupported and stays unverified.
const COLOR_DECIMAL = '(?:\\d+(?:\\.\\d+)?|\\.\\d+)';
const OKLCH_COLOR = new RegExp(`^oklch\\(\\s*(${COLOR_DECIMAL})(%?)\\s+(${COLOR_DECIMAL})\\s+(${COLOR_DECIMAL})(deg|rad|turn)?\\s*\\)$`, 'i');
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `oklch(L C H)` as authored: lightness number, whether it is a percentage, chroma and hue in degrees. */
function parseOklchSyntax(value) {
  const match = value.match(OKLCH_COLOR);
  if (!match) return null;
  const unit = (match[5] || 'deg').toLowerCase();
  const hue = Number(match[4]);
  return {
    lightness: Number(match[1]),
    percent: match[2] === '%',
    chroma: Number(match[3]),
    hueDegrees: unit === 'rad' ? (hue * 180) / Math.PI : unit === 'turn' ? hue * 360 : hue,
  };
}

/** `#rgb` or `#rrggbb` as linear-light sRGB channels. */
function parseHexLinearRgb(value) {
  const match = value.match(HEX_COLOR);
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].split('').map(ch => ch + ch).join('') : match[1];
  return [0, 2, 4].map(offset => srgbChannelToLinear(parseInt(hex.slice(offset, offset + 2), 16) / 255));
}

/**
 * Converts an OKLCH or Hex CSS color string into WCAG 2.1 relative luminance (0..1).
 * Returns null for any other syntax; callers report that as unverified, never as a pass.
 */
export function colorLuminance(rawValue) {
  const value = String(rawValue ?? '').trim();
  const oklch = parseOklchSyntax(value);
  if (oklch) {
    const L = oklch.percent ? oklch.lightness / 100 : oklch.lightness;
    const C = oklch.chroma;
    const hRad = (oklch.hueDegrees * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    // OKLab to non-linear LMS
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ ** 3;
    const m = m_ ** 3;
    const s = s_ ** 3;

    // Linear LMS to linear sRGB
    const rLin = Math.min(1, Math.max(0, +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s));
    const gLin = Math.min(1, Math.max(0, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s));
    const bLin = Math.min(1, Math.max(0, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s));

    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  }

  const rgb = parseHexLinearRgb(value);
  if (rgb) {
    const [r, g, b] = rgb;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  return null;
}

// Atmospheric grounds (stripes, gradients, washes) are not single tokens, so the fixed matrix
// cannot see them. A site declares the text that sits on each stop in global.css:
//   /* @contrast-pair --color-on-supporter on #6a9762 min 4.5 */
//   /* @contrast-pair --color-on-turf on --color-turf-stripe */
// The background may be a token or a literal colour (a stop of the ground); min defaults to 4.5.
export function declaredContrastPairs(css, scope) {
  const pairs = [];
  for (const match of String(css).matchAll(/@contrast-pair\s+(--[\w-]+)\s+on\s+(--[\w-]+|#[0-9a-fA-F]{3,8}\b|oklch\([^)]*\)|rgb\([^)]*\))(?:\s+min\s+(\d+(?:\.\d+)?))?/g)) {
    const [, fg, bg, min] = match;
    const literal = !bg.startsWith('--');
    const bgKey = literal ? `--declared-ground-${pairs.length}` : bg;
    pairs.push({ id: `site:${fg.slice(8) || fg}-on-${literal ? bg.replace(/\s+/g, '') : bg.slice(8) || bg}`, fg, bg: bgKey, scope: literal ? { ...scope, [bgKey]: bg } : scope, min: min ? Number(min) : 4.5, declared: true });
  }
  return pairs;
}

export function contrastRatio(foreground, background) {
  const lumA = colorLuminance(foreground);
  const lumB = colorLuminance(background);
  if (lumA === null || lumB === null) return null;
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function resolveColorVar(value, scopeMap, fallbackMap = {}) {
  let current = String(value ?? '').trim();
  for (let depth = 0; depth < 4; depth++) {
    const varMatch = current.match(/^var\(\s*(--[\w-]+)(?:\s*,\s*(.+))?\s*\)$/);
    if (!varMatch) break;
    const [, name, fallback] = varMatch;
    if (scopeMap[name]) {
      current = scopeMap[name].trim();
    } else if (fallbackMap[name]) {
      current = fallbackMap[name].trim();
    } else if (fallback) {
      current = fallback.trim();
    } else {
      break;
    }
  }
  return current;
}

// Deliberately bounded affine grammar, not a general CSS evaluator. No eval or var resolution.
const UNSIGNED_CSS_NUMBER = '(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:e[+-]?\\d+)?';
const CSS_NUMBER = `[+-]?${UNSIGNED_CSS_NUMBER}`;
const FLUID_CLAMP = new RegExp(`^clamp\\(\\s*(${CSS_NUMBER})rem\\s*,\\s*([^,]+)\\s*,\\s*(${CSS_NUMBER})rem\\s*\\)$`, 'i');
const FLUID_AFFINE = new RegExp(`^(${CSS_NUMBER})rem\\s+([+-])\\s+(${UNSIGNED_CSS_NUMBER})(vi|vw)$`, 'i');
const FLUID_VIEWPORT = new RegExp(`^(${CSS_NUMBER})(vi|vw)$`, 'i');

export function parseFluidClamp(value) {
  const match = String(value ?? '').trim().match(FLUID_CLAMP);
  if (!match) throw new Error('expected clamp(<min>rem, <affine viewport term>, <max>rem)');
  const minRem = Number(match[1]);
  const maxRem = Number(match[3]);
  let preferred = match[2].trim();
  if (/^calc\(/i.test(preferred) && preferred.endsWith(')')) preferred = preferred.slice(5, -1).trim();
  const affine = preferred.match(FLUID_AFFINE);
  const viewport = preferred.match(FLUID_VIEWPORT);
  if (!affine && !viewport) throw new Error('expected rem + vi (legacy vw supported); cqi requires a separate documented container contract');
  const interceptRem = affine ? Number(affine[1]) : 0;
  const viewportCoefficient = affine ? Number(affine[3]) * (affine[2] === '-' ? -1 : 1) : Number(viewport[1]);
  const unit = (affine ? affine[4] : viewport[2]).toLowerCase();
  if (![minRem, maxRem, interceptRem, viewportCoefficient].every(Number.isFinite)) throw new Error('all clamp coefficients must be finite');
  if (!(minRem > 0 && maxRem >= minRem)) throw new Error('clamp bounds must satisfy 0 < min <= max');
  if (viewportCoefficient < 0 || (maxRem > minRem && viewportCoefficient === 0)) throw new Error('ascending scales require a positive viewport coefficient (zero allowed for equal bounds)');
  const transitionRem = maxRem === minRem ? null : {
    min: (minRem - interceptRem) / viewportCoefficient * 100,
    max: (maxRem - interceptRem) / viewportCoefficient * 100,
  };
  if (transitionRem && (!Object.values(transitionRem).every(Number.isFinite) || transitionRem.max <= transitionRem.min)) throw new Error('interpolation domain must be finite and nonzero');
  return { minRem, maxRem, interceptRem, viewportCoefficient, unit, transitionRem };
}

/** Axis size is the viewport inline size for vi, physical width for legacy vw. */
export function evaluateFluidClamp(value, { viewportSizePx, rootFontPx = 16 } = {}) {
  if (!Number.isFinite(viewportSizePx) || viewportSizePx < 0 || !Number.isFinite(rootFontPx) || rootFontPx <= 0) throw new Error('Expected finite viewport size >= 0 and root font size > 0');
  const { minRem, maxRem, interceptRem, viewportCoefficient } = parseFluidClamp(value);
  const preferred = interceptRem * rootFontPx + viewportCoefficient * (viewportSizePx / 100);
  const result = Math.max(minRem * rootFontPx, Math.min(preferred, maxRem * rootFontPx));
  if (!Number.isFinite(preferred) || !Number.isFinite(maxRem * rootFontPx) || !Number.isFinite(result)) throw new Error('Fluid evaluation overflow');
  return result;
}

export function validateClampToken(name, value) {
  try {
    parseFluidClamp(value);
    return null;
  } catch (error) {
    return `Token ${name}: ${error.message}; got: ${value}`;
  }
}

export function diagnoseFluidToken(name, value) {
  const parsed = parseFluidClamp(value);
  const baselinePx = evaluateFluidClamp(value, { viewportSizePx: 1280 });
  const zoom = [2, 4].map(factor => ({
    factor,
    cssViewportPx: 1280 / factor,
    effectiveSizeRatio: evaluateFluidClamp(value, { viewportSizePx: 1280 / factor }) / baselinePx * factor,
  }));
  return {
    name, ...parsed,
    samples: [10, 20, 50, 80, 100].map(viewportRem => ({ viewportRem, sizeRem: evaluateFluidClamp(value, { viewportSizePx: viewportRem * 16 }) / 16 })),
    rootFontSamples: [16, 20, 32].map(rootFontPx => ({ rootFontPx, sizePx: evaluateFluidClamp(value, { viewportSizePx: 1280, rootFontPx }) })),
    zoom,
    advisories: [
      ...(parsed.unit === 'vw' ? ['Legacy vw uses physical width; prefer vi for global tokens.'] : []),
      ...(name.startsWith('--text-') && zoom.some(sample => sample.effectiveSizeRatio < sample.factor - 0.001)
        ? ['Viewport shrink offsets text enlargement in the reference model; inspect rendered zoom and text-only resizing. This is not a WCAG verdict.'] : []),
    ],
  };
}

export const SPACING_CONTEXTS = {
  '--layout-section-padding': 'Section outer block padding',
  '--layout-container-gap': 'Section stack children',
  '--layout-content-gap': 'Container stack children',
  '--layout-grid-gap': 'Grid and managed grid tracks',
};

// Bounded reference model: no eval, browser execution or arbitrary CSS grammar.
export function resolveSpacing(name, values, environment = {}, trail = [], budget = { steps:0 }) {
  if (++budget.steps > 512) throw new Error('Spacing dependency expansion budget exceeded: ' + [...trail,name].join(' -> '));
  if (trail.length >= 32 || trail.includes(name)) throw new Error('Spacing dependency cycle/depth: ' + [...trail,name].join(' -> '));
  if (!(name in values)) throw new Error('Missing spacing reference: ' + [...trail,name].join(' -> '));
  const path = [...trail,name];
  const dependencies = new Set(path);
  const expanded = expand(values[name]);
  const px = length(expanded);
  if (!Number.isFinite(px) || px < 0) throw new Error('Expected nonnegative finite spacing: ' + path.join(' -> ') + ' received ' + expanded);
  return { value:values[name], expanded, px, dependencies:[...dependencies] };

  function expand(input) {
    let text = String(input).trim();
    if (text.length > 8192) throw new Error('Spacing expression too long: ' + path.join(' -> '));
    for (let count=0; text.includes('var('); count++) {
      if (count > 64) throw new Error('Spacing expansion limit: ' + path.join(' -> '));
      const start=text.indexOf('var('); let depth=1, end=start+4;
      for (; end<text.length && depth; end++) { if(text[end]==='(')depth++; if(text[end]===')')depth--; }
      if(depth)throw new Error('Unverified spacing syntax: ' + input);
      const args=text.slice(start+4,end-1), comma=args.indexOf(',');
      const ref=(comma<0?args:args.slice(0,comma)).trim();
      let replacement;
      if (ref in values) {
        const resolved=resolveSpacing(ref,values,environment,path,budget);
        resolved.dependencies.forEach(key=>dependencies.add(key)); replacement=resolved.expanded;
      }
      else if(comma>=0)replacement=expand(args.slice(comma+1));
      else throw new Error('Missing spacing reference: ' + [...path,ref].join(' -> '));
      text=text.slice(0,start)+replacement+text.slice(end);
    }
    return text;
  }
  function length(text, depth=0) {
    if(depth>32)throw new Error('Spacing arithmetic depth exceeded');
    text=text.trim();
    if(/^0(?:\.0+)?$/.test(text))return 0;
    const unit=text.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(px|rem|vi|vw)$/);
    if(unit)return Number(unit[1]) * ({px:1,rem:environment.rootFontPx || 16,vi:(environment.viewportSizePx || 1280)/100,vw:(environment.viewportSizePx || 1280)/100})[unit[2]];
    if(text.startsWith('clamp('))return evaluateFluidClamp(text,{viewportSizePx:environment.viewportSizePx || 1280,rootFontPx:environment.rootFontPx || 16});
    if(text.startsWith('calc(') && text.endsWith(')')) {
      const inner=text.slice(5,-1);let level=0;
      for(let i=0;i<inner.length;i++) {
        if(inner[i]==='(')level++;if(inner[i]===')')level--;
        if(level===0 && inner[i]==='*') {
          const left=inner.slice(0,i).trim(), right=inner.slice(i+1).trim();
          if(/^[+-]?(?:\d*\.)?\d+$/.test(right))return length(left,depth+1)*Number(right);
          if(/^[+-]?(?:\d*\.)?\d+$/.test(left))return Number(left)*length(right,depth+1);
        }
        if(level===0 && /[+-]/.test(inner[i]) && /\s/.test(inner[i-1] || '') && /\s/.test(inner[i+1] || ''))return length(inner.slice(0,i),depth+1)+(inner[i]==='+'?1:-1)*length(inner.slice(i+1),depth+1);
      }
    }
    throw new Error('Unverified spacing syntax at ' + path.join(' -> ') + ': ' + text);
  }
}

export function spacingReport(tokens) {
  const values={...tokens.theme,...tokens.root};
  return Object.entries(SPACING_CONTEXTS).map(([name,consumer])=>{
    try {
      const samples=[320,390,1280,1440].flatMap(viewportSizePx=>[16,20,32].map(rootFontPx=>({viewportSizePx,rootFontPx,...resolveSpacing(name,values,{viewportSizePx,rootFontPx})})));
      return {name,consumer,status:'pass',samples};
    } catch(error) { return {name,consumer,status:error.message.startsWith('Unverified')?'unverified':'fail',error:error.message}; }
  });
}

/**
 * Audits one stylesheet string against the token contract. `cssPath` only labels
 * messages, so a report about another file (`--css <file>`) names that file.
 */
export function auditDesignTokens(css, { cssPath = 'src/styles/global.css' } = {}) {
  const tokens = parseDesignTokens(css);
  const errors = [];
  const spacing = spacingReport(tokens);
  for (const context of spacing) if(context.status !== 'pass') errors.push(`${context.name}: ${context.error}`);

  const contract = contractGap(css);
  for (const { scope, token } of contract.missing) {
    errors.push(`Missing required ${SCOPE_SELECTORS[scope] ?? '@theme'} token in ${cssPath}: ${token}`);
  }

  const fluidTokens = Object.keys(tokens.theme).filter(
    key => key.startsWith('--text-step-') || key.startsWith('--spacing-'),
  );
  const fluid = {
    reference: { rootFontPx: 16, viewportSizePx: 1280, writingMode: 'horizontal-tb', zoomModel: 'fixed physical viewport; CSS viewport divided by zoom; root font unchanged' },
    tokens: [],
  };
  for (const key of fluidTokens) {
    const clampError = validateClampToken(key, tokens.theme[key]);
    if (clampError) errors.push(clampError);
    else {
      try {
        fluid.tokens.push(diagnoseFluidToken(key, tokens.theme[key]));
      } catch (error) {
        errors.push(`Token ${key}: ${error.message}`);
      }
    }
  }

  const allDefaults = { '--color-link': 'var(--color-action)', ...tokens.theme, ...tokens.root };
  const allDark = { ...allDefaults, ...tokens.dark };
  // A restored light surface must reset values inherited from its dark ancestor.
  const allLight = { ...allDark, ...tokens.light };

  const pairs = [
    { id: 'default:text-on-page', fg: '--color-text', bg: '--color-page', scope: allDefaults, min: 4.5 },
    { id: 'default:text-on-surface', fg: '--color-text', bg: '--color-surface', scope: allDefaults, min: 4.5 },
    { id: 'default:muted-on-page', fg: '--color-muted', bg: '--color-page', scope: allDefaults, min: 4.5 },
    { id: 'default:muted-on-surface', fg: '--color-muted', bg: '--color-surface', scope: allDefaults, min: 4.5 },
    { id: 'default:on-action-on-action', fg: '--color-on-action', bg: '--color-action', scope: allDefaults, min: 4.5 },
    { id: 'default:action-on-page', fg: '--color-action', bg: '--color-page', scope: allDefaults, min: 3.0 },
    { id: 'default:link-on-page', fg: '--color-link', bg: '--color-page', scope: allDefaults, min: 4.5 },
    { id: 'default:link-on-surface', fg: '--color-link', bg: '--color-surface', scope: allDefaults, min: 4.5 },
    { id: 'dark:link-on-surface', fg: '--color-link', bg: '--color-surface', scope: allDark, min: 4.5 },
    { id: 'light:link-on-surface', fg: '--color-link', bg: '--color-surface', scope: allLight, min: 4.5 },
    { id: 'default:focus-on-page', fg: '--color-focus', bg: '--color-page', scope: allDefaults, min: 3.0 },
    { id: 'dark:text-on-surface', fg: '--color-text', bg: '--color-surface', scope: allDark, min: 4.5 },
    { id: 'dark:muted-on-surface', fg: '--color-muted', bg: '--color-surface', scope: allDark, min: 4.5 },
    { id: 'dark:focus-on-surface', fg: '--color-focus', bg: '--color-surface', scope: allDark, min: 3.0 },
    ...declaredContrastPairs(css, allDefaults),
  ];

  const contrast = [];
  for (const pair of pairs) {
    const fgValue = resolveColorVar(pair.scope[pair.fg], pair.scope, allDefaults);
    const bgValue = resolveColorVar(pair.scope[pair.bg], pair.scope, allDefaults);
    const ratio = contrastRatio(fgValue, bgValue);
    const status = ratio === null ? 'unverified' : ratio >= pair.min ? 'pass' : 'fail';
    contrast.push({
      id: pair.id,
      foreground: pair.fg,
      background: pair.bg,
      foregroundValue: fgValue,
      backgroundValue: bgValue,
      ratio,
      minimum: pair.min,
      status,
    });
    if (status === 'fail') {
      errors.push(`Contrast failure (${pair.id}): ${pair.fg} (${fgValue}) on ${pair.bg} (${bgValue}) is ${ratio}:1 (minimum ${pair.min}:1).`);
    } else if (status === 'unverified') {
      // A token that is simply absent is a contract gap, not a syntax problem (found in a real-site rehearsal).
      const absent = [[pair.fg, fgValue], [pair.bg, bgValue]].filter(([, value]) => !String(value ?? '').trim()).map(([name]) => name);
      errors.push(absent.length
        ? `Could not compute contrast (${pair.id}): missing token ${absent.join(' and ')}.`
        : `Could not compute contrast (${pair.id}): unsupported color syntax for ${pair.fg} (${fgValue}) or ${pair.bg} (${bgValue}).`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    tokens,
    contrast,
    fluid,
    spacing,
    contract,
    diagnostics: tokenDiagnostics({ errors, fluid }),
  };
}

export const TYPE_SCALE_RATIOS = {
  'minor-second': 1.067,
  'major-second': 1.125,
  'minor-third': 1.2,
  'major-third': 1.25,
  'perfect-fourth': 1.333,
  'augmented-fourth': 1.414,
  'perfect-fifth': 1.5,
};

function round4(n) {
  return Number(Number(n).toFixed(4));
}

/**
 * Builds a fluid `clamp(minRem, calc(interceptRem + slopeVi), maxRem)` across minVwRem..maxVwRem.
 */
export function buildFluidClamp(minRem, maxRem, minVwRem = 20, maxVwRem = 80) {
  if (![minRem, maxRem, minVwRem, maxVwRem].every(Number.isFinite)) throw new Error('Fluid clamp inputs must be finite numbers');
  if (!(minVwRem >= 0 && maxVwRem > minVwRem && Number.isFinite(maxVwRem - minVwRem))) throw new Error('Fluid viewport domain must satisfy 0 <= min < max with finite width');
  const min = round4(minRem);
  const max = round4(maxRem);
  if (!(min > 0 && max >= min)) {
    throw new Error(`Fluid clamp bounds must satisfy 0 < min <= max (got ${min}..${max})`);
  }
  const slope = (max - min) / (maxVwRem - minVwRem);
  const intercept = round4(min - minVwRem * slope);
  const slopeVi = round4(slope * 100);
  if (![intercept, slopeVi].every(Number.isFinite) || (max > min && slopeVi <= 0)) throw new Error('Fluid coefficients cannot be represented at four decimal places');
  return `clamp(${min}rem, calc(${intercept}rem + ${slopeVi}vi), ${max}rem)`;
}

/**
 * Generates harmonious fluid `--text-step-*` tokens from a ratio name or number.
 */
export function generateTypeScale({ ratio = 1.25, baseMinRem = 1, baseMaxRem = 1.375 } = {}) {
  const r = typeof ratio === 'string' && TYPE_SCALE_RATIOS[ratio]
    ? TYPE_SCALE_RATIOS[ratio]
    : Number(ratio);
  if (!Number.isFinite(r) || r < 1.05 || r > 1.8) {
    throw new Error(`Invalid type scale ratio '${String(ratio)}'. Expected 1.05..1.8 or one of: ${Object.keys(TYPE_SCALE_RATIOS).join(', ')}`);
  }
  const minR = 1 + (r - 1) * 0.65;
  return {
    '--text-step--1': buildFluidClamp(Math.max(0.8125, baseMinRem / minR), Math.max(0.9375, baseMaxRem / r)),
    '--text-step-0': buildFluidClamp(baseMinRem, baseMaxRem),
    '--text-step-1': buildFluidClamp(baseMinRem * minR, baseMaxRem * r),
    '--text-step-2': buildFluidClamp(baseMinRem * (minR ** 2), baseMaxRem * (r ** 2)),
    '--text-step-2-to-0': buildFluidClamp(baseMinRem, baseMaxRem * (r ** 2)),
    '--text-step-3-to-1': buildFluidClamp(baseMinRem * minR, baseMaxRem * (r ** 3)),
  };
}

/**
 * Generates harmonious fluid `--spacing-*` tokens from a spatial ratio.
 */
export function generateSpaceScale({ ratio = 1.5, baseMinRem = 1, baseMaxRem = 1.5 } = {}) {
  const r = Number(ratio);
  if (!Number.isFinite(r) || r < 1.15 || r > 2.2) {
    throw new Error(`Invalid space scale ratio '${String(ratio)}'. Expected a number between 1.15 and 2.2.`);
  }
  return {
    '--spacing-content': buildFluidClamp(baseMinRem, baseMaxRem),
    '--spacing-container': buildFluidClamp(baseMinRem, baseMaxRem * Math.max(1.15, r * 0.88)),
    '--spacing-grid': buildFluidClamp(baseMinRem * 1.25, baseMaxRem * r),
    '--spacing-xl-to-sm': buildFluidClamp(baseMinRem * 0.75, baseMaxRem * (r ** 1.75)),
    '--spacing-2xl-to-md': buildFluidClamp(baseMinRem * 1.25, baseMaxRem * (r ** 2.4)),
    '--spacing-section': buildFluidClamp(baseMinRem * 2.5, baseMaxRem * (r ** 3.1)),
  };
}

/**
 * Parses an `oklch(...)` or `#hex` color string into `{ L, C, H }` where L is 0..100.
 */
export function parseToOklch(rawValue) {
  const value = String(rawValue ?? '').trim();
  const oklch = parseOklchSyntax(value);
  if (oklch) {
    const L = oklch.percent ? oklch.lightness : oklch.lightness * 100;
    const H = oklch.hueDegrees;
    return { L: round4(L), C: round4(oklch.chroma), H: round4(((H % 360) + 360) % 360) };
  }

  const rgb = parseHexLinearRgb(value);
  if (rgb) {
    const [r, g, b] = rgb;

    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

    const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    const okA = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    const okB = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

    const C = Math.sqrt(okA * okA + okB * okB);
    const H = ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360;
    return { L: round4(L * 100), C: round4(C), H: round4(H) };
  }

  throw new Error(`Unsupported color format '${value}'. Expected #hex or oklch(L% C H).`);
}

function formatOklch(L, C, H) {
  return `oklch(${round4(L)}% ${round4(C)} ${round4(H)})`;
}

/**
 * Synthesizes a complete WCAG AA-compliant OKLCH palette (default + dark surface) from brand seed color(s).
 */
export function generateSeededPalette({ accent, canvas = 'oklch(98.8% 0.005 250)' } = {}) {
  if (!accent) throw new Error('generateSeededPalette requires an accent color (#hex or oklch).');
  const acc = parseToOklch(accent);
  const can = canvas ? parseToOklch(canvas) : { L: 98.8, C: Math.min(0.008, acc.C * 0.06), H: acc.H };

  const pageColor = formatOklch(Math.max(96.5, Math.min(99.5, can.L)), Math.min(0.015, can.C), can.H);
  const surfaceColor = formatOklch(Math.min(100, Math.max(99, can.L + 0.8)), Math.min(0.006, can.C * 0.5), can.H);
  const onActionColor = formatOklch(99.5, 0.003, can.H);

  // Clamp action lightness so on-action (white) has >= 4.5:1 contrast and action on page has >= 3.0:1
  let actionL = Math.min(46, Math.max(34, acc.L));
  const actionC = Math.max(0.08, Math.min(0.22, acc.C || 0.14));
  let actionColor = formatOklch(actionL, actionC, acc.H);
  while (actionL > 24 && (contrastRatio(onActionColor, actionColor) ?? 0) < 4.6) {
    actionL -= 1;
    actionColor = formatOklch(actionL, actionC, acc.H);
  }

  let focusL = Math.min(54, Math.max(actionL + 4, 46));
  let focusColor = formatOklch(focusL, Math.min(0.22, actionC + 0.02), acc.H);
  while (focusL > 28 && (contrastRatio(focusColor, pageColor) ?? 0) < 3.1) {
    focusL -= 1;
    focusColor = formatOklch(focusL, Math.min(0.22, actionC + 0.02), acc.H);
  }

  const neutralH = can.C > 0.004 ? can.H : acc.H;
  const textColor = formatOklch(19, Math.min(0.024, actionC * 0.14), neutralH);
  const mutedColor = formatOklch(43, Math.min(0.024, actionC * 0.14), neutralH);
  const borderColor = formatOklch(86, Math.min(0.016, actionC * 0.1), neutralH);
  const focusOnDark = formatOklch(79, Math.min(0.15, actionC * 0.85), acc.H);

  const darkSurface = formatOklch(16.5, Math.min(0.024, actionC * 0.15), neutralH);
  const darkText = formatOklch(97, 0.006, can.H);
  const darkMuted = formatOklch(76, Math.min(0.016, actionC * 0.1), neutralH);
  const darkBorder = formatOklch(30, Math.min(0.024, actionC * 0.15), neutralH);

  return {
    theme: {
      '--color-page': pageColor,
      '--color-surface': surfaceColor,
      '--color-text': textColor,
      '--color-muted': mutedColor,
      '--color-border': borderColor,
      '--color-action': actionColor,
      '--color-on-action': onActionColor,
      '--color-focus': focusColor,
      '--color-focus-on-dark': focusOnDark,
    },
    dark: {
      '--color-surface': `var(--surface-dark-bg, ${darkSurface})`,
      '--color-text': `var(--surface-dark-text, ${darkText})`,
      '--color-muted': `var(--surface-dark-muted, ${darkMuted})`,
      '--color-border': `var(--surface-dark-border, ${darkBorder})`,
      '--color-focus': 'var(--color-focus-on-dark)',
    },
  };
}

/**
 * Computes the LF-normalised SHA-256 hex digest of a stylesheet string.
 */
export function stylesheetDigest(css) {
  return createHash('sha256')
    .update(String(css ?? '').replace(/\r\n/g, '\n'), 'utf8')
    .digest('hex');
}

/**
 * Formats a deterministic Stage 4.5 `## Token Calibration` Markdown section from a `global.css` string.
 */
export function formatCalibrationMarkdown(css, cssPath = 'src/styles/global.css') {
  const audit = auditDesignTokens(css);
  const digest = stylesheetDigest(css);
  const lines = [
    '## Token Calibration',
    '',
    `- **Source stylesheet:** \`${cssPath}\``,
    `- **LF SHA-256:** \`${digest}\``,
    `- **Validation status:** \`${audit.valid ? 'PASS' : 'FAIL'}\` (${audit.contrast.length} WCAG contrast pairs, ${Object.keys(audit.tokens.theme).length} \`@theme\` tokens, ${Object.keys(audit.tokens.root).length} \`:root\` tokens)`,
    '',
    '### WCAG Relative Luminance Contrast Matrix',
    '',
    '| Pair | Foreground | Background | Ratio | Minimum | Status |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  for (const item of audit.contrast) {
    lines.push(
      `| \`${item.id}\` | \`${item.foreground}\` (\`${item.foregroundValue}\`) | \`${item.background}\` (\`${item.backgroundValue}\`) | **${item.ratio}:1** | ${item.minimum}:1 | ${item.status.toUpperCase()} |`,
    );
  }

  lines.push(
    '',
    '### Fluid Typography & Spatial Scale',
    '',
    '| Token | Authored Value |',
    '| --- | --- |',
  );

  for (const [key, val] of Object.entries(audit.tokens.theme)) {
    if (key.startsWith('--text-step-') || key.startsWith('--spacing-')) {
      lines.push(`| \`${key}\` | \`${val}\` |`);
    }
  }

  return lines.join('\n');
}

/**
 * Replaces the generated `## <heading>` section of an LF-normalised Markdown document.
 * The section runs to the next `## ` heading or the end of the document. Repeated
 * copies left by earlier writes are removed. Returns null when the heading is absent,
 * so each caller decides where a new section belongs.
 */
function replaceMarkdownSection(markdown, heading, section) {
  // JavaScript has no \Z end anchor; `(?![\s\S])` matches the end of the document.
  const pattern = new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[ \\t]*(?:\\n|$)[\\s\\S]*?(?=^## |(?![\\s\\S]))`, 'gm');
  let found = false;
  const updated = markdown.replace(pattern, () => {
    if (found) return '';
    found = true;
    return `${section}\n\n`;
  }).replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n');
  return found ? updated : null;
}

/**
 * Writes or updates the `## Token Calibration` section inside `audit/component-calibration.md`.
 */
export function upsertCalibrationRecord(targetPath, css, cssPath = 'src/styles/global.css') {
  const section = formatCalibrationMarkdown(css, cssPath);
  const resolved = resolve(targetPath);
  mkdirSync(dirname(resolved), { recursive: true });

  if (existsSync(resolved)) {
    const existing = readFileSync(resolved, 'utf8').replace(/\r\n/g, '\n');
    const updated = replaceMarkdownSection(existing, 'Token Calibration', section);
    writeFileSync(resolved, updated ?? `${existing.trimEnd()}\n\n${section}\n`, 'utf8');
    return resolved;
  }

  const template = [
    '# Stage 4.5 Component & Token Calibration',
    '',
    'Record `/_styleguide` verification across mobile (`390px`), tablet (`768px`), and desktop (`1440px`) before assembling full site routes.',
    '',
    section,
    '',
    '## Component Specimens To Verify',
    '',
    '- **Typography & Measure:** Check fluid steps, 4-voice roles (`--font-display` and `--font-body` required; `--font-accent` `.font-accent` and `--font-mono` `.eyebrow-telemetry` / `.tabular-nums` where the content earns them), and `--measure-reading` line lengths on `/_styleguide#typography`.',
    '- **Surfaces & Controls:** Check 3-tier surfaces (`--color-page`, `--color-surface`, `--color-elevated` / `.surface-elevated`), tactile `.btn` / `.btn--secondary` / `.btn--ghost` hierarchy, disabled/invalid, and `:focus-visible` states on `/_styleguide#palette` and `/_styleguide#controls`.',
    '- **Layout, Bento & Cards:** Check `Section`, `Container` (`reading`, `content`, `wide`, `breakout`), `Grid`, `.bento-grid`, and `Card` (`stacked`, `horizontal`, optional `transitionName`) on `/_styleguide#layout`.',
    '- **Media & Editorial Flow:** Check native `ResponsiveImage` (`loading="eager" fetchpriority="high"` on above-the-fold Hero media), `PartnersPanel`, `LogoTicker`, and `.flow` Markdown on the common specimens. For EmDash, also check `EditorialImage`, `PhotoGallery` and Portable Text in the platform extension.',
    '- **Page Assembly & Self-Critique:** Read `.agents/skills/astro-site-design/references/astro-primitives.md` and `references/landing-page-archetypes.md` when assembling routes, then apply the 5-Point Visual Self-Critique Rubric (geometry alternation, purposeful surface depth, earned typography roles with no kicker labels or decorative indices, action weight separation, and 375px/768px/1440px reflow) and its generic-fingerprint check.',
    '- **Evidence:** Record captures and observed results before marking component specimens verified. Token calculations alone do not verify rendered components.',
    '',
  ].join('\n');

  writeFileSync(resolved, template, 'utf8');
  return resolved;
}

/**
 * Formats a structurally valid `## Art Direction Record` Markdown section for `AGENTS.md`.
 */
export function formatArtDirectionRecord(laneId = 'neutral', custom = {}) {
  const lane = laneOf(laneId) ?? AESTHETIC_LANES.neutral;
  const rec = { ...lane.record, ...custom };
  return [
    '## Art Direction Record',
    '',
    `- **Aesthetic Lane:** ${rec.lane}`,
    `- **Narrative Metaphor:** ${rec.metaphor}`,
    `- **Typography Pairing:** ${rec.typography}`,
    '- **Token Physics:**',
    `  - Canvas: ${rec.canvas}`,
    `  - Action/Accent: ${rec.action}`,
    `  - Borders: ${rec.borders}`,
    `  - Spatial Density: ${rec.density}`,
    `- **Site Anti-Patterns:** ${rec.antiPatterns}`,
  ].join('\n');
}

/**
 * Writes or updates the `## Art Direction Record` section inside `AGENTS.md` (or a specified Markdown file).
 */
export function upsertArtDirectionRecord(agentsPath = 'AGENTS.md', laneId = 'neutral', custom = {}) {
  const section = formatArtDirectionRecord(laneId, custom);
  const resolved = resolve(agentsPath);
  const existing = existsSync(resolved) ? readFileSync(resolved, 'utf8').replace(/\r\n/g, '\n') : '# Site Instructions\n';
  const updated = replaceMarkdownSection(existing, 'Art Direction Record', section);
  if (updated !== null) {
    writeFileSync(resolved, updated, 'utf8');
    return resolved;
  }
  // A new record goes before the implementation rules when that section exists.
  const implMatch = /^## Implementation rules\b/m.exec(existing);
  writeFileSync(resolved, implMatch
    ? `${existing.slice(0, implMatch.index)}${section}\n\n${existing.slice(implMatch.index)}`
    : `${existing.trimEnd()}\n\n${section}\n`, 'utf8');
  return resolved;
}

const SYSTEM_AND_GENERIC_FONTS = new Set([
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'emoji',
  'math',
  'fangsong',
  'segoe ui',
  'roboto',
  'helvetica neue',
  'helvetica',
  'arial',
  'noto sans',
  'apple color emoji',
  'segoe ui emoji',
  'segoe ui symbol',
  'noto color emoji',
  'georgia',
  'cambria',
  'times new roman',
  'times',
  'courier new',
  'courier',
  'consolas',
  'liberation mono',
  'menlo',
  'monaco',
]);

function walkFiles(dir, extFilter) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkFiles(full, extFilter));
    } else if (!extFilter || full.endsWith(extFilter)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Combines four-role family source hints with bounded local font-file preflight.
 * Package/config mentions remain hints; this does not prove actual glyph rendering.
 */
export function auditFontLoading(css, rootDir = '.', cssPath = 'src/styles/global.css') {
  const preflight = auditFontPreflight(css, { rootDir, cssPath });
  const sourceErrors = preflight.errors.map(issue => typeof issue === 'string' ? issue : issue.message);
  const tokens = parseDesignTokens(css);
  const stacks = [
    tokens.theme['--font-body'],
    tokens.theme['--font-display'],
    tokens.theme['--font-mono'],
    tokens.theme['--font-accent'],
  ].filter(Boolean);
  const customFamilies = new Set();

  // Only the first family of a stack is the intended face; later names are fallbacks
  // (for example SFMono-Regular after ui-monospace) and need no loading.
  for (const stack of stacks) {
    const first = stack.split(',').map(part => part.trim().replace(/^['"]|['"]$/g, '').trim()).find(name => name && !name.startsWith('var('));
    if (first && !SYSTEM_AND_GENERIC_FONTS.has(first.toLowerCase())) customFamilies.add(first);
  }

  if (customFamilies.size === 0) {
    return { valid: preflight.valid, checkedFamilies: [], missingFamilies: [], warnings: sourceErrors, preflight };
  }

  const root = resolve(rootDir);
  const searchblobs = [];
  for (const rel of ['package.json', 'astro.config.mjs', 'astro.config.ts']) {
    const p = join(root, rel);
    if (existsSync(p)) searchblobs.push(readFileSync(p, 'utf8'));
  }
  for (const f of walkFiles(join(root, 'src/layouts'), '.astro')) {
    searchblobs.push(readFileSync(f, 'utf8'));
  }
  const cssWithoutFontVars = String(css ?? '')
    .replace(/--font-(?:body|display|mono|accent)\s*:[^;]+;/g, '');
  searchblobs.push(cssWithoutFontVars);
  for (const f of walkFiles(join(root, 'src/styles'), '.css')) {
    if (resolve(f) !== resolve(join(root, 'src/styles/global.css'))) {
      searchblobs.push(readFileSync(f, 'utf8'));
    }
  }

  const haystack = searchblobs.join('\n').toLowerCase();
  const declaredFaces = new Set(preflight.faces.map(face => face.family).filter(Boolean));
  const missingFamilies = [];
  const warnings = [];

  for (const family of customFamilies) {
    const lower = family.toLowerCase();
    const slug = lower.replace(/\s+/g, '-');
    const plus = lower.replace(/\s+/g, '+');
    // Fontsource variable packages name the family "<Name> Variable" but the package <name>.
    const base = lower.replace(/\s+variable$/, '').replace(/\s+/g, '-');
    const fontsource = [`@fontsource-variable/${base}`, `@fontsource/${base}`];
    if (!declaredFaces.has(lower.replace(/\s+/g, ' ')) && !haystack.includes(lower) && !haystack.includes(slug) && !haystack.includes(plus) && !fontsource.some(name => haystack.includes(name))) {
      missingFamilies.push(family);
      warnings.push(
        `Custom font family "${family}" is declared in @theme but not loaded in package.json, astro.config.mjs, @font-face, or src/layouts/.`,
      );
    }
  }

  return {
    valid: missingFamilies.length === 0 && preflight.valid,
    checkedFamilies: [...customFamilies],
    missingFamilies,
    warnings: [...warnings, ...sourceErrors],
    preflight,
  };
}

const EDITABLE_ENTRY_FIELDS = ['title', 'featured_image', 'excerpt', 'subtitle', 'heading', 'summary'];

/**
 * Statically audits CMS routes under `src/pages/` that call `getEmDashEntry(...)` or `getEmDashCollection(...)`
 * to verify `<Base content={{...}}>` and field-level `.edit.` in-place editor bindings are present.
 */
export function auditEditProxies(rootDir = '.') {
  const profileFile = join(resolve(rootDir), 'baseline.config.json');
  if (existsSync(profileFile)) {
    const { foundation } = JSON.parse(readFileSync(profileFile, 'utf8'));
    if (!['static', 'emdash'].includes(foundation)) throw new Error('Unknown Baseline foundation');
    if (foundation === 'static') return { valid: true, applicability: 'not-applicable', checkedRoutes: [], collectionRoutes: [], issues: [] };
  }
  const pagesDir = join(resolve(rootDir), 'src/pages');
  const files = walkFiles(pagesDir, '.astro');
  const projectRoot = resolve(rootDir);
  function linkedComponentSources(fromFile, fromSource, depth, seen = new Set([resolve(fromFile)])) {
    if (depth <= 0) return [];
    const found = [];
    for (const match of fromSource.matchAll(/^\s*import\s+[^;'"]+?\s+from\s+['"](\.{1,2}\/[^'"]+\.astro)['"]/gm)) {
      const target = resolve(dirname(fromFile), match[1]);
      if (seen.has(target) || !target.startsWith(projectRoot) || !existsSync(target)) continue;
      seen.add(target);
      const text = readFileSync(target, 'utf8');
      found.push(text, ...linkedComponentSources(target, text, depth - 1, seen));
    }
    return found;
  }
  const checkedRoutes = [];
  const collectionRoutes = [];
  const issues = [];

  for (const file of files) {
    const normalized = file.replaceAll('\\', '/');
    if (normalized.endsWith('/_styleguide.astro') || normalized.endsWith('/404.astro')) continue;
    const source = readFileSync(file, 'utf8');
    const rel = normalized.slice(resolve(rootDir).replaceAll('\\', '/').length + 1);

    if (/\bgetEmDashCollection\s*\(/.test(source)) {
      collectionRoutes.push(rel);
    }

    if (!/\bgetEmDashEntry\s*\(/.test(source)) continue;
    checkedRoutes.push(rel);

    // Routes often hand the entry to a page component that renders <Base> and binds the edit
    // proxies. Follow relative .astro imports two levels deep before reporting them missing.
    const linked = linkedComponentSources(file, source, 2);
    const hasBaseContent = [source, ...linked].some(text => /<Base\b[\s\S]*?\bcontent=\{/.test(text));
    const hasEditProxy = [source, ...linked].some(text => /\.edit\.[a-zA-Z0-9_]+/.test(text));

    if (!hasBaseContent) {
      issues.push(`${rel}: calls getEmDashEntry() but does not pass content={{ collection, id }} to <Base>.`);
    }
    if (!hasEditProxy) {
      issues.push(`${rel}: calls getEmDashEntry() but does not bind any {...edit.field} proxy attributes.`);
    }

    const parts = source.split(/^---\s*$/m);
    const templateBody = parts.length >= 3 ? parts.slice(2).join('\n') : source;
    for (const field of EDITABLE_ENTRY_FIELDS) {
      const dataRegex = new RegExp(`\\.data\\.${field}\\b`);
      const editRegex = new RegExp(`\\.edit\\.${field}\\b`);
      if (dataRegex.test(templateBody) && !editRegex.test(templateBody)) {
        issues.push(`${rel}: renders .data.${field} in template markup without binding .edit.${field}.`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    checkedRoutes,
    collectionRoutes,
    issues,
  };
}

/**
 * Prunes starter-only sample page exceptions and retired `deleted: true` entries from
 * `audit/design-gate-exceptions.json`, retaining only active `/_styleguide` dev infrastructure exceptions.
 */
export function pruneStarterExceptions(exceptionsPath = 'audit/design-gate-exceptions.json') {
  const resolved = resolve(exceptionsPath);
  if (!existsSync(resolved)) return { path: resolved, before: 0, after: 0 };
  const raw = JSON.parse(readFileSync(resolved, 'utf8'));
  const kept = raw.filter(
    item => !item.deleted && /^src\/(?:pages\/_styleguide\.astro|components\/dev\/|dev\/|assets\/styleguide-)/.test(item.path),
  );
  writeFileSync(resolved, `${JSON.stringify(kept, null, 2)}\n`, 'utf8');
  return { path: resolved, before: raw.length, after: kept.length };
}

/**
 * Applies structured token overrides (`{ theme, root, dark }`) or a named Aesthetic Lane preset
 * directly to a `global.css` string while preserving comments and formatting.
 */
export function applyTokenOverrides(css, presetOrOverrides) {
  const preset = typeof presetOrOverrides === 'string'
    ? laneOf(presetOrOverrides)
    : presetOrOverrides;
  if (!preset) {
    throw new Error(`Unknown aesthetic lane preset: ${String(presetOrOverrides)}. Available lanes: ${Object.keys(AESTHETIC_LANES).join(', ')}`);
  }
  const { ast, scopes } = tokenScopes(css);
  for (const scope of Object.keys(preset)) {
    if (!['theme','root','dark','light','name','description','record'].includes(scope)) throw new Error('Unknown token scope: ' + scope);
  }
  for (const scope of ['theme','root','dark','light']) {
    for (const [name,value] of Object.entries(preset[scope] || {})) {
      const decl = scopes[scope][0]?.nodes?.find(n=>n.type==='decl' && n.prop===name);
      if (!decl) {
        const required = REQUIRED_BY_SCOPE[scope]?.includes(name);
        throw new Error('Unknown token in ' + scope + ': ' + name + '; expected an existing declaration in that scope.' + (required ? ' It is a required contract token: add --add-missing to insert it first.' : ''));
      }
      if (typeof value !== 'string' || !value.trim() || /[;{}]/.test(value)) throw new Error('Invalid token value for ' + scope + ':' + name);
      decl.value = value.trim();
    }
  }
  const result = ast.toString();
  tokenScopes(result);
  return result;
}

const CLI_USAGE = [
  'npm run design:tokens -- [options]',
  '  --css <file>                 Stylesheet to audit (default src/styles/global.css)',
  '  --json                       Machine-readable report',
  '  --list-lanes                 List the aesthetic lane presets',
  '  --lane <id>                  Apply a lane preset',
  '  --type-scale <ratio|name>    Generate the fluid type scale',
  '  --space-scale <ratio>        Generate the fluid space scale',
  '  --seed-accent <color>        Generate a palette from a #hex or oklch() accent',
  '  --seed-canvas <color>        Canvas colour for --seed-accent',
  '  --set <token>=<value>        Set one token; prefix --root: or --dark: for those scopes (repeatable)',
  '  --add-missing                Insert missing contract tokens with starter values',
  '  --write                      Save a validated candidate (changes are a preview without it)',
  '  --init-client                Apply the lane, save, write the record and calibration, prune starter exceptions',
  '  --write-record [file]        Write the Art Direction Record (default AGENTS.md)',
  '  --write-calibration [file]   Write the token calibration (default audit/component-calibration.md)',
].join('\n');
const CLI_BOOLEAN_FLAGS = { '--json': 'json', '--list-lanes': 'listLanes', '--add-missing': 'addMissing', '--write': 'write', '--init-client': 'initClient', '--help': 'help' };
const CLI_VALUE_FLAGS = { '--css': 'css', '--lane': 'lane', '--type-scale': 'typeScale', '--space-scale': 'spaceScale', '--seed-accent': 'seedAccent', '--seed-canvas': 'seedCanvas' };
// The file is optional: `true` selects the default target.
const CLI_OPTIONAL_VALUE_FLAGS = { '--write-record': 'writeRecord', '--write-calibration': 'writeCalibration' };

/**
 * Strict command-line grammar. An unknown or misspelled flag is an error: a
 * mistyped `--write` must not silently turn a save into a preview, and a flag
 * without its value must not fall back to a default.
 */
export function parseTokenCliArguments(args) {
  const options = { set: [] };
  const once = (flag, key) => { if (Object.hasOwn(options, key)) throw new Error(`Duplicate argument: ${flag}`); };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i], next = args[i + 1];
    if (flag === '--set') {
      // A --set value starts with `--` itself (`--color-page=...`), so it is never read as a flag.
      if (!next) throw new Error('Missing --set argument; expected <token>=<value>.');
      if (!next.includes('=')) throw new Error(`Invalid --set argument '${next}'. Expected <token>=<value>.`);
      options.set.push(next); i++;
    } else if (Object.hasOwn(CLI_BOOLEAN_FLAGS, flag)) {
      once(flag, CLI_BOOLEAN_FLAGS[flag]); options[CLI_BOOLEAN_FLAGS[flag]] = true;
    } else if (Object.hasOwn(CLI_VALUE_FLAGS, flag)) {
      once(flag, CLI_VALUE_FLAGS[flag]);
      if (!next || next.startsWith('--')) throw new Error(`Missing value for ${flag}.`);
      options[CLI_VALUE_FLAGS[flag]] = next; i++;
    } else if (Object.hasOwn(CLI_OPTIONAL_VALUE_FLAGS, flag)) {
      once(flag, CLI_OPTIONAL_VALUE_FLAGS[flag]);
      if (next && !next.startsWith('--')) { options[CLI_OPTIONAL_VALUE_FLAGS[flag]] = next; i++; }
      else options[CLI_OPTIONAL_VALUE_FLAGS[flag]] = true;
    } else throw new Error(`Unknown argument: ${flag}. Use --help to list the options.`);
  }
  return options;
}

function setOverridesOf(pairs) {
  if (!pairs.length) return null;
  const overrides = { theme: {}, root: {}, dark: {} };
  for (const pair of pairs) {
    const eq = pair.indexOf('=');
    const rawKey = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (rawKey.startsWith('--dark:')) overrides.dark[rawKey.slice('--dark:'.length)] = value;
    else if (rawKey.startsWith('--root:')) overrides.root[rawKey.slice('--root:'.length)] = value;
    else overrides.theme[rawKey] = value;
  }
  return overrides;
}

function mergeOverrides(target, source) {
  if (!source) return target;
  return {
    theme: { ...target.theme, ...source.theme },
    root: { ...target.root, ...source.root },
    dark: { ...target.dark, ...source.dark },
  };
}

export function formatTokenDiagnostics(report, cssPath, css) {
  const lines = css.split(/\r?\n/);
  const failed = report.contrast.filter(pair => pair.status !== 'pass');
  return [
    'Token audit: FAIL — Expected vs Received',
    ...failed.flatMap(pair => {
      const locations = lines.flatMap((line, index) => [pair.foreground, pair.background].some(token => line.trimStart().startsWith(token + ':')) ? [`${cssPath}:${index + 1}`] : []);
      return [
        `  Pair: ${pair.id} (${pair.foreground} on ${pair.background})`,
        `  Expected: >= ${pair.minimum}:1 WCAG AA ${pair.minimum === 4.5 ? 'text' : 'non-text'} contrast`,
        `  Received: ${pair.ratio === null ? 'unverified (unsupported/missing color)' : pair.ratio + ':1'} (${pair.foregroundValue} on ${pair.backgroundValue})`,
        `  Token declarations: ${locations.join(', ') || cssPath}`,
      ];
    }),
    ...report.errors.map(error => `  - ${error}`),
    ...(report.contract && !report.contract.complete ? [
      `Contract gap: ${report.contract.missing.length} required token(s) missing${report.contract.missingScopes.length ? ` (no ${report.contract.missingScopes.map(scope => SCOPE_SELECTORS[scope] ?? '@theme').join(', ')} block)` : ''}. This is expected on a site created before the current token contract.`,
      `  Preview them with Baseline starter values: npm run design:tokens -- --css "${cssPath}" --add-missing`,
      '  Starter values are suggestions, not calibration: adding them can change rendering, so review them as a visual change.',
    ] : []),
    `Remediation: edit the affected scoped tokens in ${cssPath}, then run npm run design:tokens -- --css "${cssPath}".`,
  ].join('\n');
}

function main() {
  const options = parseTokenCliArguments(process.argv.slice(2));
  if (options.help) { console.log(CLI_USAGE); return; }
  const cssLabel = options.css ?? 'src/styles/global.css';
  const cssPath = resolve(cssLabel);
  const initClient = Boolean(options.initClient);
  const json = Boolean(options.json);

  if (options.listLanes) {
    for (const [id, lane] of Object.entries(AESTHETIC_LANES)) {
      console.log(`- ${id} (${lane.name}): ${lane.description}`);
    }
    return;
  }

  let combinedOverrides = { theme: {}, root: {}, dark: {} };
  let hasMutationRequest = false;
  let selectedLaneId = 'neutral';

  if (options.lane) {
    if (!Object.hasOwn(AESTHETIC_LANES, options.lane)) {
      throw new Error(`Unknown aesthetic lane preset: ${options.lane}. Available lanes: ${Object.keys(AESTHETIC_LANES).join(', ')}`);
    }
    selectedLaneId = options.lane;
    combinedOverrides = mergeOverrides(combinedOverrides, AESTHETIC_LANES[options.lane]);
    hasMutationRequest = true;
  }

  if (options.typeScale) {
    combinedOverrides = mergeOverrides(combinedOverrides, { theme: generateTypeScale({ ratio: options.typeScale }) });
    hasMutationRequest = true;
  }

  if (options.spaceScale) {
    combinedOverrides = mergeOverrides(combinedOverrides, { theme: generateSpaceScale({ ratio: options.spaceScale }) });
    hasMutationRequest = true;
  }

  if (options.seedCanvas && !options.seedAccent) throw new Error('--seed-canvas requires --seed-accent.');
  if (options.seedAccent) {
    combinedOverrides = mergeOverrides(combinedOverrides, generateSeededPalette({ accent: options.seedAccent, canvas: options.seedCanvas }));
    hasMutationRequest = true;
  }

  const setOverrides = setOverridesOf(options.set);
  if (setOverrides) {
    combinedOverrides = mergeOverrides(combinedOverrides, setOverrides);
    hasMutationRequest = true;
  }

  const addMissing = Boolean(options.addMissing);
  if (addMissing) hasMutationRequest = true;

  if (initClient && !hasMutationRequest) {
    combinedOverrides = mergeOverrides(combinedOverrides, AESTHETIC_LANES[selectedLaneId]);
    hasMutationRequest = true;
  }

  const source = readFileSync(cssPath, 'utf8');
  const sourceGap = contractGap(source);
  // Missing tokens are inserted first so --set and presets can then adjust them.
  const withContract = addMissing ? addMissingContractTokens(source) : source;
  const css = hasMutationRequest ? applyTokenOverrides(withContract,combinedOverrides) : source;
  const added = addMissing ? sourceGap.missing : undefined;
  const report = auditDesignTokens(css, { cssPath: cssLabel });
  const fontAudit = auditFontLoading(css, process.cwd(), cssPath);
  const fontDiagnostics = [
    ...fontAudit.missingFamilies.map(family => ({ id: `font:${family}`, status: 'unverified', actionability: 'verification_required', message: `Inspect font source/availability: ${family}` })),
    ...fontAudit.preflight.errors.map((issue,index) => ({ id: `font-source-error:${index+1}`, status: 'fail', actionability: 'review_required', ...issue })),
    ...fontAudit.preflight.advisories.map((issue,index) => ({ id: `font-source:${index+1}`, status: 'unverified', actionability: 'verification_required', ...issue })),
  ];
  const proxyAudit = auditEditProxies();
  const saving = Boolean(options.write) || initClient;
  if (!(report.valid && fontAudit.valid && proxyAudit.valid)) {
    // A candidate on an already-failing stylesheet is still previewed, compared with the
    // source, so older sites can plan a migration. Saving still requires a valid candidate.
    let preview;
    if (hasMutationRequest) {
      const sourceErrors = css === source ? report.errors : auditDesignTokens(source, { cssPath: cssLabel }).errors;
      preview = {
        mode: saving ? 'refused' : css === source ? 'no-op' : 'preview',
        changes: combinedOverrides,
        added,
        comparison: {
          sourceErrors: sourceErrors.length,
          candidateErrors: report.errors.length,
          resolved: sourceErrors.filter(error => !report.errors.includes(error)),
          introduced: report.errors.filter(error => !sourceErrors.includes(error)),
        },
      };
    }
    if(json)console.log(JSON.stringify({...report,...preview,diagnostics:[...report.diagnostics,...fontDiagnostics],valid:false,fontLoading:fontAudit,editProxies:proxyAudit,sha256:stylesheetDigest(css)},null,2));
    else {
      console.error(formatTokenDiagnostics(report,cssPath,css));
      const other=[...fontAudit.warnings,...proxyAudit.issues];if(other.length)console.error(other.join('\n'));
      if (preview) {
        const { comparison } = preview;
        console.error(`${saving ? 'Not saved' : 'Preview (not saved)'}: the candidate still fails. Source errors ${comparison.sourceErrors} -> candidate ${comparison.candidateErrors}; ${comparison.resolved.length} resolved, ${comparison.introduced.length} introduced.`);
        if (added?.length) console.error(`Would add ${added.length} token(s): ${added.map(item => item.scope + ':' + item.token).join(', ')}`);
        for (const error of comparison.introduced) console.error(`  introduced: ${error}`);
      }
    }
    process.exitCode=1; return;
  }
  const writeRecord = options.writeRecord, writeCalibration = options.writeCalibration;
  const announce = message => (json ? console.error : console.log)(message);
  if(hasMutationRequest && !saving && (writeRecord || writeCalibration)) throw new Error('Preview is read-only. Add --write to save the validated candidate before writing record/calibration evidence.');
  // All candidate gates above precede the first mutation, including companion files.
  if(hasMutationRequest && saving) {
    if(css===source)announce('No-op: requested token values already match ' + cssPath);
    else { writeFileSync(cssPath,css,'utf8'); announce('Updated ' + cssPath + ' (SHA-256 ' + stylesheetDigest(css) + ').'); }
  }
  if(writeRecord || initClient) {
    const target=typeof writeRecord === 'string'?writeRecord:'AGENTS.md';
    announce('Wrote ## Art Direction Record to ' + upsertArtDirectionRecord(target,selectedLaneId));
  }
  if(initClient) {
    const pruned=pruneStarterExceptions('audit/design-gate-exceptions.json');
    announce('Pruned starter sample exceptions (' + pruned.before + ' -> ' + pruned.after + ').');
  }
  if(writeCalibration || initClient) {
    const target=typeof writeCalibration === 'string'?writeCalibration:'audit/component-calibration.md';
    announce('Wrote saved-source calibration to ' + upsertCalibrationRecord(target,css,cssPath));
    if(!json)return;
  }
  if(hasMutationRequest && !saving && !json)console.log(JSON.stringify({mode:css===source?'no-op':'preview',changes:combinedOverrides,added,spacing:report.spacing},null,2));

  const allValid = report.valid && fontAudit.valid && proxyAudit.valid;

  if (json) {
    console.log(JSON.stringify({
      ...report,
      diagnostics: [
        ...report.diagnostics,
        ...fontDiagnostics,
        ...proxyAudit.issues.map((message,index) => ({ id: `edit-proxy:${index+1}`, status: 'fail', actionability: 'review_required', message })),
      ],
      mode:hasMutationRequest ? (css===source ? "no-op" : saving ? "saved" : "preview") : "audit",
      changes:hasMutationRequest ? combinedOverrides : undefined,
      added,
      valid: allValid,
      fontLoading: fontAudit,
      editProxies: proxyAudit,
      sha256: stylesheetDigest(css),
    }, null, 2));
  } else {
    console.log(`Design System Audit (${cssPath}): ${allValid ? 'PASS' : 'FAIL'}`);
    console.log(`- LF SHA-256: ${stylesheetDigest(css)}`);
    console.log(`- @theme tokens: ${Object.keys(report.tokens.theme).length}`);
    console.log(`- :root tokens: ${Object.keys(report.tokens.root).length}`);
    console.log(`- [data-surface="dark"] tokens: ${Object.keys(report.tokens.dark).length}`);
    console.log(`- Font loading: ${fontAudit.valid ? 'PASS' : 'FAIL'} (${fontAudit.checkedFamilies.length ? fontAudit.checkedFamilies.join(', ') : 'system fonts'})`);
    console.log(`- Font source preflight: ${fontAudit.preflight.status.toUpperCase()} (${fontAudit.preflight.errors.length} errors, ${fontAudit.preflight.advisories.length} advisories; static observations, not rendered-font proof)`);
    console.log(proxyAudit.applicability === 'not-applicable'
      ? '- EmDash edit proxies: NOT APPLICABLE (static foundation)'
      : `- EmDash edit proxies: ${proxyAudit.valid ? 'PASS' : 'FAIL'} (${proxyAudit.checkedRoutes.length} single-entry routes, ${proxyAudit.collectionRoutes.length} collection routes)`);
    console.log(`- Fluid mathematics: ${report.fluid.tokens.length} bounded affine tokens (vi default; reference root 16px, horizontal writing)`);
    const advisoryCount = report.fluid.tokens.filter(token => token.advisories.length).length;
    if (advisoryCount) console.log(`- Fluid advisories: ${advisoryCount} tokens; inspect --json fluid.tokens (advisory only, rendered acceptance required)`);
    console.log('- Spacing contexts (bounded reference values; starter consumers, not a downstream site inventory):');
    for(const c of report.spacing)console.log('  ['+c.status.toUpperCase()+'] '+c.name+' -> '+c.consumer+' ('+(c.samples?.find(x=>x.viewportSizePx===1280 && x.rootFontPx===16)?.px ?? c.error)+'px at 1280/16)');
    console.log('- WCAG Relative Luminance Contrast Pairs:');
    for (const item of report.contrast) {
      console.log(`  [${item.status.toUpperCase()}] ${item.id}: ${item.ratio}:1 (min ${item.minimum}:1)`);
    }
    const allErrors = [...report.errors, ...fontAudit.warnings, ...proxyAudit.issues];
    if (allErrors.length) {
      if (!report.valid) console.error(formatTokenDiagnostics(report, cssPath, css));
      const otherErrors = [...fontAudit.warnings, ...proxyAudit.issues];
      if (otherErrors.length) console.error('\nErrors:\n' + otherErrors.map(e => `- ${e}`).join('\n'));
    } else {
      console.log('👉 Next Step (Stage 4.5 -> 5): Calibrate on /_styleguide, then read .agents/skills/astro-site-design/references/astro-primitives.md and references/landing-page-archetypes.md before assembling routes.');
    }
  }

  if (!allValid) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
