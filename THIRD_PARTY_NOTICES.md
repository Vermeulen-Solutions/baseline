# Third-party notices

The root MIT license covers Vermeulen Solutions' starter contributions. It does not replace upstream notices or grant rights to client assets. Runtime dependencies retain their own licenses; the lockfile records exact resolved versions.

| Distributed material | License and provenance |
| --- | --- |
| EmDash-authored skills | MIT; upstream [EmDash repository](https://github.com/emdash-cms/emdash). The recorded mirror source is commit `b74679528630a7ffc0f0f45e73bab4e7c5e61abb` in `.emdash/upstream-skills.json`. The two already-modified local mirror files are not an exact upstream snapshot; review and contribute those changes upstream before claiming a clean sync. See `docs/licenses/emdash-MIT.txt`. |
| Impeccable skill | Apache-2.0; bundled skill declares 4.3.1. Preserve `.agents/skills/impeccable/LICENSE`, `PROVENANCE.json` and `docs/licenses/impeccable-Apache-2.0.txt`. The distribution hash is recorded; upstream commit identity remains explicitly unverified. |
| PhotoSwipe 5.4.4 | MIT, Dmitry Semenov. Exact installed notice copied to `docs/licenses/photoswipe-MIT.txt`; source [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe). |
| Noto Sans via Fontsource 5.3.0 | SIL Open Font License 1.1; preserve `docs/licenses/noto-sans-OFL.txt`. Used for deterministic local fixtures; no client font rights are implied. |
| Contributor Covenant 2.1 | CC-BY-4.0. CODE_OF_CONDUCT.md retains the official attribution; only the project reporting contact is substituted. [Source](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) and [license](https://creativecommons.org/licenses/by/4.0/). |
| Showcase and test images | Synthetic starter/component fixtures and local development captures. They are not client portfolio images. |

Astro, Tailwind, React and other npm packages are installed separately under their package notices. Inspect their installed LICENSE files when redistributing bundles. Removing a dependency does not remove notice obligations for source retained from it.
