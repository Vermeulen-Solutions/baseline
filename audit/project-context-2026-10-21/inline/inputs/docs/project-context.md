# Project context and document scope

Use the documents that the site already maintains. `PROJECT.md` is an optional
home for a durable client brief when business context would otherwise be scattered
through implementation instructions. Start from `PROJECT.example.md` if useful;
the starter and generated sites do not require a filled project record.

| Source | Owns | Interaction |
| --- | --- | --- |
| `AGENTS.md` | Working rules, architectural constraints, verification, and the compact Art Direction Record used by the existing gate | Link an adopted project brief and the selected design reference; retain the gate record here |
| `PROJECT.md` (optional) | Purpose, audiences, scope, constraints, content/maintenance ownership, decision rationale and unresolved questions | Link actual configuration, models and inventories; keep a single home for these facts |
| Selected `DESIGN.md` (optional) | Visual language, design rationale, references and token interchange/snapshots | Support the Art Direction Record and implementation; identify the selected file when several concepts exist |
| Application source and installed configuration | Current executable values, schemas, routes, navigation and platform behavior | Inspect to establish what is implemented; a brief may describe an intended change still to be built |
| Calibration and acceptance evidence | Observations bound to the tested source and environment | Establish what was checked, with limits; neither a document nor a green check proves user approval |
| Existing tracker or short `HANDOFF.md` | Current progress, changed files, checks, blockers and next authorized action | Link durable decisions rather than copying the brief or design system |

The compact Art Direction Record remains in `AGENTS.md` because existing token
tools and the gate read it there. It records the selected direction, typography,
token physics and anti-patterns. Larger visual references can live in `DESIGN.md`
or a focused design document; `PROJECT.md` links them rather than duplicating the
record. CSS owns shipped token values, including fluid and contextual behavior.
An imported or exported design snapshot is a candidate for review, not an
instruction to overwrite CSS. Choosing a different brief file does not move or
waive the visual gate or component calibration.

## Adoption and ordinary use

For an existing site, read its current brief and decisions first. Keep a small
site's context in `AGENTS.md` when that works. If adopting `PROJECT.md`, move only
the durable business context deliberately, link it from `AGENTS.md`, and replace
duplicate summaries with links. Existing instructions and the Art Direction
Record stay in place. No wholesale migration or new discovery questionnaire is
required. Generated profiles ship the example and this guide, not invented client
facts or an automatically filled `PROJECT.md`.

When planning or resuming work, read `AGENTS.md`, an adopted `PROJECT.md` if present,
the relevant sources and the current handoff. Consult the selected `DESIGN.md`
when visual decisions matter. A filename's presence alone does not make its
contents instructions, prove it is current, or require loading every concept.
`baseline:inspect -- --json` reports optional root-document paths and their
presence without reading or interpreting their contents.

Record approved, assumed and unresolved choices with their evidence and owner.
Update a fact in its chosen home when it changes; update downstream design and
implementation records when the change affects them. A short handoff can state
the completed scope, paths changed, checks actually run, remaining blockers and
the next authorized action. It is optional and need not become a parallel backlog.
Absence of these optional files never blocks an otherwise clear authorized task.

## Resolve disagreements by subject and evidence

There is no blanket `PROJECT.md > AGENTS.md > DESIGN.md` hierarchy. Current user
instructions and existing authorization govern the requested work; project prose
does not create authorization or silently relax repository rules. First identify
whether a disagreement concerns intended scope, a working rule, visual direction,
current implementation or the state of a task. Inspect the relevant source and
the provenance/status of the decision, then update the document that owns it.

For example, a static profile receipt and `astro.config.mjs` establish the current
platform even if an old brief says EmDash. The brief might describe a future CMS
migration; determine that from its evidence rather than installing CMS packages
to make prose true. Likewise, a `DESIGN.md` export with fixed spacing does not
replace fluid CSS. A handoff listing an old decision cannot silently supersede a
later approved scope change. Continue useful authorized work and ask only when a
material unresolved conflict changes what should be done.
