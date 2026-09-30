export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');

/** A local calendar day as YYYY-MM-DD, the key time is recorded under. */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
