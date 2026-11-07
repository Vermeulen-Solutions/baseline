import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePublicCapabilities } from '../src/lib/capabilities.ts';

const VIRTUAL_MODULE_ID = 'virtual:baseline/capabilities';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
export const SEARCH_CONFIG_RECEIPT = '.baseline-search.json';
export const SEARCH_INDEX_RECEIPT = '.baseline-search-index.json';

/**
 * Baseline Features Astro integration.
 * Injects virtual:baseline/capabilities Vite module exposing public, browser-safe facts.
 * When search is configured, a build writes a configuration receipt beside the
 * release marker. It records intent only; `npm run search:index` records readiness.
 *
 * @param {import('../src/lib/capabilities.js').BaselineFeaturesOptions} [options]
 * @returns {import('astro').AstroIntegration}
 */
export default function baselineFeatures(options = {}) {
  let publicCapabilities;
  let outDir;
  let output = 'static';

  return {
    name: 'baseline-features',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        publicCapabilities = resolvePublicCapabilities(options, {
          base: config.base,
          trailingSlash: config.trailingSlash,
        });

        updateConfig({
          vite: {
            plugins: [
              {
                name: 'vite-plugin-baseline-capabilities',
                resolveId(id) {
                  const cleanId = id.split('?')[0].replaceAll('\\', '/');
                  if (cleanId === VIRTUAL_MODULE_ID) {
                    return RESOLVED_VIRTUAL_MODULE_ID;
                  }
                  return null;
                },
                load(id) {
                  if (id === RESOLVED_VIRTUAL_MODULE_ID) {
                    return `export default ${JSON.stringify(publicCapabilities)};\nexport const capabilities = ${JSON.stringify(publicCapabilities)};\n`;
                  }
                  return null;
                },
              },
            ],
          },
        });
      },
      'astro:config:done': ({ config }) => {
        outDir = config.outDir;
        output = config.output;
      },
      'astro:build:done': async ({ dir }) => {
        const artifact = fileURLToPath(outDir);
        // A rebuilt artifact never inherits a previous index's readiness claim.
        await rm(path.join(artifact, SEARCH_INDEX_RECEIPT), { force: true });
        if (!publicCapabilities?.search) {
          await rm(path.join(artifact, SEARCH_CONFIG_RECEIPT), { force: true });
          return;
        }
        // For server output `dir` is build.client; for static output it is outDir.
        const publicDir = path.relative(artifact, fileURLToPath(dir)).replaceAll('\\', '/') || '.';
        const receipt = {
          version: 1,
          kind: 'search-configuration',
          engine: publicCapabilities.search.engine,
          bundlePath: publicCapabilities.search.bundlePath,
          base: publicCapabilities.base,
          trailingSlash: publicCapabilities.trailingSlash,
          profile: publicCapabilities.profile,
          output,
          publicDir,
          indexed: false,
        };
        await writeFile(path.join(artifact, SEARCH_CONFIG_RECEIPT), JSON.stringify(receipt, null, 2) + '\n');
      },
    },
  };
}
