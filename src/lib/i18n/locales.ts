// Supported locales for the UI. English (US) is the default; the browser's
// preferred language is honoured on first visit (see `detectLocale`), and an
// explicit choice is remembered in localStorage (see `store.svelte.ts`).

export const LOCALES = ['en', 'pt-BR', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export interface LocaleMeta {
  /** Native language name, used as the accessible label / tooltip. */
  label: string;
  /** Short code shown next to the flag in the switcher. */
  short: string;
  /** flag-icons code used to render the language flag. */
  flag: string;
  /** Value for the document `lang` attribute. */
  htmlLang: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { label: 'English', short: 'EN', flag: 'us', htmlLang: 'en' },
  'pt-BR': { label: 'Português', short: 'PT', flag: 'br', htmlLang: 'pt-BR' },
  es: { label: 'Español', short: 'ES', flag: 'es', htmlLang: 'es' }
};

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Resolve the best-matching supported locale from the browser's preferences.
 * Any Portuguese variant maps to pt-BR and any Spanish variant to es; anything
 * else (or no `navigator`) falls back to the English default.
 */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const pref of prefs) {
    const lang = pref?.toLowerCase() ?? '';
    if (lang.startsWith('pt')) return 'pt-BR';
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
}

export { isLocale };
