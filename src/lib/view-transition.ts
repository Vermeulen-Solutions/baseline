/**
 * Shared-element View Transition names for list-to-detail morphs.
 *
 * `<Card transitionName>` uses these internally. Lists that render their own rows call
 * `mediaTransition()` on the list photo and on the detail photo with the same parts, so both
 * sides get one ident-safe `view-transition-name` and the `vt-media` `view-transition-class`
 * whose group clip/cover rules live in `src/styles/global.css`.
 */

/** `view-transition-class` paired with the `::view-transition-group(*.vt-media)` rules. */
export const MEDIA_TRANSITION_CLASS = 'vt-media';

/** Keywords that are not usable as a custom `view-transition-name`. */
const RESERVED = new Set(['none', 'auto', 'root', 'match-element', 'inherit', 'initial', 'unset', 'revert', 'revert-layer', 'default']);

type NamePart = string | number | null | undefined | false;

/**
 * Build a CSS-ident-safe transition name from one or more parts, such as a collection prefix
 * and a CMS slug. Characters outside `A-Z a-z 0-9 _ -` become hyphens, so a slug can never
 * produce invalid CSS or inject a declaration. Returns '' when nothing usable remains.
 *
 * Callers own uniqueness: a name may appear on one rendered element per page, and two
 * different slugs that differ only in punctuation (`a.b`, `a-b`) map to the same name.
 */
export function transitionName(...parts: NamePart[]): string {
  const ident = parts
    .filter((part): part is string | number => typeof part === 'number' || (typeof part === 'string' && part.trim() !== ''))
    .map((part) => String(part).trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('-');
  if (!ident) return '';
  // An ident cannot start with a digit; a reserved keyword would not name anything.
  return /^[0-9]/.test(ident) || RESERVED.has(ident.toLowerCase()) ? `vt-${ident}` : ident;
}

/**
 * Inline style for a morphing photo: `style={mediaTransition('post', slug)}` on the list item's
 * media wrapper and on the detail page's media wrapper. Returns undefined (no attribute) when
 * the parts yield no name.
 */
export function mediaTransition(...parts: NamePart[]): string | undefined {
  const name = transitionName(...parts);
  return name ? `view-transition-name: ${name}; view-transition-class: ${MEDIA_TRANSITION_CLASS}` : undefined;
}
