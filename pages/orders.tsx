import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import OrderCard from '../components/OrderCard';
import { getOrders, getRatingsForOrders, rateOrder, Order } from '../lib/orders';
import { getLoyaltyStatus } from '../lib/loyalty';
import {
  getFavorites,
  getFavoriteRestaurants,
  addFavorite,
  removeFavorite,
  FavoriteRestaurant,
} from '../lib/favorites';
import { supabase } from '../lib/supabaseClient';
import { Star, Calendar, Store, ListFilter, ChevronDown } from 'lucide-react';
import { getRestaurantById, Restaurant } from '../lib/restaurants';

type TabKey = 'all' | 'active' | 'delivered' | 'cancelled';
type DateFilter = 'all' | '7' | '30';
type PriceFilter = 'all' | 'under2000' | '2000to5000' | 'over5000';

const ACTIVE_STATUSES: Order['status'][] = ['placed', 'preparing', 'in_transit'];
const CANCELLED_STATUSES: Order['status'][] = ['cancelled', 'declined'];

const STEP_ORDER: Order['status'][] = ['placed', 'preparing', 'in_transit', 'delivered'];

const STEP_CONFIG: { status: Order['status']; label: string; icon: (color: string) => JSX.Element }[] = [
  {
    status: 'placed',
    label: 'Placed',
    icon: (color) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M3 9l1-5h16l1 5M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9M4 9h16" />
      </svg>
    ),
  },
  {
    status: 'preparing',
    label: 'Preparing',
    icon: (color) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M6 13a6 6 0 0112 0v6H6v-6zM4 19h16" />
      </svg>
    ),
  },
  {
    status: 'in_transit',
    label: 'On the way',
    icon: (color) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="17" cy="18" r="2.5" />
        <path d="M6 18h6l3-6h4M12 18l2-4" />
      </svg>
    ),
  },
  {
    status: 'delivered',
    label: 'Delivered',
    icon: (color) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M3 10l9-7 9 7M5 10v10h14V10" />
      </svg>
    ),
  },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<TabKey>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState<Set<string>>(new Set());
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [recentOrderRestaurant, setRecentOrderRestaurant] = useState<Restaurant | null>(null);

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
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(loaded);

      const [ratingsMap, favorites, favRestaurants] = await Promise.all([
        getRatingsForOrders(loaded.map(o => o.id)),
        getFavorites(),
        getFavoriteRestaurants(),
      ]);
      if (!mounted) return;
      setRatings(ratingsMap);
      setFavoriteRestaurantIds(new Set(favorites.map(f => f.restaurantId)));
      setFavoriteRestaurants(favRestaurants);

      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  

  const loyalty = useMemo(() => getLoyaltyStatus(orders), [orders]);

  const vendorNames = useMemo(() => {
    const names = new Set(orders.map(o => o.restaurantName));
    return Array.from(names).sort();
  }, [orders]);

  const usualOrders = useMemo(() => {
    const counts: Record<string, { name: string; restaurantName: string; price: number; count: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        if (!counts[item.name]) {
          counts[item.name] = { name: item.name, restaurantName: order.restaurantName, price: item.unitPrice, count: 0 };
        }
        counts[item.name].count += 1;
      }
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [orders]);

  const recentOrder = useMemo(() => {
    if (orders.length === 0) return null;
    const candidate = orders[0]; // already sorted newest-first
    const isActive = ACTIVE_STATUSES.includes(candidate.status);
    const isCancelled = CANCELLED_STATUSES.includes(candidate.status);
    return isActive || isCancelled ? candidate : null;
  }, [orders]);

  useEffect(() => {
    if (!recentOrder) {
      setRecentOrderRestaurant(null);
      return;
    }
    let mounted = true;
    (async () => {
      const r = await getRestaurantById(recentOrder.restaurantId);
      if (mounted) setRecentOrderRestaurant(r);
    })();
    return () => { mounted = false; };
  }, [recentOrder]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();

    return orders.filter(o => {
      if (tab === 'active' && !ACTIVE_STATUSES.includes(o.status)) return false;
      if (tab === 'delivered' && o.status !== 'delivered') return false;
      if (tab === 'cancelled' && !CANCELLED_STATUSES.includes(o.status)) return false;

      if (dateFilter !== 'all') {
        const days = dateFilter === '7' ? 7 : 30;
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        if (new Date(o.createdAt).getTime() < cutoff) return false;
      }

      if (vendorFilter !== 'all' && o.restaurantName !== vendorFilter) return false;

      if (priceFilter !== 'all') {
        if (priceFilter === 'under2000' && !(o.total < 2000)) return false;
        if (priceFilter === '2000to5000' && !(o.total >= 2000 && o.total <= 5000)) return false;
        if (priceFilter === 'over5000' && !(o.total > 5000)) return false;
      }

      if (q) {
        const matchesId = o.id.toLowerCase().includes(q);
        const matchesRestaurant = o.restaurantName.toLowerCase().includes(q);
        const matchesItem = o.items.some(it => it.name.toLowerCase().includes(q));
        if (!matchesId && !matchesRestaurant && !matchesItem) return false;
      }

      return true;
    });
  }, [orders, tab, dateFilter, vendorFilter, priceFilter, query]);

  function clearFilters() {
    setTab('all');
    setDateFilter('all');
    setVendorFilter('all');
    setPriceFilter('all');
    setQuery('');
  }

  const hasActiveFilters =
    tab !== 'all' || dateFilter !== 'all' || vendorFilter !== 'all' || priceFilter !== 'all' || query !== '';

  async function handleRate(orderId: string, rating: number) {
    const prev = ratings[orderId];
    setRatings(r => ({ ...r, [orderId]: rating }));
    const ok = await rateOrder(orderId, rating);
    if (!ok) {
      setRatings(r => ({ ...r, [orderId]: prev }));
      alert('Something went wrong saving your rating. Please try again.');
    }
  }

  async function handleToggleFavorite(restaurantId: string) {
    const isFav = favoriteRestaurantIds.has(restaurantId);
    setFavoriteRestaurantIds(prev => {
      const next = new Set(prev);
      isFav ? next.delete(restaurantId) : next.add(restaurantId);
      return next;
    });
    const ok = isFav ? await removeFavorite(restaurantId) : await addFavorite(restaurantId);
    if (!ok) {
      setFavoriteRestaurantIds(prev => {
        const next = new Set(prev);
        isFav ? next.add(restaurantId) : next.delete(restaurantId);
        return next;
      });
      return;
    }
    if (isFav) {
      setFavoriteRestaurants(prev => prev.filter(r => r.id !== restaurantId));
    } else {
      const refreshed = await getFavoriteRestaurants();
      setFavoriteRestaurants(refreshed);
    }
  }

  async function handleRemoveFavoriteFromRow(restaurantId: string) {
    setFavoriteRestaurants(prev => prev.filter(r => r.id !== restaurantId));
    setFavoriteRestaurantIds(prev => {
      const next = new Set(prev);
      next.delete(restaurantId);
      return next;
    });
    const ok = await removeFavorite(restaurantId);
    if (!ok) {
      const refreshed = await getFavoriteRestaurants();
      setFavoriteRestaurants(refreshed);
      setFavoriteRestaurantIds(new Set(refreshed.map(r => r.id)));
    }
  }

  return (
    <>
      <Head>
        <title>Your Orders — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-page text-neutral-900">
        <NavBar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900">Orders</h1>
              <p className="text-sm text-muted mt-1">Your recent orders are listed below.</p>
            </div>

            <div className="w-full sm:max-w-sm">
              <label className="block text-xs text-muted mb-1">Search orders</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by order id, restaurant or item"
                className="w-full px-3 py-2 rounded-full bg-surface border border-neutral-200 text-sm text-neutral-900 placeholder-muted"
                aria-label="Search orders"
              />
            </div>
          </div>

          {!loading && recentOrder && (
            <div className="bg-surface border border-neutral-200 rounded-2xl p-5 mb-6 shadow-sm">
              {CANCELLED_STATUSES.includes(recentOrder.status) ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold">Recent Order</h2>
                    <span className="px-2 py-0.5 rounded-full bg-status-error/10 text-status-error text-xs font-semibold">
                      {recentOrder.status === 'cancelled' ? 'Cancelled' : 'Declined'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-status-error/10 flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC3545" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M9 9l6 6M15 9l-6 6" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{recentOrder.restaurantName}</div>
                      <div className="text-xs text-muted mt-0.5">
                        {recentOrder.status === 'cancelled'
                          ? "This order was cancelled. You haven't been charged."
                          : "This order was declined by the restaurant. You haven't been charged."}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold">Active Order</h2>
                    <span className="px-2 py-0.5 rounded-full bg-status-success/10 text-status-success text-xs font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block" />
                      Live
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-muted">
                        Order #{recentOrder.id.slice(0, 8)} · <span className="text-primary font-medium">{STEP_CONFIG[STEP_ORDER.indexOf(recentOrder.status)]?.label}</span>
                      </div>
                      <div className="text-base font-semibold mt-1">{recentOrder.restaurantName}</div>
                      <div className="text-xs text-muted mt-0.5">
                        {recentOrder.items.length} item{recentOrder.items.length !== 1 ? 's' : ''} · {recentOrder.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}
                      </div>
                      {recentOrderRestaurant && (
                        <div className="flex items-center gap-3 text-xs text-muted mt-1">
                          {recentOrderRestaurant.distance != null && <span>📍 {recentOrderRestaurant.distance} km away</span>}
                          {recentOrderRestaurant.rating != null && <span>★ {recentOrderRestaurant.rating}</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 sm:gap-3">
                      {STEP_CONFIG.map((step, i) => {
                        const currentIndex = STEP_ORDER.indexOf(recentOrder.status);
                        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
                        const bg = state === 'done' ? 'bg-status-success' : state === 'current' ? 'bg-primary' : 'bg-neutral-lightGray';
                        const iconColor = state === 'upcoming' ? '#737373' : '#FFFFFF';
                        const lineColor = i < currentIndex ? 'bg-status-success' : 'bg-neutral-lightGray';

                        return (
                          <React.Fragment key={step.status}>
                            {i > 0 && <div className={`h-0.5 w-4 sm:w-8 ${lineColor}`} />}
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${bg}`}>
                                {step.icon(iconColor)}
                              </div>
                              <span className="text-[10px] text-muted whitespace-nowrap hidden sm:block">{step.label}</span>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/tracking-coming-soon"
                        className="px-4 py-2 rounded-full bg-page border border-neutral-200 text-sm text-neutral-900 whitespace-nowrap"
                      >
                        Track order
                      </Link>
                      <Link
                        href={`/orders/${recentOrder.id}`}
                        className="px-4 py-2 rounded-full bg-page border border-neutral-200 text-sm text-neutral-900 whitespace-nowrap"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-5">
              {(['all', 'active', 'delivered', 'cancelled'] as TabKey[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-sm pb-1 border-b-2 transition-colors ${
                    tab === t
                      ? 'border-primary text-neutral-900 font-semibold'
                      : 'border-transparent text-muted font-medium'
                  }`}
                >
                  {t === 'all' ? 'All Orders' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-neutral-200 bg-surface text-sm text-neutral-900">
                <Calendar size={14} className="text-muted" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="bg-transparent appearance-none outline-none pr-1"
                >
                  <option value="all">Date</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                </select>
                <ChevronDown size={12} className="text-muted" />
              </div>

              <div className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-neutral-200 bg-surface text-sm text-neutral-900">
                <Store size={14} className="text-muted" />
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="bg-transparent appearance-none outline-none pr-1"
                >
                  <option value="all">Vendor</option>
                  {vendorNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="text-muted" />
              </div>

              <div className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-neutral-200 bg-surface text-sm text-neutral-900">
                <ListFilter size={14} className="text-muted" />
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                  className="bg-transparent appearance-none outline-none pr-1"
                >
                  <option value="all">Price</option>
                  <option value="under2000">Under ₦2,000</option>
                  <option value="2000to5000">₦2,000 – ₦5,000</option>
                  <option value="over5000">Over ₦5,000</option>
                </select>
                <ChevronDown size={12} className="text-muted" />
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-sm text-primary font-medium ml-1">
                  Clear filters
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="bg-surface border border-neutral-200 rounded-2xl p-8 text-center">
                <div className="text-muted">Loading orders…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-surface border border-neutral-200 rounded-2xl p-8 text-center">
                <div className="text-muted">No orders found.</div>
              </div>
            ) : (
              filtered.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  rating={ratings[order.id]}
                  onRate={(r) => handleRate(order.id, r)}
                  isFavorite={favoriteRestaurantIds.has(order.restaurantId)}
                  onToggleFavorite={() => handleToggleFavorite(order.restaurantId)}
                  onReorder={() => router.push(`/restaurants/${order.restaurantId}`)}
                />
              ))
            )}
          </div>

          {(loyalty || favoriteRestaurants.length > 0) && !loading && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {loyalty && (
                <div className="lg:col-span-2 bg-neutral-cream border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">
                      You ordered from <span className="font-semibold">{loyalty.restaurantName}</span> {loyalty.count} times this month!
                    </div>
                    <div className="text-xs text-muted mt-1">Discount codes are coming soon.</div>
                  </div>
                  <button
                    onClick={() => alert('Discount codes are coming soon!')}
                    className="px-4 py-2 rounded-full bg-primary text-neutral-white text-sm font-semibold whitespace-nowrap"
                  >
                    Claim offer
                  </button>
                </div>
              )}

              {favoriteRestaurants.length > 0 && (
                <div className={loyalty ? '' : 'lg:col-span-3'}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-neutral-900">Your favorite vendors</h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {favoriteRestaurants.map(r => (
                      <div
                        key={r.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/restaurants/${r.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') router.push(`/restaurants/${r.id}`);
                        }}
                        className="flex-shrink-0 w-32 bg-surface border border-neutral-200 rounded-2xl p-4 text-center relative cursor-pointer shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFavoriteFromRow(r.id);
                          }}
                          aria-label={`Remove ${r.name} from favorites`}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-surface border border-neutral-200 text-status-error text-xs z-10"
                        >
                          ♥
                        </button>

                        <div className="w-12 h-12 rounded-full bg-primary text-neutral-white flex items-center justify-center text-sm font-bold mx-auto mb-2">
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="text-xs font-medium truncate">{r.name}</div>
                        {r.rating != null && (
                          <div className="flex items-center justify-center gap-1 text-xs text-muted mt-1">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            {r.rating}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}


          {!loading && usualOrders.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold mb-1 text-neutral-900">Order again quickly</h2>
              <p className="text-sm text-muted mb-4">Your usual orders</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {usualOrders.map(item => (
                  <div key={item.name} className="bg-surface border border-neutral-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted truncate">{item.restaurantName}</div>
                    <div className="text-xs text-muted mt-1">
                      Ordered {item.count} time{item.count !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm font-semibold mt-2">₦{item.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}