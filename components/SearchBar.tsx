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
          'w-full rounded-2xl py-3 px-4 bg-white border border-neutral-200 placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/30',
          'outline-none text-neutral-900'
        )}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
          Clear
        </button>
      )}
    </div>
  );
}