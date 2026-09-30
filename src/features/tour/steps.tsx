import type { ReactNode } from 'react';
import type { FindingStatus } from '@/types';
import { PAGES } from '@/data';
import { cn } from '@/lib/utils';
import { modLabel } from '@/lib/platform';
import { ui } from '@/stores/uiStore';
import { STATUS_LABEL } from '@/features/findings';
import { jumpTo } from '@/features/record-viewer';
import { useNotepadStore } from '@/features/notepad';
import { selectInRecord } from '@/features/add-finding';
import { setSourceMode } from '@/features/source-view';

export interface TourStep {
  id: string;
  section: string;
  title: string;
  body: ReactNode;
  /** Elements to light up, as selectors; the first one on screen anchors the card. None: the card sits in the middle. */
  targets?: () => string[];
  /** Where the card goes first, if it fits; otherwise beside, then above or below. */
  placement?: 'below';
  /** Shortcut rows: keys, then what they do. */
  keys?: [string[], string][];
  /** Arrange the screen for this step, starting from plain reading. */
  setup?: () => void;
  /** Needs the desktop layout; skipped at phone width. */
  wide?: boolean;
  /** Arrow keys go to the app (the overlay slider) instead of moving through the tour. */
  appArrows?: boolean;
}

const STATUSES: FindingStatus[] = ['ai', 'confirmed', 'added', 'rejected'];

function StatusLegend() {
  return (
    <span className="mt-2.5 grid grid-cols-2 gap-1.5">
      {STATUSES.map((s) => (
        <span key={s} className={cn('st-' + s, 'inline-flex items-center gap-2 rounded-md border border-st bg-st-fill px-2 py-1 text-xs')}>
          <span className="size-2 rounded-full bg-st" />{STATUS_LABEL[s]}
        </span>
      ))}
    </span>
  );
}

const openNotepad = () => {
  const np = useNotepadStore.getState();
  np.set({ panel: 'findings' });
  if (np.mode !== 'float' && np.mode !== 'dock') np.reopen();
};

const at = (...s: string[]) => () => s;

/** Words the "add a finding" step selects: HPI on page 1, not marked by CLAIRE. */
const DEMO_TEXT = 'polyuria and increasing thirst';
const blockWith = (page: number, text: string) => PAGES.find((p) => p.n === page)?.blocks.find((b) => b.t.includes(text))?.id;

