# Phase 5 offline infrastructure certification — 2026-10-16

Issues #8 and #9 are complete against the owner's explicit definition of done: synthetic offline tooling and fixture coverage. No existing project, client database, Cloudflare account, D1 database or R2 bucket was contacted. Real Worker/D1/R2 integration remains unverified. The Phase 3 `standards-v0.1.1` certification is not expanded by this receipt.

## Verification receipts

| Check | Result |
| --- | --- |
| `node --test tests/*.test.mjs` | 83 passed, zero failures/skips; original 60 retained; 32.65 seconds on Windows |
| Final database safety retest | 13 passed, including case-insensitive `DATA.DB` destination refusal |
| `npm run typecheck` | 41 files; zero errors, warnings or hints |
| `npm run build` | Normal Node server and release profile pass; existing admin bundle size advisory remains |
| `npm run check:dev-tools` | Fresh disposable dev specimens/assets and production GET/HEAD/HUD isolation pass |
| `npm run check:art-direction` | No visual source changes |
| `npm run lint` | 74 JavaScript modules pass syntax checks |
| `git diff --check` | Pass |
| Privacy scan of implementation/tests/runbooks/receipts | No client identifiers or developer filesystem paths found |
| Preservation | 36 protected README/docs blobs match `0caf559`; visual source, skills, browser goldens and CI workflow unchanged |

The working root has no `data.db`. Its existing preflight therefore reports **not measured**, rather than certifying a database. Tests measure actual synthetic databases: the local CLI fixture has 17 physical columns; an intentionally widened copy fails the 50-column budget. See [preservation.json](preservation.json) and [completion-verification.json](completion-verification.json).

## Issue #8: database tooling

- `db:diff` requires an explicit closed SQLite source and saved schema snapshot or complete remote identity. Metadata-only inspection normalizes affinity/defaults, generated/hidden columns, PK/index/FK semantics, registry JSON and migration names. Deterministic JSON/Markdown distinguish logical registration from physical width. Missing/ambiguous/unauthorized targets fail closed with exit 2; drift/budget violations exit 1.
- `db:export-seed` invokes the installed EmDash 1.3.0 exporter against a private disposable copy. Explicit collection/field allowlists project a validated candidate into new ignored storage. A private test field is excluded and the candidate round-trips through the actual seed CLI. No automatic replacement of `seed/seed.json` occurs.
- `db:pull-remote` uses an explicit-target polling export adapter, bounded downloads and an isolated literal-SQL reconstruction worker. Mocked HTTP tests verify provenance, integrity, auth failure, stable bookmark handling and credential isolation. Existing/unsafe destinations, the working database name, triggers and unsupported SQL are refused. No live export was attempted.

Actual rehearsal: [verification.json](rehearsal-final/verification.json), [equal report](rehearsal-final/equal/report.md), [intentional drift report](rehearsal-final/drift/report.md), [reference metadata](rehearsal-final/reference/schema.json). Technical contract: [database workflow](../../docs/database-workflow.md).

## Issue #9: media tooling

- `media:migrate-wp` defaults to a deterministic read-only manifest from explicit local uploads and reviewed attachment metadata. Identity includes source, attachment, locale and path. Crops, scaled names, missing originals, aliases, intentional empty alt and distinct metadata survive; filenames never authorize deletion. Preparation archives original hashes, bounds Sharp decoding and offers explicit same-format resizing without mandatory AVIF conversion or upscaling. Reviewed vectors/documents/video remain byte-exact passthroughs; unknown/corrupt files are quarantined.
- Local ingestion uses the installed supported REST media API, disables byte-only deduplication, verifies returned IDs/actual storage keys/dimensions/metadata and hashes fetched bytes. Journals prevent repeated POSTs and require explicit reconciliation/adoption after an uncertain write. No raw SQL media hydration is used. The legacy `media:organize` command is retired and exits 2 without changes.
- The real newly owned local CMS rehearsal creates two byte-identical media records with different metadata. A fresh-revision content API update saves three ordered gallery occurrences including a repeated identity, verifies captions/empty alt and anonymous public rendering, then restores the original content. This proves the scoped API round trip; it is not a browser editor save certification.
- R2 staging uses actual returned keys. Recursive signed S3 HTTP replaces shell interpolation. Locked journals scope evidence by target/key/hash/MIME/profile, but every apply still reads remote bytes/headers. Conditional create-only PUTs protect existing objects. Mock tests cover nested/Unicode keys, bucket switches, changed/deleted objects, partial failure exit 1 and safe resume. No remote deletions or rollback of shared objects occur.

Technical commands and metadata format: [image delivery](../../docs/image-delivery.md). The manual rehearsal is `node scripts/rehearse-infrastructure.mjs --out <new-receipt-directory>`; it refuses CI and permits only owned loopback HTTP requests. Ordinary unit tests use synthetic offline transports; no browser CI or production-build coupling was added.

## Explicit scope bounds and follow-up

- No live D1 expanded-query/row/statement/binding limit, R2 endpoint, Worker image service, deployed upload or restore certification is claimed. A separately authorized disposable-cloud run can evaluate those later.
- Database adapter: pinned EmDash 1.3.0 metadata/migrations and closed files up to 64 MiB. Snapshot reconstruction accepts only its documented bounded SQL subset; trigger/virtual-module exports require a future adapter, not execution of arbitrary exported code.
- Seed candidates are bootstrap artifacts, not full transfers. Relation-backed fields, block schemas and excluded references fail closed; media portability yields exit 2. Supported site packages remain the path for complete transfers.
- WordPress metadata input is the documented normalized attachment format, not a generic WXR/REST parser. Importer analysis supplies the reviewed mapping. No automatic rewrite of arbitrary content fields is included; callers select field/locale and use a fresh revision through supported content APIs. Credits/provenance/locale remain in manifests/journals rather than invented CMS fields.
- The R2 adapter supports the default global S3 endpoint; other jurisdictions require a reviewed adapter. Local CMS targeting is explicit loopback HTTP only.
- README and protected docs retain their requested text, including older media-helper examples. Those old invocations now fail safely; the two technical runbooks define the shipped CLI contract. Maintained skill examples were also left intact within this preservation scope; aligning those references is a follow-up documentation task. Upstream mirrors were not modified.
