import fs from 'node:fs';
import path from 'node:path';
import { safeRelative } from './audit-evidence.mjs';
import { bytesOf, noLinks, requireFact, sha256 } from './infrastructure-io.mjs';
export const safeKey = key => safeRelative(key) && Buffer.byteLength(key) <= 1024 && !/[\u0000-\u001f\u007f]/.test(key);
export function inventoryFiles(source) {
  const root = noLinks(source); requireFact(fs.statSync(root).isDirectory(), 'Source directory required');
  const files = []; let total = 0, visited = 0;
  function walk(relative = '') {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      requireFact(++visited <= 10000 && !entry.isSymbolicLink(), 'Source inventory bound/link refused');
      const key = relative ? relative + '/' + entry.name : entry.name; requireFact(safeKey(key), 'Unsafe storage key');
      if (entry.isDirectory()) walk(key);
      else { const bytes = bytesOf(path.join(root, key)); total += bytes.length; requireFact(total <= 1024 * 1024 * 1024, 'Source byte inventory bound exceeded'); files.push({ key, bytes: bytes.length, sha256: sha256(bytes) }); }
    }
  }
  walk(); return files;
}
export function mimeForKey(key) {
  return { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm' }[path.extname(key).toLowerCase()] ?? 'application/octet-stream';
}
