import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { auditFontPreflight } from '../scripts/font-preflight.mjs';

// Fixture font from the @fontsource/noto-sans development dependency, which this suite needs.
const fixtureFont = new URL('../node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff2', import.meta.url);
if (!fs.existsSync(fixtureFont)) throw new Error('tests/font-preflight.test.mjs needs the @fontsource/noto-sans development dependency for its fixture font. Install the version pinned by Baseline (npm install --save-dev --save-exact @fontsource/noto-sans@<version>) or skip this suite.');
const realFont = fs.readFileSync(fixtureFont);
const roles = '@theme { --font-body: "Fixture Face", sans-serif; --font-display: var(--font-body); --font-accent: var(--font-display); --font-mono: ui-monospace, monospace; }';
const face = (url = '/fonts/Fixture.woff2', extra = '') => `@font-face { font-family: "Fixture Face"; src: url("${url}") format("woff2"); font-weight: 100 900; font-style: normal; font-display: swap; ${extra} }`;
function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'font-preflight-'));
  fs.mkdirSync(path.join(root, 'public/fonts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src/styles'), { recursive: true });
  fs.writeFileSync(path.join(root, 'public/fonts/Fixture.woff2'), realFont);
  try { return run(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('four typography roles share one actual local font; aliases and existing mixed-case names remain read-only', () => fixture(root => {
  const file = path.join(root, 'public/fonts/Fixture.woff2'), before = digest(fs.readFileSync(file));
  const result = auditFontPreflight(roles + face(), { rootDir: root });
  assert.equal(result.valid, true); assert.equal(result.status, 'observed');
  assert.equal(result.roles.length, 4); assert.ok(result.roles.every(role => role.status === 'source-declared'));
  assert.equal(result.faces[0].assets[0].format, 'woff2'); assert.equal(result.faces[0].assets[0].status, 'header-checked');
  assert.equal(digest(fs.readFileSync(file)), before); assert.deepEqual(fs.readdirSync(path.dirname(file)), ['Fixture.woff2']);
}));

test('missing and case-mismatched references fail on case-insensitive hosts too', () => fixture(root => {
  for (const url of ['/fonts/Missing.woff2', '/fonts/Missing.eot', '/fonts/Missing.bin', '/fonts/fixture.woff2', '/Fonts/Fixture.woff2']) {
    const result = auditFontPreflight(roles + face(url), { rootDir: root });
    assert.equal(result.valid, false, url); assert.ok(result.errors.some(error => error.code === 'font-path'));
  }
}));

test('font header, extension and declared format must agree; a renamed image cannot pass', () => fixture(root => {
  fs.writeFileSync(path.join(root, 'public/fonts/NotFont.woff2'), Buffer.alloc(100, 65));
  assert.equal(auditFontPreflight(face('/fonts/NotFont.woff2'), { rootDir: root }).valid, false);
  fs.writeFileSync(path.join(root, 'public/fonts/Wrong.otf'), realFont);
  const wrongExtension = auditFontPreflight(face('/fonts/Wrong.otf'), { rootDir: root });
  assert.ok(wrongExtension.errors.some(error => error.code === 'font-format-mismatch'));
  const wrongDescriptor = auditFontPreflight(face().replace('format("woff2")', 'format("truetype")'), { rootDir: root });
  assert.ok(wrongDescriptor.errors.some(error => error.code === 'font-format-mismatch'));
  const truncated = Buffer.from(realFont.subarray(0, 40)); fs.writeFileSync(path.join(root, 'public/fonts/Truncated.woff2'), truncated);
  assert.equal(auditFontPreflight(face('/fonts/Truncated.woff2'), { rootDir: root }).valid, false);
}));

test('valid legacy/native font headers are advisory rather than a forced conversion', () => fixture(root => {
  // Deliberately only a sfnt header/table-directory fixture: preflight does not claim decoding.
  const bytes = Buffer.alloc(28); bytes.writeUInt32BE(0x00010000, 0); bytes.writeUInt16BE(1, 4);
  const file = path.join(root, 'public/fonts/legacy.ttf'); fs.writeFileSync(file, bytes);
  const result = auditFontPreflight(face('/fonts/legacy.ttf').replace('format("woff2")', 'format("truetype")'), { rootDir: root });
  assert.equal(result.valid, true); assert.ok(result.advisories.some(item => item.code === 'prefer-woff2'));
  assert.deepEqual(fs.readFileSync(file), bytes);
}));

test('invalid weight/style ranges fail; computed descriptors remain explicit review work', () => fixture(root => {
  for (const descriptor of ['font-weight: 0', 'font-weight: 1001', 'font-weight: 900 100', 'font-weight: 0x100', 'font-weight: 0b100', 'font-weight: 400.', 'font-style: slanted', 'font-style: oblique 30deg 10deg', 'font-style: oblique 91deg', 'font-style: oblique 30.deg', 'font-display: eventually']) {
    const result = auditFontPreflight(face(undefined, descriptor), { rootDir: root });
    assert.equal(result.valid, false, descriptor); assert.ok(result.errors.some(item => item.code === 'font-descriptor'));
  }
  for (const descriptor of ['font-weight: 450', 'font-weight: +400.5', 'font-weight: 4e2', 'font-weight: NORMAL', 'font-style: oblique -10deg 20deg', 'font-style: oblique 0turn 0.1turn', 'font-style: oblique 3e1deg', 'font-display: SWAP']) assert.equal(auditFontPreflight(face(undefined, descriptor), { rootDir: root }).valid, true, descriptor);
  const dynamic = auditFontPreflight(face(undefined, 'font-weight: var(--requested-weight)'), { rootDir: root });
  assert.equal(dynamic.valid, true); assert.ok(dynamic.advisories.some(item => item.code === 'dynamic-descriptor'));
}));

test('bare CSS imports prefer exact owned files, preserve case errors, and keep declared packages unresolved', () => fixture(root => {
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ dependencies: { 'normalize.css': '1.0.0' } }));
  const declared = auditFontPreflight('@import "normalize.css";', { rootDir: root });
  assert.equal(declared.valid, true); assert.ok(declared.advisories.some(item => item.code === 'package-css-import'));
  assert.equal(auditFontPreflight('@import "./normalize.css";', { rootDir: root }).valid, false);
  fs.writeFileSync(path.join(root, 'src/styles/normalize.css'), face());
  const local = auditFontPreflight('@import "normalize.css";', { rootDir: root });
  assert.equal(local.valid, true); assert.equal(local.faces.length, 1); assert.equal(local.advisories.some(item => item.code === 'package-css-import'), false);
  assert.equal(auditFontPreflight('@import "Normalize.css";', { rootDir: root }).valid, false);
  fs.rmSync(path.join(root, 'src/styles/normalize.css'));
  fs.writeFileSync(path.join(root, 'src/styles/Normalize.css'), face());
  const wrongCase = auditFontPreflight('@import "normalize.css";', { rootDir: root });
  assert.equal(wrongCase.valid, false); assert.ok(wrongCase.errors.some(item => item.code === 'css-import'));
}));

