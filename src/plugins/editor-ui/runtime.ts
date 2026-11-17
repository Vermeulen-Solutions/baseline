import { definePlugin } from 'emdash';
import { PLUGIN_ID, TEXT } from './config';

export function createPlugin(options: { adminEntry: string }) {
  return definePlugin({
    id: PLUGIN_ID, version: '0.1.0',
    admin: {
      entry: options.adminEntry,
      pages: [{ path: '/', label: TEXT.helpNav, icon: 'question' }],
      widgets: [{ id: 'start', title: TEXT.startWidget, size: 'full' }],
    },
  });
}
