import { useReviewStore } from './store';

/**
 * "In progress" next to the Complete review button. Once completed, the button itself shows the
 * status, so the badge steps aside.
 */
export function ReviewStatusBadge() {
  const status = useReviewStore((s) => s.status);
  if (status === 'completed') return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ai-fill px-2 py-[3px] text-[11.5px] leading-none font-semibold text-ai">
      <span className="size-1.5 rounded-full bg-ai" />
      In progress
    </span>
  );
}
