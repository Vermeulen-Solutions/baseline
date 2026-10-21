# Evaluation notes — CMS Journal trial 3

## Scope and choices

Worked only in this assigned trial. Read site AGENTS.md, README, package scripts, existing Posts/index/Base/RichText implementation, installed building-emdash-site and emdash-cli skills, the Astro presentation skill and relevant content/accessibility references. Verified public query and preview semantics with the EmDash Docs MCP against installed EmDash 1.3.0. No delegation, external writes, production systems, remote authentication or content-model changes.

Used the existing Editorial Paper Art Direction Record and its collection-list/article-stack/Section/RichText presentation. Art-direction pre-write gate passed. Existing layout tokens, CSS, Posts routes and shared shell are unchanged. Journal is an additional public presentation of the same Posts collection; the Posts label and original public URLs remain available. No pagination requirement was inferred for this existing unbounded collection query.

## Actual changes

- Added server-rendered `site/src/pages/journal/index.astro`, published Posts only, newest published first, real title/excerpt/image/date and title/excerpt edit annotations, Journal detail links, empty state and query-error handling.
- Added `site/src/pages/journal/[slug].astro`, querying the existing Posts collection with native preview/edit behavior; unavailable entries rewrite to the real 404 page. Uses real title, excerpt and unmodified rich content through RichText; passes content identity, metadata/cache hints and field proxies.
- Added Journal to `site/seed/seed.json` primary menu and the actual disposable CMS primary menu. The authorized dev-bypass setup endpoint re-applied seed structure; existing Posts/Pages content remained intact.
- Classified both new CMS-only routes in `site/profiles/file-inventory.json`, satisfying the bounded source inventory instead of disabling its test.
- Recorded route/content ownership in site AGENTS.md.
- Installed the requested local Git pre-commit hook inside this trial's `.git/hooks`.
- Kept reproducible Playwright acceptance script and screenshots/JSON/log receipts at trial root (`acceptance.mjs`, `evidence/`).

## Acceptance performed

`evidence/acceptance.json` records a real browser journey using the disposable local development account. This was actual UI interaction, not API substitution for editing:

1. Anonymous `/journal/` and Journal detail show `Planning your first workshop`, excerpt `Make the first conversation useful.`, and rich paragraph `Start with a clear purpose and a manageable group.`.
2. Anonymous Journal links/nav work; `/`, `/about`, `/posts` and the original `/posts/planning-your-first-workshop` remain 200.
3. `/journal/unannounced-workshop/`, its forged `?edit=true` variant, and a nonexistent Journal slug return 404 without draft content. The listing omits the draft.
4. Enabled actual EmDash toolbar edit mode; selected and typed into title, excerpt and Portable Text; blurred each field and observed successful save responses. Reload verified saved editor values. A separate anonymous context retained original published values until publication.
5. Published from the real toolbar. Anonymous Journal detail and listing reflected changed values. Restored all three original values through the same live UI, republished, and verified public output again. The draft remains a draft. Revisions produced by this acceptance remain in the disposable CMS.
6. Checked 1280, 768, 390 and 320px widths, no horizontal overflow; captured full-page evidence and inspected desktop/mobile screenshots. Confirmed the keyboard skip link and no anonymous editable elements. Browser page errors: none.

## Verification and friction

- `npm.cmd run doctor`: passes Node 24.21.0/SQLite/workspace checks; warns about Windows launcher choice and initial dirty generated `emdash-env.d.ts`. That generated file was already dirty before work; it was not manually changed.
- `npm.cmd run setup:hooks`: passed.
- `npm.cmd run check:art-direction -- --require-record`: passed before implementation.
- `npm.cmd run verify:fast`: lint/CSS/art-direction/token audits passed. First run exposed an expected unclassified-new-source failure, fixed by explicit inventory entries. It also exposed four unrelated existing starter fixture assumptions, retained unchanged.
- `npm.cmd run verify`: lint, CSS contracts, art-direction record and token/proxy/contrast audits pass. Unit tier: 145 tests, 141 pass, 4 fail. Full runner stops before rehearsal/typecheck when unit fails, so those were invoked separately. See `evidence/verify.log`.
- The four retained failures: design-interchange neutral specimen mapping is stale against this site's Editorial Paper tokens; token-coverage CRLF fixture replaces LF in already-CRLF source, producing doubled CR; neutral-palette fixture assumes the actual CSS is untouched neutral; starter-exception-pruning fixture assumes sample exceptions remain in an already initialized client site. Tests and production checking logic were not removed, disabled or weakened. The relevant source files/CSS/exceptions were unchanged by this feature.
- `npm.cmd run typecheck`: 55 files, 0 errors/warnings/hints; see `evidence/typecheck.log`.
- Full build/HTML audit and separate rehearsal result are appended below when complete.
- Initial CMS menu API POST was rejected 403 for missing `X-EmDash-Request`; no menu change occurred from that request. The subsequent supported local setup/seed path supplied Journal, and the live nav was verified. Authentication was strictly local/disposable.
- Early fast checks used the inherited process TEMP; subsequent full/rehearsal commands set TEMP/TMP inside this trial. All authored source and evidence writes stayed in this assigned trial. Baseline's own verification tools create disposable subprocess fixtures; none were intentionally directed to another trial.

## Final checks and handoff

- `npm.cmd run build`: passed, Node server artifact and release-artifact guard complete (`evidence/build.log`).
- Separate production-server anonymous browser acceptance passed on loopback after build (`evidence/acceptance-production.json`): Journal title/excerpt/rich body/nav; preserved existing routes; draft and missing detail URLs are real 404; forged edit query does not expose draft; responsive and keyboard checks. This production run was public-only; the actual live edit/save/publish journey was verified against the development renderer, not re-claimed for the production artifact.
- Initial `npm.cmd run audit:html` failed the existing 3.5-second deadline while the rehearsal tier was concurrently active. Retried the same command, same build and unchanged limits after that suite ended: PASS, 9 HTML files, 10 public responses, 1712.2ms (`evidence/html-audit-retry.log`). The failed first receipt is retained.
- `npm.cmd run test:rehearsal`: 132 tests, 112 pass, 20 fail (`evidence/rehearsal.log`). Nine baseline-sync and two static-profile-generation cases reject the supplied site's missing neutral-CSS infrastructure exception. Importer/migration cases reject existing fixture byte/hash drift (CRLF serialized fixtures versus LF oracle/bound reports). These are outside this Journal feature; all checks and their budgets remain unchanged. This repository's full verification is therefore **not green**.
- All owned browser contexts, development server, production server and audit-owned server were stopped. A final process query found no Node command line referring to this trial. No process belonging to another trial was stopped.
- No screenshots were accepted as replacement visual regression goldens. No tests, checks, budgets, or exact infrastructure exceptions were weakened to obtain a green result.

Result: requested Journal behavior and actual local live-editor acceptance established. Existing full-suite fixture failures remain a handoff limitation rather than a feature success claim for the entire Baseline suite.
