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
 * Defaults to 'system' if unconfigured, unavailable, or threw an exception.
 */
export function getStoredThemePreference(): ThemePreference {
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
  return 'system';
}

/**
 * Safely persists theme preference to localStorage.
 */
export function setStoredThemePreference(preference: ThemePreference): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (preference === 'system') {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
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
 * Applies a theme preference to the document, resolving against system state,
 * persisting to storage, and synchronizing all selects, toggles, and document attributes.
 */
export function applyTheme(
  preference: ThemePreference,
  options?: { persist?: boolean }
): { preference: ThemePreference; surface: 'light' | 'dark' } {
  if (typeof document === 'undefined') {
    return { preference, surface: 'light' };
  }

  const systemDark =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;

  const surface = resolveTheme(preference, systemDark);
  const root = document.documentElement;

  if (preference === 'system') {
    root.setAttribute('data-surface-mode', 'system');
  } else {
    root.removeAttribute('data-surface-mode');
  }
  root.setAttribute('data-surface', surface);

  if (options?.persist !== false) {
    setStoredThemePreference(preference);
  }

  // Synchronize all theme select controls on the page
  document.querySelectorAll<HTMLSelectElement>('[data-theme-select]').forEach((select) => {
    if (select.value !== preference) {
      select.value = preference;
    }
  });

  // Synchronize any surface toggle buttons
  document.querySelectorAll('[data-surface-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(surface === 'dark'));
  });

  document.dispatchEvent(
    new CustomEvent('baseline:theme-change', {
      detail: { preference, surface },
    })
  );

  return { preference, surface };
}
