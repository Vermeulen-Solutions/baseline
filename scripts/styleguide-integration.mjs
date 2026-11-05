/**
 * Portable, dev-only component calibration route for sites that adopt Baseline's
 * calibration practice without its full dev-tools integration (which also ships test
 * fixtures and starter specimens). Injects `/_styleguide` from the site's own
 * `src/pages/_styleguide.astro` for `astro dev` only, so release builds never contain it.
 *
 *   import styleguide from './scripts/styleguide-integration.mjs';
 *   integrations: [styleguide()]
 */
export default function styleguide({ entrypoint = './src/pages/_styleguide.astro', pattern = '/_styleguide' } = {}) {
  return {
    name: 'baseline-styleguide',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command === 'dev') injectRoute({ pattern, entrypoint, prerender: false });
      },
      'astro:server:start': ({ logger }) => logger.info(`Component calibration: ${pattern} (development only)`),
    },
  };
}
