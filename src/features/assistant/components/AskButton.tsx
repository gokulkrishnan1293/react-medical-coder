import { motion } from 'motion/react';
import { Icon } from '@/components/ui';
import { useAssistantStore } from '../store';

/** Floating launcher beside the record, above the Notes bubble: opens Ask CLAIRE from anywhere. */
export function AskButton() {
  const show = useAssistantStore((s) => s.show);
  return (
    <motion.button
      type="button"
      data-tour="ask-fab"
      onClick={show}
      title="Ask CLAIRE about this case or the screen (Q)"
      aria-label="Ask CLAIRE"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      whileHover={{ scale: 1.06 }}
      className="fixed right-9 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-40 grid size-11 place-items-center rounded-full bg-accent text-accent-ink shadow-float max-[760px]:right-6"
    >
      <Icon.spark size={20} sw={1.9} />
    </motion.button>
  );
}
