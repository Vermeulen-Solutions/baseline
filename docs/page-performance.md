# Local public-page evidence

Use the optional page audit after a production build or against an owned local preview when loading, resource cost, layout shifts or actual font rendering needs evidence. It uses the installed browser runner, adds no website scripts or tracking, and is excluded from normal verification, CI and production builds. It does not calculate a universal score or impose a site-independent performance budget.

Start the site's normal local production preview and use the exact HTTP loopback URL it prints. Choose a public route; administrative/API target pages, credentials, queries, fragments and remote URLs are refused. The browser uses a fresh anonymous context and never imports an existing browser login. In Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force .emdash/checks | Out-Null
node scripts/audit-page.mjs --url http://127.0.0.1:4321/services/ --out .emdash/checks/services-phone-001 --label reviewed-build --width 390 --height 844 --runs 3
node scripts/audit-page.mjs --url http://127.0.0.1:4321/services/ --out .emdash/checks/services-wide-001 --label reviewed-build --width 1440 --height 900 --runs 3
```

The destination must be new, its parent must already exist, and all path ancestors must be real directories. Existing outputs and links/junctions are refused. Use ignored `.emdash/checks/`, `.emdash/visual/` or `.baseline/backups/` inside the current project, or an explicit destination outside it. Reports are local evidence, not site content; keep them out of Git and production artifacts. The command never reads `.env`, cookies, authorization headers, database contents or page response bodies. A public page is still executable site code: use a disposable/authorized local instance rather than a logged-in production browser.

## What the receipt contains

Each fresh `page-evidence.json` records the browser version, operator-supplied non-secret build label, exact requested page, viewport/device scale, run count, settle window, timeout, CPU setting and request/cache policy. The label is a reference supplied by the operator, not an automatically verified build hash. Default conditions are three fresh anonymous browser contexts, a 390×844 viewport, device scale 1, reduced motion, browser cache disabled, service workers blocked, CPU slowdown 1 and an unthrottled loopback connection. Origin/server cache state is uncontrolled and is stated explicitly. `--cpu-rate 4` requests a fourfold browser CPU slowdown; it does not simulate a particular phone or network.

`--width` accepts 240–3840, `--height` 240–2160, `--runs` 1–5, `--settle-ms` 250–10000 (default 1500 after load), `--timeout-ms` 1000–30000 (default 15000), and `--cpu-rate` integer 1–20. Each run has a separate context-close deadline beyond its navigation timeout and settle window. Requests and retained resources are bounded at 256; layout-shift observations are bounded at 1000. Bound exhaustion is explicit and makes the result incomplete.

The report contains:

- Navigation and first-contentful-paint timings, the latest observed largest-contentful-paint entry, and the largest one-second-gap/five-second layout-shift session window observed without recent input. These are bounded lab observations, not final field metrics. Unsupported/missing observations remain null rather than inferred.
- A status/type/MIME summary and received encoded bytes from completed browser-protocol loading events. Pending, failed and prior redirect-hop transfers can make the byte sum incomplete; source bundle size, decoded body size and network transfer are different quantities. The resource list identifies failures and pending transfers separately.
- Runtime error categories, navigation failure, blocked requests and horizontal overflow. Console text and exception details are withheld, so the receipt does not become a dump of page data.
- Font observations for the first `h1`, first `main p` and `body`: requested CSS family/weight/style/size alongside actual platform-font family, PostScript name, custom/system status and rendered glyph counts from `CSS.getPlatformFontsForNode`. FontFaceSet status and failed font resource loads are supporting evidence. A family declaration, package entry or `document.fonts.ready` is not proof of which face rendered. Nodes without direct child text can legitimately report no rendered glyphs; these samples are not an exhaustive font inventory. CSS weight is requested weight, not proof of a specific variable-axis or font file selection.

Only same-origin GET/HEAD requests are permitted. CMS administrative/setup/auth/API resources under `/_emdash/` are refused except the public `/_emdash/api/media/file/` asset path. Navigation to administrative/API target pages is refused even when initiated by a script or redirect. Ordinary same-origin public API subresources remain available. External resources, cross-origin redirects, mutating requests, all WebSockets and excess requests are blocked and recorded. Resource URL credentials, queries and fragments are omitted. This policy can change a page that relies on remote assets or calls; such a run is incomplete and cannot establish normal deployed behavior. The audit performs no clicks, scrolling, submissions or user interaction. It does not exercise below-fold lazy images, recovery flows or interaction responsiveness.

`observed` means the bounded load completed with successful document status, no runtime/resource/scope failures, no unresolved transfers and at least one actual rendered-font sample. It does not mean fast, accessible or approved. `incomplete` retains available evidence and exits 2; invalid/refused input also exits 2. An observed collection exits 0. Record site-specific budgets/acceptance decisions beside the site's existing evidence rather than treating this exit code as a performance grade.

## Favicon interpretation

The neutral starter's platform layouts explicitly reference the shared `favicon.svg` document glyph, with the deployed base applied. Replace that owned asset or the site's wrapper reference when establishing real identity. The CMS layout emits this fallback only when no resolved site favicon is configured; the native platform head retains ownership of a configured icon. These unchanged-URL icon files deliberately live under `public/`, outside content-image optimization.

The pinned browser runner cancels routed requests whose URL ends in `/favicon.ico` before invoking route callbacks. Protocol observations still expose a canceled transfer, even when a separate ordinary HTTP request would return 200. The audit retains that cancellation as `incomplete`: it does not prove the deployed icon is missing, and the audit does not suppress the failure, add query-string bypasses or silently replace the site's icon. Diagnose an ICO cancellation with an ordinary authorized request as separate evidence. Explicit SVG icon requests avoid this runner-specific ICO behavior; an actual missing SVG or other asset remains a resource failure and must still make the audit incomplete. An icon redirect/404 and an automation cancellation can coexist and require separate interpretation.

## Use in the delivery workflow

Choose representative route archetypes and states from the brief, including the page with the heaviest real content or a suspected loading problem. During component calibration, compare requested typography with actual glyph-family readback and visually inspect the rendered result; legitimate family aliases or multilingual fallback need interpretation. Inspect failed font requests and repair actual paths/configuration rather than accepting a fallback as the chosen face. The same distinction applies to images: successful stored upload is not proof of native public delivery.

Keep browser/CPU/network conditions consistent when comparing a change, retain both receipts and explain altered server cache or scope. Use the actual metric/resource changes and visible behavior to assess a repair. Collect field evidence only when separately in scope; this tool adds no analytics, real-user monitoring or external performance service. Continue normal keyboard, responsive, image, editor/publication and route acceptance. A performance receipt does not replace them.

## Local verification

Pure parser, bounds, path-preservation and session-window tests run with:

```powershell
node --test tests/page-audit.test.mjs
```

Explicit local browser fixtures verify a self-hosted custom font's actual glyph use, fallback after a missing font, received bytes, cold repeated loads, blocked remote/mutating requests and query redaction:

```powershell
$env:BASELINE_PAGE_BROWSER_TESTS = '1'
node --test tests/page-audit.test.mjs
Remove-Item Env:BASELINE_PAGE_BROWSER_TESTS
```

The browser fixture path refuses CI and never joins automated CI or a production build. It uses existing dependencies and local synthetic HTTP servers; it installs no browser or package. See the primary [protocol font API](https://chromedevtools.github.io/devtools-protocol/tot/CSS/#method-getPlatformFontsForNode), [received-transfer event](https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-loadingFinished), and [lab/field distinction](https://web.dev/articles/lab-and-field-data-differences) for the underlying evidence boundaries.
