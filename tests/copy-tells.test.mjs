import test from 'node:test';
import assert from 'node:assert/strict';
import { copyTells, isTwoFragment, isNumberPair, languageOf, HABIT } from '../scripts/copy-tells.mjs';

const tells = (page) => copyTells({ year: 2026, ...page }).map((f) => `${f.tell} ${f.value}`);

test('the language comes from the page lang; other languages get only the language-free checks', () => {
  assert.equal(languageOf('fr-CH'), 'fr');
  assert.equal(languageOf('EN'), 'en');
  assert.equal(languageOf('de'), null);
  assert.deepEqual(tells({ lang: 'de', text: 'Nahtlos und seamless. Lorem ipsum. © 2020' }), ['residue "lorem ipsum"', 'stale year © 2020']);
});

test('words and stock lines that stand in for a fact are reported once each, with a count', () => {
  const english = tells({ lang: 'en', text: 'A seamless setup. Seamless billing. Look no further for world-class bread.' });
  assert.deepEqual(english, ['slop word "seamless"', 'slop word "world-class"', 'stock line "look no further"']);
  assert.equal(copyTells({ lang: 'en', text: 'Seamless. Seamless.' })[0].count, 2);
  const french = tells({ lang: 'fr', text: 'Un savoir‑faire unique. Plongez dans l’univers du bois. N’hésitez pas à m’écrire.' });
  assert.ok(french.includes('slop word "plongez"'));
  assert.ok(french.includes(`stock line "n'hésitez pas à"`), 'typographic apostrophes match');
});

test('a word the trade uses literally is allowed by the site, and quoted words are never read', () => {
  assert.deepEqual(tells({ lang: 'en', text: 'Our tailoring is bespoke: cut to your measure.', allow: ['Bespoke'] }), []);
  assert.deepEqual(tells({ lang: 'en', text: 'A climbing harness and a robust 40 mm rope.', allow: ['robust'] }), []);
});

test('template and conversation residue is reported on any page', () => {
  assert.deepEqual(tells({ lang: 'en', text: 'Certainly! Here is [Company Name] and {{ phone }}.' }).sort(), ['residue "certainly!"', 'residue "[company name]"', 'residue "{{ phone }}"'].sort());
  assert.deepEqual(tells({ lang: 'fr', text: 'Atelier ouvert. © 2024–2026 Atelier' }), [], 'a range ending this year is current');
});

test('headings in two fragments and pairs of counts are habits only when repeated', () => {
  assert.equal(isTwoFragment('Un arbre tombe. Il reste.'), true);
  assert.equal(isTwoFragment('Où je sculpte'), false);
  assert.equal(isTwoFragment('Short menu. A long list of regulars who come back every single week.'), false, 'a long second sentence is a sentence');
  assert.equal(isNumberPair('Un tronc, onze mois', 'fr'), true);
  assert.equal(isNumberPair('Un ours, un tigre', 'fr'), false, 'French articles are not counts');
  assert.equal(isNumberPair('Four projects, four very different problems', 'en'), true);
  assert.deepEqual(tells({ lang: 'fr', text: 'x', headings: ['Un arbre tombe. Il reste.', 'Le bois. La main.'] }), [], 'two is under the habit line');
  assert.deepEqual(tells({ lang: 'fr', text: 'x', headings: ['Un arbre tombe. Il reste.', 'Le bois. La main.', 'Un atelier. Un jardin.'] }), [`two-fragment heading ${HABIT['two-fragment heading']} on the page`]);
});

test('contrast frames count together, whatever their form', () => {
  const text = 'Not a shop but a workshop. Made rather than bought. Instead of a catalogue, a visit. Without the waiting. More than just bread.';
  assert.deepEqual(tells({ lang: 'en', text }), ['contrast frame 5 on the page']);
  const french = "Ce n'est pas un magasin mais un atelier. Plutôt que d'acheter, commandez. Au lieu d'un catalogue, une visite. Pas seulement du pain. Non pas vendre, mais montrer.";
  assert.deepEqual(tells({ lang: 'fr', text: french }), ['contrast frame 5 on the page']);
});

test('virtue words, negation runs, em dashes and exclamations are reported as habits', () => {
  assert.deepEqual(tells({ lang: 'en', text: 'An honest bakery. Truly good bread. Carefully made.' }), ['virtue word 3 on the page']);
  const runs = 'Pas de formulaire. Pas d’attente. Sans frais. Un atelier. Pas de devis, pas de file. Ni contrat. Ni engagement. Le bois. Pas de vernis. Pas de colle.';
  assert.deepEqual(tells({ lang: 'fr', text: runs }).filter((t) => t.startsWith('negation')), ['negation run 3 on the page'], 'items that follow one another are one run');
  assert.deepEqual(tells({ lang: 'en', text: 'No forms. No waiting. No fees.' }), [], 'one run is a device, not a habit');
  assert.deepEqual(tells({ lang: 'en', text: 'A — b — c — d — e — f — g' }), ['em dash 6 on the page']);
  assert.deepEqual(tells({ lang: 'fr', text: 'Bienvenue ! Venez ! Commandez ! Merci.' }), ['exclamation 3 on the page']);
});
