import React from 'react';
import clsx from 'clsx';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChange, placeholder = 'Search...' }: Props) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full rounded-2xl py-3 px-4 bg-neutral-white/5 placeholder:text-neutral-white/50 focus:ring-2 focus:ring-primary/30',
          'outline-none text-neutral-white'
        )}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-white/60">
          Clear
        </button>
      )}
    </div>
  );
}