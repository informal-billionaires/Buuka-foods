import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProductCard from './ProductCard';
import { getFeaturedMenuItems } from '../lib/restaurants';

export default function FeaturedRow() {
  const router = useRouter();
  const [items, setItems] = useState<Array<{
    id: string;
    name: string;
    image?: string | null;
    customerPrice: number;
    restaurantId: string;
    restaurantName: string;
  }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await getFeaturedMenuItems(6);
        if (!mounted) return;
        setItems(rows);
      } catch (err: any) {
        console.error('Failed to load featured items', err);
        if (mounted) setError(err?.message || 'Failed to load featured items');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Featured</h2>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded-full bg-neutral-white/5 text-sm">‹</button>
          <button className="px-3 py-1 rounded-full bg-neutral-white/5 text-sm">›</button>
        </div>
      </div>

      {loading ? (
        <div className="bg-neutral-950 rounded-2xl p-6 text-center text-neutral-400">Loading featured items…</div>
      ) : error ? (
        <div className="bg-neutral-950 rounded-2xl p-6 text-center text-rose-400">Error: {error}</div>
      ) : items.length === 0 ? (
        <div className="bg-neutral-950 rounded-2xl p-6 text-center text-neutral-400">No featured items yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(it => (
            <ProductCard
              key={it.id}
              title={it.name}
              img={it.image ?? '/images/placeholder-food.jpg'}
              price={it.customerPrice}
              restaurantName={it.restaurantName}
              onClick={() => router.push(`/restaurants/${it.restaurantId}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}