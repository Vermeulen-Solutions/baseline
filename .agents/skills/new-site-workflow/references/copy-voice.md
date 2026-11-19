# Copy voice and the tells of model copy

Read before drafting a page's copy (Stage 3, or any rewrite), and again before handing copy to the owner. [copywriting.md](copywriting.md) routes the rest: the brief, claims and proof, microcopy, languages. This file decides what the words say and how they sound, so two sites for two clients never read as one writer, and lists what gives model-written copy away. `npm run check:quality` reports the tells it can count as `copy-tell`.

## Why model copy reads as model copy

The first-generation words are mostly gone (no "seamless", few em dashes). What replaced them looks like good copy and is used the same way on every site:

- **One voice for every client:** warm, wry, modest, a little literary. A plumber and a gallery sound alike.
- **The same devices in every section:** a heading in two fragments (« Un arbre tombe. Il reste. »), a pair of counts (« Un tronc, onze mois »), "not X but Y", a run of "no X, no Y", a dry closing line on each paragraph, a strip of three invented figures.
- **Sincerity said instead of shown:** honest, passionate, careful, authentic; *authentique*, *passionné*, *avec soin*.
- **Detail invented to look specific:** a batch number, a minute of the morning, a percentage nobody measured.

Professional copy uses the same devices. The difference is that its details are true, each device is used once where it lands hardest, the brand has its own voice, and the page is uneven: a part with nothing true to say is left out. The cause is missing input, and **the fix is facts and decisions, never synonyms**: a word swapped for its synonym is the next tell.

## 1. The fact sheet

Before the first sentence, write down from the brief, the owner's files and any existing site, in their words where possible:

| Field | Feeds |
|---|---|
| What it is, in one plain sentence without an adjective | the h1 and the line under it |
| Who it is for, and who should look elsewhere | the opening, one line in the questions |
| What people do today instead (the shop across town, nothing, doing it themselves) | the problem line |
| The true difference, with its proof | the claims worth a heading |
| The owner's and customers' own words | headings, the problem line |
| Numbers, each with its source | sentences |
| Odd true details: a ritual, a tool, a house word, the awkward bit | the texture you would otherwise invent |
| A limit: what it does not do, who it is wrong for, when it is closed | one admission a page |
| The offer: price, terms, the one next step | buttons and the close |

An empty field stays empty: its section shrinks or goes, and a `[[placeholder: …]]` marks a fact the owner must supply ([content-patterns.md](content-patterns.md)). A limit comes from the brief or a plain fact of the trade, never invented.

## 2. The voice

Choose one register by the visitor, the price and the owner's real character, and write it in the brief (Brand Commitments) as a short card: the register, who speaks (*je*, *nous*, the business name), sentence length, where humour may go, the house words and what never appears.

| Register | Sounds like | Fits | Fails when |
|---|---|---|---|
| Facts only | names, dates, counts in plain sentences | professions, clubs, institutions, long track records | the facts are thin: it reads as an empty CV |
| Technical, with proof | a label with a hard figure, the method in verb-led steps | trades and tools where the method sells | it becomes a specification with no problem named |
| The maker's letter | first person, the reason behind the work, one argument carried across the page | makers, founders, small practices | the stance is put on |
| Playful, straight-faced | a small joke with the fact right under it | food, drink, small shops | the jokes are random or touch money or health |
| Literary and formal | concrete nouns, few adjectives, slow sentences | craft, culture, hospitality with a history | it turns to perfume copy with no facts |

- **The owner's own voice comes first:** a letter, an old site or the way they speak in the brief overrides the menu.
- **The other-trade test:** picture the card on nine businesses in nine other trades. If it suits any of them, push it towards this client.
- **Voice holds, tone moves.** The opening and the story carry the most voice. Prices, questions, booking and forms go plain; errors and confirmations are short and kind.

## 3. Shape from the visitor's questions

A visitor asks roughly: what is this, is it for me, why believe you, how does it work, what does it cost, what if it goes wrong, what do I do now. A section exists only if the brief has true material for it; five full sections beat eight padded ones. Counts follow the content: four real services are four items, one quote is one quote, no testimonials is a normal page. Vary what fills the sections (a list, a table, a short letter, one longer paragraph, a heading with one line under it) rather than repeating label, heading, lead and three cards.

## 4. Drafting

- **Facts where adjectives want to go:** "fast" is followed in the same sentence by the figure or the method; adjectives that stay are physical or measurable (*chêne massif*, 58 mm, ground floor).
- **Proper nouns over categories:** the street, the river, the tool by name, the species of wood.
- **The method in verb-led steps** persuades more than how good the result is.
- **One admission a page**, said plainly, from the brief.
- **Numbers in sentences with their unit**, uneven where real.
- **Buttons:** a verb and the real object (*Demander un devis*, *Réserver une table*).
- **Microcopy carries the voice too:** form labels and errors, the sent message, the 404 page. This is where a dry line is welcome.
- **Repeat the name** instead of cycling through "the studio, the team, the house".

