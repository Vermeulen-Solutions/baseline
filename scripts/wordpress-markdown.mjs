import { parseFragment } from 'parse5';

const escape = value => String(value).replace(/\\/g, '\\\\').replace(/([*_\x60[\]])/g, '\\$1').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/^([ \t]*)(#{1,6} |[-+] |[0-9]+\. )/gm, '$1\\$2');
export const plainText = html => {
  const walk = node => ['script', 'style'].includes(node.tagName) ? '' : node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(walk).join('');
  return walk(parseFragment(String(html ?? ''))).replace(/\s+/g, ' ').trim();
};

/** Supported semantic HTML becomes Markdown. Active/unknown structures always produce review findings. */
export function toMarkdown(html, { base, media, link = url => url.href, finding = () => {} } = {}) {
  const document = parseFragment(html);
  const attrs = node => Object.fromEntries((node.attrs ?? []).map(attr => [attr.name, attr.value]));
  const children = node => (node.childNodes ?? []).map(walk).join('');
  const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
  const destination = raw => {
    try {
      const url = new URL(raw, base);
      if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return link(url);
      if (['mailto:', 'tel:'].includes(url.protocol)) return url.href;
    } catch { /* A bad URL is retained as visible text, never as executable markup. */ }
    finding('unsafe-link', 'An unsupported or malformed link needs review'); return null;
  };
  function walk(node) {
    if (node.nodeName === '#text') return escape(node.value.replace(/\s+/g, ' '));
    if (node.nodeName === '#comment') {
      if (/^\s*wp:/.test(node.data) && /\/\s*$/.test(node.data) && !/wp:(?:separator|spacer|more)\b/.test(node.data)) finding('dynamic-block', 'A self-closing WordPress block requires reconstruction');
      return '';
    }
    const tag = node.tagName, a = attrs(node);
    if (!tag) return children(node);
    if (['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'template'].includes(tag)) {
      finding('active-content', 'A form, script or embedded application requires reconstruction'); return '';
    }
    if (a.style && /url\s*\(/i.test(a.style)) finding('background-image', 'A CSS background image requires explicit asset mapping');
    if (tag === 'img') {
      let url;
      try { url = new URL(a.src ?? '', base); } catch { /* Report below. */ }
      const wpId = /\bwp-image-(\d+)\b/.exec(a.class ?? '')?.[1];
      const result = url && media?.(url, wpId ? Number(wpId) : null);
      if (!result) { finding('missing-image', 'An inline image has no verified captured attachment'); return escape(a.alt ?? ''); }
      if (!Object.hasOwn(a, 'alt')) finding('missing-alt', 'An image has no explicit alternative text');
      return '![' + escape(a.alt ?? '') + '](<' + result + '>)';
    }
    if (['video', 'audio', 'source'].includes(tag)) {
      const url = a.src ? destination(a.src) : null;
      finding('media-player', 'Audio/video player behavior requires review');
      return url ? '[Media file](<' + url + '>)' : children(node);
    }
    if (tag === 'a') {
      const label = children(node), url = destination(a.href ?? '');
      return url ? '[' + label + '](<' + url.replace(/[\r\n<>]/g, encodeURIComponent) + '>)' : label;
    }
    if (tag === 'pre') {
      const raw = text(node), fence = '\x60'.repeat(Math.max(3, ...(raw.match(/\x60+/g) ?? []).map(value => value.length + 1)));
      return '\n\n' + fence + '\n' + raw + '\n' + fence + '\n\n';
    }
    if (tag === 'code') {
      const raw = text(node), fence = '\x60'.repeat(Math.max(1, ...(raw.match(/\x60+/g) ?? []).map(value => value.length + 1)));
      return fence + ' ' + raw + ' ' + fence;
    }
    if (tag === 'table') {
      finding('table', 'Table structure and headings require rendered review');
      const rows = [];
      const collect = item => { if (item.tagName === 'tr') rows.push(item); else for (const child of item.childNodes ?? []) collect(child); };
      collect(node);
      const cells = rows.map(row => (row.childNodes ?? []).filter(cell => ['td', 'th'].includes(cell.tagName)).map(cell => children(cell).trim().replace(/\|/g, '\\|').replace(/\n+/g, ' ')));
      return cells.length ? '\n\n| ' + cells[0].join(' | ') + ' |\n| ' + cells[0].map(() => '---').join(' | ') + ' |\n' + cells.slice(1).map(row => '| ' + row.join(' | ') + ' |').join('\n') + '\n\n' : '';
    }
    const value = children(node);
    if (tag === 'strong' || tag === 'b') return '**' + value.trim() + '**';
    if (tag === 'em' || tag === 'i') return '*' + value.trim() + '*';
    if (tag === 's' || tag === 'del') return '~~' + value + '~~';
    if (/^h[1-6]$/.test(tag)) return '\n\n' + '#'.repeat(Number(tag[1])) + ' ' + value.trim() + '\n\n';
    if (tag === 'br') return '  \n';
    if (tag === 'hr') return '\n\n---\n\n';
    if (tag === 'li') {
      const siblings = (node.parentNode?.childNodes ?? []).filter(child => child.tagName === 'li');
      const prefix = node.parentNode?.tagName === 'ol' ? String(siblings.indexOf(node) + 1) + '. ' : '- ';
      return '\n' + prefix + value.trim().replace(/\n/g, '\n  ');
    }
    if (tag === 'ul' || tag === 'ol') return '\n' + value + '\n\n';
    if (tag === 'blockquote') return '\n\n' + value.trim().split('\n').map(line => '> ' + line).join('\n') + '\n\n';
    if (['p', 'div', 'section', 'article', 'figure', 'figcaption', 'header', 'footer'].includes(tag)) return '\n\n' + value.trim() + '\n\n';
    if (!['span', 'picture', 'main'].includes(tag)) finding('html-structure', 'An HTML element requires review: ' + tag);
    return value;
  }
  const markdown = children(document).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (/\[(?:[a-zA-Z][\w-]*)(?:[^\]\n]*)\]/.test(html.replace(/<[^>]*>/g, ''))) finding('shortcode', 'A possible WordPress shortcode needs review');
  return markdown + '\n';
}
