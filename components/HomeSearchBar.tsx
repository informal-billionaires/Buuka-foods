import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { searchRestaurants, Restaurant } from '../lib/restaurants';

export default function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchRestaurants(query);
      setResults(data);
      setLoading(false);
      setOpen(true);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-home-search-bar]')) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSelect(id: string) {
    setOpen(false);
    setQuery('');
    router.push(`/restaurants/${id}`);
  }

  return (
    <div className="relative md:hidden bg-white px-4 py-3 border-b border-neutral-200" data-home-search-bar>
      <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-full px-4 py-2.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-400 flex-shrink-0"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for food or restaurant..."
          className="flex-1 bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
        />
      </div>

      {open && (
        <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-neutral-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-500">No restaurants found</div>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.id)}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex flex-col border-b border-neutral-100 last:border-b-0"
              >
                <span className="text-sm font-medium text-neutral-900">{r.name}</span>
                <span className="text-xs text-neutral-500">{r.cuisine}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}