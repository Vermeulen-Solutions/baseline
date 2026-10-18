# Migration acceptance contracts — versions 1, 2 and 3

These contracts define expectations, observations and acceptance reports.
**Without `--observations`, the CLI now collects bounded live HTTP evidence.**
Supplying observations keeps evaluation offline. Version 3 also reconciles
hash-bound offline content inventories in full scope. Neither mode performs
credentialed CMS reads, runs page JavaScript, tests editor saves or contacts
email/form providers. See [content inventory contracts](migration-content-inventories.md).

Version 1 remains supported with its original declarations and severity. Version
2 adds explicit link, image, indexing and advisory assertions plus a required
HTTP-completeness check. Version 3 requires offline inventory evidence and adds
content checks without changing versions 1 or 2. Existing manifests are never
silently upgraded.

The authoritative executable schemas are in
[`standards/schemas/migration-acceptance.mjs`](../standards/schemas/migration-acceptance.mjs).
They expose `validateManifest`, `validateObservations` and
`validateMigrationReport(report, manifest)`, each returning an array of validation
errors (empty means valid). These are strict MJS schemas, not JSON Schema files;
no coercion or undeclared object properties are accepted. Report validation needs
the paired manifest to verify coverage and required-check declarations.

## Workflow and CLI

1. Capture the reviewed source inventory and identify the target deployment or
   content revision. Fill in expectations; declare approved removals/exclusions.
2. Save the manifest privately, normally in `.emdash/migration-acceptance/`.
   A tracked inventory such as `audit/url-inventory.json` must be sanitized first.
3. Run the CLI against the reviewed origins, or supply bound observations and
   their local artifacts for offline replay. A new output directory is reserved
   before collection; an existing destination never triggers requests.
4. Review the JSON and Markdown report, including all exclusions, optional
   failures and unknowns. A passing URL report covers only its declared checks;
   it does not certify content/editor parity or discover unlisted legacy URLs.

```sh
npm run migration:verify -- --help

# Live anonymous HTTP collection against the manifest's explicit origins.
npm run migration:verify -- --manifest .emdash/migration-acceptance/site-manifest.json --scope url

# Synthetic URL-only contract example; returns 0 using supplied fixture evidence.
npm run migration:verify -- --manifest tests/fixtures/migration-acceptance/manifest.json --observations tests/fixtures/migration-acceptance/observations.json --scope url

# Same example in full scope returns 2: no content/editor parity evidence supplied.
npm run migration:verify -- --manifest tests/fixtures/migration-acceptance/manifest.json --observations tests/fixtures/migration-acceptance/observations.json --scope full
```

| Flag | Contract |
| --- | --- |
| `--manifest <file>` | Required strict UTF-8 JSON, at most 4 MiB; no comments, duplicate object keys or trailing commas |
| `--observations <file>` | Replay local observations offline; omit to collect live HTTP. Version must match the manifest, capture and target revision. |
| `--scope url\|full` | Default `full`. `url` evaluates URL declarations only; content/editor checks are `not-applicable` and nonrequired in that scoped report. |
| `--format json\|markdown\|both` | Default `both`. Selects output files; stdout is JSON for `json`/`both`, Markdown for `markdown`. npm itself prints a command banner; use the report file or invoke `node scripts/migration-verify.mjs` directly for machine-readable stdout. |
| `--out <new-directory>` | Default `.emdash/migration-acceptance/run-<UUID>/`. Existing destinations and linked path components are refused. |
| `--help` | Usage only, exit 0, no report. Cannot be combined with other flags. |

Duplicate/unknown flags and invalid values return 2. There is **no `--target`
override**: edit the explicit manifest and rebind observations. There is **no
`--strict` switch**: required declarations always govern acceptance. No install,
deployment, media upload, redirect creation or CMS mutation occurs. Live
collection issues anonymous GET/HEAD requests only; review origins and scope
before running it against a real site.

Default output is git-ignored. An explicit `--out` can name a new reviewed
directory elsewhere, for example `audit/sanitized-example-001`; it is not an
automatic redaction feature. To maintain `audit/migration-report.md`, inspect and
sanitize a generated Markdown report, then deliberately copy it there. The CLI
never replaces an existing report. Source URLs, expectations and observation
reasons can be private even when all evidence is local.

Valid inputs yield `report.json` and/or `report.md`, including when the result is
failure or unverified. Invalid root manifests/observation bundles yield exit 2
before output creation. Unavailable or invalid v3 inventory inputs are recorded
as unverified in the report. Output I/O failure also returns 2; a partial
directory is not a pass.

