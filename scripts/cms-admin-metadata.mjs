#!/usr/bin/env node
// Apply reviewed admin metadata to an EmDash site: field widgets, labels and select options, and
// collection admin settings such as listColumns and quickCreate. It never adds or removes fields,
// collections or content, and it never drops a select option. See docs/editor-experience.md.
//
//   npm run cms:admin-metadata -- --base http://127.0.0.1:4321 --plan audit/editor-metadata.json
//   npm run cms:admin-metadata -- --base https://example.org --plan audit/editor-metadata.json --apply
//
// Without --apply it prints every change as before → after and writes nothing. With --apply it
// writes each change and reads it back. Sign-in: the dev bypass on a loopback dev server, otherwise
// EMDASH_TOKEN or the EmDash CLI token stored for that origin (~/.config/emdash/auth.json).
//
// Plan file:
// {
//   "emdashVersion": "1.5.0",                       // optional: refuse other versions
//   "fields": [{ "collection": "events", "field": "day", "widget": "site-editor-ui:choice",
//                "label": "Day", "options": ["Monday", "Tuesday"] }],
//   "collections": [{ "collection": "messages", "admin": { "listColumns": ["submitted_at"], "quickCreate": false } }]
// }
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isLoopback = origin => ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname);

export function parseArgs(argv) {
  const out = { base: null, plan: null, apply: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error(`Missing value for ${flag}`); return v; };
    if (flag === '--base') out.base = new URL(value()).origin;
    else if (flag === '--plan') out.plan = value();
    else if (flag === '--apply') out.apply = true;
    else throw Error(`Unknown argument ${flag}`);
  }
  if (!out.base || !out.plan) throw Error('Usage: cms-admin-metadata --base <origin> --plan <plan.json> [--apply]');
  if (!isLoopback(out.base) && !out.base.startsWith('https:')) throw Error('A non-loopback origin must use https');
  return out;
}

export function validatePlan(plan) {
  if (!plan || typeof plan !== 'object') throw Error('Plan must be a JSON object');
  const slug = /^[a-z][a-z0-9_]*$/;
  for (const change of plan.fields ?? []) {
    if (!slug.test(change.collection ?? '') || !slug.test(change.field ?? '')) throw Error(`Field change needs collection and field slugs: ${JSON.stringify(change)}`);
    const extra = Object.keys(change).filter(key => !['collection', 'field', 'widget', 'label', 'options'].includes(key));
    if (extra.length) throw Error(`${change.collection}.${change.field}: unsupported keys ${extra.join(', ')}`);
    if (change.widget !== undefined && change.widget !== null && !/^[a-z0-9@/_-]+:[a-z0-9_-]+$/i.test(change.widget)) throw Error(`${change.collection}.${change.field}: widget must be <plugin id>:<widget name> or null`);
    if (change.options !== undefined && (!Array.isArray(change.options) || change.options.some(option => typeof option !== 'string'))) throw Error(`${change.collection}.${change.field}: options must be a list of strings`);
  }
  for (const change of plan.collections ?? []) {
    if (!slug.test(change.collection ?? '') || !change.admin || typeof change.admin !== 'object') throw Error(`Collection change needs a collection slug and an admin object: ${JSON.stringify(change)}`);
  }
  return plan;
}

