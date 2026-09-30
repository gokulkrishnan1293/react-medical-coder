import type { Finding } from '@/types';
import { cn } from '@/lib/utils';
import { ROUTE_LABEL } from '../utils/labels';
import { routeOf } from '../utils/finding';

const ROUTE_STYLE = {
  onClaim: 'text-accent bg-accent-soft',
  notOnClaim: 'text-add bg-add-fill',
  info: 'text-ink-2 bg-chrome-2',
  excluded: 'text-rej bg-rej-fill',
} as const;

/** Small label saying where a finding lands: on claim, not on claim, note, excluded. */
export function RouteTag({ f }: { f: Finding }) {
  const r = routeOf(f);
  return <span className={cn('rounded px-1.5 py-[3px] text-[10.5px] leading-none whitespace-nowrap', ROUTE_STYLE[r])}>{ROUTE_LABEL[r]}</span>;
}
