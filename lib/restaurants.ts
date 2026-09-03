// lib/restaurants.ts
import { supabase } from './supabaseClient';

/**
 * DB row shapes (snake_case) and app-facing shapes (camelCase).
 * Keep these in sync with the rest of the app.
 */

export type RestaurantRow = {
  id: string;
  vendor_id: string;
  name?: string | null;
  cuisine?: string | null;
  tags?: string[] | null;
  rating?: number | null;
  delivery_time?: number | null;
  distance?: number | null;
  is_open?: boolean | null;
  price_level?: string | null;
  description?: string | null;
  cover?: string | null;
  location?: string | null;
  hours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pending_name?: string | null;
  pending_location?: string | null;
  pending_latitude?: number | null;
  pending_longitude?: number | null;
  pending_submitted_at?: string | null;
};

export type Restaurant = {
  id: string;
  vendorId: string;
  name?: string | null;
  cuisine?: string | null;
  tags?: string[] | null;
  rating?: number | null;
  deliveryTime?: number | null;
  distance?: number | null;
  isOpen?: boolean | null;
  priceLevel?: string | null;
  description?: string | null;
  cover?: string | null;
  location?: string | null;
  hours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pending_name?: string | null;
  pending_location?: string | null;
  pending_latitude?: number | null;
  pending_longitude?: number | null;
  pending_submitted_at?: string | null;
};

export type MenuItemRow = {
  id: string;
  restaurant_id: string;
  category?: string | null;
  name: string;
  description?: string | null;
  base_price: number;
  image?: string | null;
  sizes?: any;
  customizations?: any;
  created_at?: string | null;
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  category?: string | null;
  name: string;
  description?: string | null;
  basePrice: number;
  image?: string | null;
  sizes?: any;
  customizations?: any;
  createdAt?: string | null;
};

// Shape returned by /api/restaurants/[id]/menu — note there is no basePrice
// here on purpose. That route runs server-side against the service-role
// client and only ever ships the final customer-facing `price`, never the
// raw base_price or the margin used to compute it.
export type PricedMenuItem = {
  id: string;
  restaurantId: string;
  category?: string | null;
  name: string;
  description?: string | null;
  image?: string | null;
  sizes?: any;
  customizations?: any;
  createdAt?: string | null;
  price: number;
};

/**
 * Existing helpers (kept as before)
 */

export async function getApprovedRestaurants(): Promise<Restaurant[]> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, vendors!inner(status)')
      .eq('vendors.status', 'approved');

    if (error) {
      console.error('getApprovedRestaurants error:', error);
      return [];
    }

    if (!data) return [];

    const mapped: Restaurant[] = data.map((r) => ({
      id: r.id,
      vendorId: r.vendor_id,
      name: r.name ?? null,
      cuisine: r.cuisine ?? null,
      tags: (r as any).tags ?? null,
      rating: r.rating ?? null,
      deliveryTime: r.delivery_time ?? null,
      distance: r.distance ?? null,
      isOpen: r.is_open ?? null,
      priceLevel: r.price_level ?? null,
      description: r.description ?? null,
      cover: r.cover ?? null,
      location: r.location ?? null,
      hours: r.hours ?? null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
    }));

    return mapped;
  } catch (err) {
    console.error('getApprovedRestaurants unexpected error:', err);
    return [];
  }
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, vendors!inner(status)')
      .eq('id', id)
      .eq('vendors.status', 'approved')
      .single();

    if (error || !data) {
      return null;
    }

    const r = data;
    const mapped: Restaurant = {
      id: r.id,
      vendorId: r.vendor_id,
      name: r.name ?? null,
      cuisine: r.cuisine ?? null,
      tags: (r as any).tags ?? null,
      rating: r.rating ?? null,
      deliveryTime: r.delivery_time ?? null,
      distance: r.distance ?? null,
      isOpen: r.is_open ?? null,
      priceLevel: r.price_level ?? null,
      description: r.description ?? null,
      cover: r.cover ?? null,
      location: r.location ?? null,
      hours: r.hours ?? null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      pending_name: r.pending_name ?? null,
      pending_location: r.pending_location ?? null,
      pending_latitude: r.pending_latitude ?? null,
      pending_longitude: r.pending_longitude ?? null,
      pending_submitted_at: r.pending_submitted_at ?? null,
    };

    return mapped;
  } catch (err) {
    console.error('getRestaurantById unexpected error:', err);
    return null;
  }
}

export async function getMenuItemsForRestaurant(restaurantId: string): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('category', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('getMenuItemsForRestaurant error:', error);
      return [];
    }

    if (!data) return [];

    const mapped: MenuItem[] = data.map((m) => ({
      id: m.id,
      restaurantId: m.restaurant_id,
      category: m.category ?? null,
      name: m.name,
      description: m.description ?? null,
      basePrice: Number(m.base_price ?? 0),
      image: m.image ?? null,
      sizes: (m as any).sizes ?? null,
      customizations: (m as any).customizations ?? null,
      createdAt: m.created_at ?? null,
    }));

    return mapped;
  } catch (err) {
    console.error('getMenuItemsForRestaurant unexpected error:', err);
    return [];
  }
}

/**
 * getMarginForVendor has been REMOVED. It used to fetch the raw `margins`
 * row client-side, which either 406'd for anonymous customers (falling back
 * silently to the wrong 15% default) or, if RLS were opened up, would expose
 * the exact margin percentage in the Network tab. Pricing now happens
 * server-side — see getPricedMenuForRestaurant() and getFeaturedMenuItems()
 * below, both of which call API routes backed by lib/server/pricing.ts.
 */

/**
 * getPricedMenuForRestaurant
 *
 * Replaces the old getMenuItemsForRestaurant + getMarginForVendor +
 * computeCustomerPrice combo. Calls /api/restaurants/[id]/menu, which does
 * the margin lookup and price computation server-side with the service-role
 * client. The browser only ever receives the final `price` — never
 * base_price or the margin.
 */
export async function getPricedMenuForRestaurant(restaurantId: string): Promise<PricedMenuItem[]> {
  try {
    const res = await fetch(`/api/restaurants/${restaurantId}/menu`);
    if (!res.ok) {
      console.error('getPricedMenuForRestaurant error:', res.status, await res.text().catch(() => ''));
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error('getPricedMenuForRestaurant unexpected error:', err);
    return [];
  }
}

/**
 * getFeaturedMenuItems
 *
 * Now a thin client for /api/featured-items — same return shape as before
 * (id, name, image, customerPrice, restaurantId, restaurantName), so
 * FeaturedRow.tsx needs no changes. base_price and margin never leave the
 * server.
 */
export async function getFeaturedMenuItems(limit = 6): Promise<Array<{
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  customerPrice: number;
  restaurantId: string;
  restaurantName: string;
}>> {
  try {
    const res = await fetch(`/api/featured-items?limit=${limit}`);
    if (!res.ok) {
      console.error('getFeaturedMenuItems error:', res.status, await res.text().catch(() => ''));
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error('getFeaturedMenuItems unexpected error:', err);
    return [];
  }
}

