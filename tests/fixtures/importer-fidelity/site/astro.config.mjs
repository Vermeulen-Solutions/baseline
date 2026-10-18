import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import emdash, { local } from 'emdash/astro';
import { sqlite } from 'emdash/db';

export default defineConfig({
  output: 'server', adapter: node({ mode: 'standalone' }),
  site: 'https://production.example.test',
  i18n: { defaultLocale: 'en', locales: ['en', 'nl'], routing: 'manual' },
  integrations: [react(), emdash({ fonts: false, database: sqlite({ url: 'file:./rehearsal.db' }), storage: local({ directory: './uploads', baseUrl: '/_emdash/api/media/file' }) })],
  devToolbar: { enabled: false }, vite: { cacheDir: './.vite', resolve: { preserveSymlinks: true }, server: { fs: { strict: false } }, ssr: { noExternal: ['zod', /^emdash(?:\/|$)/, /^@astrojs\/react(?:\/|$)/] } },
});
