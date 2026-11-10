import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  REQUIRED_THEME_TOKENS, REQUIRED_ROOT_TOKENS, REQUIRED_DARK_SURFACE_TOKENS, CONTRACT_STARTER_VALUES,
  contractGap, addMissingContractTokens, auditDesignTokens, applyTokenOverrides, parseDesignTokens,
  parseTokenCliArguments, colorLuminance, parseToOklch,
} from '../scripts/design-system.mjs';

// Portable: synthetic stylesheets only, so installed sites can run this suite.
const cli = fileURLToPath(new URL('../scripts/design-system.mjs', import.meta.url));

// An older site's token set: real brand values, but only part of the current contract.
const olderSite = `@import "tailwindcss";

@theme {
\t--font-body: ui-sans-serif, system-ui, sans-serif;
\t--font-display: Georgia, serif;
\t--text-step--1: clamp(0.875rem, calc(0.8333rem + 0.2083vi), 1rem);
\t--text-step-0: clamp(1rem, calc(0.9rem + 0.5vi), 1.25rem);
\t--text-step-1: clamp(1.25rem, calc(1rem + 1.25vi), 2rem);
\t--text-step-2: clamp(1.75rem, calc(1.25rem + 2.5vi), 3.25rem);
\t--spacing-content: clamp(1rem, calc(0.8333rem + 0.8333vi), 1.5rem);
\t--spacing-grid: clamp(1.25rem, calc(0.9167rem + 1.6667vi), 2.25rem);
\t--spacing-container: clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem);
\t--spacing-section: clamp(3rem, calc(1rem + 10vi), 9rem);
\t--color-page: oklch(15% 0.02 280);
\t--color-surface: oklch(20% 0.02 280);
\t--color-text: oklch(96% 0.01 280);
\t--color-muted: oklch(78% 0.02 280);
\t--color-border: oklch(35% 0.03 280);
\t--color-action: oklch(72% 0.15 290);
\t--color-on-action: oklch(15% 0.02 280);
\t--color-focus: oklch(80% 0.14 290);
\t--radius-control: 0.5rem;
\t--radius-card: 1rem;
}

:root {
\t--measure-reading: 65ch;
\t--measure-content: 72rem;
\t--measure-wide: 84rem;
}
`;

function tempCss(css) {
  const directory = mkdtempSync(join(tmpdir(), 'token-contract-'));
  const file = join(directory, 'global.css');
  writeFileSync(file, css);
  return { directory, file };
}

function runCli(cwd, args) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json: args.includes('--json') && result.stdout ? JSON.parse(result.stdout) : undefined };
}

test('starter suggestions cover exactly the required contract', () => {
  assert.deepEqual(Object.keys(CONTRACT_STARTER_VALUES.theme).sort(), [...REQUIRED_THEME_TOKENS].sort());
  assert.deepEqual(Object.keys(CONTRACT_STARTER_VALUES.root).sort(), [...REQUIRED_ROOT_TOKENS].sort());
  assert.deepEqual(Object.keys(CONTRACT_STARTER_VALUES.dark).sort(), [...REQUIRED_DARK_SURFACE_TOKENS].sort());
});

test('an older token set reports its contract gap with suggestions and missing scopes', () => {
  const gap = contractGap(olderSite);
  assert.equal(gap.complete, false);
  assert.deepEqual(gap.missingScopes, ['dark']);
  const names = gap.missing.map(item => `${item.scope}:${item.token}`);
  assert.ok(names.includes('theme:--font-mono'));
  assert.ok(names.includes('root:--layout-grid-gap'));
  assert.ok(names.includes('dark:--color-link'));
  assert.ok(!names.includes('theme:--color-action'), 'existing brand tokens are not reported');
  for (const item of gap.missing) assert.equal(item.suggestion, CONTRACT_STARTER_VALUES[item.scope][item.token]);
  assert.deepEqual(auditDesignTokens(olderSite).contract, gap);
});

