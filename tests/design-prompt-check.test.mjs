import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { inspectPrompt, summarize, parseArgs, exceedsThreshold } from '../scripts/check-design-prompt.mjs';

const ids = findings => [...new Set(findings.map(finding => finding.id))].sort();

test('a prompt that already speaks in roles, fluid steps and real proof passes clean', () => {
  const prompt = `Use the site's semantic roles (page, surface, text, muted, action) and one accent.
Hero type is a fluid clamp step, not a fixed size.
Section spacing follows the spacing hierarchy.
Motion is subtle and has a prefers-reduced-motion branch.
Contrast is measured against the composed background (WCAG AA, 4.5:1 body) and focus-visible is styled.
Proof comes from the owner's real work only.`;
  assert.deepEqual(inspectPrompt(prompt), []);
});

test('a literal colour is reported once per line with the role-mapping fix', () => {
  const findings = inspectPrompt('Primary accent #ccff00, secondary rgb(16, 185, 129).');
  const colours = findings.filter(finding => finding.id === 'literal-colours');
  assert.equal(colours.length, 1, 'one finding per line, not per colour');
  assert.equal(colours[0].severity, 'P1');
  assert.match(colours[0].fix, /role/i);
});

test('quoted font names and an explicit system-font ban are both P1 conflicts', () => {
  const findings = inspectPrompt('Headings in \'Space Grotesk\', labels in \'JetBrains Mono\'.\nMUST NOT use standard system fonts.');
  const conflicts = findings.filter(finding => finding.severity === 'P1');
  assert.deepEqual(ids(conflicts), ['quoted-font-name', 'system-font-ban']);
});

test('named proof requires source review without claiming that a match proves fabrication', () => {
  const findings = inspectPrompt('A greyscale portrait with a testimonial card, plus a trusted by logo wall.');
  const proof = findings.find(finding => finding.id === 'invented-proof');
  assert.equal(proof.severity, 'P1');
  assert.match(proof.fix, /Never invent/i);
  assert.match(proof.message, /does not establish fabrication/);
});

test('source and approval assertions stay reviewable without an automatic P1 conflict', () => {
  for (const prompt of [
    'Use owner-supplied testimonials and approved client logos.',
    'Use the approved already installed font "Space Grotesk".',
    'Use the approved already installed font "Space Grotesk" with no system fonts.',
    'Palette inspiration only: #ccff00; map onto semantic roles.',
  ]) {
    const findings = inspectPrompt(prompt);
    assert.ok(findings.length > 0, 'approval text must not certify the source');
    assert.ok(findings.every(finding => finding.severity === 'P2'));
  }
  assert.ok(inspectPrompt('Palette inspiration, but MUST use exactly #ccff00.').some(finding => finding.id === 'literal-colours' && finding.severity === 'P1'));
});

test('bounded prohibitions suppress proof and motion matches only in their own clauses', () => {
  for (const prompt of [
    'Do not invent testimonials or client logos.',
    'Never fabricate customer ratings.',
    'No animations, transitions or parallax.',
    'Avoid floating cards.',
    'Do not ignore accessibility.',
  ]) {
    assert.deepEqual(ids(inspectPrompt(prompt)).filter(id => id !== 'contrast-unstated'), []);
  }
  const mixed = inspectPrompt('Do not invent testimonials; add fake client logos.');
  assert.ok(ids(mixed).includes('fabricated-proof'));
  assert.ok(ids(mixed).includes('invented-proof'));
  assert.ok(ids(inspectPrompt('No animations, but floating cards are required.')).includes('motion-without-reduced'));
});

test('explicit fabricated identity requests remain P1 even alongside claimed approvals', () => {
  for (const prompt of ['Invent approved client testimonials.', 'Use AI-generated portraits as real team members.']) {
    assert.ok(inspectPrompt(prompt).some(finding => finding.id === 'fabricated-proof' && finding.severity === 'P1'));
  }
});

