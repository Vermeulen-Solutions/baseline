# Form migration strategy

Use this reference after inventorying forms in WordPress and before implementing replacements. The form's business behavior determines its tier; the source plugin brand does not.

## Decision matrix

| Tier | Signs in the source workflow | Architecture |
| --- | --- | --- |
| **1: simple contact/inquiry** | Submission sends to one or more email recipients; no retained submission history is required; no cap, duplicate check, stock/seat count, queue, client inbox, or cross-submission rule. Ordinary required/email/range validation and lightweight show/hide fields are okay if server validation remains simple. | Native Astro HTML form with built-in browser constraints (`required`, `type="email"`, `min`, `max`, etc.) posts directly to a form-to-email SaaS endpoint. No Astro action or DB. |
| **2: stateful workflow** | Hard total/per-person limits, remaining-seat display, duplicate detection, conditional server-side eligibility, waitlist/status management, a searchable/exportable inbox, or meaningful records that must persist. | Native Astro form → `src/actions/index.ts` Action with Zod → server-only submission service → EmDash collection entries kept private/unpublished → Resend notification. Use EmDash field uniqueness for race-safe dedupe and slot allocation for race-safe quotas. |

Do not select Tier 2 just because the WordPress plugin is feature-rich. Conversely, do not call a browser-only counter or client-side validation a replacement for a server-enforced capacity or eligibility rule.

### Audit questions

For every Gravity Forms, WS Form, WPForms, Contact Form 7, or custom form, record:

- Fields, required/format/range validation, conditional visibility, conditional validation, multi-step behavior, and file uploads.
- Recipients, autoresponders, confirmation/redirect, integrations, and what happens if email fails.
- Whether submissions are retained; who views them; statuses, filters/search, edit/delete, retention, and CSV export needs.
- Limits: total submissions, time-window limits, per-user limits, capacity/stock counters, waitlists, or manually reserved spots.
- Duplicate definition and scope: normalized email globally, per form, per event, per person+date, etc.
- Whether a shown counter is informational or must never oversell under simultaneous submissions.
- Data sensitivity, consent/legal basis, deletion/retention, spam controls, and who owns provider accounts/credentials.
- Every entry point that opens or links to the form: visible label, page/section, and exact behavior (modal/popup, inline reveal, contact-page navigation, or direct email link). Verify each one in the source at desktop and mobile widths. A contact button that opens a form is not equivalent to a `mailto:` link.

Classify from configuration and observed behavior. A form with five text fields can be Tier 2 if it enforces a 50-person cap; a long survey can be Tier 1 if it only emails results and no one needs stored submissions. A provider's built-in form inbox is still retained data and must be surfaced to the client as an explicit data/operations choice.

## Tier 1 recipe: native HTML → SaaS email

### Choose the provider with the client

Before implementing a Tier 1 form, ask the client which provider they want to use. If they have no preference, compare at least a couple of suitable options, explain the practical tradeoffs, and get their choice before wiring the form. Possible candidates include Formspark, StaticForms, and Web3Forms; this list is not an endorsement and providers' plans and features change. Check each candidate's official current documentation and pricing for:

- Existing account, who owns it, recipient verification, and how credentials are issued. Never assume a browser-visible key is safe unless that provider explicitly documents it as public.
- Current submission allowance, overage behavior, and whether pricing is recurring, one-time, promotional, or tied to an expiring bundle.
- Whether it supports native HTML posting and the desired confirmation flow (prefer an on-site success/error state when requested; do not silently send visitors to a provider-branded page).
- Spam controls, data retention and deletion, privacy terms/data location, integrations, and any branding or limits that matter to the client.

Owner-specific reminder: the site owner has mentioned a possible Formspark **$25 one-time offer for 50,000 submissions**. Formspark's [official pricing page](https://formspark.io/pricing/) has listed this bundle, but promotions can change or expire. When Formspark is being considered, remind the owner to check the live price, exact submission/feature terms, currency, and eligibility before buying; do not treat the offer as guaranteed or purchase it without authorization.

