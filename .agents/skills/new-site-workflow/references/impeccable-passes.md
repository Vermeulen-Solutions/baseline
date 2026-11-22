# Impeccable passes

Read at Stage 5 and Stage 6, on a day-2 visible change, or whenever a step says to run an Impeccable critique, audit or polish. Impeccable is driven by commands, each with its own reference, launcher steps and output contract. Loading the skill, reading its guidance or running `impeccable detect` is not a critique, and does not satisfy a gate that asks for one.

## Before the first pass

1. **Put the brief where Impeccable reads it.** `impeccable context` loads `PRODUCT.md`, `DESIGN.md` and surface briefs, and nothing else. A new site writes its brief in `PRODUCT.md` (start from `PRODUCT.example.md`) at Stage 1 and links it from `AGENTS.md`, which keeps the working rules and the Art Direction Record. An existing site whose brief lives in `AGENTS.md` keeps it there; give the critique's design review the brief and the record by path in its prompt instead.
2. **Load context once per session**, from the project root: `.agents/skills/impeccable/scripts/impeccable context --target <page source>` (`impeccable.cmd` on a Windows shell without `sh`). Follow its directives and do not rerun it. `NO_PRODUCT_MD` on an existing site allows scoped refinement of the incumbent design; it does not block the pass.
3. **One direction process.** `site-art-direction` owns Stage 4: candidate ideas, concepts, the Art Direction Record. Do not also run Impeccable's `shape`, `init` interview or new-work world flow on a Baseline site; that opens a second, competing direction. The Art Direction Record plays the part of `DESIGN.md`; a selected `DESIGN.md` supports it.
4. **Read [craft-floor.md](../../impeccable/reference/craft-floor.md) before every UI edit** made from a finding, including small ones. On a Baseline site the recorded `World` (see [world building](../../site-art-direction/references/world-building.md)) is the committed world the craft floor defers to, and it decides seven of the floor's refusals: a label above a heading is allowed when it is the field label of the object the section is (a ticket's `START`, a course code), never as the same generic label over every section; a row of large figures is allowed when the figures are the subject's real data set as one of its objects (a race's distance and climb on its board); a hard offset shadow is allowed on objects that are physical plates, stamps or signs in the world; a textured or ruled ground is allowed when it is one of the world's recorded surfaces; grain from a scanned or drawn material is allowed when the material is in the inventory; the four motion layers of the world (one arrival on the first screen, the named world motions that bring its objects in, one or two ambient loops, feedback) are the site's motion, so `animate` and `quieter` keep them and tune their timing rather than removing them; and the display line the World records may go past the floor's 6rem cap, up to eight times the body size once or twice a page, held inside the viewport with `min(clamp(…), 17vi)` so it still fits at 320px when the text is enlarged. Every other line of the floor applies unchanged.

## Stage 5, first: raise each representative page to its references

This is the design pass, and it comes before the critique: the critique finds what is wrong, this pass finds what is missing. For each representative page (the home page and one page per archetype that has its own template):

