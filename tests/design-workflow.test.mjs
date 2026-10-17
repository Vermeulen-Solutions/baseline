import test from 'node:test';
import assert from 'node:assert/strict';
import { createTokenMap, exportTokens } from '../src/utils/design-tweaks.mjs';
import { validateRecord, matchesException, matchesDeletionException, isVisualPath } from '../scripts/check-art-direction.mjs';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('infrastructure deletions require explicit approval of exact previous bytes', () => {
  const path = 'src/data/retired.json', content = '{}\n';
  const entry = {path, reason: 'Retired neutral infrastructure', sha256: createHash('sha256').update(content).digest('hex')};
  assert.equal(matchesDeletionException(path, content, [entry]), false);
  assert.equal(matchesDeletionException(path, content, [{...entry, deleted:true}]), true);
  assert.equal(matchesDeletionException(path, 'changed', [{...entry, deleted:true}]), false);
  assert.equal(matchesDeletionException('src/pages/client.astro', content, [{...entry, deleted:true}]), false);
});

const record = `## Art Direction Record
- **Aesthetic Lane:** Editorial Paper
- **Narrative Metaphor:** Archival reading room; ink dividers guide scanning, no texture on controls.
- **Typography Pairing:** Display: Newsreader, Body: Inter
- **Token Physics:**
  - Canvas: Warm paper
  - Action/Accent: Forest ink for actions
  - Borders: Hairline square dividers
  - Spatial Density: Spacious reading, compact navigation
- **Site Anti-Patterns:** Neon gradients; floating glass cards
`;

test('gate accepts real standard and custom directions, including CRLF', () => {
  assert.deepEqual(validateRecord(record), []);
  assert.deepEqual(validateRecord(record.replaceAll('\n', '\r\n')), []);
  assert.deepEqual(validateRecord(record.replace('Editorial Paper', 'Custom / existing brand — warm photographic hospitality')), []);
});
test('gate rejects absent, duplicate, placeholder, or fenced-only records', () => {
  for (const markdown of ['', record + record, record.replace('Editorial Paper', '[Editorial Paper]'), record.replace('Archival reading room;', 'TBD;'), '```markdown\n' + record + '```', '```markdown\n' + record]) {
    assert.ok(validateRecord(markdown).length, markdown);
  }
});
test('gate requires each physics field inside its block and two or three bans', () => {
  for (const markdown of [record.replace('  - Canvas: Warm paper\n', ''), record.replace('  - Canvas: Warm paper', '  - Canvas:'), record.replace('  - Canvas: Warm paper', '- **Site Extra:** Yes\n  - Canvas: Warm paper'), record.replace('Neon gradients; floating glass cards', 'Neon gradients'), record.replace('Display: Newsreader, Body: Inter', 'Nice fonts')]) {
    assert.ok(validateRecord(markdown).length, markdown);
  }
});
test('infrastructure exceptions are exact, reasoned, hash-bound, and LF/CRLF portable', () => {
  const exceptions = [{ path: 'src/styles/global.css', reason: 'Starter infrastructure', sha256: createHash('sha256').update('body {}\n').digest('hex') }];
  assert.equal(matchesException('src/styles/global.css', 'body {}\r\n', exceptions), true);
  assert.equal(matchesException('src/styles/global.css', 'body {color:red}\n', exceptions), false);
  assert.equal(matchesException('src/pages/index.astro', 'body {}\n', exceptions), false);
  assert.equal(matchesException('src/styles/global.css', 'body {}\n', [{ ...exceptions[0], reason: '' }]), false);
  assert.equal(isVisualPath('src/layouts/Base.astro'), true);
  assert.equal(isVisualPath('src/utils/hidden-design.ts'), true);
  assert.equal(isVisualPath('public/hero.svg'), true);
  assert.equal(isVisualPath('audit/visual-concepts/prototype.html'), false);
});

test('CLI catches untracked visual work, accepts a record, and expires changed infrastructure exceptions', () => {
  const directory = mkdtempSync(join(tmpdir(), 'emdash-design-gate-'));
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: directory });
    mkdirSync(join(directory, 'src'), { recursive: true });
    mkdirSync(join(directory, 'audit'), { recursive: true });
    writeFileSync(join(directory, 'AGENTS.md'), '# Neutral starter\n');
    const emptyTree = execFileSync('git', ['hash-object', '-t', 'tree', '--stdin'], { cwd: directory, input: '', encoding: 'utf8' }).trim();
    const script = fileURLToPath(new URL('../scripts/check-art-direction.mjs', import.meta.url));
    const run = () => spawnSync(process.execPath, [script, '--changed', '--base', emptyTree], { cwd: directory, encoding: 'utf8' });
    assert.equal(run().status, 0);
    writeFileSync(join(directory, 'src', 'page.astro'), '<h1>Client layout</h1>\n');
    assert.equal(run().status, 1, 'untracked visual implementation must require the record');
    writeFileSync(join(directory, 'AGENTS.md'), record);
    assert.equal(run().status, 0);
    writeFileSync(join(directory, 'AGENTS.md'), '# Neutral starter\n');
    writeFileSync(join(directory, 'audit', 'design-gate-exceptions.json'), JSON.stringify([{path: 'src/page.astro', reason: 'Isolated test of infrastructure exception expiry', sha256: createHash('sha256').update('<h1>Client layout</h1>\n').digest('hex')}]));
    assert.equal(run().status, 0);
    writeFileSync(join(directory, 'src', 'page.astro'), '<h1>Different layout</h1>\n');
    assert.equal(run().status, 1, 'an edited file cannot reuse its old exception');
  } finally {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('emdash-design-gate-'));
    rmSync(directory, { recursive: true, force: true });
  }
});

