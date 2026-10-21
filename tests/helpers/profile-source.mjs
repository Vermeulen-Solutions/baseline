import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { profileManifest } from '../../profiles/contract.mjs';
import { applyTokenOverrides } from '../../scripts/design-system.mjs';

/** A synthetic generator input, never exemptions for the installed client site.
 * Generator behavior needs reviewed source bytes; a calibrated client correctly
 * no longer has starter exemptions. Live-site token/contrast checks still read src/.
 */
export async function profileSource() {
  const parent = await fs.mkdtemp(path.join(tmpdir(), 'baseline-profile-source-'));
  const root = path.join(parent, 'source');
  const dispose = async () => {
    assert.equal(path.dirname(parent), path.resolve(tmpdir()));
    assert.ok(path.basename(parent).startsWith('baseline-profile-source-'));
    await fs.rm(parent, { recursive: true, force: true });
  };
  try {
    const inputs = new Set(['package.json']), visual = new Set();
    for (const profile of ['static', 'static-sveltia']) {
      const manifest = profileManifest(profile);
      const mapping = new Map(manifest.files.map(file => [file, file]));
      for (const { source, target } of manifest.overrides) mapping.set(target, source);
      for (const file of manifest.skillFiles) mapping.set(file, file);
      for (const [target, source] of mapping) {
        inputs.add(source);
        if (/^(src|public)\//.test(target)) visual.add(source);
      }
    }
    const exceptions = [];
    for (const file of inputs) {
      let bytes = await fs.readFile(new URL('../../' + file, import.meta.url));
      if (file === 'src/styles/global.css') bytes = Buffer.from(applyTokenOverrides(bytes.toString('utf8'), 'neutral'));
      const target = path.join(root, file);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, bytes);
      if (visual.has(file)) exceptions.push({ path: file, reason: 'Synthetic input for generator regression tests only', sha256: createHash('sha256').update(bytes.toString('utf8').replaceAll('\r\n', '\n')).digest('hex') });
    }
    await fs.mkdir(path.join(root, 'audit'), { recursive: true });
    await fs.writeFile(path.join(root, 'audit/design-gate-exceptions.json'), JSON.stringify(exceptions, null, 2) + '\n');
    const git = (...args) => execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' });
    git('init', '--quiet'); git('config', 'core.autocrlf', 'false'); git('add', '.');
    git('-c', 'user.name=Baseline test', '-c', 'user.email=test@example.invalid', 'commit', '--quiet', '-m', 'Synthetic profile source');
    return { root, dispose };
  } catch (error) { await dispose(); throw error; }
}
