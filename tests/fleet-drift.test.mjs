import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { contentHash, historyHashes, classifySite, patchFor, fleetDrift, formatDrift, ownedSkills } from '../scripts/fleet-drift.mjs';

const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();
const write = (dir, file, text) => { fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true }); fs.writeFileSync(path.join(dir, file), text); };

// A throwaway Baseline with two versions of one skill file, a helper, an upstream mirror, and a
// release that points at the first version.
function fixture(run) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-drift-'));
  try {
    const baseline = path.join(temporary, 'baseline');
    fs.mkdirSync(baseline);
    git(baseline, 'init', '-q');
    git(baseline, 'config', 'user.email', 'test@example.test');
    git(baseline, 'config', 'user.name', 'Test');
    git(baseline, 'config', 'core.autocrlf', 'false');
    write(baseline, '.agents/skills/site-guide/SKILL.md', 'Version one.\n');
    write(baseline, '.agents/skills/site-guide/references/a.md', 'Reference A.\n');
    write(baseline, '.agents/skills/upgrading-emdash/SKILL.md', 'Upstream mirror.\n');
    write(baseline, 'scripts/audit-ui.mjs', 'export const v = 1;\n');
    git(baseline, 'add', '-A'); git(baseline, 'commit', '-q', '-m', 'one');
    const first = git(baseline, 'rev-parse', 'HEAD');
    write(baseline, 'standards/baselines/1.0.0.json', JSON.stringify({ certification: { sourceCommit: first } }));
    write(baseline, '.agents/skills/site-guide/SKILL.md', 'Version two.\n');
    git(baseline, 'add', '-A'); git(baseline, 'commit', '-q', '-m', 'two');
    const site = path.join(temporary, 'sites', 'example-site');
    write(site, '.agents/skills/site-guide/SKILL.md', 'Version one.\r\n');            // known, CRLF copy of v1
    write(site, '.agents/skills/site-guide/references/a.md', 'Reference A, improved.\n'); // changed
    write(site, '.agents/skills/site-guide/references/local.md', 'Site note.\n');      // added
    write(site, '.agents/skills/upgrading-emdash/SKILL.md', 'Edited mirror.\n');       // mirror: ignored
    write(site, 'scripts/audit-ui.mjs', 'export const v = 1;\n');                     // known helper
    write(temporary, 'private/fleet.json', JSON.stringify({ sites: [{ id: 'example-site', path: '../sites/example-site', adopted: { standards: '1.0.0' } }] }));
    return run({ temporary, baseline, site });
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}

test('content hashes compare text as LF and binary as bytes', () => {
  assert.equal(contentHash(Buffer.from('a\r\nb\n')), contentHash(Buffer.from('a\nb\n')));
  assert.notEqual(contentHash(Buffer.from([0, 1, 13, 10])), contentHash(Buffer.from([0, 1, 10])));
});

test('site files sort into known, changed and added against every version in Baseline history', () => fixture(({ baseline, site }) => {
  const history = historyHashes(baseline, ['.agents/skills', 'scripts/audit-ui.mjs']);
  assert.equal(history.get('.agents/skills/site-guide/SKILL.md').size, 2, 'both versions are known');
  assert.deepEqual(ownedSkills(baseline), ['site-guide'], 'upstream mirrors are not Baseline-owned');
  const result = classifySite(site, history, ownedSkills(baseline), ['scripts/audit-ui.mjs']);
  assert.deepEqual(result, {
    known: ['.agents/skills/site-guide/SKILL.md', 'scripts/audit-ui.mjs'],
    changed: ['.agents/skills/site-guide/references/a.md'],
    added: ['.agents/skills/site-guide/references/local.md'],
  });
}));

test('a patch is a labelled LF diff from Baseline\'s copy to the site\'s', () => {
  const patch = patchFor('.agents/skills/x/SKILL.md', Buffer.from('one\r\ntwo\n'), Buffer.from('one\nthree\n'));
  assert.match(patch, /^diff --git a\/\.agents\/skills\/x\/SKILL\.md b\/\.agents\/skills\/x\/SKILL\.md$/m);
  assert.match(patch, /^--- a\/\.agents\/skills\/x\/SKILL\.md$/m);
  assert.match(patch, /^-two$/m);
  assert.match(patch, /^\+three$/m);
  assert.doesNotMatch(patch, /^-one/m, 'CRLF alone is not a change');
  assert.equal(patchFor('img.png', Buffer.from([0, 1]), Buffer.from([0, 2])), 'Binary file img.png differs\n');
});

test('fleet:drift writes patches against the adopted release and refuses output inside Baseline or a site', () => fixture(({ temporary, baseline, site }) => {
  const config = path.join(temporary, 'private/fleet.json');
  const out = path.join(temporary, 'private/drift');
  const [report] = fleetDrift({ config, out, baselineRoot: baseline });
  assert.deepEqual(report.changed, ['.agents/skills/site-guide/references/a.md']);
  assert.deepEqual(report.added, ['.agents/skills/site-guide/references/local.md']);
  assert.equal(report.patches[0].against.length, 12, 'compared with the release commit');
  const patch = fs.readFileSync(path.join(out, 'example-site/.agents/skills/site-guide/references/a.md.patch'), 'utf8');
  assert.match(patch, /^-Reference A\.$/m);
  assert.match(patch, /^\+Reference A, improved\.$/m);
  const added = fs.readFileSync(path.join(out, 'example-site/.agents/skills/site-guide/references/local.md.patch'), 'utf8');
  assert.match(added, /^\+Site note\.$/m);
  const summary = fs.readFileSync(path.join(out, 'DRIFT.md'), 'utf8');
  assert.match(summary, /\| `\.agents\/skills\/site-guide\/references\/a\.md` \| changed \|/);
  assert.match(summary, /keep this folder private/);
  assert.throws(() => fleetDrift({ config, out: path.join(baseline, 'drift'), baselineRoot: baseline }), /outside the Baseline checkout/);
  assert.throws(() => fleetDrift({ config, out: path.join(site, 'drift'), baselineRoot: baseline }), /outside the site checkout of example-site/);
  assert.throws(() => fleetDrift({ config, out, site: 'nope', baselineRoot: baseline }), /no site with id nope/);
}));

test('the summary says when a site has no local changes or no checkout', () => {
  const text = formatDrift([{ id: 'a', adopted: null, known: 3, changed: [], added: [], patches: [] }, { id: 'b', missing: true }]);
  assert.match(text, /## a\n\nAdopted release: not recorded \(compared with the Baseline checkout\)\. 3 files match a Baseline version\.\n\nNo local changes\./);
  assert.match(text, /## b\n\nCheckout not found\./);
});
