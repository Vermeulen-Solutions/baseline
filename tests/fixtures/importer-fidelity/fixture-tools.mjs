// Fixture serialization/HTTP protocol only; conversion is always installed EmDash.
import { parse } from 'parse5';
export function htmlFacts(html) {
  const result = { title: '', metas: {}, links: [], images: [], headings: [], listItems: [] };
  const text = n => n.nodeName === '#text' ? n.value : (n.childNodes ?? []).map(text).join('');
  const visit = n => {
    const a = Object.fromEntries((n.attrs ?? []).map(a => [a.name, a.value]));
    if (n.tagName === 'title') result.title = text(n);
    if (n.tagName === 'meta') result.metas[a.name ?? a.property] = a.content;
    if (n.tagName === 'a') result.links.push(a.href);
    if (n.tagName === 'img') result.images.push({ src: a.src, alt: a.alt });
    if (/^h[1-6]$/.test(n.tagName ?? '')) result.headings.push(text(n));
    if (n.tagName === 'li') result.listItems.push(text(n));
    for (const child of n.childNodes ?? []) visit(child);
  };
  visit(parse(html)); return result;
}
const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const cdata = value => `<![CDATA[${String(value).replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
// Deterministic semantic comparison: ignore random PT keys, resolve mark keys
// to definitions, and replace run-specific media URLs with fixture identities.
export function portableFacts(value, media = []) {
  const urls = new Map(media.flatMap(m => [[m.newUrl, `attachment:${m.wpId}`], [m.originalUrl, `attachment:${m.wpId}`]]));
  const clean = (v, marks = new Map()) => {
    if (typeof v === 'string') return urls.get(v) ?? v.replace(/\/view\/(?:wxr|plugin)_posts\//g, '/view/{collection}/');
    if (Array.isArray(v)) return v.map(item => clean(item, marks));
    if (!v || typeof v !== 'object') return v;
    const defs = new Map((v.markDefs ?? []).map(d => [d._key, d]));
    const context = defs.size ? defs : marks;
    return Object.fromEntries(Object.entries(v).filter(([k]) => k !== '_key').map(([k, item]) => [k, k === 'marks' ? item.map(mark => context.has(mark) ? clean(context.get(mark)) : mark) : clean(item, context)]));
  };
  return clean(value);
}
export function syntheticWXR(fixture, posts = fixture.posts) {
  const meta = (key, value) => `<wp:postmeta><wp:meta_key>${xml(key)}</wp:meta_key><wp:meta_value>${cdata(value)}</wp:meta_value></wp:postmeta>`;
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>Synthetic WordPress</title><link>${fixture.origin}</link><language>en</language><wp:wxr_version>1.2</wp:wxr_version><wp:base_site_url>${fixture.origin}</wp:base_site_url><wp:base_blog_url>${fixture.origin}</wp:base_blog_url><wp:author><wp:author_id>7</wp:author_id><wp:author_login>fixture-author</wp:author_login><wp:author_email>fixture@example.test</wp:author_email><wp:author_display_name>Fixture Author</wp:author_display_name></wp:author>
${posts.map(p => `<item><title>${xml(p.title)}</title><link>${fixture.origin}/2020/${p.slug}/</link><dc:creator>fixture-author</dc:creator><content:encoded>${cdata(p.content)}</content:encoded><excerpt:encoded>${cdata(p.excerpt)}</excerpt:encoded><wp:post_id>${p.id}</wp:post_id><wp:post_name>${xml(p.slug)}</wp:post_name><wp:post_type>${p.post_type}</wp:post_type><wp:status>${p.status}</wp:status><wp:post_parent>${p.parent ?? 0}</wp:post_parent><wp:post_date_gmt>${p.date_gmt.replace('T', ' ')}</wp:post_date_gmt>${meta('_icl_lang_code', p.locale)}${p.translation_group ? meta('trid', p.translation_group) : ''}${p.yoast ? meta('_yoast_wpseo_title', p.yoast.title) + meta('_yoast_wpseo_metadesc', p.yoast.description) + meta('_yoast_wpseo_canonical', p.yoast.canonical) + meta('_yoast_wpseo_meta-robots-noindex', '1') + meta('_yoast_wpseo_opengraph-title', p.yoast.og_title) + meta('_yoast_wpseo_opengraph-image', p.yoast.og_image) : ''}${p.rankmath ? meta('rank_math_title', p.rankmath.title) + meta('rank_math_description', p.rankmath.description) + meta('rank_math_canonical_url', p.rankmath.canonical) + meta('rank_math_robots', 'noindex') + meta('rank_math_facebook_title', p.rankmath.og_title) + meta('rank_math_facebook_image', p.rankmath.og_image) : ''}</item>`).join('\n')}
${fixture.media.map(m => `<item><title>${m.title}</title><wp:post_id>${m.id}</wp:post_id><wp:post_type>attachment</wp:post_type><wp:status>inherit</wp:status><wp:attachment_url>${m.url}</wp:attachment_url><wp:post_mime_type>${m.mime_type}</wp:post_mime_type>${meta('_wp_attachment_image_alt', m.alt)}</item>`).join('\n')}
</channel></rss>\n`;
}

export function exporterHandler(state, images, requests) {
  return (req, res) => {
    const url = new URL(req.url, 'http://fixture.invalid');
    requests.push({ path: url.pathname, authenticated: req.headers.authorization === 'Basic Zml4dHVyZTpzeW50aGV0aWM=' });
    const send = value => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(value)); };
    if (url.pathname.startsWith('/uploads/')) {
      const image = images.get(url.pathname);
      if (!image) { res.writeHead(404).end(); return; }
      res.setHeader('content-type', 'image/png'); res.end(image); return;
    }
    if (req.headers.authorization !== 'Basic Zml4dHVyZTpzeW50aGV0aWM=') { res.writeHead(401).end(); return; }
    const endpoint = url.pathname.split('/').at(-1), fixture = state.fixture;
    if (endpoint === 'analyze') {
      send({ site: { title: 'Synthetic WordPress', url: fixture.origin }, post_types: ['post', 'page'].map(name => ({ name, label: name, label_singular: name, total: fixture.posts.filter(p => p.post_type === name).length, by_status: {}, supports: {}, taxonomies: [], custom_fields: [], hierarchical: name === 'page', has_archive: false })), taxonomies: [], authors: [{ id: 7, login: 'fixture-author', email: 'fixture@example.test', display_name: 'Fixture Author', post_count: 13 }], attachments: { count: 2, by_type: { 'image/png': 2 } }, i18n: { plugin: 'wpml', default_locale: 'en', locales: ['en', 'nl'] } }); return;
    }
    if (endpoint === 'content') {
      const posts = fixture.posts.filter(p => p.post_type === url.searchParams.get('post_type'));
      const page = Number(url.searchParams.get('page') ?? 1), per = 3;
      send({ items: posts.slice((page - 1) * per, page * per), total: posts.length, pages: Math.max(1, Math.ceil(posts.length / per)), page, per_page: per }); return;
    }
    if (endpoint === 'taxonomies' || endpoint === 'comments') { send([]); return; }
    if (endpoint === 'media') { send({ items: fixture.media, total: 2, pages: 1, page: 1, per_page: 100 }); return; }
    if (endpoint === 'menus') { send(fixture.menus); return; }
    if (endpoint === 'options') { send({}); return; }
    res.writeHead(404).end();
  };
}
