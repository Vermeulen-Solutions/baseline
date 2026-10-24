# Fieldnote Workshops

Context maintainer: site maintainer. Last reviewed: 2026-10-25 against the supplied kickoff brief.
This is the explicitly adopted home for the durable nonvisual brief; working rules remain in [AGENTS.md](AGENTS.md).

## Purpose and audience

Fieldnote Workshops helps people who lead small teams find practical workshops and register by email.
The audience is team leads in small businesses and local nonprofits. The primary journey is Home → Workshops → an email registration link; Contact supports questions and reservations.

## Scope and evidence

This is a new, unlaunched synthetic site replacing starter identity and sample content. The launch inventory and exact supplied copy are recorded once in [the content and route plan](audit/content-route-plan.md). The supplied kickoff request is the content evidence; there is no existing public site, migration source or external reference to reproduce.

The coordinator supplies copy; the site maintainer owns code and local builds. Editing is developer/agent maintenance of typed Markdown files, with one English locale and no browser editor. Publishing requires a rebuild and deployment; there is no requirement for immediate publication.

The user supplied a text wordmark and a calm, warm editorial identity with clear typography and balanced spacing as constraints for the later design stage. No logo, photography, reference design or external font/image service was supplied or requested. Use local/system resources. Detailed art direction is intentionally not selected in this session.

No contact form, payments, third-party tracking, credentials, external messages or production changes are in scope. Do not invent prices, venues, durations, policies or additional service claims. Registration and question email links must use the endpoint in the content plan; no mail is to be sent during development.

## Decisions and open items

| Topic | Decision / rationale | Status and source |
| --- | --- | --- |
| Platform | Retain the installed `static` profile: file-owned content and static output fit the editing and runtime requirements. No CMS, database, React integration or server adapter is needed. | User editing requirement; installed [profile receipt](baseline.config.json) and [Astro config](astro.config.mjs) inspected. |
| Delivery track | Recommend Express independently of the platform: small greenfield scope, one locale, two planned collections and a straightforward email journey. | Working recommendation; not an approval claim. |
| Locale | English only, no language prefix. | User supplied; existing site language is `en`. |
| URL policy | Retain root base, directory output and trailing slashes for local work. Revisit a subpath only if hosting later requires it. | Working assumption using [routing configuration](src/config/routing.ts). |
| Content structure | Page copy plus repeatable workshop records; list-only workshop presentation. | Proposed in [content/route plan](audit/content-route-plan.md); not implemented. |
| Launch | Hosting provider, production origin, deployment date and deployment operator remain undecided. | Explicitly pending external decisions; no blocker to reversible local work. |
| Build metadata | Leave `SITE_URL` unset until a real production origin is chosen; URL-dependent metadata may remain omitted locally. | Existing supported behavior; no invented origin. |
| Operational cost | A future static host and build minutes are the only planned site infrastructure; no provider or price has been chosen. | Planning assumption; no external service provisioned. |
| Repository | No `.git` directory existed at kickoff. Retain generated provenance and the first project lockfile; initialize/commit when a repository is chosen. | Observed local state; no remote created. |

## Source map and ownership

- Supplied words, registration endpoint, proposed schema, route inventory and starter replacement mapping: [audit/content-route-plan.md](audit/content-route-plan.md). Editorial owner: fictional Fieldnote coordinator; implementation owner: site maintainer.
- Current executable identity/navigation: [src/config/site.ts](src/config/site.ts). It still contains starter values; the plan describes future changes.
- Current schema: [src/content.config.ts](src/content.config.ts). It still defines only the sample Posts collection.
- Current routes: [src/pages](src/pages). Planned routes are not yet implemented.
- Installed workflow: [.agents/skills/new-site-workflow/SKILL.md](.agents/skills/new-site-workflow/SKILL.md). Later visual specialists load when their stages begin.
- Current progress, actual setup/check results and remaining acceptance: [HANDOFF.md](HANDOFF.md).

## Future launch preparation

After local completion, choose a static host, production origin, deployment date/operator, source repository and rebuild trigger. Deploy only verified `dist/`, serve missing routes as HTTP 404 using `404.html` without an SPA fallback, configure TLS and `SITE_URL`, and verify rollback and publication from file changes. The maintainer should own source/asset backup and recovery. These are pending decisions and acceptance tasks, not completed hosting configuration or authorization to deploy.
