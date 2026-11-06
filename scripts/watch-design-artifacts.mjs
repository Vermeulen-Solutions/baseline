#!/usr/bin/env node
// Auto-open OpenDesign artifacts as they change, outside the desktop shell.
//
//   npm run design:watch -- --project vermeulen-refonte-directions
//   npm run design:watch -- --dir "C:\Users\me\AppData\Roaming\Open Design\namespaces\release-stable-win\data\projects\client-a"
//   npm run design:watch -- --project client-a --no-open
//
// The desktop window does not open an artifact written by an external agent: `POST /api/active`
// is written by the web UI and never read back, `opendesign://` only handles workspace invites,
// and artifact writes emit no event. Artifacts are plain files, so this watches the project
// folder on disk and opens the newest changed `.html` in the default browser. Polling rather than
// `fs.watch` keeps it identical on Windows, macOS and Linux, on network drives, and across the
// write-then-rename patterns editors use. OpenDesign itself is not needed.
//
// Options:
//   --project <id>    Project id (or a prefix of one) under the OpenDesign data directory.
//   --dir <path>      Watch this directory instead of resolving a project.
//   --interval <ms>   Poll interval, default 1500.
//   --all             Open every artifact that changed in one poll, not only the newest.
//   --open-existing   Open the newest existing artifact on start (default: report, do not open).
//   --no-open         Print the path instead of opening a browser (remote shells, tests).
//   --once            Scan once, report, exit. Useful in scripts and to check resolution.
//   --help
//
// The path that gets opened is always a file under the resolved project directory; nothing else
// is launched. Windows uses `explorer.exe`, macOS `open`, Linux `xdg-open`, and WSL `wslview`
// with a `cmd.exe` fallback. A headless machine has no browser to open: use --no-open there.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_INTERVAL_MS = 1500;
export const ARTIFACT_PATTERN = /\.html$/i;

export function parseArgs(argv) {
  const out = { interval: DEFAULT_INTERVAL_MS, all: false, openExisting: false, open: true, once: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined || next.startsWith('--')) throw Error('Missing value for ' + flag);
      return next;
    };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--project') out.project = value();
    else if (flag === '--dir') out.dir = path.resolve(value());
    else if (flag === '--interval') out.interval = Number(value());
    else if (flag === '--all') out.all = true;
    else if (flag === '--open-existing') out.openExisting = true;
    else if (flag === '--no-open') out.open = false;
    else if (flag === '--once') out.once = true;
    else throw Error('Unknown option: ' + flag);
  }
  if (out.help) return out;
  if (out.dir && out.project) throw Error('Use --dir or --project, not both');
  if (!Number.isInteger(out.interval) || out.interval < 250) throw Error('--interval must be an integer of at least 250 ms');
  return out;
}

/** The platform's OpenDesign data directory, without the per-channel namespace. */
export function openDesignDataDir(platform = process.platform, env = process.env) {
  if (platform === 'win32') {
    if (!env.APPDATA) throw Error('APPDATA is not set; pass --dir instead');
    return path.join(env.APPDATA, 'Open Design');
  }
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Open Design');
  }
  return path.join(env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'Open Design');
}

/**
 * Every `namespaces/<channel>/data/projects/<id>` directory, newest project first.
 * Channels are release trains (`release-stable-win`, ...), so the same id can exist in more than
 * one; the freshest one wins.
 */
export function listProjectDirs(dataDir) {
  const namespaces = path.join(dataDir, 'namespaces');
  if (!existsSync(namespaces)) return [];
  const found = [];
  for (const channel of readdirSync(namespaces, { withFileTypes: true })) {
    if (!channel.isDirectory()) continue;
    const projects = path.join(namespaces, channel.name, 'data', 'projects');
    if (!existsSync(projects)) continue;
    for (const project of readdirSync(projects, { withFileTypes: true })) {
      if (!project.isDirectory()) continue;
      const dir = path.join(projects, project.name);
      found.push({ id: project.name, dir, mtimeMs: modifiedMs(dir) });
    }
  }
  return found.sort((left, right) => right.mtimeMs - left.mtimeMs);
}

function modifiedMs(directory) {
  try { return statSync(directory).mtimeMs; } catch { return 0; }
}

/**
 * Resolve the directory to watch: `--dir` verbatim, an exact project id, a unique id prefix, or
 * the most recently modified project when no project is given.
 */
