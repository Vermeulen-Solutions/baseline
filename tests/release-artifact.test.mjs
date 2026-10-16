import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { assertReleaseArtifact } from '../scripts/assert-release-artifact.mjs';

test('release gate rejects missing/fixture/unknown profiles and refuses a fixture command despite stale clean output', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'emdash-release-profile-'));
  try {
    await assert.rejects(assertReleaseArtifact(directory), { code: 'ENOENT' });
    for (const marker of [{ version: 1, profile: 'test-fixtures', deployable: false }, { version: 2, profile: 'release', deployable: true }, { version: 1, profile: 'release', deployable: false }]) {
      await writeFile(path.join(directory, '.starter-build.json'), JSON.stringify(marker));
      await assert.rejects(assertReleaseArtifact(directory), /Refusing fixture-enabled or unrecognized/);
    }
    await writeFile(path.join(directory, '.starter-build.json'), JSON.stringify({ version: 1, profile: 'release', deployable: true }));
    await assertReleaseArtifact(directory);
    const result = spawnSync(process.execPath, ['scripts/assert-release-artifact.mjs', directory], { cwd: process.cwd(), env: { ...process.env, ASTRO_TEST_FIXTURES: '1' }, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Release command refuses ASTRO_TEST_FIXTURES/);
  } finally {
    assert.equal(path.dirname(directory), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith('emdash-release-profile-'));
    await rm(directory, { recursive: true, force: true });
  }
});
