---
name: emdash-production-cutover
description: Move an existing EmDash site on Cloudflare Workers from preview to its production custom domain, preserving admin access and corporate mail DNS. Configure Cloudflare Email Sending or native Astro contact forms when requested.
---

# EmDash production cutover

Use this skill for the production domain transition of an existing Cloudflare Workers site. For initial hosting setup, Node-to-Cloudflare migration, or CMS data transfer, use `emdash-site-setup` first. Deploying code does not transfer CMS content.

Perform only the requested work. A domain cutover does not require replacing a working email provider or third-party form service. Preserve established form requirements and integrations; consult `wordpress-to-emdash-content` when classifying a migrated form. Read [Native contact forms](references/contact-forms.md) only when implementing or replacing a form.

## Preflight and recovery

Inspect the repository and deployed configuration. Record the following in existing deployment notes, or `audit/production-cutover.md` when no suitable record exists:

- Cloudflare account, zone, Worker, and Wrangler environment; installed Astro, Cloudflare adapter, EmDash, and Wrangler versions.
- Current and target origins, canonical hostname (apex or `www`), and required aliases.
- Explicit `siteUrl`, `EMDASH_SITE_URL`, `SITE_URL`, Astro `site`, and CMS Site URL settings; identify conflicting overrides.
- Authentication mode, a working admin login, and recovery method. Distinguish built-in passkey/email login, OAuth, and Cloudflare Access.
- Corporate mail provider and existing MX, SPF, DKIM, and DMARC records; sender domain, accepted From address, and current email provider.
- Existing form behavior, trusted recipient source, and whether replacement is requested.
- Previous deployment/version, routing and application configuration, and rollback procedure. Confirm backups when the task includes data changes.

Check current official docs and installed APIs before using examples:

