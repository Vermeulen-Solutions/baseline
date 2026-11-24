// Tells of model-written website copy, counted in the text a visitor reads (English and French).
// Used by check:quality (`copy-tell` findings); the guide is
// .agents/skills/new-site-workflow/references/copy-voice.md, which explains each tell and its fix.
//
// One tell proves little. The rules here report only what is a tell on its own (a banned word or
// stock line, template residue, a stale copyright year) and a device used so often on one page that
// it has become a habit (a two-fragment heading three times, a contrast frame five times). Words a
// trade uses literally are allowed per site with the budget's `copyAllow` list; someone else's
// words go in <blockquote>, <q> or [data-copy-ignore] and are never read.

const words = list => list.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'));
const any = list => new RegExp(`(?<![\\p{L}\\p{N}])(?:${words(list).join('|')})(?![\\p{L}\\p{N}])`, 'giu');

// Words that stand in for a fact. Each list is per language; a stem ending in * matches its forms.
const SLOP = {
  en: ['delve', 'delves', 'tapestry', 'testament to', 'realm', 'embark', 'beacon', 'multifaceted', 'paradigm', 'myriad', 'plethora',
    'meticulous', 'meticulously', 'elevate', 'elevates', 'unlock', 'unlocks', 'unleash', 'empower', 'empowers', 'supercharge',
    'seamless', 'seamlessly', 'effortless', 'effortlessly', 'cutting-edge', 'revolutionary', 'transformative', 'holistic',
    'next-level', 'world-class', 'best-in-class', 'game-changer', 'game-changing', 'state-of-the-art', 'synergy', 'reimagine',
    'reimagined', 'robust', 'nestled', 'unparalleled', 'unrivalled', 'unrivaled', 'bespoke', 'curated'],
  fr: ['sublimer', 'sublime', 'subliment', 'incontournable', 'incontournables', "d'exception", 'écrin', 'révolutionnaire',
    'révolutionnaires', 'innovant', 'innovante', 'innovants', 'innovantes', 'de pointe', 'unique en son genre', 'inégalé',
    'inégalée', 'hors du commun', 'à la pointe', 'synergie', 'plongez', 'embarquez', 'redéfinir', 'redéfinit', 'magnifier',
    'alliance parfaite', 'harmonie parfaite', 'véritable invitation', 'savoir-faire unique'],
};

