# EmDash 1.3 focused adoption review — 18 October 2026

**Passed: 11 focused runtime checks**, using EmDash 1.3.0, Node 24.21.0 and local
Windows Chromium. [Machine receipt](verification.json), [revision API response](revision-api.json),
[revision screenshot](revision-diff.png), [inline link controls](inline-link-controls.png).
The receipt records source hashes, the base Git commit and the dirty-tree flag;
this is working-tree verification, not a new standards release/certification.

| Area | Observed result |
| --- | --- |
| Contributor own draft | Native creation/update succeeded and the saved author matched the Contributor session |
| Contributor ownership boundary | Another author's draft update and lock acquisition returned 403 |
| Publishing boundary | Contributor publishing returned 403 |
| Status boundary | Contributor edits to own published/scheduled entries returned 403 |
| Owned draft lock | Contributor acquisition/release succeeded |
| Denied-request integrity | Canonical entry and revision list remained unchanged for every negative case |
| Revision attribution | Editor saw named revision authors without user-management permission; user management returned 403 |
| Revision UI | Additions/removals and author displayed; Show changes toggled; historical canvas was read-only |
| Standard restore | Restoring the previous version refreshed the canonical draft and returned the standard host to editing automatically |
| Inline controls | Turn into opened, bold applied, bare-domain link gained `https://`, caret preview exposed edit/remove without navigation |
| Inline persistence | Link creation survived save/reload; editing and removal worked; final reload retained bold and no link |

`verification.json` contains the 11 independent check receipts (some table rows
describe multiple assertions in one check), zero observed browser runtime errors
and confirmation that the owned server stopped. `server.log` records the native
request statuses, including expected authorization denials.

## Fixture boundaries

The rehearsal created a fresh project and database under ignored `.emdash/checks/`.
It reused the installed packages through an owned dependency link; it was **not**
an independent npm installation. No existing database, media or credentials were
copied. Three synthetic user sessions were provisioned with the installed auth
adapter through an explicitly injected, dev-only fixture endpoint guarded by an
Admin session and a random in-memory key. The normal EmDash middleware, session
role resolution, CSRF handling, content routes and authorization stayed active.
The endpoint/configuration exists only in the disposable copy, never in Baseline's
public source or a generated static project. Its dependency link was removed and
server stopped; synthetic fixture files remain in ignored checks for inspection.

Cold dev imports can trigger Vite dependency optimization and reloads; the initial
inline-island readiness wait allows for that. The final run's browser errors were
empty. Setup/selector mistakes during harness development are not application
regressions or passing feature receipts; the final JSON reports the completed run.

Reproduce with `npm run check:emdash13` locally. It is deliberately excluded from
automated screenshot CI. Root verification/build receipts are recorded separately
in [repository checks](repository-checks.json).

## Downstream source review

A separate read-only audit of the requested downstream custom plugin found a
custom field extension, not a ContentEditor host or `onRevisionRestored` callback.
The other native extension is a server-side beforeSave hook. No callback adaptation
was indicated by those sources. The numeric term-creation guard matches Editor /
Admin, and installed core/Cloudflare package versions agree at 1.3.0. Client source
hashes and detailed findings remain in a private report outside both repositories,
as required by that site's maintenance rules. The client checkout remained clean.

## Scope limits and guidance

This does not certify client production behavior, external login/passkeys, D1
batching/latency, third-party plugin packages, every editor block/image operation,
or a real WordPress migration. The downstream review is source compatibility
evidence, not a live staff-editor save/restore test. The AI-training setting and
importer changes are documented from the installed implementation and upstream
references; no live site's crawler policy or content was changed.

See [1.3 guidance](../../docs/emdash-1.3-upgrade-review.md) and
[WordPress modeling](../../docs/wordpress-content-modeling.md). Upstream references:
[release](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.3.0) and
[migration guide](https://docs.emdashcms.com/migration/from-wordpress/).
