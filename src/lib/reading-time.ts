export interface ReadingTimeOptions {
  wordsPerMinute?: number;
  locale?: string;
  countCode?: boolean;
}

export interface ReadingTimeResult {
  words: number;
  minutes: number;
  timeMs: number;
  text: string;
}

const DEFAULT_WPM = 200;

/** Strips Markdown syntax, HTML elements, and optionally code blocks to extract clean prose. */
export function stripFormatting(content: string, options: { countCode?: boolean } = {}): string {
  if (typeof content !== 'string' || !content.trim()) return '';
  let text = content;
  if (!options.countCode) {
    // Strip fenced code blocks ``` ... ```
    text = text.replace(/```[\s\S]*?```/g, '');
    // Strip inline code `...`
    text = text.replace(/`[^`]*`/g, '');
  }
  // Strip HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Strip Markdown image syntax ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');
  // Replace Markdown links [text](url) with just text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Strip Markdown headers, horizontal rules, blockquotes
  text = text.replace(/^[#>-]+\s+/gm, '');
  text = text.replace(/[*_~]{1,3}/g, '');
  return text.replace(/\s+/g, ' ').trim();
}

/** Calculates locale-aware word count and estimated reading time. */
export function readingTime(
  content: unknown,
  options: ReadingTimeOptions = {}
): ReadingTimeResult {
  if (typeof content !== 'string' || !content.trim()) {
    return { words: 0, minutes: 0, timeMs: 0, text: '< 1 min read' };
  }

  const rawWpm = options.wordsPerMinute;
  const wpm = typeof rawWpm === 'number' && Number.isFinite(rawWpm) && rawWpm > 0 ? rawWpm : DEFAULT_WPM;
  const locale = typeof options.locale === 'string' && options.locale.trim() ? options.locale.trim() : 'en';
  const countCode = options.countCode === true;

  const clean = stripFormatting(content, { countCode });
  if (!clean) {
    return { words: 0, minutes: 0, timeMs: 0, text: '< 1 min read' };
  }

  let words = 0;
  try {
    const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
    for (const segment of segmenter.segment(clean)) {
      if (segment.isWordLike) words++;
    }
  } catch {
    // Fallback if locale is unsupported
    const wordsArray = clean.trim().split(/\s+/).filter(Boolean);
    words = wordsArray.length;
  }

  if (words === 0) {
    return { words: 0, minutes: 0, timeMs: 0, text: '< 1 min read' };
  }

  const minutesDecimal = words / wpm;
  const minutes = Math.max(1, Math.ceil(minutesDecimal));
  const timeMs = Math.round(minutesDecimal * 60 * 1000);
  const text = minutes === 1 ? '1 min read' : `${minutes} min read`;

  return { words, minutes, timeMs, text };
}
