import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readingMinutes } from '../src/lib/post-fields.ts';

test('reading time is optional and accepts integer minutes including both boundaries', () => {
  for (const value of [undefined, 1, 30, 60]) {
    assert.equal(readingMinutes.parse(value), value);
  }
});

test('reading time rejects out-of-range, fractional and nonnumeric frontmatter', () => {
  for (const value of [0, -1, 61, 1.5, 59.5, '5', '', 'abc', null, true, NaN, Infinity]) {
    assert.equal(readingMinutes.safeParse(value).success, false, `Accepted ${String(value)}`);
  }
});

test('the editor reading-time field matches the typed content constraints', () => {
  const config = JSON.parse(fs.readFileSync('public/admin/config.yml', 'utf8'));
  const field = config.collections.find(c => c.name === 'posts').fields.find(f => f.name === 'readingMinutes');
  assert.equal(field.required, false);
  assert.equal(field.widget, 'number');
  assert.equal(field.value_type, 'int');
  assert.equal(field.min, 1);
  assert.equal(field.max, 60);
  assert.equal(field.step, 1);
  assert.equal(config.output.omit_empty_optional_fields, true);
  assert.equal(Object.hasOwn(field, 'default'), false);
});
