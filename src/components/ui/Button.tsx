import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'primary' | 'ok';

const VARIANT: Record<Variant, string> = {
  default: 'border-line bg-paper text-ink hover:border-ink-3',
  primary: 'border-transparent bg-accent text-accent-ink hover:brightness-110',
  ok: 'border-transparent bg-ok text-on-tag hover:brightness-110',
};

export function Button({ variant = 'default', className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn('inline-flex items-center justify-center gap-1.5 rounded-[7px] border px-2.5 py-1.5 text-[12.5px] font-medium', VARIANT[variant], className)}
      {...rest}
    />
  );
}

type Tone = 'default' | 'ok' | 'no';

const TONE: Record<Tone, string> = {
  default: 'hover:bg-chrome-2 hover:text-ink',
  ok: 'hover:bg-ok-fill hover:text-ok',
  no: 'hover:bg-rej-fill hover:text-rej',
};

export function IconButton({ size = 'md', tone = 'default', className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'sm' | 'md'; tone?: Tone }) {
  return (
    <button
      type="button"
      className={cn('inline-grid flex-none place-items-center rounded-md text-ink-2', size === 'sm' ? 'size-6' : 'size-7', TONE[tone], className)}
      {...rest}
    />
  );
}
