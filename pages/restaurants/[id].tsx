import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NavBar from '../../components/NavBar';
import MenuItemRow from '../../components/MenuItemRow';
import CartDrawer from '../../components/CartDrawer';
import FulfillmentToggle from '../../components/FulfillmentToggle';
import { saveOrder, Order } from '../../lib/orders';
import { getRestaurantById, getPricedMenuForRestaurant, Restaurant, PricedMenuItem } from '../../lib/restaurants';
import { supabase } from '../../lib/supabaseClient';


/* -------------------------
   Types used by the page
   ------------------------- */

type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  notes?: string;
  // other fields as used by CartDrawer / checkout flow...
};

const PENDING_CHECKOUT_KEY = 'bukkaPendingCheckout';

export default function RestaurantPage() {
  const router = useRouter();
  const id = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;

  // --- Async restaurant & menu state (replaces static lookup) ---
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuSections, setMenuSections] = useState<Array<{ id: string; title: string; items: PricedMenuItem[] }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Cart state and all other existing logic kept EXACTLY as before
  const [cart, setCart] = useState<CartItem[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('delivery');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openPanelItemId, setOpenPanelItemId] = useState<string | null>(null);

  // --- Existing helpers (makeCartKey, addOrMergeCartItem, updateCartQty, removeCartItem) ---
  function makeCartKey(item: PricedMenuItem, size?: string, mods?: string) {
    return `${item.id}:${size ?? ''}:${mods ?? ''}`;
  }

  function addOrMergeCartItem(newItem: CartItem) {
    setCart(prev => {
      const existing = prev.find(i => i.id === newItem.id);
      if (!existing) return [...prev, newItem];
      return prev.map(i => i.id === newItem.id ? { ...i, qty: i.qty + newItem.qty } : i);
    });
  }

  function updateCartQty(key: string, qty: number) {
    console.log('updateCartQty called with key:', key, 'qty:', qty);
    setCart(prev => {
      console.log('current cart keys:', prev.map(i => i.key));
      return prev.map(i => i.key === key ? { ...i, qty } : i);
    });
  }

  function removeCartItem(key: string) {
    setCart(prev => prev.filter(i => i.key !== key));
  }

  // Delivery fee calculation & order place/save logic left unchanged
  const deliveryFee = fulfillmentType === 'delivery' ? Math.max(300, Math.ceil(Number(restaurant?.distance || 0)) * 100) : 0;
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const total = subtotal + deliveryFee;

  async function onPlaceOrder() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      try {
        sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({
          restaurantId: id,
          cart,
          fulfillmentType,
        }));
      } catch (err) {
        console.error('Failed to persist pending checkout', err);
      }
      router.push(`/account/login?redirectTo=${encodeURIComponent(router.asPath)}`);
      return;
    }

    const orderId = `order-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const order: Order = {
      id: orderId,
      createdAt,
      restaurantId: restaurant!.id,
      restaurantName: restaurant!.name,
      items: cart.map(c => ({
        key: c.key,
        itemId: c.menuItemId,
        name: c.name,
        unitPrice: c.price,
        qty: c.qty,
        size: undefined,
        customizations: c.notes ? c.notes.split(', ') : [],
      })),
      fulfillment: fulfillmentType,
      deliveryFee: fulfillmentType === 'delivery' ? deliveryFee : 0,
      subtotal,
      total,
      status: 'placed',
    };

    saveOrder(order);
    setCart([]);
    setDrawerOpen(false);
    router.push(`/orders/${orderId}`);
  }

  // -------------------------
  // Data loading useEffect
  // -------------------------
  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setLoadError(null);

      try {
        // 1) fetch restaurant (ensuring vendor is approved)
        const r = await getRestaurantById(id as string);
        if (!mounted) return;

        if (!r) {
          setNotFound(true);
          setRestaurant(null);
          setMenuSections([]);
          setLoading(false);
          return;
        }

        setRestaurant(r);

        // 2) fetch the already-priced menu. Margin lookup + price
        // computation now happen entirely server-side in
        // /api/restaurants/[id]/menu — this page never sees base_price
        // or the margin percentage, only the final `price`.
        const items = await getPricedMenuForRestaurant(id as string);
        if (!mounted) return;

        // 3) group by category into sections [{id, title, items}]
        const groupMap: Record<string, PricedMenuItem[]> = {};
        for (const it of items) {
          const cat = (it.category ?? 'Uncategorized') as string;
          if (!groupMap[cat]) groupMap[cat] = [];
          groupMap[cat].push(it);
        }
        const sections = Object.entries(groupMap).map(([title, items]) => ({
          id: title.toLowerCase().replace(/\s+/g, '-'),
          title,
          items,
        }));

        setMenuSections(sections);
      } catch (err: any) {
        console.error('Failed loading restaurant or menu:', err);
        setLoadError(err?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [id]);

  const [autoPlacePending, setAutoPlacePending] = useState(false);

  // Effect: once restaurant/menu has loaded, check for a pending checkout to resume
  useEffect(() => {
    if (!id || loading) return;

    (async () => {
      try {
        const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
        if (!raw) return;

        const pending = JSON.parse(raw) as {
          restaurantId: string;
          cart: CartItem[];
          fulfillmentType: 'pickup' | 'delivery';
        };

        if (pending.restaurantId !== id) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
        setCart(pending.cart);
        setFulfillmentType(pending.fulfillmentType);
        setAutoPlacePending(true);
      } catch (err) {
        console.error('Failed to resume pending checkout', err);
      }
    })();
  }, [id, loading]);

  // Effect: fire the order only after `cart` has actually re-rendered with restored items
  useEffect(() => {
    if (!autoPlacePending || cart.length === 0) return;
    setAutoPlacePending(false);
    onPlaceOrder();
  }, [autoPlacePending, cart]);

  // -------------------------
  // UI render (keeps existing structure)
  // -------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-white">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-neutral-950 rounded-2xl p-8 text-center">
            <div className="text-neutral-400">Loading restaurant…</div>
          </div>
        </main>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-white">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-neutral-950 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-semibold mb-3">Restaurant not found</h1>
            <p className="text-sm text-neutral-400 mb-6">We couldn't find this restaurant or it is not available.</p>

            <div className="flex justify-center gap-3">
              <Link href="/browse" className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary text-black text-sm font-semibold">
                Back to browse
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-white">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-neutral-950 rounded-2xl p-8 text-center">
            <div className="text-rose-400">{loadError}</div>
          </div>
        </main>
      </div>
    );
  }

  // Normal render path (restaurant is loaded and menuSections prepared)
  return (
    <>
      <Head>
        <title>{restaurant?.name ?? 'Restaurant'} — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-neutral-900 text-neutral-white">
        <NavBar />

        <main className="max-w-4xl mx-auto px-4 py-8 pb-32">
          <div className="bg-neutral-950 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold">{restaurant?.name}</h1>
                <div className="text-sm text-neutral-400 mt-1">{restaurant?.cuisine}</div>
              </div>

              <div className="text-right">
                <div className="text-sm text-neutral-400">Location</div>
                <div className="text-sm">{restaurant?.location ?? '—'}</div>
                {restaurant?.cover && <img src={restaurant.cover!} alt={restaurant.name ?? 'cover'} className="mt-3 w-40 h-24 object-cover rounded-md" />}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="bg-neutral-950 rounded-2xl p-6">
              <h2 className="text-lg font-semibold">Menu</h2>

              {menuSections.length === 0 ? (
                <div className="text-neutral-400 mt-4">No menu items yet.</div>
              ) : (
                <div className="mt-4 space-y-6">
                  {menuSections.map(section => (
                    <section key={section.id}>
                      <h3 className="text-sm font-semibold text-neutral-400 mb-3">{section.title}</h3>
                      <div className="space-y-4">
                        {section.items.map(item => (
                          // Ensure the item passed to MenuItemRow has the customer-facing price
                          // MenuItemRow expects the price on the item object (commonly item.price)
                          <MenuItemRow
                            key={item.id}
                            item={item}
                            openPanelItemId={openPanelItemId}
                            setOpenPanelItemId={setOpenPanelItemId}
                            onConfirm={(payload: any) => addOrMergeCartItem({
                              id: payload.itemId,
                              key: payload.itemId,
                              menuItemId: payload.itemId,
                              name: payload.name,
                              price: payload.unitPrice,
                              unitPrice: payload.unitPrice,
                              qty: payload.qty,
                              notes: payload.customizations?.join(', '),
                            })}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Fulfillment toggle and sticky bottom bar / CartDrawer remain exactly as in the original file */}
        <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <div className="w-full max-w-4xl px-4 pointer-events-auto">
            <div className="bg-neutral-950 rounded-2xl p-3 flex items-center justify-between">
              <FulfillmentToggle value={fulfillmentType} onChange={(v) => setFulfillmentType(v)} />
              <div className="flex items-center gap-3">
                <div className="text-sm">Total: {total}</div>
                <button onClick={() => setDrawerOpen(true)} className="px-4 py-2 rounded-full bg-primary text-black text-sm font-semibold">View Cart</button>
              </div>
            </div>
          </div>
        </div>

        <CartDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          cart={cart}
          fulfillment={fulfillmentType}
          deliveryFee={deliveryFee}
          subtotal={subtotal}
          total={total}
          onUpdateQty={updateCartQty}
          onRemoveItem={removeCartItem}
          onPlaceOrder={onPlaceOrder}
        />
      </div>
    </>
  );
}