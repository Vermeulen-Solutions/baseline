# Disposable rehearsal resource cleanup — 2026-10-18

Phase 4 records were finalized on `main` in commit
[`a67af20`](https://github.com/Vermeulen-Solutions/baseline/commit/a67af20f20ef0f6f767e5fa1c964dfb214fb8c4f).
All three [GitHub Actions jobs passed](https://github.com/Vermeulen-Solutions/baseline/actions/runs/39143751696).

Cleanup removed the Phase 4 upstream branch and its four local static test sites,
the earlier synthetic Sveltia Cloudflare Pages project and local checkout/tooling,
and disposable EmDash runtime copies. Exact paths were resolved and checked before
recursive removal; twelve links to Baseline's dependencies were detached first.
Sixteen directories and three task-owned helper files were removed. Baseline's
dependencies were preserved. Older Windows Temp verification directories were
left for the owner, as previously requested.

All 235 files covered by the three retained Phase 2/3/4 artifact manifests passed
SHA-256 verification before and after cleanup. Client evidence remains private;
the runtime fixture was removed while its manifest-listed snapshots/logs remain.
The controlled Phase 4 commit is retained in a verified
[Git bundle](../baseline-sync-2026-10-18/candidate.bundle), and the synthetic Sveltia
pilot's Git history was also preserved privately.

Cloudflare deletion succeeded; a subsequent project lookup returned HTTP 404.
The private GitHub pilot repository could not be deleted with the existing CLI
credential: GitHub returned HTTP 403. It was instead successfully archived as a
private, read-only repository. **Repository deletion remains an owner cleanup
item** if complete removal is desired. No new credential, OAuth permission or
account access was requested or created.

The historical Sveltia pilot's public URLs are now retired. Its committed
[acceptance record](../sveltia-pilot-2026-10-18-3496a2/README.md) describes the live
state at verification time; the retained receipt is the evidence after teardown.
The separate real-downstream synchronization check and detailed client findings
were kept outside all public repositories.

See [machine receipt](verification.json) and [artifact hashes](manifest.json).
