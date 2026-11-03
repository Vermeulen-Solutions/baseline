import type { ThemePreference } from './locale.ts';
export type { ThemePreference };

export const THEME_STORAGE_KEY = 'baseline:surface';

/**
 * Resolves effective visual surface mode ('light' or 'dark') given a user preference and system state.
 */
export function resolveTheme(preference: ThemePreference, systemDark: boolean): 'light' | 'dark' {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return systemDark ? 'dark' : 'light';
}

/**
 * Safely retrieves the stored theme preference from localStorage.
 * Returns null if unconfigured, unavailable, or threw an exception.
 */
export function getStoredThemePreference(): ThemePreference | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
  } catch {
    // LocalStorage access may throw in private browsing or restrictive sandboxes
  }
  return null;
}

/**
 * Reads the page's declared surface default from HTML root attributes.
 */
export function getPageThemeDefault(root: Element = document.documentElement): ThemePreference | null {
  if (typeof document === 'undefined') return null;
  const def = root.getAttribute('data-surface-default');
  if (def === 'system' || def === 'dark' || def === 'light') return def;
  if (root.getAttribute('data-surface-mode') === 'system') return 'system';
  return null;
}

/**
 * Resolves effective theme preference and surface given stored user preferences and page defaults.
 */
export function resolveEffectiveTheme(root: Element = document.documentElement): {
  preference: ThemePreference | null;
  surface: 'light' | 'dark' | null;
} {
  const stored = getStoredThemePreference();
  const pageDefault = getPageThemeDefault(root);
  const effectivePref = stored ?? pageDefault;
  if (!effectivePref) {
    return { preference: null, surface: null };
  }
  const systemDark =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  return {
    preference: effectivePref,
    surface: resolveTheme(effectivePref, systemDark),
  };
}

/**
 * Safely persists theme preference to localStorage.
 */
export function setStoredThemePreference(preference: ThemePreference): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (preference === 'system') {
        // Explicit system preference is stored to distinguish from unset page default
        window.localStorage.setItem(THEME_STORAGE_KEY, 'system');
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, preference);
      }
      return true;
    }
  } catch {
    // LocalStorage write may throw in restricted sandboxes or when quota exceeded
  }
  return false;
}

/**
 * Clears stored theme preference from localStorage.
 */
export function clearStoredThemePreference(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      return true;
    }
  } catch {}
  return false;
}

/**
 * Applies a theme preference to the document, resolving against system state,
 * persisting to storage, and synchronizing all selects, toggles, and document attributes.
 *
 * If preference is omitted, re-syncs the document using current storage and page defaults.
 */
export function applyTheme(
  preference?: ThemePreference | null,
  options?: { persist?: boolean; root?: HTMLElement }
): { preference: ThemePreference | null; surface: 'light' | 'dark' | null } {
  if (typeof document === 'undefined') {
    return { preference: preference ?? null, surface: 'light' };
  }

  const root = options?.root ?? document.documentElement;

  if (preference !== undefined) {
    if (preference === null) {
      if (options?.persist !== false) clearStoredThemePreference();
    } else {
      if (options?.persist !== false) setStoredThemePreference(preference);
    }
  }

  const { preference: effectivePref, surface } = resolveEffectiveTheme(root);

  if (effectivePref === null) {
    root.removeAttribute('data-surface');
    root.removeAttribute('data-surface-mode');
  } else if (effectivePref === 'system') {
    root.setAttribute('data-surface-mode', 'system');
    if (surface) root.setAttribute('data-surface', surface);
  } else {
    root.removeAttribute('data-surface-mode');
    if (surface) root.setAttribute('data-surface', surface);
  }

  // Synchronize all theme select controls on the page
  document.querySelectorAll<HTMLSelectElement>('[data-theme-select]').forEach((select) => {
    const targetValue = effectivePref ?? 'system';
    if (select.value !== targetValue) {
      select.value = targetValue;
    }
  });

  // Synchronize any surface toggle buttons
  document.querySelectorAll('[data-surface-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(surface === 'dark'));
  });

  document.dispatchEvent(
    new CustomEvent('baseline:theme-change', {
      detail: { preference: effectivePref, surface },
    })
  );

  if (typeof window !== 'undefined') {
    (window as unknown as { __baseline_applyTheme?: typeof applyTheme }).__baseline_applyTheme = applyTheme;
  }

  return { preference: effectivePref, surface };
}

let themeControllerInitialized = false;

/**
 * Initializes listeners for OS prefers-color-scheme changes, storage synchronization,
 * ClientRouter navigation, and surface toggle interactions.
 */
export function initThemeController() {
  if (typeof window === 'undefined' || themeControllerInitialized) return;
  themeControllerInitialized = true;

  // 1. Listen for OS color-scheme changes (only affects 'system' mode)
  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', () => {
      const root = document.documentElement;
      if (root.getAttribute('data-surface-mode') === 'system') {
        applyTheme(undefined, { persist: false });
      }
    });
  } catch {}

  // 2. Listen for cross-tab storage changes
  window.addEventListener('storage', (event) => {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(undefined, { persist: false });
    }
  });

  // 3. Re-synchronize on ClientRouter swaps
  document.addEventListener('astro:after-swap', () => {
    applyTheme(undefined, { persist: false });
  });

  // 4. Delegated surface toggle handler
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const toggle = target?.closest?.('[data-surface-toggle]');
    if (!toggle) return;
    event.preventDefault();
    const currentSurface = document.documentElement.getAttribute('data-surface');
    const nextSurface = currentSurface === 'dark' ? 'light' : 'dark';
    applyTheme(nextSurface);
  });

  // Initial synchronization for controls and state
  applyTheme(undefined, { persist: false });
}
