# Motion and capability routing trial — 6 November 2026

Baseline now routes a requested capability through the user's chosen surface and actual delivery runtime. The shared [capability reference](../.agents/skills/site-art-direction/references/capability-routing.md) connects installed guidance, targeted external discovery and a representative working test. Root/generated instructions, the site workflow, art direction and Astro skills all expose this route. Brilliant's adapter supplies one native motion path. No new surface, animation dependency or global skill installation was needed for this trial.

The immediate recommendation is to use the installed Impeccable motion reference for UI motion craft, then execute through the selected surface and website runtime. Discover another skill when the task exposes a concrete gap. The mechanism also routes imagery, editable vectors, charts, 3D and video; those additional integrations were not exercised here. This is documented agent routing with tested artifacts and distribution checks, not an automated skill installer or a certification of future model adherence.

## What to review

| Artifact | How to review | What it proves |
| --- | --- | --- |
| [Interactive browser study](visual-concepts/brilliant-motion-2026-11-06/browser-motion.html) | Open locally; select steps, replay/stop, use longer copy, then change the operating system's motion preference. Refresh after file changes. | Native HTML and WAAPI can implement the interaction independently of Brilliant, with actual controls and reduced-motion handling. |
| [Native film](visual-concepts/brilliant-motion-2026-11-06/workflow-final.mp4) | Play the six-second MP4. | Brilliant rendered native state transitions, changing text/colour, blur and per-element stagger. |
| [Film contact sheet](visual-concepts/brilliant-motion-2026-11-06/workflow-final.contact.png) | Inspect the sequence at full size. | Visual timing/composition evidence; a contact sheet alone does not prove live playback. |
| Native Brilliant project | Open the existing local project `C:/dev/baseline-designs/Baseline`, then `Studies/Motion/Storyboard`; the film is `Studies/Motion/Motion/Workflow.bm`. | Editable source states and a saved native timeline in the same named project as earlier studies. |

This is a focused capability study using the earlier Baseline mockup's dark/lime visual language, not a new client direction or production route. Copy describes the design workflow and is illustrative. Existing project canvases, Scratch, production data and site tokens were preserved. The native project remains unpublished and outside Git; authored native batches and saved timeline readback are retained in the audit evidence.

## Installed and external guidance

The repository already includes Impeccable's `reference/animate.md`: purpose, timing/easing, interruption, reduced motion and choosing an appropriate implementation. Its context command accepted this as a scoped refinement of an existing visual implementation. The native path also used the installed Brilliant `motion/core`, grammar, behaviors, craft/review and motion-fill guidance. Version-matched schemas remain authoritative for execution. We did not mirror vendor manuals into Baseline or alter upstream Impeccable instructions.

The owner's [OpenDesign catalogue](https://open-design.ai/skills/#catalog) is useful for targeted discovery across runtimes. Its entries include independently maintained sources; being listed does not make a skill installed, native to OpenDesign or compatible with a particular canvas.

