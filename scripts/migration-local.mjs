import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { noLinks, readBytes } from './wordpress-io.mjs';

// Portable local I/O for migration verification; no hosting/database configuration imports.
export const bytesOf = (file, max = 64 * 1024 * 1024) => readBytes(file, max);
export const isMain = meta => process.argv[1] && meta === pathToFileURL(process.argv[1]).href;
export function argumentsOf(values, flags) {
  const result = {};
  for (let index = 0; index < values.length; index++) {
    const [flag, ...tail] = values[index].split('='), name = flag.slice(2);
    if (!flags.includes(flag) || Object.hasOwn(result, name)) throw Error('Unknown or duplicate migration argument');
    const value = tail.length ? tail.join('=') : values[++index];
    if (!value || value.startsWith('--')) throw Error('Missing migration argument value'); result[name] = value;
  }
  return result;
}
export function newDirectory(directory) {
  const out = noLinks(directory);
  if (fs.existsSync(out)) throw Error('Output already exists; choose a new destination');
  fs.mkdirSync(out, { recursive: true, mode: 0o700 }); return out;
}
