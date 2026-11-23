# Scorecard

Read when `audit/look/look.md` asks for the page's score, and whenever a page is judged: by the agent that built it, by a fresh reviewer, by the owner. The questions do not change between rounds or sites; a new question would make old scores worth nothing.

The checks (`check:art-direction`, `audit:composition`) say whether a page carries known faults. They do not say whether it is good. Thirteen trial sites that passed every check were scored on these six questions: the lowest question on every one was craft, and no site reached 3 on it.

## How to score

Score from the screens a visitor sees (`npm run design:look`), not from the source and not from what the page was meant to be. Each question gets 0 to 3 and one sentence naming what on the page shows it.

| Score | Meaning |
|---|---|
| 0 | absent, or broken |
| 1 | attempted: the idea is visible, but it is crude, generic or does not hold |
| 2 | what a competent freelance designer would deliver |
| 3 | what a studio would show a new client as a reason to hire it |

Most finished pages are a 2 on most questions. A 3 is rare and has to be earned by something a stranger would point at. When in doubt between two scores, give the lower.

## The six questions

1. **Object.** Does the look come from this client's own thing (its sign, its tool, its room, its printed matter), so that the design could not be moved to another client by changing the words and the photographs?
2. **Feature.** Is there one working feature, built from the client's own data, that answers the question the visitor arrives with (is my village served, what is on this week and what does it cost, what is on the menu today), and is it the best thing on the page?
3. **Phone job.** Can the visitor named in the brief do what they came for on the first phone screen or one scroll below it, without hunting?
4. **Craft.** Type setting, spacing, alignment, photograph handling, contrast. Would a designer find things to fix in the first minute? 3: no. 2: small things. 1: several. 0: broken parts.
5. **Made things.** Are there drawn or built things beyond type and photographs, and is each well made (proportion, line, detail), not clip-art and not a plain shape with a label?
6. **One idea.** Is one idea held from the first screen to the footer and on the phone, or does a strong first screen give way to ordinary sections?

The total is out of 18. A page is at the level to show when it totals 15 with no question under 2.

## After scoring

Name the lowest question and improve the page for it before calling the page finished: that one question is where the page is weakest, and a second point there is worth more than polish anywhere else.

What usually holds each question down on a site built from a recorded world:

- **Object at 2:** the objects are there but the page reads as its palette and typeface first. Make the source object carry the first screen.
- **Feature at 2:** the feature shows information; it does not answer the visitor's question, or it answers it only at the wide width.
- **Phone job at 2:** the action is on the first screen but leads nowhere, or stands under a tall picture.
- **Craft at 2:** a heading tight against the block above it, a label too small, a line lost in a photograph, a card that breaks at 390px, a placeholder left in. Each is one fix.
- **Made things at 2:** the drawings are flat shapes. Give the main one the detail of the picture it was taken from.
- **One idea at 2:** the lower sections are cards on a ground. Rebuild one of them as an object of the same world.
