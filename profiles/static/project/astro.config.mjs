import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import devTools from './scripts/dev-tools-integration.mjs';

const fixtures = process.env.ASTRO_TEST_FIXTURES === '1';
export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL,
  outDir: fixtures ? './dist-fixtures' : './dist',
  cacheDir: fixtures ? './.astro-fixtures' : './.astro',
  integrations: [devTools({ platform: 'static', fixtures })],
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
});