test('CSS at-rule names are case-insensitive without bypassing local reference checks', () => fixture(root => {
  fs.writeFileSync(path.join(root,'src/styles/fonts.css'),face().replace('@font-face','@FONT-FACE'));
  const source='@IMPORT "fonts.css";'+roles;
  const valid=auditFontPreflight(source,{rootDir:root});
  assert.equal(valid.valid,true);assert.equal(valid.faces.length,1);assert.equal(valid.sources.length,2);
  fs.writeFileSync(path.join(root,'src/styles/fonts.css'),face('/fonts/Missing.woff2').replace('@font-face','@FoNt-FaCe'));
  assert.equal(auditFontPreflight(source,{rootDir:root}).valid,false);
}));

test('only explicit owned CSS imports are followed and relative font URLs use that stylesheet', () => fixture(root => {
  fs.mkdirSync(path.join(root, 'src/styles/nested'));
  fs.writeFileSync(path.join(root, 'src/styles/nested/typography.css'), roles + face('../../../assets/Face.woff2'));
  fs.mkdirSync(path.join(root, 'src/assets')); fs.writeFileSync(path.join(root, 'src/assets/Face.woff2'), realFont);
  // Correct relative target is ../../assets; the first invalid relative reference is caught.
  assert.equal(auditFontPreflight('@import "./nested/typography.css";', { rootDir: root }).valid, false);
  fs.writeFileSync(path.join(root, 'src/styles/nested/typography.css'), roles + face('../../assets/Face.woff2'));
  fs.writeFileSync(path.join(root, 'src/styles/fonts.css'), roles + face('/fonts/Fixture.woff2'));
  const bare = auditFontPreflight('@import "fonts.css";', { rootDir: root });
  assert.equal(bare.valid, true); assert.equal(bare.faces[0].assets[0].status, 'header-checked');
  const result = auditFontPreflight('@import "./nested/typography.css";', { rootDir: root, cssPath: path.join(root, 'src/styles/global.css') });
  assert.equal(result.valid, true); assert.equal(result.sources.length, 2); assert.equal(result.faces[0].assets[0].path, 'src/assets/Face.woff2');
  fs.writeFileSync(path.join(root, 'src/styles/nested/typography.css'), '@import "../global.css";');
  fs.writeFileSync(path.join(root, 'src/styles/global.css'), '@import "./nested/typography.css";');
  assert.equal(auditFontPreflight('@import "./nested/typography.css";', { rootDir: root }).valid, true);
}));

