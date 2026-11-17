import type { PluginDescriptor } from 'emdash';
import { fileURLToPath } from 'node:url';
import { PLUGIN_ID } from './config';

// Template: an admin page where editors drag entries into order (see docs/editor-experience.md).
// Not active until a site imports it in astro.config.mjs: emdash({ plugins: [editorialOrderPlugin()] }).
const adminEntry = fileURLToPath(new URL('./admin.tsx', import.meta.url)).replaceAll('\\', '/');
const entrypoint = fileURLToPath(new URL('./runtime.ts', import.meta.url)).replaceAll('\\', '/');
export default function editorialOrderPlugin(): PluginDescriptor {
  return { id: PLUGIN_ID, version: '0.1.0', format: 'native', entrypoint, adminEntry, options: { adminEntry } };
}
