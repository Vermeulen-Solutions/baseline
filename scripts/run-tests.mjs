import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function testFiles(tier, directory = 'tests') {
  if (!['unit', 'rehearsal'].includes(tier)) throw new Error('Use --tier unit or --tier rehearsal.');
  const inventory = JSON.parse(readFileSync(`${directory}/test-tiers.json`, 'utf8'));
  const files = readdirSync(directory).filter(file => file.endsWith('.test.mjs')).sort();
  const declared = Object.keys(inventory).sort();
  if (JSON.stringify(files) !== JSON.stringify(declared)) throw new Error('Test tier inventory is stale. Classify every tests/*.test.mjs file in tests/test-tiers.json.');
  for (const [file, entry] of Object.entries(inventory)) {
    if (!['unit', 'rehearsal'].includes(entry.tier) || !entry.reason?.trim()) throw new Error(`Invalid test tier/reason: ${file}`);
  }
  const selected = files.filter(file => inventory[file].tier === tier).map(file => `${directory}/${file}`);
  if (!selected.length) throw new Error(`No tests in ${tier} tier.`);
  return selected;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 4 || process.argv[2] !== '--tier') throw new Error('Use --tier unit or --tier rehearsal.');
    const tier = process.argv[3], files = testFiles(tier);
    console.log(`Running ${files.length} ${tier} test files.`);
    const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
