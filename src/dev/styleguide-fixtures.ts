// Synthetic local fixtures. No CMS identities, private content or write endpoints.
import specimen from '../assets/styleguide-grid.svg';
import small from '../assets/styleguide-small.svg';
import portrait from '../assets/styleguide-portrait.svg';
export const fixtureVersion = 2;
export const smallImage = { src: small.src, width: 96, height: 64, alt: 'Authored 96 by 64 pixel circle specimen' };
export const portraitImage = { src: portrait.src, width: 200, height: 600, alt: 'Authored tall rectangular outline specimen' };
export const fixtureImage = { src: specimen.src, width: 1200, height: 800, alt: 'Synthetic image: circle centered on a rectangular grid' };
export const specimenTokens = ['page', 'surface', 'text', 'muted', 'border', 'action', 'on-action', 'focus'] as const;
export const componentCoverage = {
  rendered: ['Section', 'Container', 'Grid', 'Card', 'PartnersPanel', 'ResponsiveImage', 'Markdown', 'FormError', 'LogoTicker'],
  variants: { Section: ['content', 'section'], Container: ['reading', 'content', 'wide', 'breakout (.content-grid)'], Grid: ['compact', 'standard', 'wide'], Card: ['stacked', 'horizontal'], PartnersPanel: ['linked', 'unlinked', 'empty', 'dark artwork ground'], LogoTicker: ['animated with native stop control', 'single static item', 'RTL', 'empty renders nothing', 'reduced motion/print static'] },
  stress: ['long heading/name', 'unbroken identifier', 'missing media', 'portrait 1:3', 'small native 96x64', 'invalid/disabled/empty controls', 'narrow placement', 'editorial breakout zone'],
  deferred: { publishing: 'Synthetic specimens verify presentation; test the selected publishing workflow separately.' },
  surfaceModes: 'Neutral light palette by default; data-surface="dark" and data-surface="light" remap surface, text, muted, border, and focus tokens.',
  unsupported: ['No invented Card elevation variants or full dark theme', 'No native loading-button variant', 'External video/iframe/html embeds deliberately omitted: no third-party requests or executable fixture HTML', 'Editor save/reload is outside the common specimen scope'],
};
