// Reactive, app-wide current locale. Backed by a Svelte rune so any component
// reading `i18n.locale` re-renders when it changes. Prerendering/SSR always
// starts from the English default; `initLocale()` resolves the real locale on
// the client (stored choice → browser preference → default).

import { DEFAULT_LOCALE, detectLocale, isLocale, type Locale } from './locales';

const STORAGE_KEY = 'wc2026-locale';

let current = $state<Locale>(DEFAULT_LOCALE);

export const i18n = {
  get locale(): Locale {
    return current;
  },
  set locale(value: Locale) {
    current = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Private mode / storage disabled — selection still applies for this session.
    }
  }
};

/** Resolve and apply the initial locale. Client-only; safe to call in onMount. */
export function initLocale(): void {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  current = stored && isLocale(stored) ? stored : detectLocale();
}
