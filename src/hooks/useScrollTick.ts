import { useEffect, useState, type RefObject } from 'react';

/** Re-renders on scroll and resize so floating layers can follow their anchor. */
export function useScrollTick(ref: RefObject<HTMLElement | null>) {
  const [, set] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const h = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => set((t) => t + 1));
    };
    el.addEventListener('scroll', h, { passive: true });
    window.addEventListener('resize', h);
    return () => {
      el.removeEventListener('scroll', h);
      window.removeEventListener('resize', h);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
}
