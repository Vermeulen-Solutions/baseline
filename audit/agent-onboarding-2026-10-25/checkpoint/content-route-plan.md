# Fieldnote content and route plan

Planning record, 2026-10-25. Source: supplied kickoff brief. Owner of supplied words: fictional Fieldnote coordinator. Code, file edits and builds: site maintainer. This plan has not changed executable schemas, content or templates.

## Supplied content

Preserve the following facts and wording verbatim when implementing:

| Placement | Field | Supplied value |
| --- | --- | --- |
| Home | Heading | Practical workshops for clearer teamwork. |
| Home | Introduction | Short, hands-on sessions for people who lead small teams. |
| Workshops | Heading | Upcoming workshops |
| Workshop 1 | Title | Clear project briefs |
| Workshop 1 | Date | 2026-11-12 |
| Workshop 1 | Summary | Leave with a clear brief and manageable next steps. |
| Workshop 2 | Title | Better team check-ins |
| Workshop 2 | Date | 2026-11-26 |
| Workshop 2 | Summary | Make space for useful updates, questions and decisions. |
| Contact | Heading | Find the right workshop |
| Contact | Introduction | Email us to ask a question or reserve a place. |

Registration and question endpoint: `workshops@fieldnote.example.test`.
Use `mailto:workshops@fieldnote.example.test` for registration and questions; the address is supplied synthetic test data. A working email client and delivery are not proven by a local website check. Do not create a real mailbox or send a test message.

No price, venue, duration, capacity, policy, extra claim or imagery is available. Omit those fields and claims. Link labels such as “View workshops”, “Register by email” and “Email us” are proposed interface copy, not supplied editorial wording. Do not imply that clicking an email link confirms a reservation.

## Target route inventory

Navigation order: Home, Workshops, Contact. Single English locale, unprefixed root routes, current trailing-slash policy retained as a working assumption.

| Public route | Archetype and task | Proposed source and template | Status |
| --- | --- | --- | --- |
| `/` | Introductory page; find the workshop list | `src/content/pages/home.md` → `src/pages/index.astro` | Existing template is starter; replace later. |
| `/workshops/` | Workshop list; compare supplied dates/summaries and register by email | `src/content/pages/workshops.md` plus workshop collection → `src/pages/workshops/index.astro` | New, planned only. |
| `/contact/` | Short contact page; ask a question or reserve a place by email | `src/content/pages/contact.md` → `src/pages/contact/index.astro` | New, planned only. |
| Missing paths | Shared 404 utility; return to valid navigation | Existing `src/pages/404.astro` | Keep utility, replace starter identity later; host status must be checked at launch. |

Individual workshop detail pages, blog routes, language variants and browser editor routes are excluded. No workshop `getStaticPaths()` detail generator is needed. No public JavaScript is currently required for these journeys.

These are short single-measure pages/list content. Plan ordinary Section/Container composition rather than an editorial breakout layout; exact presentation awaits art direction and calibration. Use native Markdown `render()` inside RichText for any authored body copy. Workshop rows/cards should remain structured records rather than copied markup. Metadata should reuse supplied text where suitable and must not fabricate publication dates, authors, venue details or event structured-data claims.

## Proposed native content model

Implement later in `src/content.config.ts` using native Astro Content Collections, `glob` loaders and typed Zod validation. All field names below are planning choices, not existing APIs or deployed schema.

| Collection / field | Required semantics | Placement |
| --- | --- | --- |
| `pages` / file ID | Fixed `home`, `workshops`, `contact`; explicit route mapping avoids accidental extra pages | Three routes above. |
| `pages.heading` | Nonempty string; use supplied heading exactly | One h1 per route. |
| `pages.introduction` | Optional nonempty string; supplied for Home and Contact only | Intro text; do not invent a Workshops introduction. |
| `pages.draft` | Boolean, default false; draft pages must not render or appear in navigation; required launch pages must exist and be published | Maintenance safety. |
| Markdown body | Optional; currently no extra body copy supplied | Render through RichText only if present. |
| `workshops` / file ID | Stable descriptive key, e.g. `clear-project-briefs` and `better-team-check-ins` | Internal identity, no detail URL. |
| `workshops.title` | Nonempty string; supplied workshop title | List item heading. |
| `workshops.date` | Valid ISO calendar date `YYYY-MM-DD`; preserve date-only semantics, avoiding timezone day shifts | Native time element with machine-readable date; English display. |
| `workshops.summary` | Nonempty string; supplied sentence exactly | List summary. |
| `workshops.draft` | Boolean, default false; drafts excluded from listing | Maintenance safety. |

Workshop files will live in `src/content/workshops/`. Both workshop records are repeatable independent content; no taxonomy or relational layer is justified. Registration email is a shared site setting in `src/config/site.ts`, not duplicated per workshop. Keep site identity, language and navigation file-owned there. Page and workshop words remain in typed Markdown.

List non-draft workshops in ascending date order, with a stable ID tie-breaker (working recommendation). Do not auto-hide records by today's date: the maintainer owns updates and these supplied dates must stay visible for review. If an empty list needs copy later, treat the wording as a local interface draft requiring review; do not invent new service availability. Validate actual Markdown and build output after model implementation.

## Starter replacement map

Current inspected state: `src/content.config.ts` defines Posts; `src/content/posts/welcome.md` is sample content; `src/config/site.ts` has “My Site” and Home/Posts navigation; `src/pages/posts/index.astro` and `src/pages/posts/[...id].astro` expose sample blog routes.

After the design gate, replace the home and site identity, add the planned content/routes, remove sample Posts content/routes and any unused post helpers after checking references. No 301s are needed for this unlaunched synthetic starter; retain the 404 utility. Remove sample photography from client output; shared synthetic styleguide fixtures may remain if required by the foundation and isolated from production. Do not remove fixtures blindly or add CMS tooling. Check the generated output contains only intended launch routes plus necessary static assets/404, and no welcome post or starter identity.

## Acceptance for implementation

- Validate all five planned Markdown records against real schemas and preserve exact supplied copy/date values.
- All three navigation entries resolve; only the planned public route set is published; draft filtering works.
- Email links use the supplied address and descriptive labels; no forms, payments, tracking or external asset services are introduced.
- Review date display for timezone stability, heading hierarchy, keyboard focus, accessible link names and narrow/intermediate/wide reflow.
- Verify final metadata, real 404 behavior and production exclusion of `/_styleguide/`; resolve hosting-specific behavior only once a host is chosen.
