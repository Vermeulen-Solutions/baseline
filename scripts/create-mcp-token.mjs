import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { generatePrefixedToken, hashPrefixedToken } from '@emdash-cms/auth';
import { ulid } from 'ulidx';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    name: 'Assistant MCP',
    db: 'data.db',
    d1: null,
    user: null,
    url: process.env.SITE_URL || 'http://localhost:4321',
  };

  for (const arg of args) {
    if (arg.startsWith('--name=')) {
      options.name = arg.slice('--name='.length);
    } else if (arg.startsWith('--db=')) {
      options.db = arg.slice('--db='.length);
    } else if (arg.startsWith('--d1=')) {
      options.d1 = arg.slice('--d1='.length);
    } else if (arg.startsWith('--user=')) {
      options.user = arg.slice('--user='.length);
    } else if (arg.startsWith('--url=')) {
      options.url = arg.slice('--url='.length).replace(/\/+$/, '');
    }
  }

  return options;
}

const options = parseArgs();
const dbPath = path.resolve(options.db);
const db = new DatabaseSync(dbPath);

console.log('=== EmDash MCP Token Generator ===\n');

// 1. Resolve User
let userId = null;
if (options.user) {
  const user = db.prepare('SELECT id, email, role FROM users WHERE id = ? OR email = ?').get(options.user, options.user);
  if (!user) {
    console.error(`Error: User "${options.user}" not found in database.`);
    process.exit(1);
  }
  userId = user.id;
  console.log(`Using specified user: ${user.email} (${user.id})`);
} else {
  // Find first admin user
  const admin = db.prepare("SELECT id, email, role FROM users WHERE role IN ('admin', 'superadmin') LIMIT 1").get();
  if (admin) {
    userId = admin.id;
    console.log(`Using existing admin: ${admin.email} (${admin.id})`);
  } else {
    // If no users exist, create a dedicated service account
    userId = ulid();
    const serviceEmail = 'mcp-service@localhost';
    db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, 'MCP Service Account', 'admin', datetime('now'))")
      .run(userId, serviceEmail);
    console.log(`No admin users found. Created MCP service user: ${serviceEmail} (${userId})`);
  }
}

// 2. Generate Token
const { raw: rawToken, hash: tokenHash, prefix } = generatePrefixedToken('ec_pat_');
const tokenId = ulid();

const standardScopes = [
  'admin',
  'mcp:tools',
  'content:read',
  'content:write',
  'media:read',
  'media:write',
  'schema:read',
  'schema:write',
  'taxonomies:manage',
  'menus:manage',
  'settings:read'
];

db.prepare(`
  INSERT INTO _emdash_api_tokens (id, name, token_hash, prefix, user_id, scopes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
`).run(tokenId, options.name, tokenHash, prefix, userId, JSON.stringify(standardScopes));

console.log(`\nSuccessfully created API token "${options.name}" (ID: ${tokenId})!`);
console.log('--------------------------------------------------------------------------------');
console.log('Personal Access Token (KEEP SECRET - NOT SHOWN AGAIN):');
console.log(`\x1b[32m${rawToken}\x1b[0m`);
console.log('--------------------------------------------------------------------------------\n');

const mcpEndpoint = `${options.url}/_emdash/api/mcp`;

console.log('To configure this in .mcp.json (Cursor / Windsurf / Antigravity):');
console.log(JSON.stringify({
  mcpServers: {
    emdash: {
      type: 'http',
      url: mcpEndpoint,
      headers: {
        Authorization: `Bearer ${rawToken}`
      }
    }
  }
}, null, 2));

console.log('\nTo configure this in Claude Desktop (claude_desktop_config.json):');
console.log(JSON.stringify({
  mcpServers: {
    emdash: {
      url: mcpEndpoint,
      headers: {
        Authorization: `Bearer ${rawToken}`
      }
    }
  }
}, null, 2));

if (options.d1) {
  console.log(`\n--- SQL for Cloudflare D1 (${options.d1}) ---`);
  const safeScopes = JSON.stringify(standardScopes).replace(/'/g, "''");
  const sql = `INSERT INTO _emdash_api_tokens (id, name, token_hash, prefix, user_id, scopes, created_at) VALUES ('${tokenId}', '${options.name.replace(/'/g, "''")}', '${tokenHash}', '${prefix}', '${userId}', '${safeScopes}', datetime('now'));`;
  console.log(sql);
  console.log(`\nTo run remotely: npx wrangler d1 execute ${options.d1} --remote --command "${sql.replace(/"/g, '\\"')}"`);
}
