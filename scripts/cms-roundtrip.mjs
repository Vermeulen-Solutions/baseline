#!/usr/bin/env node
// CMS save-and-reload acceptance on a DISPOSABLE EmDash instance (found in a real-site overhaul:
// rebuilt templates must keep their edit targets, and "save and reload" must never be tried on
// the working or production content).
//
//   1. Copy the database:   sqlite3 data.db ".backup '<outside the repository>/data.db'"
//   2. Stop the working dev server, then start a second one on another port against the copy:
//      EMDASH_SQLITE_URL=file:<copy> npx astro dev --host 127.0.0.1 --port 4428
//   3. npm run audit:cms-roundtrip -- --base http://127.0.0.1:4428 --db <copy> --locale fr \
//        --check "pages/home/title@/" --check "teams/first-team/description@/teams/first-team/"
//
// Each --check is <collection>/<slug>/<field>@<public route>. For every check it
// - requires a text edit proxy for that field on the route in edit mode (and reports any image
//   proxy, for sites that keep media out of the frontend canvas: --no-image-proxies fails on one);
// - saves the field with a marker appended, publishes, reloads the public route and requires the
//   marker in the HTML;
// - proves isolation: the marker must be in the copied database file and must NOT be in the
//   working database (--working-db, default ./data.db). If it is found there, the run stops;
// - restores the original value, publishes, and requires the public text to equal the text
//   before the test.
// It refuses any origin that is not a loopback address, a --db inside the current project, and
// a --db that is the working database. Fields must hold plain text. Exit 0 = pass, 1 = failure.
// Sign-in uses the local dev bypass, which exists only on a dev server.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { msysToNative } from './capture-routes.mjs';

// "pages/home/title@/" -> { collection: 'pages', slug: 'home', field: 'title', route: '/' }
export function parseCheck(value) {
  const match = String(value).match(/^([a-z0-9_]+)\/([^/@]+)\/([a-z0-9_]+)@(\/.*)$/i);
  if (!match) throw Error(`--check takes <collection>/<slug>/<field>@<route>, for example pages/home/title@/; got "${value}"`);
  if (/^[A-Za-z]:[\\/]/.test(match[4].slice(1))) throw Error(`Route in "${value}" looks like a Windows path: Git Bash converted it. Re-run with MSYS_NO_PATHCONV=1.`);
  return { collection: match[1], slug: match[2], field: match[3], route: match[4] };
}

export function parseArgs(argv, cwd = process.cwd()) {
  const out = { checks: [], locale: null, workingDb: path.join(cwd, 'data.db'), imageProxies: true };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--base') out.base = value();
    else if (flag === '--db') out.db = path.resolve(cwd, msysToNative(value()));
    else if (flag === '--working-db') out.workingDb = path.resolve(cwd, msysToNative(value()));
    else if (flag === '--locale') out.locale = value();
    else if (flag === '--check') out.checks.push(parseCheck(value()));
    else if (flag === '--no-image-proxies') out.imageProxies = false;
    else throw Error('Unknown option: ' + flag);
  }
  if (out.help) return out;
  let origin; try { origin = new URL(out.base); } catch { throw Error('--base must be the origin of the disposable server, for example http://127.0.0.1:4428'); }
  if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)) throw Error('--base must be a loopback http origin: this test writes content and never runs against a deployed site');
  out.base = origin.origin;
  if (!out.db) throw Error('--db <path> is required: the copied database the disposable server uses');
  const inside = (file, dir) => { const rel = path.relative(dir, file); return !rel.startsWith('..') && !path.isAbsolute(rel); };
  if (out.db.toLowerCase() === out.workingDb.toLowerCase()) throw Error('--db is the working database. Copy it first and start a second server against the copy.');
  if (inside(out.db, cwd)) throw Error('--db is inside this project. Keep the disposable copy outside the repository.');
  if (!out.checks.length) throw Error('Give at least one --check <collection>/<slug>/<field>@<route>');
  return out;
}

// Edit targets present in rendered HTML: data-emdash-ref='{"collection":…,"id":…,"field":…}'.
export function refsFromHtml(html) {
  return [...String(html).matchAll(/data-emdash-ref="([^"]+)"/g)].flatMap(match => { try { return [JSON.parse(match[1].replaceAll('&quot;', '"'))]; } catch { return []; } });
}

// Field names that hold media by convention: a whole word between underscores ("hero_image",
// "photo"), not a fragment ("discover_title" is text).
export const isImageField = field => /(^|_)(image|images|photo|photos|logo|cover|picture|media)(_|$)/i.test(String(field ?? ''));

