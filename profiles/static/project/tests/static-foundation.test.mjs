import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { auditDesignTokens, auditEditProxies } from '../scripts/design-system.mjs';

test('shared tokens pass and CMS proxy checks are explicitly inapplicable', () => {
  const audit = auditDesignTokens(fs.readFileSync('src/styles/global.css', 'utf8'));
  assert.equal(audit.valid, true, audit.errors.join('\n'));
  assert.equal(auditEditProxies().applicability, 'not-applicable');
});
test('static dependencies and scripts have no CMS, database bootstrap or server adapter', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.ok(!Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some(name => /emdash|react|@astrojs\/(node|cloudflare)|sqlite/.test(name)));
  assert.ok(!JSON.stringify(pkg.scripts).includes('schema-budget'));
  assert.ok(!fs.existsSync('seed') && !fs.existsSync('data.db') && !fs.existsSync('src/live.config.ts'));
});
