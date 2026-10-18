# Migration acceptance report

Scope: **full**. Result: **pass**. Exit: **0**.

Evaluates hash-checked observations; producer and HTTP collection details are retained in the evidence artifacts. Content/editor parity needs separate evidence. Supplied observations are attestations; integrity alone does not prove their truth or completeness.

HTTP evidence alone does not establish content, editor or provider parity; separate acceptance evidence is required.

Manifest: `e1fe1a576e7a1450b6c517664dbb57b2fd9e737d9cb9ccb25181e8775f2a0505`. Target revision: synthetic-preview-revision-001.

URLs: 7; retained 4, redirected 1, removed 1, excluded 1.

Checks: pass 29, fail 0, advisory 0, unverified 0, not-applicable 1.

Offline content reconciliation (counts only; no editorial values or entity IDs):

| Inventory | Type | Locale | Status | Count |
| --- | --- | --- | --- | --- |
| source | page | en | publish | 1 |
| source | page | nl | publish | 1 |
| target | pages | en | published | 1 |
| target | pages | nl | published | 1 |
| expectedTarget | pages | en | published | 1 |
| expectedTarget | pages | nl | published | 1 |


| Check | Category | Required in scope | State | Reason |
| --- | --- | --- | --- | --- |
| url:home:status | url | yes | pass | Synthetic offline evidence. |
| url:home:collection | url | yes | pass | Synthetic offline evidence. |
| url:home:title | url | yes | pass | Synthetic offline evidence. |
| url:home:description | url | yes | pass | Synthetic offline evidence. |
| url:home:canonical | url | yes | pass | Synthetic offline evidence. |
| url:home:robots | url | yes | pass | Synthetic offline evidence. |
| url:old-news:status | url | yes | pass | Synthetic offline evidence. |
| url:old-news:collection | url | yes | pass | Synthetic offline evidence. |
| url:old-news:redirects | url | yes | pass | Synthetic offline evidence. |
| url:old-news:canonical | url | yes | pass | Synthetic offline evidence. |
| url:retired-event:status | url | yes | pass | Synthetic offline evidence. |
| url:retired-event:collection | url | yes | pass | Synthetic offline evidence. |
| url:private-preview:excluded | url | no | not-applicable | Explicit manifest exclusion; retained in URL coverage. |
| url:about-fr:status | url | yes | pass | Synthetic offline evidence. |
| url:about-fr:collection | url | yes | pass | Synthetic offline evidence. |
| url:about-fr:title | url | yes | pass | Synthetic offline evidence. |
| url:about-fr:canonical | url | yes | pass | Synthetic offline evidence. |
| url:query-search:status | url | yes | pass | Synthetic offline evidence. |
| url:query-search:collection | url | yes | pass | Synthetic offline evidence. |
| url:query-search:robots | url | yes | pass | Synthetic offline evidence. |
| url:guide-fragment:status | url | yes | pass | Synthetic offline evidence. |
| url:guide-fragment:collection | url | yes | pass | Synthetic offline evidence. |
| url:guide-fragment:fragments | url | yes | pass | Synthetic offline evidence. |
| content:inputs | content | yes | pass | Offline content inputs checks passed against the explicit mapping. |
| content:coverage | content | yes | pass | Offline content coverage checks passed against the explicit mapping. |
| content:identity | content | yes | pass | Offline content identity checks passed against the explicit mapping. |
| content:fields | content | yes | pass | Offline content fields checks passed against the explicit mapping. |
| content:relationships | content | yes | pass | Offline content relationships checks passed against the explicit mapping. |
| content:media | content | yes | pass | Offline content media checks passed against the explicit mapping. |
| acceptance:editor-parity | editor | yes | pass | Synthetic offline evidence. |

This is a local report, not an automatic publication-safe summary. Review and sanitize URLs, identifiers and reasons before sharing.
