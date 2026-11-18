# Content patterns that keep a site honest and findable

Read this when shaping collections and page content for a client site: what a post opens with, how a portfolio or project entry is modelled, how quotes and reviews are kept, and when a section is ready to be linked. EmDash sites also follow the field rules in the `emdash-content-modeling` skill (search metadata, testimonials and reviews); static sites apply the same rules in `src/content.config.ts`.

## Answer first

People and answer engines read the top of a page and decide. Give articles and guides fields that put the answer there:

- **`summary`** (110 to 160 characters): one sentence that is both the listing card and the meta description, so it is sized for search results. Enforce the bounds on the field.
- **`shortAnswer`** (optional, 2 to 4 plain sentences): the answer to the question the page exists for, printed in a card at the top, with a real number or range where the topic has one ("A small business site usually costs CHF 3,000 to 8,000"). Plain text, no formatting, so it can also feed `llms.txt` and structured data.
- **`updated` and `changes`**: an update date only when the content changed in substance, and a one-line "what changed" note that may only be set together with it. A typo fix is not an update. The sitemap's `lastmod` reads the update date, else the publication date, never the build date.
- **Short title**: an optional `metaTitle` for entries whose title plus the site name runs past about 60 characters; the page keeps the full title.

## Portfolio and project entries

For agencies, architects, photographers, builders, gardeners and any trade that sells on past work:

- **Outcome, not invented metrics.** An optional one-line `outcome` (160 characters or fewer) states the honest, specific result ("Bookings moved from phone to a form that sets the price first"). A results list holds only changes the project actually delivered. Never invent a percentage.
- **Proof a visitor can check.** `liveUrl` when the work is live and the client agrees; leave it out for work that is gone or not yours to link. A screenshot of the client's own editor shows the CMS is real, only with the client's consent and with names and drafts hidden.
- **Facts with fallbacks.** A small `facts` object (sector, year, role, tools, host) whose missing keys fall back to the top-level fields, so a fact row reads well without repeating data.
- **Before pictures only when real.** A before/after comparison (`BeforeAfter.astro`) only where the before was captured while the old version still existed, from the same view.
- **Order is explicit.** A numeric `order` that runs 1 to n with no gaps, checked by a test, drives listings and "next project" loops.
- **Per-entry colours are checked.** When an entry carries the client's colours (for a themed card or hero), store them as plain hex and test every pair the page puts together for contrast at build time (4.5:1 for text, 3:1 for marks and borders). Never invent a dark variant the client does not ship.
- **Side projects are not client work.** Things built for friends, a club or yourself go in their own collection, with no case-study page and no place in any count of client projects.

## Quotes and reviews

Model them with the testimonial rules (exact words, permission date, highlight copied from the quote, public reviews linked to the original, one home per quote, profile totals with the date they were checked). Render them with `src/lib/quotes.ts` (`markedQuote`, `excerpt`, `highlightProblem`) and `src/components/Stars.astro`. Never add a rating to the site's own organization in structured data.

## Sections open with their first entry

A blog, gallery, news or events section with nothing published stays out of the menu, the sitemap and search results until its first entry, so no link points at an empty page. Keep the decision in one rule that every place reads (static profile: `gatedRoutes()` in `src/lib/posts.ts`). On EmDash sites editors add the menu item when the section has content, and the empty listing passes `robots: 'noindex, follow'`.

## Facts that switch features on

Keep contact and identity facts (business name, email, phone, address, profile links, booking link) in one place: EmDash settings plus the metadata plugin's `options.organization`, or the static site config. A feature that depends on a fact appears only when the fact is set: an empty booking URL means no "Book a call" button anywhere, rather than a button to nowhere.
