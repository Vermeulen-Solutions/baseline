import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runSync } from './skill-sync.mjs';
try { console.log(JSON.stringify(await runSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'site'), null, 2)); }
catch (error) { console.error(error.message); process.exitCode = 1; }