## 5. The device budget, per page

None of these is banned; each works once.

| Device | Budget | `copy-tell` reports at |
|---|---|---|
| Heading in two fragments « X. Y. » | 1 | 3 on a page |
| Pair of counts « Quatre projets, quatre problèmes » | 0 to 1 | 2 on a page |
| Contrast frame: not X but Y, rather than, instead of, without the, more than just; *ne … pas … mais*, *plutôt que*, *au lieu de*, *pas seulement*, *non pas* (they count together) | 2 | 5 on a page |
| Run of refusals « Pas de X. Pas de Y. » | 1 | 3 runs |
| Virtue words about ourselves | 0 | 3 on a page |
| Em dashes | a few | 6 on a page |
| Exclamation marks in body copy | 0 | 3 on a page |
| Dry closing line on a paragraph | 2, never in a row | (read for it) |
| Pun on the name | 1, never the h1 | (read for it) |
| Strip of figures | facts from the brief only | (read for it) |
| Small label over a heading | 1 or 2 a page | `audit:composition` |
| "Since [year]", a response-time promise | once, from the brief | (read for it) |

## 6. The tells

**Reported on their own** (`copy-tell`, one finding per word or line):

- *Words that stand in for a fact:* elevate, unlock, seamless, effortless, cutting-edge, world-class, state-of-the-art, robust, bespoke, curated, nestled, unparalleled, delve, tapestry, realm; *sublimer*, *incontournable*, *d'exception*, *écrin*, *innovant*, *de pointe*, *unique en son genre*, *hors du commun*, *plongez*, *savoir-faire unique*. "Seamless" stands in for the setup steps, "robust" for the failure case, *d'exception* for the thing that makes it so: write that instead.
- *Stock lines:* in today's fast-paced world, look no further, say goodbye to, whether you're X or Y, join thousands of, at your fingertips, where X meets Y, in the heart of; *dans un monde en constante évolution*, *ne cherchez plus*, *n'attendez plus*, *que vous soyez X ou Y*, *bien plus qu'un*, *laissez-vous séduire*, *en quelques clics*, *votre partenaire de confiance*, *n'hésitez pas à*, *au cœur de*, *alliant X et Y*, *nous vous accompagnons*.
- *Residue:* lorem ipsum, [Company Name], `{{ tokens }}`, "Certainly!", markdown asterisks or `##` on the page.
- *A copyright year older than this year.*

A word the trade uses literally (bespoke tailoring, a climbing harness, *au cœur de la vieille ville* when that is the address) goes in the budget's `copyAllow` list; the owner's or a customer's own words go in `<blockquote>`, `<q>` or `[data-copy-ignore]`.

**Read for them** (no check can count them):

- *Invented specifics:* a time of day, a batch number, a percentage nobody measured. The brief's details only; without them, a plainer line.
- *Polished testimonials,* always three, each a small story with a number. Only the brief's, word for word, with name and town.
- *The origin template:* "In [year], [two first names] found [an old workshop] and kept [one original detail]". The real story, or no story section.
- *The name's metaphor run into the ground:* a studio called *Copeau* that "shapes" every section.
- *Perfect evenness:* every card the same length, every paragraph the same arc.
- *The page talking about itself:* "this section shows", "below you'll find", *découvrez ci-dessous*.
- *The footer sign-off:* a line of poetry under the legal row.

## 7. Over-correction

Every rule breeds a habit; check for it after fixing.

| Rule applied | Habit it breeds | Counter |
|---|---|---|
| No em dashes | comma splices, full stops only | colons and brackets where natural |
| No "not X but Y" | "rather than", *plutôt que* | they count together; state the positive |
| No hype words | calm words: quietly, steady, honest | a fact in place of any adjective |
| Avoid threes | everything in pairs | list as many as there are |
| Be specific | invented numbers and anecdotes | the fact sheet, or a plainer line |
| Short sentences | a drumbeat of fragments | one sentence a section may run long |
| Add personality | a joke in every section | humour in the microcopy only |

**Not tells:** plain "is" and "has", perfect grammar, a transition word, a list of three when there are three things, a refrain repeated on purpose, persuasion on a page that sells, and copy the owner wrote.

## 8. Check before handoff

1. `npm run check:quality` and fix every `copy-tell`, or allow the word with the reason in the brief.
2. **A rival's name:** put a competitor, or the same trade in another town, into the h1, the line under it and each heading. A line that still reads true says nothing about this client; rewrite it from the fact sheet.
3. **Sameness across pages:** read the headings of every page side by side. A cadence or joke that repeats is a habit; break it.
4. **Read it aloud as the owner** and cut what they would not say about themselves.
5. **A fresh reader,** when a sub-agent is available: give it only the page text and ask what this is, who it is for, why this over the alternative, what it costs, what would make it hesitate, and which three lines sound like any other website. Fix what it finds.
