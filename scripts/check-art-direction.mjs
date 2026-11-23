import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

// Template markers ([...], <...>) and undecided values. A real decision may still mention
// the word "placeholder", for example a ban on placeholder imagery.
const UNDECIDED = /\[[^\]]*\]|<[^<>]+>|\b(?:TBD|TODO|to be decided)\b|^\s*placeholder\s*$/i;

export function validateRecord(markdown) {
  // A schema example inside a fenced block does not count as a decision.
  let fence = null;
  const prose = markdown.split(/\r?\n/).filter(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      return false;
    }
    return !fence;
  }).join('\n');
  const sections = [...prose.matchAll(/^## Art Direction Record\s*\r?$/gm)];
  if (sections.length !== 1) return ['Expected exactly one real ## Art Direction Record section.'];
  const section = prose.slice(sections[0].index + sections[0][0].length).split(/^## /m)[0];
  const errors = [];
  // A second record body elsewhere in the file (for example one pasted into the middle of a
  // sentence, so its heading is not at the start of a line) leaves the section above valid while
  // the newer decision goes unchecked. Found on a real site: the gate kept passing on a stale record.
  // A redesign keeps the direction it replaces for the record: a body under a `## Superseded …` or
  // `## Previous …` heading is history, not a second decision.
  const live = prose.split(/^(?=## )/m).filter(part => !/^## (Superseded|Previous)\b/i.test(part)).join('');
  const bodies = [...live.matchAll(/^\s*- \*\*Aesthetic Lane:\*\*/gm)].length;
  if (bodies > 1) errors.push(`Found ${bodies} record bodies (lines starting "- **Aesthetic Lane:**"). Keep exactly one, under the ## Art Direction Record heading; move a direction a redesign replaces under a "## Superseded Art Direction Record (<date>)" heading, or remove it.`);
  if (/\S[^\n]*## Art Direction Record[ \t]*$/m.test(prose)) errors.push('A line ends with "## Art Direction Record" in the middle of other text: a record was pasted into a sentence. Restore that sentence and keep the record in its own section.');
  const field = name => {
    const matches = [...section.matchAll(new RegExp(`^\\s*- \\*\\*${name}:\\*\\*[ \t]*(.*)$`, 'gm'))];
    const value = matches[0]?.[1]?.trim() ?? '';
    if (matches.length !== 1 || !value || UNDECIDED.test(value)) {
      errors.push(`${name} must have one concrete, non-placeholder value.`);
    }
    return value;
  };
  const lane = field('Aesthetic Lane');
  if (!/^(Technical Systems|Product-Led Minimalism|Editorial Paper|Luminous Futurism|Atelier & Craft|Civic & Community|Club & Fixture)(?:\s*[—:;-].+)?$/.test(lane)
      && !/^Custom \/ existing brand\s*[—:;-]\s*\S.+$/.test(lane)) {
    errors.push('Aesthetic Lane must name a reference lane, or Custom / existing brand with a rationale.');
  }
  field('Narrative Metaphor');
  const type = field('Typography Pairing');
  if (!/Display:\s*\S.+?[,;]\s*Body:\s*\S/i.test(type)) errors.push('Typography Pairing must name Display and Body families.');
  // Token Physics has nested fields instead of a scalar value.
  const physics = [...section.matchAll(/^\s*- \*\*Token Physics:\*\*\s*$/gm)];
  if (physics.length !== 1) errors.push('Expected one Token Physics block.');
  const physicsBlock = physics.length === 1 ? section.slice(physics[0].index + physics[0][0].length).split(/^\s*- \*\*/m)[0] : '';
  for (const name of ['Canvas', 'Action/Accent', 'Borders', 'Spatial Density']) {
    const matches = [...physicsBlock.matchAll(new RegExp(`^ +[-] ${name}:[ \\t]*(.*)$`, 'gm'))];
    if (matches.length !== 1 || !matches[0][1].trim() || UNDECIDED.test(matches[0][1])) errors.push(`Token Physics needs a concrete ${name}.`);
  }
  const anti = field('Site Anti-Patterns').split(';').map(value => value.trim()).filter(Boolean);
  if (anti.length < 2 || anti.length > 3) errors.push('Site Anti-Patterns needs two or three concrete items separated by semicolons.');
  return errors;
}

/**
 * A record that still holds a lane's defaults. `design:tokens --init-client` (and --write-record) write the
 * lane's generic values with a marker comment (design-system.mjs LANE_DEFAULTS_MARKER); the record is only
 * structurally valid until the site's own decisions replace them. Checked by every --require-* run.
 */
export function validateRecordDecided(markdown) {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const start = lines.findIndex(line => /^## Art Direction Record\s*$/.test(line));
  if (start < 0) return [];
  const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  const marked = lines.slice(start + 1, end < 0 ? undefined : end).some(line => /<!--\s*art-direction-record:\s*lane defaults\b/i.test(line));
  return marked ? ['The Art Direction Record still holds the lane\'s defaults written by design:tokens (the marker comment under its heading). Replace every line with this site\'s decisions (site-art-direction/references/world-building.md), then delete the comment.'] : [];
}

// The site's world and its decisions (site-art-direction/references/world-building.md), required
// with the reference research for a new direction.
export const WORLD_PARTS = Object.freeze(['Source object', 'Inventory', 'Objects', 'Surfaces', 'Type', 'Motion', 'Photographs', 'Feature']);
export const WORLD_BAR = Object.freeze({ inventory: 12, decisions: 3 });

// Words the starter and the platform own. A record often mentions them in backticks beside its world
// motions (the page-transition style, the arrival attribute, the smooth-scroll library, the motion
// query), and none of them is a @keyframes name of the site's world: sprint records that named
// `lift` or `data-arrive` failed the world-motion floor for an animation that was never promised.
export const NOT_A_WORLD_MOTION = Object.freeze(['fade', 'lift', 'curtain', 'wipe', 'lenis', 'view', 'scroll', 'data-arrive', 'data-reveal', 'data-scroll', 'prefers-reduced-motion', 'no-preference', 'reduce', 'transitionstyle', 'siteshell', 'clientrouter', 'animation-timeline', 'animation-name', 'view-transition', 'infinite', 'linear', 'both', 'forwards']);

// A motion is written as its name and what it belongs to: `door-opens`: the cellar door, or
// `door-opens` (the cellar door). When the line uses that form, only those names count, so a
// backticked word inside a description is not read as a promise. A line without it (an older record
// that lists names with commas) keeps every backticked identifier.
const motionNamesIn = value => {
  const found = [...String(value).matchAll(/`([A-Za-z_-][\w-]*)`(\s*[:(])?/g)].filter(match => !NOT_A_WORLD_MOTION.includes(match[1].toLowerCase()));
  const described = found.filter(match => match[2]);
  return [...new Set((described.length ? described : found).map(match => match[1]))];
};

// How much motion the site carries, decided from the client's own words and recorded with them.
// task: the visitor came to do one thing fast. editorial: the world's CSS motions. impression: the
// site's job is how it feels, and scripted motion (smoothed scroll, page transitions, pinned scenes)
// is expected; audit:composition checks that an impression site has them.
export const MOTION_TIERS = Object.freeze(['task', 'editorial', 'impression']);

const recordSection = markdown => {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const start = lines.findIndex(line => /^## Art Direction Record\s*$/.test(line));
  if (start < 0) return [];
  const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  return lines.slice(start + 1, end < 0 ? undefined : end);
};

/** The record's Motion Tier: 'task', 'editorial' or 'impression'; null when the record has no such line; 'invalid' for another word. */
export function motionTier(markdown) {
  const line = recordSection(markdown).find(entry => /^\s*- \*\*Motion Tier:\*\*/.test(entry));
  if (!line) return null;
  const word = (line.replace(/^\s*- \*\*Motion Tier:\*\*/, '').trim().match(/^[A-Za-z]+/) ?? [''])[0].toLowerCase();
  return MOTION_TIERS.includes(word) ? word : 'invalid';
}

/** With required: a new direction records its tier and the client's words that decide it. A tier that is present is always checked. */
export function validateMotionTier(markdown, { required = false } = {}) {
  const line = recordSection(markdown).find(entry => /^\s*- \*\*Motion Tier:\*\*/.test(entry));
  const form = '- **Motion Tier:** task | editorial | impression — "<the client\'s words that decide it>"';
  if (!line) return required ? [`Motion Tier: add the line ${form} to the record (site-art-direction, "Set the expressive range").`] : [];
  const tier = motionTier(markdown);
  if (tier === 'invalid') return [`Motion Tier: the first word must be task, editorial or impression (${form}).`];
  const reason = line.replace(/^\s*- \*\*Motion Tier:\*\*\s*[A-Za-z]+/, '').replace(/^[\s—–:-]+/, '').trim();
  if (reason.length < 12 || /^[<\[]/.test(reason)) return [`Motion Tier: after "${tier}", quote the client's words that decide it (${form}).`];
  return [];
}

// Where the world comes from. Trial sites for unrelated trades shared one look because each took its
// devices from the same written list; a world taken from this client's photographs and from saved
// pictures of the trade's real things (design:world) differs from site to site. The record names
// those files, and the gate checks that they are there.
export const SOURCE_BAR = Object.freeze({ total: 4, client: 2, world: 2 });
export const WORLD_SOURCES_DIR = 'audit/world/';

/** The files the record's World › Sources line names, in backticks. */
export function worldSources(markdown) {
  const line = recordSection(markdown).find(entry => /^\s+- Sources:/.test(entry));
  if (!line) return null;
  return [...new Set([...line.matchAll(/`([^`\s]+\.[A-Za-z0-9]{2,5})`/g)].map(match => match[1].replaceAll('\\', '/').replace(/^\.\//, '')))];
}

/** With required: a new direction names its sources. A Sources line that is present is always checked. */
export function validateSources(markdown, { required = false, exists = () => true } = {}) {
  const sources = worldSources(markdown);
  const form = '"  - Sources: `<file>`: <what the picture shows> → <what the site builds from it>; …" in the World block';
  if (!sources) return required ? [`World: add ${form} (site-art-direction/references/world-building.md, step 1). Name at least ${SOURCE_BAR.client} of the client's photographs and at least ${SOURCE_BAR.world} pictures saved by "npm run design:world -- get" under ${WORLD_SOURCES_DIR}.`] : [];
  const errors = [];
  const missing = sources.filter(file => !exists(file));
  if (missing.length) errors.push(`World: Sources names ${missing.map(file => `\`${file}\``).join(', ')}, which ${missing.length === 1 ? 'is' : 'are'} not in the site. Write each path from the site's folder, as the file is saved.`);
  const found = sources.filter(file => exists(file));
  const world = found.filter(file => file.startsWith(WORLD_SOURCES_DIR));
  const client = found.filter(file => !file.startsWith(WORLD_SOURCES_DIR));
  if (found.length < SOURCE_BAR.total || world.length < SOURCE_BAR.world || client.length < SOURCE_BAR.client) {
    errors.push(`World: Sources names ${client.length} of the client's photographs and ${world.length} saved pictures under ${WORLD_SOURCES_DIR}; name at least ${SOURCE_BAR.client} and ${SOURCE_BAR.world}, each as a file in backticks. Find and save pictures of the trade's real things with "npm run design:world -- search" and "-- get".`);
  }
  return errors;
}

/** The @keyframes names the record's World › Motion line promises (audit:composition checks they run). */
export function worldMotionNames(markdown) {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const start = lines.findIndex(line => /^## Art Direction Record\s*$/.test(line));
  if (start < 0) return [];
  const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  const line = lines.slice(start + 1, end < 0 ? undefined : end).find(entry => /^\s+- Motion:/.test(entry));
  return line ? motionNamesIn(line.replace(/^\s+- Motion:/, '')) : [];
}

export function validateWorld(markdown) {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const start = lines.findIndex(line => /^## Art Direction Record\s*$/.test(line));
  if (start < 0) return ['World: no ## Art Direction Record section.'];
  const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  const section = lines.slice(start + 1, end < 0 ? undefined : end);
  const block = name => {
    const at = section.findIndex(line => new RegExp(`^\\s*- \\*\\*${name}:\\*\\*\\s*$`).test(line));
    if (at < 0) return null;
    const items = [];
    for (const line of section.slice(at + 1)) {
      if (/^\s*- \*\*/.test(line) || !/^\s+- /.test(line)) break;
      items.push(line.replace(/^\s+- /, '').trim());
    }
    return items;
  };
  const errors = [];
  const world = block('World');
  if (!world) errors.push('World: add the "- **World:**" block (site-art-direction/references/world-building.md).');
  else {
    for (const part of WORLD_PARTS) {
      const item = world.find(entry => entry.toLowerCase().startsWith(part.toLowerCase() + ':'));
      const value = item?.slice(part.length + 1).trim() ?? '';
      if (!value || UNDECIDED.test(value)) errors.push(`World: "${part}" needs a concrete value.`);
      else if (part === 'Inventory') {
        const count = value.split(';').map(v => v.trim()).filter(Boolean).length;
        if (count < WORLD_BAR.inventory) errors.push(`World: the inventory lists ${count} things; list at least ${WORLD_BAR.inventory}, separated by semicolons.`);
      } else if (part === 'Motion') {
        const names = motionNamesIn(value);
        if (names.length < 3) errors.push(`World: Motion names ${names.length} animation${names.length === 1 ? '' : 's'} in backticks; name at least three by their @keyframes names, each in backticks and followed by a colon and the object it belongs to, so audit:composition can check they run. The starter's own words (a transitionStyle value, \`data-arrive\`, \`Lenis\`) are not counted.`);
      }
    }
  }
  const decisions = block('Decisions');
  if (!decisions) errors.push('Decisions: add the "- **Decisions:**" block with the easy version and ours for the look, the feature and the content.');
  else {
    const valid = decisions.filter(entry => /\bEasy:\s*\S.+\bOurs:\s*\S/.test(entry) && !UNDECIDED.test(entry));
    if (valid.length < WORLD_BAR.decisions) errors.push(`Decisions: ${valid.length} entr${valid.length === 1 ? 'y' : 'ies'} with "Easy: … Ours: …"; write at least ${WORLD_BAR.decisions} (the look, the feature, the content).`);
  }
  return errors;
}

export function validateCssAlignment(markdown, css) {
  if (!css) return [];
  const laneMatch = String(markdown ?? '').match(/^\s*- \*\*Aesthetic Lane:\*\*[ \t]*(Technical Systems|Product-Led Minimalism|Editorial Paper|Luminous Futurism)\b/m);
  if (!laneMatch) return [];
  const isUntouchedNeutralPage = /--color-page\s*:\s*oklch\(\s*99%\s+0\.004\s+250\s*\)/i.test(css);
  const isUntouchedNeutralAction = /--color-action\s*:\s*oklch\(\s*43%\s+0\.14\s+250\s*\)/i.test(css);
  if (isUntouchedNeutralPage && isUntouchedNeutralAction) {
    const slug = laneMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return [`src/styles/global.css still has the untouched neutral starter palette while AGENTS.md declares "${laneMatch[1]}". Run: npm run design:tokens -- --lane ${slug} --write`];
  }
  return [];
}

// Reference research (site-art-direction/references/reference-research.md): candidates found and
// captured, each scored on one scorecard, at least three selected above the bar, and the chosen
// concept scored on the same card at or above the selected references' median on the design lines.
// The photographs line is scored and reported but left out of the concept bar: a concept cannot
// change the owner's camera, and two trials stalled under a bar their phone photographs held down.
export const REFERENCE_DIMENSIONS = Object.freeze(['first screen', 'specificity', 'type', 'photographs', 'composition', 'craft', 'phone', 'fit']);
export const DESIGN_DIMENSIONS = Object.freeze(REFERENCE_DIMENSIONS.filter(d => d !== 'photographs'));
const designTotal = score => DESIGN_DIMENSIONS.reduce((sum, d) => sum + score.scores[d], 0);
export const REFERENCE_BAR = Object.freeze({ total: 17, specificity: 2, fit: 2, candidates: 8, sites: 5, selected: 3, searches: 3, studyCraft: 3, conceptGap: 2, conceptRounds: 3 });
export const REFERENCES_FILE = 'audit/references/references.md';

function tableRows(markdown, heading) {
  const start = markdown.search(new RegExp(`^###\\s+${heading}\\s*$`, 'mi'));
  if (start < 0) return null;
  const body = markdown.slice(start).split(/\r?\n/).slice(1);
  const rows = [];
  for (const line of body) {
    if (/^#{1,3}\s/.test(line)) break;
    if (!/^\s*\|/.test(line) || /^\s*\|[\s:|-]+\|\s*$/.test(line)) continue;
    rows.push(line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));
  }
  // The first row is the header; a later table under the same heading (one per round) repeats it.
  const header = (rows[0] ?? []).join('|').toLowerCase();
  return rows.slice(1).filter(row => row.join('|').toLowerCase() !== header);
}

function scoreRow(cells, label, errors) {
  const scores = cells.slice(0, REFERENCE_DIMENSIONS.length).map(Number);
  if (scores.length < REFERENCE_DIMENSIONS.length || scores.some(s => !Number.isInteger(s) || s < 0 || s > 3)) {
    errors.push(`${label}: each of ${REFERENCE_DIMENSIONS.join(', ')} needs a score from 0 to 3.`);
    return null;
  }
  const total = Number(cells[REFERENCE_DIMENSIONS.length]);
  const sum = scores.reduce((a, b) => a + b, 0);
  if (total !== sum) errors.push(`${label}: total ${cells[REFERENCE_DIMENSIONS.length]} should be ${sum}.`);
  return { scores: Object.fromEntries(REFERENCE_DIMENSIONS.map((d, i) => [d, scores[i]])), total: sum };
}

const median = values => { const s = [...values].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };

/**
 * @param {string} markdown the references file
 * @param {{ capturedImages?: (dir: string) => number }} [io] how many images a capture folder holds
 */
export function validateReferences(markdown, io = {}) {
  const text = String(markdown ?? '');
  const errors = [];
  const field = name => (text.match(new RegExp(`^\\s*- \\*\\*${name}:\\*\\*[ \\t]*(.*)$`, 'mi'))?.[1] ?? '').trim();
  for (const name of ['Brief', 'Judged by']) {
    const value = field(name);
    if (!value || UNDECIDED.test(value)) errors.push(`${name} needs a concrete value.`);
  }
  const searches = [...field('Searches').matchAll(/"[^"]{3,}"|“[^”]{3,}”/g)];
  if (searches.length < REFERENCE_BAR.searches) errors.push(`Searches needs at least ${REFERENCE_BAR.searches} quoted queries actually run.`);

  const candidates = tableRows(text, 'Candidates');
  if (!candidates) return [...errors, 'Missing the ### Candidates table.'];
  const parsed = [];
  for (const cells of candidates) {
    const [id, source, kind, ...rest] = cells;
    const label = `Candidate ${id || '?'}`;
    // A URL may carry a note after it (the studio a case study comes from), as audit:composition reads it.
    if (!id || !source || !/^(https?:\/\/\S+(\s.*)?|[\w./-]+)$/.test(source)) { errors.push(`${label}: needs an id and a URL or path.`); continue; }
    if (!/^(site|study|prompt|template|system|owner)$/.test(kind)) errors.push(`${label}: kind must be site, study, prompt, template, system or owner.`);
    const score = scoreRow(rest, label, errors);
    const verdict = rest[REFERENCE_DIMENSIONS.length + 1] ?? '';
    // "not selected: <reason>" is a candidate above the bar that was left out for a reason (the same idea as another).
    if (!/^(selected|owner|(rejected|not selected):\s*\S.{3,})$/i.test(verdict)) errors.push(`${label}: verdict must be selected, owner, "rejected: <reason>" or "not selected: <reason>".`);
    parsed.push({ id, source, kind, score, verdict: verdict.toLowerCase().split(':')[0] });
  }
  if (parsed.length < REFERENCE_BAR.candidates) errors.push(`Found ${parsed.length} candidates; judge at least ${REFERENCE_BAR.candidates}.`);
  const realSite = c => c.kind === 'site' || c.kind === 'study';
  if (parsed.filter(realSite).length < REFERENCE_BAR.sites) errors.push(`At least ${REFERENCE_BAR.sites} candidates must be real sites (kind site or study).`);

  const selected = parsed.filter(c => c.verdict === 'selected');
  if (selected.length < REFERENCE_BAR.selected) errors.push(`Selected ${selected.length}; select at least ${REFERENCE_BAR.selected} above the bar, searching again if too few pass.`);
  if (selected.filter(realSite).length < 2) errors.push('At least two selected references must be real sites.');
  // One selected real site must show a made world, or the level the design aims at is a quiet site (a
  // trial's only case study was one face in four sizes). Proving that a site is a studio's case study cost
  // two trials half their research time, so any real site at craft 3 sets the level; studio case studies
  // (kind study) are where one is usually found.
  const madeWorld = selected.filter(realSite).filter(c => c.score?.scores.craft >= REFERENCE_BAR.studyCraft);
  if (!madeWorld.length) errors.push(`Select at least one real site that scores ${REFERENCE_BAR.studyCraft} on craft, a made world (surfaces, drawn objects, type treatments and motion): it sets the level the design aims at. The selected sites score craft ${selected.filter(realSite).map(c => `${c.id} ${c.score?.scores.craft ?? '?'}`).join(', ') || 'nothing'}. Studios that build illustrated, layered sites for small clients show them on their work pages (kind study).`);
  for (const c of selected) {
    if (!c.score) continue;
    if (c.score.total < REFERENCE_BAR.total) errors.push(`Candidate ${c.id} is selected with ${c.score.total}/24; the bar is ${REFERENCE_BAR.total}.`);
    if (c.score.scores.specificity < REFERENCE_BAR.specificity) errors.push(`Candidate ${c.id} is selected with specificity ${c.score.scores.specificity}; the bar is ${REFERENCE_BAR.specificity}.`);
    if (c.score.scores.fit < REFERENCE_BAR.fit) errors.push(`Candidate ${c.id} is selected with fit ${c.score.scores.fit}; the bar is ${REFERENCE_BAR.fit}.`);
    const section = text.match(new RegExp(`^####\\s+${c.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^\\n]*\\n([\\s\\S]*?)(?=^#{2,4}\\s|(?![\\s\\S]))`, 'm'))?.[1] ?? '';
    const sub = name => (section.match(new RegExp(`^\\s*- \\*\\*${name}:\\*\\*[ \\t]*(.*)$`, 'mi'))?.[1] ?? '').trim();
    if (!section) { errors.push(`Selected ${c.id} needs its own #### ${c.id} section.`); continue; }
    for (const name of ['Idea we take', 'What we refuse']) if (!sub(name) || UNDECIDED.test(sub(name))) errors.push(`Selected ${c.id}: ${name} needs a concrete value.`);
    const captured = sub('Captured').replace(/`/g, '');
    if (!captured) errors.push(`Selected ${c.id}: Captured needs the folder of its screenshots.`);
    else if (io.capturedImages && io.capturedImages(captured) < 2) errors.push(`Selected ${c.id}: ${captured} needs at least two screenshots (wide and phone).`);
  }

  const bar = median(selected.filter(c => c.score && c.kind !== 'owner').map(c => designTotal(c.score)));
  const concepts = tableRows(text, 'Concepts against the bar');
  if (!concepts) return [...errors, 'Missing the ### Concepts against the bar table: score each concept on the same card.'];
  // "chosen: <reason>", "chosen — <reason>" or "chosen (<reason>)" reads as chosen. A Stage 5 score of a built
  // page of the chosen direction is "built: <route> <note>": one trial marked every built row "not chosen"
  // because the table allowed one "chosen" row, though each was the chosen direction.
  const scored = concepts.map(([name, ...rest]) => {
    const raw = (rest[REFERENCE_DIMENSIONS.length + 1] ?? '').trim();
    const verdict = raw.toLowerCase().split(/\s*[:—–(]\s*|\s+-\s+/)[0].trim();
    const route = verdict === 'built' ? raw.replace(/^built\s*(?:[:—–(]|\s-\s)?\s*/i, '').match(/^\/\S*/)?.[0] : undefined;
    return { name, score: scoreRow(rest, `Concept ${name || '?'}`, errors), verdict, route };
  });
  const chosen = scored.filter(c => c.verdict === 'chosen');
  const built = scored.filter(c => c.verdict === 'built');
  if (scored.length - built.length < 2) errors.push('Score at least two concepts against the bar.');
  if (chosen.length !== 1) errors.push('Mark exactly one concept "chosen" (the others "not chosen") in the verdict column; a reason may follow after a colon, a dash or in brackets. A scored built page of the chosen direction is "built: <route>".');
  for (const b of built) if (!b.route) errors.push(`Concept row ${b.name || '?'}: a built row names its page, for example "built: / round 2".`);
  // The bar is judged on the home page as it now stands (its last built row), else on the chosen concept.
  // Other built pages are reported against it, never failed: STUDIO_LEVEL is a home-page measure too.
  const homeBuilt = built.filter(b => b.route === '/');
  const judged = homeBuilt.length ? [homeBuilt.at(-1)] : chosen;
  const lastPerRoute = new Map(built.filter(b => b.route && b.route !== '/').map(b => [b.route, b]));
  for (const other of lastPerRoute.values()) {
    if (!other.score || !io.notes) continue;
    const design = designTotal(other.score);
    const weak = DESIGN_DIMENSIONS.filter(d => other.score.scores[d] < 2);
    if (design < bar) io.notes.push(`Advisory: the built page ${other.route} scores ${design}/${DESIGN_DIMENSIONS.length * 3} on the design lines, under the selected references' median of ${bar}.`);
    if (weak.length) io.notes.push(`Advisory: the built page ${other.route} scores under 2 on ${weak.join(', ')}.`);
  }
  for (const c of judged) {
    if (!c.score) continue;
    const label = c.verdict === 'built' ? `The built page ${c.route}` : 'The chosen concept';
    const design = designTotal(c.score);
    // A recorded gap: after three scored rounds, a concept within two points of the bar may stand when the
    // record names what holds it down outside the layout (stand-in photographs, missing owner material) and
    // what would close it. One trial re-scored its built page eight times and plateaued a point or two under:
    // every reviewer named the stand-in photographs, which no layout change can fix.
    const gap = text.match(/^###\s+Gap to the bar[^\n]*\n([\s\S]*?)(?=^#{2,3}\s|(?![\s\S]))/m)?.[1]?.trim() ?? '';
    const recordedGap = bar - design <= REFERENCE_BAR.conceptGap && scored.length >= REFERENCE_BAR.conceptRounds && gap.length >= 60;
    // The bar may be reached in the built page (Stage 5), so before Stage 5 a concept under it is reported,
    // not failed (io.deferBar); the Stage 5 gate (--require-comparison) enforces it. Otherwise the gate the
    // build starts from stays red for the whole build, which reads like a stop.
    const barIssues = [];
    if (design < bar && !recordedGap) barIssues.push(`${label} scores ${design}/${DESIGN_DIMENSIONS.length * 3} on the design lines (photographs aside), under the selected references' median of ${bar}: raise it, in a concept or in the built page scored with the Stage 5 comparison. After ${REFERENCE_BAR.conceptRounds} scored rounds, a concept within ${REFERENCE_BAR.conceptGap} points may stand with a ### Gap to the bar section naming what holds it down outside the layout and what would close it.`);
    const weak = DESIGN_DIMENSIONS.filter(d => c.score.scores[d] < 2);
    if (weak.length) barIssues.push(`${label} scores under 2 on ${weak.join(', ')}.`);
    if (io.deferBar && io.notes) io.notes.push(...barIssues);
    else errors.push(...barIssues);
  }
  return errors;
}

// Stage 5 comparison pass (new-site-workflow/references/impeccable-passes.md): each representative
// page captured beside the selected references on one sheet, a fresh reviewer naming what the
// references do that the page does not, and those additions built, for one or two rounds.
export const COMPARISON_BAR = Object.freeze({ additions: 5 });

/**
 * @param {string} markdown the references file
 * @param {{ exists?: (file: string) => boolean }} [io]
 */
export function validateComparison(markdown, io = {}) {
  const rows = tableRows(String(markdown ?? ''), 'Built against the references');
  if (!rows) return ['Missing the ### Built against the references table: compare each representative page with the references on a sheet and build what they do that it does not.'];
  const errors = [];
  const rounds = new Map();
  for (const [page, round, sheet, theyDo, weBuilt] of rows) {
    const label = `Comparison ${page || '?'} round ${round || '?'}`;
    if (!page || !page.startsWith('/')) { errors.push(`${label}: page must be a route such as /.`); continue; }
    if (!/^[12]$/.test(round ?? '')) errors.push(`${label}: round must be 1 or 2.`);
    const sheetPath = (sheet ?? '').replace(/`/g, '');
    if (!sheetPath) errors.push(`${label}: name the comparison sheet.`);
    else if (io.exists && !io.exists(sheetPath)) errors.push(`${label}: the sheet ${sheetPath} does not exist.`);
    for (const [name, value] of [['the references do', theyDo], ['we built', weBuilt]]) if (!value || UNDECIDED.test(value) || value.length < 12) errors.push(`${label}: "${name}" needs a concrete description.`);
    const key = `${page}|${round}`;
    rounds.set(key, (rounds.get(key) ?? 0) + 1);
  }
  const pages = new Set([...rounds.keys()].map(key => key.split('|')[0]));
  if (!pages.size) errors.push('Compare at least the home page.');
  for (const page of pages) {
    const first = rounds.get(`${page}|1`) ?? 0;
    if (first < COMPARISON_BAR.additions) errors.push(`Comparison ${page}: round 1 builds ${first} addition${first === 1 ? '' : 's'}; build the ${COMPARISON_BAR.additions} biggest differences the reviewer named.`);
  }
  return errors;
}

export function isVisualPath(file) {
  return /^(src|public)\//.test(file.replaceAll('\\', '/'));
}

export function matchesException(file, content, exceptions) {
  const entry = exceptions.find(item => item.path === file);
  return Boolean(entry?.reason?.trim() && entry.sha256 === createHash('sha256').update(String(content).replaceAll('\r\n', '\n')).digest('hex'));
}

export function matchesDeletionException(file, previousContent, exceptions) {
  return exceptions.some(item => item.path === file && item.deleted === true)
    && matchesException(file, previousContent, exceptions);
}

export function formatRecordDiagnostics(markdown, errors) {
  const expected = [
    '## Art Direction Record',
    '- **Aesthetic Lane:** <reference lane, or Custom / existing brand — rationale>',
    '- **Narrative Metaphor:** <concrete visual narrative>',
    '- **Typography Pairing:** Display: <family>, Body: <family>, Utility: <family> (the third voice, when the World has one)',
    '- **Token Physics:**',
    '  - Canvas: <concrete surface>',
    '  - Action/Accent: <concrete action color>',
    '  - Borders: <concrete border treatment>',
    '  - Spatial Density: <concrete spacing approach>',
    '- **Site Anti-Patterns:** <first ban>; <second ban>; <optional third ban>',
    '- **Motion Tier:** <task | editorial | impression> — "<the client\'s words that decide it>"',
  ];
  let fence = null, inRecord = false;
  const received = [];
  markdown.split(/\r?\n/).forEach((line, index) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      return;
    }
    if (fence) return;
    if (/^## /.test(line)) inRecord = /^## Art Direction Record\s*$/.test(line);
    if (inRecord && line.trim()) received.push(`- AGENTS.md:${index + 1}: ${line}`);
  });
  return [
    'Art direction gate: FAIL',
    'Expected vs Received — required record structure diff (+ expected, - received):',
    ...(received.length ? received : ['- AGENTS.md: no real Art Direction Record found outside code fences']),
    ...expected.map(line => '+ ' + line),
    'Invalid fields:', ...errors.map(error => `  - ${error}`),
    'Remediation: edit AGENTS.md with concrete decisions in this structure; angle-bracket examples are not valid decisions.',
    'Recheck: npm run check:art-direction -- --require-record',
  ].join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf('--base');
  const base = baseIndex >= 0 ? args[baseIndex + 1] : 'HEAD';
  if (!base || base.startsWith('-')) throw new Error('--base requires a Git revision.');
  const git = (...gitArgs) => execFileSync('git', gitArgs, { encoding: 'utf8' }).split('\0').filter(Boolean);
  const agentsMd = existsSync('AGENTS.md') ? readFileSync('AGENTS.md', 'utf8') : '';
  const recordErrors = validateRecord(agentsMd);
  // Any --require-* flag asks for that check whatever changed: without this, a fresh site with no
  // visual change passed --require-references through the changed-files shortcut below.
  if (args.includes('--changed') && !args.some(arg => arg.startsWith('--require-'))) {
    let gitReady = true;
    try { execFileSync('git', ['rev-parse', '--verify', base], { stdio: 'pipe' }); }
    catch (error) {
      if (baseIndex >= 0) throw error;
      gitReady = false;
    }
    const walk = directory => existsSync(directory) ? readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const file = join(directory, entry.name).replaceAll('\\', '/');
      if (entry.isSymbolicLink()) throw new Error('Visual source may not be symlinked: ' + file);
      return entry.isDirectory() ? walk(file) : [file];
    }) : [];
    // Fresh generated projects have no Git history yet. Check every visual file
    // against exact starter exceptions rather than silently skipping the gate.
    // Without a valid record, a diff against the base only sees work that is not committed
    // (or not in this push) yet: committed client pages then pass unchecked. Check every
    // tracked visual file against the exact exceptions until a record exists.
    const wholeTree = gitReady && recordErrors.length > 0;
    const emptyTree = wholeTree ? execFileSync('git', ['hash-object', '-t', 'tree', '--stdin'], { input: '', encoding: 'utf8' }).trim() : null;
    const changed = [...new Set(gitReady ? [
      ...git('diff', '--relative', '--name-only', '-z', base, '--', '.'),
      ...(wholeTree ? git('diff', '--relative', '--name-only', '-z', emptyTree, '--', '.') : []),
      ...git('ls-files', '--others', '--exclude-standard', '-z', '--', '.'),
    ] : [...walk('src'), ...walk('public')])].filter(isVisualPath);
    if (!changed.length) { console.log('Art direction gate: no visual source changes.'); return; }
    const exceptionsPath = 'audit/design-gate-exceptions.json';
    const exceptions = existsSync(exceptionsPath) ? JSON.parse(readFileSync(exceptionsPath, 'utf8')) : [];
    const uncovered = changed.filter(file => {
      if (existsSync(file)) return !matchesException(file, readFileSync(file), exceptions);
      try {
        const previous = execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8' });
        return !matchesDeletionException(file, previous, exceptions);
      } catch { return true; }
    });
    if (!uncovered.length) { console.log('Art direction gate: exact infrastructure exceptions cover these changes.'); return; }
    console.log(`Art direction gate: checking record for ${uncovered.join(', ')}`);
  }
  const css = existsSync('src/styles/global.css') ? readFileSync('src/styles/global.css', 'utf8') : null;
  const errors = [...recordErrors, ...validateCssAlignment(agentsMd, css)];
  if (args.some(arg => arg.startsWith('--require-'))) errors.push(...validateRecordDecided(agentsMd));
  // A new direction (Stage 4) needs judged references; a record that names the file keeps it valid.
  const namesReferences = /^\s*- \*\*References:\*\*[ \t]*\S/m.test(agentsMd);
  if (args.includes('--require-references') || namesReferences) {
    if (!existsSync(REFERENCES_FILE)) errors.push(`Reference research is missing: write ${REFERENCES_FILE} (site-art-direction/references/reference-research.md).`);
    else {
      const capturedImages = dir => existsSync(dir) ? readdirSync(dir, { recursive: true }).filter(name => /\.(png|jpe?g|webp)$/i.test(String(name))).length : 0;
      const text = readFileSync(REFERENCES_FILE, 'utf8');
      // Before Stage 5 (no --require-comparison and no comparison table yet) the concept bar is reported, not failed.
      const deferBar = !args.includes('--require-comparison') && !/^###\s+Built against the references\s*$/m.test(text);
      const notes = [];
      errors.push(...validateReferences(text, { capturedImages, deferBar, notes }).map(error => `${REFERENCES_FILE}: ${error}`));
      for (const note of notes) console.log(note.startsWith('Advisory:') ? note : `Concept bar, enforced at Stage 5 (--require-comparison): ${note}`);
    }
    // The same new direction builds its world and writes its decisions down.
    errors.push(...validateWorld(agentsMd).map(error => `AGENTS.md: ${error}`));
  }
  // A new direction (the flag is passed at Stage 4) records its motion tier; a tier that is written is always checked.
  errors.push(...validateMotionTier(agentsMd, { required: args.includes('--require-references') }).map(error => `AGENTS.md: ${error}`));
  // The same new direction names the photographs and saved pictures its world is taken from.
  errors.push(...validateSources(agentsMd, { required: args.includes('--require-references'), exists: existsSync }).map(error => `AGENTS.md: ${error}`));
  // Stage 5: the built pages compared with the references; a file that has the table keeps it valid.
  const referencesText = existsSync(REFERENCES_FILE) ? readFileSync(REFERENCES_FILE, 'utf8') : '';
  if (args.includes('--require-comparison') || /^###\s+Built against the references\s*$/m.test(referencesText)) {
    errors.push(...validateComparison(referencesText, { exists: existsSync }).map(error => `${REFERENCES_FILE}: ${error}`));
  }
  if (recordErrors.length) { console.error(formatRecordDiagnostics(agentsMd, errors)); process.exitCode = 1; }
  else if (errors.length) {
    console.error(['Art direction gate: FAIL', ...errors.map(error => `  - ${error}`), 'Recheck: npm run check:art-direction -- --require-record --require-references'].join('\n'));
    process.exitCode = 1;
  }
  else {
    console.log('Art direction record is structurally valid.');
    if (args.includes('--require-comparison')) console.log('👉 Next Step (Stage 5, then 6): the Impeccable craft critique of each representative page, then the full route set (new-site-workflow/references/impeccable-passes.md).');
    else console.log('👉 Next Step (Stage 4.5): Audit tokens with npm run design:tokens, calibrate building blocks on /_styleguide, and record findings in audit/component-calibration.md before implementing pages.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