## Manifest schema

Every field below is required unless marked optional. Object keys are closed;
versions are the integer `1`, `2` or `3`. IDs match `[a-z][a-z0-9-]{0,63}`; digests are
lowercase 64-character SHA-256. Strings have explicit bounds in the executable
schema and cannot contain control characters. JSON nesting is limited to 30.

| Field | Meaning |
| --- | --- |
| `manifestVersion`, `id` | Contract version and stable migration identifier |
| `sourceOrigin` | Exact HTTP(S) origin of the legacy URLs |
| `targetOrigin` | Exact fetch origin of the preview/target deployment |
| `productionOrigin` | Intended public origin for canonical expectations; not inferred from preview |
| `allowedAssetOrigins` | Explicit unique HTTP(S) origin list (0–32); no automatic inheritance or wildcard. An empty list authorizes no asset origin. Future collection must check every destination/hop. |
| `sourceCapture` | `{id, sha256}` identifying the source capture; its bytes must be retained by the migration owner |
| `targetRevision` | Nonempty deployment/content revision identifier, at most 200 characters. Caller-supplied identity, not independently verified deployment state. |
| `policies` | `{trailingSlash: "preserve"\|"always"\|"never", query: "exact"}` |
| `urls` | 1–500 entries; at least one nonexcluded fetch path |
| `acceptanceChecks` | V1/v2: 2–200 declarations with required content and editor checks. V3: 1–200 with a required editor check; inventory content checks are generated separately. |
| `inventories` | `{source, target, mapping}`, each `{reference, sha256}`. Required and reconciled in full scope for v3; reserved optional metadata in v1/v2. [Inventory contracts](migration-content-inventories.md) define file binding and schemas. |
| `http` (optional, v2/v3) | Positive integer limit overrides from the HTTP table below; limits may only be reduced |

Origins have no trailing slash, path, query, fragment, credentials or implicit
normalization. URLs must already be in their exact serialized form (for example,
percent-encode non-ASCII path characters and spaces). The schema rejects dot-path,
backslash, host-case/default-port or other spelling that the URL parser silently
normalizes. It rejects malformed percent escapes and treats equivalent
percent-encoded unreserved characters/case as ambiguous duplicates, without
rewriting the input.

Query bytes and ordering remain significant: `?a=1&b=2`, `?b=2&a=1` and a URL
without a query are distinct inputs. V1 has no query-stripping or parameter-sorting
mode. A source URL cannot contain a literal fragment: HTML fragment assertions
are separate and must not become a second identity for the same HTTP request.

### URL entries and exclusive dispositions

All entries require `id`, `sourceUrl`, `locale` and `disposition`. `sourceUrl`
must use `sourceOrigin`. Locale is an explicit language tag such as `en` or
`fr-BE`; labels do not prove language content or translation relationships.
IDs, source URL identities and nonexcluded fetch paths must be unique, including
across locales. Header/cookie-based language negotiation at the same URL needs a
future contract; it cannot be disguised as two independent fetches.

| Disposition | Additional required fields | Meaning |
| --- | --- | --- |
| `retained` | `requestPath`, `expected: {status: 200, ...}` | Initial target request has no expected redirects and returns the declared page |
| `redirected` | `requestPath`, `expected: {status: 200, redirects: [{status, path}, ...], ...}` | Exact 1–10-hop chain, with 301/302/303/307/308 statuses, ending in a 200; no repeated path/loop |
| `removed` | `requestPath`, `expected: {status: 404\|410}` | Intentional missing/gone response; no metadata or redirect expectations |
| `excluded` | `reason` | Nonempty deliberate exclusion; no `requestPath` or `expected`. Visible in URL totals and a `not-applicable` check. |

`requestPath` and redirect-hop `path` are exact root-relative path/query strings
without fragments; scheme-relative destinations are refused. The initial fetch
is `targetOrigin + requestPath`. Expected redirect paths describe each resolved
hop on the target/production deployment; observed hop origins must be one of
those two explicit origins, not arbitrary asset origins. F3 must preserve the
origin in its observations and stop rather than silently follow an undeclared
origin. Cross-origin request remapping is not performed by F2. The terminal path
must satisfy the declared slash policy; the root `/` is valid for every policy.
For a redirect, that is the last hop; an old unslashed request may intentionally
redirect to a slashed terminal path.

Retained/redirected `expected` objects can additionally declare:

