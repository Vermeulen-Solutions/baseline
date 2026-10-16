import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import devTools from "./scripts/dev-tools-integration.mjs";

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
          database: sqlite({ url: "file:./data.db" }),
          storage: local({
              directory: "./uploads",
              baseUrl: "/_emdash/api/media/file",
          }),
      }),
	],

  devToolbar: { enabled: false },

  vite: {
    define: { 'import.meta.env.STARTER_TEST_FIXTURES': JSON.stringify(testFixtures) },
    // Resolve each dependency's Zod version before bundling EmDash server chunks.
    // Optional tooling uses Zod 3; bare external imports in dist would select it.
    ssr: { noExternal: ["zod"] },
    plugins: [tailwindcss()],
  },
});
