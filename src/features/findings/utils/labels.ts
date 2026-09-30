import type { FindingStatus, FindingType, MdmElement, Route } from '@/types';

export const LEVELS = ['Straightforward', 'Low', 'Moderate', 'High'] as const;
export const LEVELS_SHORT = ['SF', 'L', 'M', 'H'] as const;
export const ELEMENT_LABEL: Record<MdmElement, string> = { problems: 'Problems', data: 'Data', risk: 'Risk' };
export const ELEMENT_SHORT: Record<MdmElement, string> = { problems: 'PROB', data: 'DATA', risk: 'RISK' };
export const STATUS_LABEL: Record<FindingStatus, string> = { ai: 'AI suggested', confirmed: 'Accepted', added: 'Coder added', rejected: 'Rejected' };
export const ROUTE_LABEL: Record<Route, string> = { onClaim: 'On claim', notOnClaim: 'New', support: 'Supporting', note: 'Note', excluded: 'Excluded' };
export const TYPE_LABEL: Record<FindingType, string> = {
  dx: 'Diagnosis',
  svc: 'Service',
  mar: 'MAR',
  doc: 'Documentation',
  time: 'Time',
  note: 'Note',
};
