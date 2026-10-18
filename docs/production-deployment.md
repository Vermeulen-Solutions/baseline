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

## 3. Staging & Multi-Environment Architecture

For smaller sites (Express track, `<= 6` routes), in-app Draft mode and local preview are often sufficient. For active, high-traffic client sites or complex schema changes, establishing an isolated staging environment is strongly recommended to enable client review before production release.

### A. Cloudflare Workers Staging Blueprint (`wrangler.jsonc`)

Cloudflare Workers natively supports environment isolation. Staging should use **distinct D1 databases and R2 buckets** to ensure testing never mutates production data:

```jsonc
{
  "name": "client-site",
  "compatibility_date": "2026-03-01",
  "main": "./dist/_worker.js/index.js",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "client-site-prod-db",
      "database_id": "<PRODUCTION_D1_DATABASE_ID>"
    }
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA",
      "bucket_name": "client-site-prod-media"
    }
  ],
  "vars": {
    "ENVIRONMENT": "production",
    "SITE_URL": "https://client-site.com"
  },
  "env": {
    "staging": {
      "name": "client-site-staging",
      "routes": [
        { "pattern": "staging.client-site.com", "custom_domain": true }
      ],
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "client-site-staging-db",
          "database_id": "<STAGING_D1_DATABASE_ID>"
        }
      ],
      "r2_buckets": [
        {
          "binding": "MEDIA",
          "bucket_name": "client-site-staging-media"
        }
      ],
      "vars": {
        "ENVIRONMENT": "staging",
        "SITE_URL": "https://staging.client-site.com"
      }
    }
  }
}
```

Deploying to staging is simply:
```bash
# 1. Compile bundle
npm run build

# 2. Deploy to staging environment
npx wrangler deploy --env staging
```

### B. SEO Protection (Noindex Rule on Staging)

> [!WARNING]
> Search engines must never index your staging environment. Indexing staging domains or `*.workers.dev` URLs creates duplicate content penalties, leaks unreleased marketing campaigns, and confuses search ranking.

To guarantee search engines ignore the staging environment:
1. **Cloudflare Transform Rule (Recommended):** In Cloudflare Dashboard for your staging hostname (`staging.client-site.com`), add an **HTTP Response Header Modification Rule**:
   * Header Name: `X-Robots-Tag`
   * Value: `noindex, nofollow`
2. **Environment Variable Guard:** Ensure templates or site shells emit `<meta name="robots" content="noindex, nofollow" />` whenever `ENVIRONMENT === 'staging'` or when the request hostname does not match `SITE_URL`.

### C. Data Synchronization (Cloning Production Content to Staging)

Testing new features or layouts against an empty staging database is inefficient. Use EmDash's whole-site export and import features to populate staging with realistic, current production content:

```bash
# 1. Export production snapshot into a self-contained package (entries, media, schema, settings)
npx emdash site export --url https://client-site.com --token $PROD_EMDASH_TOKEN > .emdash/backups/prod-clone.zip

# 2. Import into the staging environment (target staging database must be prepared)
npx emdash site import .emdash/backups/prod-clone.zip --url https://staging.client-site.com --token $STAGING_EMDASH_TOKEN
```

### D. Staging-to-Production Promotion Workflow

When rolling out Day-2 changes through staging:
1. **Develop & Verify Locally:** Implement changes, run `npm run verify`, and test locally.
2. **Deploy to Staging:** Run `npx wrangler deploy --env staging` (and apply staging D1 migrations if schema changed).
3. **Client Sign-off:** Share `staging.client-site.com` for client review and visual confirmation.
4. **Promote to Production:**
   * Apply production D1 migrations: `npx wrangler d1 migrations apply DB --remote`
   * Deploy production worker: `npx wrangler deploy`
   * Test live production URL.

---

## 4. The DNS Cutover Checklist (Protect Corporate Mail)

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