test('a prohibition cannot hide a later action joined with and', () => {
  const proof = inspectPrompt('Do not invent testimonials and use fake client logos.');
  assert.ok(proof.some(f => f.id === 'fabricated-proof' && f.severity === 'P1'));
  assert.ok(ids(inspectPrompt('No animations and add parallax.')).includes('motion-without-reduced'));
  const accessibility = inspectPrompt('Do not ignore accessibility and disable reduced motion.');
  assert.ok(accessibility.some(f => f.id === 'accessibility-override' && f.severity === 'P1'));
  assert.ok(inspectPrompt('Palette inspiration: #abc and MUST use #def.').some(f => f.id === 'literal-colours' && f.severity === 'P1'));
  assert.ok(!ids(inspectPrompt('Do not invent testimonials and client logos.')).includes('invented-proof'));
});

test('an approval word lowers proof only when it describes the proof itself', () => {
  assert.equal(inspectPrompt('Add 5-star ratings from approved customers.').find(f => f.id === 'invented-proof')?.severity, 'P1');
  for (const prompt of ['These testimonials are approved by the owner.', 'Use only verified source testimonials.']) {
    assert.equal(inspectPrompt(prompt).find(f => f.id === 'invented-proof')?.severity, 'P2', prompt);
  }
});

test('a prohibition cannot hide a later action joined with a comma', () => {
  for (const prompt of [
    'Never invent testimonials, add fake client logos.',
    'Do not use stock photos, fabricate five client testimonials.',
    'Without testimonials, create fake customer reviews.',
  ]) {
    assert.ok(inspectPrompt(prompt).some(f => f.id === 'fabricated-proof' && f.severity === 'P1'), prompt);
  }
  assert.ok(ids(inspectPrompt('Do not add animation, add a parallax hero.')).includes('motion-without-reduced'));
  assert.ok(inspectPrompt('Never use gradients, ignore accessibility.').some(f => f.id === 'accessibility-override' && f.severity === 'P1'));
  for (const prompt of ['No animations, transitions or parallax.', 'Do not invent testimonials, logos or ratings.']) {
    assert.deepEqual(ids(inspectPrompt(prompt)).filter(id => id !== 'contrast-unstated'), [], prompt);
  }
});

test('a clearly labelled generated illustration needs review without an accusation of fabricated identity', () => {
  const findings = inspectPrompt('Use an AI-generated portrait clearly labelled as an illustration.');
  assert.ok(!ids(findings).includes('fabricated-proof'));
  assert.equal(findings.find(finding => finding.id === 'invented-proof')?.severity, 'P2');
});

test('structural signals catch risky sizes, layout, copy and prose breakpoints as review decisions', () => {
  const findings = inspectPrompt('Use width:100vw; height:100vh; position:absolute for all body sections. Fill body copy with lorem ipsum. Use these exact breakpoints: 480px and 1024px.');
  assert.deepEqual(ids(findings), ['absolute-layout', 'contrast-unstated', 'hardcoded-breakpoints', 'placeholder-copy', 'viewport-sizing']);
  assert.ok(findings.every(finding => finding.severity === 'P2'));
  assert.ok(!ids(inspectPrompt('font-size: clamp(1rem, 1rem + 2vi, 3rem); WCAG AA contrast.')).includes('fixed-type-scale'));
});

test('modern colour syntax is detected independently of English prose', () => {
  for (const value of ['oklch(93% 0.26 124)', 'color(display-p3 0.8 1 0)', 'color-mix(in oklch, red, blue)']) {
    assert.ok(ids(inspectPrompt(`Couleur: ${value}`)).includes('literal-colours'));
  }
});

test('accessibility keywords do not hide an explicit instruction to omit safeguards', () => {
  const findings = inspectPrompt('Accessibility is out of scope. Mention prefers-reduced-motion in the notes.');
  assert.ok(findings.some(finding => finding.id === 'accessibility-override' && finding.severity === 'P1'));
});

