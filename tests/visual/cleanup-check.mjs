import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { startVisualSite } from './site.mjs';

const root = process.cwd(), reportRoot = path.resolve('.emdash/visual/cleanup-probes');
await mkdir(reportRoot, { recursive: true });
for (const mode of ['failure', 'cancellation']) {
  const controller = new AbortController(), reports = path.join(reportRoot, mode);
  await assert.rejects(startVisualSite(root, reports, {
    signal: controller.signal,
    onDevReady() { if (mode === 'failure') throw new Error('Deliberate bootstrap failure'); controller.abort(); },
  }), mode === 'failure' ? /Deliberate bootstrap failure/ : /Visual bootstrap cancelled/);
  assert.deepEqual(JSON.parse(await readFile(path.join(reports, 'cleanup.json'), 'utf8')), { serverStopped: true, dependencyJunctionUnlinked: true, temporaryTreeRemoved: true, workingDatabaseCopied: false });
  console.log(`Owned visual ${mode} cleanup passed.`);
}
