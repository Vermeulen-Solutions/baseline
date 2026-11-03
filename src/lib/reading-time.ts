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

/** Extracts clean text from Sanity/EmDash Portable Text block structures. */
export function extractPortableText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const block of blocks) {
    if (block && typeof block === 'object' && Array.isArray((block as any).children)) {
      for (const child of (block as any).children) {
        if (child && typeof child.text === 'string') {
          parts.push(child.text);
        }
      }
    }
  }
  return parts.join('\n');
}

/** Strips Markdown syntax, HTML elements, HTML entities, and optionally code blocks to extract clean prose. */
export function stripFormatting(content: string, options: { countCode?: boolean } = {}): string {
  if (typeof content !== 'string' || !content.trim()) return '';
  let text = content;
  if (!options.countCode) {
    // Strip fenced code blocks (``` ... ``` and ~~~ ... ~~~)
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/~~~[\s\S]*?~~~/g, ' ');
    // Strip inline code `...`
    text = text.replace(/`[^`]*`/g, ' ');
  } else {
    // When counting code, strip the opening language identifier and fence delimiters
    // e.g. ```js or ~~~typescript -> stripped, retaining code body
    text = text.replace(/(?:```|~~~)[a-zA-Z0-9_-]*/g, ' ');
    text = text.replace(/[`~]/g, ' ');
  }
  // Strip HTML elements
  text = text.replace(/<[^>]+>/g, ' ');
  // Replace HTML entities (&nbsp;, &amp;, &lt;, &gt;, &quot;, &#160;, etc.) with spaces
  text = text.replace(/&[a-zA-Z0-9#]+;/g, ' ');
  // Strip Markdown image syntax ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, ' ');
  // Replace Markdown links [text](url) with just link text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Strip Markdown headers, horizontal rules, blockquotes
  text = text.replace(/^[#>-]+\s+/gm, ' ');
  text = text.replace(/[*_]{1,3}/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

/** Calculates locale-aware word count and estimated reading time. */
export function readingTime(
  content: unknown,
  options: ReadingTimeOptions = {}
): ReadingTimeResult {
  let sourceText = '';
  if (typeof content === 'string') {
    sourceText = content;
  } else if (Array.isArray(content)) {
    sourceText = extractPortableText(content);
  } else if (content && typeof content === 'object') {
    sourceText = extractPortableText([content]);
  }

  if (!sourceText.trim()) {
    return { words: 0, minutes: 0, timeMs: 0, text: '< 1 min read' };
  }

  const rawWpm = options.wordsPerMinute;
  // Enforce bounded, finite positive WPM (clamped between 1 and 2000, fallback to DEFAULT_WPM)
  const wpm = (typeof rawWpm === 'number' && Number.isFinite(rawWpm) && rawWpm >= 1)
    ? Math.min(Math.round(rawWpm), 2000)
    : DEFAULT_WPM;

  const locale = typeof options.locale === 'string' && options.locale.trim() ? options.locale.trim() : 'en';
  const countCode = options.countCode === true;

  const clean = stripFormatting(sourceText, { countCode });
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
    // Retry with reliable fallback locale ('en') before abandoning Intl.Segmenter
    try {
      const fallbackSegmenter = new Intl.Segmenter('en', { granularity: 'word' });
      for (const segment of fallbackSegmenter.segment(clean)) {
        if (segment.isWordLike) words++;
      }
    } catch {
      // Final fallback if Intl.Segmenter is completely unavailable
      const wordsArray = clean.trim().split(/\s+/).filter(Boolean);
      words = wordsArray.length;
    }
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
