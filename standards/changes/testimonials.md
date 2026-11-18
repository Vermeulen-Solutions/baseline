---
bump: minor
platforms: [emdash, static]
areas: [components, skills]
adoption: copy
visible: no
database: no
files: [src/lib/quotes.ts, src/components/Stars.astro]
---

# Testimonials and public reviews, shown as written

- **`src/lib/quotes.ts`:**
  - `markedQuote()` marks a quote's key phrase. It escapes the text but never changes the words, and keeps paragraph breaks.
  - `excerpt()` cuts a long quote to the sentence holding the phrase, with ellipses.
  - `highlightProblem()` refuses a highlight that is not in the quote word for word.
  - `samePerson()` groups quotes by person.
- **`Stars.astro`:**
  - shows a rating as one labelled picture ("Rated 4.8 out of 5");
  - partial stars fill partly, and empty stars keep their outline;
  - takes the text colour, with a decorative mode for when the words beside it say the rating.
- **The content-modeling skill** gains testimonial rules:
  - the fields, with the permission date and consent for photos;
  - never edit the words;
  - public reviews link to the original;
  - profile totals carry the date they were checked;
  - each quote is stored once;
  - no `aggregateRating` on the site's own organization.

## For sites

Copy `src/lib/quotes.ts` and `src/components/Stars.astro` when a site shows client quotes or reviews, and model the quotes with the fields in the skill.
