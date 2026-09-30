import { prefersReducedMotion } from './utils';

/** Animates a code chip from the selection into the notepad. */
export function flyChip(fromRect: DOMRect | null, label: string, target: HTMLElement | null) {
  if (!target || !fromRect) return;
  const to = target.getBoundingClientRect();
  const chip = document.createElement('div');
  chip.className = 'fixed z-[95] pointer-events-none whitespace-nowrap rounded-md bg-add px-2 py-1.5 font-mono text-[11px] font-semibold leading-none text-on-tag shadow-float';
  chip.textContent = label;
  document.body.appendChild(chip);
  const x0 = fromRect.left;
  const y0 = fromRect.top - 4;
  chip.style.left = x0 + 'px';
  chip.style.top = y0 + 'px';
  const dx = to.left + Math.min(to.width / 2, 60) - x0 - 30;
  const dy = to.top + Math.min(to.height / 2, 70) - y0;
  const a = chip.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 70}px) scale(1.08)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.55)`, opacity: 0.15 },
    ],
    { duration: prefersReducedMotion() ? 1 : 640, easing: 'cubic-bezier(.45,0,.25,1)' },
  );
  a.onfinish = () => {
    chip.remove();
    target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
  };
}
