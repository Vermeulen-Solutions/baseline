# Scanner-safe consent and isolated email events

EmDash core sends authentication email; it has no built-in subscriber list. The optional forms plugin is not a newsletter system. Preserve a site's existing provider and consent workflow until a separately scoped migration is verified. These are implementation and acceptance contracts for sites that need subscriptions or provider webhooks.

## Confirmation is a deliberate POST

Create a pending subscriber only through the site's validated signup flow. Store status, signup source, consent wording/version and timestamps. Generate an unpredictable expiring token bound to that subscriber/email; store its hash. Email a link to a landing page with an ordinary `method="post"` confirmation button. **GET and HEAD only render**; no consume, subscribe, welcome email, redirect-triggered mutation or automatic JavaScript submit. Security scanners can prefetch links, follow redirects and run scripts.

Use `Cache-Control: private, no-store` on confirmation HTML and responses, `Referrer-Policy: no-referrer`, no third-party resources, and redact tokens/query strings from logs and analytics. POST must validate expiry, subscriber binding and pending status, then atomically change pending → confirmed and consume the token once. Commit consent before enqueueing the idempotent welcome/provider sync; a retry must not send twice. Return a fixed same-site 303 success location. Token rotation invalidates older confirmations; expired/replayed tokens have a useful safe result. Unsubscribe must suppress future sends immediately; provider sync failure cannot restore consent.

Keep Astro `security.checkOrigin` enabled for SSR. In Astro 7.4 it checks browser request metadata for unsafe requests with form-compatible or absent content types; it is not a universal JSON webhook or CSRF validator. For custom session-mutating handlers outside Astro Actions, validate the configured Origin **and** a session-bound CSRF token before querying or sending. Confirmation POSTs should use a short-lived session/form nonce alongside the emailed token. Missing/cross-origin tokens return 403. Use persistent shared sessions on Workers, not isolate memory. Apply bounded body parsing, rate limiting and server-verified abuse controls before expensive work. See [Astro's security contract](https://docs.astro.build/en/reference/configuration-reference/#security).

## Webhook authentication and domain isolation

Verify a provider's signature over the **raw bounded bytes**, timestamp/replay window and configured webhook secret before trusting any payload fields. Provider-to-server requests have no browser Origin/CSRF token; authenticate them with that contract instead. Domain filtering alone is not authentication.

Validate the event schema and extract its documented sending domain, verified From domain, or a site-owned recipient routing domain for inbound workflows. Do not compare a newsletter subscriber's recipient domain to `SITE_URL`: recipients belong to other domains. Configure an exact allowlist of the site's approved sending/routing domains, including deliberate mail subdomains. They can differ from the canonical host; never accept every event just because it arrived at that host. The tested `isWebhookDomainAllowed` helper rejects absent/malformed domains, suffix lookalikes and unlisted subdomains. It expects a domain extracted by a provider-specific validated adapter; it does not verify signatures or parse display-name email addresses.

After authentication, filter domain, event type, form/list identifier and known subscriber/submission. Events from another site or unknown subscribers are ignored without writing records. Webhooks may **update existing subscribers only**, never create or re-subscribe them. Apply unsubscribe/bounce suppression according to a documented monotonic ordering policy so delayed delivery events cannot undo an unsubscribe. Persist provider event IDs with a unique constraint and apply the update in the same transaction. Expect retries/duplicates/out-of-order events from providers; logical processing must be idempotent.

Native Forms 0.2.10 outgoing notifications/webhooks have a different boundary: the field review describes unsigned, at-most-once delivery. Do not assume provider-style signatures or retries there. Inventory the installed package's actual payload and transport. An unsigned event must not drive privileged consent changes; add an authenticated relay/pull reconciliation or keep it advisory. Validate the form ID, deduplicate submission IDs, and reconcile stored submissions through scheduled CSV/JSON exports with restricted access and a deliberate retention period. Do not automatically retry ambiguous sends; a timeout may follow provider acceptance. HTTP success is not inbox delivery.

## Required site acceptance

| Scenario | Required observation |
| --- | --- |
| Scanner GET/HEAD, followed redirects, JS enabled | Pending remains pending; token remains usable; no welcome/send |
| Valid POST from confirmation page | One atomic confirmation and consent timestamp; one queued send |
| Expired, mismatched, replayed or concurrent token POST | No second activation or duplicate welcome |
| Missing CSRF token or cross-origin browser POST | 403 before CMS query/send |
| Valid provider signature, other sending domain/form/list | Ignored; no subscriber or submission mutation |
| Invalid/missing signature or stale event timestamp | Rejected before domain handling or CMS writes |
| Duplicate/out-of-order events; unknown subscriber | Idempotent existing-record updates; no creation/re-subscription |
| Provider outage/ambiguous delivery | Stored consent/submission preserved; alert/reconcile without blind resend |
| Unsubscribe through provider or site | Both sides suppress subsequent mail; stale sync cannot reverse it |

These are acceptance requirements, not claims that the starter runs a newsletter service. Verify them against the adopted provider and production settings, including encryption-key availability, sender identity, domain allowlist and retention/housekeeping schedule. Keep an administrator's independent recovery method working when the email transport fails.
