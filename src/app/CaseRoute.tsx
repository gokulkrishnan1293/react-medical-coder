import { Link, Navigate, useParams } from 'react-router';
import { CASE, ME, WORKLIST, reviewerById } from '@/data';
import { Avatar, Icon } from '@/components/ui';
import { lockedFor } from '@/features/worklist';
import { App } from './App';

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto bg-desk">
      <main className="mx-auto mt-16 max-w-[520px] rounded-xl border border-line bg-paper p-6 text-center max-[760px]:mx-4">
        <h1 className="text-[18px] font-bold tracking-tight">{title}</h1>
        <div className="mt-2 text-[13px] leading-normal text-ink-2">{children}</div>
        <Link to="/" className="mt-5 inline-flex items-center gap-1 rounded-[7px] border border-line px-3 py-1.5 text-[13px] font-medium hover:border-ink-3">
          <Icon.left size={14} />Back to worklist
        </Link>
      </main>
    </div>
  );
}

/**
 * /cases/:caseId. Opens the workbench for the case whose data is loaded; a case another reviewer has open
 * is refused here too, not only in the list, so a pasted link cannot get around the lock.
 */
export function CaseRoute() {
  const { caseId } = useParams();
  const w = WORKLIST.find((x) => x.id === caseId);
  if (!w) return <Navigate to="/" replace />;
  if (lockedFor(w, ME.id)) {
    const by = reviewerById(w.openBy!.reviewer)!;
    return (
      <Notice title={`${w.id} is locked`}>
        <span className="mb-3 flex items-center justify-center gap-2"><Avatar r={by} size={28} /><b className="font-semibold text-ink">{by.name}</b> is reviewing it now.</span>
        You can open it once they leave the case.
      </Notice>
    );
  }
  if (w.id !== CASE.id) {
    return (
      <Notice title={`${w.id} has no record loaded`}>
        Only {CASE.id} has its record and CLAIRE's findings in this prototype. Other cases open once they are
        prepared as case folders (docs/DATA-SPEC.md).
      </Notice>
    );
  }
  return <App />;
}
