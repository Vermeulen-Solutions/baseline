# Optional-field clearing: parent oracle correction

The frozen protocol classified an explicit `null` as invalid. That was an
operator assumption, stronger than the user's requirement that an optional
number could be left or cleared. The evaluating agent independently selected
Zod's `nullish()` and conditional rendering, documented its clearing behavior,
and exercised omitted/null values through Astro. No corrective implementation
hint was supplied.

The parent's initial frozen-oracle build run is preserved as
`after/loader-frozen.json`: nine cases passed, then the null-rejection assertion
failed because the build correctly accepted the agent's declared empty state.
The original source was restored and a final production rebuild passed. The
protocol/request hashes were not changed.

On review, accepting explicit null as absence is compatible with the request.
[Sveltia's number-field documentation](https://sveltiacms.app/en/docs/fields/number)
describes null for an optional empty number. This site's
`output.omit_empty_optional_fields: true` additionally omits empty values when
serializing. A numeric string, empty string, boolean, fraction or out-of-range
number is still not a valid entered number. No field default was introduced.

The parent reran a separately identified reviewed oracle: omission and null
produce no label, both integer endpoints render correctly, and invalid entered
values fail through the real Astro loader. This is an acceptance-oracle
correction, not a post-hoc claim that the frozen initial check passed. It does
not establish authenticated editor clearing/save/rebuild behavior.
