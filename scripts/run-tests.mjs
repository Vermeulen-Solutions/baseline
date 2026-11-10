import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const TEST_TIERS = Object.freeze(['unit', 'rehearsal']);
// Keep CPU-heavy build/install/Git rehearsals away from sub-second HTML checks.
// Every caller that runs a tier uses these values, so local and CI runs agree.
const TIER_CONCURRENCY = Object.freeze({ unit: 2, rehearsal: 1 });

// Hooks export repository/index locations. Git fixtures must discover their own
// repository from cwd, never inherit the committing worktree's metadata or index.
export function testEnvironment(environment = process.env) {
  return Object.fromEntries(Object.entries(environment).filter(([key]) => !/^GIT_/i.test(key)));
}

export function testFiles(tier, directory = 'tests') {
  if (!TEST_TIERS.includes(tier)) throw new Error('Use --tier unit or --tier rehearsal.');
  const inventory = JSON.parse(readFileSync(`${directory}/test-tiers.json`, 'utf8'));
  const files = readdirSync(directory).filter(file => file.endsWith('.test.mjs')).sort();
  const unclassified = files.filter(file => !Object.hasOwn(inventory, file));
  const orphaned = Object.keys(inventory).filter(file => !files.includes(file)).sort();
  if (unclassified.length || orphaned.length) {
    throw new Error([
      `Test tier inventory is stale. Classify every ${directory}/*.test.mjs file in ${directory}/test-tiers.json.`,
      ...(unclassified.length ? [`  Not classified: ${unclassified.join(', ')}`] : []),
      ...(orphaned.length ? [`  Classified but missing on disk: ${orphaned.join(', ')}`] : []),
    ].join('\n'));
  }
  for (const [file, entry] of Object.entries(inventory)) {
    if (!TEST_TIERS.includes(entry.tier) || !entry.reason?.trim()) throw new Error(`Invalid test tier/reason: ${file}`);
  }
  const selected = files.filter(file => inventory[file].tier === tier).map(file => `${directory}/${file}`);
  if (!selected.length) throw new Error(`No tests in ${tier} tier.`);
  return selected;
}

/** The exact `node` arguments for one tier. Single source for run-tests and the fast CI check. */
export function testInvocation(tier, directory = 'tests') {
  const files = testFiles(tier, directory), concurrency = TIER_CONCURRENCY[tier];
  return { files, concurrency, args: ['--test', `--test-concurrency=${concurrency}`, ...files] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 4 || process.argv[2] !== '--tier' || !['all', ...TEST_TIERS].includes(process.argv[3])) throw new Error('Use --tier all, unit or rehearsal.');
    const tiers = process.argv[3] === 'all' ? TEST_TIERS : [process.argv[3]];
    // Preserve every test and its original performance budget.
    for (const tier of tiers) {
      const { files, concurrency, args } = testInvocation(tier);
      console.log(`Running ${files.length} ${tier} test files (concurrency ${concurrency}).`);
      const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: testEnvironment() });
      if (result.error) throw result.error;
      if (result.status !== 0) {
        const skipped = tiers.slice(tiers.indexOf(tier) + 1);
        console.error(`The ${tier} tier failed (exit ${result.status ?? result.signal}).${skipped.length ? ` Not run: ${skipped.join(', ')}.` : ''}`);
        process.exitCode = result.status ?? 1;
        break;
      }
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