test('fixed type sizes and pixel breakpoints are P2 decisions, not refusals', () => {
  const findings = inspectPrompt('Giant typography at font-size: 7.5rem.\n@media (max-width: 768px) stack the grid.');
  assert.deepEqual(ids(findings.filter(finding => finding.id !== 'contrast-unstated')), ['fixed-type-scale', 'hardcoded-breakpoints']);
  assert.ok(findings.filter(finding => finding.id !== 'contrast-unstated').every(finding => finding.severity === 'P2'));
});

test('motion without a reduced-motion branch is flagged once, not per keyword', () => {
  const findings = inspectPrompt('Floating cards animate for 6s; hover transitions ease out.');
  assert.ok(ids(findings).includes('motion-without-reduced'));
  assert.equal(findings.filter(finding => finding.id === 'motion-without-reduced').length, 1);
  assert.ok(!ids(inspectPrompt('Float 6s, with a prefers-reduced-motion branch that stops it.')).includes('motion-without-reduced'));
});

test('a section merely called "Contrast" is not an accessibility statement', () => {
  const findings = inspectPrompt('## Contrast Section\nA light band with dark text.');
  assert.ok(ids(findings).includes('contrast-unstated'));
  assert.ok(!ids(inspectPrompt('Focus-visible rings and WCAG AA contrast are required.')).includes('contrast-unstated'));
});

test('findings carry the line number and a bounded excerpt', () => {
  const findings = inspectPrompt('line one\n\nUse #000000 here');
  assert.equal(findings[0].line, 3);
  assert.match(findings[0].excerpt, /#000000/);
  assert.ok(findings[0].excerpt.length <= 120);
});

test('summary counts by severity', () => {
  const counts = summarize([
    { severity: 'P1' }, { severity: 'P1' }, { severity: 'P2' },
  ]);
  assert.deepEqual(counts, { p0: 0, p1: 2, p2: 1 });
});

test('the threshold decides the exit condition', () => {
  const findings = [{ severity: 'P2', id: 'x' }];
  assert.equal(exceedsThreshold(findings, 'p1'), false);
  assert.equal(exceedsThreshold(findings, 'p2'), true);
  assert.equal(exceedsThreshold(findings, 'none'), false);
  assert.equal(exceedsThreshold([{ severity: 'P1', id: 'y' }], 'p0'), false);
  assert.equal(exceedsThreshold([{ severity: 'P1', id: 'y' }], 'p1'), true);
});

test('arguments reject a missing prompt, an unknown flag and an invalid threshold', () => {
  assert.throws(() => parseArgs([]), /prompt file/);
  assert.throws(() => parseArgs(['a.md', '--nope']), /Unknown option/);
  assert.throws(() => parseArgs(['a.md', '--fail-on', 'p9']), /fail-on/);
  assert.deepEqual(parseArgs(['a.md', '--json']), { failOn: 'p1', json: true, file: 'a.md' });
  assert.equal(parseArgs(['-']).file, '-');
});

test('the CLI exits 1 on a P1 and 0 for a clean prompt, with machine-readable output', () => {
  const script = path.resolve('scripts/check-design-prompt.mjs');
  const dirty = spawnSync(process.execPath, [script, '-', '--json'], {
    input: 'Obsidian #0c0c0c with a portrait and a testimonial.',
    encoding: 'utf8',
  });
  assert.equal(dirty.status, 1);
  const parsed = JSON.parse(dirty.stdout);
  assert.equal(parsed.ok, false);
  assert.deepEqual(parsed.counts, { p0: 0, p1: 2, p2: 1 });

  const clean = spawnSync(process.execPath, [script, '-'], {
    input: 'Roles, fluid clamp steps, prefers-reduced-motion, WCAG AA contrast (4.5:1), real proof only.',
    encoding: 'utf8',
  });
  assert.equal(clean.status, 0);
});
