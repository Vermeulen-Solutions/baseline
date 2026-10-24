# Profile-aware agent maintenance

Follow-up: [exploration #8](https://github.com/Vermeulen-Solutions/baseline/issues/8)
and [implementation #9](https://github.com/Vermeulen-Solutions/baseline/issues/9).

## Request and concrete gap

The user wants to deepen the agent-first workflow, without a particular recent
site failure as the premise. A bounded source check found that the prompt
library's skill-sync recipe unconditionally requested EmDash helpers, while
the resolved static and static-sveltia manifests install only `sync:baseline`.
The adjacent maintenance recipes also omitted existing scope, content-ownership
and acceptance guidance.

This is a reproduced documentation mismatch. The earlier workflow replays do
not establish repeated real-site failures or a general productivity advantage.

## Implemented scope

The existing `new-site-workflow` skill now routes maintenance spanning several
site surfaces through request, affected sources, preservation, verification and
resumption. Its conditional reference covers spacing, fields, shared components
and routes. Existing specialist skills and installed commands still own the
implementation. The prompt library uses the same profile and ownership rules.

The new reference is explicitly allowlisted for fresh static and Sveltia
generation. The main skill includes a usable summary for older installations
missing the reference. Ordinary static sync retains its installed membership
ceiling; adopting a new file remains a reviewed addition. This change adds no
CLI, dependency, required project record or automatic external action.

## Bounded independent planning checks

Two fresh-context agent sessions inspected generated synthetic projects. They
received the user request and raw fixture only, without the intended answer.
Both tasks were planning-only: no installs, network, source edits, running apps,
credentials, editor acceptance or implementation claims were permitted.

| Case | Observed plan |
| --- | --- |
| Sveltia: optional integer `readingMinutes`, 1–60, detail display only | Paired schema/form/template; identified the existing form-test assertion and documentation; preserved legacy omission and listings; proposed real-loader boundary checks and separate authenticated clearing/save/commit/rebuild acceptance |
| Static: optional detail-only subtitle, new workflow reference absent | Used the main skill's fallback; preserved static editing and existing posts; found no required query projection change; proposed conditional rendering and installed static checks without adding CMS tooling or requiring the missing reference |

Both plans identified the absent client Art Direction Record and the visual
gate before future template implementation, while preserving the existing
tokens. They accurately left implementation and rendered acceptance pending.
The planning fixtures were disposable; no client data was involved.

These are agent reviews of source-based plans. They do not demonstrate actual
field implementation, editor behavior, every historical installation, or a
measured task-performance improvement. No new broad workflow replay was run.

Reviewed source base: `b2d30f6e69fa6516c8e38aa89f8208ecc3253dc8` with the local
changes above. LF-normalized SHA-256 binds the two reviewed instruction files:

| File | SHA-256 |
| --- | --- |
| `.agents/skills/new-site-workflow/SKILL.md` | `7a114f1459347790bad98a634eafac05d28c601ce51d133e943950e2446ca803` |
| `.agents/skills/new-site-workflow/references/site-maintenance.md` | `759aef18c600766e129326f75f04f42a3f61afecb4f049c22472f188fbab6472` |

Skill validation passed with Python UTF-8 mode; the default Windows encoding
attempt failed before validation. The 13 focused profile tests passed.
`npm.cmd run test:profiles` passed independent install/clean-install,
verification, production/fixture builds and HTTP checks for both static
profiles. Browser screenshots and authenticated Sveltia publication were not
part of those checks. npm emitted nonfatal cleanup warnings during installation.

Final root `verify`, fresh `build`, `audit:html` and `git diff --check` passed.
Astro reported zero diagnostics. The HTML audit inspected nine documents from
ten representative public responses; the existing bundle-size advisory remained.

The initial cleanup of the two source-only planning fixtures was blocked. Automatic
approval review rejected the ownership-checked native PowerShell cleanup and
then the narrower literal-path removal of the first fixture, each with
“blocked by policy” and no more specific reason. Neither command executed;
both directories remained at that point. No alternate deletion mechanism was attempted after
the narrower rejection. No app, dependency installation or credentials exist
in these planning fixtures. The generated-profile test command completed its
own cleanup separately.

## Cleanup resolution — 2026-10-25

The user reported manually deleting both planning directories. Read-only
`Test-Path -LiteralPath` checks returned `False` for each exact recorded path.
Cleanup is resolved; the failed automatic attempts above remain historical
evidence. No additional removal command was run.
