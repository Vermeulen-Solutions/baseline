# Fieldnote local-build handoff

Updated 2026-10-25. The authorized local website preparation is complete through a working production-build preview. This supersedes the kickoff planning handoff. It does not claim a production launch or dependency-security acceptance.

## Preview and resource ownership

Open http://127.0.0.1:4362/ (Home), /workshops/ and /contact/. This serves the verified static dist/ output using Astro preview.

- Owner: the resumed static-site agent created the process for the operator's independent inspection; the site maintainer/operator now owns stopping or restarting it.
- Running process: Node PID 27052, loopback 127.0.0.1:4362. Command: node node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4362. Working directory: C:/dev/baseline-onboarding-static-20261025-run1. No public network bind or credentials.
- Stop safely from PowerShell: `& 'C:\dev\baseline-onboarding-static-20261025-run1\audit\stop-preview.ps1'`. The script reads preview.pid and verifies the command before stopping, guarding against PID reuse. Alternatively, verify that PID 27052 still has the command above, then Stop-Process -Id 27052.
- Restart if necessary from this project: `npm.cmd run preview -- --host 127.0.0.1 --port 4362`. Record the new PID if restarting; the saved stop script is bound to preview.pid.
- Logs: audit/preview.stdout.log and audit/preview.stderr.log; receipt: audit/preview-resource.json. The initial preview launch used an incorrect Astro CLI filename and exited; the corrected bin/astro.mjs process is the only owned server left running.
- The development server formerly on 4361 was stopped. Its exec session was 33636 and exited. Install/build/typecheck/audit commands have exited. Temporary draft fixtures were removed and original content restored. No other temporary server, detector live-server, database, external service or credential was created. The preview browser tab is retained, temporary viewport overrides reset, and the stale calibration tab closed.

## Implemented scope and files

The established static profile and developer-owned Markdown workflow remain intact. Coordinator-supplied copy is preserved in exactly five Markdown records; the maintainer edits, builds and eventually deploys them. No browser editor, CMS/database, forms, tracking, payments or external fonts/images were added.

- src/content.config.ts: typed Pages and Workshops collections, draft defaults and valid ISO calendar date strings.
- src/content/pages/{home,workshops,contact}.md and src/content/workshops/{clear-project-briefs,better-team-check-ins}.md: supplied words and dates.
- src/lib/site-content.ts: explicit published-page mapping/navigation, sorted published workshops and UTC-safe date display.
- src/pages/[...page].astro: static generation of the three mapped pages and RichText for optional native Markdown body content. The existing 404 utility is retained.
- src/components/WorkshopList.astro: responsive semantic list and distinct registration link names, using the shared supplied email.
- src/config/site.ts, src/layouts/Base.astro and src/styles/global.css: Fieldnote identity/navigation/email, active navigation and footer; locally served Georgia/system typography, warm paper/forest palette and balanced shared spacing.
- Removed starter src/pages/index.astro, src/pages/posts/index.astro, src/pages/posts/[...id].astro, src/lib/posts.ts and src/content/posts/welcome.md after reference checks. This is an unlaunched synthetic starter; the plan explicitly requires no 301 redirects. The unused source photograph is not emitted in dist; no client imagery was invented.
- AGENTS.md: complete Art Direction Record and current editing rules. PROJECT.md, README.md and audit/content-route-plan.md: current implementation links/status while preserving the brief and historical plan. HANDOFF.md: this current record.
- package.json and package-lock.json: compatible Sharp security patch 0.35.4 → 0.35.5. The project lockfile remains authoritative.
- audit/design-gate-exceptions.json: token initializer pruned starter sample exceptions (43 → 10); no new client exception was invented. audit/component-calibration.md: source-bound token table plus actual browser calibration. audit/rendered-review.md and audit/screenshots/: rendered observations and 10 captures. audit/draft-state-check.json, audit/local-route-check.json, audit/impeccable-detector.json, audit/dependency-audit.json and preview ownership/log/stop files: actual local evidence/resources.

Generated node_modules/, .astro/ and fresh dist/ are retained. No Git repository, commit or remote was created.

## Actual checks and observations

