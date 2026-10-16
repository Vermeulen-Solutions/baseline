# Clean-history public release

The current checkout is sanitized, but the private Git object history is not suitable for publication. The privacy receipt records historical identifier-bearing blobs. Existing immutable standards tags/releases retain original evidence; modifying working files cannot redact those objects. The sanitized historical logs/JSON are labeled redacted copies, and old artifact hashes refer to their original private bytes.

## Recommended release procedure

1. Keep the existing repository and its releases private. Create a reviewed, allowlisted export from the sanitized source tree into a new directory. Do not copy `.git`, ignored files, local databases, uploads, environment files, private audit artifacts, registry entries, synchronization backups or runtime reports. `git archive HEAD` is insufficient while the reviewed changes are uncommitted. Export the reviewed candidate index or a later sanitized commit only.
2. Review the export's text, filenames, binary images/metadata, generic seed content, third-party notices and editor screenshots. Repeat identifier, credential and private-path scans. Automated pattern matching is bounded; review potential credentials and rotate any confirmed exposed credential. Preserve only neutral audit evidence needed by consumers.
3. Initialize a fresh Git repository and create a new root commit and public release branch. A new orphan branch inside the old hosted repository does not protect its old branches, tags, releases, pull requests, issues, attachments or cached objects. Prefer a separate public repository; never push the old refs or use a mirror push.
4. Supply the exact standards manifest as a standalone pinned artifact with its documented SHA-256. The diagnostic engine supports this file without requiring access to private Git history. Do not recreate old private tags at different commits or imply that sanitized evidence has the original byte hashes.
5. Rehearse install/unit/schema/typecheck/build and local Windows visual/HUD checks from the export. Review all outgoing refs and remote metadata. Choose the community release version and maintain private recovery separately.
6. Review visibility and community announcements as the final launch actions. Public hosting costs/quotas depend on the chosen plan; retain the local-only browser policy regardless. The separate launch issue tracks these gates.

No history rewrite, visibility change, remote public repository creation, announcement or production deployment is performed by the packaging work.
