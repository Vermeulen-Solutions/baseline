import fs from 'node:fs';
import path from 'node:path';
import { execNpmSync } from './process-runner.mjs';
import { randomUUID } from 'node:crypto';
import { parse as parseJSONC } from 'jsonc-parser';
import { argumentsOf, bytesOf, isMain } from './infrastructure-io.mjs';

function detectDatabase() {
  for (const file of ['wrangler.jsonc', 'wrangler.json']) {
    if (fs.existsSync(file)) {
      try {
        const errors = [];
        const data = parseJSONC(bytesOf(file, 1024 * 1024).toString('utf8'), errors, { allowTrailingComma: true });
        if (errors.length) continue;
        const d1 = data.d1_databases?.[0]?.database_name;
        if (d1) return d1;
      } catch {}
    }
  }
  return null;
}

export function exportD1Database({ database, out, remote = true } = {}, runNpm = execNpmSync) {
  const dbName = database || detectDatabase();
  if (!dbName) throw new Error('Database name required: specify --database <name> or configure in wrangler.jsonc');

  const dateStr = new Date().toISOString().slice(0, 10);
  const finalExportFile = out ? path.resolve(out) : path.resolve(`./d1-export-${dbName}-${dateStr}.sql`);
  const tempExportFile = path.resolve(`./.temp-d1-export-${randomUUID()}.sql`);

  console.log(`[d1-export] Querying sqlite_master from D1 database "${dbName}"...`);
  const wranglerArgs = ['exec', '--', 'wrangler'];
  const remoteFlag = remote ? '--remote' : '--local';

  const masterJson = runNpm(
    [...wranglerArgs, 'd1', 'execute', dbName, remoteFlag, '--json', '--command', "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name;"],
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

  const tableArgs = exportableTables.flatMap(t => ['--table', t.name]);
  try {
    runNpm([...wranglerArgs, 'd1', 'export', dbName, remoteFlag, ...tableArgs, '--output', tempExportFile, '-y'], { stdio: 'inherit', maxBuffer: 50 * 1024 * 1024 });

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

    const stats = fs.statSync(finalExportFile);
    console.log(`[d1-export] Successfully exported D1 database to ${finalExportFile} (${(stats.size / 1024).toFixed(1)} KB)`);
    return { file: finalExportFile, size: stats.size, tables: exportableTables.length };
  } finally {
    if (fs.existsSync(tempExportFile)) fs.unlinkSync(tempExportFile);
  }
}

if (isMain(import.meta.url)) {
  try {
    const { local, ...args } = argumentsOf(process.argv.slice(2), ['--database', '--out'], ['--local']);
    exportD1Database({ ...args, remote: !local });
  } catch (err) {
    console.error(`[d1-export] Error: ${err.message}`);
    process.exitCode = 1;
  }
}
