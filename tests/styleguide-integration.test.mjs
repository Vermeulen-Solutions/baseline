import test from 'node:test';
import assert from 'node:assert/strict';
import styleguide from '../scripts/styleguide-integration.mjs';

function setup(command) {
  const routes = [];
  styleguide().hooks['astro:config:setup']({ command, injectRoute: (route) => routes.push(route) });
  return routes;
}

test('the styleguide route is injected for astro dev only, never in a build', () => {
  assert.deepEqual(setup('dev'), [{ pattern: '/_styleguide', entrypoint: './src/pages/_styleguide.astro', prerender: false }]);
  assert.deepEqual(setup('build'), []);
  assert.deepEqual(setup('preview'), []);
});