const baseline = {
  '--text-step-1': 'clamp(1rem, 2vi, 2rem)',
  '--text-step-2': 'clamp(2rem, 4vi, 4rem)',
  '--spacing-content': 'clamp(1rem, 2vi, 2rem)',
  '--spacing-grid': '2rem', '--spacing-section': '6rem',
  '--hero-filter': 'sepia(20%)', '--color-action': 'oklch(43% 0.14 250)',
};
test('fresh state never overwrites source tokens and unit scaling preserves baseline', () => {
  assert.deepEqual(createTokenMap(baseline, {}), {});
  assert.deepEqual(createTokenMap(baseline, { typeScale: '1', densityScale: '1', surface: 'baseline' }), {});
});
test('preview and export reproduce every changed type, spacing, filter, color and pattern token', () => {
  const tokens = createTokenMap(baseline, { typeScale: '1.2', densityScale: '0.8', surface: 'grid', heroBrightness: '80', '--color-action': 'oklch(60% 0.12 240)' });
  assert.equal(tokens['--text-step-2'], 'calc(clamp(2rem, 4vi, 4rem) * 1.2)');
  assert.equal(tokens['--text-step-1'], 'calc(clamp(1rem, 2vi, 2rem) * 1.2)');
  assert.equal(tokens['--spacing-section'], 'calc(6rem * 0.8)');
  assert.equal(tokens['--hero-filter'], 'sepia(20%) brightness(80%) contrast(100%) saturate(100%)');
  const css = exportTokens(tokens);
  for (const [key, value] of Object.entries(tokens)) assert.ok(css.includes(`${key}: ${value};`));
  assert.ok(css.includes('@theme {'));
  assert.ok(css.includes(':root {'));
  assert.ok(css.includes('--page-pattern-size: 28px 28px;'));
});
test('surface source restores baseline, solid clears a pattern, dark-safe ink follows text', () => {
  assert.deepEqual(createTokenMap(baseline, { surface: 'baseline' }), {});
  assert.equal(createTokenMap(baseline, { surface: 'solid' })['--page-pattern'], 'none');
  for (const surface of ['grid', 'dots', 'noise']) assert.ok(createTokenMap(baseline, { surface })['--page-pattern'].includes('var(--color-text)'));
});

test('global.css, Container.astro, and Card.astro ship the curated token engine, breakout grid, and accessible card contract', () => {
  const css = execFileSync(process.execPath, ['-e', "process.stdout.write(require('fs').readFileSync('src/styles/global.css','utf8'))"], { encoding: 'utf8' });
  for (const token of [
    '--text-step-3-to-1', '--text-step-2-to-0',
    '--spacing-2xl-to-md', '--spacing-xl-to-sm',
    '--shadow-sm', '--shadow-md', '--shadow-lg',
    '--ease-smooth', '--ease-snappy', '--ease-spring',
    '--measure-content-safe',
  ]) {
    assert.ok(css.includes(token), `Missing curated token ${token}`);
  }
  for (const selector of [
    '.content-grid', '.content--feature', '.content--wide', '.content--full', '.content--full-safe',
    '.clickable-parent::after', '.focus-parent:focus-within:has(:focus-visible)',
    ':where(:has(> .is-bg))', '.fade--bottom', '[data-surface="dark"]', '[data-surface="light"]',
  ]) {
    assert.ok(css.includes(selector), `Missing structural selector ${selector}`);
  }
  const container = execFileSync(process.execPath, ['-e', "process.stdout.write(require('fs').readFileSync('src/components/Container.astro','utf8'))"], { encoding: 'utf8' });
  assert.ok(container.includes('breakout?: boolean;'));
  assert.ok(container.includes('breakout ? "content-grid" : ["container-shell", `container-shell--${width}`]'));

  const card = execFileSync(process.execPath, ['-e', "process.stdout.write(require('fs').readFileSync('src/components/Card.astro','utf8'))"], { encoding: 'utf8' });
  assert.ok(card.includes('<article class:list='), 'Card must render a semantic <article> instead of wrapping the whole card in <a>');
  assert.ok(card.includes('class="card-link clickable-parent"'), 'Card heading link must stretch via .clickable-parent');
  assert.ok(card.includes('--card-media-radius: max(0px, calc(var(--card-radius) - var(--card-frame-padding)))'), 'Card must compute concentric inner media radius');
  assert.ok(card.includes('titleEdit?: Partial<FieldAnnotation>'), 'Card must accept EmDash titleEdit annotations');
  assert.ok(card.includes('descriptionEdit?: Partial<FieldAnnotation>'), 'Card must accept EmDash descriptionEdit annotations');
  assert.ok(card.includes('actionEdit?: Partial<FieldAnnotation>'), 'Card must accept EmDash actionEdit annotations');
  assert.ok(card.includes('[data-emdash-field]'), 'Card must elevate EmDash field annotations above .clickable-parent');
  assert.ok(css.includes('grid-template-columns: subgrid'), 'global.css must propagate .content-grid tracks into .flow / [data-emdash-field] via subgrid');

  const editorialImage = execFileSync(process.execPath, ['-e', "process.stdout.write(require('fs').readFileSync('src/components/EditorialImage.astro','utf8'))"], { encoding: 'utf8' });
  assert.ok(editorialImage.includes("node?.alignment === 'wide' ? 'content--feature'"));
  assert.ok(editorialImage.includes("node?.alignment === 'full' ? 'content--full-safe'"));

  const photoGallery = execFileSync(process.execPath, ['-e', "process.stdout.write(require('fs').readFileSync('src/components/PhotoGallery.astro','utf8'))"], { encoding: 'utf8' });
  assert.ok(photoGallery.includes("breakout = 'feature'"));
  assert.ok(photoGallery.includes('breakout && `content--${breakout}`'));
});

