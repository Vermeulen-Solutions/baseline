# Native forms decision — 15 October 2026

Decision: `@emdash-cms/plugin-forms@0.2.10` is an opt-in native integration. Keep FormError and the starter's bounded form-recovery utilities. Do not add the plugin to the default package/configuration or replace an existing site's providers as part of this upgrade. The obsolete `@emdash/plugin-forms` package name is incorrect.

The npm package was inspected and tested with Astro 7.4.0, EmDash 1.3.0 and React integration 7.1.0 in a disposable Node/SQLite site. Its documented source comments mention live.config.ts, but the tested registration is `import { formsPlugin } from '@emdash-cms/plugin-forms'` passed as `plugins: [formsPlugin()]` to the EmDash integration in astro.config.mjs. Standalone public rendering uses `Form` from `@emdash-cms/plugin-forms/ui`. Review the declared peers, native trust/capabilities and notification/storage policy for each installation.

| Capability | Evidence | Decision / remaining work |
| --- | --- | --- |
| Native registration and public form | Authenticated forms/create route succeeded; anonymous SSR produced the real form and label | Node path verified; plugin remains optional |
| Server validation | Actual package validation rejected malformed email/missing required file; accepted valid fields | Keep server validation; test the site's specific conditional/file constraints |
| Submissions | Handler probe plus actual anonymous HTTP/storage integration in disposable SQLite | Real provider/production delivery is separate |
| Honeypot | Silent success without a stored bot submission | Expected behavior; success response alone does not prove storage |
| Turnstile failures | Actual handler rejected missing token and unconfigured service | Valid/failed external verification and credentials remain unverified |
| Notifications | Mocked email failure logged; handler still returned success after storing | Not delivery confirmation; choose alerting/retry/provider behavior explicitly |
| Recovery | Source client saves every string FormData value to sessionStorage; restore does not enforce a savedAt expiry | Does not satisfy the starter's allowlist/TTL/consumed-once contract; retain bounded utility and review sensitive fields before opting in |
| Retention | Actual create response defaults retentionDays to 0; source cleanup skips that value | Choose a deliberate retention period and verify scheduled cleanup before collecting real submissions |
| Keyboard/errors/accessibility | SSR field/label present; full enhanced multi-page/focus/error behavior not certified | Site acceptance still required; FormError is not replaced by package availability |
| Cloudflare | No disposable Worker/provider run in this phase | Unverified; Node proof does not certify Workers |

Receipts: `audit/phase-2/forms-probe.json` names mocked package-handler checks; `forms-integration.json` records real Node registration/rendering/submission storage. No notification, webhook or Turnstile provider was contacted. The test form contained only synthetic addresses. These checks are an adoption evaluation, not a promise of full plugin feature parity.

Before opting in on a site, verify registration/build/admin, required/conditional fields, files and rejected input, spam success/failure, actual provider delivery and retry visibility, bounded non-secret recovery, retention/cleanup, keyboard/focus/errors and runtime-specific behavior. Preserve existing site workflows until that evidence supports a migration.
