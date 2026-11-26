// Facts are entered once on a multilingual site. Translations need maintenance: a fact kept in every
// language (a time, a price, a phone number, a photo, a link to another entry) is a fact maintainers
// must change several times, and one of the copies goes stale. Only prose is translated.
//
//   npm run check:i18n-facts [-- --db <sqlite file>] [--report] [--json]
//
// Reads the field definitions from the site's database (`_emdash_fields`; default ./data.db, or a
// `db:local-copy` file for a Workers site) and the locales from astro.config.mjs. A single-language site
// passes. A translatable field fails when its type holds a fact (number, date, switch, image, file,
// reference, choice list) or its name says it does (time, day, phone, email, address, IBAN, price, fee,
// order…). Record a deliberate exception, with its reason, in audit/i18n-facts-exceptions.json:
//   { "editorial_sections.destination": "each language links to its own path" }
// EmDash refuses to make an existing field non-translatable without a content migration, so decide this
// when the field is created; on an existing site, read the value from the default locale in code instead.
// Collections whose only translatable field is the title are reported as advice: enter them once, in the
// default locale, and let other locales fall back to those entries.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { argumentsOf, isMain } from './infrastructure-io.mjs';

export const FACT_TYPES = new Set(['number', 'integer', 'boolean', 'datetime', 'date', 'image', 'file', 'reference', 'select', 'multiSelect']);
export const FACT_NAME = /(^|_)(time|times|day|days|date|dates|hour|hours|phone|tel|mobile|email|address|street|postal|zip|iban|bank|bank_details|price|prices|amount|amounts|fee|fees|cost|costs|sort|order|count|number|latitude|longitude|lat|lng)(_|$)/i;
export const EXCEPTIONS_FILE = 'audit/i18n-facts-exceptions.json';

/** Locales from astro.config.mjs, ignoring commented-out lines. */
export function configLocales(source) {
  const live = String(source).split('\n').filter(line => !/^\s*\/\//.test(line)).join('\n');
  const block = live.match(/i18n\s*:\s*\{[\s\S]*?locales\s*:\s*\[([^\]]*)\]/);
  if (!block) return [];
  return [...block[1].matchAll(/["'`]([A-Za-z-]+)["'`]|code\s*:\s*["'`]([A-Za-z-]+)["'`]/g)].map(match => match[1] || match[2]);
}

export function factFindings(fields, exceptions = {}) {
  const failures = [];
  const advice = [];
  const byCollection = new Map();
  for (const field of fields) {
    const key = `${field.collection}.${field.field}`;
    const translatable = Number(field.translatable) !== 0 && field.translatable !== false;
    if (!byCollection.has(field.collection)) byCollection.set(field.collection, []);
    if (translatable) byCollection.get(field.collection).push(field.field);
    if (!translatable || Object.hasOwn(exceptions, key)) continue;
    const byType = FACT_TYPES.has(field.type);
    const byName = ['string', 'text', 'repeater', 'url', 'email'].includes(field.type) && FACT_NAME.test(field.field);
    if (byType || byName || field.type === 'url' || field.type === 'email') failures.push({ field: key, type: field.type, why: byType ? `a ${field.type} field holds a fact` : field.type === 'url' || field.type === 'email' ? `a ${field.type} is the same in every language` : 'its name says it holds a fact' });
  }
  for (const [collection, translatable] of byCollection) {
    if (translatable.length === 1 && translatable[0] === 'title') advice.push(collection);
  }
  return { failures, advice };
}

export function readFields(dbFile) {
  const db = new DatabaseSync(dbFile, { readOnly: true });
  try {
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '_emdash_fields'").get()) return [];
    return db.prepare('SELECT c.slug AS collection, f.slug AS field, f.type AS type, f.translatable AS translatable FROM _emdash_fields f JOIN _emdash_collections c ON c.id = f.collection_id ORDER BY c.slug, f.sort_order').all().map(row => ({ ...row }));
  } finally { db.close(); }
}

export function checkI18nFacts({ root = process.cwd(), db = 'data.db', explicit = false } = {}) {
  const config = path.join(root, 'astro.config.mjs');
  const locales = fs.existsSync(config) ? configLocales(fs.readFileSync(config, 'utf8')) : [];
  if (locales.length < 2) return { locales, skipped: 'single-language site', failures: [], advice: [] };
  const file = path.resolve(root, db);
  if (!fs.existsSync(file)) {
    if (explicit) throw new Error(`No database at ${file}.`);
    return { locales, skipped: `no local database (${db}); pass --db <sqlite file>, for a Workers site a db:local-copy data.db`, failures: [], advice: [] };
  }
  const exceptionsPath = path.join(root, EXCEPTIONS_FILE);
  const exceptions = fs.existsSync(exceptionsPath) ? JSON.parse(fs.readFileSync(exceptionsPath, 'utf8')) : {};
  for (const [key, reason] of Object.entries(exceptions)) if (!String(reason || '').trim()) throw new Error(`${EXCEPTIONS_FILE}: "${key}" needs a reason.`);
  return { locales, ...factFindings(readFields(file), exceptions) };
}

if (isMain(import.meta.url)) {
  try {
    const args = argumentsOf(process.argv.slice(2), ['--db'], ['--report', '--json']);
    const result = checkI18nFacts({ db: args.db || 'data.db', explicit: Boolean(args.db) });
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else if (result.skipped) console.log(`[i18n-facts] Pass: ${result.skipped}.`);
    else {
      for (const item of result.failures) console.log(`[i18n-facts] ${item.field} (${item.type}): translatable, but ${item.why}.`);
      if (result.failures.length) console.log(`[i18n-facts] Enter each once: non-translatable when the field is created; on an existing site read it from the default locale in code (docs/internationalization.md). A deliberate exception goes in ${EXCEPTIONS_FILE} with its reason.`);
      for (const collection of result.advice) console.log(`[i18n-facts] Advice: ${collection} translates only its title; enter its entries once, in the default locale, and list them on other locales as a fallback.`);
      console.log(`[i18n-facts] ${result.failures.length ? 'Fail' : 'Pass'}: ${result.failures.length} translatable fact field(s) across ${result.locales.join(', ')}; ${result.advice.length} collection(s) to enter once.`);
    }
    if (result.failures.length && !args.report) process.exitCode = 1;
  } catch (error) {
    console.error(`[i18n-facts] Error: ${error.message}`);
    process.exitCode = 1;
  }
}
