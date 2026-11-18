import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validOpeningHours, openingHoursSpecification, openingHoursRows } from '../src/lib/opening-hours.ts';

const hours = [
  { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:30', closes: '18:00' },
  { days: ['Saturday'], opens: '09:00', closes: '12:00' },
  { days: ['Saturday'], opens: '14:00', closes: '16:30' },
];

test('invalid days and times are dropped, never guessed', () => {
  assert.equal(validOpeningHours([{ days: ['Funday', 'Monday'], opens: '8:30', closes: '18:00' }]).length, 0, 'H:MM is not HH:MM');
  assert.deepEqual(validOpeningHours([{ days: ['Funday', 'Monday'], opens: '08:30', closes: '24:00' }]), []);
  assert.deepEqual(validOpeningHours([{ days: ['Funday', 'Monday'], opens: '08:30', closes: '18:00' }]), [{ days: ['Monday'], opens: '08:30', closes: '18:00' }]);
  assert.deepEqual(validOpeningHours(undefined), []);
});

test('structured data uses schema.org OpeningHoursSpecification', () => {
  assert.deepEqual(openingHoursSpecification(hours)[1], { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '12:00' });
});

test('rows give every weekday in the locale, split days and closed days', () => {
  const en = openingHoursRows(hours, 'en-GB');
  assert.equal(en.length, 7);
  // Time formats are the locale's (and ICU's) business; check the shape, not the digits.
  assert.equal(en[0].day, 'Monday');
  assert.equal(en[0].times.length, 1);
  assert.match(en[0].times[0], /8:30 – 18:00$/);
  assert.equal(en[5].times.length, 2, 'a split day keeps both ranges');
  assert.match(en[5].times[1], /14:00 – 16:30$/);
  assert.deepEqual(en[6], { day: 'Sunday', times: [] });
  const fr = openingHoursRows(hours, 'fr-CH');
  assert.equal(fr[0].day, 'lundi');
  assert.equal(fr[6].day, 'dimanche');
});

test('the Hours component renders a captioned table from the shared rows', () => {
  const source = readFileSync(new URL('../src/components/Hours.astro', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.match(source, /import \{ openingHoursRows, type OpeningHours \} from '\.\.\/lib\/opening-hours';/);
  assert.match(source, /<caption class:list=\{\{ 'sr-only': hideCaption \}\}>\{caption\}<\/caption>/);
  assert.match(source, /<th scope="row">\{row\.day\}<\/th>/);
  assert.match(source, /row\.times\.length \? row\.times\.join\(', '\) : closedLabel/);
  assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);
});