test('existing unsupported font formats retain explicit unknown status without reading their contents', () => fixture(root => {
  const file = path.join(root, 'public/fonts/Legacy.eot'); fs.writeFileSync(file, 'Not parsed by the bounded header checker');
  const result = auditFontPreflight(face('/fonts/Legacy.eot').replace('format("woff2")', 'format("embedded-opentype")'), { rootDir: root });
  assert.equal(result.valid, true); assert.equal(result.faces[0].assets[0].status, 'unresolved');
  assert.ok(result.advisories.some(item => item.code === 'unsupported-font-format'));
  const failedCase = auditFontPreflight(face('/fonts/legacy.eot'), { rootDir: root });
  assert.equal(failedCase.valid, false);
}));

test('system roles pass without fonts; package/remote/local/dynamic sources are honest unresolved evidence', () => fixture(root => {
  const system = auditFontPreflight('@theme { --font-body: system-ui; --font-display: var(--font-body); --font-accent: Georgia, serif; --font-mono: monospace; }', { rootDir: root });
  assert.equal(system.valid, true); assert.equal(system.status, 'observed');
  const css = '@import "@fontsource/example/400.css"; @import "https://example.invalid/fonts.css";' + roles + '@font-face { font-family: "Fixture Face"; font-display: swap; src: local("Fixture Face"), url("https://example.invalid/font.woff2?secret=hidden"), var(--font-source); }';
  const result = auditFontPreflight(css, { rootDir: root });
  assert.equal(result.valid, true); assert.equal(result.status, 'requires-review');
  for (const code of ['package-css-import', 'external-css-import', 'local-font-source', 'external-source', 'unresolved-font-source']) assert.ok(result.advisories.some(item => item.code === code), code);
  assert.doesNotMatch(JSON.stringify(result), /secret|hidden/);
}));

test('private paths, traversal, links and oversized sources cannot become asset reads', () => fixture(root => {
  assert.equal(auditFontPreflight(face('../../../../outside.woff2'), { rootDir: root }).valid, false);
  fs.mkdirSync(path.join(root, '.private')); fs.writeFileSync(path.join(root, '.private/private.woff2'), realFont);
  assert.equal(auditFontPreflight(face('../../.private/private.woff2'), { rootDir: root }).valid, false);
  const link = path.join(root, 'public/linked'); fs.symlinkSync(path.join(root, 'public/fonts'), link, process.platform === 'win32' ? 'junction' : 'dir');
  try { assert.equal(auditFontPreflight(face('/linked/Fixture.woff2'), { rootDir: root }).valid, false); } finally { fs.unlinkSync(link); }
  const oversized = auditFontPreflight(' '.repeat(1024 * 1024 + 1), { rootDir: root });
  assert.equal(oversized.valid, false); assert.ok(oversized.errors.some(item => item.code === 'inspection-refused'));
}));

test('external explicit CSS source is inspected without opening outside files; unresolved aliases do not loop', () => fixture(root => {
  const result = auditFontPreflight(roles + face('./external.woff2'), { rootDir: root, cssPath: path.join(os.tmpdir(), 'external-fonts.css') });
  assert.equal(result.valid, true); assert.ok(result.advisories.some(item => item.code === 'external-css-reference'));
  assert.ok(result.sources.every(source => source === '[external-css]'));
  const cyclic = auditFontPreflight('@theme { --font-body: var(--font-display); --font-display: var(--font-body); }', { rootDir: root });
  assert.equal(cyclic.valid, true); assert.ok(cyclic.roles.every(role => role.status === 'unresolved'));
}));

test('package specifiers in @font-face url() from declared (scoped) packages are advisory, undeclared ones still fail', () => fixture(root => {
  const css = '@font-face { font-family: "Fixture Variable"; font-display: swap; src: url("@fontsource-variable/fixture/files/fixture-latin-wght-normal.woff2") format("woff2"); }';
  assert.equal(auditFontPreflight(css, { rootDir: root }).valid, false, 'an undeclared package is a missing file');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@fontsource-variable/fixture': '5.0.0' } }));
  const declared = auditFontPreflight(css, { rootDir: root });
  assert.equal(declared.valid, true);
  const advisory = declared.advisories.find(item => item.code === 'package-font-source');
  assert.ok(advisory && advisory.message.includes('@fontsource-variable/fixture'));
  assert.equal(declared.faces[0].assets[0].status, 'package');
  assert.equal(auditFontPreflight('@import "@fontsource-variable/fixture/wght.css";', { rootDir: root }).valid, true, 'scoped CSS imports resolve against the scoped package name');
}));
