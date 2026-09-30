export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');
