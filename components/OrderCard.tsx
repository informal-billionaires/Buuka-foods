import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { Order } from '../lib/orders';
import { statusLabel, statusBadgeColor } from '../lib/orderStatus';
import { ShoppingBag, ChevronRight } from 'lucide-react';


export type OrderCardProps = {
  order: Order;
  onReorder?: () => void;
  rating?: number;
  onRate?: (rating: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

function avatarColor(id: string): string {
  const palette = [
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-sky-100 text-sky-700',
    'bg-rose-100 text-rose-700',
  ];
  let hash = 0;
  for (const c of id) hash = (hash + c.charCodeAt(0)) % palette.length;
  return palette[hash];
}


function StarPicker({
  value,
  onSubmit,
  onCancel,
}: {
  value?: number;
  onSubmit: (rating: number) => void;
  onCancel: () => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState(value ?? 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelected(n)}
            className="text-lg leading-none"
            aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          >
            {(hovered ?? selected) >= n ? '★' : '☆'}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => selected > 0 && onSubmit(selected)}
        disabled={selected === 0}
        className="text-xs font-semibold text-primary disabled:text-neutral-300"
      >
        Save
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-muted">
        Cancel
      </button>
    </div>
  );
}

export default function OrderCard({
  order,
  onReorder,
  rating,
  onRate,
  isFavorite,
  onToggleFavorite,
}: OrderCardProps) {
  const router = useRouter();
  const [editingRating, setEditingRating] = useState(false);

  const dateLabel = useMemo(() => {
    try {
      return new Date(order.createdAt).toLocaleString();
    } catch {
      return order.createdAt;
    }
  }, [order.createdAt]);

  const firstItemLabel = useMemo(() => {
    if (!order.items || order.items.length === 0) return 'No items';
    const first = order.items[0].name;
    const more = order.items.length > 1 ? ` + ${order.items.length - 1} more` : '';
    return `${first}${more}`;
  }, [order.items]);

  function handleReorder() {
    if (onReorder) {
      onReorder();
      return;
    }
    router.push(`/restaurants/${order.restaurantId}`);
  }

  function handleRateSubmit(newRating: number) {
    onRate?.(newRating);
    setEditingRating(false);
  }

  const canRate = order.status === 'delivered' && !!onRate;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/orders/${order.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') router.push(`/orders/${order.id}`);
        }}
        className="bg-surface border border-neutral-200 shadow-sm rounded-2xl p-5 cursor-pointer hover:border-neutral-300 transition-colors"
      >
        <div className="flex items-start gap-5">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${avatarColor(order.id)}`}>
            <ShoppingBag size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs text-muted tracking-wide">ORDER #{order.id.slice(0, 8)}</div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeColor(order.status)}`}>
                {statusLabel(order.status)}
              </div>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <div className="text-lg font-semibold truncate">{order.restaurantName}</div>
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  className="text-lg leading-none"
                >
                  {isFavorite ? '♥' : '♡'}
                </button>
              )}
            </div>

            <div className="mt-2">
              <div className="text-xs text-muted">Items</div>
              <div className="text-sm truncate">
                {firstItemLabel} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Placeholder: restaurant distance/rating isn't stored on Order — drop this once it is */}
            <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-neutral-100 text-[11px] text-muted">
              Distance & rating coming soon
            </div>

            {canRate && (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                {editingRating ? (
                  <StarPicker value={rating} onSubmit={handleRateSubmit} onCancel={() => setEditingRating(false)} />
                ) : rating ? (
                  <button
                    type="button"
                    onClick={() => setEditingRating(true)}
                    className="flex items-center gap-1 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <span key={n}>{rating >= n ? '★' : '☆'}</span>
                    ))}
                    <span className="text-xs text-muted ml-1">Edit</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingRating(true)}
                    className="px-3 py-1.5 rounded-full bg-neutral-100 text-sm"
                  >
                    ★ Rate order
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Placeholder: order items don't carry an image — drop this once item photos are snapshotted onto orders */}
          <div className="hidden sm:flex w-20 h-20 rounded-xl bg-neutral-100 items-center justify-center flex-shrink-0 text-muted text-[10px] text-center leading-tight px-1">
            Photo soon
          </div>

          <div className="flex flex-col items-end gap-2.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs text-muted whitespace-nowrap">{dateLabel}</div>
            <div className="text-right">
              <div className="text-xs text-muted">Total</div>
              <div className="text-base font-semibold">₦{order.total}</div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/orders/${order.id}`} className="px-3 py-2 rounded-xl bg-neutral-100 text-sm">
                Details
              </Link>
              <button
                onClick={handleReorder}
                className="px-3 py-1.5 rounded-full bg-primary text-black text-sm font-semibold"
              >
                Reorder
              </button>
            </div>
          </div>

          <ChevronRight size={18} className="text-muted flex-shrink-0 self-center" />
        </div>
      </div>
    </>
  );
}