/** The tour, in order. Every step's setup runs after resetStage(). */
export const STEPS: TourStep[] = [
  {
    id: 'welcome',
    section: 'Welcome',
    title: 'Welcome to CLAIRE Review',
    body: (
      <>
        This is where you review E/M and ER downcode reconsiderations and appeals. You read the medical record, check CLAIRE's AI findings
        against the claim, and decide whether the downcode is upheld or overturned.
        <span className="mt-2 block">The tour takes about two minutes. All patient data here is synthetic.</span>
      </>
    ),
  },
  {
    id: 'case',
    section: 'The case',
    title: 'What is being disputed',
    body: 'The case ID, review stage and when it arrived. Billed → paid is the downcode under review.',
    targets: at('[data-tour="case"]'),
    placement: 'below',
  },
  {
    id: 'patient',
    section: 'The case',
    title: 'Claim checked against the record',
    body: 'Who the patient is and why they came, as the claim states it. Each field is checked against the record: a green tick is verified, an amber ≠ is a mismatch, a red ! is invalid. Hover a mark for details, or click a field to go to its page.',
    targets: at('section[aria-label="Patient and encounter"]'),
    placement: 'below',
  },
  {
    id: 'record',
    section: 'The record',
    title: 'The medical record',
    body: (
      <>
        The scanned record, formatted as text in one continuous scroll. Each of CLAIRE's findings is boxed where its evidence appears,
        coloured by review status:
        <StatusLegend />
      </>
    ),
    targets: at('[data-tour="record"]'),
  },
  {
    id: 'evidence',
    section: 'Review',
    title: 'Check a finding',
    body: "Hover a box to see its finding; click to pin it. The card shows the code, CLAIRE's confidence and reasoning, the quoted evidence, and the MDM element it supports. Accept or reject it, leave a comment, or move the evidence to other words. Try it on this one.",
    targets: at('[aria-label="Finding details"]', '#ev-d2'),
    setup: () => jumpTo('d2'),
    keys: [[['J', 'K'], 'Next / previous finding'], [['A'], 'Accept'], [['R'], 'Reject'], [[modLabel('Z')], 'Undo']],
  },
  {
    id: 'add',
    section: 'Review',
    title: 'Add what CLAIRE missed',
    body: 'Select words in the record and say what they are: a diagnosis, service, MAR entry, documentation, or a note. A MAR row is always taken whole. Right-clicking a selection offers the same choices.',
    targets: at(`[data-block="${blockWith(1, DEMO_TEXT)}"]`, '[aria-label="Add finding"]'),
    setup: () => setTimeout(() => selectInRecord(1, DEMO_TEXT), 0),
  },
  {
    id: 'minimap',
    section: 'The record',
    title: 'Record overview',
    body: 'The strip on the right edge maps the whole record: page bounds, a tick for every finding in its status colour, and where you are. Click anywhere on it to jump there.',
    targets: at('[data-tour="minimap"]'),
  },
  {
    id: 'tools',
    section: 'The original',
    title: 'Zoom and views',
    body: 'Zoom the record here, or with + − 0 on the keyboard over either column. The three buttons on the right choose how the original scan shows: reading, side by side, or overlay.',
    targets: at('[data-tour="record-tools"]'),
    keys: [[['O'], 'Cycle views'], [['+', '−'], 'Zoom the column under the pointer']],
    wide: true,
  },
  {
    id: 'stage',
    section: 'The original',
    title: 'Original pages',
    body: 'While you read, the scanned pages around where you are wait in the margin. When the record is zoomed wide they tuck behind the edge; hover to slide them out. Click one to open it side by side.',
    targets: at('[aria-label="Original pages"]'),
    wide: true,
  },
  {
    id: 'compare',
    section: 'The original',
    title: 'Side by side',
    body: 'The scan in its own column, scrolling with the record. Each column zooms on its own; drag the scan to move around it when zoomed in. Right-click either side to jump to the same spot in the other, or to stop the two scrolling together. Esc goes back to reading.',
    targets: at('aside[aria-label="Original document"]'),
    setup: () => setSourceMode('compare'),
    wide: true,
  },
  {
    id: 'overlay',
    section: 'The original',
    title: 'Overlay',
    body: 'The scan laid over the extracted text of the same page. Drag the handle across to compare them line by line. Drag it back to either edge to return to reading.',
    targets: at('[data-tour="record"]'),
    setup: () => setSourceMode('overlay'),
    keys: [[['←', '→'], 'Move the slider'], [['Space'], 'Hold to see the whole scan']],
    wide: true,
    appArrows: true,
  },
  {
    id: 'lenses',
    section: 'The record',
    title: 'Spotlight and Clean read',
    body: 'Spotlight dims everything except marked evidence, so the findings stand out. It is on now. Clean read does the opposite: it hides every mark so you can read the record as written.',
    targets: at('[data-tour="lenses"]', '[data-tour="record"]'),
    placement: 'below',
    setup: () => ui().toggleSpot(),
    keys: [[['S'], 'Spotlight'], [['C'], 'Clean read']],
  },
  {
    id: 'notepad',
    section: 'Notes',
    title: 'Notepad',
    body: 'Your working list. Findings follows the pages in view, or shows everything; Claim checks each claim line against the record; Interventions lists what the record supports. Drag it anywhere, or drop it on the right edge to dock it.',
    targets: at('[aria-label="Notepad"], [aria-label="Notes"]'),
    setup: openNotepad,
    keys: [[['N'], 'Show or minimize'], [['D'], 'Dock or float']],
  },
  {
    id: 'full-findings',
    section: 'Full notes',
    title: 'Every finding',
    body: 'Full notes lists every finding in one table. Filter by type and status, read the evidence and details, and comment. Click a row to jump to it in the record.',
    targets: at('[role="dialog"][aria-label="Full notes"]'),
    setup: () => ui().set({ full: 'findings' }),
    keys: [[['F'], 'Open or close full notes']],
  },
  {
    id: 'full-claim',
    section: 'Full notes',
    title: 'The claim against the record',
    body: 'Each claim line and diagnosis, checked against the record: supported, units that differ, not found, and codes the record supports that are not on the claim. The score card shows the MDM level the findings support against what was billed.',
    targets: at('[role="dialog"][aria-label="Full notes"]'),
    setup: () => ui().set({ full: 'claim' }),
  },
  {
    id: 'full-interventions',
    section: 'Full notes',
    title: 'Interventions and how they were reached',
    body: 'The interventions derived from the record and the claim. Pick one to see the path from findings, through the rules, to the result. Click a finding in the chart to see it in the record.',
    targets: at('[role="dialog"][aria-label="Full notes"]'),
    setup: () => ui().set({ full: 'interventions' }),
  },
  {
    id: 'palette',
    section: 'Getting around',
    title: 'Command palette',
    body: 'Every action and page in one place. Type a few letters and press Enter. Shortcuts are listed beside each command.',
    targets: at('[role="dialog"][aria-label="Command palette"]'),
    setup: () => ui().set({ palette: true }),
    keys: [[[modLabel('K')], 'Open from anywhere']],
  },
  {
    id: 'complete',
    section: 'Finish',
    title: 'Complete the review',
    body: 'When you are done, complete the review with a closing comment. You are warned about AI suggestions still unreviewed and claim fields not verified. A completed review can be reopened.',
    targets: at('[data-tour="complete"]'),
    placement: 'below',
  },
  {
    id: 'done',
    section: 'Finish',
    title: "You're ready",
    body: 'Start with the AI suggestions: press J to go to the first finding. You can take this tour again from the Tour button in the header, or by pressing ?.',
  },
];
