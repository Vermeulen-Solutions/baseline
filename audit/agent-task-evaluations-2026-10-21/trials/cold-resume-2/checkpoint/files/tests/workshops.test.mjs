import test from 'node:test';
import assert from 'node:assert/strict';
import { workshopSchema } from '../src/lib/workshop-schema.ts';

const workshop = {
  title: 'Clear project briefs',
  slug: 'clear-project-briefs',
  summary: 'Learn how to turn an initial conversation into a useful project brief.',
  date: '2026-11-12',
  venue: 'Northline Studio',
  draft: false,
};

test('workshop schema preserves date-only content and explicit publication status', () => {
  assert.deepEqual(workshopSchema.parse(workshop), workshop);
  assert.equal(workshopSchema.parse({ ...workshop, draft: true }).draft, true);
  assert.equal(workshopSchema.parse({ ...workshop, date: '2028-02-29' }).date, '2028-02-29');
});

test('workshop schema requires every field and rejects blank content', () => {
  for (const field of Object.keys(workshop)) {
    const incomplete = { ...workshop };
    delete incomplete[field];
    assert.equal(workshopSchema.safeParse(incomplete).success, false, field);
  }
  for (const field of ['title', 'summary', 'venue']) {
    assert.equal(workshopSchema.safeParse({ ...workshop, [field]: '  ' }).success, false, field);
  }
});

test('workshop schema rejects invalid calendar dates, unsafe slugs and ambiguous draft flags', () => {
  for (const date of ['2026-02-29', '2026-11-31', '12/03/2026', '2026-12-03T09:00:00Z']) {
    assert.equal(workshopSchema.safeParse({ ...workshop, date }).success, false, date);
  }
  for (const slug of ['', 'Mixed-Case', '../workshop', 'two words', '-workshop', 'workshop/']) {
    assert.equal(workshopSchema.safeParse({ ...workshop, slug }).success, false, slug);
  }
  for (const draft of ['false', 'true', 0, 1, null]) {
    assert.equal(workshopSchema.safeParse({ ...workshop, draft }).success, false, String(draft));
  }
});
