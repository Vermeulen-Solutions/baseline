import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  AESTHETIC_LANES,
  TYPE_SCALE_RATIOS,
  REQUIRED_THEME_TOKENS,
  REQUIRED_ROOT_TOKENS,
  REQUIRED_DARK_SURFACE_TOKENS,
  parseDesignTokens,
  auditDesignTokens,
  applyTokenOverrides,
  contrastRatio,
  generateTypeScale,
  generateSpaceScale,
  generateSeededPalette,
  stylesheetDigest,
  formatCalibrationMarkdown,
  upsertCalibrationRecord,
  formatArtDirectionRecord,
  upsertArtDirectionRecord,
  auditFontLoading,
  auditEditProxies,
  pruneStarterExceptions,
} from '../scripts/design-system.mjs';
import { validateRecord, validateCssAlignment } from '../scripts/check-art-direction.mjs';

const GLOBAL_CSS_PATH = 'src/styles/global.css';
const FIXTURES_PATH = 'src/dev/styleguide-fixtures.ts';

// Tokens that are part of the public Tailwind v4 / CSS utility contract for downstream client templates
// even when the minimal starter routes only consume a subset of elevation/easing steps directly.
const PUBLIC_CONTRACT_TOKENS = new Set([
  '--text-step-3-to-1',
  '--text-step-2-to-0',
  '--spacing-2xl-to-md',
  '--spacing-xl-to-sm',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--ease-smooth',
  '--ease-snappy',
  '--ease-spring',
  '--measure-content-safe',
]);

function readSpecimenColors() {
  const source = readFileSync(FIXTURES_PATH, 'utf8');
  const match = source.match(/specimenTokens\s*=\s*\[([^\]]+)\]/);
  assert.ok(match, 'specimenTokens array must exist in src/dev/styleguide-fixtures.ts');
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(([, role]) => `--color-${role}`);
}

function collectSourceFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (/\.(astro|css|ts|mjs|js)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

test('global.css declares all required semantic tokens, valid fluid clamps, and WCAG AA contrast pairs', () => {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf8');
  const audit = auditDesignTokens(css);
  assert.equal(audit.valid, true, audit.errors.join('\n'));
  assert.equal(Object.keys(audit.tokens.theme).length, REQUIRED_THEME_TOKENS.length);
  assert.equal(Object.keys(audit.tokens.root).length, REQUIRED_ROOT_TOKENS.length);
  assert.equal(Object.keys(audit.tokens.dark).length, REQUIRED_DARK_SURFACE_TOKENS.length);
});

test('every @theme color token is represented on the styleguide palette specimen', () => {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf8');
  const { theme } = parseDesignTokens(css);
  const authoredColors = Object.keys(theme)
    .filter(token => token.startsWith('--color-') && token !== '--color-focus-on-dark')
    .sort();
  const specimenColors = readSpecimenColors().sort();

  assert.deepEqual(
    specimenColors,
    authoredColors,
    'src/dev/styleguide-fixtures.ts specimenTokens must match @theme --color-* tokens in src/styles/global.css',
  );
});

test('every authored token in global.css is either consumed in src/ or part of the documented public contract', () => {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf8');
  const { theme, root } = parseDesignTokens(css);
  const allAuthored = [...Object.keys(theme), ...Object.keys(root)];
  const sourceFiles = collectSourceFiles('src');
  const combinedSource = sourceFiles.map(file => readFileSync(file, 'utf8')).join('\n');

  for (const token of allAuthored) {
    if (PUBLIC_CONTRACT_TOKENS.has(token)) continue;
    const varUsage = new RegExp(`var\\(\\s*${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    const dynamicUsage = token.startsWith('--color-') && combinedSource.includes('--color-${');
    const stepUsage = token.startsWith('--text-step-') && combinedSource.includes('--text-step-${');
    assert.ok(
      varUsage.test(combinedSource) || dynamicUsage || stepUsage,
      `Authored token ${token} has no consumer in src/ and is not listed in PUBLIC_CONTRACT_TOKENS`,
    );
  }
});

test('every canonical Aesthetic Lane preset applies cleanly and passes WCAG AA contrast and fluid checks', () => {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf8');
  for (const laneId of Object.keys(AESTHETIC_LANES)) {
    const applied = applyTokenOverrides(css, laneId);
    const audit = auditDesignTokens(applied);
    assert.equal(audit.valid, true, `Lane ${laneId} failed validation:\n${audit.errors.join('\n')}`);
  }
});

test('parametric fluid type/space scales and WCAG-safe OKLCH palette generator pass all audits', () => {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf8');
  for (const ratioName of Object.keys(TYPE_SCALE_RATIOS)) {
    const typeOverrides = generateTypeScale({ ratio: ratioName });
    const spaceOverrides = generateSpaceScale({ ratio: 1.45 });
    const seededPalette = generateSeededPalette({ accent: '#1B4332', canvas: '#FAF8F5' });
    const updated = applyTokenOverrides(css, {
      theme: { ...typeOverrides, ...spaceOverrides, ...seededPalette.theme },
      dark: seededPalette.dark,
    });
    const audit = auditDesignTokens(updated);
    assert.equal(audit.valid, true, `Parametric scale (${ratioName}) failed:\n${audit.errors.join('\n')}`);
  }

  for (const seed of ['#7C2D12', '#1E3A8A', '#F59E0B', 'oklch(62% 0.19 310)']) {
    const seeded = generateSeededPalette({ accent: seed });
    const updated = applyTokenOverrides(css, seeded);
    const audit = auditDesignTokens(updated);
    assert.equal(audit.valid, true, `Seeded palette (${seed}) failed WCAG audit:\n${audit.errors.join('\n')}`);
  }
});

test('formatCalibrationMarkdown and upsertCalibrationRecord bind Stage 4.5 token evidence to LF SHA-256', () => {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf8');
  const digest = stylesheetDigest(css);
  assert.equal(stylesheetDigest(css.replace(/\n/g, '\r\n')), digest);

  const dir = mkdtempSync(join(tmpdir(), 'emdash-cal-'));
  try {
    const target = join(dir, 'component-calibration.md');
    upsertCalibrationRecord(target, css);
    const first = readFileSync(target, 'utf8');
    assert.ok(first.includes('## Token Calibration'));
    assert.ok(first.includes(digest));
    assert.ok(first.includes('## Component Specimens To Verify'));

    // Updating in place preserves surrounding sections
    upsertCalibrationRecord(target, css);
    const second = readFileSync(target, 'utf8');
    assert.equal(second.match(/## Token Calibration/g)?.length, 1);
    assert.ok(second.includes('## Component Specimens To Verify'));
    assert.ok(formatCalibrationMarkdown(css).includes('WCAG AA Perceptual Contrast Matrix'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('auditDesignTokens catches insufficient WCAG contrast and invalid fluid clamp bounds', () => {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf8');
  const lowContrast = applyTokenOverrides(css, {
    theme: {
      '--color-text': 'oklch(82% 0.01 250)',
      '--spacing-section': 'clamp(6rem, 5vi, 2rem)',
    },
  });
  const audit = auditDesignTokens(lowContrast);
  assert.equal(audit.valid, false);
  assert.ok(audit.errors.some(err => err.includes('default:text-on-page')));
  assert.ok(audit.errors.some(err => err.includes('--spacing-section')));
  assert.ok(contrastRatio('#ffffff', '#000000') >= 20.9);
});

test('formatArtDirectionRecord and upsertArtDirectionRecord generate records that pass check-art-direction validateRecord', () => {
  const dir = mkdtempSync(join(tmpdir(), 'emdash-agents-'));
  try {
    const agentsFile = join(dir, 'AGENTS.md');
    writeFileSync(agentsFile, '# Client Site\n\n## Implementation rules\n\nKeep routes server-rendered.\n', 'utf8');

    for (const laneId of Object.keys(AESTHETIC_LANES)) {
      const recordMd = formatArtDirectionRecord(laneId);
      assert.deepEqual(
        validateRecord(`# Site\n\n${recordMd}\n`),
        [],
        `Generated record for ${laneId} must pass validateRecord`,
      );

      upsertArtDirectionRecord(agentsFile, laneId);
      const saved = readFileSync(agentsFile, 'utf8');
      assert.deepEqual(
        validateRecord(saved),
        [],
        `Upserted AGENTS.md record for ${laneId} must pass validateRecord`,
      );
      assert.equal(saved.match(/^## Art Direction Record\b/gm)?.length, 1);
      assert.ok(saved.includes('## Implementation rules'));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('auditFontLoading passes for system fonts and catches unloaded custom font families', () => {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf8');
  const systemAudit = auditFontLoading(css, '.');
  assert.equal(systemAudit.valid, true);

  const unloadedCustomCss = applyTokenOverrides(css, {
    theme: {
      '--font-display': '"Unloaded Custom Display", ui-sans-serif, system-ui, sans-serif',
    },
  });
  const failedAudit = auditFontLoading(unloadedCustomCss, '.');
  assert.equal(failedAudit.valid, false);
  assert.deepEqual(failedAudit.missingFamilies, ['Unloaded Custom Display']);

  const cssWithFontFace = `${unloadedCustomCss}\n@font-face { font-family: "Unloaded Custom Display"; src: local("Arial"); }\n`;
  const loadedAudit = auditFontLoading(cssWithFontFace, '.');
  assert.equal(loadedAudit.valid, true);
});

test('auditEditProxies verifies starter single-entry and collection routes and catches missing Base content or field edit proxies', () => {
  const repoAudit = auditEditProxies('.');
  assert.equal(repoAudit.valid, true, repoAudit.issues.join('\n'));
  assert.ok(repoAudit.checkedRoutes.includes('src/pages/[slug].astro'));
  assert.ok(repoAudit.checkedRoutes.includes('src/pages/posts/[slug].astro'));
  assert.ok(repoAudit.collectionRoutes.includes('src/pages/index.astro'));

  const dir = mkdtempSync(join(tmpdir(), 'emdash-proxies-'));
  try {
    const pagesDir = join(dir, 'src/pages');
    mkdirSync(pagesDir, { recursive: true });
    writeFileSync(
      join(pagesDir, '[slug].astro'),
      `---\nconst { entry } = await getEmDashEntry('pages', slug);\n---\n<Base title={entry.data.title} content={{ collection: 'pages', id: entry.data.id }}><h1 {...entry.edit.title}>{entry.data.title}</h1><p>{entry.data.excerpt}</p></Base>\n`,
      'utf8',
    );
    const brokenAudit = auditEditProxies(dir);
    assert.equal(brokenAudit.valid, false);
    assert.ok(brokenAudit.issues.some(msg => msg.includes('.data.excerpt')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('validateCssAlignment catches untouched neutral starter global.css when a named lane is declared and passes once lane tokens are applied', () => {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf8');
  const editorialRecord = formatArtDirectionRecord('editorial-paper');
  const unalignedErrors = validateCssAlignment(editorialRecord, css);
  assert.equal(unalignedErrors.length, 1);
  assert.ok(unalignedErrors[0].includes('untouched neutral starter palette'));

  const alignedCss = applyTokenOverrides(css, 'editorial-paper');
  assert.deepEqual(validateCssAlignment(editorialRecord, alignedCss), []);
  assert.deepEqual(validateCssAlignment(formatArtDirectionRecord('neutral'), css), []);
});

test('pruneStarterExceptions strips sample-page and deleted entries while retaining dev/styleguide infrastructure', () => {
  const dir = mkdtempSync(join(tmpdir(), 'emdash-prune-'));
  try {
    const exFile = join(dir, 'design-gate-exceptions.json');
    const source = JSON.parse(readFileSync('audit/design-gate-exceptions.json', 'utf8'));
    writeFileSync(exFile, JSON.stringify(source, null, 2), 'utf8');
    const result = pruneStarterExceptions(exFile);
    assert.ok(result.before > result.after);
    assert.ok(result.after >= 7, 'Retain the common and platform-specific developer infrastructure');
    const kept = JSON.parse(readFileSync(exFile, 'utf8'));
    assert.ok(kept.every(item => !item.deleted && /^src\/(?:pages\/_styleguide\.astro|components\/dev\/|dev\/|assets\/styleguide-)/.test(item.path)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});


