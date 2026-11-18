# Trust pages and measurement: privacy notice, accessibility statement, analytics, AI crawlers

Read this before launch, and whenever a client asks for analytics, session recordings, a cookie banner or an AI-crawler decision. It gives structures and the decisions to put to the owner. It is not legal advice: the client's own adviser decides what their notice must say, and Swiss, EU and other rules differ.

## Analytics: choose the tier, then build what it needs

Measurement is normal and clients need it. What changes between tools is whether the tool stores an identifier on the visitor's device or builds a profile of a person, because that decides whether the visitor must agree first and what the privacy notice says.

| Tier | Examples | What it records | What it needs |
| --- | --- | --- | --- |
| 1. Aggregate, cookie-free | Cloudflare Web Analytics, Plausible, Fathom | Page views, referrers, countries, Web Vitals; nothing stored on the device, no profile of a person | A line in the privacy notice. No banner. **The default.** |
| 2. Tag-based marketing analytics | Google Analytics 4, Google Ads conversions, Meta pixel | Cookies or device identifiers, often shared with the provider | For EU visitors, consent before the tag loads (a banner where refusing is as easy as accepting, Google Consent Mode set to denied by default). Switzerland's nFADP has no general opt-in rule for cookies but requires a clear notice and a way to object; the GDPR still applies when a Swiss site targets EU visitors. |
| 3. Session recordings and heatmaps | Microsoft Clarity, Hotjar | Mouse movement, clicks, scrolls and what the page showed, per visit | Consent as in tier 2, input masking switched on, recordings kept for a short, stated period, and the provider named in the notice. |
| 4. First-party visitor trails linked to leads | A first-party id that records which pages a person viewed and attaches them to their enquiry | A profile of an identifiable person | Consent (or a clear choice on the contact form: "Keep the pages I viewed with my message"), a retention period, and a way to answer access and deletion requests. Build it only when the owner will use it. |

Whatever the tier:

- **Load tags only on the production hostname**, never on previews, staging or in CI: test traffic pollutes the numbers and test builds should not call third parties. Read the measurement ids from build environment variables and render nothing when they are unset.
- **Load marketing tags after the page is idle** so they do not delay the first screen.
- **List their origins in the Content-Security-Policy** (`CSP_SOURCES`), for example `script-src https://static.cloudflareinsights.com; connect-src https://cloudflareinsights.com`.
- **Name every provider in the privacy notice**, with what it records and for how long.

**In Baseline:** `src/components/Analytics.astro` and `ConsentBanner.astro` are already in both Base layouts and render nothing until an id is set in the build environment: `PUBLIC_CF_BEACON_TOKEN` (tier 1), `PUBLIC_GA_ID` or `PUBLIC_GTM_ID` (tiers 2 and 3, under Google Consent Mode v2, denied by default; `PUBLIC_CONSENT_MODE=strict` loads nothing before consent), with `PUBLIC_ANALYTICS_HOSTS` listing the production hostnames. Give the banner the site's language through its props, add a `data-consent-open` "Cookie settings" link to the footer, bump `PUBLIC_CONSENT_VERSION` when the categories change, and add the origins to `CSP_SOURCES` (see `.env.example`). `data-track="event_name"` (plus `data-track-*` parameters) sends click events. For maps and videos use `MapEmbed.astro` and `VideoEmbed.astro`, which contact the provider only when the visitor clicks.

Recommend tier 1 by default. Add tier 2 or 3 when the owner has a concrete use (ad conversion tracking, a usability problem to watch) and accepts the banner that comes with it.

## Privacy notice: structure

Organise it by what happens to data, in plain words, one section per flow. Swiss sites need one under the nFADP; EU visitors bring the GDPR.

1. **Who is responsible**: the business's name, address and a contact for privacy questions.
2. **Contact form**: the fields, where submissions are stored (provider and region), who receives them, how long they are kept (held spam included), and that nothing is sold.
3. **Analytics and recordings**: the tier and provider, what is recorded, whether anything is stored on the device, retention, and how to refuse or object.
4. **Embedded content**: maps, videos, booking widgets and fonts loaded from other services; prefer loading them on click.
5. **Server and security logs**: the host and CDN (for example Cloudflare) keep IP addresses and request details for security for a short period.
6. **Cookies and device storage**: a list of what is stored and why, including preferences kept only on the device (theme, dismissed notices).
7. **Transfers abroad**: providers outside Switzerland or the EU, and the framework that covers them.
8. **Your rights**: access, correction, deletion, objection, and how to ask.
9. **Changes**: the date of the current version.

## Accessibility statement: structure

1. **The standard**: WCAG 2.2 AA (say so plainly; AAA is not the target).
2. **In practice**: what the site does, in visitor terms (keyboard access, visible focus, text that enlarges, no motion that cannot be stopped, captions or transcripts).
3. **How it is checked**: automated checks on every route (`check:quality`, `audit:ui`), keyboard and screen-reader passes, and when the last review happened.
4. **Where it stops short**: known gaps, honestly, with what is planned and when.
5. **Report a problem**: an email or form, and how soon the owner replies.

The European Accessibility Act (in force since June 2025) covers some services sold to EU consumers, such as online shops and bookings; check whether a client falls under it.

## AI crawlers: a decision per client

Crawlers fall into two groups, and owners often want different answers for each:

- **Search and answer crawlers** fetch pages to cite them when someone asks a question: `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`. Blocking them makes the business invisible in AI answers.
- **Training crawlers** collect text to train models: `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`. Blocking them has no effect on search ranking.

Record the owner's choice in the site notes and express it in `robots.txt` with one group per crawler. Check Cloudflare's own AI bot settings (AI Crawl Control, managed `robots.txt`, "block AI bots"): they can block or rewrite at the edge whatever the site's file says, so the two must agree. `/llms.txt` gives answer engines a plain summary of the site whichever choice is made.
