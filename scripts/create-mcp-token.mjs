// Local SQLite fallback. Prefer supported OAuth or the PAT UI for hosted sites.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { clampScopes, generatePrefixedToken, isValidScope, Role, roleFromLevel, toRoleLevel } from '@emdash-cms/auth';
import { ulid } from 'ulidx';
import { argumentsOf, isMain, noLinks, requireFact } from './infrastructure-io.mjs';

export const TOKEN_PRESETS = Object.freeze({
  'read-only': Object.freeze(['content:read', 'media:read', 'schema:read', 'settings:read']),
  'content-authoring': Object.freeze(['content:read', 'content:write', 'media:read', 'media:write']),
  setup: Object.freeze(['content:read', 'content:write', 'media:read', 'media:write', 'schema:read', 'schema:write', 'taxonomies:manage', 'menus:manage', 'settings:read', 'settings:manage']),
});
const usage = `Local SQLite MCP token fallback (EmDash 1.3). Hosted sites: use OAuth or Admin > API tokens.
  npm run mcp:token -- --db <existing.sqlite> --user <id-or-email> [--preset read-only|content-authoring|setup]
    [--scopes <comma-separated-scopes>] [--name <name>] [--url <loopback-origin>]
    [--expires-at <future-ISO-timestamp>] [--apply]
  npm run mcp:token -- --db <existing.sqlite> --user <id-or-email> --revoke <token-id> [--apply]
Without --apply, only a read-only plan is returned. Default preset: read-only; expiry: 30 days.
--scopes replaces the preset and cannot be combined with --preset. No users are created.
Creation with --apply shows the secret once as JSON. Keep it in private client settings.`;

export function tokenOperation(args, now = Date.now()) {
  requireFact(args.db && args.user, 'An explicit --db and --user are required. Use --help.');
  const dbPath = noLinks(path.resolve(args.db));
  requireFact(fs.statSync(dbPath).isFile(), 'Database must be an existing regular file');
  requireFact(!(args.preset && args.scopes), 'Choose --preset or --scopes, not both');
  if (args.revoke) requireFact(!['preset', 'scopes', 'name', 'expires-at', 'url'].some(key => Object.hasOwn(args, key)), 'Revocation accepts only --db, --user, --revoke and --apply');
  const preset = args.scopes ? 'custom' : args.preset ?? 'read-only';
  const scopes = args.scopes ? args.scopes.split(',').map(scope => scope.trim()) : TOKEN_PRESETS[preset];
  requireFact(scopes?.length && scopes.every(scope => scope && isValidScope(scope)), 'Unknown preset or invalid scope');
  requireFact(new Set(scopes).size === scopes.length, 'Duplicate scopes are not allowed');
  const name = args.name ?? `Assistant MCP (${preset})`;
  requireFact(name.trim() && name.length <= 100, 'Token name must contain 1–100 characters');
  const expires = new Date(args['expires-at'] ?? now + 30 * 86400000);
  requireFact(Number.isFinite(expires.getTime()) && expires.getTime() > now && (!args['expires-at'] || /^\d{4}-\d{2}-\d{2}T/.test(args['expires-at'])), 'Expiry must be a future ISO timestamp');
  const url = new URL(args.url ?? 'http://localhost:4321');
  requireFact(['http:', 'https:'].includes(url.protocol) && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && !url.username && !url.password && !url.search && !url.hash, 'This fallback accepts only a loopback URL; use OAuth/admin for hosted sites');
  const db = new DatabaseSync(dbPath, { readOnly: !args.apply });
  let transaction = false;
  try {
    if (args.apply) { db.exec('PRAGMA foreign_keys = ON; BEGIN IMMEDIATE'); transaction = true; }
    const users = db.prepare('SELECT id, email, role FROM users WHERE id = ? OR email = ?').all(args.user, args.user);
    requireFact(users.length > 0, `User "${args.user}" not found in database.`);
    requireFact(users.length === 1, 'Account selection is ambiguous; use the exact user ID');
    const selected = users[0];
    const namedRole = String(selected.role).toUpperCase();
    requireFact(typeof selected.role === 'number' || Object.hasOwn(Role, namedRole), 'Unknown account role');
    const level = toRoleLevel(typeof selected.role === 'number' ? selected.role : Role[namedRole]);
    const user = { ...selected, role: roleFromLevel(level).toLowerCase(), roleLevel: level };
    if (args.revoke) {
      const token = db.prepare('SELECT id, name, prefix, scopes, expires_at FROM _emdash_api_tokens WHERE id = ? AND user_id = ?').get(args.revoke, user.id);
      requireFact(token, 'Token not found for the selected account');
      const result = { status: args.apply ? 'revoked' : 'planned', action: 'revoke', user, token: { id: token.id, name: token.name, prefix: token.prefix, scopes: JSON.parse(token.scopes), expiresAt: token.expires_at } };
      if (args.apply) { db.prepare('DELETE FROM _emdash_api_tokens WHERE id = ? AND user_id = ?').run(token.id, user.id); db.exec('COMMIT'); transaction = false; }
      return result;
    }
    const allowed = clampScopes(scopes, level);
    requireFact(allowed.length === scopes.length, 'Selected account role cannot hold all requested scopes; choose narrower scopes or another existing account');
    const result = { status: args.apply ? 'created' : 'planned', action: 'create', user, preset, scopes: [...scopes], elevated: scopes.some(scope => !TOKEN_PRESETS['read-only'].includes(scope)), name, expiresAt: expires.toISOString(), endpoint: url.href.replace(/\/$/, '') + '/_emdash/api/mcp', notes: ['Scopes and account roles both apply. Draft visibility and publication follow the account role.', ...(scopes.includes('content:write') ? ['EmDash 1.3 content:write also allows taxonomy and menu writes for compatibility.'] : [])] };
    if (args.apply) {
      const { raw, hash, prefix } = generatePrefixedToken('ec_pat_'), id = ulid();
      db.prepare('INSERT INTO _emdash_api_tokens (id, name, token_hash, prefix, user_id, scopes, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, name, hash, prefix, user.id, JSON.stringify(scopes), result.expiresAt, new Date(now).toISOString());
      db.exec('COMMIT'); transaction = false;
      Object.assign(result, { tokenId: id, token: raw });
    }
    return result;
  } finally { if (transaction) db.exec('ROLLBACK'); db.close(); }
}

if (isMain(import.meta.url)) {
  try {
    const args = argumentsOf(process.argv.slice(2), ['--db', '--user', '--preset', '--scopes', '--name', '--url', '--expires-at', '--revoke'], ['--apply', '--help']);
    if (args.help || !process.argv.slice(2).length) console.log(usage);
    else console.log(JSON.stringify(tokenOperation(args), null, 2));
  } catch (error) { console.error(`MCP token helper failed: ${error.message}`); process.exitCode = 1; }
}
