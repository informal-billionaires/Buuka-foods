// components/CategoriesRow.tsx
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { label: 'Popular', icon: '⭐' },
  { label: 'Rice Dishes', icon: '🍚' },
  { label: 'Soups', icon: '🥣' },
  { label: 'Swallows', icon: '⚪' },
  { label: 'Grills', icon: '🍢' },
  { label: 'Drinks', icon: '🥤' },
  { label: 'Breakfast', icon: '🍳' },
];

export default function CategoriesRow() {
  const [active, setActive] = useState('Popular');
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-semibold text-neutral-900">Categories</h2>
        <a href="#" className="text-sm text-primary font-medium">View all</a>
      </div>
      <div className="flex items-center gap-3 justify-center">
        <div className="flex gap-2.5 md:gap-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = active === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setActive(cat.label)}
                className={`flex flex-col items-center justify-center gap-1.5 md:gap-2 w-[76px] h-[76px] md:w-24 md:h-24 flex-shrink-0 rounded-xl border text-xs md:text-sm ${
                  isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-neutral-200 text-neutral-700 bg-white'
                }`}
              >
                <span className="text-lg md:text-xl">{cat.icon}</span>
                <span className="text-center leading-tight px-1">{cat.label}</span>
              </button>
            );
          })}
        </div>
        <button
          aria-label="Scroll categories"
          className="hidden md:flex flex-shrink-0 w-9 h-9 rounded-full border border-neutral-200 items-center justify-center text-neutral-500"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}