import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { checkI18nFacts, configLocales, factFindings } from '../scripts/check-i18n-facts.mjs';

const scratch = () => mkdtempSync(path.join(os.tmpdir(), 'i18n-facts-'));

test('i18n facts: locales come from the live i18n block, not a commented example', () => {
  assert.deepEqual(configLocales('export default {\n  // i18n: { defaultLocale: "fr", locales: ["fr", "en"] },\n}'), []);
  assert.deepEqual(configLocales('export default { i18n: { defaultLocale: "fr", locales: ["fr", "en"], fallback: { en: "fr" } } }'), ['fr', 'en']);
  assert.deepEqual(configLocales("i18n: {\n  defaultLocale: 'fr',\n  locales: ['fr', 'en', 'de'],\n}"), ['fr', 'en', 'de']);
});

test('i18n facts: a translatable fact fails by type or by name; prose, shared fields and recorded exceptions pass', () => {
  const field = (collection, name, type, translatable = 1) => ({ collection, field: name, type, translatable });
  const { failures, advice } = factFindings([
    field('sessions', 'title', 'string'),
    field('sessions', 'day', 'select'),
    field('sessions', 'time', 'string'),
    field('sessions', 'season', 'select', 0),
    field('news', 'title', 'string'),
    field('news', 'content', 'portableText'),
    field('news', 'hero_image', 'image'),
    field('forms', 'bank_details', 'text'),
    field('forms', 'intro', 'text'),
    field('sections', 'destination', 'url'),
    field('people', 'title', 'string'),
    field('people', 'email', 'string', 0),
  ], { 'sections.destination': 'each language links to its own path' });
  assert.deepEqual(failures.map(item => item.field).sort(), ['forms.bank_details', 'news.hero_image', 'sessions.day', 'sessions.time']);
  assert.match(failures.find(item => item.field === 'sessions.time').why, /name/);
  assert.match(failures.find(item => item.field === 'news.hero_image').why, /image/);
  assert.deepEqual(advice, ['people'], 'a collection that translates only its title is advised to be entered once');
});

test('i18n facts: reads a site database, skips single-language sites and refuses an exception without a reason', () => {
  const dir = scratch();
  try {
    writeFileSync(path.join(dir, 'astro.config.mjs'), 'export default { integrations: [] }');
    assert.equal(checkI18nFacts({ root: dir }).skipped, 'single-language site');
    writeFileSync(path.join(dir, 'astro.config.mjs'), 'export default { i18n: { defaultLocale: "fr", locales: ["fr", "en"] } }');
    assert.match(checkI18nFacts({ root: dir }).skipped, /no local database/);
    assert.throws(() => checkI18nFacts({ root: dir, db: 'missing.db', explicit: true }), /No database/);
    const db = new DatabaseSync(path.join(dir, 'data.db'));
    db.exec(`CREATE TABLE _emdash_collections (id TEXT, slug TEXT);
CREATE TABLE _emdash_fields (id TEXT, collection_id TEXT, slug TEXT, type TEXT, translatable INTEGER, sort_order INTEGER);
INSERT INTO _emdash_collections VALUES ('c1', 'sponsors');
INSERT INTO _emdash_fields VALUES ('f1', 'c1', 'title', 'string', 1, 0), ('f2', 'c1', 'url', 'url', 1, 1), ('f3', 'c1', 'logo', 'image', 0, 2);`);
    db.close();
    const result = checkI18nFacts({ root: dir });
    assert.deepEqual([result.locales, result.failures.map(item => item.field), result.advice], [['fr', 'en'], ['sponsors.url'], []]);
    mkdirSync(path.join(dir, 'audit'));
    writeFileSync(path.join(dir, 'audit', 'i18n-facts-exceptions.json'), JSON.stringify({ 'sponsors.url': '' }));
    assert.throws(() => checkI18nFacts({ root: dir }), /needs a reason/);
    writeFileSync(path.join(dir, 'audit', 'i18n-facts-exceptions.json'), JSON.stringify({ 'sponsors.url': 'each language links to its own sponsor page' }));
    assert.deepEqual(checkI18nFacts({ root: dir }).failures, []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
