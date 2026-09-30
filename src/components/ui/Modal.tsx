import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/** Scrim + animated panel. Wrap in <AnimatePresence> for exit animation. */
export function Modal({ onClose, children, label, align = 'center', className }: {
  onClose: () => void;
  children: ReactNode;
  label: string;
  align?: 'center' | 'top';
  className?: string;
}) {
  return (
    <motion.div
      className={cn('fixed inset-0 z-80 grid bg-scrim p-4', align === 'top' ? 'place-items-start justify-center pt-[12vh]' : 'place-items-center')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        role="dialog"
        aria-label={label}
        className={className}
        initial={{ opacity: 0, y: 6, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.99 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
