import { create } from 'zustand';

/* Light, dark, or follow the system. Stored per browser; the page applies it before it draws (index.html). */

export type Theme = 'system' | 'light' | 'dark';
const KEY = 'claire-review.theme';

function stored(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

/** Light or dark `data-theme` on <html> overrides the system; none follows it (see globals.css). */
function apply(t: Theme) {
  const el = document.documentElement;
  if (t === 'system') delete el.dataset.theme;
  else el.dataset.theme = t;
}

export const useThemeStore = create<{ theme: Theme; setTheme: (t: Theme) => void }>((set) => ({
  theme: stored(),
  setTheme: (theme) => {
    apply(theme);
    try {
      if (theme === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch { /* storage blocked: the choice lasts for this page only */ }
    set({ theme });
  },
}));

export const THEME_ORDER: Theme[] = ['system', 'light', 'dark'];
export const THEME_LABEL: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' };
export const nextTheme = (t: Theme) => THEME_ORDER[(THEME_ORDER.indexOf(t) + 1) % THEME_ORDER.length];