// Visible text of a page, for a before/after comparison that ignores markup and asset hashes.
export function pageText(html) {
  return String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// True when the marker bytes are in the SQLite file or its write-ahead log.
export function databaseHolds(file, marker) {
  return [file, file + '-wal'].some(candidate => existsSync(candidate) && readFileSync(candidate).includes(Buffer.from(marker, 'utf8')));
}

async function run(options) {
  if (!existsSync(options.db)) throw Error(`--db not found: ${options.db}`);
  const { base } = options;
  const auth = await fetch(`${base}/_emdash/api/auth/dev-bypass`, { redirect: 'manual' });
  const cookie = auth.headers.get('set-cookie')?.split(';')[0]; await auth.text();
  if (!cookie) throw Error('No dev-bypass session: is this a dev server (astro dev) of an EmDash site?');
  const headers = { Cookie: cookie, Origin: base, 'Content-Type': 'application/json', 'X-EmDash-Request': '1' };
  const api = async (p, method = 'GET', body) => { const r = await fetch(`${base}/_emdash/api${p}`, { method, headers, body: body ? JSON.stringify(body) : undefined }); const j = await r.json().catch(() => ({})); return { status: r.status, ...j }; };
  const publicHtml = async route => { const r = await fetch(`${base}${route}${route.includes('?') ? '&' : '?'}nocache=${Date.now()}`); if (r.status !== 200) throw Error(`${route} answered ${r.status}`); return r.text(); };
  const editHtml = async route => { const r = await fetch(base + route, { headers: { Cookie: `${cookie}; emdash-edit-mode=true` } }); if (r.status !== 200) throw Error(`${route} answered ${r.status} in edit mode`); return r.text(); };
  const save = async (collection, id, patch) => {
    const read = await api(`/content/${collection}/${id}`);
    if (read.status !== 200 || !read.data?._rev) throw Error(`cannot read ${collection}/${id}: ${read.status}`);
    const put = await api(`/content/${collection}/${id}`, 'PUT', { _rev: read.data._rev, data: { ...read.data.item.data, ...patch } });
    if (put.status !== 200) throw Error(`save ${collection}/${id} answered ${put.status} ${JSON.stringify(put.error ?? '').slice(0, 160)}`);
    const published = await api(`/content/${collection}/${id}/publish`, 'POST', {});
    if (![200, 201].includes(published.status)) throw Error(`publish ${collection}/${id} answered ${published.status} ${JSON.stringify(published.error ?? '').slice(0, 160)}`);
  };
  let failures = 0;
  for (const check of options.checks) {
    const label = `${check.collection}/${check.slug}/${check.field} on ${check.route}`;
    let restore = null;
    try {
      const list = await api(`/content/${check.collection}?limit=100${options.locale ? `&locale=${encodeURIComponent(options.locale)}` : ''}`);
      const entry = (list.data?.items ?? []).find(item => item.slug === check.slug);
      if (!entry) throw Error(`no ${check.collection} entry with slug "${check.slug}"${options.locale ? ` in locale ${options.locale}` : ''}`);
      const original = (await api(`/content/${check.collection}/${entry.id}`)).data?.item?.data?.[check.field];
      if (typeof original !== 'string') throw Error(`field "${check.field}" does not hold plain text`);
      const refs = refsFromHtml(await editHtml(check.route));
      if (!refs.some(ref => ref.collection === check.collection && ref.id === entry.id && ref.field === check.field)) throw Error('no edit proxy for this field on the route in edit mode');
      const images = refs.filter(ref => isImageField(ref.field));
      if (images.length && !options.imageProxies) throw Error(`${images.length} image proxy/proxies on the route (--no-image-proxies)`);
      const before = pageText(await publicHtml(check.route));
      const marker = `QA${String(Date.now()).slice(-7)}${Math.floor(Math.random() * 90 + 10)}`;
      restore = () => save(check.collection, entry.id, { [check.field]: original });
      await save(check.collection, entry.id, { [check.field]: `${original} ${marker}` });
      if (databaseHolds(options.workingDb, marker)) throw Error('ISOLATION FAILURE: the marker reached the working database. The server is not using the copy; the original value is being restored.');
      if (!databaseHolds(options.db, marker)) throw Error('the marker is not in the copied database: the server at --base does not use --db');
      if (!(await publicHtml(check.route)).includes(marker)) throw Error('the saved value did not appear on the reloaded public route');
      await restore(); restore = null;
      const after = pageText(await publicHtml(check.route));
      if (after !== before) throw Error('the public text differs after restoring the original value');
      console.log(`  pass  ${label}: proxy present${images.length ? `, ${images.length} image proxies` : ''}; saved, published, reloaded, restored`);
    } catch (error) {
      failures++; console.log(`  FAIL  ${label}: ${error.message}`);
      if (restore) await restore().catch(e => console.log(`        restore failed: ${e.message}`));
      if (/ISOLATION FAILURE/.test(error.message)) break;
    }
  }
  return failures;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: audit:cms-roundtrip -- --base http://127.0.0.1:<port> --db <copied database outside the project> [--working-db ./data.db] [--locale fr] [--no-image-proxies] --check "<collection>/<slug>/<field>@<route>" [--check …]\nSaves, publishes, reloads and restores plain-text fields on a disposable dev server, and proves the working database was not touched. Git Bash: MSYS_NO_PATHCONV=1 when a route is "/".');
    else {
      const failures = await run(options);
      console.log(failures ? `${failures} check(s) failed` : 'CMS save and reload: all checks passed on the disposable copy.');
      if (failures) process.exitCode = 1;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
