# Production chunk splitting

The October 2026 checkout uses Astro 7.4 / Vite 8.3 / Rolldown. Vendor
groups retain entry ownership and hashed asset names in client and server builds.
The 5,722,116-byte editor library and 3,645,248-byte registry chunk are split;
the largest resulting client chunk is 1,516,838 bytes, with the next at 316,866.

The remaining large chunk contains **one module**:
`@emdash-cms/admin/dist/index.js` (2,873,497 rendered bytes before minification).
Rolldown's maxSize divides groups at module boundaries, not within a module.
Resolving the final 500 kB advisory requires an upstream unbundled admin export
or an upstream split release. Raising the warning threshold, suppressing the
warning, or rewriting published dependency internals would conceal this limit.
No such workaround is applied. The advisory requirement remains outstanding.

References: https://rolldown.rs/reference/OutputOptions.codeSplitting and
https://rolldown.rs/reference/TypeAlias.CodeSplittingGroup.
