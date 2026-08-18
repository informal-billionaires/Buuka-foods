import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import NavBar from '../../components/NavBar';
import { getOrderById, Order } from '../../lib/orders';
import { supabase } from '../../lib/supabaseClient';

function statusLabel(status: Order['status']): string {
  const labels: Record<Order['status'], string> = {
    placed: 'Placed',
    preparing: 'Preparing',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    declined: 'Declined',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}

function statusColor(status: Order['status']): string {
  const colors: Record<Order['status'], string> = {
    placed: 'text-primary',
    preparing: 'text-primary',
    in_transit: 'text-primary',
    delivered: 'text-emerald-400',
    declined: 'text-rose-400',
    cancelled: 'text-rose-400',
  };
  return colors[status] ?? 'text-primary';
}

export default function OrderPage() {
  const router = useRouter();
  const { id: orderId } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;
    if (!orderId || Array.isArray(orderId)) {
      setOrder(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        router.push(`/account/login?redirectTo=${encodeURIComponent(router.asPath)}`);
        return;
      }

      const found = await getOrderById(orderId);
      if (mounted) {
        setOrder(found);
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [router.isReady, orderId]);

  const date = useMemo(() => {
    if (!order) return '';
    return new Date(order.createdAt).toLocaleString();
  }, [order]);


  if (!router.isReady || loading) {
    return (
      <div className="min-h-screen bg-neutral-black text-neutral-white">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-neutral-400">Loading order…</div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-black text-neutral-white">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-neutral-900 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-semibold mb-4">Order not found</h1>
            <p className="text-neutral-400 mb-6">We couldn't find an order with that id.</p>

            <div className="flex justify-center gap-3">
              <Link href="/orders" className="inline-block px-4 py-2 rounded-full bg-primary text-black font-semibold">
                Back to Orders
              </Link>

              <Link href="/browse" className="inline-block px-4 py-2 rounded-full bg-neutral-white/5 text-sm">
                Back to browse
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-neutral-black text-neutral-white">
      <Head><title>Order {order.id} — Bukka Foods</title></Head>
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-neutral-900 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-400">Order</div>
              <div className="text-lg font-bold">{order.id}</div>
              <div className="text-xs text-neutral-400 mt-1">{date}</div>
            </div>

            <div className="text-right">
              <span className={`text-sm font-semibold ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Restaurant</h2>
            <div className="bg-neutral-800/40 rounded-xl p-4">
              <div className="text-sm font-medium">{order.restaurantName}</div>
              <div className="text-xs text-neutral-400">Order placed at {date}</div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Items</h2>
            <div className="space-y-3">
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
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/orders" className="inline-block px-4 py-2 rounded-full bg-primary text-black font-semibold">
            Back to Orders
          </Link>

          <Link href="/browse" className="inline-block px-4 py-2 rounded-full bg-neutral-white/5 text-sm">
            Back to browse
          </Link>
        </div>
      </main>
    </div>
  );
}