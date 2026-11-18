import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyticsConfig, consentState, readStoredChoice, trackParams } from '../src/lib/consent.ts';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('nothing is configured until a valid id is set, and hosts default to nowhere', () => {
  assert.equal(analyticsConfig({}), null);
  assert.equal(analyticsConfig({ gaId: 'UA-123', gtmId: 'GTM', cloudflareToken: 'short' }), null, 'malformed ids are ignored');
  const ga = analyticsConfig({ gaId: 'G-ABC1234', hosts: ' Example.ch, www.example.ch ,bad host' });
  assert.deepEqual(ga.hosts, ['example.ch', 'www.example.ch']);
  assert.equal(ga.mode, 'consent-mode');
  assert.equal(ga.needsConsent, true);
  assert.deepEqual(ga.categories, ['analytics']);
  assert.deepEqual(analyticsConfig({ gaId: 'G-ABC1234' }).hosts, [], 'no hosts: tags load nowhere');
  const cf = analyticsConfig({ cloudflareToken: '0123456789abcdef0123456789abcdef', mode: 'strict', version: 3, categories: ['analytics', 'marketing', 'bogus'] });
  assert.equal(cf.needsConsent, false, 'the cookie-free beacon needs no consent');
  assert.equal(cf.mode, 'strict');
  assert.equal(cf.version, 3);
  assert.deepEqual(cf.categories, ['analytics', 'marketing']);
});

test('consent state denies everything not granted, and stored choices expire with the version', () => {
  assert.deepEqual(consentState({ analytics: true }), { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  assert.deepEqual(readStoredChoice(JSON.stringify({ version: 2, categories: { analytics: true } }), 2), { analytics: true, marketing: false });
  assert.equal(readStoredChoice(JSON.stringify({ version: 1, categories: { analytics: true } }), 2), null, 'a new version asks again');
  assert.equal(readStoredChoice('not json', 1), null);
  assert.equal(readStoredChoice(null, 1), null);
});

test('data-track attributes become event parameters', () => {
  assert.deepEqual(trackParams([{ name: 'data-track', value: 'cta' }, { name: 'data-track-link-location', value: 'hero' }, { name: 'data-track-step', value: '2' }, { name: 'class', value: 'x' }]), { link_location: 'hero', step: 2 });
});

test('Analytics loads only on production hosts, with Consent Mode defaults before any tag', () => {
  const source = read('src/components/Analytics.astro');
  assert.match(source, /if \(c\.hosts\.indexOf\(location\.hostname\.toLowerCase\(\)\) === -1\) return;/);
  assert.ok(source.indexOf("gtag('consent', 'default'") < source.indexOf('function loadTags'), 'defaults are set before tags can load');
  assert.match(source, /analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'/);
  assert.match(source, /if \(c\.mode !== 'strict' \|\| categories\.analytics \|\| categories\.marketing\) idle\(loadTags\);/);
  assert.match(source, /else if \(c\.mode !== 'strict'\) idle\(loadTags\);/, 'strict mode loads nothing before consent');
  assert.match(source, /replace\(\/<\/g, '\\\\u003c'\)/);
});

test('the banner never takes the page, offers accept, reject and choose, and reopens from data-consent-open', () => {
  const source = read('src/components/ConsentBanner.astro');
  assert.match(source, /aria-labelledby="consent-banner-heading" data-consent-banner hidden/);
  for (const hook of ['data-consent-accept', 'data-consent-reject', 'data-consent-save']) assert.ok(source.includes(hook), hook);
  assert.match(source, /closest\('\[data-consent-open\]'\)/);
  assert.match(source, /if \(!api\.decided\) banner\.hidden = false;/);
  assert.doesNotMatch(source, /showModal|inert/, 'not a modal');
});

test('embeds load the provider only on click, with a plain link without JavaScript', () => {
  const video = read('src/components/VideoEmbed.astro');
  assert.match(video, /https:\/\/www\.youtube-nocookie\.com\/embed\//);
  assert.match(video, /https:\/\/player\.vimeo\.com\/video\/\$\{safeId\}\?dnt=1/);
  assert.match(video, /<a class="video-embed__play" href=\{href\} data-load-trigger>/);
  assert.doesNotMatch(video, /<iframe/, 'no frame in the markup');
  const map = read('src/components/MapEmbed.astro');
  assert.match(map, /data-load-iframe=\{src\}/);
  assert.doesNotMatch(map, /<iframe/);
  const loader = read('src/lib/load-on-click.ts');
  assert.match(loader, /if \(!src \|\| !\/\^https:\\\/\\\/\/\.test\(src\)\) return;/);
});