Use a provider-owned form action, not its embed widget or iframe. The example below follows Web3Forms' documented static HTML flow; it requires only HTML and uses provider-specific field names. Its access key is designed to be public in the form. Do not copy that credential pattern to a provider that requires a secret key. The example is a recipe, not a default provider choice.

```astro
---
interface Props {
  accessKey: string;
  successUrl: string;
}

const { accessKey, successUrl } = Astro.props;
---

<form action="https://api.web3forms.com/submit" method="POST">
  <input type="hidden" name="access_key" value={accessKey} />
  <input type="hidden" name="subject" value="New website inquiry" />
  <input type="hidden" name="redirect" value={successUrl} />

  <div class="form-field">
    <label for="contact-name">Name</label>
    <input id="contact-name" name="name" autocomplete="name" required />
  </div>

  <div class="form-field">
    <label for="contact-email">Email</label>
    <input id="contact-email" name="email" type="email" autocomplete="email" required />
  </div>

  <div class="form-field">
    <label for="contact-message">How can we help?</label>
    <textarea id="contact-message" name="message" rows="6" required></textarea>
  </div>

  <!-- Provider-specific spam field. Keep it out of the keyboard/accessibility tree. -->
  <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true" hidden />

  <button type="submit">Send message</button>
</form>
```

Use ordinary Astro/Tailwind classes or the site's semantic form components for styling; never use a provider embed. Native constraint validation works without custom JavaScript. A honeypot is only a secondary spam measure: follow the provider's current advice and use its supported challenge/rate controls when needed. Web3Forms currently labels its honeypot deprecated/less effective, so don't present it as sufficient protection.

The recipient is configured in the provider account, not trusted from a user-controlled input. The client should own that account/access key. A generic Astro `PUBLIC_*` variable is suitable only when the selected service explicitly documents a public browser key. Preserve the audited source interaction (for example, open the native form in an accessible modal if the source CTA opens a popup). Test every CTA, form validation, successful delivery, provider/network failure, and the requested on-site confirmation. Do not expose internal implementation/provider disclosures or an email `mailto:` address as form copy unless the client asks for that disclosure.

## Tier 2 data model and EmDash admin inbox

Define the submissions collection as part of the site's EmDash schema (usually `seed/seed.json` for repeatable site setup, or Content Types for a deliberate live-site change). This is a fixed schema, not a runtime-created collection for each form. EmDash collections provide admin content lists/editors; collection search can search fields marked searchable. A seed is for initial setup and explicit seed application, not a migration that automatically runs on every deploy.

This is the documented seed shape for a private submissions inbox; adjust fields to the audited workflow and validate with the target EmDash version:

```json
{
  "$schema": "https://emdashcms.com/seed.schema.json",
  "version": "1",
  "collections": [
    {
      "slug": "form_submissions",
      "label": "Form submissions",
      "labelSingular": "Form submission",
      "description": "Private website form submissions",
      "supports": ["drafts", "search"],
      "routable": false,
      "commentsEnabled": false,
      "titleField": "title",
      "dateField": "submitted_at",
      "admin": { "listColumns": ["form_key", "name", "email", "submitted_at"] },
      "fields": [
        { "slug": "title", "label": "Submission", "type": "string", "required": true },
        { "slug": "form_key", "label": "Form", "type": "string", "required": true, "searchable": true, "indexed": true },
        { "slug": "name", "label": "Name", "type": "string", "required": true, "searchable": true },
        { "slug": "email", "label": "Email", "type": "string", "required": true, "searchable": true },
        { "slug": "email_key", "label": "Duplicate key", "type": "string", "required": true, "unique": true },
        { "slug": "slot_key", "label": "Capacity slot", "type": "string", "required": true, "unique": true },
        { "slug": "answers", "label": "Answers", "type": "json" },
        { "slug": "submitted_at", "label": "Submitted at", "type": "datetime", "indexed": true },
        { "slug": "submission_status", "label": "Status", "type": "string", "searchable": true }
      ]
    }
  ]
}
```

