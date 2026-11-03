import type { ThemePreference } from './locale.ts';

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
