import type { FindingStatus, MdmElement, Route } from '@/types';

export const LEVELS = ['Straightforward', 'Low', 'Moderate', 'High'] as const;
export const LEVELS_SHORT = ['SF', 'L', 'M', 'H'] as const;
export const EM_CODES = ['99212', '99213', '99214', '99215'] as const;
export const ELEMENT_LABEL: Record<MdmElement, string> = { problems: 'Problems', data: 'Data', risk: 'Risk' };
export const ELEMENT_SHORT: Record<MdmElement, string> = { problems: 'PROB', data: 'DATA', risk: 'RISK' };
export const STATUS_LABEL: Record<FindingStatus, string> = { ai: 'AI suggested', confirmed: 'Accepted', added: 'Coder added', rejected: 'Rejected' };
export const ROUTE_LABEL: Record<Route, string> = { onClaim: 'On claim', notOnClaim: 'Not on claim', info: 'Reviewer note', excluded: 'Excluded' };