The schema above uses documented seed properties (`routable`, `supports`, `admin.listColumns`, and field `unique`/`searchable`/`indexed`). EmDash admin lists/editors are the inbox, not a separate form-builder UI. Entries should be created with draft status and never published. Non-routable alone is not a privacy boundary: verify anonymous content, search, and API reads cannot expose submission PII.

Suggested collection slug: `form_submissions`. Keep the collection non-routable, without SEO, comments, or public rendering. Store every submission as a draft/unpublished item and never call publish. Verify anonymously that no submitted PII is returned by content/query APIs or public search. Configure searchable display fields (for example, title, name, email, form label) and use EmDash field rules:

- `form_key` — required string, searchable/indexed when useful.
- `title` — required string, set by the action to a readable label plus stable submission reference.
- `name`, `email` — separate required strings; mark searchable only if the client needs those searches.
- `email_key` — required normalized composite key such as `${formKey}:${email.trim().toLowerCase()}`, **unique**. Avoid global email uniqueness when duplicates are only forbidden within one form/event.
- `slot_key` — required composite string such as `${formKey}:${slotNumber}`, **unique**. This is the race-safe capacity reservation described below.
- `answers` — JSON for form-specific extra answers; keep common searchable/export columns as real fields, because JSON values are not indexed/searchable as ordinary collection fields.
- `submitted_at`, `submission_status`, and consent/retention metadata as needed. Don't collect fields the workflow does not need.

EmDash documents collection/field definitions through seed files and Content Types, draft/unpublished entry behavior, per-field unique and searchable rules, and admin list search. The exact seed keys and content-create payload must match the current seed reference and `GET /_emdash/api/openapi.json` on the target site; do not copy an approximate schema shape into production. The client inbox is the EmDash collection list/editor. Native CSV export is not assumed: if the target EmDash version does not provide it, build a separately authenticated export endpoint/action that reads all pages of the collection and emits correctly quoted CSV. Escape spreadsheet formula-leading values (`=`, `+`, `-`, `@`) in exported cells.

### Privacy requirements for EmDash records

- Prefer a non-routable collection, no SEO/search exposure beyond the admin's configured collection search, and draft/unpublished submissions. Confirm behavior on the exact EmDash version.
- Never publish submissions. Do not include private entries in Astro public `getEmDashCollection()` queries, feeds, sitemaps, or public APIs.
- Keep any EmDash access token only in server environment secrets. Scope it to the smallest permitted content read/write capability; never serialize it into HTML, client JavaScript, public env variables, logs, or email links.
- Define who may view/export submissions, retention/deletion, consent, and backup handling with the client. Do not store payment-card credentials, passwords, or unnecessary sensitive data in content fields.

## Tier 2 Astro Action recipe

Astro Actions are documented in `src/actions/index.ts`; form actions use `accept: "form"`, Zod validation, and `ActionError`. The Action should orchestrate validation, durable reservation, submission persistence, and notification; put business rules in `src/lib/forms/` and persistence/provider details behind small services.

