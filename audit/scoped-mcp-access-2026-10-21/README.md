# Scoped CMS access acceptance

The local SQLite helper now requires an explicit existing database and account,
plans without writing, and offers read-only, content-authoring and setup presets.
It validates scopes against the account role, expires new tokens after 30 days by
default, stores only the upstream token hash, and supports owner-bound revocation.
It never creates an account or implicitly selects an administrator.

`acceptance.json` records real MCP requests against the owned synthetic Journal
fixture on EmDash 1.3. An admin's read-only token read posts but could not create
content; an authoring token created a draft. After revocation the first token
returned HTTP 401 and the second still worked. No token secrets are in this report.
The six unit tests also cover read-only plans, numeric roles, invalid grants,
expiry, account selection and revocation boundaries.

The retained earlier attempts qualify the evidence: a minimal cold fixture did
not become ready before the harness timeout, and a harness query incorrectly
expected named roles. The latter exposed and led to correcting numeric-role
handling in the helper and tests. The successful run uses the existing owned
synthetic fixture; it does not exercise production, D1 or browser OAuth.

OAuth consent and the admin token UI remain the primary supported workflows.
The helper is an explicitly documented EmDash 1.3 SQLite compatibility fallback:
the installed version has no public PAT-management REST contract, so this change
does not claim to replace its token-table access with a supported remote API.
EmDash's content:write compatibility grant also permits menu and taxonomy writes;
the helper and guide disclose that limitation.
