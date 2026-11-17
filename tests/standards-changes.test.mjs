import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isShipped, largestBump, upstreamNote, nextVersion, noteTemplate, parseNote, readNotes, requireNote, validateNote } from '../scripts/standards-changes.mjs';
import { changesSection, compareVersions, groupOf, prepareRelease, releaseNotesText } from '../scripts/standards-release.mjs';
import { compareDistribution, distributionLags, distributionOf, skillTreeHash } from '../scripts/standards-distribution.mjs';

// Portable: throwaway folders and one throwaway Git repository; no network.
const put = (root, file, value) => { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n'); };
const note = (meta, body = 'What changed.\n\n## For sites\n\nRun the sync.') => `---\n${Object.entries(meta).filter(([key]) => key !== 'title').map(([key, value]) => `${key}: ${Array.isArray(value) ? `[${value.join(', ')}]` : value}`).join('\n')}\n---\n\n# ${meta.title ?? 'A change'}\n\n${body}\n`;
const valid = { bump: 'minor', platforms: ['emdash', 'static'], areas: ['skills'], adoption: 'sync', visible: 'no', database: 'no' };

test('notes parse, validate and template themselves', () => {
  const parsed = parseNote(note(valid));
  assert.deepEqual(parsed.meta, { bump: 'minor', platforms: ['emdash', 'static'], areas: ['skills'], adoption: 'sync', visible: false, database: false });
  assert.equal(parsed.title, 'A change');
  assert.match(parsed.body, /^What changed\./);
  assert.deepEqual(validateNote(parsed), []);
  assert.deepEqual(validateNote(parseNote(noteTemplate({ title: 'Fresh' }))), [], 'the template is itself a valid note');
  const problems = validateNote(parseNote(note({ ...valid, bump: 'huge', platforms: ['wordpress'], adoption: 'copy', visible: 'maybe' })), 'bad.md');
  assert.ok(problems.some(p => /bump must be one of/.test(p)));
  assert.ok(problems.some(p => /platforms: unknown value wordpress/.test(p)));
  assert.ok(problems.some(p => /visible must be yes or no/.test(p)));
  assert.ok(problems.some(p => /adoption: copy needs a files list/.test(p)));
  assert.deepEqual(validateNote(parseNote('---\nbump: none\n---\n\n# Test-only refactor\n')), [], 'a no-impact note needs only a title');
  assert.throws(() => parseNote('# no front matter'), /missing front matter/);
  assert.throws(() => parseNote('---\nbump: minor\nbump: patch\n---\n# x\n'), /appears twice/);
});

test('bumps order, versions advance like 0.x semver, and shipped paths require a note', () => {
  assert.equal(largestBump([{ meta: { bump: 'patch' } }, { meta: { bump: 'minor' } }, { meta: { bump: 'none' } }]), 'minor');
  assert.equal(largestBump([]), 'none');
  assert.equal(nextVersion('0.2.1', 'patch'), '0.2.2');
  assert.equal(nextVersion('0.2.1', 'minor'), '0.3.0');
  assert.equal(nextVersion('0.2.1', 'major'), '0.3.0', 'below 1.0 a breaking change raises the minor number');
  assert.equal(nextVersion('1.4.2', 'major'), '2.0.0');
  assert.equal(compareVersions('0.10.0', '0.9.9') > 0, true);
  for (const file of ['.agents/skills/impeccable/SKILL.md', 'src/components/Card.astro', 'scripts/audit-ui.mjs', 'package-lock.json', 'docs/commands.md', 'profiles/manifests/shared.json']) assert.equal(isShipped(file), true, file);
  for (const file of ['tests/fleet-status.test.mjs', 'audit/x.md', 'docs/plans/next.md', '.github/workflows/design-checks.yml', 'standards/changes/a.md']) assert.equal(isShipped(file), false, file);
  assert.equal(requireNote(['scripts/audit-ui.mjs']).missing, true);
  assert.equal(requireNote(['scripts/audit-ui.mjs', 'standards/changes/audit-ui-fix.md']).missing, false);
  assert.equal(requireNote(['scripts/audit-ui.mjs', 'standards/releases/0.3.0.md']).missing, false, 'a release consumes the notes');
  assert.equal(requireNote(['tests/a.test.mjs']).missing, false);
});

test('release notes group changes by what they ask of a site and keep hand-written text', () => {
  const notes = [
    { slug: 'db', title: 'Migration', meta: { ...valid, adoption: 'manual', database: true, visible: true }, body: 'Run it.' },
    { slug: 'look', title: 'Headings grow', meta: { ...valid, adoption: 'manual', visible: true, database: false }, body: 'Review.\n\n## For sites\n\nMerge.' },
    { slug: 'copy', title: 'New audit', meta: { ...valid, adoption: 'copy', files: ['scripts/audit-ui.mjs'], visible: false, database: false }, body: 'Copy it.' },
    { slug: 'quiet', title: 'Refactor', meta: { bump: 'none' }, body: '' },
  ];
  assert.deepEqual(notes.map(groupOf), ['database', 'visible', 'copy', 'none']);
  const section = changesSection(notes, '0.3.0');
  assert.ok(section.indexOf('### Needs a database step') < section.indexOf('### Changes how pages look'));
  assert.match(section, /#### New audit\n\n_EmDash and static · skills · Copy the named files into the site · files: `scripts\/audit-ui\.mjs`_/);
  assert.match(section, /##### For sites/, 'note headings sit below the entry heading');
  assert.match(section, /### No site action\n\n- Refactor/);
  const fresh = releaseNotesText(null, section, { version: '0.3.0', title: 'Tokens', date: '2026-11-18' });
  assert.match(fresh, /^# Standards 0\.3\.0 — Tokens\n\nReviewed 2026-11-18/);
  const edited = fresh.replace('Reviewed 2026-11-18.', 'Reviewed 2026-11-18. Hand-written evidence.');
  const regenerated = releaseNotesText(edited, changesSection(notes.slice(0, 1), '0.3.0'), { version: '0.3.0' });
  assert.match(regenerated, /Hand-written evidence\./);
  assert.doesNotMatch(regenerated, /New audit/, 'the generated section is replaced, not appended');
});

test('distribution pins skills and helpers by normalized content and compares a site', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'standards-distribution-'));
  try {
    const baseline = path.join(dir, 'baseline'), site = path.join(dir, 'site');
    for (const root of [baseline, site]) {
      put(root, '.agents/skills/impeccable/SKILL.md', 'one\ntwo\n');
      put(root, '.emdash/impeccable-source.json', { declaredSkillVersion: root === baseline ? '4.9.2' : '4.8.1', launcherVersion: '0.1.25', upstreamCommitSha: 'a'.repeat(40) });
      put(root, 'scripts/skill-sync.mjs', 'export {};\n');
    }
    put(baseline, '.agents/skills/site-art-direction/SKILL.md', 'new\n');
    put(site, '.agents/skills/site-art-direction/SKILL.md', 'old\n');
    put(baseline, '.agents/skills/emdash-cli/SKILL.md', 'cli\n');
    put(baseline, '.agents/skills/penpot-site-design/SKILL.md', 'optional\n');
    writeFileSync(path.join(site, '.agents/skills/impeccable/SKILL.md'), 'one\r\ntwo\r\n');
    put(site, '.agents/skills/impeccable/scripts/bin/linux-x64/impeccable', 'cached engine');
    put(site, 'scripts/audit-ui.mjs', 'site copy\n');
    const pins = distributionOf(baseline);
    assert.deepEqual(Object.keys(pins.skills), ['emdash-cli', 'impeccable', 'penpot-site-design', 'site-art-direction']);
    assert.equal(skillTreeHash(path.join(site, '.agents/skills'), 'impeccable').sha256, pins.skills.impeccable.sha256, 'CRLF and the engine cache do not count');
    const emdash = compareDistribution(site, pins, 'emdash');
    assert.deepEqual(emdash.skills, { current: ['impeccable'], differs: ['site-art-direction'], missing: ['emdash-cli'], optionalAbsent: ['penpot-site-design'] });
    assert.deepEqual(emdash.tools, { current: ['scripts/skill-sync.mjs'], differs: [] }, 'helpers the release does not ship are ignored');
    assert.deepEqual(compareDistribution(site, pins, 'static').skills.missing, [], 'static sites are not asked for EmDash skills');
    assert.deepEqual(distributionLags(emdash), ['skills not installed: emdash-cli', 'skills differ from the release: site-art-direction', 'Impeccable 4.8.1 (release has 4.9.2)']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a release pins the manifest, the audit digest and the schemas, writes notes and consumes them', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'standards-release-'));
  try {
    put(dir, '.agents/skills/impeccable/SKILL.md', 'skill\n');
    put(dir, '.emdash/impeccable-source.json', { declaredSkillVersion: '4.9.2', launcherVersion: '0.1.25', upstreamCommitSha: 'a'.repeat(40) });
    put(dir, 'scripts/skill-sync.mjs', 'export {};\n');
    put(dir, 'standards/manifest.json', { schemaVersion: 1, standardsVersion: '0.2.1', status: 'certified-scoped', certification: { scope: 'test' } });
    put(dir, 'scripts/audit-site.mjs', "export const STANDARD = Object.freeze({ version: '0.2.1', commit: 'x', sha256: 'y' });\n");
    const schema = '{\n  "properties": {\n    "standards": {\n      "properties": {\n        "version": { "enum": ["0.2.1"] }, "commit": { "enum": ["x"] },\n        "sha256": { "enum": ["y"] }, "source": { "type": "string" }\n      }\n    }\n  }\n}\n';
    put(dir, 'standards/site-audit-report.schema.json', schema);
    put(dir, 'standards/changes/skills.md', note({ ...valid, title: 'Impeccable 4.9.2' }));
    put(dir, 'standards/changes/quiet.md', '---\nbump: none\n---\n\n# Test refactor\n');
    execFileSync('git', ['-C', dir, 'init', '-q']);
    execFileSync('git', ['-C', dir, 'add', '-A']);
    execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-q', '-m', 'certified']);
    const commit = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

    assert.throws(() => prepareRelease({ root: dir, version: '0.2.2', sourceCommit: commit }), /minor change, so the release is at least 0\.3\.0/);
    assert.throws(() => prepareRelease({ root: dir, version: '0.3.0', sourceCommit: 'abc' }), /full 40-character/);
    put(dir, '.agents/skills/impeccable/SKILL.md', 'edited after certification\n');
    assert.throws(() => prepareRelease({ root: dir, version: '0.3.0', sourceCommit: commit }), /differs from .* in distributed files/);
    put(dir, '.agents/skills/impeccable/SKILL.md', 'skill\n');

    const dry = prepareRelease({ root: dir, version: '0.3.0', sourceCommit: commit, date: '2026-11-18', dryRun: true });
    assert.equal(existsSync(path.join(dir, 'standards/baselines/0.3.0.json')), false, 'a dry run writes nothing');
    assert.match(dry.releaseNotesText, /#### Impeccable 4\.9\.2/);

    const result = prepareRelease({ root: dir, version: '0.3.0', sourceCommit: commit, date: '2026-11-18', title: 'Notes' });
    const baselineText = readFileSync(path.join(dir, 'standards/baselines/0.3.0.json'), 'utf8');
    assert.equal(baselineText, readFileSync(path.join(dir, 'standards/manifest.json'), 'utf8'), 'the release copy is the manifest');
    const manifest = JSON.parse(baselineText);
    assert.deepEqual([manifest.standardsVersion, manifest.stableReleaseRef, manifest.reviewedAt, manifest.certification.sourceCommit, manifest.certification.scope], ['0.3.0', 'refs/tags/standards-v0.3.0', '2026-11-18', commit, 'test']);
    assert.equal(manifest.distribution.impeccable.skillVersion, '4.9.2');
    assert.deepEqual(manifest.changes.map(change => [change.slug, change.bump]), [['quiet', 'none'], ['skills', 'minor']]);
    const digest = createHash('sha256').update(baselineText).digest('hex');
    assert.equal(result.digest, digest);
    assert.match(readFileSync(path.join(dir, 'scripts/audit-site.mjs'), 'utf8'), new RegExp(`version: '0\\.3\\.0', commit: '${commit}', sha256: '${digest}'`));
    const updatedSchema = readFileSync(path.join(dir, 'standards/site-audit-report.schema.json'), 'utf8');
    assert.match(updatedSchema, /"version": \{ "enum": \["0\.2\.1", "0\.3\.0"\] \}, "commit": \{ "enum": \["x", "[0-9a-f]{40}"\] \},/, 'the one-line enum layout is kept');
    assert.match(readFileSync(path.join(dir, 'standards/releases/0.3.0.md'), 'utf8'), /^# Standards 0\.3\.0 — Notes[\s\S]*### Arrives with the site's sync[\s\S]*### No site action\n\n- Test refactor/);
    assert.deepEqual(readNotes(path.join(dir, 'standards/changes')), [], 'the notes are consumed');
    assert.throws(() => prepareRelease({ root: dir, version: '0.4.0', sourceCommit: commit }), /no change notes/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the weekly upstream job writes a valid note only when something changed', () => {
  assert.equal(upstreamNote({}), null);
  const text = upstreamNote({ dependencies: true, skills: ['creating-plugins', 'impeccable'], impeccable: { from: '4.8.1', to: '4.9.2' } });
  const parsed = parseNote(text);
  assert.deepEqual(validateNote(parsed), []);
  assert.deepEqual([parsed.meta.bump, parsed.meta.adoption, parsed.meta.areas], ['patch', 'sync', ['dependencies', 'skills']]);
  assert.match(parsed.body, /Impeccable moves from 4.8.1 to 4.9.2/);
  assert.equal(parseNote(upstreamNote({ dependencies: true })).meta.adoption, 'none');
});
