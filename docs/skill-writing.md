# Writing Baseline skills

For maintainers changing Baseline's own skills (`.agents/skills/`, except the vendored `impeccable` and the EmDash mirrors) and the agent instruction files (`AGENTS.md`, `CLAUDE.md`, `profiles/static/project/AGENTS.md`). `npm run check:skills` checks the wording rules below; the rest is for review.

## Why

An agent settles every choice a skill leaves to its judgment, and it settles it towards the cheaper path. A step written as an offer, or with "when possible" or "if useful", stops happening after a few runs. Trial builds showed both sides:

- Reference research was an offer to the owner. Two trial builds from a plain brief skipped it and designed to the model's own defaults.
- The Standard or Express track is decided by counting routes, collections and locales, and the record fields marked "expected for a new direction" were filled in every trial. A branch on a fact held; a branch on judgment did not.

The same holds for cost. A "light" and a "full" mode becomes a light mode only. Baseline has one path, sized so that it is affordable, and makes it cheaper by design rather than by letting the agent leave things out.

## 1. One path; branch only on a fact

Each step is either required or not there. When a step applies only sometimes, name the fact that decides it, one the agent can check: a count, a file that exists, the profile, a tool that is connected, something the owner said.

| Judgment (the agent picks the cheap side) | Fact (the agent can check it) |
| --- | --- |
| Add an inner page when useful. | Add the works page when the home page shows fewer than three works. |
| Score with two reviewers when possible. | One fresh reviewer scores each round. |
| Preserve progressive enhancement where practical. | Every control works without JavaScript; a control that cannot (a map) says so in text beside it. |
| Research a small sample of competitors when useful. | Research three competitors when the brief names none. |
| Run the check if needed. | Run the check after every change to `src/`. |

Put the decision at the start of the section, as a question with a factual answer ("A new site or an existing one?"), and give each branch its own heading or reference file. Give one default and, when there is a real exception, one named case for it; never a menu of equal options. Whether a tool is connected is a fact, so "when the Refero tool is connected" is a fine trigger; "when available", meaning when the agent feels like looking, is not.

## 2. What must happen is checked

Prose is a request; a check is a rule. When skipping a step would harm the site, the step writes evidence to a file and a script checks it (`check:art-direction`, `check:quality`, `audit:composition`, `check:skills`). A check's failure message says what to do next, in a sentence the agent can act on. Long workflows keep their stages and gates in a table at the top of the skill, so an agent can track them, and the handoff reports each gate's result.

## 3. Say it plainly and give the reason

Write the rule in ordinary case with the reason in a clause: "Keep slugs ASCII: they appear in URLs and redirects" rather than "Slugs MUST be ASCII". Recent models follow instructions closely and over-apply capitalised commands to cases they were never meant for; the reason lets the model judge the edge case the way the rule intends. Leave out what a capable model already knows; keep the selectors, values, recipes and named tools that encode Baseline's intent, since faster and smaller models depend on them ([CONTRIBUTING.md](../CONTRIBUTING.md)).

## 4. Cost is designed, not a mode

- No light and full modes. When a step is expensive, make it smaller for everyone: a fixed number of candidates, pages or rounds, each with its reason written next to it.
- Mechanical work goes in a script. Only the script's output enters the conversation, and the script gives the same result every time.
- Bulky work (captures, scoring, critique, research) runs in a sub-agent that returns a short result (scores, findings, file paths), never the screenshots or pages it looked at. The main conversation is re-read on every model call, so whatever stays in it is paid for again and again.
- A `SKILL.md` stays under 500 lines and routes to references. A reference that sends the agent on to another file names the section to read; deep chains get read partly or not at all.
- The instructions that matter most come first in a skill: long sessions are compacted, and the start of a skill is what survives.

## 5. Test the wording on a run

A structural check does not show what an agent does with the words. A change to the new-site workflow or the design path is tried in a trial build from an average owner's brief before it is released. Read the transcript as well as the site: which files the agent opened, which steps it skipped or shortened, and how many model calls it made. A release that changes the workflow is also tried once on a smaller model than the one it was written with, since that is what many people run it on.

## The check

`npm run check:skills` runs in `npm run lint`, `npm run verify` and CI. It reads every `SKILL.md` and `references/` file of the skills Baseline maintains, and the instruction files above. Code spans and fenced blocks are not read, so a phrase quoted as an example goes in backticks.

| Rule | Reports | Fix |
| --- | --- | --- |
| `judgment-branch` | "when possible", "where practical", "if needed", "as appropriate", "ideally", "optionally", "feel free" and similar | name the fact that decides it, make the step required, or drop it |
| `shouting` | MUST, NEVER, ALWAYS, CRITICAL, IMPORTANT, REQUIRED, DO NOT in capitals | say it plainly and give the reason |
| `skill-length` | a `SKILL.md` over 500 lines | move detail into references |
| `description` | a `SKILL.md` description that is missing, over 1024 characters, or in the first or second person | describe in the third person what the skill does and when to use it |

A line that has to keep a phrase (a quotation, a rule about the phrase itself) carries `<!-- wording-ok: <reason> -->`. Findings older than the check are listed in `audit/skill-wording-debt.json`. An entry matches its line's exact text, so editing that line brings the finding back and the rewrite is due then; a fixed line leaves a stale entry, which the check reports until it is deleted. Never add entries to the list: it only shrinks.

## Sources

Anthropic's [skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) (degrees of freedom, one default with an exception, workflows with checklists and feedback loops, conciseness, testing on several models), its [prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) (give the reason, soften aggressive wording) and the Claude Code [skills documentation](https://code.claude.com/docs/en/skills) (rules that must always hold belong in a check, the start of a skill survives compaction).
