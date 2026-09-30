import { motion } from 'motion/react';

/** Drop zone shown while dragging the notepad near the right edge. */
export function DockHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none fixed inset-y-0 right-0 z-35 grid w-[360px] place-items-center border-l-2 border-dashed border-accent bg-accent/12"
    >
      <span className="rounded-full bg-paper px-3 py-1.5 font-semibold text-accent shadow-float">Release to dock</span>
    </motion.div>
  );
}
