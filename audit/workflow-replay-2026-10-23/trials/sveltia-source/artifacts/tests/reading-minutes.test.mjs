import test from 'node:test';
import assert from 'node:assert/strict';
import { readingMinutesSchema } from '../src/lib/reading-minutes.ts';

test('reading time accepts omission and whole minutes including both boundaries', () => {
  for (const value of [undefined, 1, 12, 60]) {
    assert.equal(readingMinutesSchema.parse(value), value);
  }
});

test('reading time rejects out-of-range, fractional and nonnumeric values', () => {
  for (const value of [0, -1, 61, 1.5, '5', '', null, true, NaN, Infinity]) {
    assert.equal(readingMinutesSchema.safeParse(value).success, false, `Accepted ${String(value)}`);
  }
});
