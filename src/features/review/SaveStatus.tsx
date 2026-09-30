import { HoverTip, Icon } from '@/components/ui';
import { api, useSaveStore } from '@/api';
import { cn } from '@/lib/utils';

/** Whether the review is saved: quiet once saved, clear when it is not. Hover for where and when. */
export function SaveStatus() {
  const { state, savedAt, error, notices } = useSaveStore();
  if (state === 'idle') return null;
  const when = savedAt && new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const label = state === 'saving' ? 'Saving…' : state === 'error' ? 'Not saved' : 'Saved';
  return (
    <HoverTip
      tip={
        <>
          <span className="block font-semibold">{state === 'error' ? `Not saved: ${error}. Retrying.` : `Saved to ${api.where}${when ? ` at ${when}` : ''}`}</span>
          {notices.map((n) => <span key={n} className="mt-1 block opacity-85">{n}</span>)}
        </>
      }
    >
      <span
        tabIndex={0}
        role="status"
        className={cn('inline-flex items-center gap-1 text-[11.5px] whitespace-nowrap', state === 'error' ? 'font-semibold text-rej' : 'text-ink-3')}
      >
        {state === 'error' ? <Icon.alert size={12} /> : state === 'saved' ? <Icon.check size={12} sw={2.4} /> : <span className="size-1.5 animate-pulse rounded-full bg-ink-3" />}
        {label}
        {notices.length > 0 && <span className="rounded-full bg-add-fill px-1 text-[10px] font-semibold text-add">{notices.length}</span>}
      </span>
    </HoverTip>
  );
}
