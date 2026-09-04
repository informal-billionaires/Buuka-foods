import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Restaurant } from '../lib/restaurants';

export default function RestaurantCard({ restaurant, layout = 'grid' }: { restaurant: Restaurant; layout?: 'grid'|'list' }) {
  const distance = (restaurant as any).__distanceKm;

  return (
    <article className={`rounded-2xl overflow-hidden bg-white border border-neutral-200 shadow-sm ${layout === 'list' ? 'flex' : ''}`}>
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
            <div className="font-semibold text-lg text-neutral-900">{restaurant.name}</div>
            <div className="text-xs text-neutral-500 mt-1">{restaurant.cuisine} · {restaurant.tags?.join(', ')}</div>
          </div>

          <div className="text-right">
            <div className="text-sm font-medium text-neutral-900">
              {restaurant.rating > 0 ? `${restaurant.rating.toFixed(1)}★` : 'No ratings yet'}
            </div>
            <div className="text-xs text-neutral-500">{restaurant.deliveryTime} min</div>

            {typeof distance === 'number' && isFinite(distance) ? (
              <div className="text-xs text-neutral-500">{distance.toFixed(1)} km away</div>
            ) : (
              <div className="text-xs text-neutral-500">Distance unknown</div>
            )}
          </div>
        </div>

        <p className="text-sm text-neutral-500 mt-3 line-clamp-2">{restaurant.description}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-neutral-500">{restaurant.priceLevel}</div>
          <Link href={`/restaurants/${restaurant.id}`} className="ml-auto">
            <span className="inline-block px-4 py-2 rounded-xl bg-primary text-white font-semibold">View Menu</span>
          </Link>
        </div>
      </div>
    </article>
  );
}