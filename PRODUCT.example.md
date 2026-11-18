# Product

<!-- impeccable:product-schema 1 -->

<!--
Optional template for the site's one product brief. Copy it to PRODUCT.md when a site benefits
from a durable brief; a small site can keep its facts in AGENTS.md instead. The `impeccable` skill
reads and updates this same file (its `init` writes it in this schema), so there is never a second
brief beside it. Keep existing facts in their current home until deliberately moving them here.
Replace placeholders with known facts and omit irrelevant sections; a missing answer is unresolved,
not a reason to stop work that is already authorized. Delete this comment when adopting the file.

What lives elsewhere: working rules and the compact Art Direction Record in AGENTS.md; visual
language and references in the selected DESIGN.md; shipped values in source (src/styles/global.css);
page briefs in the page notes or route inventory (see the discovery reference of new-site-workflow);
progress in the task tracker or a short HANDOFF.md; credentials in secret storage.
-->

Context maintainer: [role responsible for keeping this brief current]
Last reviewed: [date and source/review reference]

## Platform

web

## Users

[Who the site serves and the situation that brings them. Add other audiences only when confirmed.]

- Priority visitor and situation: [who needs this most, what brings them here, what they already know]
- Secondary audiences: [only when confirmed, and how they differ]
- Audience language: [sourced words or paraphrases; distinguish real quotations from draft wording]

## Product Purpose

[What the site is for and what a useful outcome is.]

- Primary outcome and next action: [what visitors should accomplish and what happens after they act]
- Success evidence: [observable result, known baseline or unknown, review period and owner; no assumed tracking]

## Positioning

[The claim a neighbouring business could not truthfully copy.]

- Priority offer or service: [what is provided, model or price where relevant, scope and exclusions]
- Audience fit: [useful enquiries and unsuitable cases, where relevant]
- Alternatives and defensible difference: [including self-service or doing nothing; source versus inference]
- Recommended lead message: [the promise or answer that fits this audience, labelled recommended, assumed or approved]
- Important questions or objections: [what visitors must know before acting]

## Operating Context

[How the site is used, edited and kept up.]

| Material or workflow | Authoritative source | Content/editorial owner | Maintenance owner |
| --- | --- | --- | --- |
| [content, form or integration] | [source or linked inventory] | [role] | [role] |

- Owner's other sites (optional): [URLs, so a new direction can be checked against them for borrowed motifs]

## Capabilities and Constraints

- Included: [essential journeys, content, languages and integrations]
- Deferred or excluded: [deliberate boundaries and rationale]
- Material constraints: [existing commitments, supplied assets, timing or budget]

## Brand Commitments

[Name, voice, assets and identity constraints the owner made binding. Omit when none exist.]

- Voice: [tone, who speaks (I or we, formal or informal address), audience vocabulary]
- Words, claims and imagery to avoid: [list; wording a machine can check also goes in page-budget.json `copy` rules]

## Evidence on Hand

[Real content, testimonials, case studies, data and assets, with paths. State absences future work must not fabricate.]

| Claim or material | Source | Permitted use / verification status | Owner | Intended placement or gap action |
| --- | --- | --- | --- | --- |
| [claim, sample or result] | [source/date] | [approved use / draft / restricted / unknown] | [role] | [page/section or task] |

## Facts

[Only what the owner supplied: address, opening hours, phone, prices, people, services. Never inferred; a fact
nobody gave stays missing and becomes a placeholder.]

## Placeholders

[Every `[[placeholder: …]]` marker and empty photo slot still on the site, by page. Remove a line when it is
filled. `npm run check:quality` reports any marker still visible.]

## Assumptions

[Decisions made without asking (an unattended run, "just do it"), one line each, for the owner to confirm or
reverse. Move a confirmed one to Decisions and open questions.]

## Product Principles

[Three to five durable strategic principles derived from confirmed answers; no visual recipes.]

## Accessibility & Inclusion

[Required standard (WCAG 2.2 AA by default) and known visitor needs.]

## Decisions and open questions

| Topic | Decision or question | Status | Evidence / owner |
| --- | --- | --- | --- |
| [topic] | [choice, rationale or missing answer] | [approved / assumed / unresolved] | [source, date, decision owner] |

Use approved only for an actual owner decision with supporting evidence; keep an assumption labelled until
resolved. A recorded decision or a passing check does not grant permission to deploy, publish, transfer
content or act externally.

## Source map

Link the actual sources rather than copying their values:

- Installed profile/runtime and configuration: [paths]
- Content model, routes, navigation and locale rules: [paths or focused inventory]
- Page briefs and status: [page notes or route inventory; one line per page: page → sections → planned, built or needs content]
- Visual direction: `AGENTS.md` → Art Direction Record; [selected `DESIGN.md`, if used]
- Shipped design values and calibration: `src/styles/global.css`; [calibration evidence]
- Other evidence and durable decisions: [paths]
