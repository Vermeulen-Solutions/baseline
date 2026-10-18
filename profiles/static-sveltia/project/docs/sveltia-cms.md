# Sveltia CMS setup

This profile adds a browser editor at `/admin/` to the static foundation. There is
no Astro Svelte integration or CMS/database dependency. Publishing commits files
to GitHub; configure the host to rebuild and deploy on the configured branch.
The public site continues serving its last successful build during editing.

Before signing in, replace `backend.repo` in `public/admin/config.yml` with the
**new site's** `owner/repository`, and set `backend.branch` to its publishing
branch. The placeholder intentionally does not target Baseline's repository.
The file uses JSON syntax, which is valid YAML, so the field contract can be
tested without adding a YAML parser to the project.

## Authentication

For non-technical editors, deploy [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth)
or a compatible OAuth proxy. Register a GitHub OAuth app following that service's
callback and origin instructions. Keep the client secret in the proxy service's
secret store, and add `"base_url": "https://your-auth-service.example"` under
`backend`. Restrict its allowed origins to the site's actual admin origin.
The proxy is separate infrastructure; account for its hosting, maintenance and
provider limits even though the public site is static. Netlify OAuth is another
option; follow the [GitHub backend guide](https://sveltiacms.app/en/docs/backends/github).

For developer use, choose **Sign In with Token**. A fine-grained PAT needs access
to the new site's repository and Contents read/write. Add Pull requests read/write
if enabling Sveltia's editorial workflow. The browser stores the token locally;
never put a token or OAuth secret in this public config, HTML, Git or build env
exposed to the client. Use a trusted browser and revoke unused tokens. The default
simple workflow commits to `main`; protected branches may require switching to
the editorial workflow and configuring the host accordingly. No GitHub client-only
PKCE flow is assumed. See the authentication guide above for current support.

## Content and native images

The Posts form matches `src/content.config.ts`: `title`, `description`,
`publishedAt`, `draft`, optional `hero`/`heroAlt`, plus the Markdown `body`.
When a hero is present its alt description must be nonempty; the Astro schema
enforces that at build time. Empty optional fields are omitted so Astro's image
schema does not receive an empty string. Draft entries are excluded from public
listings and routes. Preview in the editor is not the site's live edit canvas.

Uploads go to `/src/assets` in the repository; flat posts store image references
as `../../assets/file.jpg`, matching the sample post. Astro resolves the native
image metadata and emits optimized images. This form creates flat posts; if you
enable nested entry creation, adjust the relative media paths for that depth and
verify a fresh uploaded image with `npm run build`. Never move optimized content
images to `public/` to bypass schema errors. [Media path reference](https://sveltiacms.app/en/docs/media/internal).

Run `npm run verify`, `npm run build`, and `npm run check:dev-tools` after changing
the form or schema. CI checks their field and media-path contract. The admin HTML
pins Sveltia **0.248.0** with SHA-384 SRI; review the version and integrity together
when updating. Check host CSP allows that script, its runtime resources, GitHub
API and your OAuth proxy. `/admin/` and its config are public assets; noindex is
an indexing hint, and GitHub authorization controls writes.

Before editorial handoff, test sign-in, upload, save, rebuild, rendered alt text,
draft exclusion and logout with the actual deployment and editor accounts.
Local generation/build checks do not certify those credentialed operations.

Complete the site's real Art Direction Record and run the full-source art check
used by its CI before granting editor access. A fresh generated foundation has
no invented client record; pulling a content commit can leave the local
changed-source check quiet while CI still checks every source file. Deployment
promotion should require the same gates as CI, then a successful production
build and release checks. Preserve the last successful deployment on failure.
The hero-description relationship is enforced at build time, so ensure editors
can see build failures even when the CMS reports that their Git commit saved.
This simple workflow defaults Draft to false; review that default for the site's
publishing policy before handoff.
