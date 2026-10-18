# Automated Upstream Updates & Continuous Maintenance

Baseline includes an automated maintenance pipeline designed to keep your site's agent skills, specialist instructions, and framework dependencies fresh, secure, and compatible over time.

The workflow is located at [`.github/workflows/upstream-update.yml`](file:///.github/workflows/upstream-update.yml).

---

## ⚡ How It Works

The workflow runs on a weekly schedule (**every Monday at 08:00 UTC**) and can also be triggered on-demand via **Workflow Dispatch** in the GitHub Actions UI or through the GitHub CLI (`gh workflow run upstream-update.yml`).

### 1. Update Phase
The action runs three synchronization steps:
1. **EmDash Skills (`npm run sync:emdash-skills`):** Synchronizes upstream official EmDash agent skills (`building-emdash-site`, `emdash-cli`, `creating-plugins`) if staged cleanly without conflicting local drift.
2. **Impeccable Visual Polish Skill (`node scripts/sync-impeccable-skill.mjs`):** Downloads and verifies the latest curated release of the Impeccable skill (`pbakaus/impeccable`), keeping provenance metadata and licenses aligned.
3. **Safe In-Range Dependency Updates (`npm update --save`):** Updates patch and minor dependency releases within the ranges allowed by your `package.json` semver constraints.

### 2. Verification Suite
If any files changed during the update phase, the action executes a comprehensive local verification suite before touching `main`:
- **SQLite Fixture Safety:** Pre-provisions a clean SQLite dummy table (`ec_pages`) if running in a clean runner where `data.db` is not checked into Git.
- **Schema Column Budget (`npm run check:schema-budget`):** Verifies all physical collection column counts remain under the conservative 50-column ceiling (ensuring Cloudflare D1 100-column safety).
- **Unit & Gallery Tests:** Runs all existing repository test suites (`npm test`, `npm run test:schema-budget`, `npm run test:galleries`).
- **Production Build (`npm run build`):** Compiles the full Astro application to verify bundling, routing, and type integrity.

### 3. Safe Auto-Merge or Issue Notification
- **If all tests pass:** The workflow commits the changes using `github-actions[bot]`, tags the commit with `[skip ci]`, and pushes directly to `main`.
- **If tests fail:** The workflow aborts the push, leaves `main` untouched, and automatically creates an issue in your GitHub repository tagged `maintenance` and `automated-update` linking directly to the failing workflow run log.
- **If no updates are pending:** The action outputs `Everything is already up to date` and completes with zero modifications.

---

## 🛡️ GitHub Repository Permissions Setup

For the action to commit passing updates and open notification issues upon failure, your GitHub repository must grant workflow write permissions:

1. Open your repository on GitHub.
2. Go to **Settings** > **Actions** > **General**.
3. Under **Workflow permissions**:
   - Select **Read and write permissions**.
   - Check **Allow GitHub Actions to create and approve pull requests**.
4. Click **Save**.

### Configuring via GitHub CLI (`gh`):
You can enable this programmatically in one step:
```bash
gh api --method PUT -H "Accept: application/vnd.github+json" \
  /repos/<owner>/<repo>/actions/permissions/workflow \
  -f default_workflow_permissions='write' \
  -F can_approve_pull_request_reviews=true
```

---

## 💻 Running Updates Manually in Terminal

You can run the update and verification cycle locally at any time without waiting for CI:

```bash
# 1. Check for upstream framework & dependency updates
npm run check:upstream

# 2. Check for upstream skill changes (dry run)
npm run sync:emdash-skills -- --check
node scripts/sync-impeccable-skill.mjs --check

# 3. Apply skill updates locally
node scripts/sync-impeccable-skill.mjs
npm run sync:emdash-skills

# 4. Apply dependency updates & verify
npm update --save
npm run verify
```
