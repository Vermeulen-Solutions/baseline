/** Underscore-prefixed pages are ignored by Astro's file-based router. */
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export function styleguidePath({ base = '/', trailingSlash = 'ignore' } = {}) {
  return base.replace(/\/$/, '') + '/_styleguide' + (trailingSlash === 'always' ? '/' : '');
}
/** The opt-in expressive layer's review pages. A site that never adopted the layer has none of these files. */
export const expressiveRoutes = [
  ['/_expressive', 'ExpressiveFixture.astro'],
  ['/_expressive-detail', 'ExpressiveDetailFixture.astro'],
  ['/_expressive-before', 'ExpressiveCompareBefore.astro'],
  ['/_expressive-after', 'ExpressiveCompareAfter.astro'],
];
export default function devTools({ fixtures = false, platform = 'emdash' } = {}) {
  if (!['static', 'emdash'].includes(platform)) throw new Error('Unknown developer-tools platform');
  let artifactDir;
  let resolvedRoutes = [];
  let calibrationPath;
  return {
    name: 'starter-dev-tools',
    hooks: {
      'astro:config:setup': async ({ config, command, injectRoute, injectScript, updateConfig, addMiddleware }) => {
        calibrationPath = styleguidePath(config);
        const definitions = { 'import.meta.env.STARTER_TEST_FIXTURES': JSON.stringify(fixtures) };
        updateConfig({ vite: { define: definitions } });
        // Omit the route entirely from release builds. Runtime flags cannot restore it.
        if (command === 'dev' || (command === 'build' && fixtures)) {
          injectRoute({ pattern: '/_styleguide', entrypoint: './src/pages/_styleguide.astro', prerender: config.output !== 'server' });
          if (platform === 'emdash') injectRoute({ pattern: '/_form-recovery', entrypoint: './src/dev/FormRecoveryFixture.astro', prerender: false });
          injectRoute({ pattern: '/_primitives-fixture', entrypoint: './src/dev/PrimitivesFixture.astro', prerender: config.output !== 'server' });
          // Only the expressive pages whose files exist: a missing entrypoint stops `astro dev` at once (ENOENT).
          const root = config.root ?? pathToFileURL(process.cwd() + '/');
          for (const [pattern, file] of expressiveRoutes) {
            if (existsSync(new URL(`src/dev/${file}`, root))) injectRoute({ pattern, entrypoint: `./src/dev/${file}`, prerender: config.output !== 'server' });
          }
        }
        if (command === 'build' && !fixtures && config.output === 'server') {
          addMiddleware({ entrypoint: new URL('./dev-tools-middleware.mjs', import.meta.url), order: 'pre' });
        }
        if (fixtures) injectScript('page-ssr', 'import "/src/dev/visual-fonts.css";');
      },
      'astro:server:start': ({ logger }) => {
        logger.info(`Component calibration: ${calibrationPath} (use Astro's local development origin)`);
      },
      'astro:config:done': ({ config }) => { artifactDir = config.outDir; },
      'astro:routes:resolved': ({ routes }) => { resolvedRoutes = routes.map(({ pattern, isPrerendered }) => ({ route: pattern, prerender: isPrerendered })); },
      'astro:build:done': async () => {
        // The build:done dir may be build.client for SSR adapters, not outDir.
        await writeFile(new URL('.starter-build.json', artifactDir), JSON.stringify({ version: 1, profile: fixtures ? 'test-fixtures' : 'release', deployable: !fixtures, platformProfile: platform }) + '\n');
        await writeFile(new URL('.starter-routes.json', artifactDir), JSON.stringify(resolvedRoutes) + '\n');
      },
    },
  };
}
