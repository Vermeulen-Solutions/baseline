const decode = value => value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (all, entity) => {
  if (entity[0] !== '#') return ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0' })[entity.toLowerCase()];
  const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
  return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '\ufffd';
});

// A bounded HTML start-tag scanner: quoted '>' is legal, comments and raw-text
// elements cannot manufacture tags. Script bodies retain their literal JSON.
export function scanHTML(html) {
  const tags = [];
  const pattern = /<!--[\s\S]*?(?:-->|$)|<![^>]*>|<\/?([a-z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    if (!match[1] || match[0][1] === '/') continue;
    const name = match[1].toLowerCase(), attrs = Object.create(null);
    for (const attr of match[2].matchAll(/([^\s=/'"<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      const key = attr[1].toLowerCase();
      if (!Object.hasOwn(attrs, key)) attrs[key] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    let body = '';
    if (['script', 'style', 'textarea', 'title'].includes(name)) {
      const closing = new RegExp(`</${name}\\s*>`, 'gi'); closing.lastIndex = pattern.lastIndex;
      const end = closing.exec(html);
      body = html.slice(pattern.lastIndex, end?.index ?? html.length);
      pattern.lastIndex = end ? closing.lastIndex : html.length;
    }
    tags.push({ name, attrs, body });
  }
  return tags;
}