1. Serve the build (`npm run preview`, or `npm run serve:static -- --dir dist`; concept HTML with `--dir audit/visual-concepts`) and capture the page at 1440 and 390 wide with `npm run capture:routes -- --base <preview origin> --routes <route> --widths 1440,390 --repeat 1 --out audit/compare/<slug>`. Cap a stage sized in viewport units (`min(100svh, 56rem)`): a full-page capture can measure an uncapped `svh` stage against the page's whole height, and the sheet then shows a stage no visitor sees.
2. Make one sheet per width with the page first and the selected references after it, the made-world site among them: `npm run design:sheet -- --images audit/compare/<slug>/<file>-1440-full.png,audit/references/<id>/<file>-1440-full.png,… --labels "This page,<id>,…" --out audit/compare/<slug>-1440.jpg`. The sheet shows the first 2.5 screens, the first impression; make a second with `--screens 8` (`<slug>-1440-page.jpg`) so the reviewer also sees how the page goes on. `capture:routes` shows scroll-driven objects at their end state and reports an error page as `SKIPPED` instead of capturing it.
3. Measure the page against the same references: `npm run audit:composition -- --base <preview origin> --routes <route> --references audit/references/references.md`. It measures each selected reference's live page the way it measures this one and prints, per measure, this page's count beside the references' median and the studio level (the median of three studio-built home pages): drawn objects, animations running while scrolling, rotated or masked objects, surfaces, colours, type sizes and elements; an arrow marks each measure where this page has under half of the higher of the two, so quiet references do not lower the level. A trial home page that passed every other check had 2 drawn objects, 19 running animations and 191 elements against its studio references' 10, 136 and 654. The counts say where the references have more made things, never what to make: an arrow is answered by an object, a layer or a motion from the world, not by decoration that moves a number.
4. Give one fresh sub-agent only the two sheets, the measures, the one-line brief and the record's `World`, and ask: "Name the five biggest things the references do that this page does not, in what a visitor sees first: composition and scale, depth and layering, drawn objects and illustration, colour, type, photographs, motion. Write each as an addition this page could build from its own world, not as a copy of the reference, and rank them by how much they would change the first impression. Do not ask for facts the owner has not given (sizes, species, dates, places): build with what the brief holds. Judge each drawing at full size as a drawing: name any that reads as clip-art, and do not ask for more drawings as an addition on its own." On an existing site, give the reviewer the site's Site Anti-Patterns and recorded owner rules too: what the owner banned is not an addition. The sheets show the page at about half scale: give the reviewer the body and heading sizes from the measures so it does not report 17px text as 9px. In round 2, give the reviewer round 1's additions as built: it keeps them unless they are defects and names what is still missing, so a second reviewer does not undo the first. When the concept bar is still open (the built page is still being scored), ask the same reviewer for the card score too. With several pages, give one reviewer every page's sheets and measures in one prompt and ask for five per page: it costs one review instead of one per page. Without sub-agents, answer it yourself from the sheets and say so.
5. Build the five, from the recorded `World`, in shared components where they repeat; together they answer the arrowed measures. Write each addition's rules beside its component's existing rules, the phone rule after the wide one, not appended to the end of the stylesheet: a trial that appended each round's desktop rules after the earlier phone rules broke its phone layout twice. Then record them in `audit/references/references.md`, every round in the one table:

   ```markdown
   ### Built against the references
   | page | round | sheet | the references do | we built |
   |---|---|---|---|---|
   | / | 1 | audit/compare/home-1440.jpg | the race's course poster fills the first screen as one drawn object | the first screen as the log's end, drawn at full width, with the work inside its rings |
   ```

6. Before capturing, fix the visible defects (objects that collide, text over a busy picture, cramped type, a phone layout wider than the screen: `capture:routes` prints `OVERFLOW-X` at 390, read it): reviewers score defects before additions, and one trial's home page held at the same score for three rounds of additions until its defects were fixed. Then serve the build and run `npm run check:quality -- --base <origin> --routes <the compared pages> --only first-viewport-hidden,first-viewport-scroll-motion`, and fix what it reports before the page is called finished: a first screen that opens hidden, or with a scroll-driven entrance caught part-way, is what every visitor sees first, and the captures (reduced motion, each animation at its end) never show it. Three of seven design sprints finished with that fault, because the full quality check runs only at Stage 6. Then capture and measure again, and run a second round when the first changed the page's composition (a new first screen, a new section object, a change of scale), at most two rounds; the second round builds the three biggest additions. A last score-only review of the finished pages is not a round. `npm run check:art-direction -- --require-comparison` checks the table: every compared page has a sheet and at least five additions in round 1.

## Stage 5, then: critique each representative page for its craft

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
| Loud, overstimulating, effects that belong to no object of the world | `quieter`, on those effects only |
| Too much on the page | `distill`, keeping each section's object |
| Bare: sections that are only headings, paragraphs and photographs; no surface, object or motion from the world | build the missing objects from the recorded `World`, then `bolder` |
| Labels, buttons, errors, empty states | `clarify` |
| Breaks or degrades at some widths | `adapt` |

Make each fix in shared tokens or components, not on the one page. Then run `polish <page source>`: it reads the latest snapshot, clears its P0 and P1 issues and closes it with `critique-storage close`. Critique a page a second time only when the first round leaves a P0 or P1 issue open, and record what remains after it.

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
