import { definePlugin } from 'emdash';

// Loaded only into the owned temporary application by metadata.integration.mjs.
export function createPlugin() {
  return definePlugin({
    id: 'baseline-metadata-fixture', version: '1.0.0',
    hooks: {
      'page:metadata': async ({ page }) => page.path === '/metadata-plugin' ? [
        { kind: 'meta', name: 'description', content: 'Plugin description wins' },
        { kind: 'link', rel: 'canonical', href: 'https://plugin.example.test/preferred' },
        { kind: 'property', property: 'og:url', content: 'https://plugin.example.test/preferred' },
        { kind: 'jsonld', id: 'primary', graph: { '@context': 'https://schema.org', '@type': 'WebPage', url: 'https://plugin.example.test/preferred' } },
      ] : page.path === '/' ? [
        { kind: 'jsonld', id: 'organization', graph: { '@context': 'https://schema.org', '@type': 'Organization', name: 'Fixture organization wins', url: page.siteUrl } },
      ] : page.path === '/posts/welcome' ? [
        { kind: 'jsonld', id: 'breadcrumbs', graph: { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Plugin home', item: page.siteUrl + '/' },
          { '@type': 'ListItem', position: 2, name: '</script><img src=x>\u2028', item: page.canonical },
        ] } },
      ] : null,
    },
  });
}
