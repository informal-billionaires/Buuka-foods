import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import VendorLayout from '../../components/vendor/VendorLayout';
import MenuItemForm from '../../components/vendor/MenuItemForm';
import MenuItemList from '../../components/vendor/MenuItemList';
import type {
  MenuItem,
  Restaurant,
  Vendor,
} from '../../components/vendor/types';

export default function MenuItemsPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadVendor() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.replace('/vendor/login');
        return;
      }

      const { data: vendorRow, error: vendorError } = await supabase
        .from<Vendor>('vendors')
        .select('*')
        .eq('id', user.id)
        .single();

      if (vendorError || !vendorRow || vendorRow.status !== 'approved') {
        router.replace('/vendor/pending');
        return;
      }

      if (mounted) {
        setVendor(vendorRow);
        setCheckingAuth(false);
      }
    }

    loadVendor();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!vendor) return;

    let mounted = true;

    async function loadMenu() {
      setLoading(true);
      setError(null);

      const { data: restaurants, error: restaurantError } = await supabase
        .from<Restaurant>('restaurants')
        .select('*')
        .eq('vendor_id', vendor.id)
        .limit(1);

      if (restaurantError) {
        if (mounted) {
          setError(restaurantError.message || 'Could not load your restaurant.');
          setLoading(false);
        }
        return;
      }

      const currentRestaurant = restaurants?.[0] ?? null;

      if (!currentRestaurant) {
        if (mounted) {
          setRestaurant(null);
          setLoading(false);
        }
        return;
      }

      const { data: items, error: menuError } = await supabase
        .from<MenuItem>('menu_items')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('id', { ascending: true });

      if (!mounted) return;

      setRestaurant(currentRestaurant);
      setMenuItems(items ?? []);
      setError(menuError?.message ?? null);
      setLoading(false);
    }

    loadMenu();

    return () => {
      mounted = false;
    };
  }, [vendor]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/vendor/login');
  }

  function handleMenuItemAdded(item: MenuItem) {
    setMenuItems((currentItems) => [...currentItems, item]);
  }

  function handleMenuItemUpdated(item: MenuItem) {
    setMenuItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id ? item : currentItem
      )
    );
  }

  function handleMenuItemDeleted(id: string) {
    setMenuItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    );
  }

  if (checkingAuth || !vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-500">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Menu Items — Bukka Foods</title>
      </Head>

      <VendorLayout
        vendorName={vendor.business_name}
        onSignOut={handleSignOut}
        restaurantId={restaurant?.id}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">Menu Items</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Add, update, and manage your restaurant menu.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-neutral-100 bg-white p-6 text-neutral-500">
              Loading menu...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-neutral-100 bg-white p-6 text-rose-600">
              {error}
            </div>
          ) : !restaurant ? (
            <div className="rounded-2xl border border-neutral-100 bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                Create your restaurant first
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                You need a restaurant before you can add menu items.
              </p>
              <Link
                href="/vendor/dashboard"
                className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black"
              >
                Go to dashboard
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-100 bg-white p-6">
              <MenuItemForm
                restaurantId={restaurant.id}
                onAdded={handleMenuItemAdded}
              />

              <div className="mt-8">
                <MenuItemList
                  items={menuItems}
                  onUpdated={handleMenuItemUpdated}
                  onDeleted={handleMenuItemDeleted}
                />
              </div>
            </div>
          )}
        </div>
      </VendorLayout>
    </>
  );
}