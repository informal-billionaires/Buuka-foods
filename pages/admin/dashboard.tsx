import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import type { AdminRow, Vendor as VendorType, Margin } from '../../components/admin/types';
import VendorAdminCard from '../../components/admin/VendorAdminCard';
import { getAdminStats, AdminStats, getOrdersByStatus, StatusCount, getOrdersLast7Days, DayCount } from '../../lib/adminStats';
import OrdersByStatusDonut from '../../components/admin/OrdersByStatusDonut';
import OrdersOverviewChart from '../../components/admin/OrdersOverviewChart';
import AdminLayout from '../../components/admin/AdminLayout';

interface RestaurantInfo {
  id: string;
  vendor_id: string;
  name: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  pending_name: string | null;
  pending_location: string | null;
  pending_latitude: number | null;
  pending_longitude: number | null;
  pending_submitted_at: string | null;
  escalation_threshold_minutes: number | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminRow | null>(null);

  const [vendors, setVendors] = useState<VendorType[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);

  // margins keyed by vendor_id
  const [margins, setMargins] = useState<Record<string, Margin | null>>({});

  // restaurants keyed by vendor_id: expanded info including pending_* fields
  const [restaurants, setRestaurants] = useState<Record<string, RestaurantInfo | null>>({});

  interface OverdueOrder {
    id: string;
    restaurant_id: string;
    restaurant_name: string | null;
    accepted_at: string;
    minutes_overdue: number;
  }
  const [overdueOrders, setOverdueOrders] = useState<OverdueOrder[]>([]);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [dailyCounts, setDailyCounts] = useState<DayCount[]>([]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setCheckingAuth(true);
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setAuthError(sessionError.message || 'Auth check failed');
          router.replace('/admin/login');
          return;
        }

        const session = sessionData?.session ?? null;
        if (!session || !session.user) {
          router.replace('/admin/login');
          return;
        }

        const userId = session.user.id;

        // check admins table for this user
        const { data: adminRow, error: adminError } = await supabase
          .from<AdminRow>('admins')
          .select('*')
          .eq('id', userId)
          .single();

        if (adminError || !adminRow) {
          // not an admin — sign out and show an error by redirecting to login (per spec sign out)
          await supabase.auth.signOut();
          router.replace('/admin/login');
          return;
        }

        if (!mounted) return;

        setAdmin(adminRow);

        // fetch vendors (admin-wide)
        setVendorsLoading(true);
        const { data: vendorRows, error: vendorErr } = await supabase
          .from<VendorType>('vendors')
          .select('*')
          .order('created_at', { ascending: false });

