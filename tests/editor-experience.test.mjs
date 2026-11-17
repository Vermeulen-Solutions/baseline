import test from 'node:test';
import assert from 'node:assert/strict';
import { compareByListThenTitle, compareByTermRankThenName, compareByWeekdayAndTime, startMinutes, termRanker, weekdayIndex } from '../src/lib/derived-order.ts';
import { dropIndex, move, orderChanges, orderRows } from '../src/plugins/editorial-order/order.ts';
import { choiceLabel, choiceOptions, entryLocale } from '../src/plugins/editor-ui/labels.ts';
import { parseArgs, planChanges, readbackMatches, validatePlan } from '../scripts/cms-admin-metadata.mjs';

const entry = data => ({ data });
const titles = list => list.map(item => item.data.title);

test('week order follows weekday, start time and title in several languages', () => {
  assert.equal(weekdayIndex('Mardi'), 2);
  assert.equal(weekdayIndex(' sunday '), 7);
  assert.equal(weekdayIndex(''), 99);
  assert.equal(startMinutes('16h30 – 18h00'), 990);
  assert.equal(startMinutes('9:15-10'), 555);
  assert.equal(startMinutes('16h'), 960);
  assert.equal(startMinutes(null), Number.POSITIVE_INFINITY);
  const slots = [
    entry({ title: 'B', day: 'Wednesday', time: '18h' }),
    entry({ title: 'Later', day: 'Monday', time: '19:00' }),
    entry({ title: 'No day', day: '', time: '08:00' }),
    entry({ title: 'Earlier', day: 'lundi', time: '17h30' }),
    entry({ title: 'A', day: 'Wednesday', time: '18h' }),
  ];
  assert.deepEqual(titles(slots.sort(compareByWeekdayAndTime())), ['Earlier', 'Later', 'A', 'B', 'No day']);
});

test('category list order then numeric title collation; unknown categories last', () => {
  const docs = [
    entry({ title: 'U12 rules', category: 'Rules' }),
    entry({ title: 'Statutes', category: 'Other' }),
    entry({ title: 'U8 rules', category: 'Rules' }),
    entry({ title: 'Form', category: 'Membership' }),
  ];
  assert.deepEqual(titles(docs.sort(compareByListThenTitle('category', ['Rules', 'Membership']))), ['U8 rules', 'U12 rules', 'Form', 'Statutes']);
});

test('people follow taxonomy order (parent before children, any locale) then name', () => {
  const roots = [{ id: 'board', translationGroup: 'g-board', children: [{ id: 'chair', translationGroup: 'g-chair' }, { id: 'vice', translationGroup: 'g-vice' }] }, { id: 'coach', slug: 'coach' }];
  const rank = termRanker(roots);
  assert.equal(rank({ id: 'other-locale-chair', translationGroup: 'g-chair' }), 1);
  assert.equal(rank({ id: 'unknown' }), 4);
  const people = [
    entry({ title: 'Zoe', roles: [{ id: 'coach', slug: 'coach' }] }),
    entry({ title: 'Ann', roles: [{ id: 'x', translationGroup: 'g-vice' }] }),
    entry({ title: 'Bob', roles: [{ id: 'coach' }, { id: 'y', translationGroup: 'g-chair' }] }),
    entry({ title: 'Amy', roles: [{ id: 'coach' }] }),
    entry({ title: 'Nobody', roles: [] }),
  ];
  assert.deepEqual(titles(people.sort(compareByTermRankThenName(roots, person => person.data.roles))), ['Bob', 'Ann', 'Amy', 'Zoe', 'Nobody']);
});

const item = (id, locale, group, order, extra = {}) => ({ id, locale, translationGroup: group, status: 'published', draftRevisionId: null, data: { title: id, sort_order: order }, ...extra });

test('order rows: one per translation group, preferred locale, missing numbers last', () => {
  const rows = orderRows([
    item('b-en', 'en', 'b', 1), item('b-fr', 'fr', 'b', 1),
    item('a-en', 'en', 'a', 2),
    item('c-fr', 'fr', 'c', null),
  ], { field: 'sort_order', preferredLocale: 'fr' });
  assert.deepEqual(rows.map(row => row.entry.id), ['b-fr', 'a-en', 'c-fr']);
});

test('move is a pure reorder that ignores out-of-range moves', () => {
  const list = ['a', 'b', 'c'];
  assert.deepEqual(move(list, 0, 2), ['b', 'c', 'a']);
  assert.deepEqual(list, ['a', 'b', 'c']);
  assert.equal(move(list, 1, 1), list);
  assert.equal(move(list, 0, 5), list);
});

