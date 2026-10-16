import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { sqlTokens, inspectSQLite } from './sqlite-schema.mjs';
import { bytesOf, noLinks, requireFact, sha256, resolveCloudflare, boundedBody, newDirectory, writeJSON, isMain, failure, argumentsOf } from './infrastructure-io.mjs';

export function splitSQL(text) {
  const statements = []; let start = 0, quote = null, comment = null;
  for (let i = 0; i < text.length; i++) {
    if (comment === 'line') { if (text[i] === '\n') comment = null; continue; }
    if (comment === 'block') { if (text.slice(i, i + 2) === '*/') { comment = null; i++; } continue; }
    if (quote) { if (text[i] === quote) { if (text[i + 1] === quote && quote !== ']') i++; else quote = null; } continue; }
    if (text.slice(i, i + 2) === '--') { comment = 'line'; i++; continue; }
    if (text.slice(i, i + 2) === '/*') { comment = 'block'; i++; continue; }
    if (["'", '"', '`', '['].includes(text[i])) { quote = text[i] === '[' ? ']' : text[i]; continue; }
    if (text[i] === ';') { statements.push(text.slice(start, i)); start = i + 1; }
  }
  requireFact(!quote && comment !== 'block', 'Malformed SQL export'); statements.push(text.slice(start));
  return statements.filter(statement => sqlTokens(statement).length);
}
function allowedStatement(statement) {
  const tokens = sqlTokens(statement), joined = tokens.join(' ');
  if (/^(begin(?: transaction)?|commit|end transaction)$/.test(joined)) return 'skip';
  if (/^pragma (?:foreign_keys|defer_foreign_keys) = (?:on|off|0|1)$/.test(joined)) return 'skip';
  requireFact(!tokens.some(token => ['attach', 'detach', 'trigger', 'virtual', 'load_extension', 'writable_schema', 'select', 'with', 'temp', 'temporary'].includes(token)), 'Unsupported SQL construct; export quarantined without execution');
  if (tokens[0] === 'create' && ['table', 'index', 'unique'].includes(tokens[1])) {
    requireFact(!tokens.some(token => /^(?:sqlite_|_cf_)/.test(token)), 'Engine-owned SQL objects require a separate adapter');
    const open = tokens.indexOf('('); requireFact(open > 1, 'Malformed SQL definition');
    const allowedFunctions = new Set(['length', 'lower', 'upper', 'coalesce', 'ifnull', 'trim', 'abs', 'round', 'substr', 'date', 'datetime', 'strftime', 'unixepoch', 'json_valid', 'json_extract', 'json_type', 'check', 'as', 'key', 'unique', 'references', 'numeric', 'decimal', 'varchar', 'char', 'text', 'integer', 'real']);
    for (let i = open + 1; i < tokens.length - 1; i++) if (tokens[i + 1] === '(' && /^[a-z_]/.test(tokens[i])) requireFact(allowedFunctions.has(tokens[i]), 'Unsupported SQL function in schema');
    return 'execute';
  }
  requireFact(tokens[0] === 'insert' && tokens[1] === 'into' && !/^(?:sqlite_|_cf_)/.test(tokens[2]), 'Only bounded schema and literal INSERT exports are supported');
  const values = tokens.indexOf('values'); requireFact(values >= 3, 'INSERT requires literal VALUES');
  requireFact(tokens.slice(values + 1).every(token => ['(', ')', ',', '-', '+', 'null'].includes(token) || /^'(?:[^']|'')*'$/.test(token) || /^(?:\d+(?:\.\d*)?(?:e[-+]?\d+)?|x)$/i.test(token)), 'Non-literal INSERT refused');
  return 'execute';
}
export function reconstructSQL(sqlFile, output) {
  noLinks(output);
  requireFact(!fs.existsSync(output) && path.basename(output).toLowerCase() !== 'data.db', 'Snapshot output exists or targets working data.db');
  const text = bytesOf(sqlFile, 32 * 1024 * 1024).toString('utf8'), statements = splitSQL(text);
  requireFact(statements.length > 0 && statements.length <= 100000, 'SQL statement count unsupported');
  const selected = statements.map(statement => ({ statement, action: allowedStatement(statement) }));
  const partial = output + '.partial'; requireFact(!fs.existsSync(partial), 'Partial snapshot already exists');
  const db = new DatabaseSync(partial, { allowExtension: false });
  try {
    db.exec('PRAGMA trusted_schema=OFF; PRAGMA foreign_keys=OFF; PRAGMA max_page_count=16384; BEGIN');
    for (const { statement, action } of selected) if (action === 'execute') db.exec(statement);
    db.exec('COMMIT');
    requireFact(db.prepare('PRAGMA integrity_check').all().every(row => Object.values(row)[0] === 'ok'), 'Reconstructed integrity check failed');
    requireFact(db.prepare('PRAGMA foreign_key_check').all().length === 0, 'Reconstructed foreign keys failed');
  } finally { db.close(); }
  fs.linkSync(partial, output); fs.unlinkSync(partial); return { sqlSHA256: sha256(Buffer.from(text)), snapshotSHA256: sha256(bytesOf(output)), statements: selected.filter(row => row.action === 'execute').length };
}
export function reconstructIsolated(sqlFile, output) {
  try { return JSON.parse(execFileSync(process.execPath, ['--max-old-space-size=128', fileURLToPath(import.meta.url), '--worker', sqlFile, '--database', output], { encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })); }
  catch { throw Error('Reconstruction unavailable; partial private output retained for inspection'); }
}
export async function exportD1(target, { request = fetch, token = process.env.CLOUDFLARE_API_TOKEN, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  requireFact(token && /^[A-Za-z0-9_-]+$/.test(token), 'Explicit Cloudflare API token is unavailable');
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${target.account}/d1/database/${target.database}/export`;
  let bookmark;
  for (let attempt = 0; attempt < 60; attempt++) {
    const response = await request(endpoint, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000), headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ output_format: 'polling', ...(bookmark ? { current_bookmark: bookmark } : {}) }) });
    const body = JSON.parse((await boundedBody(response, 1024 * 1024)).toString('utf8'));
    requireFact(body.success === true && body.result && body.result.status !== 'error', 'D1 export unavailable or unauthorized');
    const result = body.result;
    requireFact(result.success !== false && !result.error && (!bookmark || result.at_bookmark === bookmark), 'Incomplete/changing D1 export result');
    if (result.status === 'complete') {
      const url = new URL(result.result?.signed_url);
      requireFact(url.protocol === 'https:' && !url.username && !url.password && url.hostname.endsWith('.r2.cloudflarestorage.com'), 'Unsupported D1 download origin');
      const download = await request(url.href, { redirect: 'error', signal: AbortSignal.timeout(30000) });
      return { sql: await boundedBody(download, 32 * 1024 * 1024), bookmarkSHA256: sha256(String(result.at_bookmark ?? bookmark ?? 'unavailable')) };
    }
    requireFact(typeof result.at_bookmark === 'string' && result.at_bookmark.length <= 1024 && (!bookmark || result.at_bookmark === bookmark), 'Incomplete/changing D1 export bookmark');
    bookmark = result.at_bookmark; await wait(1000);
  }
  throw Error('D1 export timed out');
}
export async function pullRemote(options, dependencies) {
  const target = resolveCloudflare(options, 'd1');
  console.error(JSON.stringify({ operation: 'read-only D1 export', target }));
  // Validate identity/auth before reserving an output. No remote fallback or working database destination.
  requireFact((dependencies?.token ?? process.env.CLOUDFLARE_API_TOKEN), 'Explicit Cloudflare API token is unavailable');
  const out = newDirectory(options.out, { ignoredRoot: path.resolve('.emdash/backups') });
  try {
    const exported = await exportD1(target, dependencies);
    const sql = path.join(out, 'export.sql'), database = path.join(out, 'inspection.sqlite'); fs.writeFileSync(sql, exported.sql, { flag: 'wx', mode: 0o600 });
    const reconstruction = reconstructIsolated(sql, database), schema = inspectSQLite(database);
    writeJSON(path.join(out, 'schema.json'), schema);
    const receipt = { receiptVersion: 1, status: schema.schema.unknown.length ? 'unverified' : schema.schema.issues.length ? 'inspection-with-findings' : 'inspected', exitCode: schema.schema.unknown.length ? 2 : schema.schema.issues.length ? 1 : 0, target, acquiredAt: new Date().toISOString(), bookmarkSHA256: exported.bookmarkSHA256, ...reconstruction, schemaSHA256: schema.schemaSHA256, scope: 'Consistent exported snapshot; no app, migrations, seeding or exported triggers launched; D1 runtime query/Worker/R2 acceptance separate' };
    writeJSON(path.join(out, 'receipt.json'), receipt); return { database, schema, receipt };
  } catch (error) { writeJSON(path.join(out, 'failure.json'), { status: 'unverified', target, note: 'No working DB changed; partial artifacts private and not promoted' }); throw error; }
}
if (isMain(import.meta.url)) {
  try {
    const options = argumentsOf(process.argv.slice(2), ['--worker', '--database', '--config', '--env', '--account', '--out']);
    if (options.worker) console.log(JSON.stringify(reconstructSQL(options.worker, options.database)));
    else { const { receipt } = await pullRemote(options); console.log(JSON.stringify(receipt, null, 2)); process.exitCode = receipt.exitCode; }
  } catch (error) { failure(error); }
}
