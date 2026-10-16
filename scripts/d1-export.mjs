import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function parseArgs(args) {
  const result = { remote: true };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--database' && args[i + 1]) result.database = args[++i];
    else if (args[i] === '--out' && args[i + 1]) result.out = args[++i];
    else if (args[i] === '--local') result.remote = false;
  }
  return result;
}

function detectDatabase() {
  for (const file of ['wrangler.jsonc', 'wrangler.json']) {
    if (fs.existsSync(file)) {
      try {
        const text = fs.readFileSync(file, 'utf8').replace(/\/\/.*$/gm, '');
        const data = JSON.parse(text);
        const d1 = data.d1_databases?.[0]?.database_name;
        if (d1) return d1;
      } catch {}
    }
  }
  return null;
}

export function exportD1Database({ database, out, remote = true } = {}) {
  const dbName = database || detectDatabase();
  if (!dbName) throw new Error('Database name required: specify --database <name> or configure in wrangler.jsonc');

  const dateStr = new Date().toISOString().slice(0, 10);
  const finalExportFile = out ? path.resolve(out) : path.resolve(`./d1-export-${dbName}-${dateStr}.sql`);
  const tempExportFile = path.resolve(`./.temp-d1-export-${Date.now()}.sql`);

  console.log(`[d1-export] Querying sqlite_master from D1 database "${dbName}"...`);
  const wranglerCmd = process.platform === 'win32' ? 'npx.cmd wrangler' : 'npx wrangler';
  const remoteFlag = remote ? '--remote' : '--local';

  const masterJson = execSync(
    `${wranglerCmd} d1 execute ${dbName} ${remoteFlag} --json --command="SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name;"`,
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );

  const parsed = JSON.parse(masterJson);
  const items = parsed[0]?.results || [];

  const tables = items.filter(r => r.type === 'table');
  const virtualTables = tables.filter(r => r.sql && /create\s+virtual\s+table/i.test(r.sql));
  const virtualTableNames = new Set(virtualTables.map(t => t.name));

  const exportableTables = tables.filter(t => {
    if (virtualTableNames.has(t.name)) return false;
    if (t.name.startsWith('_emdash_fts_')) return false;
    return true;
  });

  console.log(`[d1-export] Found ${exportableTables.length} exportable tables (${virtualTables.length} virtual tables skipped from table dump).`);

  const tableArgs = exportableTables.map(t => `--table "${t.name}"`).join(' ');
  const exportCmd = `${wranglerCmd} d1 export ${dbName} ${remoteFlag} ${tableArgs} --output="${tempExportFile}" -y`;

  execSync(exportCmd, { stdio: 'inherit', maxBuffer: 50 * 1024 * 1024 });

  let fullSql = fs.readFileSync(tempExportFile, 'utf8');
  if (!fullSql.startsWith('PRAGMA foreign_keys = OFF;')) {
    fullSql = 'PRAGMA foreign_keys = OFF;\n' + fullSql;
  }

  // Append virtual tables
  const vTableSql = virtualTables.filter(v => v.sql).map(v => `${v.sql.trim()};`).join('\n\n');
  if (vTableSql) {
    fullSql += '\n\n-- Virtual Tables (FTS5)\n' + vTableSql + '\n';
  }

  // Append indexes
  const indexes = items.filter(r => r.type === 'index' && r.sql && !r.name.startsWith('sqlite_') && !r.name.startsWith('_emdash_fts_'));
  if (indexes.length) {
    fullSql += '\n\n-- Indexes\n' + indexes.filter(idx => !fullSql.includes(idx.sql.trim())).map(idx => `${idx.sql.trim()};`).join('\n') + '\n';
  }

  // Append triggers
  const triggers = items.filter(r => r.type === 'trigger' && r.sql);
  if (triggers.length) {
    fullSql += '\n\n-- Triggers\n' + triggers.filter(trg => !fullSql.includes(trg.sql.trim())).map(trg => `${trg.sql.trim()};`).join('\n') + '\n';
  }

  fs.writeFileSync(finalExportFile, fullSql, 'utf8');
  if (fs.existsSync(tempExportFile)) fs.unlinkSync(tempExportFile);

  const stats = fs.statSync(finalExportFile);
  console.log(`[d1-export] Successfully exported D1 database to ${finalExportFile} (${(stats.size / 1024).toFixed(1)} KB)`);
  return { file: finalExportFile, size: stats.size, tables: exportableTables.length };
}

if (process.argv[1] && process.argv[1].endsWith('d1-export.mjs')) {
  try {
    const args = parseArgs(process.argv.slice(2));
    exportD1Database(args);
  } catch (err) {
    console.error(`[d1-export] Error: ${err.message}`);
    process.exit(1);
  }
}
