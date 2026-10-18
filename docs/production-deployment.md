# Production Deployment & Cloudflare Cutover

Baseline sites can be deployed in two primary configurations:
1. **Node.js (Default Baseline):** Standalone Node server with SQLite and local media storage. Ideal for VPS hosting, Docker containers, Railway, Fly.io, or traditional infrastructure.
2. **Cloudflare Workers (Optional Target):** Serverless edge execution using Cloudflare Workers, Cloudflare D1 (SQLite at the edge), and Cloudflare R2 (object storage).

This guide details deployment procedures, edge gotchas, and the critical **DNS cutover checklist to protect client corporate email**.

---

## 1. Node.js Deployment (Default)

The default architecture has zero external cloud dependencies:

```bash
# 1. Build the production bundle
npm run build

# 2. Verify release artifact integrity
npm run check:release-artifact dist

# 3. Test running locally with environment variables
npm run start:local

# 4. In production environments, start the standalone server:
node ./dist/server/entry.mjs
```

### Environment Configuration (`.env`)
Ensure your production host has:
- `SITE_URL=https://your-site.example`: Sets canonical origin and restricts public CMS media patterns.
- `EMDASH_SECRET`: Generated via `npx emdash secrets generate`.
- `PORT`: Server port (default 4321).
- Persistent storage for the SQLite database (`data.db`) and uploaded media (`./uploads/`).
- **Backup & Disaster Recovery:** Follow [Node.js + SQLite Backup & Recovery](node-backup-restore.md) to establish automated SQLite `.backup` / `VACUUM INTO` snapshots, media synchronization, and isolated restore drills. Naive copying of `data.db` while WAL is active is strictly prohibited.

---

## 2. Cloudflare Workers Deployment

When deploying to Cloudflare Workers, Astro compiles templates for serverless edge isolates, EmDash connects to Cloudflare D1, and media is stored in Cloudflare R2.

### Critical Edge Gotchas

#### A. Cloudflare D1 100-Column Limit & Schema Parity
Cloudflare D1 enforces a hard limit of **100 columns per database table**.
* Run `npm run check:schema-budget` against the local database before building or migrating; a missing database is **not measured**. `db:diff` requires an explicit closed SQLite snapshot and saved reference, or a fully identified remote target. It does not select D1 automatically, synchronize content or apply migrations. See [Database Workflow](database-workflow.md) for capture/compare commands and the separate remote-export availability considerations.
* Baseline's strict **50-column physical schema budget** ensures tables stay well below D1's limit even with generated columns and metadata.

#### B. The Media Deployment Disconnect (`wrangler deploy` ≠ Media Upload)
Running `wrangler deploy` uploads compiled Astro application code and serverless functions, but **never uploads local media files**.
* If you imported a WordPress site or uploaded photos locally, those files reside in `./uploads/`.
* After verified local ingestion, stage the actual CMS storage keys and synchronize that object tree using explicit target flags ([Native Image Delivery](image-delivery.md)):
  ```bash
  # Create objects/ and staging.json from a verified prepared/ingested stage; no cloud upload:
  npm run media:migrate-wp -- --stage-r2 --stage .emdash/backups/wp-prepared-001 --out .emdash/backups/r2-stage-001

  # Offline plan (default):
  npm run media:sync-r2 -- --config ./wrangler.toml --env production --account <account-id> --bucket <r2-bucket> --uploads .emdash/backups/r2-stage-001/objects --manifest .emdash/backups/r2-stage-001/staging.json

  # Execute the reviewed create-only upload with R2 credentials supplied securely:
  npm run media:sync-r2 -- --apply --config ./wrangler.toml --env production --account <account-id> --bucket <r2-bucket> --uploads .emdash/backups/r2-stage-001/objects --manifest .emdash/backups/r2-stage-001/staging.json --journal .emdash/backups/r2-sync-001/journal.json
  ```
* The offline plan makes no R2 requests. Apply requires `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`; it verifies bytes/headers and refuses conflicting existing objects. Uploading objects does not transfer CMS records or establish production content parity.

#### C. Persistent Session Storage for Forms
Serverless worker isolates do not share memory across requests.
* Astro in-memory sessions vanish between isolates, causing form recovery and CSRF tokens to fail.
* Configure Astro persistent session storage (using Cloudflare KV or D1) before enabling public form recovery (`docs/forms-adoption.md`).

#### D. Native Image Optimization Binding
Ensure `wrangler.toml` (or `wrangler.jsonc`) configures Cloudflare Images binding:
```toml
[images]
binding = "IMAGES"
```
And `astro.config.mjs` configures:
```javascript
cloudflare({ imageService: 'cloudflare-binding' })
```

---

## 3. The DNS Cutover Checklist (Protect Corporate Mail)

One of the most dangerous and common errors web agencies make during site launch is switching a client's domain nameservers or root A-records without preserving their existing mail and verification records.

> [!CAUTION]
> Changing nameservers or root DNS blindly will immediately break the client's corporate email (Google Workspace, Microsoft 365), causing lost business communications and severe downtime.

Follow this sequential cutover checklist:

### Step 1: Record Existing DNS Ground Truth
Before touching nameservers, query and save all active DNS records from the client's existing provider:

```sh
# Query MX records (Mail Exchanger)
nslookup -type=MX your-domain.com

# Query SPF TXT records
nslookup -type=TXT your-domain.com

# Query DKIM records (e.g. google._domainkey or selector1._domainkey)
nslookup -type=TXT google._domainkey.your-domain.com

# Query DMARC policy
nslookup -type=TXT _dmarc.your-domain.com
```

Record the exact values in your launch notes:
- **MX Records:** e.g., `10 aspmx.l.google.com`, `20 alt1.aspmx.l.google.com`, or `example-com.mail.protection.outlook.com`.
- **SPF Records:** e.g., `v=spf1 include:_spf.google.com ~all` or `v=spf1 include:spf.protection.outlook.com -all`.
- **DKIM Records:** Selector CNAME or TXT keys.
- **DMARC Records:** `v=DMARC1; p=reject; ...`.
- **Domain Verification Tokens:** `google-site-verification=...`, Microsoft 365 `MS=...`, Apple Pay verification files.

### Step 2: Pre-populate Cloudflare DNS
Add all existing mail, DKIM, DMARC, and verification records to Cloudflare's DNS table **before** updating nameservers at the domain registrar:
- Mark all mail-related records (MX, SPF, DKIM, autodiscover) as **DNS-only (Grey Cloud)**. Never proxy mail traffic through Cloudflare's orange cloud.
- Configure root (`@`) and `www` CNAME records pointing to your Worker deployment.

### Step 3: Switch Nameservers & Verify
1. Update nameservers at the registrar to point to Cloudflare (or update A/CNAME records with TTL lowered to 300s per [Migration Cutover](migration-cutover.md)).
2. Immediately send test emails to and from a corporate address (e.g., `contact@your-domain.com`) to verify that inbound and outbound mail flows without rejection or bouncebacks.
3. Verify SSL certificate issuance and HTTPS connectivity on the custom domain.
4. Run live verification against the production URL:
   ```sh
   npm run migration:verify -- --manifest audit/url-inventory.json --scope url
   ```
5. Log in to `/_emdash/admin` on the production URL to verify CMS administration, and complete the [Client & Editor Handoff](editor-handoff.md).
