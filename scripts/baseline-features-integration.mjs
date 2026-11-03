import { resolvePublicCapabilities } from '../src/lib/capabilities.ts';

const VIRTUAL_MODULE_ID = 'virtual:baseline/capabilities';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

/**
 * Baseline Features Astro integration.
 * Injects virtual:baseline/capabilities Vite module exposing public, browser-safe facts.
 *
 * @param {import('../src/lib/capabilities.js').BaselineFeaturesOptions} [options]
 * @returns {import('astro').AstroIntegration}
 */
export default function baselineFeatures(options = {}) {
  let publicCapabilities;

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
    },
  };
}
