# Cloudflare Worker candidate smoke check

Use this optional check when a release changes Worker bundling, server-side dependencies, middleware, bindings, routing or other behavior that a local Node build cannot exercise. It lets the current production Worker keep 100% of public traffic while one explicit request is routed to a newly uploaded version. Routine content edits and releases with no relevant Worker behavior change do not need this extra step.

## Choose the right environment

Cloudflare Worker Version URLs and version overrides use the version's configured resources; they do not create an isolated database or media environment. Use a separately configured Preview with its own resources for branch testing. Use the production candidate flow below only for a release intended for that Worker and only when its smoke requests are safe against the configured production resources.

If the candidate adds core EmDash migrations, has an observed pending migration, or performs another data-changing action, take the recovery point required by [production deployment](production-deployment.md) before any candidate request. A version override can execute the new code against production D1 and may run supported automatic migrations. Check database compatibility with the currently serving version before testing. Do not use this flow to rehearse a migration that needs isolated data.

## Upload and route a candidate at zero traffic

Build using the site's normal production command and explicit Wrangler config/environment. Upload the built Worker as a version without deploying it:

```powershell
# npm projects
npm.cmd exec wrangler -- versions upload --config wrangler.jsonc --message "Candidate smoke check"

# pnpm projects
pnpm.cmd exec wrangler versions upload --config wrangler.jsonc --message "Candidate smoke check"
```

Record the returned candidate version ID. Identify the currently serving version ID from `wrangler deployments list` or the Worker's Deployments page. Confirm the intended Worker, account and environment before changing deployment weights.

Create a deployment containing both versions, keeping the current version at 100% and the candidate at 0%:

```powershell
# npm projects
npm.cmd exec wrangler -- versions deploy <CURRENT_VERSION_ID>@100 <CANDIDATE_VERSION_ID>@0 --config wrangler.jsonc --yes --message "Candidate at zero traffic for smoke check"

# pnpm projects
pnpm.cmd exec wrangler versions deploy <CURRENT_VERSION_ID>@100 <CANDIDATE_VERSION_ID>@0 --config wrangler.jsonc --yes --message "Candidate at zero traffic for smoke check"
```

Do not omit the current version or assign the candidate a nonzero percentage for this check. Version overrides apply only to versions in the current deployment.

## Smoke the exact candidate

Request the canonical Worker hostname with the Cloudflare version override header. The dictionary header maps the deployed Worker name to the candidate version ID:

```powershell
curl.exe --fail --show-error --header 'Cloudflare-Workers-Version-Overrides: <WORKER_NAME>="<CANDIDATE_VERSION_ID>"' https://example.com/
```

Repeat for the affected public routes and one representative content or media route. Use the site's existing authorized session when Cloudflare Access protects the hostname. Never put access tokens, cookies or other credentials in committed scripts, reports or command logs.

Confirm through Cloudflare Observability or the site's version metadata that the response ran the candidate. An override header can be ignored when it is malformed or the version is absent from the current deployment, in which case normal traffic routing can return the old version and create a false pass. Check the actual response status/content and relevant runtime errors as well. Version URLs can also exercise the uploaded version, but they use its configured resources and do not provide Wrangler tail logs; use the canonical hostname with the override when production zone settings and observable logs matter.

If the candidate fails, keep the current version at 100% and remove the zero-traffic candidate by restoring the current-only deployment:

```powershell
# npm projects
npm.cmd exec wrangler -- versions deploy <CURRENT_VERSION_ID>@100 --config wrangler.jsonc --yes --message "Remove failed zero-traffic candidate"

# pnpm projects
pnpm.cmd exec wrangler versions deploy <CURRENT_VERSION_ID>@100 --config wrangler.jsonc --yes --message "Remove failed zero-traffic candidate"
```

Then investigate. If it passes, promote the exact tested version:

```powershell
# npm projects
npm.cmd exec wrangler -- versions deploy <CANDIDATE_VERSION_ID>@100 --config wrangler.jsonc --yes --message "Promote smoke-tested candidate"

# pnpm projects
pnpm.cmd exec wrangler versions deploy <CANDIDATE_VERSION_ID>@100 --config wrangler.jsonc --yes --message "Promote smoke-tested candidate"
```

Record the uploaded version ID, previous version ID, deployment weights, tested routes, observed candidate identity and outcomes in the site's private deployment record. This check proves only the exercised Worker behavior; it does not prove CMS editor saves, migrations, providers, cache invalidation or content parity.

See Cloudflare's [version override guidance](https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/), [version deployment guidance](https://developers.cloudflare.com/workers/versions-and-deployments/) and [Version URL limitations](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/).
