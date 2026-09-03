// components/PopularNearYou.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Star } from 'lucide-react';
import { getApprovedRestaurants, Restaurant } from '../lib/restaurants';
import { DEFAULT_DELIVERY_FEE } from '../lib/pricing';

export default function PopularNearYou() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApprovedRestaurants()
      .then((data) => setRestaurants(data.slice(0, 5)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-6 w-40 bg-neutral-200 rounded animate-pulse mb-4" />
        <div className="flex gap-5 overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-56 h-64 flex-shrink-0 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (restaurants.length === 0) return null; // data honesty: no fake fallback cards

  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Popular near you</h2>
        <Link href="/browse" className="text-sm text-primary font-medium">View all</Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-5 overflow-x-auto scrollbar-hide">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurants/${r.id}`}
              className="w-56 flex-shrink-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden"
            >
              <div className="relative w-full h-36 bg-neutral-100">
                <img
                  src={r.cover || '/images/placeholder-restaurant.jpg'}
                  alt={r.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-neutral-900">{r.name}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{r.cuisine ?? '—'}</div>

                <div className="flex items-center gap-1 mt-2 text-xs text-neutral-600">
                  {r.rating != null && r.rating > 0 ? (
                    <>
                        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                        <span>{r.rating}</span>
                    </>
                    ) : (
                    <span className="text-neutral-400">No ratings yet</span>
                    )}
                </div>

                <div className="text-xs font-medium text-neutral-700 mt-1">
                  Delivery from ₦{DEFAULT_DELIVERY_FEE}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button
          aria-label="Scroll popular restaurants"
          className="flex-shrink-0 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}