import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import RestaurantForm from '../../components/vendor/RestaurantForm';
import RestaurantSummary from '../../components/vendor/RestaurantSummary';
import type { Vendor, Restaurant } from '../../components/vendor/types';
import NotificationBell from '../../components/vendor/NotificationBell';
import VendorLayout from '../../components/vendor/VendorLayout';
import StatsSidebar from '../../components/vendor/StatsOverview';
import RestaurantStatusCard from '../../components/vendor/RestaurantStatusCard';
import TopSellingItems from '../../components/vendor/TopSellingItems';
import SalesOverview from '../../components/vendor/SalesOverview';
import OrdersOverview from '../../components/vendor/OrdersOverview';


export default function VendorDashboardPage() {
  const router = useRouter();

  // auth / vendor
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // restaurant
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restLoading, setRestLoading] = useState(false);
  const [restError, setRestError] = useState<string | null>(null);
  const [restaurantEditing, setRestaurantEditing] = useState(false);



  // ACCESS CONTROL + initial vendor lookup
  useEffect(() => {
    let mounted = true;
    async function init() {
      setCheckingAuth(true);
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setAuthError(sessionError.message || 'Auth check failed');
          router.replace('/vendor/login');
          return;
        }

        const session = sessionData?.session ?? null;
        if (!session || !session.user) {
          router.replace('/vendor/login');
          return;
        }

        const userId = session.user.id;
        const { data: vendorRow, error: vendorError } = await supabase
          .from<Vendor>('vendors')
          .select('*')
          .eq('id', userId)
          .single();

        if (vendorError || !vendorRow) {
          router.replace('/vendor/pending');
          return;
        }

        if (!mounted) return;

        if (vendorRow.status !== 'approved') {
          router.replace('/vendor/pending');
          return;
        }

        setVendor(vendorRow);
      } catch (err: any) {
        setAuthError(err?.message || 'Unexpected auth error');
        router.replace('/vendor/login');
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, [router]);

  // once vendor known/approved, fetch restaurant (first) and menu items
  useEffect(() => {
    if (!vendor) return;
    let mounted = true;

    async function fetchRestaurant() {
      setRestLoading(true);
      setRestError(null);
      try {
        const { data: restaurants, error: rErr } = await supabase
          .from<Restaurant>('restaurants')
          .select('*')
          .eq('vendor_id', vendor.id)
          .limit(1);

        if (rErr) {
          setRestError(rErr.message || 'Failed to load restaurant');
          return;
        }

        if (!mounted) return;
        const first = (restaurants && restaurants.length > 0) ? restaurants[0] : null;
        setRestaurant(first ?? null);
      } catch (err: any) {
        setRestError(err?.message || 'Unexpected error loading restaurant');
      } finally {
        if (mounted) setRestLoading(false);
      }
    }

    fetchRestaurant();
    return () => { mounted = false; };
  }, [vendor]);

  // Callbacks to update local state when components create/update/delete records
  function handleRestaurantCreated(newRest: Restaurant) {
    setRestaurant(newRest);
  }

  function handleRestaurantUpdated(updated: Restaurant) {
    setRestaurant(updated);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/vendor/login');
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

  if (!vendor) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
        <div className="text-neutral-500">Redirecting…</div>
      </div>
    );
  }

  return (
  // ...your existing main JSX
    <>
      <Head>
        <title>Vendor Dashboard — Bukka Foods</title>
      </Head>

      <VendorLayout vendorName={vendor.business_name} onSignOut={handleSignOut} restaurantId={restaurant?.id}>
        <div className="mt-6">
          {restLoading ? (
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 text-neutral-500">Loading restaurant…</div>
          ) : restError ? (
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 text-rose-600">Error: {restError}</div>
          ) : restaurant ? (
            <>
              <RestaurantSummary
                restaurant={restaurant}
                onUpdated={handleRestaurantUpdated}
                vendorName={vendor.business_name}
                editing={restaurantEditing}
                onEditingChange={setRestaurantEditing}
              />

              <StatsSidebar restaurantId={restaurant.id} />

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <OrdersOverview restaurantId={restaurant.id} />
                  <SalesOverview restaurantId={restaurant.id} />
                </div>
                <div className="space-y-6">
                  <RestaurantStatusCard restaurant={restaurant} onEditClick={() => setRestaurantEditing(true)} />
                  <TopSellingItems restaurantId={restaurant.id} />
                  <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-2">Payouts</h2>
                    <p className="text-sm text-neutral-400">Coming soon.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <RestaurantForm vendorId={vendor!.id} onCreated={handleRestaurantCreated} />
          )}
        </div>
      </VendorLayout>
    </>
  );
}