| Assertion | Shape and semantics |
| --- | --- |
| `title`, `description` | `{value: string\|null, required: boolean}`; null explicitly means absent |
| `canonical` | Same shape; nonnull URL must use `productionOrigin`, with no fragment. Evaluation must never replace it with the preview origin. |
| `robots` | `{value: string[], required: boolean}`; exact unique lowercase directive set, no index/noindex or follow/nofollow conflict; empty explicitly means no directives |
| `fragments` | `{value: string[], required: boolean}`; unique literal HTML IDs without leading `#`, checked separately from HTTP identity |

Versions 2 and 3 additionally support these explicit `expected` assertions on retained
and redirected HTML pages:

| Assertion | Shape and semantics |
| --- | --- |
| `links` | `{value: "reachable", required: boolean}`; bounded internal anchor URL status checks |
| `assets` | Same shape; standard `<img src/srcset>` and `<picture><source srcset>` candidates, declared origins and image MIME checks |
| `indexability` | `{value: "indexable"|"noindex", required: boolean}`; restrictions from meta robots plus X-Robots-Tag |
| `reviewSignals` | `{value: "report", required: false}`; advisory shortcode, raw WordPress comment, legacy-domain and parser findings |

V2 also generates `url:<id>:collection`, a required completeness check for each
nonexcluded URL. If one declared reference is broken and another times out,
`links`/`assets` retains its confirmed failure while `collection` is unverified;
exit 2 takes precedence. Unknown optional checks alone do not make this required
coverage check fail. This v2 addition preserves the v1 severity contract.

Assertions omitted from the manifest are outside its declared coverage. Omission
does not assert a successful check. All status/redirect expectations are required;
metadata assertion severity is explicit. Optional failures/unknowns stay visible
and do not change the required-check exit policy.

Any entry may include `approvedDifferences: [{reason, evidence: {reference,
sha256}}]`. This records review context only: the expected values/mapping must
still describe the intended new behavior. It cannot waive a failing required check.

### Content/editor declarations

`acceptanceChecks` items are `{id, category: "content"|"editor", required: boolean,
expectation: string}`. Full scope always has at least one required content and
editor declaration. In v3 the content declarations are generated from inventories;
`acceptanceChecks` still requires a required editor declaration and can add
separate content attestations. Examples include a supported editor
save/publish/public-read round trip. An inventory cannot establish an editor save.

Generated check IDs are `url:<url-id>:status`, `url:<url-id>:redirects`,
`url:<url-id>:<metadata-key>`, `url:<url-id>:excluded` and
`acceptance:<acceptance-id>`, with the v2 extensions above. Version 3 adds
`content:inputs`, `content:coverage`, `content:identity`, `content:fields`,
`content:relationships`, `content:media`. They form the complete
ordered report matrix; at most 5000 generated declarations are supported.

## Observations and local evidence

Observation objects contain these required fields (v3 additionally permits the
count-only `content` summary defined in the inventory contract):

```text
observationsVersion: same integer version as manifestVersion
manifestSHA256: semantic manifest digest
sourceCaptureSHA256: same as manifest.sourceCapture.sha256
targetRevision: same as manifest.targetRevision
capturedAt: UTC timestamp in YYYY-MM-DDTHH:mm:ss.sssZ form
checks: [{id, status, reason, observed, evidence: [{path, sha256}]}]
```

The semantic digest is SHA-256 of UTF-8 JSON after recursively sorting object
keys, preserving array order and every value, without whitespace or a final
newline. Use exported `contractDigest`. It is intentionally different from a raw
file checksum. Source capture/evidence SHA-256 values describe their exact bytes.

Unknown or duplicate check IDs, versions, fields or mismatched bindings are
invalid. Partial observations are permitted: missing required checks become
unverified. `observed` is a bounded string (up to 8192 characters), or null when
unavailable; use a concise value or serialized JSON fact rather than a response
body. A reported `pass`, `fail` or `advisory` needs a nonnull observed value and
evidence. Evidence paths
are local relative paths under the observations directory, without traversal,
absolute paths, backslashes or linked components. No evidence URL is fetched.

The CLI hashes bounded regular files (8 MiB each, 64 MiB total per run, cached
per path/digest). Missing, changed, oversized or linked artifacts turn affected
checks into `unverified`. Active `not-applicable` observations and required
`advisory` observations are also unverified: the observation cannot weaken
manifest applicability/severity. Scope and
manifest exclusions alone generate the corresponding out-of-scope states.

