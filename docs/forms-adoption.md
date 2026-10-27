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

## Submission-limit adoption — 27 October 2026

For a site needing a retained inbox or a per-form submission cap, evaluate the first-party plugin before selecting a custom Astro Action and submissions collection. Keep it opt-in. Baseline's earlier 0.2.10 integration evidence above does not certify submission limits or a future plugin release.

[Design PR #4420](https://github.com/emdash-cms/emdash/pull/4420), linked from [discussion #4166](https://github.com/emdash-cms/emdash/discussions/4166), remains proposed and depends on the open [concurrency fix #4419](https://github.com/emdash-cms/emdash/pull/4419). The prototype is feasibility evidence. Adopt only after a published implementation is reviewed against the accepted design and tested on the site's exact plugin/core versions and runtime. The owner will monitor release progress manually through GitHub notifications; no automated release detection is configured or required by this guidance.

The current proposal counts each submission as one place, including read/archived submissions; deletion and retention cleanup free places. It proposes configurable full-state messaging and optional remaining counts. Group sizes, per-option/session inventory, duplicate-person/email restrictions, waitlists, schedules and payments are outside its scope. Confirm the eventual rules against the site's actual registration workflow before choosing it.

Release acceptance must cover concurrent final-place submissions, stale-page rejection, full-state rendering and accessible errors, failed validation/upload/save without leaked places, interruption recovery, deletion/retention/archiving, pause/resume, limit changes and unlimited-form compatibility. Verify stored records as well as responses and counters. Repeat on the target database adapter; the historical Node/SQLite receipt is not Workers/D1 evidence. Review downgrade behavior because an older plugin may ignore configured limits.

Use the plugin's supported route, native Astro components and inbox when it satisfies the workflow; avoid a parallel Action, submissions collection or capacity counter. Otherwise retain the existing workflow or explicitly select the custom recipe in the [form migration reference](../.agents/skills/wordpress-to-emdash-content/references/forms.md#tier-2-choose-native-plugin-or-custom-workflow). If time allows, recommend keeping the working source forms while waiting; a missing feature does not automatically justify a production custom backend. Agree that scope directly with the client before implementation. The reference now places a stop condition before its draft-slot recipe: duplicate draft slots were accepted in a disposable core 1.3.0 Node/SQLite test, so field uniqueness alone is not a proven capacity reservation. This does not test a native plugin cap or every adapter. Reprove draft uniqueness and contention on the exact path or stop that recipe; do not publish private entries or weaken enforcement as a workaround. This preparation does not install the plugin/prototype or migrate any submissions.

## Consent and event security

Follow [Scanner-safe confirmation and isolated webhooks](newsletter-architecture.md): GET/HEAD never confirm or consume tokens; an explicit POST performs one atomic confirmation. Verify provider signatures before exact configured sending-domain/form/list filtering, and update known subscribers only. Native Forms outgoing webhooks may be unsigned and at-most-once: use submission-ID deduplication plus stored-submission reconciliation, not assumed retries. Test missing/cross-origin CSRF tokens for session-mutating forms and scanner/replay/concurrent confirmation behavior against the actual integration. No newsletter backend or provider is enabled by this starter.
