// lib/server/pricing.ts
//
// SERVER-ONLY. This is the one place in the codebase allowed to read the
// `margins` table. Only import this from pages/api/** route handlers.
//
// Do NOT import this from lib/restaurants.ts, any component, or any page —
// those run in the browser (or get bundled for it) and must never see a
// margin percentage, only a final computed price.

import { supabaseAdmin } from '../supabaseAdmin';
import { computeCustomerPrice } from '../pricing';

const DEFAULT_MARGIN = 15;

export async function getMarginForVendorServer(vendorId: string): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('margins')
      .select('percentage')
      .eq('vendor_id', vendorId)
      .single();

    if (error || !data || data.percentage === null || typeof data.percentage === 'undefined') {
      return DEFAULT_MARGIN;
    }

    return Number(data.percentage);
  } catch (err) {
    console.error('getMarginForVendorServer unexpected error:', err);
    return DEFAULT_MARGIN;
  }
}

// Batch version — mirrors the batching getFeaturedMenuItems used to do
// client-side, avoids one margins query per vendor when pricing many items.
export async function getMarginsForVendorsServer(vendorIds: string[]): Promise<Record<string, number>> {
  const uniqueIds = Array.from(new Set(vendorIds.filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  try {
    const { data, error } = await supabaseAdmin
      .from('margins')
      .select('vendor_id, percentage')
      .in('vendor_id', uniqueIds);

    if (error || !data) {
      console.error('getMarginsForVendorsServer error:', error);
      return {};
    }

    const map: Record<string, number> = {};
    data.forEach((row: any) => {
      if (row.vendor_id) map[row.vendor_id] = Number(row.percentage);
    });
    return map;
  } catch (err) {
    console.error('getMarginsForVendorsServer unexpected error:', err);
    return {};
  }
}

export function priceItem(basePrice: number, marginPercentage: number | undefined): number {
  return computeCustomerPrice(basePrice, marginPercentage ?? DEFAULT_MARGIN);
}