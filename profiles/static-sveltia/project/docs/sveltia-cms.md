# Sveltia CMS setup

This profile adds a browser editor at `/admin/` to the static foundation. There is no Astro Svelte integration or CMS/database dependency. Publishing commits files to GitHub; configure the host to rebuild and deploy on the configured branch. The public site continues serving its last successful build during editing. The profile does not depend on any one host: the site can be served by Cloudflare Workers, another static host or a plain web server.

Before signing in, replace `backend.repo` in `public/admin/config.yml` with the **new site's** `owner/repository`, and set `backend.branch` to its publishing branch. The placeholder intentionally does not target Baseline's repository. The file uses JSON syntax, which is valid YAML, so the field contract can be tested without adding a YAML parser to the project.

## Authentication

**Default: Sveltia CMS Authenticator on Cloudflare Workers.** For non-technical editors, deploy [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth), Sveltia's own sign-in service. It is a small Cloudflare Worker that you deploy in your own Cloudflare account; it is not a hosted service. It works the same way whether the site itself runs on Cloudflare Workers or on another host, because only the sign-in runs on Workers.

1. Deploy the Worker following its README and note its URL, for example `https://sveltia-cms-auth.<account>.workers.dev`.
2. Register a GitHub App as that README describes, with the callback URL `<worker URL>/callback`, and install it only on the new site's repository.
3. Store the app's `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` as Worker secrets. Set `ALLOWED_DOMAINS` to the site's actual admin domain so other sites cannot use your Worker.
4. Add `"base_url": "<worker URL>"` under `backend` in `public/admin/config.yml`. This is the only change in the site.

The Worker is separate infrastructure: account for its maintenance and Cloudflare's free-tier limits even though the public site is static. It supports GitHub only. On Netlify, Netlify's own OAuth can replace the Worker; leave `base_url` out in that case. Any other compatible OAuth proxy also works; follow the [GitHub backend guide](https://sveltiacms.app/en/docs/backends/github).

For developer use, choose **Sign In with Token**. A fine-grained PAT needs access to the new site's repository and Contents read/write. Add Pull requests read/write if enabling Sveltia's editorial workflow. The browser stores the token locally; never put a token or OAuth secret in this public config, HTML, Git or build env exposed to the client. Use a trusted browser and revoke unused tokens. The default simple workflow commits to `main`; protected branches may require switching to the editorial workflow and configuring the host accordingly. No GitHub client-only PKCE flow is assumed. See the authentication guide above for current support.

## Content and native images

The Posts form matches `src/content.config.ts`: `title`, `description`, `publishedAt`, `draft`, optional `hero`/`heroAlt`, plus the Markdown `body`. When a hero is present its alt description must be nonempty; the Astro schema enforces that at build time. Empty optional fields are omitted so Astro's image schema does not receive an empty string. Draft entries are excluded from public listings and routes. Preview in the editor is not the site's live edit canvas.

Uploads go to `/src/assets` in the repository; flat posts store image references as `../../assets/file.jpg`, matching the sample post. Astro resolves the native image metadata and emits optimized images. This form creates flat posts; if you enable nested entry creation, adjust the relative media paths for that depth and verify a fresh uploaded image with `npm run build`. Never move optimized content images to `public/` to bypass schema errors. [Media path reference](https://sveltiacms.app/en/docs/media/internal).

Run `npm run verify`, `npm run build`, and `npm run check:dev-tools` after changing the form or schema. CI checks their field and media-path contract. Check host CSP allows the editor script, its runtime resources, GitHub API and your sign-in service. `/admin/` and its config are public assets; noindex is an indexing hint, and GitHub authorization controls writes.

## Editor version

The admin HTML pins Sveltia **0.271.2** with SHA-384 SRI; the version and integrity always change together, and the page never uses `@latest`. Baseline's weekly upstream review proposes newer releases: it downloads the exact file, checks it against a second CDN, recomputes the integrity value and rebuilds both static profiles before proposing the change. This site owns its `public/admin/index.html`, so a Baseline update does not change it. To take a newer editor, copy the `<script>` tag from Baseline's change note or its `profiles/static-sveltia/project/public/admin/index.html`, update the page's `sha256` in `audit/design-gate-exceptions.json` if the page is listed there, then repeat the checks below. Sveltia is still in beta; read its [release notes](https://github.com/sveltia/sveltia-cms/releases) before moving the pin.

## Fallback: Decap CMS

Sveltia reads Decap-style configuration, so [Decap CMS](https://decapcms.org/docs/) is the fallback editor if Sveltia stops suiting the site. Decap edits the same files. This form uses two Sveltia-only options, both in the `output` block of `public/admin/config.yml`; everything else is Decap-style configuration. To switch:

1. In `public/admin/config.yml`, remove the whole `output` object (`omit_empty_optional_fields` and `encode_file_path`). Decap does not document either option.
2. In `public/admin/index.html`, replace the Sveltia `<script>` tag with Decap's at an exact version, for example `https://unpkg.com/decap-cms@<x.y.z>/dist/decap-cms.js`, never a range. Compute its integrity from the exact file: `curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A`, then write `integrity="sha384-<value>" crossorigin="anonymous"`. Baseline's weekly review does not track a Decap pin.
3. In `tests/sveltia-config.test.mjs`, remove the two `config.output` assertions and replace the three Sveltia script assertions with ones for the Decap URL and integrity.
4. Update the `sha256` for `public/admin/index.html` in `audit/design-gate-exceptions.json` if the page is listed there, and allow the Decap script origin in the host CSP.
5. Set up Decap's own sign-in. Sveltia CMS Authenticator and **Sign In with Token** belong to Sveltia; follow Decap's [GitHub backend guide](https://decapcms.org/docs/github-backend/) for Netlify or an external OAuth client, and point `backend.base_url` at it.

Then check the two behaviours the removed options provided. Decap has no switch to omit empty optional fields: save a post without a hero image and confirm `npm run build` passes, because an empty `hero` value fails the Astro image schema. Without `encode_file_path`, upload paths are written as typed, so use image file names without spaces. Decap documents `public_folder` relative to the built site, not relative to the entry, so verify a freshly uploaded hero image with `npm run build` before handing the editor back.

## Before editorial handoff

Test sign-in, upload, save, rebuild, rendered alt text, draft exclusion and logout with the actual deployment and editor accounts. Local generation/build checks do not certify those credentialed operations.

Complete the site's real Art Direction Record and run the full-source art check used by its CI before granting editor access. A fresh generated foundation has no invented client record; pulling a content commit can leave the local changed-source check quiet while CI still checks every source file. Deployment promotion should require the same gates as CI, then a successful production build and release checks. Preserve the last successful deployment on failure. The hero-description relationship is enforced at build time, so ensure editors can see build failures even when the CMS reports that their Git commit saved. This simple workflow defaults Draft to false; review that default for the site's publishing policy before handoff.
