import clsx from 'clsx';
import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
};

export default function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-semibold transition';
  const variants: Record<string, string> = {
    primary: 'bg-primary text-neutral-black hover:bg-primary-deep',
    secondary: 'bg-primary-warm text-neutral-black hover:bg-primary',
    outline: 'border border-neutral-white/10 text-neutral-white hover:border-primary'
  };
  return (
    <button className={clsx(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}