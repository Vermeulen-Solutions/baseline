import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseArgs,
  openDesignDataDir,
  listProjectDirs,
  resolveProjectDir,
  scanArtifacts,
  changedArtifacts,
  openCommand,
} from '../scripts/watch-design-artifacts.mjs';

function tempDir() {
  return mkdtempSync(path.join(os.tmpdir(), 'od-watch-'));
}

function write(file, body, seconds = 0) {
  writeFileSync(file, body);
  if (seconds > 0) utimesSync(file, seconds, seconds);
}

test('changedArtifacts reports new and rewritten artifacts, newest first', () => {
  const base = { file: 'a.html', mtimeMs: 1000, size: 10 };
  const previous = new Map([['a.html', base]]);
  const current = new Map([
    ['a.html', { ...base, mtimeMs: 2000 }],
    ['b.html', { file: 'b.html', mtimeMs: 3000, size: 5 }],
    ['c.html', { file: 'c.html', mtimeMs: 2000.5, size: 7 }],
  ]);
  assert.deepEqual(changedArtifacts(previous, current).map(entry => entry.file), ['b.html', 'c.html', 'a.html']);
});

test('a changed size alone counts as a change, so a same-millisecond rewrite is not missed', () => {
  const previous = new Map([['a.html', { file: 'a.html', mtimeMs: 5, size: 10 }]]);
  const current = new Map([['a.html', { file: 'a.html', mtimeMs: 5, size: 11 }]]);
  assert.equal(changedArtifacts(previous, current).length, 1);
});

test('an unchanged artifact is not reopened on every poll', () => {
  const same = { file: 'a.html', mtimeMs: 5, size: 10 };
  const previous = new Map([['a.html', same]]);
  const current = new Map([['a.html', { ...same }]]);
  assert.deepEqual(changedArtifacts(previous, current), []);
});

test('scanArtifacts reads only top-level html artifacts', () => {
  const dir = tempDir();
  try {
    write(path.join(dir, 'concept-a.html'), '<p>a</p>');
    write(path.join(dir, 'concept-b.html'), '<p>b</p>');
    write(path.join(dir, 'concept-a.html.artifact.json'), '{}');
    write(path.join(dir, '.hidden.html'), '');
    write(path.join(dir, 'notes.md'), '');
    mkdirSync(path.join(dir, '.file-versions'));
    write(path.join(dir, '.file-versions', 'concept-a.html'), 'old');

    assert.deepEqual([...scanArtifacts(dir).keys()].sort(), ['concept-a.html', 'concept-b.html']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveProjectDir accepts an exact id, a unique prefix, and falls back to the newest project', () => {
  const root = tempDir();
  try {
    const projects = path.join(root, 'namespaces', 'release-stable-win', 'data', 'projects');
    mkdirSync(path.join(projects, 'client-a'), { recursive: true });
    mkdirSync(path.join(projects, 'client-b'), { recursive: true });
    mkdirSync(path.join(projects, 'other'), { recursive: true });
    utimesSync(path.join(projects, 'client-a'), 500, 500);
    utimesSync(path.join(projects, 'client-b'), 900, 900);
    utimesSync(path.join(projects, 'other'), 700, 700);

    assert.equal(resolveProjectDir({ dataDir: root, project: 'client-a' }).id, 'client-a');
    assert.equal(resolveProjectDir({ dataDir: root, project: 'oth' }).id, 'other');
    assert.equal(resolveProjectDir({ dataDir: root }).id, 'client-b');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('an ambiguous prefix is refused instead of guessing', () => {
  const root = tempDir();
  try {
    const projects = path.join(root, 'namespaces', 'release-stable-win', 'data', 'projects');
    mkdirSync(path.join(projects, 'ghc-direction-a'), { recursive: true });
    mkdirSync(path.join(projects, 'ghc-direction-b'), { recursive: true });
    assert.throws(() => resolveProjectDir({ dataDir: root, project: 'ghc-direction' }), /ambiguous/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('no project at all names the data directory instead of throwing something opaque', () => {
  const root = tempDir();
  try {
    assert.throws(() => resolveProjectDir({ dataDir: root }), /No OpenDesign projects/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the newest project is chosen when no id is given', () => {
  const root = tempDir();
  try {
    const projects = path.join(root, 'namespaces', 'release-stable-win', 'data', 'projects');
    mkdirSync(path.join(projects, 'older'), { recursive: true });
    mkdirSync(path.join(projects, 'newer'), { recursive: true });
    utimesSync(path.join(projects, 'older'), 100, 100);
    utimesSync(path.join(projects, 'newer'), 200, 200);
    assert.equal(resolveProjectDir({ dataDir: root }).id, 'newer');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('listProjectDirs reads every channel namespace', () => {
  const root = tempDir();
  try {
    mkdirSync(path.join(root, 'namespaces', 'release-stable-win', 'data', 'projects', 'win-proj'), { recursive: true });
    mkdirSync(path.join(root, 'namespaces', 'release-canary', 'data', 'projects', 'canary-proj'), { recursive: true });
    assert.deepEqual(listProjectDirs(root).map(project => project.id).sort(), ['canary-proj', 'win-proj']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the data directory follows each platform convention', () => {
  assert.equal(openDesignDataDir('win32', { APPDATA: 'C:/Users/x/AppData/Roaming' }), path.join('C:/Users/x/AppData/Roaming', 'Open Design'));
  assert.equal(openDesignDataDir('linux', { XDG_CONFIG_HOME: '/home/x/.config' }), path.join('/home/x/.config', 'Open Design'));
  assert.match(openDesignDataDir('darwin', {}), /Application Support[\\/]Open Design$/);
  assert.throws(() => openDesignDataDir('win32', {}), /APPDATA/);
});

test('the opener is the platform default application', () => {
  assert.deepEqual(openCommand('a.html', 'win32'), ['explorer.exe', ['a.html']]);
  assert.deepEqual(openCommand('a.html', 'darwin'), ['open', ['a.html']]);
  assert.equal(openCommand('a.html', 'linux')[0], 'xdg-open');
});

test('arguments are validated before anything is watched', () => {
  assert.deepEqual(parseArgs(['--project', 'client-a', '--no-open', '--once']), {
    interval: 1500,
    all: false,
    openExisting: false,
    open: false,
    once: true,
    project: 'client-a',
  });
  assert.throws(() => parseArgs(['--project', 'a', '--dir', 'b']), /not both/);
  assert.throws(() => parseArgs(['--interval', '10']), /at least 250/);
  assert.throws(() => parseArgs(['--nope']), /Unknown option/);
});
