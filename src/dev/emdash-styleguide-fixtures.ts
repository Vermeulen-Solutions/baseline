// EmDash-only public renderer fixtures. No writable identities or storage operations.
import specimen from '../assets/styleguide-grid.svg';
import { fixtureImage } from './styleguide-fixtures';
export const emdashCoverage = {
  rendered: ['Section', 'Container', 'Grid', 'Card', 'PartnersPanel', 'ResponsiveImage', 'EditorialImage', 'RichText', 'PhotoGallery', 'FormError', 'LogoTicker'],
  variants: { Section: ['content', 'section'], Container: ['reading', 'content', 'wide', 'breakout (.content-grid)'], Grid: ['compact', 'standard', 'wide'], Card: ['stacked', 'horizontal'], PartnersPanel: ['linked', 'unlinked', 'empty', 'dark artwork ground'], LogoTicker: ['animated with native stop control', 'single static item', 'RTL', 'empty renders nothing', 'reduced motion/print static'] },
  stress: ['long heading/name', 'unbroken identifier', 'missing media', 'portrait 1:3', 'small native 96x64', 'repeated ordered gallery asset', 'invalid/disabled/empty controls', 'narrow placement', 'editorial breakout zone'],
  deferred: { CMSPartnersPanel: 'Queries a real collection; verify separately on disposable CMS content, not fake writable records.' },
  surfaceModes: 'Neutral light palette by default; data-surface="dark" and data-surface="light" remap surface, text, muted, border, and focus tokens.',
  unsupported: ['No invented Card elevation variants or full dark theme', 'No native loading-button variant', 'External video/iframe/html embeds deliberately omitted: no third-party requests or executable fixture HTML', 'Table editor placeholder/save is verified separately on real CMS entries; static specimens cover the public renderer'],
};
const block = (key: string, text: string, style = 'normal', extra = {}) => ({ _type: 'block', _key: key, style, markDefs: [], children: [{ _type: 'span', _key: `${key}-text`, text, marks: [] }], ...extra });
export const proseFixture = [
  block('intro', 'This is synthetic editorial content rendered through the same RichText component as public pages.'),
  block('heading', 'A heading within the editorial flow', 'h3'),
  block('body', 'Longer content exposes reading measure, line height and spacing. Check this specimen at narrow, intermediate and wide widths, then repeat with actual site content.'),
  block('quote', 'A quoted sentence demonstrates the installed renderer, without introducing a new quote treatment.', 'blockquote'),
  block('first', 'First item in an ordered sequence.', 'normal', { listItem: 'number', level: 1 }),
  block('second', 'Second item retains its order.', 'normal', { listItem: 'number', level: 1 }),
  block('bullet', 'A separate unordered item.', 'normal', { listItem: 'bullet', level: 1 }),
  { ...block('link', 'An editorial link to coverage'), markDefs: [{ _type: 'link', _key: 'coverage-link', href: '#coverage' }], children: [{ _type: 'span', _key: 'link-text', text: 'An editorial link to coverage', marks: ['coverage-link'] }] },
  { ...block('marks', 'Strong, emphasis and inline code'), children: [{ _type: 'span', _key: 'strong-text', text: 'Strong ', marks: ['strong'] }, { _type: 'span', _key: 'em-text', text: 'emphasis ', marks: ['em'] }, { _type: 'span', _key: 'code-text', text: 'inline code', marks: ['code'] }] },
  { _type: 'code', _key: 'code-block', language: 'css', code: '.example { color: var(--color-text); }' },
  { _type: 'table', _key: 'table', hasHeaderRow: true, rows: [
    { _type: 'tableRow', _key: 'header', cells: ['Specimen', 'Native dimensions', 'Purpose'].map((text, i) => ({ _type: 'tableCell', _key: `header-${i}`, isHeader: true, content: [{ _type: 'span', _key: `header-text-${i}`, text, marks: [] }] })) },
    { _type: 'tableRow', _key: 'body', cells: ['Small circle', '96 by 64', 'Native width and table reflow'].map((text, i) => ({ _type: 'tableCell', _key: `cell-${i}`, content: [{ _type: 'span', _key: `cell-text-${i}`, text, marks: [] }] })) },
  ] },
];
export const editorialImageFixture = { _type: 'image', _key: 'specimen-image', asset: { url: specimen.src }, width: 1200, height: 800, alt: fixtureImage.alt, caption: 'Authored geometric test asset; no third-party imagery or CMS identity.' };
export const galleryFixture = { _type: 'gallery', _key: 'specimen-gallery', images: [editorialImageFixture, { ...editorialImageFixture, _key: 'specimen-repeat', caption: 'A repeated asset tests preserved gallery occurrences.' }] };
