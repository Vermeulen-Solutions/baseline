# New-site workflow persona pass

This is a reasoned walkthrough of the checked-in workflow, not interviews or a
claim of usability testing. It follows the layout spacing implementation and
the user's request to reconsider setup questions and Express defaults.

## Representative setup journeys

| Persona and scenario | Decisions they can usefully make | Friction or missing decision | Workflow response |
| --- | --- | --- | --- |
| Business owner; small new service site; agent maintains it | Visitor, desired enquiry/booking action, offer, identity, content owner, timing and recurring cost constraints | Aesthetic-lane labels and CSS policy choices are hard to interpret; CMS/hosting choices arrive before editing needs | Ask about outcomes and who edits. Recommend a profile and visual direction with a plain-language explanation. Default shared spacing; calibrate density from the brief. |
| Designer/brand lead; supplied designs or an existing identity | Which brand assets are authoritative, what must match, where interpretation is allowed, desired density | “Automatic” sounds like surrendering control; a reference URL is not permission to reuse assets or invent missing pages | Explain shared defaults and local controls. Ask preserve/refine/overhaul only when unresolved; record layout exceptions and asset sources. |
| Content editor; growing posts/services; browser publishing | What they edit, review/publish roles, acceptable build delay, relationships, locales, recurring content | A simple route count hides an ongoing editorial workflow; “CMS” does not explain Git permissions or publishing latency | Ask editing personas and publication needs before selecting profile. Explain Git/rebuild versus live publishing; increase scope when roles, relationships or locales warrant it. |
| Developer/agency maintainer; agent-first operation | Existing stack/repository, deployment constraints, integrations, owners, handover and maintenance limits | Repeated “ready to build?” prompts interrupt authorized work; architecture and vendor names leak into client choices | Reuse evidence and authorization, report stage outcomes, ask only missing decisions. Keep code/CLI defaults explicit in the site record. |
| Owner migrating an existing site | Content authority, URLs to preserve, integrations, definition of success | “Launch” can conflate code deployment, content transfer and DNS; visual references can obscure redirects/forms/content | Use Standard for substantive migration. Inventory URLs and content, preserve redirects, classify forms and keep deployment/content/DNS steps separate. |

## Findings and resolutions

| ID | Finding | Change |
| --- | --- | --- |
| WFP01 | Express still presents engineering choices as user preferences | Use shared layout spacing by default. Explain the benefit and ask about feel/density only when the brief does not establish it. Specific compositions can use custom spacing. |
| WFP02 | Broad discovery bullets lack a short, prioritized question set | Add the three discovery groups below; ask only unresolved items, in small bundles. |
| WFP03 | Site purpose is insufficient without a visitor task | Capture the primary action and essential journey, with its success criteria, before page assembly. |
| WFP04 | Content can be treated as implicitly ready | Identify real/draft/missing content, asset rights/source, who supplies it, and what is a local placeholder. Never publish filler or infer approved policy copy. |
| WFP05 | Profile labels obscure editing ownership and publishing cost | Start with who edits and how quickly it must publish. Recommend the smallest fitting profile; do not select a browser CMS merely because one exists. |
| WFP06 | Simple-looking sites can conceal structural complexity | Evaluate archetypes, repeated content, roles, locales, integration/auth/payment behavior and migration risk as well as route count. Switch track with reasons when needed. |
| WFP07 | Forms and measurement choices can emerge too late | Ask about data destination, owner and needed integrations when the primary journey requires them. Default no third-party tracking. Credentials belong in supported secret storage. |
| WFP08 | Repeated continuation prompts imply permission is needed for authorized work | Make handoffs concise reports; ask only missing decisions or actual external-action approvals. Express has up to three consolidated checkpoints, not three mandatory stops. |
| WFP09 | Defaults can be mistaken for approved decisions | Record approved versus assumed defaults, density and exceptions. Summarize material defaults at the relevant checkpoint; allow correction without replaying discovery. |
| WFP10 | Stock completion copy overstates accessibility and test coverage | Report checks actually run and their limits. Do not claim all controls accessible, exact contrast counts, real editor acceptance, or launch readiness without evidence. |
| WFP11 | Maintenance responsibility is not explicit early enough | Capture the day-2 owner and editing method during discovery; confirm handover, deployment owner and backup needs before launch. |

## Minimum discovery questions

These are question groups for the agent to adapt, not a survey to paste in full.
Use supplied documents, existing decisions and repository evidence first.

1. **Purpose and visitor:** Who is this for, what should visitors do, and what
   must that journey accomplish? Which pages or content are essential?
2. **Content and identity:** Is this new work or a migration? Which content,
   logo, imagery and brand/source references are authoritative? What is missing,
   who supplies it, and which languages must launch?
3. **Operation and constraints:** Who edits and maintains the site, and do they
   need a browser interface or immediate publishing? Are there required forms,
   bookings, services, hosting constraints, cost limits or a target date?

Ask conditional details only when relevant: preserve/refine/overhaul for a
rebuild; sender/destination/recovery and data handling for forms; domains and
redirects for migration; roles/workflow for editors; locales and translation
ownership for multilingual content; measurement needs before analytics; existing
SEO/search/social requirements; approved privacy/legal copy where needed. Ask
for a constraint rather than an implementation choice the agent can infer.

## Express defaults

| Area | Default | Ask/change when |
| --- | --- | --- |
| Delivery | Up to three consolidated decision checkpoints, continue authorized work | A missing decision materially changes architecture, content or external action |
| Platform | Recommend static for file/agent-owned content; record the choice | Nontechnical browser editing, publication latency, relationships or live canvas require another profile |
| Language | Use the brief/content language as a labeled assumption | Ambiguous language or additional locale requirements must be settled before URL/schema commitments |
| Design | One brief-led recommended direction, preserving supplied identity | No evidence supports it, the user wants alternatives, or source weaknesses require concept exploration |
| Layout spacing | Shared responsive defaults; balanced density if the brief provides no density cue | A brand/reference requires compact/spacious pacing or explicit composition exceptions |
| Components | Shared native primitives and editorial flow; local exceptions through tokens/props | An actual content/interaction requirement needs another pattern |
| Browser code | Native/progressively enhanced behavior, add JavaScript for a real task | Search, editing or another required interaction needs it |
| Tracking | No third-party analytics/marketing scripts | A stated measurement need and selected provider/data requirements exist |
| Content | Real supplied content; clearly marked drafts in local work only | Missing content needs an owner/decision before publishing |
| Quality | Existing gates, keyboard/responsive review and honest evidence | User-requested manual acceptance is deferred and recorded, not claimed complete |
| Release | Local verified build until deployment is authorized | Deployment/domain/content-transfer work is requested and its prerequisites are ready |

## Walkthrough outcomes

- An agent-maintained five-page service site gets a short brief, recommended
  static profile, a recommended direction with shared spacing, and representative
  implementation. No separate CSS, CMS, framework or tracking questionnaire.
- A designer's strict landing-page layout retains shared tokens, records the
  measured exceptions and uses explicit component controls. Custom spacing does
  not silently activate legacy policy.
- An editor's ostensibly small multilingual publication moves to Standard when
  translation, roles or schema complexity warrants it. Express is not a waiver
  for content architecture or editorial acceptance.
- A migration cannot pass as a new brochure site merely because only five route
  templates are visible. URL/content inventories and transfer decisions remain
  necessary.

Validation is a source walkthrough across Standard, Express and both generated
static profiles' shared skill inventory. Future real-user testing may revise
these defaults; no interviews, deployed onboarding or client adoption is claimed.