        if (vendorErr) {
          setVendorsError(vendorErr.message || 'Failed to load vendors');
        } else {
          setVendors(vendorRows ?? []);

          // fetch margins for these vendors in one go
          const vendorIds = (vendorRows || []).map(v => v.id);
          if (vendorIds.length > 0) {
            const { data: marginRows, error: marginErr } = await supabase
              .from<Margin>('margins')
              .select('*')
              .in('vendor_id', vendorIds);

            if (!marginErr && marginRows) {
              const map: Record<string, Margin> = {};
              marginRows.forEach(m => {
                if (m.vendor_id) map[m.vendor_id] = m;
              });
              setMargins(map);
            } else {
              // keep margins empty if failed, admins can still edit per-vendor later
              setMargins({});
            }

            // --- UPDATED: fetch restaurants with expanded fields (including pending_*) ---
            const { data: restaurantRows, error: restaurantErr } = await supabase
              .from('restaurants')
              .select(
                'id, vendor_id, name, location, latitude, longitude, pending_name, pending_location, pending_latitude, pending_longitude, pending_submitted_at, escalation_threshold_minutes'
              )
              .in('vendor_id', vendorIds);

            if (!restaurantErr && restaurantRows) {
              const rmap: Record<string, RestaurantInfo> = {};
              restaurantRows.forEach((r: any) => {
                if (r.vendor_id) {
                  rmap[r.vendor_id] = {
                    id: r.id,
                    vendor_id: r.vendor_id,
                    name: r.name ?? null,
                    location: r.location ?? null,
                    latitude: typeof r.latitude === 'number' ? r.latitude : (r.latitude == null ? null : Number(r.latitude)),
                    longitude: typeof r.longitude === 'number' ? r.longitude : (r.longitude == null ? null : Number(r.longitude)),
                    pending_name: r.pending_name ?? null,
                    pending_location: r.pending_location ?? null,
                    pending_latitude:
                      typeof r.pending_latitude === 'number'
                        ? r.pending_latitude
                        : (r.pending_latitude == null ? null : Number(r.pending_latitude)),
                    pending_longitude:
                      typeof r.pending_longitude === 'number'
                        ? r.pending_longitude
                        : (r.pending_longitude == null ? null : Number(r.pending_longitude)),
                    pending_submitted_at: r.pending_submitted_at ?? null,
                    escalation_threshold_minutes:
                      typeof r.escalation_threshold_minutes === 'number'
                        ? r.escalation_threshold_minutes
                        : (r.escalation_threshold_minutes == null ? null : Number(r.escalation_threshold_minutes)),
                  };
                }
              });
              setRestaurants(rmap);
            } else {
              // if fetch failed, leave restaurants map empty so UI still works
              setRestaurants({});
            }
          } else {
            setMargins({});
            setRestaurants({});
          }
        }
        setVendorsLoading(false);
      } catch (err: any) {
        setAuthError(err?.message || 'Unexpected auth error');
        router.replace('/admin/login');
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, [router]);

  useEffect(() => {
    async function checkOverdueOrders() {
      const { data: preparingOrders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, restaurant_id, accepted_at, restaurants(name, escalation_threshold_minutes)')
        .eq('status', 'preparing');

      if (ordersErr || !preparingOrders) {
        setOverdueOrders([]);
        return;
      }

      const now = Date.now();
      const overdue: OverdueOrder[] = [];

      (preparingOrders as any[]).forEach((o) => {
        if (!o.accepted_at) return;
        const thresholdMinutes = o.restaurants?.escalation_threshold_minutes ?? 30;
        const acceptedAtMs = new Date(o.accepted_at).getTime();
        const minutesElapsed = (now - acceptedAtMs) / 60000;

        if (minutesElapsed > thresholdMinutes) {
          overdue.push({
            id: o.id,
            restaurant_id: o.restaurant_id,
            restaurant_name: o.restaurants?.name ?? null,
            accepted_at: o.accepted_at,
            minutes_overdue: Math.floor(minutesElapsed - thresholdMinutes),
          });
        }
      });

      setOverdueOrders(overdue);
    }

    checkOverdueOrders();
    const interval = setInterval(checkOverdueOrders, 60000); // re-check every minute
    return () => clearInterval(interval);
  }, [admin]);

  useEffect(() => {
    if (!admin) return;
    getAdminStats().then(setStats).catch(() => setStats(null));
    getOrdersByStatus().then(setStatusCounts).catch(() => setStatusCounts([]));
    getOrdersLast7Days().then(setDailyCounts).catch(() => setDailyCounts([]));
  }, [admin]);

  // handlers to update local state after actions in VendorAdminCard
  function handleStatusChange(vendorId: string, status: VendorType['status']) {
    setVendors(prev => prev.map(v => (v.id === vendorId ? { ...v, status } : v)));
  }

  function handleMarginSaved(vendorId: string, percentage: number, marginRow: Margin) {
    setMargins(prev => ({ ...prev, [vendorId]: marginRow }));
  }

  function handleThresholdSaved(vendorId: string, thresholdMinutes: number) {
    setRestaurants(prev => {
      const existing = prev[vendorId];
      if (!existing) return prev;
      return {
        ...prev,
        [vendorId]: { ...existing, escalation_threshold_minutes: thresholdMinutes },
      };
    });
  }

  async function handleCancelOverdueOrder(orderId: string) {
    setCancellingOrderId(orderId);
    try {
      const { error: cancelErr } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (!cancelErr) {
        setOverdueOrders(prev => prev.filter(o => o.id !== orderId));
      }
    } finally {
      setCancellingOrderId(null);
    }
  }

  // handler to update restaurant coords/info in local map if updated elsewhere
  function handleRestaurantUpdated(vendorId: string, info: RestaurantInfo) {
    setRestaurants(prev => ({ ...prev, [vendorId]: info }));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
        <div className="text-neutral-500">Loading…</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
        <div className="text-rose-600">{authError}</div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
        <div className="text-neutral-500">Redirecting…</div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin Dashboard — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-neutral-50 text-neutral-900 py-8">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900">Admin dashboard</h1>
              <p className="text-sm text-neutral-500 mt-1">Manage vendors and margins.</p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/" className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 text-sm">Back to homepage</Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-full bg-primary text-black text-sm font-semibold"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Total Orders</div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">
                {stats ? stats.totalOrders.toLocaleString() : '—'}
              </div>
            </div>
            <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Active Vendors</div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">
                {stats ? stats.activeVendors.toLocaleString() : '—'}
              </div>
            </div>
            <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Total Customers</div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">
                {stats ? stats.totalCustomers.toLocaleString() : '—'}
              </div>
            </div>
            <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Total Revenue</div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">
                {stats ? `₦${stats.totalRevenue.toLocaleString()}` : '—'}
              </div>
            </div>
            <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 shadow-sm opacity-60">
              <div className="text-sm text-neutral-500">Active Riders</div>
              <div className="text-lg font-semibold text-neutral-400 mt-1">Coming soon</div>
            </div>
          </div>

          {(statusCounts.length > 0 || dailyCounts.length > 0) && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <OrdersOverviewChart data={dailyCounts} />
              <OrdersByStatusDonut data={statusCounts} />
            </div>
          )}

          {overdueOrders.length > 0 && (
            <div className="mt-6 bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <div className="text-sm font-semibold text-rose-700 mb-3">
                ⚠ {overdueOrders.length} order{overdueOrders.length > 1 ? 's' : ''} overdue
              </div>
              <div className="space-y-2">
                {overdueOrders.map(o => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between bg-white border border-rose-100 rounded-xl px-4 py-2"
                  >
                    <div className="text-sm text-neutral-700">
                      <span className="font-medium text-neutral-900">{o.restaurant_name ?? 'Unknown restaurant'}</span>
                      {' — '}order {o.id.slice(0, 8)} — {o.minutes_overdue} min overdue
                    </div>
                    <button
                      onClick={() => handleCancelOverdueOrder(o.id)}
                      disabled={cancellingOrderId === o.id}
                      className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {cancellingOrderId === o.id ? 'Cancelling…' : 'Cancel Order'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {vendorsLoading ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm text-neutral-500">Loading vendors…</div>
            ) : vendorsError ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm text-rose-600">Error: {vendorsError}</div>
            ) : vendors.length === 0 ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm text-neutral-500">No vendors found.</div>
            ) : (
              vendors.map(v => (
                <VendorAdminCard
                  key={v.id}
                  vendor={v}
                  adminId={admin.id}
                  margin={margins[v.id] ?? null}
                  restaurant={restaurants[v.id] ?? null}
                  onStatusChange={handleStatusChange}
                  onMarginSaved={handleMarginSaved}
                  onThresholdSaved={handleThresholdSaved}
                />
              ))
            )}
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}