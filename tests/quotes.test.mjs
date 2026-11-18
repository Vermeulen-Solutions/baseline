import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { highlightProblem, markedQuote, excerpt, samePerson } from '../src/lib/quotes.ts';

test('a highlight must be copied word for word out of its quote', () => {
  assert.equal(highlightProblem('They answered within a day.', 'within a day'), null);
  assert.equal(highlightProblem('They answered within a day.', null), null);
  assert.match(highlightProblem('They answered within a day.', 'within one day'), /not in the quote word for word/);
});

test('the marked quote keeps every character, escaped, with the phrase inside <mark>', () => {
  assert.equal(markedQuote('Fast & friendly <3', 'friendly'), 'Fast &amp; <mark class="quote-mark">friendly</mark> &lt;3');
  assert.equal(markedQuote('No phrase here.', 'missing'), 'No phrase here.', 'an absent phrase leaves the quote whole');
  assert.equal(markedQuote('First paragraph.\n\nSecond, "quoted".'), 'First paragraph.<br><br>Second, &quot;quoted&quot;.');
  assert.equal(markedQuote('It’s great.', 'great', 'hl"x'), 'It’s <mark class="hl&quot;x">great</mark>.');
});

test('an excerpt is the sentence holding the phrase, with ellipses where the quote goes on', () => {
  const quote = 'We had tried two agencies. This team listened first and built what we asked for. The site went live in March.';
  assert.equal(excerpt(quote, 'listened first'), '… This team listened first and built what we asked for. …');
  assert.equal(excerpt(quote, 'tried two'), 'We had tried two agencies. …');
  assert.equal(excerpt(quote, 'went live'), '… The site went live in March.');
  assert.equal(excerpt(quote), quote);
  assert.equal(excerpt(quote, 'not there'), quote);
});

test('the same person is recognised across credentials and middle names', () => {
  assert.equal(samePerson('Anna M. Keller, Dr.', 'Anna Keller'), true);
  assert.equal(samePerson('Anna Keller', 'Anna Weber'), false);
  assert.equal(samePerson('', ''), false);
});

test('Stars reads as one picture, keeps outlines on empty stars and can be decorative', () => {
  const source = readFileSync(new URL('../src/components/Stars.astro', import.meta.url), 'utf8');
  assert.match(source, /role=\{decorative \? undefined : 'img'\}/);
  assert.match(source, /aria-label=\{decorative \? undefined : label\.replace\('\{rating\}'/);
  assert.match(source, /aria-hidden=\{decorative \? 'true' : undefined\}/);
  assert.match(source, /stroke="currentColor"/, 'every star keeps its outline');
  assert.match(source, /fill=\{fill >= 1 \? 'currentColor' : fill <= 0 \? 'none' : `url\(#\$\{id\}-\$\{index\}\)`\}/);
  assert.match(source, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i, 'no fixed colours');
});
