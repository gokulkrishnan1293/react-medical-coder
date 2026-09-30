import { useId, useRef, useState, type ReactNode } from 'react';
import { clamp } from '@/lib/utils';

const W = 280;

/**
 * Shows `tip` below the trigger on hover or keyboard focus. Positioned against the viewport,
 * so it is not clipped by scrolling strips.
 */
export function HoverTip({ tip, children, className }: { tip: ReactNode; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setAt({ left: clamp(r.left + r.width / 2 - W / 2, 8, window.innerWidth - W - 8), top: r.bottom + 6 });
  };
  const hide = () => setAt(null);
  return (
    <span ref={ref} className={className} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} aria-describedby={at ? id : undefined}>
      {children}
      {at && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none fixed z-90 rounded-lg bg-ink px-3 py-2 text-left text-[12px] leading-snug font-normal whitespace-normal text-paper shadow-float"
          style={{ ...at, width: W }}
        >
          {tip}
        </span>
      )}
    </span>
  );
}