/** Compare a plan with the current schemas. `schemas` maps collection slug → { admin, fields }. */
export function planChanges(plan, schemas) {
  const changes = [];
  for (const change of plan.fields ?? []) {
    const schema = schemas[change.collection];
    if (!schema) throw Error(`Collection ${change.collection} not found`);
    const field = schema.fields?.find(candidate => candidate.slug === change.field);
    if (!field) throw Error(`Field ${change.collection}.${change.field} not found`);
    const body = {};
    const before = {};
    if (change.widget !== undefined && (field.widget ?? null) !== change.widget) { body.widget = change.widget; before.widget = field.widget ?? null; }
    if (change.label !== undefined && field.label !== change.label) { body.label = change.label; before.label = field.label; }
    if (change.options !== undefined) {
      const current = field.validation?.options ?? [];
      const dropped = current.filter(option => !change.options.includes(option));
      if (dropped.length) throw Error(`${change.collection}.${change.field}: the plan would drop stored options ${dropped.join(', ')}; existing entries may use them`);
      if (!same(current, change.options)) { body.validation = { ...field.validation, options: change.options }; before.options = current; }
    }
    changes.push({ kind: 'field', collection: change.collection, field: change.field, target: `${change.collection}.${change.field}`, route: `/schema/collections/${change.collection}/fields/${change.field}`, body, before, applied: !Object.keys(body).length });
  }
  for (const change of plan.collections ?? []) {
    const schema = schemas[change.collection];
    if (!schema) throw Error(`Collection ${change.collection} not found`);
    const current = schema.admin ?? {};
    const next = { ...current, ...change.admin };
    changes.push({ kind: 'collection', collection: change.collection, target: `${change.collection} admin`, route: `/schema/collections/${change.collection}`, body: { admin: next }, before: { admin: current }, applied: same(current, next) });
  }
  return changes;
}

/** True when the schema read back after a write holds what the change asked for. */
export function readbackMatches(change, schema) {
  if (change.kind === 'collection') return same(schema.admin ?? {}, change.body.admin);
  const field = schema.fields?.find(candidate => candidate.slug === change.field);
  if (!field) return false;
  return (change.body.widget === undefined || (field.widget ?? null) === change.body.widget)
    && (change.body.label === undefined || field.label === change.body.label)
    && (change.body.validation === undefined || same(field.validation?.options ?? [], change.body.validation.options));
}

async function session(base) {
  const headers = { 'X-EmDash-Request': '1', 'Content-Type': 'application/json', Origin: base };
  if (isLoopback(base)) {
    const auth = await fetch(`${base}/_emdash/api/auth/dev-bypass`, { redirect: 'manual' });
    const cookie = (auth.headers.getSetCookie?.() ?? []).map(value => value.split(';')[0]).join('; ');
    if (!cookie) throw Error('No dev-bypass session: is this an EmDash dev server (astro dev)?');
    headers.Cookie = cookie;
  } else {
    let token = process.env.EMDASH_TOKEN;
    if (!token) {
      const file = path.join(os.homedir(), '.config/emdash/auth.json');
      token = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8'))[base]?.accessToken : undefined;
    }
    if (!token) throw Error(`No token for ${base}: sign in with the EmDash CLI or set EMDASH_TOKEN`);
    headers.Authorization = `Bearer ${token}`;
  }
  return async (route, method = 'GET', body) => {
    const response = await fetch(`${base}/_emdash/api${route}`, { method, headers, redirect: 'error', ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw Error(`${method} ${route}: HTTP ${response.status} ${result.error?.message ?? ''}`.trim());
    return result.data;
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = validatePlan(JSON.parse(fs.readFileSync(args.plan, 'utf8')));
  const request = await session(args.base);
  if (plan.emdashVersion) {
    const health = await request('/health');
    if (health.version !== plan.emdashVersion) throw Error(`Plan reviewed for EmDash ${plan.emdashVersion}; ${args.base} runs ${health.version}`);
  }
  const read = async slug => (await request(`/schema/collections/${slug}?includeFields=true`)).item;
  const slugs = [...new Set([...(plan.fields ?? []), ...(plan.collections ?? [])].map(change => change.collection))];
  const schemas = Object.fromEntries(await Promise.all(slugs.map(async slug => [slug, await read(slug)])));
  const changes = planChanges(plan, schemas);
  for (const change of changes) {
    if (change.applied) { console.log(`${change.target}: already applied`); continue; }
    console.log(`${change.target}: ${JSON.stringify(change.before)} → ${JSON.stringify(change.body)}`);
    if (!args.apply) continue;
    await request(change.route, 'PUT', change.body);
    const schema = await read(change.collection);
    if (!readbackMatches(change, schema)) throw Error(`${change.target}: read-back does not match`);
    console.log(`${change.target}: applied and read back`);
  }
  if (!args.apply && changes.some(change => !change.applied)) console.log('Dry run: nothing written. Review the changes above, then add --apply.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
