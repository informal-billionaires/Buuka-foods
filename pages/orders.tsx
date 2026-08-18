import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import OrderCard from '../components/OrderCard';
import { getOrders, Order } from '../lib/orders';
import { supabase } from '../lib/supabaseClient';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Load orders from localStorage on client mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        router.push(`/account/login?redirectTo=${encodeURIComponent(router.asPath)}`);
        return;
      }

      const loaded = await getOrders();
      if (!mounted) return;
      loaded.sort((a, b) => {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        return tb - ta;
      });
      setOrders(loaded);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  

  // Filter by order id or item name (case-insensitive)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o => {
      if (o.id.toLowerCase().includes(q)) return true;
      if (o.restaurantName && o.restaurantName.toLowerCase().includes(q)) return true;
      // check item names
      for (const it of o.items) {
        if ((it.name || '').toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [orders, query]);

  return (
    <>
      <Head>
        <title>Your Orders — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-neutral-black text-neutral-white">
        <NavBar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold">Orders</h1>
              <p className="text-sm text-neutral-400 mt-1">Your recent orders are listed below.</p>
            </div>

            <div className="w-full max-w-sm">
              <label className="block text-xs text-neutral-400 mb-1">Search orders</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by order id, restaurant or item"
                className="w-full px-3 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-sm"
                aria-label="Search orders"
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="bg-neutral-900 rounded-2xl p-8 text-center">
                <div className="text-neutral-400">Loading orders…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-neutral-900 rounded-2xl p-8 text-center">
                <div className="text-neutral-400">No orders found.</div>
              </div>
            ) : (
              filtered.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onReorder={() => router.push(`/restaurants/${order.restaurantId}`)}
                />
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
}