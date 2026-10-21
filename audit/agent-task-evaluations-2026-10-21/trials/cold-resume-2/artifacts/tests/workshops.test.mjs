import test from 'node:test';
import assert from 'node:assert/strict';
import { workshopSchema } from '../src/lib/workshop-schema.ts';
import { compareWorkshops, formatWorkshopDate } from '../src/lib/workshop-presentation.ts';

const workshop = {
  title: 'Clear project briefs',
  slug: 'clear-project-briefs',
  summary: 'Learn how to turn an initial conversation into a useful project brief.',
  date: '2026-11-12',
  venue: 'Northline Studio',
  draft: false,
};

test('workshop dates retain their calendar day in western and eastern build time zones', () => {
  const original = process.env.TZ;
  try {
    for (const zone of ['America/Los_Angeles', 'Pacific/Kiritimati', 'UTC']) {
      process.env.TZ = zone;
      assert.equal(formatWorkshopDate('2026-11-12'), '12 November 2026');
      assert.equal(formatWorkshopDate('2028-02-29'), '29 February 2028');
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test('workshops sort by ascending calendar date and then slug', () => {
  const entries = [
    { data: { date: '2027-01-01', slug: 'later' } },
    { data: { date: '2026-11-12', slug: 'zebra' } },
    { data: { date: '2026-11-12', slug: 'alpha' } },
    { data: { date: '2026-02-01', slug: 'first' } },
  ];
  assert.deepEqual(entries.sort(compareWorkshops).map(({ data }) => data.slug), ['first', 'alpha', 'zebra', 'later']);
  assert.equal(compareWorkshops(entries[0], entries[0]), 0);
});

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
