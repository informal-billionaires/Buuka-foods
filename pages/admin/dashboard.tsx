import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import type { AdminRow, Vendor as VendorType, Margin } from '../../components/admin/types';
import VendorAdminCard from '../../components/admin/VendorAdminCard';

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
                'id, vendor_id, name, location, latitude, longitude, pending_name, pending_location, pending_latitude, pending_longitude, pending_submitted_at'
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

  // handlers to update local state after actions in VendorAdminCard
  function handleStatusChange(vendorId: string, status: VendorType['status']) {
    setVendors(prev => prev.map(v => (v.id === vendorId ? { ...v, status } : v)));
  }

  function handleMarginSaved(vendorId: string, percentage: number, marginRow: Margin) {
    setMargins(prev => ({ ...prev, [vendorId]: marginRow }));
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
      <div className="min-h-screen bg-neutral-900 text-neutral-white flex items-center justify-center">
        <div className="text-neutral-400">Loading…</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-white flex items-center justify-center">
        <div className="text-rose-400">{authError}</div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-white flex items-center justify-center">
        <div className="text-neutral-400">Redirecting…</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-neutral-900 text-neutral-white py-8">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-neutral-950 rounded-2xl p-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">Admin dashboard</h1>
              <p className="text-sm text-neutral-400 mt-1">Manage vendors and margins.</p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/" className="px-4 py-2 rounded-full bg-neutral-white/5 text-sm">Back to homepage</Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-full bg-primary text-black text-sm font-semibold"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {vendorsLoading ? (
              <div className="bg-neutral-950 rounded-2xl p-6 text-neutral-400">Loading vendors…</div>
            ) : vendorsError ? (
              <div className="bg-neutral-950 rounded-2xl p-6 text-rose-400">Error: {vendorsError}</div>
            ) : vendors.length === 0 ? (
              <div className="bg-neutral-950 rounded-2xl p-6 text-neutral-400">No vendors found.</div>
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
                />
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
}