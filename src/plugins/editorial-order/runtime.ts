import { definePlugin } from 'emdash';
import { NAV_GROUP, PLUGIN_ID, TEXT } from './config';

export function createPlugin(options: { adminEntry: string }) {
  return definePlugin({
    id: PLUGIN_ID, version: '0.1.0',
    admin: {
      entry: options.adminEntry,
      pages: [{ path: '/', label: TEXT.navLabel, icon: 'arrows-down-up', ...(NAV_GROUP ? { group: NAV_GROUP } : {}) }],
    },
  });
}
