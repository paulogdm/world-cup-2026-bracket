// Supported color themes. `system` follows the OS `prefers-color-scheme`;
// `light` / `dark` force a fixed appearance. The chosen theme drives the CSS
// `color-scheme` property, which in turn resolves every `light-dark()` token in
// the stylesheet — so the whole palette flips from a single switch.

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'system';

/** The `color-scheme` value a theme maps to. `system` keeps both, honoring the OS. */
export function colorScheme(theme: Theme): 'light dark' | 'light' | 'dark' {
  return theme === 'system' ? 'light dark' : theme;
}

export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}
