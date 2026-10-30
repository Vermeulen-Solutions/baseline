import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import devTools from "./scripts/dev-tools-integration.mjs";
import { namedIconImports, clientBundleReport } from "./scripts/client-bundles.mjs";

const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const siteUrl = process.env.SITE_URL || env.SITE_URL;
// Build-only profile. Runtime flags cannot enable specimens in an existing artifact.
const testFixtures = process.env.ASTRO_TEST_FIXTURES === '1';
const mediaOrigins = siteUrl ? [new URL(siteUrl).origin] : ["http://localhost", "http://127.0.0.1"];

export default defineConfig({
  output: "server",
  outDir: testFixtures ? './dist-fixtures' : './dist',
  cacheDir: testFixtures ? './.astro-fixtures' : './.astro',
  site: siteUrl,

  // Multilingual configuration (see docs/internationalization.md):
  // i18n: {
  //   defaultLocale: "fr",
  //   locales: ["fr", "en"],
  //   routing: { prefixDefaultLocale: false }, // false keeps /_emdash/admin functional
  // },

  adapter: node({
      mode: "standalone",
	}),

  image: {
      remotePatterns: mediaOrigins.map(origin => {
        const url = new URL(origin);
        return { protocol: url.protocol.slice(0, -1), hostname: url.hostname, ...(url.port ? { port: url.port } : {}), pathname: "/_emdash/api/media/file/**" };
      }),
      layout: "constrained",
      responsiveStyles: true,
	},

  integrations: [
      devTools({ fixtures: testFixtures }),
      react(),
      emdash({
          siteUrl: siteUrl,
          plugins: [{
              id: 'baseline-metadata', version: '0.1.0', format: 'native',
              entrypoint: fileURLToPath(new URL('./src/plugins/baseline-metadata/index.ts', import.meta.url)).replaceAll('\\', '/'),
              options: { organizationPaths: ['/'] },
          }],
          database: sqlite({ url: "file:./data.db" }),
          storage: local({
              directory: "./uploads",
              baseUrl: "/_emdash/api/media/file",
          }),
      }),
	],

  devToolbar: { enabled: false },

  vite: {
    // Preserve entry ownership and dependency initialization. A forced generic
    // vendor size group can split ProseMirror's cyclic graph before PluginKey
    // initializes, breaking the live editor. Let Rolldown own that graph.
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              codeSplitting: {
                groups: [
                  { name: 'react-vendor', test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/, priority: 30, entriesAware: true, maxSize: 350_000 },
                  // Public per-icon imports keep the full dynamic admin icon
                  // catalog out of the inline editor's static dependency graph.
                  { name: 'icon-vendor', test: /node_modules[\\/]@phosphor-icons[\\/]react[\\/]/, priority: 25, entriesAware: true, maxSize: 350_000 },
                  { name: 'photoswipe-vendor', test: /node_modules[\\/]photoswipe[\\/]/, priority: 20, entriesAware: true, maxSize: 350_000 },
                ],
              },
            },
          },
        },
      },
      ssr: {
        build: {
          rolldownOptions: {
            output: {
              codeSplitting: {
                groups: [{ name: 'zod-vendor', test: /node_modules[\\/]zod[\\/]/, entriesAware: true, maxSize: 350_000 }],
              },
            },
          },
        },
      },
    },
    define: { 'import.meta.env.STARTER_TEST_FIXTURES': JSON.stringify(testFixtures) },
    // Resolve each dependency's Zod version before bundling EmDash server chunks.
    // Optional tooling uses Zod 3; bare external imports in dist would select it.
    ssr: { noExternal: ["zod"] },
    plugins: [tailwindcss(), namedIconImports(), clientBundleReport()],
  },
});


