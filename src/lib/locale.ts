export type TextDirection = 'ltr' | 'rtl';

export interface LocaleDefinition {
  key: string;
  lang: string;
  label: string;
  dir?: TextDirection;
}

export interface ResolvedLocale {
  key: string;
  lang: string;
  label: string;
  dir: TextDirection;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface DocumentPresentationProps {
  lang?: string;
  dir?: TextDirection;
  surface?: ThemePreference;
  print?: 'browser' | 'content';
}

/** Known Right-To-Left 4-letter ISO 15924 script codes */
const RTL_SCRIPTS = new Set([
  'Arab', // Arabic
  'Hebr', // Hebrew
  'Syrc', // Syriac
  'Thaa', // Thaana
  'Mand', // Mandaic
  'Samr', // Samaritan
  'Nkoo', // N'Ko
  'Adlm', // Adlam
  'Rohg', // Hanifi Rohingya
  'Yezi', // Yezidi
]);

/** Known Right-To-Left 2- and 3-letter ISO 639 language codes */
const RTL_LANGUAGES = new Set([
  'ar', // Arabic
  'arc', // Aramaic
  'ckb', // Central Kurdish
  'dv', // Divehi
  'fa', // Persian
  'ha', // Hausa (when in Arabic script)
  'he', // Hebrew
  'iw', // Hebrew (legacy code)
  'ji', // Yiddish (legacy code)
  'khw', // Khowar
  'ks', // Kashmiri
  'ku', // Kurdish
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'ur', // Urdu
  'yi', // Yiddish
]);

/**
 * Resolves text direction ('ltr' or 'rtl') from a BCP-47 language tag.
 * Script subtags are prioritized over language defaults (e.g. 'az-Arab' resolves to 'rtl').
 */
export function getLocaleDirection(langTag: string): TextDirection {
  if (!langTag || typeof langTag !== 'string') return 'ltr';

  try {
    const locale = new Intl.Locale(langTag);

    // If textInfo proposal is natively available, consult it
    const textInfo = (locale as { textInfo?: { direction?: string }; getTextInfo?: () => { direction?: string } });
    const nativeDir = textInfo.textInfo?.direction || textInfo.getTextInfo?.()?.direction;
    if (nativeDir === 'rtl' || nativeDir === 'ltr') {
      return nativeDir;
    }

    // Explicit script subtag has highest priority
    if (locale.script) {
      const normalizedScript = locale.script.charAt(0).toUpperCase() + locale.script.slice(1).toLowerCase();
      if (RTL_SCRIPTS.has(normalizedScript)) {
        return 'rtl';
      }
      // If script is explicitly non-RTL (e.g. 'Latn', 'Cyrl'), treat as LTR even if language is Arabic
      return 'ltr';
    }

    // Fall back to base language check
    const lang = locale.language.toLowerCase();
    if (RTL_LANGUAGES.has(lang)) {
      return 'rtl';
    }
  } catch {
    // If Intl.Locale parsing fails, simple prefix check fallback
    const lower = langTag.toLowerCase();
    const subtagMatch = lower.match(/-([a-z]{4})(?:-|$)/);
    if (subtagMatch) {
      const script = subtagMatch[1].charAt(0).toUpperCase() + subtagMatch[1].slice(1);
      if (RTL_SCRIPTS.has(script)) return 'rtl';
    }
    const baseLang = lower.split(/[-_]/)[0];
    if (RTL_LANGUAGES.has(baseLang)) return 'rtl';
  }

  return 'ltr';
}

/**
 * Resolves a locale definition into a canonical ResolvedLocale.
 * Canonicalizes the BCP-47 lang tag via Intl.Locale, preserves the key, and resolves direction.
 */
export function resolveLocale(input: LocaleDefinition): ResolvedLocale {
  if (!input || typeof input !== 'object') {
    return { key: 'en', lang: 'en', label: 'English', dir: 'ltr' };
  }

  let canonicalLang = input.lang || 'en';
  try {
    const parsed = new Intl.Locale(canonicalLang);
    canonicalLang = parsed.baseName || parsed.toString();
  } catch {
    // Retain input if Intl parsing fails
  }

  const dir: TextDirection =
    input.dir === 'rtl' || input.dir === 'ltr'
      ? input.dir
      : getLocaleDirection(canonicalLang);

  return {
    key: String(input.key || canonicalLang),
    lang: canonicalLang,
    label: String(input.label || canonicalLang),
    dir,
  };
}