Replayed observations are **caller-supplied attestations**. Hashes verify artifact
integrity and binding, not their independent truth. Live observations record
actual HTTP response facts and collector identity in local artifacts, without
verifying the caller's source capture or deployment revision against WordPress
or the host. Record producer/tool identity in retained
evidence. Timestamps are descriptive, not an independent freshness certificate;
changing the manifest, source capture or target revision requires rebinding and
reviewed recapture rather than simply relabeling old observations.

## Reports, states and exit codes

Reports contain a matching `reportVersion`, `toolVersion: "migration-acceptance/<version>"`,
`run: {id, generatedAt}`, `scope`, `mode`, `binding`, `observationsSHA256`,
`coverage`, the complete `checks` array, `result` and `exitCode`. Version 3 also
requires a count-only `content` summary (null for URL-only scope).

V2/v3 also require a deterministic `scopeNotice` in JSON and Markdown, explicitly
stating that URL-only scope does not assess content, editor or provider parity.
Removing or changing that notice makes a v2/v3 report invalid.

`binding` records the manifest ID/digest, source capture digest, target revision
and the three origins. V1 `mode` remains `none` or `supplied-observations`; v2 adds
`http-collected` for a live run. Every non-`none` mode requires the semantic
observations digest. A live v1 report retains the original mode label, with its
HTTP producer provenance in artifacts. `coverage` counts every disposition
and check state, including exclusions. Each check retains its generated ID,
URL ID (null for content/editor), category, active `required` flag, expectation,
status, reason, observed value and evidence references. Excluded/out-of-scope
checks have null observations. Run ID/time are separate from the
deterministic declaration/evaluation data. Markdown escapes supplied text and
summarizes the same report; JSON is the complete machine-readable contract.

| State | Meaning |
| --- | --- |
| `pass` | Hash-checked collected/replayed evidence supports this declared expectation |
| `fail` | Hash-checked collected/replayed evidence supports a confirmed mismatch |
| `advisory` | Nonblocking review signal for an optional check |
| `unverified` | Missing, invalidated or unavailable evidence; not a pass |
| `not-applicable` | Explicit URL exclusion or a content/editor check outside URL-only scope |

| Exit | Acceptance outcome |
| --- | --- |
| `0` | Every required check in the declared scope passes; inspect optional findings and omitted coverage |
| `1` | At least one confirmed required failure and no required unknowns |
| `2` | Invalid input/I/O, or any required unknown. Required failures remain in a valid report even when unknowns take precedence. |

Report validation recomputes coverage, declarations/severity, bindings and exit
precedence from the paired manifest. Dropping checks or setting exit 0 on an
unverified report is invalid. Standalone shape validation or a matching digest is
not a substitute for local artifact verification or independent runtime checks.

## Live HTTP behavior and limits

The collector manually follows 301/302/303/307/308 redirects and checks every
destination before requesting it. Page and internal-link hops are limited to
`targetOrigin`/`productionOrigin`; image hops are limited to `allowedAssetOrigins`.
User-info URLs, unsupported schemes, HTTPS downgrades and undeclared destinations
fail without being followed. Relative locations resolve using URL semantics;
query bytes/order and empty query markers remain significant. Expected redirects
must match every status/path hop and terminal status; retained/removed routes
cannot silently acquire redirects. Loops and redirect-limit violations fail.

Each request starts with fixed Accept/User-Agent headers, manual redirects,
credentials omitted and no referrer. There is no caller-header/authentication
option, cookie jar or forwarding of Set-Cookie, Authorization or API keys.
Failed requests/timeouts are unverified; completed facts and known failures
remain in partial reports. Cooperative cancellation and run deadlines stop new
requests and abort active ones. CLI SIGINT/SIGTERM uses this path when delivered
by the runtime; forced process termination may leave only a partial directory.

| Limit | Default and hard cap (v2 overrides can only reduce it) |
| --- | --- |
| Per-request timeout | `timeoutMs: 10000`, including body reads |
| Entire collection deadline | `runTimeoutMs: 60000` |
| Concurrent page/request workers | `concurrency: 4` |
| Decoded response bytes | `maxResponseBytes: 4194304` (4 MiB) |
| Total decoded response bytes | `maxTotalBytes: 33554432` (32 MiB) |
| Requests, including redirect hops and fallbacks | `maxRequests: 500` |
| Redirect hops in one chain, retaining budget across fallback | `maxRedirects: 10` |
| Unique links and image URLs retained per page, each category | `maxReferencesPerPage: 100`; overflow is unverified, not silent success |