export function resolveProjectDir({ dir, project, dataDir }) {
  if (dir) {
    if (!existsSync(dir)) throw Error(`Directory not found: ${dir}`);
    return { dir, id: path.basename(dir) };
  }
  const projects = listProjectDirs(dataDir);
  if (projects.length === 0) throw Error(`No OpenDesign projects under ${path.join(dataDir, 'namespaces')}`);
  if (!project) return projects[0];
  const exact = projects.find(candidate => candidate.id === project);
  if (exact) return exact;
  const matches = projects.filter(candidate => candidate.id.startsWith(project));
  if (matches.length === 1) return matches[0];
  if (matches.length === 0) throw Error(`No project matching "${project}" (available: ${projects.map(p => p.id).slice(0, 8).join(', ')}…)`);
  throw Error(`Project "${project}" is ambiguous: ${matches.map(p => p.id).join(', ')}`);
}

/** Top-level `.html` artifacts with their size and mtime. Hidden files and sidecars are ignored. */
export function scanArtifacts(dir) {
  const seen = new Map();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !ARTIFACT_PATTERN.test(entry.name) || entry.name.startsWith('.')) continue;
    const file = path.join(dir, entry.name);
    try {
      const stat = statSync(file);
      seen.set(entry.name, { file, mtimeMs: stat.mtimeMs, size: stat.size });
    } catch { /* raced with a delete; the next poll picks it up */ }
  }
  return seen;
}

/** Artifacts added or rewritten since the previous scan, newest first. */
export function changedArtifacts(previous, current) {
  const changed = [];
  for (const [name, entry] of current) {
    const before = previous.get(name);
    if (!before || before.mtimeMs !== entry.mtimeMs || before.size !== entry.size) changed.push(entry);
  }
  return changed.sort((left, right) => right.mtimeMs - left.mtimeMs);
}

/** The platform command that opens a file with its default application. */
export function openCommand(file, platform = process.platform) {
  if (platform === 'win32') return ['explorer.exe', [file]];
  if (platform === 'darwin') return ['open', [file]];
  if (isWsl()) return ['wslview', [file]];
  return ['xdg-open', [file]];
}

/** WSL exposes the Windows filesystem but has no browser binary of its own. */
export function isWsl() {
  try { return /microsoft/i.test(readFileSync('/proc/version', 'utf8')); } catch { return false; }
}

function launch(file, platform = process.platform) {
  const [command, args] = openCommand(file, platform);
  const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', error => console.error(`Could not open ${path.basename(file)} (${command}): ${error.message}`));
  child.unref();
}

function report(name) {
  console.log(`${new Date().toLocaleTimeString()}  ${name}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: npm run design:watch -- [--project <id>|--dir <path>] [--interval <ms>] [--all] [--open-existing] [--no-open] [--once]');
    return;
  }
  const target = resolveProjectDir({ dir: options.dir, project: options.project, dataDir: openDesignDataDir() });
  const label = path.basename(target.dir);
  console.log(`Watching ${label} (${target.dir})`);
  console.log(`Interval ${options.interval} ms · ${options.open ? 'opening in the default browser' : 'paths only (--no-open)'}`);

  let current = scanArtifacts(target.dir);
  console.log(`${current.size} artifact${current.size === 1 ? '' : 's'} present`);

  const open = files => {
    const chosen = options.all ? files : files.slice(0, 1);
    for (const entry of chosen) {
      report(path.basename(entry.file));
      if (options.open) launch(entry.file);
    }
    if (files.length > chosen.length) console.log(`  (+${files.length - chosen.length} more changed; --all opens every one)`);
  };

  const newest = [...current.values()].sort((left, right) => right.mtimeMs - left.mtimeMs).slice(0, 1);
  if (options.openExisting) open(newest);
  if (options.once) {
    // openExisting already reported the newest; list the rest so a scan still shows the set.
    const already = new Set(options.openExisting ? newest.map(entry => entry.file) : []);
    for (const entry of [...current.values()].sort((left, right) => right.mtimeMs - left.mtimeMs)) {
      if (!already.has(entry.file)) report(path.basename(entry.file));
    }
    return;
  }

  const timer = setInterval(() => {
    let next;
    try { next = scanArtifacts(target.dir); }
    catch (error) { console.error(`Scan failed: ${error.message}`); return; }
    const changed = changedArtifacts(current, next);
    current = next;
    if (changed.length > 0) open(changed);
  }, options.interval);

  const stop = () => { clearInterval(timer); console.log('\nStopped.'); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(`design:watch: ${error.message}`); process.exitCode = 1; });
}
