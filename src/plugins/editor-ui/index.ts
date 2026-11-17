import type { PluginDescriptor } from 'emdash';
import { fileURLToPath } from 'node:url';
import { PLUGIN_ID } from './config';

// Template: editor comfort for non-technical editors (see docs/editor-experience.md): a select widget
// with labels per locale, list columns, a "where this appears" panel, a help page and a dashboard card.
// Not active until a site imports it in astro.config.mjs: emdash({ plugins: [editorUiPlugin()] }).
const adminEntry = fileURLToPath(new URL('./admin.tsx', import.meta.url)).replaceAll('\\', '/');
const entrypoint = fileURLToPath(new URL('./runtime.ts', import.meta.url)).replaceAll('\\', '/');
export default function editorUiPlugin(): PluginDescriptor {
  return { id: PLUGIN_ID, version: '0.1.0', format: 'native', entrypoint, adminEntry, options: { adminEntry } };
}
