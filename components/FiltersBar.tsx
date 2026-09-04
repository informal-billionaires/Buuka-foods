import React from 'react';

type Props = {
  selectedCategory: string | null;
  onSelectCategory: (c: string) => void;
  sortBy: 'rating'|'delivery'|'distance';
  onSortChange: (s: Props['sortBy']) => void;
  onlyOpen: boolean;
  onToggleOpen: () => void;
};

const CATEGORIES = ['All', 'Jollof', 'Soups', 'Suya', 'Grills', 'Dessert'];

export default function FiltersBar({ selectedCategory, onSelectCategory, sortBy, onSortChange, onlyOpen, onToggleOpen }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat === 'All' ? null : cat)}
            className={`px-3 py-2 rounded-full text-sm ${selectedCategory === cat || (cat === 'All' && !selectedCategory) ? 'bg-primary text-white' : 'bg-white border border-neutral-200 text-neutral-700'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-neutral-500">Sort</label>
        <select value={sortBy} onChange={(e) => onSortChange(e.target.value as any)} className="rounded-xl bg-white border border-neutral-200 text-neutral-700 py-2 px-3">
          <option value="rating">Top rated</option>
          <option value="delivery">Delivery time</option>
          <option value="distance">Distance</option>
        </select>

        <label className="inline-flex items-center gap-2 ml-2 text-sm">
          <input type="checkbox" checked={onlyOpen} onChange={onToggleOpen} className="accent-primary" />
          <span className="text-neutral-600">Open now</span>
        </label>
      </div>
    </div>
  );
}