// Stock lines that fit any business.
const STOCK = {
  en: [/in today's (?:fast-paced|digital|ever-changing) world/giu, /unlock the (?:power|potential) of/giu, /the future of [\p{L} ]{2,30} is here/giu,
    /say goodbye to/giu, /whether you're an? [\p{L} -]{2,30} or/giu, /join (?:thousands|hundreds) of/giu, /trusted by (?:teams|businesses|customers) (?:worldwide|everywhere)/giu,
    /imagine a world where/giu, /ready to (?:transform|elevate|take) your/giu, /look no further/giu, /one-stop shop/giu, /at your fingertips/giu,
    /in (?:just )?a few clicks/giu, /(?:it's|is) not just an? [\p{L} -]{2,30}, it's an?/giu, /where [\p{L} ]{2,25} meets [\p{L} ]{2,25}/giu, /in the heart of/giu],
  fr: [/dans un monde en (?:constante|perpétuelle) évolution/giu, /à l'ère du numérique/giu, /ne cherchez plus/giu, /n'attendez plus/giu,
    /que vous soyez (?:un |une )?[\p{L} -]{2,30} ou/giu, /bien plus qu'une? (?:simple )?/giu, /plus qu'une? simple/giu, /laissez-vous (?:séduire|tenter|porter|surprendre)/giu,
    /à portée de (?:main|clic)/giu, /en quelques clics/giu, /(?:votre|un) partenaire de confiance/giu, /n'hésitez pas à/giu, /au cœur de/giu,
    /où [\p{L} ]{2,25} rencontre [\p{L} ]{2,25}/giu, /alliant [\p{L} ]{2,30} et [\p{L} ]{2,30}/giu, /nous vous accompagnons/giu],
};

// The design process's own words, printed for visitors: the record's field names and the steps of the
// workflow. A page built from a recorded world can end up naming its own machinery (a heading that is a rule
// sentence, a caption that calls a photograph "the source object"); on another project an owner marked such a
// page among the lowest of ten rounds. Two-word phrases only, so ordinary uses of "world" or "object" pass.
const PROCESS = {
  en: ['source object', 'signature moment', 'signature moments', 'governing idea', 'art direction record', 'aesthetic lane',
    'narrative metaphor', 'token physics', 'motion tier', 'pinned scene', 'named motion', 'named motions', 'world motion',
    'world motions', 'made world', "the world's objects", 'display treatment', 'working feature', 'page archetype',
    'section object', 'easy version', 'first screen', 'reference research'],
  fr: ['objet source', 'moment signature', 'moments signature', 'idée directrice', 'métaphore narrative', 'scène épinglée',
    'mouvement nommé', 'mouvements nommés', 'monde construit', 'objets du monde', 'archétype de page', 'version facile', 'premier écran'],
};

// Left behind by a template or a conversation: the strongest single tell.
const RESIDUE = [/lorem ipsum/giu, /\[(?:company|client|business|your) name\]/giu, /\[nom (?:de l'entreprise|du client)\]/giu, /\{\{[^}]{1,40}\}\}/gu,
  /\bcertainly!/giu, /i hope this helps/giu, /\bas an ai\b/giu, /\[NEED[^\]]*\]/gu, /\*\*[^*\n]{1,60}\*\*/gu, /^#{1,4} /gmu];

// Sincerity said instead of shown: counted, reported only as a habit.
const VIRTUE = {
  en: ['honest', 'honestly', 'genuinely', 'truly', 'thoughtful', 'thoughtfully', 'carefully', 'intentional', 'intentionally', 'authentic', 'passionate'],
  fr: ['authentique', 'authenticité', 'sincère', 'sincèrement', 'véritablement', 'soigneusement', 'passionné', 'passionnée', 'passion', 'bienveillant',
    'bienveillante', 'bienveillance', 'minutieux', 'minutieuse', 'avec soin'],
};

// Contrast frames: suppress "not X but Y" and it comes back as "rather than", so they count together.
const CONTRAST = {
  en: [/\b(?:not|isn't|aren't|wasn't|don't|doesn't)\b[^.!?\n]{1,50}\bbut\b/giu, /\brather than\b/giu, /\binstead of\b/giu, /\bwithout the\b/giu, /\bmore than just\b/giu],
  fr: [/\bn(?:e\s|')[^.!?\n]{1,30}\bpas\b[^.!?\n]{1,50}\bmais\b/giu, /\bplutôt que\b/giu, /\bau lieu d(?:e\b|')/giu, /\bpas seulement\b/giu, /\bnon pas\b/giu, /\bpas de [^.!?\n]{1,30}, (?:mais|juste)\b/giu],
};

// "No forms. No waiting." / « Pas de formulaire. Pas d'attente. »
// The next item is a lookahead, so a run of three is two matches and a run of four three.
const NEGATION_RUN = {
  en: /(?:^|(?<=[.!?]\s))No\s[^.!?\n]{1,30}[.,]\s(?=No\s)/gmu,
  fr: /(?:^|(?<=[.!?]\s))(?:Pas d(?:e\s|')|Ni\s|Sans\s)[^.!?\n]{1,30}[.,]\s(?=Pas d(?:e\s|')|Ni\s|Sans\s)/gmu,
};

const NUMBERS = {
  en: '(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|a hundred|\\d+)',
  fr: '(?:un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|trente|quarante|cinquante|cent|mille|\\d+)',
};

// How often a device may appear on one page before it reads as a habit.
export const HABIT = Object.freeze({ 'two-fragment heading': 3, 'number-pair heading': 2, 'contrast frame': 5, 'negation run': 3, 'virtue word': 3, 'em dash': 6, exclamation: 3 });

export function languageOf(lang) {
  const code = String(lang ?? '').trim().toLowerCase().split('-')[0];
  return code === 'fr' || code === 'en' ? code : null;
}

const context = (text, index, length) => text.slice(Math.max(0, index - 30), index + length + 30).replace(/\s+/g, ' ').trim();

// Headings in two short sentences ("A tree falls. It stays.").
export function isTwoFragment(heading) {
  const parts = heading.trim().split(/(?<=[.!?])\s+/u).filter(Boolean);
  return parts.length === 2 && parts.every(part => /[.!?]$/u.test(part) || part === parts[1]) && parts.every(part => part.split(/\s+/u).length <= 6);
}

// Headings built on a pair of counts ("Four projects, four problems", « Un tronc, onze mois »).
export function isNumberPair(heading, language) {
  const n = NUMBERS[language];
  const match = heading.trim().match(new RegExp(`^(${n})\\s+[\\p{L}'’-]+(?:\\s+[\\p{L}'’-]+)?\\s*[,.;:]\\s*(${n})\\s+[\\p{L}'’-]+`, 'iu'));
  if (!match) return false;
  // In French "un" and "une" are also articles: « Un ours, un tigre » is a list, not a pair of counts.
  return language !== 'fr' || ![match[1], match[2]].every(word => /^une?$/iu.test(word));
}

/**
 * The tells on one page.
 * @param {{ text: string, headings?: string[], lang?: string, year?: number, allow?: string[] }} page
 * @returns {{ tell: string, value: string, count: number, detail: string }[]}
 */
export function copyTells({ text: raw, headings: rawHeadings = [], lang, year = new Date().getFullYear(), allow = [] }) {
  // Typographic apostrophes and quotes read as plain ones, so one rule matches both.
  const plain = s => s.replace(/[‘’ʼ]/gu, "'").replace(/[“”]/gu, '"');
  const text = plain(raw);
  const headings = rawHeadings.map(plain);
  const language = languageOf(lang);
  const allowed = new Set(allow.map(a => plain(a).toLowerCase().replace(/\s+/g, ' ').trim()));
  const found = [];
  const each = (tell, regex, fix) => {
    const hits = new Map();
    for (const match of text.matchAll(regex)) {
      const key = match[0].toLowerCase().replace(/\s+/g, ' ').trim();
      if (allowed.has(key)) continue;
      const hit = hits.get(key) ?? { count: 0, first: match };
      hit.count++;
      hits.set(key, hit);
    }
    for (const [key, hit] of hits) found.push({ tell, value: `"${key}"`, count: hit.count, detail: `${fix}: …${context(text, hit.first.index, hit.first[0].length)}…` });
  };
  for (const regex of RESIDUE) each('residue', regex, 'template or conversation left on the page');
  if (language) {
    each('slop word', any(SLOP[language]), 'say the fact it stands in for (a figure, a step, a material)');
    for (const regex of STOCK[language]) each('stock line', regex, 'a line that fits any business: replace it with a fact from the brief');
    each('process word', any(PROCESS[language]), "a word from the design notes, not the visitor's: name the thing as the client and their customers would");
  }
  const copyright = [...text.matchAll(/(?:©|\(c\)|copyright)\s*(?:\d{4}\s*[–-]\s*)?(\d{4})/giu)].map(m => Number(m[1]));
  if (copyright.length && Math.max(...copyright) < year) found.push({ tell: 'stale year', value: `© ${Math.max(...copyright)}`, count: 1, detail: `the copyright line is older than ${year}` });
  if (!language) return found;

  const habit = (tell, count, examples, fix) => {
    if (count >= HABIT[tell]) found.push({ tell, value: `${count} on the page`, count, detail: `${fix}${examples.length ? `: ${examples.slice(0, 3).map(e => `"${e}"`).join(', ')}` : ''}` });
  };
  const fragments = headings.filter(isTwoFragment);
  habit('two-fragment heading', fragments.length, fragments, 'spend the "X. Y." shape once; name the part, or write one plain sentence');
  const pairs = headings.filter(h => isNumberPair(h, language));
  habit('number-pair heading', pairs.length, pairs, 'say what the section holds instead of pairing two counts');
  const contrast = CONTRAST[language].flatMap(regex => [...text.matchAll(regex)].map(m => m[0]));
  habit('contrast frame', contrast.length, contrast, 'state the positive fact alone; "rather than" and "instead of" count with "not X but Y"');
  // Items that follow one another are one run: « Pas de X. Pas de Y. Sans Z. » counts once.
  const negations = [];
  let runEnd = -1;
  for (const match of text.matchAll(NEGATION_RUN[language])) {
    if (match.index === runEnd) negations[negations.length - 1] += ' ' + match[0].trim();
    else negations.push(match[0].trim());
    runEnd = match.index + match[0].length;
  }
  habit('negation run', negations.length, negations, 'keep one run of refusals, where each is one a buyer can check');
  const virtue = [...text.matchAll(any(VIRTUE[language]))].map(m => m[0]).filter(w => !allowed.has(w.toLowerCase()));
  habit('virtue word', virtue.length, [...new Set(virtue)], 'show it with a fact or an admission; a page never calls itself honest or passionate');
  habit('em dash', (text.match(/—/gu) ?? []).length, [], 'use a colon, brackets or a full stop for most of them');
  habit('exclamation', (text.match(/[^\s!]\s?!(?!\S)/gu) ?? []).length, [], 'body copy states; it does not exclaim');
  return found;
}
