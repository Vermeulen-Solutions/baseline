import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { collectBaseline } from '../scripts/audit-baseline.mjs';

test('baseline separates declared/locked/installed versions without writing or claiming certification', () => {
  const root = mkdtempSync(join(tmpdir(), 'emdash-baseline-'));
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ engines: { node: '>=22.16' }, dependencies: { astro: '^7.3.2', emdash: '1.1.0', absent: '^1' } }));
    writeFileSync(join(root, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/astro': { version: '7.3.5' }, 'node_modules/emdash': { version: '1.1.0' } } }));
    for (const [name, version] of [['astro', '7.4.0'], ['emdash', '1.1.0']]) {
      mkdirSync(join(root, 'node_modules', name), { recursive: true });
      writeFileSync(join(root, 'node_modules', name, 'package.json'), JSON.stringify({ version }));
    }
    const before = readdirSync(root, { recursive: true });
    const report = collectBaseline(root, new Date('2026-10-15T00:00:00Z'));
    assert.equal(report.packages.find(p => p.name === 'astro').status, 'drift');
    assert.equal(report.packages.find(p => p.name === 'emdash').status, 'observed-match');
    assert.equal(report.packages.find(p => p.name === 'absent').status, 'unverified');
    assert.equal(report.git.status, 'unverified');
    assert.equal(report.verification.databaseParity, 'unverified');
    assert.equal(report.verification.upstreamCurrency, 'unverified');
    assert.ok(report.skills.every(s => s.status === 'unverified'));
    assert.deepEqual(readdirSync(root, { recursive: true }), before);
  } finally {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    rmSync(root, { recursive: true, force: true });
  }
});
