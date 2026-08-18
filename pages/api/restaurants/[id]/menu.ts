// pages/api/restaurants/[id]/menu.ts
//
// Returns this restaurant's menu with the customer-facing price already
// computed. base_price and margin are intentionally never included in
// the response — the browser only ever sees the final `price`.

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getMarginForVendorServer, priceItem } from '../../../../lib/server/pricing';

export type PricedMenuItemResponse = {
  id: string;
  restaurantId: string;
  category: string | null;
  name: string;
  description: string | null;
  image: string | null;
  sizes: any;
  customizations: any;
  createdAt: string | null;
  price: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid restaurant id' });
  }

  try {
    // Look up the restaurant + its vendor's approval status ourselves —
    // supabaseAdmin bypasses RLS, so this check has to happen here in code,
    // same condition the public RLS policy uses on the client-side path.
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select('id, vendor_id, vendors!inner(status)')
      .eq('id', id)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const vendorStatus = (restaurant as any).vendors?.status;
    if (vendorStatus !== 'approved') {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('menu_items')
      .select('id, restaurant_id, category, name, description, base_price, image, sizes, customizations, created_at')
      .eq('restaurant_id', id)
      .order('category', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (itemsError) {
      console.error('[api/restaurants/[id]/menu] menu_items error:', itemsError);
      return res.status(500).json({ error: 'Failed to load menu' });
    }

    const margin = await getMarginForVendorServer((restaurant as any).vendor_id);

    const priced: PricedMenuItemResponse[] = (items ?? []).map((row: any) => ({
      id: row.id,
      restaurantId: row.restaurant_id,
      category: row.category ?? null,
      name: row.name,
      description: row.description ?? null,
      image: row.image ?? null,
      sizes: row.sizes ?? null,
      customizations: row.customizations ?? null,
      createdAt: row.created_at ?? null,
      price: priceItem(Number(row.base_price ?? 0), margin),
      // base_price and margin deliberately omitted
    }));

    return res.status(200).json(priced);
  } catch (err) {
    console.error('[api/restaurants/[id]/menu] unexpected error:', err);
    return res.status(500).json({ error: 'Failed to load menu' });
  }
}