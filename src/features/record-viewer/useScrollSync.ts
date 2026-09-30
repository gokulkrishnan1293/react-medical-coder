import { useEffect } from 'react';
import { scrollerRef } from '@/lib/dom';
import { useUiStore } from '@/stores/uiStore';

/** Tracks which record pages are visible and which one is most in view. `layout` changes when the pages are redrawn. */
export function useScrollSync(layout?: unknown) {
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const ratios: Record<string, number> = {};
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { ratios[(e.target as HTMLElement).dataset.page!] = e.intersectionRatio; });
        const vis = Object.entries(ratios).filter(([, r]) => r > 0.04).map(([k]) => +k).sort((a, b) => a - b);
        const { visiblePages, set } = useUiStore.getState();
        let best = 1;
        let br = -1;
        Object.entries(ratios).forEach(([k, r]) => { if (r > br) { br = r; best = +k; } });
        set({
          currentPage: best,
          ...(vis.length && vis.join() !== visiblePages.join() ? { visiblePages: vis } : {}),
        });
      },
      { root, threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.9, 1] },
    );
    root.querySelectorAll('[data-page]').forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [layout]);
}
