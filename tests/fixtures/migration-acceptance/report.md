# Migration acceptance report

Scope: **url**. Result: **pass**. Exit: **0**.

Evaluates hash-checked observations; producer and HTTP collection details are retained in the evidence artifacts. Content/editor parity needs separate evidence. Supplied observations are attestations; integrity alone does not prove their truth or completeness.

Content and editor parity are outside this result; provider acceptance was not assessed.

Manifest: `3a06755aaecf006bd3f87444e0fe9eb1afd69b35d13d880868f247ce61c55b6c`. Target revision: synthetic-preview-revision-001.

URLs: 7; retained 4, redirected 1, removed 1, excluded 1.

Checks: pass 16, fail 0, advisory 0, unverified 0, not-applicable 3.

| Check | Category | Required in scope | State | Reason |
| --- | --- | --- | --- | --- |
| url:home:status | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:home:title | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:home:description | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:home:canonical | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:home:robots | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:old-news:status | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:old-news:redirects | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:old-news:canonical | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:retired-event:status | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:private-preview:excluded | url | no | not-applicable | Explicit manifest exclusion; retained in URL coverage. |
| url:about-fr:status | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:about-fr:title | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:about-fr:canonical | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:query-search:status | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:query-search:robots | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:guide-fragment:status | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| url:guide-fragment:fragments | url | yes | pass | Synthetic authored fixture observation; no network request was made. |
| acceptance:content-parity | content | no | not-applicable | Outside URL-only scope; content/editor parity is not certified. |
| acceptance:editor-parity | editor | no | not-applicable | Outside URL-only scope; content/editor parity is not certified. |

This is a local report, not an automatic publication-safe summary. Review and sanitize URLs, identifiers and reasons before sharing.