```ts
// src/actions/index.ts
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { getFormConfig } from "../lib/forms/config";
import { formSubmissions } from "../lib/forms/submissions";
import { sendSubmissionNotification } from "../lib/forms/email";

const registrationInput = z.object({
  formKey: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  message: z.string().trim().max(5000).nullable().optional(),
  // Empty for humans; bots that fill it are accepted silently but not stored.
  companyWebsite: z.string().max(500).nullable().optional(),
});

export const server = {
  submitRegistration: defineAction({
    accept: "form",
    input: registrationInput,
    handler: async (input) => {
      if (input.companyWebsite) return { accepted: true };

      const config = getFormConfig(input.formKey);
      if (!config) {
        throw new ActionError({ code: "BAD_REQUEST", message: "This form is unavailable." });
      }

      const existingCount = await formSubmissions.countForForm(input.formKey);
      if (existingCount >= config.limit) {
        throw new ActionError({ code: "CONFLICT", message: "This form is full." });
      }

      // Atomically claim one free slot by creating an EmDash draft entry with
      // unique `slot_key` and `email_key` fields. On unique conflict, refresh
      // occupied slots and retry; never trust the count above as enforcement.
      const result = await formSubmissions.createInAvailableSlot({
        formKey: input.formKey,
        limit: config.limit,
        email: input.email,
        answers: { name: input.name, message: input.message ?? "" },
      });

      if (result.kind === "full") {
        throw new ActionError({ code: "CONFLICT", message: "This form is full." });
      }
      if (result.kind === "duplicate") {
        throw new ActionError({ code: "CONFLICT", message: "This email has already registered." });
      }

      // Email is secondary to the saved submission: log/queue a retry on
      // provider failure instead of losing or duplicating the registration.
      await sendSubmissionNotification(result.submission).catch((error) => {
        console.error("Form notification failed", { submissionId: result.submission.id, error });
      });

      return { accepted: true, remaining: config.limit - result.occupiedCount };
    },
  }),
};
```

`formSubmissions` is a deliberately small service adapter, not an EmDash or Astro built-in. Implement its EmDash reads/writes against the current supported Content REST API/OpenAPI contract or another explicitly documented integration. The action must use a server-only least-privilege token if the selected REST operations require it. Do not infer a generic `ctx.locals.db`/`ctx.db`; Astro Actions context and EmDash database adapters do not promise that property in the site-template API docs.

Quota correctness: a plain `COUNT(*) < limit` followed by `INSERT` can oversell when two requests race. This recipe uses the collection's **unique `slot_key` field** as an atomic reservation: read the used slot keys, choose an available integer from `1..limit`, and create the draft entry; if another request wins that unique key first, catch the documented conflict and retry with the refreshed set. The database unique constraint, not the preliminary count, is the final authority. Apply the unique `email_key` constraint in the same create so per-form duplicate detection is also race-safe. Test uniqueness for draft entries on the target EmDash version before relying on it. If that cannot be proven or the quota needs complex multi-resource inventory, use a database transaction/constraint exposed by a supported adapter and provide a custom private inbox; don't silently degrade a hard cap into a racy count.

Do not use this Action as written without implementing and testing `formSubmissions` for the exact site adapter and the live EmDash OpenAPI. REST requests use the site's documented authentication and response envelope; the server token never goes to the browser. The OpenAPI contract is authoritative for content create/list payloads and pagination.

## Remaining-count display

At request time, query persisted submissions on the Astro server (or the same read service), not localStorage and not a client-only increment. Compute `remaining = max(0, limit - confirmedCount)` and render a visible textual status. Disable the submit button when the form is full for usability, but keep the Action-side atomic reservation because multiple users may submit concurrently after the page renders. On a failed/full Action result, retain user input and show an associated error summary. A cached/static page may show stale spots; use on-demand rendering or explicitly describe the count as approximate and refresh it client-side from a read-only, rate-limited endpoint.

This is the zero-JavaScript submission shape supported by Astro Actions. `Astro.getActionResult()` provides server-rendered feedback after POST; set the page to on-demand rendering. Add the site's Tailwind token classes and field-specific messages as appropriate:

