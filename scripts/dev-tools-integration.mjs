/** Underscore-prefixed pages are ignored by Astro's file-based router. */
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
export default function devTools({ fixtures = false } = {}) {
  let artifactDir;
  return {
    name: 'starter-dev-tools',
    hooks: {
      'astro:config:setup': async ({ injectRoute, injectScript, updateConfig }) => {
        const entry = createRequire(import.meta.url).resolve('emdash');
        const { version } = JSON.parse(await readFile(new URL('../package.json', pathToFileURL(entry)), 'utf8'));
        updateConfig({ vite: { define: { 'import.meta.env.STARTER_EMDASH_VERSION': JSON.stringify(version) } } });
        // Register in both modes: the entrypoint returns 404 before specimens in PROD.
        injectRoute({ pattern: '/_styleguide', entrypoint: './src/pages/_styleguide.astro', prerender: false });
        if (fixtures) injectScript('page-ssr', 'import "/src/dev/visual-fonts.css";');
      },
      'astro:config:done': ({ config }) => { artifactDir = config.outDir; },
      'astro:build:done': async () => {
        // The build:done dir may be build.client for SSR adapters, not outDir.
        await writeFile(new URL('.starter-build.json', artifactDir), JSON.stringify({ version: 1, profile: fixtures ? 'test-fixtures' : 'release', deployable: !fixtures }) + '\n');
      },
    },
  };
}
