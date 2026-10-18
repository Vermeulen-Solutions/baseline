/** Underscore-prefixed pages are ignored by Astro's file-based router. */
import { writeFile } from 'node:fs/promises';
export default function devTools({ fixtures = false, platform = 'emdash' } = {}) {
  if (!['static', 'emdash'].includes(platform)) throw new Error('Unknown developer-tools platform');
  let artifactDir;
  return {
    name: 'starter-dev-tools',
    hooks: {
      'astro:config:setup': async ({ config, command, injectRoute, injectScript, updateConfig, addMiddleware }) => {
        const definitions = { 'import.meta.env.STARTER_TEST_FIXTURES': JSON.stringify(fixtures) };
        updateConfig({ vite: { define: definitions } });
        // Omit the route entirely from release builds. Runtime flags cannot restore it.
        if (command === 'dev' || (command === 'build' && fixtures)) {
          injectRoute({ pattern: '/_styleguide', entrypoint: './src/pages/_styleguide.astro', prerender: config.output !== 'server' });
        }
        if (command === 'build' && !fixtures && config.output === 'server') {
          addMiddleware({ entrypoint: new URL('./dev-tools-middleware.mjs', import.meta.url), order: 'pre' });
        }
        if (fixtures) injectScript('page-ssr', 'import "/src/dev/visual-fonts.css";');
      },
      'astro:config:done': ({ config }) => { artifactDir = config.outDir; },
      'astro:build:done': async () => {
        // The build:done dir may be build.client for SSR adapters, not outDir.
        await writeFile(new URL('.starter-build.json', artifactDir), JSON.stringify({ version: 1, profile: fixtures ? 'test-fixtures' : 'release', deployable: !fixtures, platformProfile: platform }) + '\n');
      },
    },
  };
}
