import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { initProfile } from '../scripts/init-profile.mjs';

test('Sveltia is an additive dependency-free overlay with paired forms and static CI', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'baseline-sveltia-assembly-'));
  try {
    const root = path.join(temp, 'sveltia');
    await initProfile({ profile: 'static-sveltia', out: root });
    const read = file => fs.readFile(path.join(root, file), 'utf8');
    const pkg = JSON.parse(await read('package.json'));
    assert.equal(pkg.scripts['sync:baseline'], 'node scripts/sync-baseline.mjs');
    assert.ok(!JSON.stringify(pkg.dependencies).includes('sveltia'));
    assert.ok(!JSON.stringify(pkg).includes('emdash'));
    for (const name of ['design-checks', 'upstream-update']) {
      const workflow = await read(`.github/workflows/${name}.yml`);
      assert.match(workflow, /npm ci --no-audit --no-fund/);
      for (const command of ['npm run verify', 'npm run build', 'npm run check:dev-tools']) assert.ok(workflow.includes(command));
      assert.ok(!/sqlite|data\.db|schema-budget|sync:emdash|git push|legacy-peer-deps|\|\| true/i.test(workflow));
      assert.ok(!/contents: write|issues: write|pull-requests: write/.test(workflow));
    }
    const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
    const check = spawnSync(process.execPath, ['--test', 'tests/sveltia-config.test.mjs'], { cwd: root, encoding: 'utf8', env });
    assert.equal(check.status, 0, check.stdout + check.stderr);
    assert.match(check.stdout, /Sveltia form, frontmatter and native image paths/);
    const receipt = JSON.parse(await read('.baseline/managed-files.json'));
    for (const file of ['public/admin/config.yml', 'public/admin/index.html', 'src/layouts/Base.astro']) assert.equal(receipt.files[file].ownership, 'client');
    const config = JSON.parse(await read('baseline.config.json'));
    assert.equal(config.platformProfile, 'static-sveltia');
    assert.equal(config.source.repository, 'https://github.com/Vermeulen-Solutions/baseline');
    assert.deepEqual(config.skills, ['new-site-workflow', 'site-art-direction', 'astro-site-design', 'impeccable']);
  } finally {
    assert.equal(path.dirname(temp), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temp).startsWith('baseline-sveltia-assembly-'));
    await fs.rm(temp, { recursive: true, force: true });
  }
});
