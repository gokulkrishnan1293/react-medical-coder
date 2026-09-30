import { PAGES } from '@/data';

export const pageLabel = (n: number) => PAGES.find((p) => p.n === n)?.label ?? '';