test('adding missing tokens completes the contract without changing existing declarations', () => {
  const migrated = addMissingContractTokens(olderSite);
  assert.equal(contractGap(migrated).complete, true);
  assert.equal(auditDesignTokens(migrated).valid, true);
  const before = parseDesignTokens(olderSite), after = parseDesignTokens(migrated);
  for (const scope of ['theme', 'root']) {
    for (const [token, value] of Object.entries(before[scope])) assert.equal(after[scope][token], value, `${scope}:${token} preserved`);
  }
  assert.match(migrated, /\n\[data-surface="dark"\] \{/);
  assert.ok(migrated.startsWith(olderSite.slice(0, olderSite.indexOf('}'))), 'existing text is kept in place');
  assert.equal(addMissingContractTokens(migrated), migrated, 'idempotent once complete');
  // Newly added tokens can then be adjusted like any other declaration.
  assert.equal(parseDesignTokens(applyTokenOverrides(migrated, { theme: { '--font-mono': 'monospace' } })).theme['--font-mono'], 'monospace');
});

test('a stylesheet without an @theme block is refused rather than guessed', () => {
  assert.throws(() => addMissingContractTokens(':root { --measure-reading: 65ch; }'), /no @theme block/);
});

test('CLI previews changes on an incomplete base, compares errors and never writes', () => {
  const { directory, file } = tempCss(olderSite);
  try {
    const audit = runCli(directory, ['--css', file]);
    assert.equal(audit.status, 1);
    assert.match(audit.stderr, /Contract gap: \d+ required token\(s\) missing \(no \[data-surface="dark"\] block\)/);
    assert.match(audit.stderr, /--add-missing/);

    const set = runCli(directory, ['--css', file, '--set', '--radius-card=1.25rem', '--json']);
    assert.equal(set.status, 1);
    assert.equal(set.json.mode, 'preview');
    assert.deepEqual(set.json.changes.theme, { '--radius-card': '1.25rem' });
    assert.equal(set.json.comparison.sourceErrors, set.json.comparison.candidateErrors);
    assert.deepEqual(set.json.comparison.introduced, []);

    const refusedSave = runCli(directory, ['--css', file, '--set', '--radius-card=1.25rem', '--write']);
    assert.equal(refusedSave.status, 1);
    assert.match(refusedSave.stderr, /Not saved: the candidate still fails/);

    const missing = runCli(directory, ['--css', file, '--set', '--shadow-sm=none']);
    assert.match(missing.stderr, /required contract token: add --add-missing/);

    const preview = runCli(directory, ['--css', file, '--add-missing', '--json']);
    assert.equal(preview.status, 0, preview.stderr + preview.stdout.slice(0, 2000));
    assert.equal(preview.json.mode, 'preview');
    assert.equal(preview.json.valid, true);
    assert.equal(preview.json.added.length, contractGap(olderSite).missing.length);
    assert.equal(readFileSync(file, 'utf8'), olderSite, 'preview leaves the stylesheet unchanged');

    const saved = runCli(directory, ['--css', file, '--add-missing', '--write', '--json']);
    assert.equal(saved.status, 0);
    assert.equal(saved.json.mode, 'saved');
    assert.equal(contractGap(readFileSync(file, 'utf8')).complete, true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('CLI grammar is strict: unknown, duplicate and valueless flags fail before any read or write', () => {
  assert.deepEqual(parseTokenCliArguments(['--css', 'a.css', '--set', '--color-page=#fff', '--set', '--dark:--color-text=#000', '--write-calibration', '--json']),
    { set: ['--color-page=#fff', '--dark:--color-text=#000'], css: 'a.css', writeCalibration: true, json: true });
  assert.deepEqual(parseTokenCliArguments(['--write-record', 'SITE.md', '--write']), { set: [], writeRecord: 'SITE.md', write: true });
  for (const [args, pattern] of [
    [['--wirte'], /Unknown argument: --wirte/], [['stray.css'], /Unknown argument: stray\.css/],
    [['--css'], /Missing value for --css/], [['--type-scale', '--write'], /Missing value for --type-scale/],
    [['--lane'], /Missing value for --lane/], [['--json', '--json'], /Duplicate argument: --json/],
    [['--css', 'a.css', '--css', 'b.css'], /Duplicate argument: --css/],
    [['--set'], /Missing --set argument/], [['--set', 'no-equals'], /Invalid --set argument/],
  ]) assert.throws(() => parseTokenCliArguments(args), pattern);

  const dir = mkdtempSync(join(tmpdir(), 'baseline-token-cli-'));
  try {
    const file = join(dir, 'global.css');
    writeFileSync(file, olderSite);
    const run = (...args) => spawnSync(process.execPath, [cli, '--css', file, ...args], { cwd: dir, encoding: 'utf8' });
    // A misspelled --write used to be ignored, which turned a requested save into a silent preview.
    const typo = run('--add-missing', '--wirte');
    assert.equal(typo.status, 1);
    assert.match(typo.stderr, /Unknown argument: --wirte/);
    assert.doesNotMatch(typo.stderr, /\n\s+at /);
    assert.equal(readFileSync(file, 'utf8'), olderSite);
    for (const [args, pattern] of [
      [['--seed-canvas', '#ffffff'], /--seed-canvas requires --seed-accent/],
      // An inherited object key is not a lane.
      [['--lane', 'constructor'], /Unknown aesthetic lane preset: constructor/],
    ]) {
      const result = run(...args);
      assert.equal(result.status, 1, args.join(' '));
      assert.match(result.stderr, pattern);
    }
    const help = run('--help');
    assert.equal(help.status, 0);
    assert.match(help.stdout, /--write-calibration \[file\]/);
    assert.equal(readFileSync(file, 'utf8'), olderSite);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  assert.throws(() => applyTokenOverrides(olderSite, 'constructor'), /Unknown aesthetic lane preset/);
});

test('contract messages name the audited stylesheet, and both colour consumers share one grammar', () => {
  assert.ok(auditDesignTokens(olderSite).errors.some(error => /^Missing required :root token in src\/styles\/global\.css: /.test(error)));
  const labelled = auditDesignTokens(olderSite, { cssPath: 'site/tokens.css' }).errors.filter(error => error.startsWith('Missing required'));
  assert.ok(labelled.length > 0 && labelled.every(error => error.includes(' in site/tokens.css: ')));
  for (const [color, supported] of [
    ['oklch(43% 0.14 250)', true], ['oklch(0.43 .14 250deg)', true], ['oklch(43% 0.14 0.7turn)', true], ['#abc', true], ['#AABBCC', true],
    // Outside the verified grammar: alpha, malformed numbers, 4/8-digit hex and rgb().
    ['oklch(43% 0.14 250 / 0.5)', false], ['oklch(4.3.1% 0.14 250)', false], ['oklch(43% 0.1.4 250)', false], ['#abcd', false], ['rgb(0 0 0)', false],
  ]) {
    assert.equal(colorLuminance(color) !== null, supported, color);
    if (supported) assert.ok(Number.isFinite(colorLuminance(color)) && Object.values(parseToOklch(color)).every(Number.isFinite), color);
    else assert.throws(() => parseToOklch(color), /Unsupported color format/, color);
  }
  // A malformed number is reported as unsupported syntax, never as a NaN contrast ratio.
  const malformed = auditDesignTokens(applyTokenOverrides(addMissingContractTokens(olderSite), { theme: { '--color-text': 'oklch(9.6.1% 0.01 280)' } }));
  assert.ok(malformed.errors.some(error => /unsupported color syntax for --color-text/.test(error)), malformed.errors.join('\n'));
  assert.ok(!malformed.errors.some(error => error.includes('NaN')));
});
