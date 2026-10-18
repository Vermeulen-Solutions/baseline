import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Sveltia form, frontmatter and native image paths match the Astro collection', () => {
  const config = JSON.parse(fs.readFileSync('public/admin/config.yml', 'utf8'));
  const schema = fs.readFileSync('src/content.config.ts', 'utf8');
  const posts = config.collections.find(c => c.name === 'posts');
  assert.equal(config.backend.name, 'github');
  assert.match(config.backend.repo, /^[\w.-]+\/[\w.-]+$/);
  assert.equal(config.output.omit_empty_optional_fields, true);
  assert.equal(config.output.encode_file_path, true);
  assert.ok(config.public_folder.startsWith('/'), 'Sveltia requires an absolute global public_folder; collection paths may be relative');
  assert.equal(posts.folder, 'src/content/posts');
  assert.equal(posts.create, true);
  assert.equal(posts.format, 'yaml-frontmatter');
  assert.equal(posts.extension, 'md');
  const widgets = { title: 'string', description: 'text', publishedAt: 'datetime', draft: 'boolean', hero: 'image', heroAlt: 'string', body: 'markdown' };
  assert.deepEqual(posts.fields.map(f => f.name).sort(), Object.keys(widgets).sort());
  for (const field of posts.fields) {
    assert.equal(field.widget, widgets[field.name]);
    if (field.name !== 'body') assert.match(schema, new RegExp(`\\b${field.name}:`));
  }
  for (const name of ['hero', 'heroAlt', 'draft']) assert.equal(posts.fields.find(f => f.name === name).required, false);
  assert.equal(posts.fields.find(f => f.name === 'draft').default, false);
  assert.match(schema, /hero && !post.heroAlt/);
  const reference = posts.public_folder + '/pilot-grid.jpg';
  assert.equal(path.posix.normalize(path.posix.join(posts.folder, reference)), 'src/assets/pilot-grid.jpg');
  assert.equal(posts.media_folder, '/src/assets');
  assert.ok(fs.existsSync(posts.media_folder.slice(1) + '/pilot-grid.jpg'));
  assert.match(fs.readFileSync('src/content/posts/welcome.md', 'utf8'), /hero:.*\.\.\/\.\.\/assets\/pilot-grid\.jpg/);
  const html = fs.readFileSync('public/admin/index.html', 'utf8');
  assert.match(html, /@sveltia\/cms@\d+\.\d+\.\d+\/dist\/sveltia-cms\.js/);
  assert.match(html, /integrity="sha384-[A-Za-z0-9+/=]+" crossorigin="anonymous"/);
  const scriptURL = html.match(/<script[^>]*src="([^"]+)"/)?.[1];
  assert.match(scriptURL, /^https:\/\/unpkg\.com\/@sveltia\/cms@\d+\.\d+\.\d+\/dist\/sveltia-cms\.js$/);
  assert.ok(!/client_secret|access_token/.test(JSON.stringify(config)));
});
