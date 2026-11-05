import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, ffmpegArgs } from '../scripts/record-motion.mjs';

// Portable: argument and conversion logic only; no browser or ffmpeg is launched.
test('record:motion validates its arguments and refuses converted routes', () => {
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--out', 'x.gif', '--route', 'C:/Program Files/Git/']), /MSYS_NO_PATHCONV=1/);
  assert.throws(() => parseArgs(['--base', '127.0.0.1', '--out', 'x.gif']), /http\(s\) origin/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--out', 'x.mp4']), /file\.gif\|file\.webm/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--out', 'x.gif', '--speed', '40']), /--speed/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--out', 'x.gif', '--css', 'missing.css']), /--css file not found/);
  const options = parseArgs(['--base', 'http://127.0.0.1:4321', '--out', 'clip.gif', '--speed', '4', '--gif-width', '640', '--click', '[data-pause]']);
  assert.equal(options.route, '/'); assert.equal(options.speed, 4); assert.equal(options.gifWidth, 640); assert.deepEqual(options.click, ['[data-pause]']);
});

test('GIF conversion uses a generated palette at the requested frame rate and width', () => {
  const args = ffmpegArgs('in.webm', 'out.gif', { fps: 12, gifWidth: 720, seconds: 5 });
  assert.equal(args.at(-1), 'out.gif');
  assert.ok(args.includes('in.webm'));
  assert.match(args[args.indexOf('-vf') + 1], /^fps=12,scale=720:-1.*palettegen.*paletteuse/);
  assert.equal(args[args.indexOf('-t') + 1], '5');
});
