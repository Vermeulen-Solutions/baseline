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

---

## 2. Cloudflare Workers Deployment

When deploying to Cloudflare Workers, Astro compiles templates for serverless edge isolates, EmDash connects to Cloudflare D1, and media is stored in Cloudflare R2.

### Critical Edge Gotchas

#### A. Cloudflare D1 100-Column Limit & Schema Parity
Cloudflare D1 enforces a hard limit of **100 columns per database table**.
* Always run `npm run check:schema-budget` and `npm run db:diff` ([Database Workflow](database-workflow.md)) before building or migrating to compare your local SQLite schema against remote D1.
* Baseline's strict **50-column physical schema budget** ensures tables stay well below D1's limit even with generated columns and metadata.

#### B. The Media Deployment Disconnect (`wrangler deploy` ≠ Media Upload)
Running `wrangler deploy` uploads compiled Astro application code and serverless functions, but **never uploads local media files**.
* If you imported a WordPress site or uploaded photos locally, those files reside in `./uploads/`.
* Stage and synchronize media to your remote R2 bucket using explicit target flags ([Native Image Delivery](image-delivery.md)):
  ```bash
  # Dry-run R2 staging verification (default):
  npm run media:sync-r2 -- --config ./wrangler.toml --env production --account <account-id> --bucket <r2-bucket> --uploads ./uploads --manifest ./audit/media-migration/manifest.json

  # Execute upload after reviewing the dry-run plan:
  npm run media:sync-r2 -- --apply --config ./wrangler.toml --env production --account <account-id> --bucket <r2-bucket> --uploads ./uploads --manifest ./audit/media-migration/manifest.json
  ```

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
1. Update nameservers at the registrar to point to Cloudflare.
2. Immediately send test emails to and from a corporate address (e.g., `contact@your-domain.com`) to verify that inbound and outbound mail flows without rejection or bouncebacks.
3. Verify SSL certificate issuance and HTTPS connectivity on the custom domain.
4. Log in to `/_emdash/admin` on the production URL to verify CMS administration.
