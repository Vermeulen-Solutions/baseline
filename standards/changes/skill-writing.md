---
bump: none
---

# How Baseline skills are written, and a check for their wording

An agent settles every choice a skill leaves to its judgment towards the cheaper path, so a step written as an offer or with "when possible" stops happening after a few runs; trial builds skipped reference research while it was offered, and followed every rule that hung on a countable fact.

- `docs/skill-writing.md` sets out how Baseline's own skills and agent instructions are written: one path, with branches only on a fact the agent can check; what must happen is checked by a script; rules in plain case with their reason; cost reduced by design (fixed counts, scripts, sub-agents that return a short result) rather than by a light mode; changes to the workflow tried in a trial build, and once on a smaller model before a release. CONTRIBUTING routes skill changes to it.
- `npm run check:skills` (in `lint`, `verify` and the fast CI run) reports branches left to the agent's judgment, capitalised commands, a `SKILL.md` over 500 lines and a missing or first-person description. The 52 findings that predate it are recorded in `audit/skill-wording-debt.json`; editing such a line brings its finding back, and the list only shrinks.

Sites are not affected: the check reads only the skills Baseline maintains, before they are distributed.
