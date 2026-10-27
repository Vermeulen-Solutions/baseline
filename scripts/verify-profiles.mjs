import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { initProfile } from './init-profile.mjs';
import { spawnNpmSync } from './process-runner.mjs';
import { argumentsOf } from './infrastructure-io.mjs';
import { saveCapture } from './wordpress-source.mjs';
import { planStatic, applyStatic } from './wordpress-static.mjs';

async function main() {
  const source = fileURLToPath(new URL('../', import.meta.url));
  const options = argumentsOf(process.argv.slice(2), ['--profile'], ['--public-browser', '--keep']);
  const profiles = options.profile ? [options.profile] : ['static', 'static-sveltia'];
  const publicBrowser = options['public-browser'];
  if (publicBrowser && (process.env.CI || process.env.GITHUB_ACTIONS === 'true')) throw new Error('Browser verification is local-only; CI may run HTTP checks only');
  if (profiles.some(p => !['static', 'static-sveltia'].includes(p))) throw new Error('Unknown static profile');
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'baseline-profile-verification-'));
  const receipts = [];
  const fixtureSite = 'https://static-profile.example.test';
  try {
    for (const profile of profiles) {
      const root = path.join(temporary, profile);
      await initProfile({ profile, out: root });
      // Optional prose references must not add a schema-validation or package requirement.
      await fs.writeFile(path.join(root, 'DESIGN.md'), '# Design reference\n\nKeep the selected direction in AGENTS.md and implemented values in CSS.\n');
      // Explicit content fixture only inside this owned generated project. Never a source-template entry.
      const draftPath = 'src/content/posts/metadata-draft.md';
      const draft = '---\ntitle: PRIVATE METADATA DRAFT\ndescription: Must not be published\npublishedAt: 2026-01-01\ndraft: true\n---\nPrivate synthetic draft.\n';
      await fs.writeFile(path.join(root, draftPath), draft);
      // Exercise the shipped WordPress adapter in an independently installed target.
      // The mock supplies only synthetic metadata and the existing neutral fixture image.
      const wpOrigin = 'https://wordpress-migration.example.test';
      const wpImage = await fs.readFile(path.join(root, 'src/assets/pilot-grid.jpg'));
      const wpRecord = (id, pathname, extra = {}) => ({
        key: 'page:' + id, id, type: 'page', status: 'publish', slug: pathname,
        title: 'Imported WordPress page', excerpt: 'Synthetic WordPress migration acceptance.',
        html: '<p>IMPORTED WORDPRESS BODY</p><figure><img class="wp-image-701" src="' + wpOrigin + '/crop-300x200.jpg" alt="Synthetic image"><figcaption>Imported contextual caption.</figcaption></figure>',
        permalink: wpOrigin + '/' + pathname + '/', date: '2026-10-01T12:00:00', modified: null,
        author: 'Synthetic author', featuredMedia: 701, locale: null, translationGroup: null, taxonomies: {}, meta: {},
        ...extra,
      });
      const wpCapture = await saveCapture({
        version: 1, source: { kind: 'exporter', url: wpOrigin }, records: [
          wpRecord(100, 'migrated-article'), wpRecord(101, 'hidden-wordpress'),
          wpRecord(102, 'private-source', { status: 'private', html: 'PRIVATE WORDPRESS SOURCE' }),
        ],
        media: [{ id: 701, url: wpOrigin + '/photo.jpg', alt: 'Synthetic source image', caption: '' }, { id: 702, url: wpOrigin + '/unused.jpg', alt: 'Unused image', caption: '' }],
        analysis: {}, extras: {},
      }, { out: path.join(root, '.baseline/backups/wp-capture'), root, request: async () => ({ status: 200, headers: { 'content-type': 'image/jpeg' }, body: wpImage }) });
      assert.equal(wpCapture.exitCode, 0);
      const wpPlan = planStatic({ capture: wpCapture.directory, out: path.join(root, '.baseline/backups/wp-plan'), root });
      assert.deepEqual(wpPlan.findings, []);
      assert.equal(wpPlan.media, 1, 'Unreferenced source media must stay private');
      assert.equal(wpPlan.retainedUnpublished, 1);
      applyStatic({ stage: wpPlan.directory, root });
      const importedDraft = path.join(root, 'src/content/wordpress/wp-page-101.md');
      await fs.writeFile(importedDraft, (await fs.readFile(importedDraft, 'utf8')).replace('draft: false', 'draft: true'));
      const gatePath = path.join(root, 'audit/design-gate-exceptions.json');
      const gate = JSON.parse(await fs.readFile(gatePath, 'utf8'));
      gate.push({ path: draftPath, reason: 'Exact synthetic publication-filter fixture in the owned generated verification project only; no client visual implementation.', sha256: createHash('sha256').update(draft).digest('hex') });
      for (const relative of ['src/content/wordpress/wp-page-100.md', 'src/content/wordpress/wp-page-101.md', 'src/components/WordPressEntry.astro', 'src/pages/[...wordpress].astro', 'src/content.config.ts', 'src/wordpress.collection.ts', ...(profile === 'static-sveltia' ? ['public/admin/config.yml'] : []), ...(await fs.readdir(path.join(root, 'src/assets/wordpress'))).map(name => 'src/assets/wordpress/' + name)]) {
        const old = gate.findIndex(entry => entry.path === relative);
        if (old >= 0) gate.splice(old, 1);
        gate.push({ path: relative, reason: 'Exact synthetic WordPress migration/draft-filter fixture in the owned generated verification project only; no client art direction.', sha256: createHash('sha256').update((await fs.readFile(path.join(root, relative))).toString('utf8').replaceAll('\r\n', '\n')).digest('hex') });
      }
      await fs.writeFile(gatePath, JSON.stringify(gate, null, 2) + '\n');
      for (const args of [['install', '--no-audit', '--no-fund'], ['ci', '--no-audit', '--no-fund'], ['run', 'media:prepare', '--', '--source', 'src/assets/pilot-grid.jpg', '--out', '.baseline/backups/preparation-smoke'], ['run', 'verify'], ['run', 'build'], ['run', 'check:dev-tools'], ['run', 'fixtures:build']]) {
        console.log(`[${profile}] npm ${args.join(' ')}`);
        const result = spawnNpmSync(args, { cwd: root, stdio: 'inherit', timeout: 300000, env: { ...process.env, SITE_URL: fixtureSite } });
        if (result.error) throw result.error;
        assert.equal(result.status, 0, `${profile}: npm ${args.join(' ')}`);
      }
      const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'));
      const importedHTML = await fs.readFile(path.join(root, 'dist/migrated-article/index.html'), 'utf8');
      assert.ok(importedHTML.includes('IMPORTED WORDPRESS BODY') && importedHTML.includes('Imported contextual caption.') && importedHTML.includes('Synthetic image'));
      assert.ok(importedHTML.includes('/_astro/'), 'Imported images use native static Astro processing');
      for (const missing of ['hidden-wordpress', 'private-source']) await assert.rejects(fs.stat(path.join(root, 'dist', missing, 'index.html')), { code: 'ENOENT' });
      assert.equal((await fs.readdir(path.join(root, 'src/assets/wordpress'))).length, 1);
      assert.ok(!Object.keys(lock.packages).some(name => /(?:^|\/)(?:@emdash-cms|emdash|[^/]*sqlite[^/]*|libsql|@libsql)(?:\/|$)/i.test(name)), 'CMS/database package in independent lockfile');
      assert.equal((await fs.lstat(path.join(root, 'node_modules'))).isSymbolicLink(), false);
      assert.ok(!Object.keys(lock.packages).some(name => name.endsWith('/@cloudflare/workers-types')), 'Workers plugin types in static lockfile');
      assert.ok(!Object.keys(lock.packages).some(name => name.endsWith('/@google/design.md')), 'Optional design exchange package in independent lockfile');
      for (const relative of ['scripts/upload-prepared-media.mjs', 'scripts/rehearse-media-preparation.mjs']) await assert.rejects(fs.stat(path.join(root, relative)), { code: 'ENOENT' });
      await assert.rejects(fs.stat(path.join(root, 'scripts/design-interchange.mjs')), { code: 'ENOENT' });
      for (const relative of ['dist/server', 'data.db', 'seed', 'src/plugins', '.agents/skills/building-emdash-site']) await assert.rejects(fs.stat(path.join(root, relative)), { code: 'ENOENT' });
      if (profile === 'static-sveltia') {
        for (const relative of ['admin/index.html', 'admin/config.yml']) assert.deepEqual(await fs.readFile(path.join(root, 'dist', relative)), await fs.readFile(path.join(root, 'public', relative)));
      } else await assert.rejects(fs.stat(path.join(root, 'dist/admin')), { code: 'ENOENT' });
      const result = spawnSync(process.execPath, ['tests/static-pilot.integration.mjs', '--root', root, '--site-url', fixtureSite, ...(publicBrowser ? ['--public-browser'] : [])], { cwd: source, stdio: 'inherit', timeout: publicBrowser ? 240000 : 120000 });
      assert.equal(result.status, 0, 'Generated profile HTTP integration');
      receipts.push({ profile, root, independentInstall: true, cleanInstall: true, databasePackages: 0, verify: 'passed', production: 'passed', fixtures: 'passed', http: 'passed', ...(publicBrowser && { publicBrowser: 'passed' }) });
    }
    console.log(JSON.stringify(receipts, null, 2));
  } finally {
    if (options.keep) console.log('Retained verification directory: ' + temporary);
    else {
      assert.equal(path.dirname(temporary), path.resolve(os.tmpdir()));
      assert.ok(path.basename(temporary).startsWith('baseline-profile-verification-'));
      await fs.rm(temporary, { recursive: true, force: true });
    }
  }
}

try { await main(); }
catch (error) { console.error(error.message); process.exitCode = 1; }
