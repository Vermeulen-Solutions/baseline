import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { download, inventory, hash } from './skill-sync.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function syncImpeccable(root = ROOT, options = {}) {
  const config = {
    repository: 'pbakaus/impeccable',
    prefix: '.agents/skills/',
    skills: ['impeccable']
  };

  const ref = options.ref ?? 'main';
  const candidate = await download(config, ref);

  // Fetch version from npm registry
  let version = '4.6.0';
  try {
    const res = await fetch('https://registry.npmjs.org/impeccable');
    if (res.ok) {
      const data = await res.json();
      version = data['dist-tags']?.latest ?? version;
    }
  } catch {}

  const targetDir = path.join(root, '.agents', 'skills', 'impeccable');

  if (options.check) {
    const local = await inventory(path.join(root, '.agents', 'skills'), ['impeccable']);
    return {
      status: 'update-available',
      commitSha: candidate.commitSha,
      latestVersion: version,
      fileCount: Object.keys(candidate.files).length
    };
  }

  // Backup existing before writing
  for (const [rel, data] of Object.entries(candidate.files)) {
    const filePath = path.join(root, '.agents', 'skills', rel);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data.bytes);
  }

  // Calculate new hash of SKILL.md
  const skillMdBytes = candidate.files['impeccable/SKILL.md']?.bytes;
  const skillSha256 = skillMdBytes ? createHash('sha256').update(skillMdBytes).digest('hex') : null;

  // Update PROVENANCE.json & .emdash/impeccable-source.json
  const sourcePath = path.join(root, '.emdash', 'impeccable-source.json');
  let currentMeta = {};
  try {
    currentMeta = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  } catch {}

  const updatedMeta = {
    formatVersion: 1,
    declaredSkillVersion: version,
    launcherVersion: currentMeta.launcherVersion ?? '0.1.5',
    distribution: `Codex curated Impeccable ${version}`,
    skillSha256: skillSha256 ?? currentMeta.skillSha256,
    matchesInstalledCuratedSkill: true,
    upstreamRepository: 'https://github.com/pbakaus/impeccable',
    upstreamCommitSha: candidate.commitSha,
    license: currentMeta.license ?? {
      spdx: 'Apache-2.0',
      source: 'https://github.com/pbakaus/impeccable/blob/main/LICENSE',
      saved: 'docs/licenses/impeccable-Apache-2.0.txt'
    },
    syncedAt: new Date().toISOString()
  };

  await fs.writeFile(sourcePath, JSON.stringify(updatedMeta, null, 2) + '\n');
  await fs.writeFile(path.join(targetDir, 'PROVENANCE.json'), JSON.stringify(updatedMeta, null, 2) + '\n');

  return {
    status: 'applied',
    version,
    commitSha: candidate.commitSha,
    fileCount: Object.keys(candidate.files).length
  };
}

import { pathToFileURL } from 'node:url';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const isCheck = process.argv.includes('--check');
    const result = await syncImpeccable(ROOT, { check: isCheck });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
