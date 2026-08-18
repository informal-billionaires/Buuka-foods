import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { Order } from '../lib/orders';

export type OrderCardProps = {
  order: Order;
  onReorder?: () => void;
};

export default function OrderCard({ order, onReorder }: OrderCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
    // navigate to restaurant page
    router.push(`/restaurants/${order.restaurantId}`);
  }

  return (
    <>
      <div className="bg-neutral-white/3 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="text-sm text-neutral-400">Order</div>
              <div className="px-2 py-1 rounded-full bg-primary text-black text-xs font-semibold">Placed</div>
            </div>

            <div className="mt-3">
              <div className="text-sm text-neutral-300">Restaurant</div>
              <div className="text-base font-semibold">{order.restaurantName}</div>
            </div>

            <div className="mt-2 text-sm text-neutral-400">
              <div className="truncate">{firstItemLabel}</div>
              <div className="mt-1 text-xs text-neutral-500">Order #{order.id} · {dateLabel}</div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-sm font-semibold">₦{order.total}</div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(true)}
                className="px-3 py-1.5 rounded-full bg-neutral-white/5 text-sm"
              >
                View
              </button>

              <Link href={`/orders/${order.id}`} className="px-3 py-2 rounded-xl bg-neutral-white/5 text-sm">
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
        </div>
      </div>

      {/* Details drawer / panel (simple slide-over style) */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-96 z-50 bg-neutral-950 shadow-2xl p-6 overflow-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Order {order.id}</h3>
                <div className="text-xs text-neutral-400 mt-1">{dateLabel}</div>
              </div>
              <div>
                <button onClick={() => setOpen(false)} className="text-neutral-400">Close</button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {order.items.map(item => (
                <div key={item.key} className="bg-neutral-900 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        {item.size && <div className="text-xs text-neutral-400">· {item.size}</div>}
                      </div>

                      {item.customizations && item.customizations.length > 0 && (
                        <div className="text-xs text-neutral-400 mt-1">{item.customizations.join(', ')}</div>
                      )}
                    </div>

                    <div className="text-sm font-semibold">₦{item.unitPrice * item.qty}</div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="text-sm text-neutral-400">Qty</div>
                    <div className="text-sm font-medium">{item.qty}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-neutral-800 pt-4">
              <div className="flex items-center justify-between text-sm text-neutral-400">
                <div>Subtotal</div>
                <div>₦{order.subtotal}</div>
              </div>

              <div className="flex items-center justify-between text-sm text-neutral-400 mt-2">
                <div>{order.fulfillment === 'delivery' ? 'Delivery fee' : 'Pickup'}</div>
                <div>{order.fulfillment === 'delivery' ? `₦${order.deliveryFee}` : 'Free'}</div>
              </div>

              <div className="flex items-center justify-between text-sm font-semibold text-white mt-3">
                <div>Total</div>
                <div>₦{order.total}</div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleReorder}
                  className="w-full inline-flex items-center justify-center px-4 py-3 rounded-full bg-primary text-black text-sm font-semibold"
                >
                  Reorder
                </button>

                <Link href={`/orders/${order.id}`} className="px-3 py-2 rounded-xl bg-neutral-white/5 text-sm">
                  Details
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}