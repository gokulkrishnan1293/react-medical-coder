import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (platform: string) => {
  vi.resetModules();
  vi.stubGlobal('navigator', { platform, userAgent: '' });
  return import('./platform');
};

afterEach(() => vi.unstubAllGlobals());

describe('platform shortcuts', () => {
  it('uses ⌘ on Mac', async () => {
    const p = await load('MacIntel');
    expect(p.modLabel('K')).toBe('⌘K');
    expect(p.isModKey({ metaKey: true, ctrlKey: false })).toBe(true);
    expect(p.isModKey({ metaKey: false, ctrlKey: true })).toBe(false);
  });

  it('uses Ctrl on Windows', async () => {
    const p = await load('Win32');
    expect(p.modLabel('K')).toBe('Ctrl+K');
    expect(p.isModKey({ metaKey: false, ctrlKey: true })).toBe(true);
    expect(p.isModKey({ metaKey: true, ctrlKey: false })).toBe(false);
  });
});
