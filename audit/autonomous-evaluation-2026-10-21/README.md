# Autonomous workflow comparison and live MCP checks

The requested changes and content passed independent functional acceptance in all
six fresh-agent trials. The inspection pilot did not show a consistent discovery
advantage. Keep it optional and bounded; this sample does not justify a broader
catalog or a mandatory PROJECT.md file. Live MCP role checks passed all sixteen
observations and led to one clarification about draft visibility in the guide.

## Matched task outcomes

Each scenario had one source-discovery session and one inspection-enabled session.
The tracked starting trees were identical within each pair, verified in
[fixture-receipt.json](fixture-receipt.json). Sessions had no parent history,
prior conclusions or corrective implementation hints. See the frozen
[protocol](protocol.json), [prompts](prompts.json), and per-trial reports,
traces, patches and authored artifacts under `trials/`.

| Task | Source discovery | Inspection enabled | Independent observations |
| --- | --- | --- | --- |
| Reduce one grid's gap by 25% | Accepted | Accepted | Same focused one-file change; Chromium computed gaps were 0.75 of the unchanged reference grid at 600, 1000 and 1500 CSS pixels |
| Optional Sveltia reading minutes | Accepted | Accepted | Paired form/schema; 1 and 60 build/render; 0, 61, fractions and numeric strings fail the real Astro content pipeline; absent legacy value still builds |
| Create an owned CMS draft via MCP | Accepted, application verification qualified | Accepted, application verification qualified | Exact title, excerpt and body read back; correct Contributor owner; draft status; anonymous route returns 404; application/seed/settings source unchanged |

The detailed independent results are in [spacing acceptance](spacing-acceptance.json),
[Sveltia acceptance](sveltia-acceptance.json), [CMS acceptance](cms-task-acceptance.json),
[source preservation](preservation.json) and [static verification](independent-static-checks.json).
These are local bounded checks, not a general visual, accessibility or production
acceptance. No trial requested client clarification.

## Recorded discovery observations

| Task | Requests: source → inspection | Emitted bytes: source → inspection | File-read requests: source → inspection |
| --- | --- | --- | --- |
| Spacing | 5 → 7 | 80,429 → 64,119 | 9 → 9 |
| Sveltia field | 12 → 8 | 65,240 → 73,787 | 17 → 14 |
| CMS draft | 5 → 10 | 124,467 → 131,742 | 8 → 7 |

[Discovery results](discovery-results.json) define the counts. Requests are
runner invocations, including batched reads and follow-up artifact searches, not
model tool calls. Bytes are runner output before any tool/UI truncation, not
model input tokens, cost or elapsed time. Search output was bounded. Repeated
reads are recorded but may be legitimate verification after an edit; they are
not automatically unnecessary work. MCP requests are recorded separately.

Inspection reduced emitted bytes for spacing while adding requests. It reduced
requests for the Sveltia field while adding bytes. The CMS task used more
requests and bytes with inspection. One pair per task, batching choices, and
unexposed resolved model/token metrics prevent a general performance conclusion.
The result supports an optional source map, not an automatic first command for
every task. No new registry, filters or precedence file were added.

## CMS access and the resulting guidance

The [role report](roles.md) and [machine receipt](role-acceptance.json) cover the
real EmDash MCP endpoint with Subscriber, Contributor, Author and Editor accounts.
Scopes, ownership, publication, stale revisions and revocation behaved as expected.
A Contributor could read another user's draft while being unable to edit it or
publish their own. The agent documentation now explains that distinction and the
narrower published-content access option. All eight temporary PATs were removed,
the seven synthetic accounts disabled, test content trashed and the server stopped;
see [cleanup](cleanup.json).

These trials did not test cold handoff recovery or PROJECT.md. They exposed no
new durable-context failure requiring a second project-facts file. The earlier
saved-handoff trials remain separate evidence; no claim about arbitrary recovery
or all future projects follows here.

## Material operator limits

- Project sources and artifacts were separated, but existing dependency trees
  were shared through explicit junctions. There was no enforced filesystem or
  process sandbox, and concurrent resource use prevents elapsed-time comparison.
- Both copied CMS projects passed their unit tier and built, but their full
  verification rejected linked inputs in two importer/migration rehearsals.
  They are not reported as fully green site deliveries. The live CMS fixture
  had its own prior independent-install verification; root verification is
  recorded separately. This operator shortcut should not be reused for trials
  whose criterion is a complete CMS application verification.
- The runner incorrectly withheld doctor, audit:html and check:dev-tools despite
  those scripts appearing in discovery. This was an operator allowlist defect,
  not a platform restriction. The independent grader ran the static dev-tools
  checks afterward. The identical runner remained in both arms during trials.
- Npm script names were shifted out of trace arguments. Inspection runs remain
  identifiable by --json and worker reports; other npm output is excluded from
  discovery counts. The trace is a convention, not proof of every possible read.
- Source-only CMS copies received sanitized documentation MCP configuration and
  fresh Git history before dispatch. No working environment, database, uploads
  or original client-config history was exposed to workers. Live credentials
  stayed in an ignored controller file and are absent from the evidence.
- Browser-editor GitHub login/save, hosted OAuth consent, D1, deployment and
  production remain outside scope. Static tasks used their native file workflows;
  EmDash content and permission operations used MCP.

`harness/` preserves selected historical graders, not a supported product command
or standalone benchmark. They depend on the recorded disposable fixtures and an
ignored controller runtime. To reproduce, prepare fresh source-equivalent sites,
provision synthetic identities, replay the frozen prompts in fresh sessions, and
grade actual artifacts. Do not rerun these historical scripts against an existing
client site. Final original-repository gates are recorded in `repository-checks.json`.
