// Reactive, app-wide current theme. Backed by a Svelte rune so any component
// reading `theme.value` re-renders when it changes. Prerendering/SSR always
// starts from the `system` default; `initTheme()` resolves the stored choice on
// the client. A no-flash inline script in `app.html` applies the stored theme
// before first paint — this store then keeps it in sync with the toggle.

import { DEFAULT_THEME, colorScheme, isTheme, type Theme } from './themes';

const STORAGE_KEY = 'wc2026-theme';

let current = $state<Theme>(DEFAULT_THEME);

/** Push the active theme onto the document so `light-dark()` tokens resolve. */
function apply(theme: Theme): void {
  document.documentElement.style.colorScheme = colorScheme(theme);
}

export const theme = {
  get value(): Theme {
    return current;
  },
  set value(next: Theme) {
    current = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode / storage disabled — selection still applies for this session.
    }
    apply(next);
  }
};

/** Resolve and apply the stored theme. Client-only; safe to call in onMount. */
export function initTheme(): void {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  current = stored && isTheme(stored) ? stored : DEFAULT_THEME;
  apply(current);
}