- Read installed static instructions, brief/handoff/plan, workflow/art-direction/Astro/Impeccable guidance and layout/composition references. Used the official Astro docs MCP for native collection schema/query/filter APIs, checked against the installed Astro 7.4.0 build/typecheck. No Baseline source files beyond the explicitly supplied resume prompt were read.
- Saved the Art Direction Record before page implementation. First gate rejected untouched neutral tokens; client initialization/preset was applied, customized to the brief, then the required-record gate passed. An unsupported optional token setter was rejected without writing; its intended font weight was authored explicitly in CSS. No checks were bypassed.
- `npm.cmd run design:tokens -- --init-client --lane editorial-paper`: initialized client tokens, pruned starter exceptions and scaffolded calibration. Final `npm.cmd run design:tokens -- --write-calibration` passed and bound the saved-source table to CSS SHA-256 45d43ee8b5c3a919bc3800b529cff9e91250f506aadbcfaddd9ebf7e1b2551ab. All 14 token contrast pairs pass. Six fluid diagnostics remain advisory; actual 320/375/768/1280px browser reflow is recorded.
- `npm.cmd run verify`: final exit 0 after the source and dependency changes. Script syntax, Astro accessibility lint, CSS contracts, art gate, token audit, all 39 tests and typecheck pass. Astro: 34 files, zero errors/warnings/hints.
- Temporary draft rehearsal built the site with Contact marked draft and an additional draft workshop. The Contact route and nav entry were absent and the workshop fixture was excluded. Source was restored in finally and the fixture removed; audit/draft-state-check.json records the result.
- `npm.cmd run build`: final exit 0 after restoring real content. Exactly four HTML outputs: index.html, workshops/index.html, contact/index.html and 404.html. Postbuild release-artifact check passes.
- `npm.cmd run check:dev-tools`: exit 0. No styleguide, fixture specimens or server entrypoint in release output.
- Independent parse5/HTTP assertions: all three public routes return 200 with one exact supplied h1, English language, appropriate titles and valid local/mailto destinations. Both summaries and semantic dates match the supplied values. No starter identity/blog route, public script, image/embed or invented canonical. Missing route, Posts/Welcome and /_styleguide/ all return 404; missing page body and noindex metadata are correct. See audit/local-route-check.json.
- Actual browser calibration/review: styleguide at 375/768/1280px before assembly; all public routes at 375/768/1280px and additional 320px checks; 404 at 320px. No document overflow observed. Home action/nav/404 recovery clicked; skip link and registration keyboard focus inspected. Email targets inspected without activating or sending mail. No public client scripts in production. See audit/rendered-review.md for precise evidence and limits.
- Impeccable mechanical detector returned [] on the requested page/layout/list targets. The bounded review uses one context; it is not claimed as its formal independent two-agent critique, full overlay review or cross-browser conformance assessment.
- `npm.cmd audit --json`: initially three high findings. After compatible `npm.cmd install --save-dev --save-exact sharp@0.35.5`, two high findings remain: Zod and dependent @google/design.md. The latter declares Zod ^3.24.0; npm reports no automatic fix, while the available patched Zod is a different major version. No forced override or major upgrade was applied. See audit/dependency-audit.json. A final pass is not security acceptance.

## Remaining acceptance and next steps

1. Operator independently inspect the running preview and decide whether to keep the reversible art-direction/interface-copy assumptions. Supplied editorial words, no fabricated logistics, list-only routes and file ownership have been preserved.
2. Maintainer resolve or explicitly accept the two development-tool audit findings before launch, using a compatible upstream @google/design.md update or separately reviewed tool replacement. Sharp is patched; audit status is not clean.
3. If needed for launch requirements, exercise other browsers/assistive technology, actual text resizing/zoom and custom text spacing. Current evidence is bounded Chromium rendering and keyboard/reflow review, not WCAG certification.
4. Choose the repository, host, real production origin, deployment operator/date and rebuild trigger. Commit the lockfile with source when a repository exists. Set SITE_URL only to the chosen real origin, build/verify again, deploy only dist/, configure native 404 status without SPA fallback, and validate TLS/rebuild/rollback and source backups.
5. The supplied .example.test email is synthetic. A local mailto inspection cannot demonstrate email delivery or a confirmed reservation. No test message was sent and no mailbox provisioned. Any future real endpoint must come from the coordinator.

No credentials, deployments, external messages or production changes were created. Work stayed within this generated project; registry installation and official documentation were the permitted external reads.

## Operator resource update — 2026-10-25

After independent browser/HTTP observations and a fresh verify/build/release-check
rerun, the operator stopped the recorded preview using the inspected guarded
script. Read-only checks verified PID 27052 absent and no listener on port 4362.
The preview URL above describes the completed observation, not a running server.
Source and dependencies are retained explicitly for review. Restart with the
documented project preview command when needed; record new ownership details.
