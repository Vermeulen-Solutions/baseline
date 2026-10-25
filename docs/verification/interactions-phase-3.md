# Phase 3: foundational interaction journeys

This slice extends the existing local browser harnesses. It adds no public framework, screenshot runner, submission service or browser CI job. The research and plan were committed as `2d7e88b`; the jointly verified CMS/static metadata checkpoint is `cca6a10`.

## Ownership and changes

`tests/journeys/public.mjs` shares a few browser assertions between the CMS suite and the static pilot: first Tab to the skip link, native activation into main, next Tab to a known main control, visible/unobscured focus, label/error references, summary-link activation, reduced motion and 320px text spacing. Focus checks recognize the existing `.focus-parent` ring around stretched Card links. They wait for the focused state to render; they do not add focus or CSS to repair the page.

The shared specimen's error text previously lived inside its input label and became part of the accessible name. It now sits outside that label with the same grid spacing, while `aria-describedby` supplies the description. The browser assertion requires the name to remain `Required sample` and the error reference to resolve. Native select lookup uses its computed combobox name; a DOM label text locator also includes option text and is unsuitable for that exact lookup.

`FormError.astro` adds optional native `autofocus`, defaulting off. The synthetic form chooses summary focus after a server response, plus a changed document title and field-linked errors. An alert role alone is not used as proof that a screen reader announces a newly loaded document. No document script is needed for this focus policy.

## Synthetic CMS recovery route

`src/dev/FormRecoveryFixture.astro` is injected at `/_form-recovery` only in development and explicit fixture builds. Static profiles omit the source and route. It uses the existing Astro session helpers and has no EmDash content query or external side effect.

The primary submit button preserves native required/email validation. A separately named fixture button uses `formnovalidate` to exercise server errors deliberately. Invalid submissions use POST → 303 → GET when sessions exist. The GET consumes the retained state. `?mode=no-session` deliberately supplies an undefined session; that response returns 422 with bounded values and errors inline, so correction still works. This simulates absent session support, not a failing storage driver. Successful synthetic submissions use a 303 and explicitly say no message was sent.

Each JS-enabled/disabled journey checks:

- Native required-field rejection before POST and actual server status codes.
- Error-summary focus, error links, resolved field descriptions and invalid state.
- A second invalid submission retaining the unrelated error and entered values.
- Correction and a successful result without email, payments or business APIs.
- A second GET receiving no consumed state; success leaving no recovery values.
- A 4,000-character input bounded to 2,000 characters, with unallowlisted/secret request values absent from the response.

Fast helper tests additionally exercise the 16,000-character total, 80-field and 120-character reason bounds, explicit secret-key exclusions, form namespaces, 600-second expiration and unavailable sessions. Expiration is tested with a controlled helper session; the browser suite does not wait ten minutes.

The normal CMS build reserves the fixture path before the CMS catch-all. The existing owned bootstrap checks GET/HEAD/POST 404 even with runtime/query/cookie fixture flags, and scans normal server chunks for the form's marker. The separate fixture artifact is rejected by the release guard. A runtime flag cannot add these routes to a release.

## Run locally

From Baseline on the pinned Windows renderer:

```powershell
npm run test:visual:functional
npm run test:profiles -- --public-browser
npm run verify
npm run build
```

The CMS command retains the existing motion/pause/RTL/print, no-JS gallery, text-spacing, real Chromium 200%/400% zoom and screenshot comparisons. It does not update goldens. It uses the owned fresh-database bootstrap and never copies the working DB, media, env or credentials.

`--public-browser` generates and independently installs static profiles, then runs their normal HTTP checks and public browser journeys. CI rejects this flag before assembly; ordinary `npm run test:profiles` still performs HTTP-only checks. For an already independently installed, verified and built project:

```powershell
node tests/static-pilot.integration.mjs --root C:/dev/my-static-site --site-url https://my-site.example --public-browser --out audit/verification/local-static-interactions.json
```

Use the same `SITE_URL` as its build and run `fixtures:build` first. The output parent directory must exist. The pilot remains scoped to the starter's default routes/directory policy. Public journeys block unexpected origins, check response identity, loaded images and page errors, and use a real document-script sentinel to prove JavaScript is disabled. Privileged browser `evaluate()` is not that proof.

Static coverage includes keyboard skip/error journeys at 390/768/1440px, reduced motion, 320px text spacing, and a 390px no-JS navigation/native-control/image case. Actual browser zoom remains in the authoritative CMS suite. Static forms do not gain a server handler or session promise through this shared markup.

The older `--browser` pilot mode still includes the separate Sveltia bundle/sign-in smoke check. `--public-browser` keeps generic public acceptance independent of that remote admin integration. Neither mode proves credentialed Git publishing.

Existing static sites can review the compatible shared `FormError`, `Styleguide` and developer-tools integration changes through their installed sync membership. No new static file or npm dependency is required. The root browser journey modules are maintainer tooling, not implicit downstream additions. An existing EmDash site adopting the synthetic route must take the fixture, conditional injection, release guard and verification together; the fixture is not a replacement for its real form handler. Preserve client-owned validation, navigation and calibrated tokens.

## Results and limits

The [Phase 3 receipt](../../audit/verification/interactions-phase-3-checks.json) records commands, current source hashes and profile results. The Windows CMS functional suite passed 26 tests, with four intentional viewport-specific skips: text-spacing runs once at 320px and actual zoom once in the desktop placement. Existing screenshot goldens were unchanged. Per-test attachments record the keyboard and form states; ignored local reports remain under `.emdash/visual/`.

Manual screen-reader output, human keyboard usability review, browser engines other than the pinned Chromium, storage-driver outages, hosting delivery and credentialed Sveltia publishing remain untested. This is automated interaction acceptance, not a WCAG conformance claim. Before client release, check representative summary/field announcements and skip navigation with the project's actual screen-reader/browser combination and record those observations separately.
