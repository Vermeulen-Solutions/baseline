# Impeccable passes

Read at Stage 5 and Stage 6, on a day-2 visible change, or whenever a step says to run an Impeccable critique, audit or polish. Impeccable is driven by commands, each with its own reference, launcher steps and output contract. Loading the skill, reading its guidance or running `impeccable detect` is not a critique, and does not satisfy a gate that asks for one.

## Before the first pass

1. **Put the brief where Impeccable reads it.** `impeccable context` loads `PRODUCT.md`, `DESIGN.md` and surface briefs, and nothing else. A new site writes its brief in `PRODUCT.md` (start from `PRODUCT.example.md`) at Stage 1 and links it from `AGENTS.md`, which keeps the working rules and the Art Direction Record. An existing site whose brief lives in `AGENTS.md` keeps it there; give the critique's design review the brief and the record by path in its prompt instead.
2. **Load context once per session**, from the project root: `.agents/skills/impeccable/scripts/impeccable context --target <page source>` (`impeccable.cmd` on a Windows shell without `sh`). Follow its directives and do not rerun it. `NO_PRODUCT_MD` on an existing site allows scoped refinement of the incumbent design; it does not block the pass.
3. **One direction process.** `site-art-direction` owns Stage 4: candidate ideas, concepts, the Art Direction Record. Do not also run Impeccable's `shape`, `init` interview or new-work world flow on a Baseline site; that opens a second, competing direction. The Art Direction Record plays the part of `DESIGN.md`; a selected `DESIGN.md` supports it.
4. **Read [craft-floor.md](../../impeccable/reference/craft-floor.md) before every UI edit** made from a finding, including small ones.

## Stage 5: critique each representative page

Run `critique` once per representative page (the home page and one page per archetype that has its own template). The target is the page's source file (`src/pages/index.astro`, `src/pages/oeuvres/index.astro`); the snapshot is keyed and fingerprinted on it. Give both assessments the running preview URL as well. Follow [critique.md](../../impeccable/reference/critique.md) in full; in short:

1. `impeccable critique-storage slug <page source>`, then read `.impeccable/critique/ignore.md` if it exists.
2. Two isolated sub-agents, in parallel, neither seeing the other's output:
   - **A, design review:** its prompt gives the project root, the target and preview URL, the path of `critique-rubric.md` (it reads the rubric itself), the brief (`PRODUCT.md` or the `AGENTS.md` section), the Art Direction Record, and the Stage 4 reference screenshots when there are any. It inspects the page in its own browser tab at 390 and 1440 wide.
   - **B, detector and browser:** `impeccable detect --json <page source> <components it uses>`, plus the browser overlay flow in its own tab.
   With no sub-agent tool, run them one after the other and lead the report with `⚠️ DEGRADED: single-context (<reason>)`.
3. Synthesise one report: score, design-specificity verdict, priority issues (P0–P3), persona red flags.
4. Persist it: `IMPECCABLE_CRITIQUE_META='{…}' impeccable critique-storage write <page source> <body file>`, then `critique-storage trend <page source> 5`.
5. Close the run: targeted questions when there are three or more priority issues, otherwise the literal line `Questions skipped: <n> priority issues`. When the owner is away, follow the context loader's autonomy directive: ask once if a question tool exists; if it errors or the owner said to proceed without them, answer each question from the brief and the Art Direction Record, and say so at the top of the report.

Then act on the findings with the command each one calls for, loading its reference:

| Finding | Command |
|---|---|
| Specificity verdict says another business could use the page unchanged; safe, bland, template-like | `bolder` |
| Flat or wrong type hierarchy, fonts that do not carry the direction | `typeset` |
| Monotonous sections, weak rhythm, crowded or loose spacing | `layout` |
| Colour does no work; the accent is lost | `colorize` |
| Loud, overstimulating, too many effects | `quieter` |
| Too much on the page | `distill` |
| Labels, buttons, errors, empty states | `clarify` |
| Breaks or degrades at some widths | `adapt` |

Make each fix in shared tokens or components, not on the one page. Then run `polish <page source>`: it reads the latest snapshot, clears its P0 and P1 issues and closes it with `critique-storage close`. After a `bolder` or `layout` change, critique the home page again; the trend line shows whether the change helped. Stop when the specificity verdict is specific and no P0 or P1 issue is open, or after two rounds, recording what remains.

## Stage 6: the full route set

- `audit <page source>` once per route family: accessibility, performance, responsive behaviour and theming. It complements `npm run audit:ui`, which does not replace it.
- `harden` on pages with forms, errors, long or translated text.
- After the last UI edits, run the mechanical detector once: `impeccable detect --json --changed`. The per-edit detector hook (`impeccable hooks on`) writes local harness settings; turn it on only when the owner asks.
- A final `critique` of the home page, then `polish` per route family.

## Evidence

The Stage 5 and Stage 6 gates need, for each representative page:

- a snapshot under `.impeccable/critique/` (committed; the project `.gitignore` excludes only `.impeccable/live/` and `.impeccable/config.local.json`);
- its header provenance: two isolated assessments, or the degraded banner with its reason;
- the trend line, and the P0 and P1 issues closed or recorded with a reason.

Detector output alone, a critique that was not persisted, or a run that ended with neither questions nor a `Questions skipped` line does not satisfy either gate. Report the scores and the trend in the stage handoff.

## Day-2 changes

A visible change to a page gets the same steps on that page: `critique` when the change is a new section or a new layout, `polish` for a narrow fix, with craft floor read first. [site-maintenance.md](site-maintenance.md) decides when a change is visible.
