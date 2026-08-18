// pages/api/featured-items.ts
//
// Same contract FeaturedRow.tsx already expects: id, name, image,
// customerPrice, restaurantId, restaurantName. base_price and margin
// are never included — FeaturedRow itself needs zero changes.

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { getMarginsForVendorsServer, priceItem } from '../../lib/server/pricing';

const DEFAULT_LIMIT = 6;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = Number(req.query.limit) || DEFAULT_LIMIT;

  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .select('*, restaurants!inner(id, name, vendor_id, vendors!inner(status))')
      .eq('restaurants.vendors.status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[api/featured-items] error:', error);
      return res.status(500).json({ error: 'Failed to load featured items' });
    }

    if (!data || data.length === 0) {
      return res.status(200).json([]);
    }

    const vendorIds = data.map((row: any) => row.restaurants?.vendor_id).filter(Boolean);
    const marginMap = await getMarginsForVendorsServer(vendorIds);

    const items = data.map((row: any) => {
      const r = row.restaurants;
      const basePrice = Number(row.base_price ?? 0);
      const vendorId = r?.vendor_id;

      return {
        id: row.id,
        restaurantId: r?.id ?? '',
        restaurantName: r?.name ?? '',
        category: row.category ?? null,
        name: row.name,
        description: row.description ?? null,
        image: row.image ?? null,
        sizes: row.sizes ?? null,
        customizations: row.customizations ?? null,
        createdAt: row.created_at ?? null,
        customerPrice: priceItem(basePrice, vendorId ? marginMap[vendorId] : undefined),
        // base_price and margin deliberately omitted
      };
    });

    return res.status(200).json(items);
  } catch (err) {
    console.error('[api/featured-items] unexpected error:', err);
    return res.status(500).json({ error: 'Failed to load featured items' });
  }
}