HTML is parsed structurally with pinned direct `parse5@7.3.0`; responsive candidate
strings use pinned direct `parse-srcset@1.0.2`. Both versions were already in the
lockfile transitively; declaring them directly avoids relying on another package's
dependency tree. They remain root development tooling and are omitted from
generated static projects. See the upstream [parse5 API](https://parse5.js.org/functions/parse5.parse.html)
and [srcset parser](https://github.com/albell/parse-srcset).

Parsing runs in an isolated worker with a 3-second deadline, 128 MiB JS heap and
100,000-node bound. Worker library diagnostics are not forwarded to stdout or
reports. Resource failures become unverified. Scripts/styles/templates are not
executed or treated as visible text. Title/description comparisons normalize
HTML whitespace/entities; duplicate title/description/canonical tags fail.
Canonicals resolve using the actual document/base URL and must match the declared
production URL. Meta robots and HTTP X-Robots-Tag are combined; `all`/`none` are
expanded, and agent-qualified restrictions are treated conservatively. Ambiguous
directive syntax is unverified. Declared fragment IDs are checked in the parsed
document, independently of HTTP request identity.

References use HEAD, with bounded GET fallback for 405. Image checks require an
allowed origin and image MIME. External anchors, non-HTTP anchors and explicit
inventory exclusions are counted as skipped. Embedded data images are counted
but not decoded. Every parsed responsive candidate is considered, not a guessed
viewport selection. No form submissions, browser-selected source verification,
image pixel decode, CSS background discovery, script-driven link discovery,
recursive website crawl or cross-page anchor-target validation is claimed.
Sitemaps/robots files can be inventoried as URLs for status checks; their complete
XML/text membership is not inferred from an HTML parse.

Advisory signals count known shortcode forms, raw `wp:` comments and legacy
source-domain references. When the production hostname is retained, legitimate
same-origin references are not labeled remnants; changed path mappings still
need the inventory. These heuristics do not prove text/content equivalence or
detect every unsupported WordPress builder.

Live runs retain `observations.json` and per-entry artifact JSON alongside the
reports. Artifacts contain response status/path/type/header-directive facts,
body hashes, bounded headings (first 50, up to 200 characters each), reference
coverage and review counts; response bodies, cookies and authorization headers
are not persisted. Artifact totals are capped at 32 MiB, individual artifacts at
8 MiB, and replayable observations at 4 MiB. Large displayed observations retain
a digest/preview; raw HTML is not copied into a report. Review URLs/query strings
and editorial metadata before sharing these private files.

## Examples, tests and versioning

The [reference manifest](../tests/fixtures/migration-acceptance/manifest.json)
covers retained title/description/canonical, a two-hop 301, 410 removal, reasoned
exclusion, French content, exact queries and HTML fragments. Its
[observations](../tests/fixtures/migration-acceptance/observations.json),
[JSON report](../tests/fixtures/migration-acceptance/report.json) and
[Markdown report](../tests/fixtures/migration-acceptance/report.md) are authored
synthetic contract examples, not an executed crawl or client evidence.

```sh
node --test tests/migration-acceptance.test.mjs
node --test tests/migration-http.test.mjs
node --test tests/migration-content.test.mjs
```

The [v2 HTTP manifest](../tests/fixtures/migration-acceptance/http-manifest.json)
shows opt-in assertions and reduced limits. Replace its synthetic origins before
a live run. The HTTP tests create disposable loopback servers; they never contact
the example domains. Offline replay of the v1 reference fixture remains supported.

Unknown versions are rejected. Changes to required fields, URL identity,
disposition semantics, states, severity/scope or exit behavior require a new
contract version and explicit compatibility/migration handling. Do not silently
reinterpret v1 documents. Tests and sanitized fixtures pin the current contract;
doc clarifications and internal fixes that preserve it need no version bump.
New assertions cannot silently become required on existing manifests. To migrate
v1 to v2, set `manifestVersion: 2`, explicitly add desired assertions/limits,
review the new required `collection` declaration, and recapture/rebind observations
under version 2. Editing a version field alone is not new runtime evidence.

See [WordPress content modeling](wordpress-content-modeling.md) for source
discovery and importer limits, [Support Boundaries](support-boundaries.md) for
runtime evidence, and [the follow-up plan](../audit/migration-reliability-followup-plan.md)
for implementation scope and completion evidence. The command is initially root-only; it is not
added to generated static projects or production builds by this package.

Version-3 adoption requires complete reviewed source/target snapshots, an explicit
mapping and raw-byte inventory digests, plus recaptured/rebound HTTP/editor
observations. See the [version-3 example](../tests/fixtures/migration-content/manifest.json)
and [inventory workflow](migration-content-inventories.md). Changing a version
number alone does not establish content evidence.
