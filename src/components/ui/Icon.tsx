import type { ReactNode } from 'react';

interface SvgProps {
  size?: number;
  sw?: number;
  className?: string;
}

const Svg = ({ children, size = 16, sw = 1.7, className }: SvgProps & { children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    {children}
  </svg>
);

const make = (children: ReactNode) => (p: SvgProps) => <Svg {...p}>{children}</Svg>;

export const Icon = {
  grip: make(
    <g fill="currentColor" stroke="none">
      <circle cx="9" cy="6" r="1.3" /><circle cx="15" cy="6" r="1.3" /><circle cx="9" cy="12" r="1.3" />
      <circle cx="15" cy="12" r="1.3" /><circle cx="9" cy="18" r="1.3" /><circle cx="15" cy="18" r="1.3" />
    </g>,
  ),
  pin: make(<><path d="M12 17v5" /><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z" /></>),
  expand: make(<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />),
  dock: make(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></>),
  float: make(<><rect x="3" y="4" width="18" height="16" rx="2" /><rect x="10" y="9" width="8" height="7" rx="1" /></>),
  min: make(<path d="M5 18h14" />),
  close: make(<path d="M6 6l12 12M18 6L6 18" />),
  check: make(<path d="M5 12.5l4.5 4.5L19 7.5" />),
  undo: make(<><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 010 10h-3" /></>),
  spot: make(<><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>),
  eye: make(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  cal: make(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  notes: make(<><path d="M6 3h9l4 4v14H6z" /><path d="M9 11h7M9 15h7M9 7h3" /></>),
  search: make(<><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>),
  down: make(<path d="M6 9l6 6 6-6" />),
  left: make(<path d="M15 6l-6 6 6 6" />),
  right: make(<path d="M9 6l6 6-6 6" />),
  stage: make(<><rect x="9" y="4" width="12" height="16" rx="1.5" /><path d="M3 7h3M3 12h3M3 17h3" /></>),
  compare: make(<><rect x="3" y="4" width="8" height="16" rx="1.5" /><rect x="13" y="4" width="8" height="16" rx="1.5" /></>),
  overlay: make(<><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M12 1v22" /><path d="M4 8h8M4 12h8M4 16h8" strokeDasharray="1.5 2" /></>),
  fitWidth: make(<><path d="M3 5v14M21 5v14" /><path d="M7 12h10M10 9l-3 3 3 3M14 9l3 3-3 3" /></>),
  link: make(<><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66L11.5 6.8" /><path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1.5-1.46" /></>),
  unlink: make(<><path d="M15.5 13.5l3-3a4 4 0 00-5.66-5.66L11.5 6.2" /><path d="M8.5 10.5l-3 3a4 4 0 005.66 5.66l1.34-1.36" /><path d="M4 4l16 16" /></>),
  copy: make(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 012-2h9" /></>),
  trash: make(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>),
  flow: make(<><rect x="3" y="4" width="6" height="5" rx="1" /><rect x="3" y="15" width="6" height="5" rx="1" /><rect x="15" y="9.5" width="6" height="5" rx="1" /><path d="M9 6.5h2.5a1 1 0 011 1V16.5a1 1 0 01-1 1H9M12.5 12H15" /></>),
  pencil: make(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>),
  lock: make(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>),
  alert: make(<><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></>),
  sun: make(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  moon: make(<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />),
  monitor: make(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>),
  help: make(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 014.9.7c0 1.7-2.4 2.3-2.4 3.8M12 17v.5" /></>),
};
