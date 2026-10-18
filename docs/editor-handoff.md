# Client and Editor Handoff Guide

This guide defines the editorial workflow, permissions model, and operational ownership when handing off a newly migrated EmDash site to non-technical editors and clients.

---

## 1. Roles and Permissions Model

EmDash provides role-based access control to protect schema integrity and critical configuration while empowering content creators:

| Role | Permitted Actions | Restricted Actions |
|---|---|---|
| **Administrator** | Manage users, configure system settings, modify content models/schemas, manage redirects, install/configure plugins, view audit logs. | None |
| **Editor** | Create, edit, schedule, and publish Pages and Posts; upload and organize media assets; view and export form submissions. | Cannot modify collections, schema settings, system environment, or administrative credentials. |

> [!TIP]
> Always grant client content managers the **Editor** role for daily work. Reserve the **Administrator** role for technical site owners or developers to avoid accidental structural changes.

---

## 2. Daily Editorial Workflows

### Accessing the CMS Admin
Editors log in at: `https://yourdomain.com/_emdash/admin`

### Working with Portable Text
EmDash uses **Portable Text** instead of messy visual page builders (like Elementor or Divi):
- **Headings & Hierarchy:** Use the block selector to choose Heading 2 and Heading 3. Heading 1 is reserved for the document title.
- **Lists and Links:** Standard bullet and numbered lists are supported. When adding external links, the system automatically handles safe attributes.
- **Images:** Insert images directly into the content stream. EmDash generates responsive image sizes automatically.
- **Clean Content:** Copying and pasting from Google Docs or Word automatically strips unwanted inline styles and classes, ensuring brand design fidelity.

### Publishing & Scheduling
- **Save Draft:** Saves ongoing work without updating the public website.
- **Publish Now:** Updates the live website immediately.
- **Schedule:** Set a future date/time. The post remains queued until the scheduled time.

### Reviewing Form Submissions
If using the native form workflow or a forms plugin:
- Navigate to the **Forms** or **Submissions** section in the admin sidebar.
- Submissions display submission timestamp, form identifier, and field responses.
- Export submissions to CSV (when using a forms integration that supports export) or review directly in the dashboard.

---

## 3. Peripheral Integrations Inventory Checklist

WordPress bundled many features via monolithic plugins (search, forms, SEO, analytics). In EmDash + Astro, these capabilities are explicitly dispositioned to maintain high performance, security, and accessibility.

Every site migration must complete this checklist with explicit dispositions:

| Feature Area | Legacy WordPress Plugin / Core | EmDash / Baseline Implementation | Status Disposition | Site-Specific Notes & Rationale |
|---|---|---|---|---|
| **Forms & Lead Gen** | Contact Form 7 / Gravity Forms | Native Form Plugin / Astro API Route | **Replaced** | Stateful submissions stored in DB with honeypot spam protection. |
| **Site Search** | WP Core Search / SearchWP | EmDash LiveSearch Primitive | **Preserved** | Instant search over collections without heavy SQL LIKE queries. |
| **RSS Feeds** | `/feed/` (WordPress Core) | `@astrojs/rss` Static Endpoint | **Preserved** | Valid RSS 2.0 XML feed generated at `/rss.xml`. |
| **Comments** | WordPress Native Comments | Deliberately Excluded / Giscus | **Deliberately Excluded** | Replaced with modern discussion embed or removed to eliminate spam. |
| **Newsletter Signup** | Mailchimp for WP / MailPoet | Client Embed / Direct API Webhook | **Replaced** | Connected directly to client's newsletter provider API. |
| **Analytics** | MonsterInsights / Site Kit | Privacy-friendly script (Plausible / GA4) | **Replaced** | Minimal `<script>` placed in `src/layouts/Base.astro`. |
| **Cookie Consent** | Complianz / Cookiebot | Compliant Consent Banner | **Replaced** | Cookie banner blocking tracking scripts until consent is granted. |
| **E-Commerce** | WooCommerce | External Shopify Buy Button / Snipcart | **Deliberately Excluded** | Documented in brief if transactional commerce is required. |
| **Membership / Auth**| MemberPress / Ultimate Member | Managed Auth Provider (Clerk / Auth0) | **Deliberately Excluded** | Out of scope for standard CMS marketing sites. |

> [!IMPORTANT]
> A feature cannot be left in an "assumed" state. Every row must be marked as **Preserved**, **Replaced**, or **Deliberately Excluded** with a concrete reason recorded in the client project notes. Integration checklists can be validated programmatically via `validateIntegrations()`.

---

## 4. Operational Ownership & Governance

Clear ownership prevents post-launch finger-pointing. Agree on these responsibilities before handoff:

| Operational Responsibility | Assigned Owner | Contact / Procedure |
|---|---|---|
| **Domain Registration & DNS Renewal** | Client IT / Stakeholder | Annual registrar renewal; DNS managed in Cloudflare. |
| **Server Hosting & OS Maintenance** | Agency / Developer | Managed Node runner or Cloudflare Workers platform. |
| **Database & Media Backups** | Agency / Developer | Daily automated snapshots per [Node Backup & Recovery](node-backup-restore.md). |
| **Daily Content Publishing** | Client Content Team | Self-managed via EmDash Editor login. |
| **Form Inbox Monitoring** | Client Sales / Support Team | Daily review of form submissions / notification emails. |
| **Security & Dependency Updates** | Agency / Developer | Quarterly review via Baseline dependency workflow. |
| **Technical Support Escalation** | Agency Support Desk | Escalation SLA defined in client service agreement. |
