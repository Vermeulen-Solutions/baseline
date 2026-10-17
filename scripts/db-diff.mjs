import fs from 'node:fs';
import path from 'node:path';
import { inspectSQLite, compareSchemas, schemaMarkdown, saveSchema } from './sqlite-schema.mjs';
import { pullRemote } from './d1-snapshot.mjs';
import { validateSeed } from 'emdash';
import { argumentsOf, requireFact, jsonOf, newDirectory, writeJSON, isMain, failure } from './infrastructure-io.mjs';

export async function diffDatabase(options) {
  requireFact(options.local, 'An explicit closed local SQLite path is required');
  const left = inspectSQLite(options.local);
  const remoteFlags = ['config', 'env', 'account', 'database', 'remote-out'];
  if (options.capture) {
    requireFact(!options.snapshot && !options.seed && remoteFlags.every(flag => !options[flag]), 'Capture does not compare a second target/seed');
    const out = newDirectory(options.out); saveSchema(left, out);
    return { status: left.schema.unknown.length ? 'unverified' : left.schema.issues.length ? 'drift' : 'captured', exitCode: left.schema.unknown.length ? 2 : left.schema.issues.length ? 1 : 0, schemaSHA256: left.schemaSHA256, note: 'Schema capture only; equality is not asserted' };
  }
  requireFact(Boolean(options.snapshot) !== Boolean(options.config), 'Choose one saved snapshot or one explicit Cloudflare target');
  if (options.snapshot) requireFact(remoteFlags.every(flag => !options[flag]), 'Saved snapshot mode cannot include remote target flags');
  const right = options.snapshot ? jsonOf(options.snapshot) : (await pullRemote({ ...options, out: options['remote-out'] })).schema;
  const report = compareSchemas(left, right);
  if (options.seed) {
    const seed = jsonOf(options.seed); requireFact(validateSeed(seed).valid && left.schema.registry, 'Seed expectation or registry unavailable');
    const differences = [];
    for (const collection of seed.collections ?? []) {
      const actual = left.schema.registry.find(value => value.slug === collection.slug);
      if (!actual) { differences.push({ collection: collection.slug, rule: 'seed-collection-absent' }); continue; }
      for (const field of collection.fields ?? []) {
        const observed = actual.fields.find(value => value.slug === field.slug);
        if (!observed || observed.type !== field.type || Boolean(observed.required) !== Boolean(field.required) || Boolean(observed.unique) !== Boolean(field.unique)) differences.push({ collection: collection.slug, field: field.slug, rule: 'seed-field-expectation-drift' });
      }
    }
    report.seedExpectations = { status: differences.length ? 'drift' : 'equal', differences, scope: 'Provided schema subset only; no seed content reads, width inference or complete registry claim' };
    if (differences.length && report.exitCode === 0) { report.exitCode = 1; report.status = 'drift'; }
  }
  if (options.out) { const out = newDirectory(options.out); writeJSON(path.join(out, 'report.json'), report); fs.writeFileSync(path.join(out, 'report.md'), schemaMarkdown(report), { flag: 'wx', mode: 0o600 }); }
  return report;
}
if (isMain(import.meta.url)) {
  try {
    const options = argumentsOf(process.argv.slice(2), ['--local', '--snapshot', '--config', '--env', '--account', '--database', '--out', '--remote-out', '--seed'], ['--capture']);
    const report = await diffDatabase(options);
    console.log(JSON.stringify(report, null, 2));
    if (report.status === 'drift') {
      console.log('\n## Recommended Follow-Up Actions');
      console.log('1. **Reconcile Schema Drift:** If changes were made locally, write a zero-downtime migration via `emdash-content-modeling`.');
      if (report.seedExpectations?.status === 'drift') {
        console.log('2. **Synchronize Seed:** Run `npm run db:export-seed` to update `seed/seed.json` with the current schema.');
      }
      console.log('3. **Deploy to Remote Database:** Run `npm run db:export-d1` or apply the SQL migration via Wrangler.');
    } else if (report.status === 'equal') {
      console.log('\n✔ Database schemas are in parity.');
    }
    process.exitCode = report.exitCode;
  }
  catch (error) { failure(error); }
}