| Original source inspected | Suitable use | Evidence boundary |
| --- | --- | --- |
| [Emil Kowalski's animate skill](https://github.com/emilkowalski/skills/blob/main/skills/animate/SKILL.md) | UI motion principles and interaction details | Entry point read; not installed as another skill. Project/runtime requirements still govern. |
| [GreenSock's GSAP core skill](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-core/SKILL.md) | DOM/SVG timelines when GSAP is adopted and justified | Entry point read; GSAP was not added or tested. |
| [Remotion create skill](https://github.com/remotion-dev/skills/blob/32b241b97f4e0e4ab61fe9a41b05e6e64503f8c5/skills/remotion-create/SKILL.md) | Rendered video with the required React/Remotion project | Entry point read at the linked revision; this runtime was not installed or exercised. |
| [Catalogue-linked HyperFrames motion-graphics source](https://github.com/heygen-com/hyperframes/blob/main/skills/motion-graphics/SKILL.md) | Potential video guidance | The linked source returned 404 during this check; no claim of usable integration. |

The routing reference therefore distinguishes catalogue discovery, original-source inspection, installation and an actual integration test. Source availability must be checked again at use time. Vendor preferences to install a library or use another framework do not supersede the site's brief or Astro runtime.

## Brilliant motion test

Desktop version was `1.0.0-beta.113`. Three ordinary 960×540 native frames represent Brief → Concepts → Astro proof. Shared layer names pair states; a `.bm` timeline holds readable states and transitions between them with local blur/stagger. The treatment explains the deliberate reading holds. All writes to `.bl`/`.bm` went through MCP `edit` in the existing named Baseline project.

The exported film is H.264, 960×540, 30 fps, 180 frames and 6.000 seconds, with a file size of 935,732 bytes. The final export was inspected through its contact sheet and motion diagnostic images. Saved canonical readback includes the corrected local behaviors; decoded-frame comparison against the previous film found 90 changed frames out of 180. Both files happened to have the same byte count, so size alone would have missed that revision.

Observed failures and limits:

- `export.background: true` was refused by the installed schema, where `background` is the `clear/window` paint enum. Removing that unsupported boolean allowed MP4 rendering. General background-job documentation was insufficient for this actual call.
- `all(name(Step))` did not match the intended `Step number 0`/label/description layers. Explicit returned refs worked. The rejected write left the previous film saved, and export still succeeded with the old film; saved-state readback was essential before claiming the new timeline had landed.
- The final film retained an informational peak-motion/blur diagnostic. Reading holds over one second were deliberate for this UI tour and documented in the treatment. This was not a clean pass against every launch-film craft criterion.
- A native Playback canvas with a motion fill was created and displayed, but only its first frame was observed. Live in-canvas playback remains unverified. The tested review deliverable is the MP4; fill creation and `presented: true` do not prove playback.
- Springs, audio, custom JavaScript motion programs, the standalone renderer and cloud/web MP4 export were not exercised. Native film support does not establish any of those paths or interactive website behavior.

The [Brilliant skill](../.agents/skills/brilliant-site-design/SKILL.md) and its [mapping reference](../.agents/skills/brilliant-site-design/references/baseline-mapping-and-export.md#native-motion) carry these operational lessons, including `.bm` write ownership, stale saved films after a rejected edit and the need to inspect the actual output.

## Independent browser test

The [HTML study](visual-concepts/brilliant-motion-2026-11-06/browser-motion.html) uses semantic buttons, CSS and the Web Animations API without an animation package. Content and selected state commit independently of the animation; obsolete timers are cancelled and replay callbacks have a generation guard. An interrupted marker starts from its painted position. A user-triggered tour has stop/manual-selection controls. Reduced motion stops an active tour and keeps all steps available without animation.

Initial review found a contrast risk: immediately changing selected-label colours while a full-row background was still travelling could expose dark labels on a dark panel. The final version uses a three-pixel sliding edge marker outside label paint, with readable selected-label colours throughout. Impeccable's final detector retained only the generic Arial warning; this mechanical comparison intentionally preserves its reference typography. It was not treated as a production typography recommendation or a zero-warning design audit.

The [reproducible Playwright harness](visual-concepts/brilliant-motion-2026-11-06/verify-browser.mjs) passed at 390, 768 and 1440 pixels. It exercised real animation, painted-position continuity on interruption, rapid overlapping selection, keyboard activation and visible focus, stop before a scheduled transition, repeated replay followed by manual selection, long copy, reduced-motion input and preference changes during playback, a complete six-second tour, and a JavaScript-disabled fallback. It recorded zero `pageerror` or `console.error` events. Screenshots at all three widths were visually inspected; long copy remained readable and controls reachable without horizontal overflow. No Astro navigation hooks changed, and this standalone study does not certify BFCache or production route integration.

Run from the repository root:

```powershell
node audit/visual-concepts/brilliant-motion-2026-11-06/verify-browser.mjs
```

Receipts include [browser checks](visual-concepts/brilliant-motion-2026-11-06/browser-checks.json), [observations](visual-concepts/brilliant-motion-2026-11-06/observations.json), [native calls](visual-concepts/brilliant-motion-2026-11-06/receipts.json), [saved film](visual-concepts/brilliant-motion-2026-11-06/saved-film.txt), authored batches, treatment and export timings. Session refs in the authored film require remapping in a fresh project; saved readback and call receipts retain actual native identities. Export timings measure renderer operations, not model-token use. No comparative speed or token-efficiency result is claimed.

The shared reference is explicitly allowlisted for every generated profile. Existing source classification excludes skills from the file-inventory scope; the skill manifest is their distribution authority. The profile regression checks its presence and the transitive local links used by the route. Repository release-check results belong to the final handoff and commit CI; the isolated browser receipts do not replace those checks or establish production acceptance.
