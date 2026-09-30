import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useFindingsStore } from '../store/findingsStore';

/** Confirms each change with an Undo button. */
export function UndoToast() {
  const toast = useFindingsStore((s) => s.toast);
  const canUndo = useFindingsStore((s) => s.history.length > 0);
  const { undo, clearToast } = useFindingsStore.getState();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 4200);
    return () => clearTimeout(t);
  }, [toast, clearToast]);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          initial={{ opacity: 0, y: 8, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 8, x: '-50%' }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-[calc(22px+env(safe-area-inset-bottom,0px))] left-1/2 z-90 flex max-w-[calc(100%-32px)] items-center gap-3.5 rounded-[9px] bg-ink py-[9px] pr-2.5 pl-3.5 text-[12.5px] text-paper shadow-float"
        >
          <span>{toast.msg}</span>
          {toast.undoable && canUndo && (
            <button onClick={undo} className="rounded-md bg-paper/15 px-2.5 py-1 text-xs font-semibold">Undo</button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
