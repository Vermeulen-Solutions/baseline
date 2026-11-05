#!/usr/bin/env node
// Short motion clips for design reviews on surfaces that accept images only (for example a
// Claude Design canvas): records a real route with headless Chromium and converts it to a GIF.
//
//   npm run record:motion -- --base http://127.0.0.1:4321 --route / --out ../evidence/hero.gif
//   npm run record:motion -- --base http://127.0.0.1:4321 --route / --css concept.css --speed 4 --out hero-4x.gif
//
// --speed multiplies CSS animation playback (via the DevTools Animation domain) so a slow loop
// fits a short clip; label such clips honestly ("4x faster"). --scroll positions the page first;
// --click presses controls (for example a consent button). Needs ffmpeg on PATH for the GIF; without
// it the WebM recording is kept and reported. Keep clips outside Git unless they are review material.
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { msysToNative } from './capture-routes.mjs';

export function parseArgs(argv) {
  const out = { route: '/', width: 1280, height: 720, seconds: 6, speed: 1, scroll: 0, fps: 12, gifWidth: 720, css: [], click: [] };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--base') out.base = value();
    else if (flag === '--route') out.route = value();
    else if (flag === '--out') out.out = msysToNative(value());
    else if (flag === '--css') out.css = value().split(',').map(s => msysToNative(s.trim())).filter(Boolean);
    else if (flag === '--click') out.click = value().split(',').map(s => s.trim()).filter(Boolean);
    else if (['--width', '--height', '--seconds', '--speed', '--scroll', '--fps', '--gif-width'].includes(flag)) out[flag.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = Number(value());
    else throw Error('Unknown option: ' + flag);
  }
  if (out.help) return out;
  if (!out.base || !/^https?:\/\//.test(out.base)) throw Error('--base must be an http(s) origin, for example http://127.0.0.1:4321');
  if (/^[A-Za-z]:[\\/]/.test(out.route)) throw Error(`Route "${out.route}" looks like a Windows path: Git Bash converted it. Re-run with MSYS_NO_PATHCONV=1.`);
  if (!out.route.startsWith('/')) throw Error('--route must start with /');
  if (!out.out || !/\.(gif|webm)$/i.test(out.out)) throw Error('--out <file.gif|file.webm> is required');
  for (const file of out.css) if (!existsSync(file)) throw Error(`--css file not found: ${file}`);
  if (!(out.seconds > 0 && out.seconds <= 30)) throw Error('--seconds must be between 0 and 30');
  if (!(out.speed >= 0.25 && out.speed <= 16)) throw Error('--speed must be between 0.25 and 16');
  for (const key of ['width', 'height', 'fps', 'gifWidth', 'scroll']) if (!Number.isInteger(out[key]) || out[key] < 0) throw Error(`--${key} must be a non-negative integer`);
  return out;
}

export function ffmpegArgs(input, output, { fps, gifWidth, skip = 0.8, seconds }) {
  return ['-y', '-loglevel', 'error', '-ss', String(skip), '-t', String(seconds), '-i', input,
    '-vf', `fps=${fps},scale=${gifWidth}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer`, output];
}

async function record(options) {
  const { createRequire } = await import('node:module');
  let chromium;
  for (const base of [path.join(process.cwd(), 'package.json'), import.meta.url]) { try { ({ chromium } = createRequire(base)('@playwright/test')); break; } catch {} }
  if (!chromium) throw Error('record:motion needs @playwright/test and an installed Chromium (npx playwright install chromium).');
  const dir = mkdtempSync(path.join(os.tmpdir(), 'record-motion-'));
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: options.width, height: options.height }, recordVideo: { dir, size: { width: options.width, height: options.height } } });
    const page = await context.newPage();
    await page.goto(new URL(options.route, options.base).href, { waitUntil: 'networkidle', timeout: 90000 });
    for (const file of options.css) await page.addStyleTag({ content: readFileSync(file, 'utf8') });
    for (const selector of options.click) { const target = page.locator(selector).first(); if (await target.count()) await target.click(); }
    if (options.speed !== 1) { const cdp = await context.newCDPSession(page); await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: options.speed }); }
    await page.evaluate(y => window.scrollTo(0, y), options.scroll);
    await page.waitForTimeout(Math.round((options.seconds + 1) * 1000));
    await context.close();
    const video = readdirSync(dir).find(f => f.endsWith('.webm'));
    if (!video) throw Error('No recording was produced');
    mkdirSync(path.dirname(path.resolve(options.out)), { recursive: true });
    const webm = path.join(dir, video);
    if (/\.webm$/i.test(options.out)) { renameSync(webm, options.out); return { out: options.out, format: 'webm' }; }
    const ffmpeg = spawnSync('ffmpeg', ffmpegArgs(webm, options.out, options), { stdio: ['ignore', 'ignore', 'pipe'] });
    if (ffmpeg.error || ffmpeg.status !== 0) {
      const fallback = options.out.replace(/\.gif$/i, '.webm'); renameSync(webm, fallback);
      return { out: fallback, format: 'webm', note: 'ffmpeg was not available or failed; kept the WebM recording. Install ffmpeg to produce a GIF.' };
    }
    return { out: options.out, format: 'gif' };
  } finally { await browser.close(); rmSync(dir, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: record:motion -- --base <origin> --route / --out clip.gif [--css overlay.css] [--click selector] [--speed 4] [--seconds 6] [--scroll 0] [--width 1280 --height 720] [--fps 12 --gif-width 720]\nGit Bash: prefix with MSYS_NO_PATHCONV=1 when the route is "/".');
    else {
      const result = await record(options);
      console.log(`${result.format}: ${result.out}${options.speed !== 1 ? ` (animations ${options.speed}x faster: label the clip)` : ''}${result.note ? `\n${result.note}` : ''}`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
