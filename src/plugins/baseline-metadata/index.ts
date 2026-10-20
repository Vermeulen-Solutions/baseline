import { definePlugin, getSiteSettings } from 'emdash';
import type { PageMetadataContribution, PublicPageContext } from 'emdash';
import { breadcrumbGraph, organizationGraph } from '../../lib/structured-data.ts';

export interface MetadataOptions {
  breadcrumbs?: boolean;
  /** Explicit site-owned organization pages. Empty disables this graph. */
  organizationPaths?: string[];
}

/** Stable contribution IDs let another metadata hook replace these defaults.
 * EmDash deduplicates by ID, not schema type: turn off the relevant default
 * when a third-party plugin uses a different ID for the same entity.
 */
export function siteMetadata(page: PublicPageContext, options: MetadataOptions = {}, logo?: string): PageMetadataContribution[] {
  if (!page.siteUrl) return [];
  const contributions: PageMetadataContribution[] = [];
  const breadcrumbs = options.breadcrumbs === false ? undefined : breadcrumbGraph(page.breadcrumbs, page.siteUrl);
  if (breadcrumbs) contributions.push({ kind: 'jsonld', id: 'breadcrumbs', graph: breadcrumbs });
  if ((options.organizationPaths ?? ['/']).includes(page.path)) {
    const organization = organizationGraph(page.siteName ?? '', page.siteUrl, logo);
    if (organization) contributions.push({ kind: 'jsonld', id: 'organization', graph: organization });
  }
  return contributions;
}

/** Site-owned native code: no runner, network, storage or registry dependency. */
export function createPlugin(options: MetadataOptions = {}) {
  return definePlugin({
    id: 'baseline-metadata', version: '0.1.0',
    hooks: {
      'page:metadata': {
        priority: 10_000,
        handler: async ({ page }) => {
          // Base already registers its settings hint. This is request-cached.
          const settings = (options.organizationPaths ?? ['/']).includes(page.path) ? await getSiteSettings() : undefined;
          return siteMetadata(page, options, settings?.logo?.url);
        },
      },
    },
  });
}
