import test from 'node:test';
import assert from 'node:assert/strict';
import { readingTime, stripFormatting } from '../src/lib/reading-time.ts';

test('readingTime returns zero bounds for empty or non-string inputs', () => {
  for (const input of [null, undefined, '', '   \n\t  ', 42, {}, [], true]) {
    const result = readingTime(input);
    assert.deepEqual(result, {
      words: 0,
      minutes: 0,
      timeMs: 0,
      text: '< 1 min read',
    });
  }
});

test('stripFormatting removes markdown formatting, HTML tags, images and optionally code', () => {
  const markdown = `# Main Title

This is an **important** guide with [a link](https://example.com) and an image ![alt text](https://example.com/pic.png).

<div>HTML wrapper with <span>nested span</span></div>

\`\`\`javascript
const foo = "bar";
console.log(foo);
\`\`\`

Here is \`inline code\` and > blockquote text.
`;

  const withoutCode = stripFormatting(markdown, { countCode: false });
  assert.ok(!withoutCode.includes('console.log'));
  assert.ok(!withoutCode.includes('inline code'));
  assert.ok(!withoutCode.includes('<div>'));
  assert.ok(!withoutCode.includes('https://example.com'));
  assert.ok(withoutCode.includes('Main Title'));
  assert.ok(withoutCode.includes('important guide'));
  assert.ok(withoutCode.includes('a link'));
  assert.ok(withoutCode.includes('HTML wrapper with nested span'));

  const withCode = stripFormatting(markdown, { countCode: true });
  assert.ok(withCode.includes('console.log'));
  assert.ok(withCode.includes('inline code'));
});

test('readingTime calculates correct word count and minutes with default 200 WPM', () => {
  // Generate exact 300 words
  const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
  const result = readingTime(words);
  assert.equal(result.words, 300);
  assert.equal(result.minutes, 2); // 300 / 200 = 1.5 -> ceil = 2
  assert.equal(result.timeMs, 90000); // 1.5 * 60,000 = 90,000
  assert.equal(result.text, '2 min read');

  // Short 50 words
  const shortWords = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ');
  const shortResult = readingTime(shortWords);
  assert.equal(shortResult.words, 50);
  assert.equal(shortResult.minutes, 1);
  assert.equal(shortResult.text, '1 min read');
});

test('readingTime handles custom WPM and invalid WPM boundaries gracefully', () => {
  const words = Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ');

  // Custom 100 WPM
  const fast = readingTime(words, { wordsPerMinute: 100 });
  assert.equal(fast.words, 100);
  assert.equal(fast.minutes, 1);
  assert.equal(fast.timeMs, 60000);

  // Invalid WPM (0, negative, NaN, Infinity, Number.MIN_VALUE) falls back to default 200 WPM
  for (const badWpm of [0, -50, NaN, Infinity, -Infinity, Number.MIN_VALUE, 'fast']) {
    const fallback = readingTime(words, { wordsPerMinute: badWpm });
    assert.equal(fallback.words, 100);
    assert.equal(fallback.minutes, 1);
    assert.equal(fallback.timeMs, 30000);
    assert.notEqual(fallback.text, 'Infinity min read');
  }
});

test('stripFormatting handles tilde fences, language identifiers, and HTML entities', () => {
  // Tilde-fenced code
  const tildeMarkdown = `Intro paragraph.
~~~typescript
const x: number = 42;
~~~
Outro paragraph.`;

  const withoutCode = stripFormatting(tildeMarkdown, { countCode: false });
  assert.ok(!withoutCode.includes('42'));
  assert.ok(withoutCode.includes('Intro paragraph'));
  assert.ok(withoutCode.includes('Outro paragraph'));

  // When counting code, language identifiers like 'typescript' or 'js' should not be counted
  const withCode = stripFormatting(tildeMarkdown, { countCode: true });
  assert.ok(withCode.includes('42'));
  assert.ok(!withCode.includes('typescript'));

  // HTML entities should be stripped, not counted as words
  const entityText = 'Tom &amp; Jerry &nbsp; friends';
  const entityRes = readingTime(entityText);
  assert.equal(entityRes.words, 3, `Expected exactly 3 words ('Tom', 'Jerry', 'friends'), got ${entityRes.words}`);
});

test('readingTime supports Intl.Segmenter with multilingual, invalid locale fallback and Portable Text', () => {
  // Japanese text without spaces
  const japanese = '吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。';
  const jaResult = readingTime(japanese, { locale: 'ja' });
  assert.ok(jaResult.words > 5, `Expected Japanese word segmentation > 5, got ${jaResult.words}`);
  assert.equal(jaResult.minutes, 1);

  // Malformed locale fallback: retries fallback segmenter and still segments Japanese into multiple words
  const malformedResult = readingTime(japanese, { locale: 'invalid_locale_xyz' });
  assert.ok(malformedResult.words > 1, `Expected fallback segmenter on Japanese > 1 word, got ${malformedResult.words}`);

  // Portable Text block array input
  const portableText = [
    {
      _type: 'block',
      children: [
        { _type: 'span', text: 'First block heading' },
      ],
    },
    {
      _type: 'block',
      children: [
        { _type: 'span', text: 'Second block paragraph text' },
      ],
    },
  ];
  const ptResult = readingTime(portableText);
  assert.equal(ptResult.words, 7); // First block heading (3) + Second block paragraph text (4)

  // Portable Text with split spans within a single block (e.g. bolded partial word "hel" + "lo world")
  const splitSpanBlock = [
    {
      _type: 'block',
      children: [
        { _type: 'span', text: 'hel' },
        { _type: 'span', text: 'lo world' },
      ],
    },
  ];
  const splitResult = readingTime(splitSpanBlock);
  assert.equal(splitResult.words, 2, `Expected exactly 2 words ('hello', 'world'), got ${splitResult.words}`);

  // Dutch text with contractions and accents
  const dutch = "Het is 's ochtends vroeg en we gaan naar de tentoonstelling van moderne kunst.";
  const nlResult = readingTime(dutch, { locale: 'nl' });
  assert.ok(nlResult.words >= 11, `Expected Dutch word count >= 11, got ${nlResult.words}`);
});