- [EmDash deployment](https://docs.emdashcms.com/deployment/cloudflare/), [authentication](https://docs.emdashcms.com/guides/authentication/), and [email](https://docs.emdashcms.com/guides/email/).
- [Cloudflare custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
- [Email domains](https://developers.cloudflare.com/email-service/configuration/domains/), [subdomains](https://developers.cloudflare.com/email-service/configuration/subdomains/), and [pricing](https://developers.cloudflare.com/email-service/platform/pricing/).

Use the project's package manager and build/deployment scripts. Modify the selected Wrangler environment without replacing unrelated bindings, secrets, routes, or settings. Inspect configuration changes before deploying. Proceed within existing authorization; if live deployment or DNS changes are outside the request, prepare the concrete diff and procedure before requesting approval.

## Cutover sequence

### 1. Establish recovery before changing the authentication origin

Keep the existing admin login working while configuring recovery. If built-in email login is the recovery method, activate the provider and verify actual test-email delivery and a fresh magic-link login on the current origin **before** switching the canonical authentication origin.

Retain a working provider. If Cloudflare Email Sending is requested or needed, follow the section below. An existing browser session is not proof that fresh login or recovery works.

For OAuth, verify the new callback URL with the configured provider. For Cloudflare Access, verify the target hostname's application, policy, audience, and protected EmDash paths; built-in passkey and magic-link instructions do not apply to this mode. Check the installed version's authentication behavior.

### 2. Attach the production hostname and aliases

The custom domain must be an active Cloudflare-managed zone in the Worker's account. Add the hostname to the existing Wrangler configuration, for example:

```jsonc
"routes": [
  // Retain any other required routes.
  { "pattern": "example.com", "custom_domain": true }
]
```

Deploy through the project's normal build/deploy flow. Verify the site and TLS at the new hostname before changing its authentication origin. Custom Domains provision DNS and certificates; inspect existing record conflicts and wait for provisioning. Keep the preview address available during diagnosis when permitted by the site's access requirements.

For an apex canonical hostname, configure proxied DNS for `www` and an edge redirect matching only `www.example.com`. Use `concat("https://example.com", http.request.uri.path)` with **Preserve query string enabled**. Use the inverse rule when `www` is canonical. Inspect existing rules to avoid loops. A 301 suits ordinary page requests; use a method-preserving redirect where required for POST/API traffic, and submit forms directly to the canonical origin.

Verify HTTP/HTTPS aliases, nested paths, and query parameters. Follow [Cloudflare's redirect configuration](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-dashboard/).

### 3. Switch the canonical origin and verify fresh admin access

Set the effective EmDash public origin to production without a trailing slash, for example `EMDASH_SITE_URL=https://example.com`. Reconcile explicit configuration and stored settings according to installed-version precedence. Update Astro's `site` and other canonical URL sources where used. Preserve database, media, secrets, and user records.

Passkeys are scoped to a relying-party ID, and authentication also checks the browser origin. A credential created for an unrelated `workers.dev` hostname cannot authenticate on the new domain. EmDash versions supporting additional allowed origins can share credentials across compatible subdomains with the same RP ID; not every origin change requires re-registration.

When a new passkey is required:

1. Open production admin login and request a magic link for the existing admin.
2. Verify that the delivered link uses production, then complete its confirmation flow.
3. Register a replacement passkey in account settings.
4. Verify passkey login from a fresh browser session before removing obsolete credentials.

Verify OAuth or Access login instead when configured. If recovery fails, stop the cutover and restore the recorded working origin/configuration and deployment as appropriate. Do not reseed, delete users, or reset authentication automatically. Restoring Worker code alone may not restore CMS settings or edge rules; include those in rollback.

## Cloudflare Email Sending, when needed

Use a dedicated sender subdomain such as `cms-mail.example.com` when appropriate. This separates application sender authentication from corporate mail; inspect proposed DNS changes rather than promising zero interference.

Email Sending and Email Routing are distinct. Sending creates bounce MX/SPF under `cf-bounce.<sender-domain>`, DKIM under its managed selector, and DMARC for the sender domain. Routing uses inbound MX on the routed domain. Do not enable apex Email Routing or replace corporate mail records merely to send application email.

Onboard the chosen sender through **Compute > Email Service > Email Sending**. Review and use its generated DNS records; never copy placeholder keys or overwrite an existing DMARC policy with canned `p=reject`. Confirm readiness and preserve a before/after DNS inventory.

Add a binding to the selected environment:

```jsonc
"send_email": [
  {
    "name": "EMAIL",
    "allowed_sender_addresses": ["no-reply@cms-mail.example.com"]
  }
]
```

Register the native provider inside the existing EmDash configuration:

```javascript
import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins";

// Inside the existing emdash({ plugins: [...] }) configuration:
cloudflareEmail({
  from: { email: "no-reply@cms-mail.example.com", name: "Site Name" },
  replyTo: "support@example.com",
})
```

Use the accepted sender and actual site identity. The default binding is `EMAIL`; verify the plugin's `binding` option if another name is needed. Deploy, activate under Extensions, and select under Settings > Email if multiple providers are active. Confirm actual delivery before using it for recovery.

Workers Paid permits arbitrary recipients subject to quotas, suppression rules, service limits, and binding restrictions. Free supports verified destination addresses; sends to verified destinations are free on both plans. Verify current account eligibility and limits. A contact inbox can be a verified destination, while invitations/recovery for other users may require Paid. Do not restrict a shared CMS binding to the contact inbox; use separate bindings when the form needs a narrower destination allowlist.

## Acceptance and delivery

Run appropriate repository typecheck/build and existing relevant checks before deploying changed code. Record observed results, unresolved limitations, and rollback instructions. Complete only applicable checks:

- Production serves the expected site with valid TLS; aliases preserve paths/queries without loops.
- Effective canonical URL sources, magic links, canonical tags, sitemap, and robots references use the intended domain.
- Fresh admin login works through the configured mode; replacement passkey login works when required.
- Corporate mail DNS remains intact; any changed provider passes actual inbox-delivery testing.
- Existing forms retain required behavior; changed forms pass [Native contact forms](references/contact-forms.md) acceptance checks.

For diagnosis, use `npx wrangler tail` with the selected project/environment and correlate a deliberately initiated test. Avoid logging message bodies or magic-link tokens. API acceptance is not proof of inbox delivery. Do not retry ambiguous send failures automatically: the original may already have been accepted. Remove temporary debugging and record the deployment/configuration verified.

## Post-audit release checks

Audit fixes may include local CMS/media edits as well as code. Inventory these before release; a code deployment does not transfer them. Read production records, back them up, detect drafts/unseen edits and apply targeted patches with current revisions through supported APIs. Upload required official media and retain actual storage-key URLs; local media IDs may differ from production. Preserve unrelated fields, captions/order and publication state. Verify both locales and every shared consuming page. Retry HEAD=405 media with GET and keep query URLs in evidence; inspect actual admin state rather than matching embedded translation strings. Record working-tree versus committed release state explicitly.

## Post-Cutover Completion Prompt

When cutover verification is complete and production traffic is serving cleanly, present this final prompt:
> **Production Cutover Complete & Verified!**
> The site is live on its custom production domain with valid TLS, verified admin logins, and protected corporate mail DNS.
>
> **Recommended Final Actions:**
> 1. **(Recommended) Update Site Registry:** Run `npm run site:register` with status `active` to record the live production repository.
> 2. **Confirm Backup Schedule:** Verify automated daily Cloudflare D1/R2 or SQLite backups.
> 3. **Archive Cutover Log:** Record the finalized deployment notes and rollback procedure in `audit/production-cutover.md`.
