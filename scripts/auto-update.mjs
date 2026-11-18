import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { collectUpdates } from './check-upstream-updates.mjs';
import { runSync } from './skill-sync.mjs';
import { syncImpeccable } from './sync-impeccable-skill.mjs';
import { applySveltiaPin, SVELTIA_PACKAGE } from './sveltia-pin.mjs';
import { execNpmSync } from './process-runner.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(args, cwd = ROOT) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export async function autoUpdate(root = ROOT, options = {}) {
  console.log('🔍 Checking for upstream updates across packages, skills, Impeccable and pinned CDN scripts...');
  const report = await collectUpdates(root);

  const packageUpdates = report.packages.filter(p => p.upstreamStatus === 'update-available');
  const skillUpdates = report.skills.filter(s => s.status === 'review-required');
  const pinUpdates = (report.pins ?? []).filter(p => p.upstreamStatus === 'update-available');

  console.log(`📦 Packages with updates: ${packageUpdates.length}`);
  console.log(`✨ Skills with updates: ${skillUpdates.length}`);
  console.log(`📌 Pinned CDN scripts with updates: ${pinUpdates.length}`);

  if (packageUpdates.length === 0 && skillUpdates.length === 0 && pinUpdates.length === 0) {
    console.log('✔ Everything is already up to date!');
    return { updated: false, changes: [] };
  }

  const appliedChanges = [];

  // 1. Sync EmDash skills if available
  const emdashSkill = skillUpdates.find(s => s.kind === 'emdash');
  if (emdashSkill) {
    console.log('📥 Syncing EmDash skills from upstream...');
    try {
      const stage = await runSync(root, 'emdash', ['--stage']);
      if (stage?.stageId && stage.conflicts.length === 0) {
        await runSync(root, 'emdash', ['--apply', stage.stageId]);
        appliedChanges.push(`EmDash skills -> ${emdashSkill.availableCommit.slice(0, 7)}`);
        console.log('✔ EmDash skills updated.');
      } else {
        console.log('⚠ EmDash skills have conflicts; staging preserved for review.');
      }
    } catch (err) {
      console.warn('Failed to sync EmDash skills:', err.message);
    }
  }

  // 2. Sync Impeccable skill if available
  const impeccableSkill = skillUpdates.find(s => s.kind === 'impeccable');
  if (impeccableSkill) {
    console.log(`📥 Syncing Impeccable skill (${impeccableSkill.recordedVersion} -> ${impeccableSkill.availableVersion})...`);
    try {
      const result = await syncImpeccable(root);
      if (result.status === 'applied') {
        appliedChanges.push(`Impeccable skill -> ${result.version}`);
        console.log('✔ Impeccable skill updated.');
      }
    } catch (err) {
      console.warn('Failed to sync Impeccable skill:', err.message);
    }
  }

  // 3. Move the Sveltia CMS pin (a CDN script that npm update never sees)
  let profilesAffected = false;
  const sveltiaPin = pinUpdates.find(p => p.name === SVELTIA_PACKAGE);
  if (sveltiaPin) {
    console.log(`📥 Moving the Sveltia CMS pin (${sveltiaPin.pinned} -> ${sveltiaPin.availableStable}) and recomputing its integrity...`);
    try {
      const result = await applySveltiaPin(root, { version: sveltiaPin.availableStable });
      if (result.status === 'applied') {
        appliedChanges.push(`Sveltia CMS ${result.from} -> ${result.to} (${result.integrity})`);
        profilesAffected = true;
        console.log('✔ Sveltia CMS pin moved.');
      }
    } catch (err) {
      console.warn('Failed to move the Sveltia CMS pin:', err.message);
    }
  }

  // Check if any files were changed on disk
  const status = git(['status', '--porcelain']);
  if (!status) {
    console.log('No file changes resulted from the update.');
    return { updated: false, changes: appliedChanges };
  }

  console.log('\n🧪 Running verification suite (lint, schema budget, tests, build)...');
  try {
    execNpmSync(['run', 'lint'], { cwd: root, stdio: 'inherit' });
    execNpmSync(['run', 'check:schema-budget'], { cwd: root, stdio: 'inherit' });
    execFileSync(process.execPath, ['--test', 'tests/meta-review.test.mjs', 'tests/audit-coverage.test.mjs'], { cwd: ROOT, stdio: 'inherit' });
    // A moved editor pin is only proposed once both generated static profiles install, build and serve.
    if (profilesAffected) execNpmSync(['run', 'test:profiles'], { cwd: root, stdio: 'inherit' });
    console.log('✔ Verification suite passed!');
  } catch (err) {
    console.error('❌ Verification failed after updates!');
    if (options.revertOnFailure) {
      console.log('⏪ Reverting working tree to clean state...');
      git(['checkout', '.']);
    }
    throw err;
  }

  return { updated: true, changes: appliedChanges };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const isApply = process.argv.includes('--apply');
    const result = await autoUpdate(ROOT, { apply: isApply, revertOnFailure: process.argv.includes('--revert') });
    console.log('\nResult:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
