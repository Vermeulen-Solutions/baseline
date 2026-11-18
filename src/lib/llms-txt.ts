/**
 * Builds an /llms.txt document (https://llmstxt.org): a Markdown index of the public site that
 * language-model tools can read in one request. It holds titles, absolute URLs and one-line
 * summaries only, never body content, and leaves out anything the sitemap would leave out.
 */
export interface LlmsLink {
  title: string;
  url: string;
  description?: string | null;
}

export interface LlmsSection {
  heading: string;
  links: LlmsLink[];
}

export interface LlmsDocument {
  title: string;
  summary?: string | null;
  sections: LlmsSection[];
}

const MAX_DESCRIPTION = 200;

/** Collapses whitespace and strips control characters so one value stays on one Markdown line. */
export function llmsLine(value: unknown, max = MAX_DESCRIPTION): string {
  if (typeof value !== 'string') return '';
  // Control characters and line/paragraph separators would break the one-line Markdown entry.
  const line = value.replace(/[\p{Cc}\p{Zl}\p{Zp}]+/gu, ' ').replace(/\s+/g, ' ').trim();
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

/** Escapes the characters that would end a Markdown link label early. */
function linkLabel(value: string): string {
  return value.replace(/([\\[\]])/g, '\\$1');
}

/** Absolute HTTP(S) URLs only; anything else is dropped rather than published. */
function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    // Parentheses would close the Markdown link target; URL serialization leaves them as they are.
    return url.href.replace(/\(/g, '%28').replace(/\)/g, '%29');
  } catch {
    return null;
  }
}

export function buildLlmsTxt(document: LlmsDocument): string {
  const title = llmsLine(document.title, 120) || 'Site';
  const lines = [`# ${title}`, ''];
  const summary = llmsLine(document.summary);
  if (summary) lines.push(`> ${summary}`, '');
  for (const section of document.sections) {
    const links = section.links
      .map(link => ({ title: llmsLine(link.title, 120), url: safeUrl(link.url), description: llmsLine(link.description) }))
      .filter((link): link is { title: string; url: string; description: string } => Boolean(link.title && link.url));
    if (!links.length) continue;
    lines.push(`## ${llmsLine(section.heading, 80)}`, '');
    for (const link of links) lines.push(`- [${linkLabel(link.title)}](${link.url})${link.description ? `: ${link.description}` : ''}`);
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

/** Whether an EmDash entry opted out of indexing in its SEO panel. */
export function isNoIndexEntry(entry: { data?: unknown }): boolean {
  const seo = (entry?.data as { seo?: { noIndex?: unknown } | null } | null | undefined)?.seo;
  return seo?.noIndex === true;
}

/** One index link for a published entry: its title field, canonical URL and excerpt, when present. */
export function entryLink(entry: { id: string; data?: unknown }, url: string): LlmsLink {
  const data = (entry.data ?? {}) as Record<string, unknown>;
  return {
    title: typeof data.title === 'string' && data.title.trim() ? data.title : entry.id,
    url,
    description: typeof data.excerpt === 'string' ? data.excerpt : null,
  };
}
