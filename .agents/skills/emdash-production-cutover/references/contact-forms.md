# Native Astro contact forms on Cloudflare Workers

Read only when a native form is requested or an existing form needs replacement. A domain cutover alone does not authorize removing an integration.

## Preserve the form contract

Inventory fields, locale, consent, attachments, recipient routing, confirmations, CRM/webhooks, and failure behavior. An email endpoint is sufficient only when it preserves required behavior. Derive copy and styling from the site; follow its art-direction gate for new visual implementation.

Use an Astro server endpoint such as `src/pages/api/contact.ts`, with `export const prerender = false` where needed. For Astro 6+ with the current Cloudflare adapter, import `env` from `cloudflare:workers` instead of `locals.runtime.env`. Verify older adapter APIs rather than forcing a migration.

Do not rely on `locals.emdash.email` in a public form. EmDash gives anonymous requests reduced public locals without the email service, so a form that sends only when `locals.emdash?.email` is available stores or accepts the submission and silently sends nothing to visitors; it appears to work only while an editor is signed in. Send through the binding, or use EmDash's service when the request has it and fall back to the binding. The `cloudflareEmail` provider plugin covers CMS mail (sign-in links, invites), not anonymous form routes.

Run `npx wrangler types` after binding changes and include generated declarations in TypeScript. Use the generated binding types; do not declare the virtual module as `Record<string, any>` or cast the binding to `any`. Consult [Astro typing](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#typing) and [Cloudflare's sending API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/).

## Request and validation contract

- Accept only frontend content types, typically URL-encoded/multipart forms and JSON only if needed. Reject unsupported types with `415`.
- Bound the body before parsing. A configurable 32 KiB cap is a starting point for small text-only forms. Check declared length where present, but enforce a byte limit while reading the stream even with absent/misleading `Content-Length`. Reject with `413` and parse bounded bytes, not the original unbounded stream. Attachments need a separate size/storage design.
- Return `400` for malformed JSON/form data, non-object JSON, invalid field types, and unexpected files. Do not coerce `File` to string. Reject ambiguous repeated scalar fields that affect delivery.
- Trim and validate required fields. Enforce server limits matching the form, for example name 120, email 254, phone 50, message 5,000 characters. Determine whether message is required from the site's contract; HTML `maxlength` is only a convenience.
- Reject control characters in email addresses, subjects, and display names. Validate reply-to and recipients independently. From must be the accepted site address; Reply-To can be the validated visitor address.
- Treat a honeypot as one signal. A visually hidden text field can quietly discard filled submissions with the normal success response. Add a server-side rate limit keyed on client IP and form, a server-verified challenge, or both; record the chosen window, count and challenge in the site's form notes, and add the challenge when the form is public and unauthenticated and its submissions reach a person's inbox. Rate limits must work across Worker instances and use trusted client metadata; in-memory counters are insufficient.
- Check browser Origin against the configured site origin when present and decide how origin-less CLI clients are supported. Origin/CORS checks do not stop bots or replace abuse controls.

Apply body limits and abuse controls before CMS queries or sends. Return `429` for throttling with appropriate retry guidance. Never retry an ambiguous provider send failure automatically; it may duplicate an inquiry.

## Trusted configuration and recipient resolution

Inspect the schema rather than inventing `pages/contact.contact_email`. Reuse a trusted setting or server-side recipient. If editors need control, define its field and permissions deliberately and resolve the correct locale or stable identifier.

Inspect both returned `error` and `entry`: EmDash errors are data and need not throw. Validate the address and destination allowlist. Use only a deliberate, validated fallback; distinguish missing optional configuration from query failure and record configuration errors without visitor content. Never accept the destination from submitted fields.

Maintain sender configuration in one place. A dedicated form binding can restrict recipients without restricting CMS authentication emails. Exclude debug CC/BCC options from production templates.

When the site stores submissions, store first and send second, and record the delivery state on the stored record: a send failure must not turn an accepted submission into a retry or a lost message. Hard-coded fallback recipients are a hazard: when mail is enabled later, everything goes to that address. Prefer a server-side runtime variable (Worker `vars`) with no default, where unset means stored only.

## Suspicious submissions: score, flag, hold

A honeypot and a rate limit stop the crude bots, but what gets past them is mixed: a real lead on a work VPN that shows up in another country next to a hand-typed SEO pitch. Do not let one signal block a message. Store every accepted submission first, then score it:

- **Points with reasons.** Each signal adds points and a sentence a person can read ("3 links in the message", "name contains a URL", "sent 2 seconds after the page loaded", "message in a different script from the site's languages"). Keep the weights in one small module with tests, so a change in weighting can be reviewed.
- **Two thresholds.** Below the flag line the message is mailed as normal. From the flag line it is mailed with a marker at the start of the subject (for example `[Check]`) and the reasons at the top of the body, so the owner or a mail filter can sort it. From the hold line it is stored only, with no email.
- **Held is not deleted.** Give the owner a way to list held submissions (a short `wrangler d1 execute` command in the site's notes, or an admin screen) and look at them weekly at first. Never delete held records automatically; a false hold is a lost customer.
- **Calibrate on real data.** Start with conservative thresholds (flag early, hold late) and adjust from the stored spam the site actually receives, recording each change and the examples behind it in the site's form notes.
- **Weak signals stay weak.** Request country (`request.cf.country`) is a hint, not proof; VPNs and travel make it wrong. A page-load timestamp in a hidden field only counts if the server signed it; otherwise a bot can copy it. Free-mail and short names are normal for real people.
- **Privacy.** Store only what scoring and follow-up need, set a retention period for submissions (held ones included), and name the storage in the site's privacy notice. Do not keep IP addresses longer than the rate limit needs them.

Before the production domain's sender is onboarded, mail can leave from a sender subdomain the operator has already verified in the same Cloudflare account, to a recipient the owner names, so forms are testable on the preview hostname without sending to the client's inbox. At cutover, change the sender (binding `allowed_sender_addresses` and the single sender setting) and the recipient in one change, deploy, and send one test per form.

## Email construction

Start with plain text when HTML adds no value. Preserve text instead of deleting angle brackets. If HTML is needed, escape every interpolated value for its context, including quotes in attributes. This helper supports text nodes and quoted attributes; it is not URL validation:

```typescript
const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
```

Typed delivery fragment after validation and trusted configuration resolution:

```typescript
import { env } from "cloudflare:workers";

// sender, recipient, siteName, name, email, and text are validated strings.
const receipt = await env.EMAIL.send({
  from: { email: sender, name: siteName },
  to: [{ email: recipient }],
  replyTo: { email, name },
  subject: `${siteName}: contact inquiry`,
  text,
});
// messageId indicates provider acceptance, not confirmed inbox delivery.
```

Verify structured-builder support against generated types. Await sending before reporting acceptance; do not report success before a background send might fail. Log an operational error code or correlation ID, not bodies, email contents, or secrets. Handle errors as `unknown` and return localized, actionable feedback without provider internals.

## Progressive enhancement

Use a real `<form action="/api/contact" method="post">` with labels, native validation, and a submit button. Adapt language, consent, fields, and styling to the site.

- For clients explicitly requesting `Accept: application/json`, return consistent JSON success/error shapes with meaningful status codes and `Cache-Control: no-store`.
- For ordinary browser submissions, return a `303` redirect to a fixed same-site confirmation URL after acceptance. For validation/provider failure, provide useful escaped HTML or recoverable form state with a route back. Never put visitor fields in query parameters or accept an untrusted redirect target.

JavaScript can request JSON, disable duplicate submission while pending, and announce results through an accessible status element. Reset only after acceptance and retain input on failure. Without JavaScript, the form must remain usable; raw JSON after navigation is not progressive enhancement.

## Acceptance checks

Test meaningful endpoint boundaries using the project's test tooling and a stubbed email binding. Send live test email only to the authorized destination/environment. Make one live submission as an anonymous visitor (no session cookie): a test while signed in can pass on a path visitors never take. Send it from a browser or with an explicit UTF-8 body; a command-line client using the Windows code page stores and mails replacement characters for accented text. Remove the test records afterwards.

| Scenario | Expected result |
| --- | --- |
| Valid form without JavaScript | Confirmation via 303; one accepted email |
| Valid enhanced form | Accessible success state; one accepted email |
| Invalid fields, oversized phone, malformed JSON, file in text field | 400; no send; useful error |
| Oversized body, including absent declared length | 413 before full parsing; no send |
| Unsupported content type | 415; no send |
| Filled honeypot | Quiet success; no CMS query or send |
| Submission between the flag and hold scores | Stored; mailed with the subject marker and its reasons at the top |
| Submission at or above the hold score | Stored as held; no email; listed by the site's held-submissions command |
| Rate limit or failed challenge | Rejected before send; useful feedback |
| Invalid recipient or failed CMS query | Deliberate configured behavior; no accidental recipient |
| Provider failure | Actionable failure; retained input where supported; no automatic resend |
| HTML metacharacters and quoted input | Preserved plain text or correctly escaped HTML |
| Live delivery | Inbox receipt, accepted From, visitor Reply-To; reply reaches visitor |

Check actual inbox delivery as well as HTTP responses. Remove debugging and document unverified delivery or unsupported existing behavior.

## Confirmation and shared-provider events

Use `docs/newsletter-architecture.md` for scanner-safe GET/HEAD landing pages with deliberate POST confirmation, atomic token consumption, session CSRF and no-store responses. Verify provider signatures on raw bounded bytes before exact sending/routing-domain and form/list filtering. The domain may be an approved mail subdomain rather than SITE_URL; never compare newsletter recipient domains to the site host. `src/lib/webhook-domain.ts` handles only domain isolation. Webhooks update existing records only, deduplicate event/submission IDs, and cannot reverse unsubscribe state. Native Forms unsigned at-most-once outgoing events require an authenticated relay or reconciliation before privileged changes. Include scanner GET, replayed POST, cross-site event and duplicate delivery acceptance cases.