```astro
---
import { actions } from "astro:actions";
import { getFormConfig } from "../lib/forms/config";
import { formSubmissions } from "../lib/forms/submissions";

export const prerender = false;

const form = getFormConfig("summer_registration")!;
const result = Astro.getActionResult(actions.submitRegistration);
const count = await formSubmissions.countForForm(form.key);
const remaining = Math.max(0, form.limit - count);
---

{result?.error && <p role="alert">{result.error.message}</p>}
{result?.data?.accepted && <p role="status">Thanks, your registration was received.</p>}

<p aria-live="polite">
  {remaining === 0 ? "Registration is full." : `${remaining} places remaining.`}
</p>

<form method="POST" action={actions.submitRegistration}>
  <input type="hidden" name="formKey" value={form.key} />
  <label for="registration-name">Name</label>
  <input id="registration-name" name="name" autocomplete="name" required />
  <label for="registration-email">Email</label>
  <input id="registration-email" name="email" type="email" autocomplete="email" required />
  <label for="registration-message">Additional information</label>
  <textarea id="registration-message" name="message" rows="4"></textarea>
  <input type="text" name="companyWebsite" tabindex="-1" autocomplete="off" aria-hidden="true" class="form-honeypot" />
  <button type="submit" disabled={remaining === 0}>Register</button>
</form>
```

The honeypot is removed from keyboard and accessibility navigation; include a project CSS rule that places `.form-honeypot` off-screen without using `display:none` if the chosen bot filter requires it to exist in layout. Never rely on it alone. Astro converts empty form fields to `null` for Action validation, so optional blank strings must accept `null` or normalize it explicitly.

Example server query in a page (helper names are project-owned):

```astro
---
export const prerender = false;
import { getFormConfig } from "../lib/forms/config";
import { formSubmissions } from "../lib/forms/submissions";

const form = getFormConfig("summer_registration")!;
const count = await formSubmissions.countForForm(form.key);
const remaining = Math.max(0, form.limit - count);
---

<p aria-live="polite">
  {remaining === 0 ? "Registration is full." : `${remaining} places remaining.`}
</p>
<button type="submit" disabled={remaining === 0}>Register</button>
```

Do not treat this render-time count as a reservation. The Action rechecks and claims a unique slot.

## Email, spam, errors, and accessibility

- Use Resend or the project's approved email provider from a server-only module. Send only the notification/autoresponse actually required. Never fail a saved registration just because a secondary email provider is temporarily down; log and retry through a durable outbox if guaranteed delivery matters.
- Apply server-side validation even when HTML constraints are present. Normalize email once; apply the exact duplicate scope from the audit. Use a provider CAPTCHA/rate limiting when risk merits it. A honeypot alone is not security.
- Add abuse/rate limits appropriate to the deployment adapter. Avoid logging message bodies, email addresses, access tokens, or full form payloads.
- Use labels, fieldsets/legends for groups, autocomplete, helpful required/format hints, field-associated errors and a focusable error summary. Preserve entered values after validation errors. Announce success/full-state updates with a status region. Use no embed/iframe.
- Check Astro Action CSRF/origin protections and current Astro security guidance for the installed version. Don't add permissive CORS as a workaround.

## Migration handoff

For each replaced form, report its tier and why; mapped field/rule behavior; provider and client-owned configuration; submission retention/inbox/export path; quota/duplicate concurrency test; spam controls; privacy/retention assumptions; and what needs the client to verify (recipient, autoresponder, notification, and export). If an essential behavior cannot be safely preserved with documented APIs, stop and explain the exact gap rather than ship a visual imitation.

## Documentation references to verify before coding

- [Astro Actions](https://docs.astro.build/en/guides/actions/) — form actions, validation, action errors, security.
- [EmDash collections and fields](https://docs.emdashcms.com/concepts/collections/) — unique/searchable field rules and collection behavior.
- [EmDash Working with Content](https://docs.emdashcms.com/guides/working-with-content/) — admin list/search and draft/public lifecycle.
- [EmDash Seed Files](https://docs.emdashcms.com/themes/seed-files/) — site schema reproducibility.
- [EmDash REST API](https://docs.emdashcms.com/reference/rest-api/) — supported contract, auth, operations, generated OpenAPI.
- [Web3Forms static HTML installation](https://docs.web3forms.com/getting-started/installation) — example provider contract only; re-check provider plan and spam guidance before use.
