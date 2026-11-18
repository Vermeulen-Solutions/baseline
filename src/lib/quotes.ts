/**
 * Client quotes and public reviews: show the words exactly as written, with an optional key phrase
 * marked. These helpers pick words out; they never change them. See the "Testimonials and reviews"
 * rules in the emdash-content-modeling skill.
 */

const escapeHtml = (text: string): string => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/** The paragraphs of a quote as HTML: escaped, blank lines become paragraph breaks, single breaks <br>. */
const paragraphs = (text: string): string => escapeHtml(text).replace(/\r\n?/g, '\n').replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');

/**
 * Why a highlight cannot be used, or null when it can: it must be copied exactly out of the quote.
 * Call it where quotes are loaded and stop the build (or skip the highlight) on a message.
 */
export function highlightProblem(quote: string, highlight?: string | null): string | null {
  if (!highlight) return null;
  if (!quote.includes(highlight)) return `the highlight "${highlight}" is not in the quote word for word`;
  return null;
}

/** The quote as HTML, with its key phrase inside <mark> when the phrase is in the quote. */
export function markedQuote(quote: string, highlight?: string | null, markClass = 'quote-mark'): string {
  const at = highlight ? quote.indexOf(highlight) : -1;
  if (!highlight || at === -1) return paragraphs(quote);
  return paragraphs(quote.slice(0, at))
    + `<mark class="${escapeHtml(markClass)}">${paragraphs(highlight)}</mark>`
    + paragraphs(quote.slice(at + highlight.length));
}

/**
 * The sentence that holds the key phrase, word for word, with an ellipsis where the quote goes on.
 * For a card that must stay short; the whole quote belongs on the page it came from. Without a
 * phrase, or when the phrase is not in the quote, the quote comes back whole.
 */
export function excerpt(quote: string, highlight?: string | null): string {
  const at = highlight ? quote.indexOf(highlight) : -1;
  if (!highlight || at === -1) return quote;
  const ends = [...quote.matchAll(/[.!?…]+["'”’)]?(?:\s+|$)/g)].map(match => ({
    stop: (match.index ?? 0) + match[0].trimEnd().length,
    next: (match.index ?? 0) + match[0].length,
  }));
  const start = [...ends].reverse().find(end => end.next <= at)?.next ?? 0;
  const stop = ends.find(end => end.stop >= at + highlight.length)?.stop ?? quote.length;
  return `${start > 0 ? '… ' : ''}${quote.slice(start, stop)}${stop < quote.length ? ' …' : ''}`;
}

/** The same person under two spellings ("Anna M. Keller, Dr." and "Anna Keller"): first and last name. */
export function samePerson(a: string, b: string): boolean {
  const key = (name: string) => {
    const words = name.split(',')[0].trim().toLowerCase().split(/\s+/).filter(Boolean);
    return words.length ? `${words[0]} ${words[words.length - 1]}` : '';
  };
  return key(a) !== '' && key(a) === key(b);
}
