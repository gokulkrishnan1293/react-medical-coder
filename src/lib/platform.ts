/* Keyboard differences between Mac and Windows/Linux: ⌘ there, Ctrl here. */

const platform = typeof navigator === 'undefined'
  ? ''
  : (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || navigator.userAgent;

export const isMac = /mac|iphone|ipad/i.test(platform);

/** The primary shortcut modifier is held: ⌘ on Mac, Ctrl on Windows and Linux. */
export const isModKey = (e: { metaKey: boolean; ctrlKey: boolean }) => (isMac ? e.metaKey : e.ctrlKey);

/** Name of the primary modifier as shown in hints. */
export const MOD = isMac ? '⌘' : 'Ctrl';

/** Hint for a shortcut with the primary modifier: "⌘K" on Mac, "Ctrl+K" elsewhere. */
export const modLabel = (key: string) => (isMac ? `⌘${key}` : `Ctrl+${key}`);
