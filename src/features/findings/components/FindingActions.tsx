import type { Finding } from '@/types';
import { Icon, IconButton } from '@/components/ui';
import { useFindingsStore } from '../store/findingsStore';
import { isLive } from '../utils/finding';

/** Compact accept / reject / restore buttons for lists and tables. */
export function FindingActions({ f, stop = false }: { f: Finding; stop?: boolean }) {
  const setStatus = useFindingsStore((s) => s.setStatus);
  const act = (status: Finding['status']) => (e: React.MouseEvent) => {
    if (stop) e.stopPropagation();
    setStatus(f.id, status);
  };
  return (
    <>
      {f.status === 'ai' && (
        <IconButton size="sm" tone="ok" title="Accept (A)" aria-label="Accept" onClick={act('confirmed')}><Icon.check size={14} /></IconButton>
      )}
      {(f.status === 'ai' || isLive(f)) && (
        <IconButton size="sm" tone="no" title="Reject (R)" aria-label="Reject" onClick={act('rejected')}><Icon.close size={14} /></IconButton>
      )}
      {f.status === 'rejected' && (
        <IconButton size="sm" title="Restore" aria-label="Restore" onClick={act(f.source === 'ai' ? 'ai' : 'added')}><Icon.undo size={14} /></IconButton>
      )}
    </>
  );
}
