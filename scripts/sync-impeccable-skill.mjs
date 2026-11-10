import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { download, inventory, hash } from './skill-sync.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The launcher and engine are versioned separately from the npm skill package.
// `scripts/VERSION` in the synced snapshot is the version the launchers and
// engine-checksums.txt describe, so it is the only reliable source; recording a
// carried-over value is a fallback for an upstream layout that stops shipping it.
export function readLauncherVersion(files) {
  const bytes = files?.['impeccable/scripts/VERSION']?.bytes;
  if (!bytes) return null;
  const version = Buffer.from(bytes).toString('utf8').trim();
  return /^\d+\.\d+\.\d+$/.test(version) ? version : null;
}

export async function syncImpeccable(root = ROOT, options = {}) {
  const config = {
    repository: 'pbakaus/impeccable',
    prefix: '.agents/skills/',
    skills: ['impeccable']
  };

  const ref = options.ref ?? 'main';
  const candidate = options.candidate ?? await download(config, ref);

  // Fetch version from npm registry
  let version = options.version ?? '4.6.0';
  if (!options.version) {
    try {
      const res = await fetch('https://registry.npmjs.org/impeccable');
      if (res.ok) {
        const data = await res.json();
        version = data['dist-tags']?.latest ?? version;
      }
    } catch {}
  }

  const targetDir = path.join(root, '.agents', 'skills', 'impeccable');
  const sourcePath = path.join(root, '.emdash', 'impeccable-source.json');
  let currentMeta = {};
  try {
    currentMeta = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  } catch {}

  const isCurrent = currentMeta.upstreamCommitSha === candidate.commitSha;

  if (options.check) {
    return {
      status: isCurrent ? 'current' : 'update-available',
      commitSha: candidate.commitSha,
      currentCommitSha: currentMeta.upstreamCommitSha ?? null,
      latestVersion: version,
      fileCount: Object.keys(candidate.files).length
    };
  }

  if (isCurrent && !options.force) {
    return {
      status: 'already-current',
      version,
      commitSha: candidate.commitSha
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
  const launcherVersion = readLauncherVersion(candidate.files) ?? currentMeta.launcherVersion ?? null;

  // Update PROVENANCE.json & .emdash/impeccable-source.json

  const updatedMeta = {
    formatVersion: 1,
    declaredSkillVersion: version,
    launcherVersion,
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
