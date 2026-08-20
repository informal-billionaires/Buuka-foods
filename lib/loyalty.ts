import type { Order } from './orders';

export type LoyaltyStatus = {
  restaurantId: string;
  restaurantName: string;
  count: number;
} | null;

// Returns the vendor the customer has ordered from most this calendar month,
// if 3 or more orders — matches the mockup's "ordered 3 times this month" banner.
// Display-only: no discount code, no redemption tracking.
export function getLoyaltyStatus(orders: Order[]): LoyaltyStatus {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const counts: Record<string, { restaurantName: string; count: number }> = {};

  for (const order of orders) {
    const createdAt = new Date(order.createdAt);
    if (createdAt < monthStart) continue;

    if (!counts[order.restaurantId]) {
      counts[order.restaurantId] = { restaurantName: order.restaurantName, count: 0 };
    }
    counts[order.restaurantId].count += 1;
  }

  let top: LoyaltyStatus = null;
  for (const [restaurantId, stats] of Object.entries(counts)) {
    if (stats.count >= 3 && (!top || stats.count > top.count)) {
      top = { restaurantId, restaurantName: stats.restaurantName, count: stats.count };
    }
  }

  return top;
}