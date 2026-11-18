/**
 * The web app manifest for a website, not an app: the name and icons Android, Chrome and installed
 * shortcuts show. `display: browser` keeps the address bar, so nothing pretends the site is an app.
 * The icon files come from `npm run icons` (scripts/generate-icons.mjs).
 */
export interface WebManifestInput {
  name: string;
  /** Astro's BASE_URL, so icons resolve under a sub-path deployment. */
  base?: string;
  /** Optional colours for the browser chrome and the launch screen. */
  themeColor?: string;
  backgroundColor?: string;
}

/** The short name a home screen shows under the icon: the name, or its first words up to 12 characters. */
export function shortName(name: string): string {
  const clean = name.replace(/\s+/g, ' ').trim();
  if (clean.length <= 12) return clean;
  let short = '';
  for (const word of clean.split(' ')) {
    const next = short ? `${short} ${word}` : word;
    if (next.length > 12) break;
    short = next;
  }
  return short || clean.slice(0, 12);
}

export function webManifest({ name, base = '/', themeColor, backgroundColor }: WebManifestInput) {
  const root = `${base.replace(/\/+$/, '')}/`;
  const title = name.replace(/\s+/g, ' ').trim() || 'Website';
  return {
    name: title,
    short_name: shortName(title),
    start_url: root,
    scope: root,
    display: 'browser',
    ...(themeColor ? { theme_color: themeColor } : {}),
    ...(backgroundColor ? { background_color: backgroundColor } : {}),
    icons: [
      { src: `${root}icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${root}icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${root}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
