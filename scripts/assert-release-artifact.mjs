import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function assertReleaseArtifact(directory) {
  const marker = JSON.parse(await readFile(path.join(directory, '.starter-build.json'), 'utf8'));
  if (marker.version !== 1 || marker.profile !== 'release' || marker.deployable !== true) {
    throw new Error('Refusing fixture-enabled or unrecognized artifact. Build a clean normal release.');
  }
  return marker;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  // A stale normal dist must not make `ASTRO_TEST_FIXTURES=1 npm run build` pass.
  if (process.env.ASTRO_TEST_FIXTURES === '1') throw new Error('Release command refuses ASTRO_TEST_FIXTURES=1. Use fixtures:build/fixtures:serve for isolated tests.');
  await assertReleaseArtifact(path.resolve(process.argv[2] || 'dist'));
  console.log('Release artifact profile verified. Also verify the actual production route via check:dev-tools.');
}
