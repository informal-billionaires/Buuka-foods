import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Restaurant } from '../lib/restaurants';

export default function RestaurantCard({ restaurant, layout = 'grid' }: { restaurant: Restaurant; layout?: 'grid'|'list' }) {
  const distance = (restaurant as any).__distanceKm;

  return (
    <article className={`rounded-2xl overflow-hidden bg-neutral-white/3 shadow-soft-lg ${layout === 'list' ? 'flex' : ''}`}>
      <div className={`${layout === 'list' ? 'w-48 relative h-32' : 'relative h-48'}`}>
        <Image
          src={restaurant.cover || '/images/placeholder-restaurant.jpg'}
          alt={restaurant.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-lg">{restaurant.name}</div>
            <div className="text-xs text-neutral-white/60 mt-1">{restaurant.cuisine} · {restaurant.tags?.join(', ')}</div>
          </div>

          <div className="text-right">
            <div className="text-sm font-medium">{restaurant.rating.toFixed(1)}★</div>
            <div className="text-xs text-neutral-white/60">{restaurant.deliveryTime} min</div>

            {/* Distance display: show numeric distance when available, otherwise "Distance unknown" */}
            {typeof distance === 'number' && isFinite(distance) ? (
              <div className="text-xs text-neutral-white/60">{distance.toFixed(1)} km away</div>
            ) : (
              <div className="text-xs text-neutral-white/60">Distance unknown</div>
            )}
          </div>
        </div>

        <p className="text-sm text-neutral-white/60 mt-3 line-clamp-2">{restaurant.description}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-neutral-white/60">{restaurant.priceLevel}</div>
          <Link href={`/restaurants/${restaurant.id}`} className="ml-auto">
            <span className="inline-block px-4 py-2 rounded-xl bg-primary text-neutral-black font-semibold">View Menu</span>
          </Link>
        </div>
      </div>
    </article>
  );
}