# EmDash 1.3 adoption and verification

This guide applies to the `emdash` Platform Profile. Static and Sveltia sites do
not acquire EmDash settings, admin callbacks, permissions or database adapters.
The release reference is [EmDash 1.3.0](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.3.0);
consult the installed package as well as current documentation when adapting code.

## Native AI-training opt-out

Settings → SEO exposes **Disallow AI training**, off by default. Its API/MCP value
is `seo.disallowAiTraining`; choose the policy with the site owner and save it using
the native settings UI, settings API or `settings_update` MCP tool. Preserve other
SEO settings when updating this property.

When enabled, EmDash's `/robots.txt` appends named training-crawler exclusions and
`Content-Signal: search=yes, ai-train=no` to its default or custom robots content.
Existing search rules remain authoritative. Inspect the actual response after
saving, including any CDN cache or custom robots file/route that could shadow it.
The directives are voluntary crawler requests, not access control or a guarantee
that training stops.

Do not add a parallel `tdm-reservation` header or hardcoded training-crawler list
to `Base.astro`/`SiteShell.astro` to enable this feature. The native robots route
owns it. Baseline retains the upstream opt-in default. Static sites manage their
own intentional robots policy independently.

## Roles and external authentication

| Value | Role | Relevant authority |
| --- | --- | --- |
| 10 | Subscriber | Published-content access |
| 20 | Contributor | Create content and edit owned drafts; cannot publish |
| 30 | Author | Edit and publish owned content |
| 40 | Editor | Manage content across authors |
| 50 | Admin | Site, users, schema and configuration administration |

Audit external authentication `defaultRole`, `roleMapping`, invitations and custom
role checks by numeric value. Older hints mislabeled 30 as Editor and 40 as
Developer. **30 is Author and can publish**; use Contributor 20 when publishing
must remain an editorial responsibility. A UI-hidden button is not authorization.
Verify token scopes and the account role together on REST/MCP requests.

The new `content:edit_own_drafts` permission permits Contributor saves, locks and
taxonomy assignments for owned drafts. Verify own draft creation/update, another
author's draft rejection, publish rejection and published/scheduled edit rejection.
Use fresh revision tokens so concurrency errors cannot masquerade as permission
enforcement. Confirm denied requests did not mutate content or create revisions.

## Revisions and custom ContentEditor hosts

The revision-list REST API and `revision_list` MCP tool include `author` as
`{ id, name }`, or `null` for an unknown/deleted author. Preserve the null case;
do not require user-management access just to show revision attribution.
The standard admin shows historical content read-only with additions/removals,
author labels, a Show changes control and a restore action. Check both the API
metadata and actual editor UI; an API response alone does not verify diff display.

`ContentEditor.onRevisionRestored(item)` may return `void` or `Promise<void>`.
When supplied, the host must refresh the `item` prop to the restored draft before
normal editing resumes. Hosts reading the editor's standard content query already
receive its invalidation. Hosts storing an entry elsewhere should await a reload
and update their own state from the canonical server response. Test success,
rejected refresh and return to editing; do not resolve a callback before that host
has refreshed. A custom field extension alone is not a custom ContentEditor host.

## Plugin MCP tool names

Scoped plugin tools use normalized names: `@acme/calendar` with tool `list_events`
is exposed as `acme__calendar__list_events`. Plain plugin IDs retain their existing
names. Audit saved agent prompts, client tool allowlists, automation calls and
tests against the connected server's actual tool list. Keep plugin identity and
published package IDs intact; only update the externally exposed tool references.
An unreadable plugin tool schema no longer blocks unrelated tools from loading.

## Bylines and guest defaults

Creating a byline from the post editor now opens the full byline form. A new byline
is not a guest unless **Guest byline** is selected; existing bylines do not change.
Check any template branching on `byline.isGuest` against representative new and
existing credits. Custom `onQuickCreateByline`/`onQuickEditByline` callbacks receive
the full form, including `isGuest`; preserve that explicit value when saving.
Do not rewrite existing credits or silently force new bylines to be guests.

## Inline editorial acceptance

On a disposable instance, exercise the real Base layout and registered field
proxies. Check selection toolbar formatting and Turn into, creation of a bare-domain
link with `https://`, caret link preview, edit/remove controls, save/reload and
canonical Portable Text. Empty rich-text fields should mount an editor. The `/image`
picker selects existing library assets; upload new media through the Media Library
first. Verify alt/caption behavior separately when adopting image editing.

## Cloudflare-specific follow-up

Pin `emdash` and `@emdash-cms/cloudflare` to the same version; dev/build warnings
are diagnostics, not version compatibility proof. Root Node/SQLite does not need
the Cloudflare package. On a D1 target evaluate
`d1({ binding: "DB", session: "auto", coalesce: true })` against that adapter's
installed API. Coalescing needs a session and remains experimental; explicitly
await a read before any concurrent write that must not affect it. Measure actual
request/query latency on Workers and preserve schema/backup checks. Local SQLite
tests do not certify D1 batching, read replicas or remote performance.

## Reproduction and receipts

`npm run check:emdash13` is an optional local browser/runtime check. It creates a
fresh disposable project/database, reuses the installed packages, starts its own
loopback server and provisions synthetic users through a test-only authentication
route that exists only in the disposable copy. Real EmDash authorization and
session role resolution remain active. No working database, credentials or uploads
are copied, no email is sent, and no downstream deployment is mutated.

The command writes synthetic API/browser receipts and screenshots to
`audit/emdash-1.3-review-2026-10-18/`. It is not part of automated screenshot CI.
Read the receipt's observed statuses and limitations before treating a feature as
verified. Downstream client source audits are private reports outside Baseline
and the client checkout; they do not certify a live deployment.
