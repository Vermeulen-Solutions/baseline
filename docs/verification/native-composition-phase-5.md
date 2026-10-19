# Phase 5: native disclosure and intrinsic composition

This implements the planned 5A/5B starter slice. The
[portable composition contract](../native-composition.md) documents the APIs,
content restrictions and existing-site adoption. The
[calibration record](../../audit/component-calibration.md) binds token values and
rendered decisions to the shared styleguide. No client page, content schema,
runtime dependency or invented client Art Direction Record was introduced.

## Implementation and ownership

`Disclosure.astro` renders native details/summary, a required named summary slot
and a `.flow` body slot. Native attributes, marker, keyboard state and optional
name grouping stay browser-owned. Summary text and body content remain caller-owned;
there are no title/CTA props, cloned editor attributes, custom keyboard listeners,
hydration or generated FAQ schema. Native `open` remains an explicit caller choice.

`Cluster.astro` replaces the repeated wrapping control-row relationship.
`Sidebar.astro` expresses an unequal main/supporting region with a 60% main minimum
share, a reading-measure-based supporting basis and intrinsic wrapping. Both accept
native div attributes and open slot content. Main content remains first in the DOM;
an optional absent supporting region leaves a full-width main. Grid's existing
collection layout and narrow-host containment are unchanged.

`CompositionSpecimens.astro` exercises these actual production primitives.
The shared Styleguide explicitly supplies native Markdown as its fallback body;
the EmDash wrapper replaces it with the existing Portable Text adapter. This avoids
an empty transferred slot suppressing Astro's fallback content. Stable region
wrappers enclose editorial markup instead of allowing editor wrappers to become
unexpected flex children. No real writable CMS identities are present.

The original rendered dark disclosure exposed text links using dark action ink
at 2.34:1. Shared `--color-link` aliases now retain action ink by default, use
existing light focus ink on dark surfaces and restore action ink on light surfaces.
Site overrides are supported. The token checker adds four 4.5:1 text-link gates;
the browser journey checks actual computed colors. Current dark contrast is 8.79:1.
All 31 `@theme` values and lane presets are unchanged. Solid-action backgrounds and
labels retain their existing color contract.

## Verification

```sh
npm run verify
npm run test:design
npm run build
npm run test:visual
npm run test:profiles -- --public-browser --keep
```

Browser commands are local Windows checks and remain rejected in CI. The profile
runner performs independent install/clean-install, verify, typecheck, normal and
fixture builds, release isolation, HTTP checks and public browser journeys. It
does not authenticate or publish through Sveltia. Normal CI keeps HTTP-only profile
checks. The root visual harness uses a fresh synthetic database and owned temporary
server; the working database, credentials and media are not copied.

`tests/journeys/composition.mjs` is used by both browser harnesses. It verifies
Enter/Space activation, hidden body links excluded from tab order, meaningful native
summary names, independent and exclusive groups, visible/unobscured focus, native
markers, dark link contrast and real fragment reveal. Geometry checks exercise wide
and narrow hosts within wide viewports, long words, editorial wrappers, intrinsic
images, RTL DOM order and an absent optional supporting region. The existing no-JS,
320px text-spacing and actual Chromium 200%/400% zoom journeys also exercise these
components. The no-JS sentinel remains a real document script, not addInitScript.

The focused token regression reproduces the old dark-link failure and rejects a
link matching its background. The full design suite checks canonical lanes and
seeded palettes against the expanded audit. Generated HTTP acceptance verifies
native first-child summaries, closed defaults, group names, Markdown output and
the `.flow` wrapper even without starting a browser.
Restored-light audit scope inherits the dark ancestor before applying light
overrides; a regression test removes the link reset and requires that pair to fail.

The intended specimen extension updates nine existing full-page references and adds
six targeted open/closed composition references. Existing unrelated references are
byte-identical. The update command is followed by a non-updating comparison run;
comparison thresholds and renderer versions are unchanged. Fixture version advances
to 3, and server readiness now reads that contract instead of a literal version 2.
The final language review adds `lang="ar"` to the Arabic specimen heading. Strict
comparison detected its language-sensitive font fallback; the inspected pixel diff
was confined to that heading. References are updated through the authorized runner
and compared again, without a mask or relaxed threshold.

The first calibration and generated static run are superseded: inspection found
the link contrast defect, and the new browser guard rejected its old CSS at 2.34:1.
A fresh profile generation and final CMS runs use the corrected shared files.
The source inventory also needed to declare the new required link role; its final
token checks pass. No failing assertion or contrast threshold was weakened.

## Scope and remaining observations

Impeccable's context loader allowed scoped refinement against the incumbent system.
Its hardening guidance informed the narrow/wide rendered review; this was not a
formal dual-assessment critique command. A final mechanical scan across `src`
reported one advisory about punctuation density in existing Styleguide copy, with
no additional component changes warranted. Actual rendered review exposed the
contrast defect described above.

Automated evidence covers the pinned Windows Chromium renderer, not a general WCAG
certification. Manual screen-reader announcements, heading navigation, browser
toolbar Find, Firefox/WebKit, physical devices and real editor save/reload remain
pending. Real fragment navigation is tested; no synthetic beforematch event is
offered as proof of native Find. Arabic specimens exercise native direction and
system glyph fallback, not a certified multilingual font bundle.

The final [execution receipt](../../audit/verification/native-composition-phase-5-checks.json)
records commands, source/golden hashes, cleanup and limitations. Separate
[static](../../audit/verification/native-composition-phase-5-static.json) and
[Sveltia](../../audit/verification/native-composition-phase-5-sveltia.json) receipts
retain browser observations from independent installations. Generated projects were
deliberately kept with `--keep`; CMS temporary resources were cleaned by the harness.
