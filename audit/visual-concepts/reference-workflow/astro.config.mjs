import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ output: 'static', outDir: '../../../.emdash/checks/reference-workflow-dist', cacheDir: '../../../.emdash/checks/reference-workflow-cache', vite: { plugins: [tailwindcss()] } });
