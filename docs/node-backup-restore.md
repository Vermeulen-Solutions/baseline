# Node.js + SQLite Production Backup & Disaster Recovery

This runbook defines backup acquisition, retention policy, and isolated restore drills for production EmDash sites running on the **Node.js + SQLite** foundation.

> [!NOTE]
> **Static Platform Profiles (`static` and `static-sveltia`):**
> Static profiles store all content as Git-owned Markdown files and deploy to static hosts. For those profiles, Git commits and host deployment history provide disaster recovery. This runbook applies to the **EmDash Node.js + SQLite** profile.

---

## 1. Backup Anatomy: The Triple Set

A working recovery requires three synchronized components. Backing up the database without media or configuration results in a broken, unrecoverable site.

```
Backup Bundle (YYYY-MM-DD-HHMM)
├── database/
│   └── data.sqlite             # Consistent SQLite snapshot (integrity-verified)
├── media/
│   └── uploads/                # Complete local media directory
└── config/
    ├── .env.production         # Authentication secrets, encryption keys, port configuration
    ├── package-lock.json       # Exact pinned dependency lockfile
    └── git-commit.txt          # Deployed Git commit SHA
```

---

## 2. Safe SQLite Backup Acquisition

> [!CAUTION]
> **Never copy `data.db` directly while the Node process is running!**  
> SQLite operates in WAL (Write-Ahead Logging) mode. When active, pending writes reside in `data.db-wal` and shared memory in `data.db-shm`. Running a naive file copy (`cp data.db backup.db`) produces a corrupted or torn database.

### Supported Acquisition Methods

#### Method A: SQLite Online Backup CLI (Recommended)
The SQLite CLI's `.backup` command safely acquires an exclusive lock, checkpoints pending transactions, and produces a clean, consistent snapshot while the application remains online.

Always capture the filename in a shell variable once so verification checks the actual file created:

```sh
# Define destination file once
BACKUP_FILE="backups/db-$(date +%Y%m%d-%H%M%S).sqlite"
mkdir -p "$(dirname "$BACKUP_FILE")"

# Acquire consistent snapshot
sqlite3 ./data.db ".backup '$BACKUP_FILE'"

# Verify integrity immediately on the acquired file
sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;"
# Must output: ok
```

#### Method B: SQL `VACUUM INTO`
If running an administrative SQL session or script against SQLite:
```sql
VACUUM INTO '/absolute/path/to/backups/backup.sqlite';
```
> [!NOTE]
> `VACUUM INTO` requires that the target destination file does **not** already exist; SQLite will throw an error if the destination exists. It safely creates a vacuumed, defragmented copy without interrupting ongoing operations.

#### Method C: Cold Backup (Process Stopped)
If the Node server can be temporarily halted during a scheduled maintenance window:
```sh
systemctl stop emdash-site

# Safely flush WAL pages into data.db (never delete WAL manually without checkpointing)
sqlite3 ./data.db "PRAGMA wal_checkpoint(TRUNCATE);"

cp data.db backups/cold-backup.sqlite
cp -r ./local-media backups/media-backup
systemctl start emdash-site
```

---

## 3. Media and Configuration Backups

Along with the SQLite file, synchronize the media library and environment:

```sh
# Backup media directory (preserving timestamps and permissions)
rsync -avz --delete ./local-media/ /var/backups/emdash/media/

# Archive environment configuration and lockfile (encrypt with gpg before offsite transfer)
tar -czf /var/backups/emdash/config-$(date +%Y%m%d).tar.gz .env package-lock.json
```

### Retention Schedule
- **Hourly (Rolling 24h):** Automated SQLite snapshot via cron or systemd timer.
- **Daily (Rolling 30d):** Daily SQLite snapshot + incremental rsync of media library.
- **Weekly (Rolling 12w):** Full bundle (DB + Media + Config) transferred off-site (e.g. S3/R2 private bucket or separate physical server).

---

## 4. Isolated Restore Drill (Rehearsal)

A backup is only as good as its proven restore. Test the restore procedure periodically in an isolated sandbox.

### Step 1: Prepare Isolated Environment
```sh
mkdir -p /tmp/emdash-restore-test
cd /tmp/emdash-restore-test

# Check out the matching Git commit
git clone https://github.com/YourOrg/site.git .
git checkout <matching-commit-sha>
npm ci
```

### Step 2: Restore Files
```sh
# Copy backup artifacts
cp /path/to/backup.sqlite ./data.db
cp -r /path/to/backup-media ./local-media
cp /path/to/.env.production ./.env
```

### Step 3: Verify Database Integrity
```sh
sqlite3 ./data.db "PRAGMA integrity_check;"
# Must output: ok

# Check schema column budget compliance
npm run check:schema-budget
```

### Step 4: Boot and Validate Public & Admin Access
```sh
# Start local production build
npm run build
node --env-file=.env ./dist/server/entry.mjs
```

1. **Anonymous Read Check:** Send a request to `http://localhost:4321/` and a sample post route; verify HTTP 200 and rendered content.
2. **Media Delivery Check:** Request an image URL from `http://localhost:4321/media/...`; verify image headers and HTTP 200.
3. **Admin Authentication:** Navigate to `http://localhost:4321/_emdash/admin` and verify admin login and dashboard functionality.

---

## 5. Distinguishing Tooling: Snapshots vs. Seeds vs. Backups

| Tool | Purpose | What it Contains | Can it be used for Disaster Recovery? |
|---|---|---|---|
| **Disaster Recovery Backup** (This runbook) | Complete operational restore after server failure | Binary SQLite DB + Media + `.env` secrets + lockfile | **YES** — Restores full production state |
| **`seed/seed.json`** (`db:export-seed`) | Development starter & test bootstrap | Privacy-reviewed schema & sample rows | **NO** — Development bootstrap only; drops sensitive data |
| **`schema.json`** (`db:diff`) | Schema column budget checking (D1 preflight) | Table column definitions & metadata | **NO** — Contains zero content data |
| **`db:pull-remote`** | Pulling staging/D1 data for local debugging | Debug snapshot | Partial — Non-production debugging only |

---

## 6. Related Runbooks

- **[Migration Cutover](migration-cutover.md):** Content freeze protocol, delta reconciliation, and DNS switchover.
- **[Production Deployment](production-deployment.md):** Standalone Node.js deployment, reverse proxy setup, and corporate email protection.
- **[Support Boundaries](support-boundaries.md):** Operational and hosting support scopes.
