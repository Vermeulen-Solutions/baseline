import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rehearseImporter } from '../scripts/rehearse-importer.mjs';
import { syntheticWXR, portableFacts } from './fixtures/importer-fidelity/fixture-tools.mjs';

const fixtures = fileURLToPath(new URL('./fixtures/importer-fidelity/', import.meta.url));
test('reviewed synthetic WXR, Exporter and Portable Text oracles cover the maintained contracts', () => {
  const f = JSON.parse(fs.readFileSync(path.join(fixtures, 'wordpress.json')));
  assert.equal(syntheticWXR(f), fs.readFileSync(path.join(fixtures, 'wordpress.xml'), 'utf8'));
  assert.equal(f.posts.length, 14);
  assert.deepEqual([...new Set(f.posts.map(p => p.status))].sort(), ['draft', 'future', 'pending', 'private', 'publish', 'trash']);
  assert.ok(f.posts.find(p => p.id === 104).content.includes('/custom-gallery-destination/'));
  const oracle = JSON.parse(fs.readFileSync(path.join(fixtures, 'expected-content.json')));
  assert.deepEqual(oracle.gallery[0].images.map(i => i.asset.url), ['attachment:202', 'attachment:201', 'attachment:202']);
  assert.equal(oracle.unsupported[1].originalBlockName, 'vendor/live-query');
  assert.deepEqual(portableFacts([{ _key: 'random', _type: 'block', children: [{ marks: ['random-link'], text: 'link' }], markDefs: [{ _key: 'random-link', _type: 'link', href: '/target' }] }])[0].children[0].marks, [{ _type: 'link', href: '/target' }]);
});

test('installed WXR/Exporter endpoints, SQLite, public renderer, retries and F3/F4 acceptance rehearse offline', { timeout: 180000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-importer-test-'));
  try {
    const { receipt } = await rehearseImporter({ out: path.join(directory, 'evidence'), signal: t.signal });
    assert.equal(receipt.status, 'passed'); assert.equal(receipt.externalNetworkRequests, 0);
    assert.equal(receipt.observations.acceptance.restorationHTTP, 0);
    assert.equal(receipt.observations.acceptance.deliberateLossInventory, 1);
    assert.equal(receipt.observations.retrySemantics.changedSlugCreatesExtraEntity, true);
    assert.ok(receipt.cleanup.disposableDatabaseAndMediaRemoved);
  } finally {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir())); assert.match(path.basename(directory), /^baseline-importer-test-/);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
