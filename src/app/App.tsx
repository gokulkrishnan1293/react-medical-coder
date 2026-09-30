import { useEffect } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { cn } from '@/lib/utils';
import { useNarrow } from '@/hooks/useMediaQuery';
import { useUiStore } from '@/stores/uiStore';
import { CaseHeader, PatientStrip } from '@/features/case-header';
import { RecordViewer, EvidenceCard } from '@/features/record-viewer';
import { ComposePanel, SelectionToolbar, useAddFindingStore } from '@/features/add-finding';
import { DockHint, DockedNotepad, FloatingNotepad, NotesBubble, keepOnScreen, tuckForNarrow, useNotepadStore } from '@/features/notepad';
import { FullNotes } from '@/features/full-notes';
import { CommandPalette } from '@/features/command-palette';
import { SourcePane, SourceStage, ViewSwitch } from '@/features/source-view';
import { DocMenu } from '@/features/doc-menu';
import { UndoToast, useFindings } from '@/features/findings';
import { useKeyboardShortcuts } from '@/features/shortcuts';

/** Layout shell: header, patient strip, record + notepad, and floating layers. */
export function App() {
  const narrow = useNarrow();
  const view = useUiStore((s) => s.view);
  const card = useUiStore((s) => s.card);
  const full = useUiStore((s) => s.full);
  const palette = useUiStore((s) => s.palette);
  const source = useUiStore((s) => s.source);
  const menu = useUiStore((s) => s.menu);
  const findings = useFindings();
  const { sel, compose } = useAddFindingStore();
  const npMode = useNotepadStore((s) => s.mode);
  const snap = useNotepadStore((s) => s.snap);

  useKeyboardShortcuts(narrow);
  useEffect(() => { if (narrow) tuckForNarrow(); }, [narrow]);
  useEffect(() => {
    window.addEventListener('resize', keepOnScreen);
    return () => window.removeEventListener('resize', keepOnScreen);
  }, []);

  const cardFinding = card && findings.find((f) => f.id === card.id);

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn('grid h-full grid-rows-[auto_auto_minmax(0,1fr)]', view.spot && 'spot', view.clean && 'clean')}>
        <CaseHeader />
        <PatientStrip />
        <div className="flex min-h-0">
          {source === 'compare' && <SourcePane />}
          <RecordViewer margin={source === 'stage' && <SourceStage />} tools={<ViewSwitch />} />
          {npMode === 'dock' && <DockedNotepad narrow={narrow} />}
        </div>

        {npMode === 'float' && <FloatingNotepad narrow={narrow} />}
        {npMode === 'min' && <NotesBubble />}
        <AnimatePresence>{snap && <DockHint />}</AnimatePresence>

        {cardFinding && <EvidenceCard f={cardFinding} />}
        {sel && !compose && !menu && <SelectionToolbar sel={sel} />}
        {sel && compose && <ComposePanel key={sel.text} sel={sel} type={compose} />}

        <AnimatePresence>
          {full && <FullNotes key="full" tab={full} />}
          {palette && <CommandPalette key="palette" />}
        </AnimatePresence>
        {menu && <DocMenu />}
        <UndoToast />
      </div>
    </MotionConfig>
  );
}
