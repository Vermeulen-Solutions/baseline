# A start by one model, the build-out by another

Read this in two cases:

- **The owner asks for the start only**, or says a second agent or another model will build the rest. You are the designer: follow [The start](#the-start).
- **The site has `audit/blueprint.md`** and pages or sections it names are not built yet. You are the builder: follow [The build-out](#the-build-out).

Otherwise this file does not apply: one agent runs the whole track as `SKILL.md` sets out.

## Why the work is split

What decides how good a site looks is settled early: the direction, the design system, the first screen and its one working feature. In Baseline's trials, the same brief was built both ways and marked blind by an owner. Pages whose start was made by the most capable model available, and whose remaining sections and pages were built by a cheaper one, were marked a point or more out of ten above pages the cheaper model designed alone. The cheaper model kept the design it was handed: it did not rewrite the stylesheet or the system's pieces. The start is the smaller part of the work (about half an hour against one to two hours), so the split costs little.

Nothing here depends on a harness or a vendor. The two sessions share a folder and nothing else. The handoff is files: the Art Direction Record in `AGENTS.md`, the system in `src/`, and `audit/blueprint.md`. The owner chooses the model for each session in whatever tool they use; one tool with two models works, and so do two tools. When the owner has one model, use it for both sessions or run the track normally.

## The start

You make everything the rest of the site is cut from, and you write down the rest so that someone who invents nothing can build it.

1. Run Stages 1 to 4.5 of the selected track as their references set out: the brief, the platform, the content and routes with the pages' real words, the judged references, the world, the Art Direction Record, the tokens and the calibrated primitives. Nothing is shortened. `npm run check:art-direction -- --require-record --require-references` passes before step 2.
2. Build the shell (header, navigation, footer) and the **first screen of the home page with its one working feature**, at 390px and then at 1440px, with the client's real words and data. Put every repeated form into the system as a component or a class in the stylesheet, not into the page: the card, the row that carries facts, the small label, each button, the photograph tile, text links. Give each piece its answer to the pointer, to keyboard focus and to a press on the piece itself, so that a section built later from those pieces answers without its builder doing anything.
3. Build **two sections** of the home page under the first screen, each a different form from the other and from the first screen, only from the system's pieces. They are the examples the builder copies from.
4. Run `npm run design:look` on the home page, fill the line of every screen and fix what the lines name. Run `npm run audit:composition` against the served build with the references and clear every floor finding.
5. Write `audit/blueprint.md` with exactly these headings:
   - `## The idea in three lines`: what the site is made of and why it is this client's.
   - `## The system`: each token group and each piece: its component or class name, what it is for, how it answers, and one line of markup showing its use.
   - `## What is fixed`: the shell, the first screen, the feature and the sections you built, one per line with its selector or component. The builder does not change these.
   - `## Home page, section by section`: every remaining section, in order. For each: its form (a row of figures with units, a list whose rows carry facts, a grid of tiles, a rail of steps, quotes, questions and answers, a plate of practical facts, and so on, each different from the one before it), the facts it carries and the data file or collection they come from, the pieces it is built from, and what moves.
   - One `## <Page name>, section by section` per remaining page archetype, its first screen included.
   - `## Rules`: at most six things the builder must not do to this design.
6. Read the blueprint once as the builder will: literally. A line that asks for words on one line at a named size must fit at 390px and at 1440px. No line asks for an empty half or an empty stretch. Where a line asks for a price, a date or a note, it names the field it prints, so that nothing is printed twice on a page. A line never asks for something a Baseline rule forbids.
7. Add one line directly under the Art Direction Record in `AGENTS.md`: `Build-out blueprint: audit/blueprint.md`. Stop every server you started. Report what is built, what the blueprint leaves to the builder, and the checks you ran.

The start ends here. Do not build the remaining sections "while you are there": the owner chose where the split is.

## The build-out

You build what the blueprint lists, from the pieces the designer made. You do not design.

1. Read `AGENTS.md` with its Art Direction Record, then `audit/blueprint.md` twice, then the page as it stands in a browser at 390px and at 1440px. Run `npm run design:look` on the home page before changing anything: an earlier look file may describe an older page.
2. Build the remaining sections of the home page in the blueprint's order, then each remaining page, one section at a time, phone width first. Use the system's pieces as the blueprint's markup lines show. Use the client's real words and data; invent no fact, name, price or quote.
3. Keep to these rules:
   - **What is fixed stays as it is.** Do not restyle, move or rewrite anything under `## What is fixed`. A real fault in a fixed part (unreadable text, a broken control) gets the smallest repair, and the repair is noted.
   - **Do not edit the tokens or the system's stylesheet to make a section work.** When a piece is missing, add a component built from the existing tokens and say so in the handoff. Styles for a new section belong to that section.
   - **A Baseline rule outranks a blueprint line.** When the two conflict (a hover outside `@media (hover: hover)`, a fact printed twice, text that does not fit), follow the rule, build the nearest form that keeps the blueprint's intent, and note the line and what you built instead.
   - **Do not add a section, a page or a decoration the blueprint does not list.** A section the client's material cannot fill is left out and noted, not padded.
4. Run Stages 5 and 6 as their references set out, on the finished pages: the comparison pass with its sheet and five additions per representative page, the look, the Impeccable passes, then the Stage 6 checks. Tell every reviewer, human or agent, what `## What is fixed` lists: a review that asks for a fixed part to be rebuilt is answered with a note, not a rebuild. Additions from the comparison pass go into the sections you built.
5. Hand off with: the sections and pages built, every place you left the blueprint and why, every repair to a fixed part, the checks actually run with their results, and what remains.

When a blueprint line cannot be built at all, or the blueprint is silent on something the page needs, do the plainest thing the system allows and note it. Do not stop to ask the designer: that session is over.
