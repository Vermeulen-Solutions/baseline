import astro from 'eslint-plugin-astro';
import tsParser from '@typescript-eslint/parser';

// Portable across CMS/static profiles. Astro type checking remains a separate gate.
export default [
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  { ignores: ['**/node_modules/**', '**/dist/**', '**/dist-fixtures/**', '**/.astro/**', '**/.astro-fixtures/**'] },
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-strict'],
  {
    files: ['**/*.astro'],
    languageOptions: { parserOptions: { parser: tsParser } },
    settings: { 'jsx-a11y-x': { components: { ResponsiveImage: 'img' } } },
  },
];
