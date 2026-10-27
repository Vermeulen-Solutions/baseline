import fs from 'node:fs/promises';
import { argumentsOf, isMain } from './infrastructure-io.mjs';

const limit = 2 * 1024 * 1024;
function locale(value) {
  if (typeof value !== 'string' || value.length > 80) return null;
  try { return Intl.getCanonicalLocales(value)[0] || null; } catch { return null; }
}

/** Inspect native metadata, never a custom data.locale field or rendered prose. */
export function checkMigrationLocale(input, expected) {
  const expectedLocale = locale(expected);
  if (!expectedLocale) throw new Error('Use a valid expected locale such as fr or en-GB.');
  const samples = Array.isArray(input) ? input : [input];
  if (!samples.length || samples.length > 100) throw new Error('Provide between 1 and 100 native content readbacks.');
  const result = { status: 'passed', expectedLocale, checked: samples.length, missingLocale: 0, mismatchedLocale: 0, invalidItems: 0 };
  for (const sample of samples) {
    if (sample && typeof sample === 'object' && Object.hasOwn(sample, 'success') && sample.success !== true) {
      result.invalidItems++; continue;
    }
    // Native CLI content get, a ContentResponse, or a successful REST envelope.
    const item = sample?.success === true ? sample.data?.item : sample?.item ?? sample;
    if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.id !== 'string' || !item.id.trim()) {
      result.invalidItems++; continue;
    }
    const actual = locale(item.locale);
    if (!actual) result.missingLocale++;
    else if (actual !== expectedLocale) result.mismatchedLocale++;
  }
  if (result.invalidItems || result.missingLocale || result.mismatchedLocale) result.status = 'failed';
  return result;
}

async function readSample(file) {
  if ((await fs.lstat(file)).isSymbolicLink()) throw new Error('Use a regular JSON sample file.');
  const handle = await fs.open(file, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limit) throw new Error('Use a regular JSON sample no larger than 2 MiB.');
    const bytes = Buffer.alloc(limit + 1);
    let total = 0;
    while (total < bytes.length) {
      const part = await handle.read(bytes, total, bytes.length - total, null);
      if (!part.bytesRead) break;
      total += part.bytesRead;
    }
    if (total > limit) throw new Error('Sample exceeds 2 MiB.');
    try { return JSON.parse(bytes.subarray(0, total).toString('utf8').replace(/^\uFEFF/, '')); }
    catch { throw new Error('Sample must be valid native content JSON.'); }
  } finally { await handle.close(); }
}

if (isMain(import.meta.url)) {
  try {
    if (process.argv.length === 3 && process.argv[2] === '--help') {
      console.log('Read-only native import sample check: --input <private JSON> --expected-locale <fr|en|...>. No writes, credentials or content values are printed. A pass covers only the supplied samples.');
    } else {
      const options = argumentsOf(process.argv.slice(2), ['--input', '--expected-locale']);
      if (!options.input || !options['expected-locale']) throw new Error('Use --input <private JSON> --expected-locale <locale>.');
      const result = checkMigrationLocale(await readSample(options.input), options['expected-locale']);
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.status === 'passed' ? 0 : 1;
    }
  } catch {
    // JSON parser/system errors must never echo source content or credentials.
    console.error(JSON.stringify({ status: 'error', message: 'Locale check could not run. Use --help; check the expected locale and a regular valid JSON input of at most 2 MiB.' }));
    process.exitCode = 1;
  }
}
