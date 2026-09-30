import { THEME_LABEL, nextTheme, useThemeStore } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

/** One button that steps through System → Light → Dark; the icon shows the current choice. */
export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const { theme, setTheme } = useThemeStore();
  const I = theme === 'light' ? Icon.sun : theme === 'dark' ? Icon.moon : Icon.monitor;
  const next = nextTheme(theme);
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Theme: ${THEME_LABEL[theme]}. Click for ${THEME_LABEL[next]}`}
      aria-label={`Theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[next]}`}
      className={cn('inline-flex h-[30px] items-center gap-1.5 rounded-[7px] px-2 text-[12.5px] text-ink-2 hover:bg-chrome-2 hover:text-ink', className)}
    >
      <I size={15} />
      {withLabel && <span>{THEME_LABEL[theme]}</span>}
    </button>
  );
}
