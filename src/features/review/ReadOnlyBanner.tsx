import { Button, Icon } from '@/components/ui';
import { useReviewStore } from './store';

/** Strip under the checkpoint bar while the review is completed: nothing can change until it is reopened. */
export function ReadOnlyBanner() {
  const { status, completedAt, reopen } = useReviewStore();
  if (status !== 'completed') return <div />;
  const when = completedAt?.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return (
    <div role="status" className="flex items-center justify-center gap-2.5 border-b border-line bg-ok-fill px-4 py-1.5 text-[12.5px] text-ink-2">
      <Icon.lock size={13} className="text-ok" />
      <span><b className="font-semibold text-ink">Review completed{when ? ` ${when}` : ''}.</b> It is read-only: findings, codes, evidence and comments cannot be changed.</span>
      <Button onClick={reopen} className="py-0.5">Reopen to edit</Button>
    </div>
  );
}