test('order changes write 1..n only for moved rows and refuse published rows with unpublished edits', () => {
  const rows = orderRows([item('a', 'en', 'a', 1), item('b', 'en', 'b', 2), item('c', 'en', 'c', 3), item('d', 'en', 'd', null)], { field: 'sort_order', preferredLocale: 'en' });
  const moved = move(rows, 2, 0);
  const { changes, blocked } = orderChanges(moved, 'sort_order');
  assert.deepEqual(changes.map(change => [change.row.entry.id, change.position]), [['c', 1], ['a', 2], ['b', 3], ['d', 4]]);
  assert.deepEqual(blocked, []);
  const pending = orderRows([item('a', 'en', 'a', 1), item('b', 'en', 'b', 2, { draftRevisionId: 'r1' }), item('c', 'en', 'c', 3, { status: 'draft', draftRevisionId: 'r2' })], { field: 'sort_order', preferredLocale: 'en' });
  const result = orderChanges(move(pending, 0, 2), 'sort_order');
  assert.deepEqual(result.blocked.map(change => change.row.entry.id), ['b']);
  assert.deepEqual(orderChanges(pending, 'sort_order').changes, []);
});

test('drop index picks the row above whose midpoint the pointer is, or the last row', () => {
  const boxes = [{ top: 0, height: 40 }, { top: 40, height: 40 }, { top: 80, height: 40 }];
  assert.equal(dropIndex(boxes, 10), 0);
  assert.equal(dropIndex(boxes, 30), 1);
  assert.equal(dropIndex(boxes, 500), 2);
});

test('select labels: stored values unchanged, other-locale values hidden, current value decides locale', () => {
  const config = { labels: { indoor: 'En salle' }, localeValues: { fr: ['Lundi', 'Mardi'], en: ['Monday', 'Tuesday'] }, order: ['Lundi', 'Mardi', 'Monday', 'Tuesday'] };
  assert.equal(choiceLabel(config, 'indoor'), 'En salle');
  assert.equal(choiceLabel(config, 'outdoor'), 'outdoor');
  assert.equal(entryLocale(config, '?locale=fr', 'Tuesday', 'fr'), 'en');
  assert.equal(entryLocale(config, '?locale=en', '', 'fr'), 'en');
  assert.equal(entryLocale(config, '', null, 'fr'), 'fr');
  assert.deepEqual(choiceOptions(config, ['Tuesday', 'Mardi', 'Monday', 'Lundi', 'indoor'], 'fr'), [
    { value: 'Lundi', label: 'Lundi' }, { value: 'Mardi', label: 'Mardi' }, { value: 'indoor', label: 'En salle' },
  ]);
});

const schemas = () => ({
  events: { admin: { listColumns: ['title'] }, fields: [{ slug: 'day', label: 'Day', widget: null, validation: { options: ['Monday'] } }] },
});

test('admin-metadata plan: before/after diff, no option is dropped, idempotent', () => {
  const plan = validatePlan({
    fields: [{ collection: 'events', field: 'day', widget: 'site-editor-ui:choice', options: ['Monday', 'Tuesday'] }],
    collections: [{ collection: 'events', admin: { listColumns: ['day', 'time'], quickCreate: false } }],
  });
  const changes = planChanges(plan, schemas());
  assert.deepEqual(changes[0].body, { widget: 'site-editor-ui:choice', validation: { options: ['Monday', 'Tuesday'] } });
  assert.deepEqual(changes[0].before, { widget: null, options: ['Monday'] });
  assert.deepEqual(changes[1].body.admin, { listColumns: ['day', 'time'], quickCreate: false });
  assert.ok(changes.every(change => !change.applied));
  const after = { events: { admin: changes[1].body.admin, fields: [{ slug: 'day', label: 'Day', widget: 'site-editor-ui:choice', validation: { options: ['Monday', 'Tuesday'] } }] } };
  assert.ok(planChanges(plan, after).every(change => change.applied));
  assert.ok(changes.every(change => readbackMatches(change, after.events)));
  assert.ok(!readbackMatches(changes[0], schemas().events));
  assert.throws(() => planChanges(validatePlan({ fields: [{ collection: 'events', field: 'day', options: ['Tuesday'] }] }), schemas()), /drop stored options Monday/);
  assert.throws(() => planChanges(validatePlan({ fields: [{ collection: 'events', field: 'missing', label: 'x' }] }), schemas()), /not found/);
});

test('admin-metadata refuses unsupported plan keys, bad widgets and plain-http remote origins', () => {
  assert.throws(() => validatePlan({ fields: [{ collection: 'events', field: 'day', type: 'text' }] }), /unsupported keys type/);
  assert.throws(() => validatePlan({ fields: [{ collection: 'events', field: 'day', widget: 'choice' }] }), /widget must be/);
  assert.throws(() => parseArgs(['--base', 'http://example.org', '--plan', 'p.json']), /https/);
  assert.deepEqual(parseArgs(['--base', 'http://127.0.0.1:4321/x', '--plan', 'p.json']), { base: 'http://127.0.0.1:4321', plan: 'p.json', apply: false });
});
