import test from 'node:test';
import assert from 'node:assert/strict';
import { photoAspectRatio, justifiedFlexStyle, simulateFlexRow } from '../src/lib/justified-gallery.ts';

test('photoAspectRatio safely handles valid, missing, and invalid dimensions', () => {
  assert.equal(photoAspectRatio(1200, 800), 1.5);
  assert.equal(photoAspectRatio(800, 1200), 0.6667);
  assert.equal(photoAspectRatio(1000, 1000), 1);
  // Missing or non-positive dimensions fall back gracefully
  assert.equal(photoAspectRatio(undefined, 800), 1.3333);
  assert.equal(photoAspectRatio(1200, undefined), 1.3333);
  assert.equal(photoAspectRatio(0, 800), 1.3333);
  assert.equal(photoAspectRatio(-10, 800), 1.3333);
  assert.equal(photoAspectRatio(NaN, Infinity), 1.3333);
  assert.equal(photoAspectRatio('100', '200'), 1.3333);
  assert.equal(photoAspectRatio(undefined, undefined, 1.7778), 1.7778);
});

test('justifiedFlexStyle generates correct CSS flexbox layout properties', () => {
  const style = justifiedFlexStyle(1.5, 260);
  assert.equal(style.photoRatio, 1.5);
  assert.equal(style.flexGrow, '1.5');
  assert.equal(style.flexBasis, 'calc(clamp(160px, 38vw, 260px) * 1.5)');

  // Fallback for non-finite ratio
  const fallback = justifiedFlexStyle(0);
  assert.equal(fallback.photoRatio, 1.3333);
  assert.equal(fallback.flexGrow, '1.3333');
});

test('pure CSS flexbox simulation preserves equal row height across mixed aspect ratios', () => {
  const ratios = [0.6, 1.8, 0.8, 1.5];
  const items = ratios.map(ratio => ({ ratio }));
  const simulation = simulateFlexRow(items, 1200, 16, 260);

  assert.equal(simulation.widths.length, 4);
  // Total widths + gaps must equal container width
  const totalWidth = simulation.widths.reduce((sum, w) => sum + w, 0) + (items.length - 1) * 16;
  assert.ok(Math.abs(totalWidth - 1200) < 0.2);

  // Each item width / ratio must yield the exact same computed row height
  const rowHeights = simulation.widths.map((w, i) => w / ratios[i]);
  const minHeight = Math.min(...rowHeights);
  const maxHeight = Math.max(...rowHeights);
  assert.ok(maxHeight - minHeight < 0.1, 'All items in a flex row must scale to the identical height');
});

test('large albums with 400+ mixed items compute aspect ratios safely', () => {
  const testInputs = Array.from({ length: 413 }, (_, i) => [
    [1200, 800],
    [800, 1200],
    [undefined, undefined],
    [-50, 0],
  ][i % 4]);

  const ratios = testInputs.map(([w, h]) => photoAspectRatio(w, h));
  assert.equal(ratios.length, 413);
  assert.ok(ratios.every(r => Number.isFinite(r) && r > 0));
});
