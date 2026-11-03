import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { syncImpeccable } from './sync-impeccable-skill.mjs';
import { runSync } from './skill-sync.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function syncUpstreamSkills(root = ROOT, options = {}) {
  const isCheck = options.check ?? false;
  const results = {
    impeccable: null,
    emdash: null
  };

  // 1. Impeccable
  try {
    results.impeccable = await syncImpeccable(root, { check: isCheck });
  } catch (err) {
    results.impeccable = { status: 'error', message: err.message };
  }

  // 2. EmDash skills
  try {
    const emdashCheck = await runSync(root, 'emdash', ['--check']);
    if (isCheck) {
      results.emdash = emdashCheck;
    } else if (emdashCheck.status === 'update-available' && (emdashCheck.conflicts?.length ?? 0) === 0) {
      const staged = await runSync(root, 'emdash', ['--stage']);
      const applied = await runSync(root, 'emdash', ['--apply', staged.stageId]);
      results.emdash = { status: 'applied', commitSha: emdashCheck.commitSha, details: applied };
    } else {
      results.emdash = emdashCheck;
    }
  } catch (err) {
    results.emdash = { status: 'error', message: err.message };
  }

  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const isCheck = process.argv.includes('--check');
    const result = await syncUpstreamSkills(ROOT, { check: isCheck });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
