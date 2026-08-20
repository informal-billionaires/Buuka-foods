import { supabase } from './supabaseClient';

export type OrderCartItem = {
  key: string;
  itemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  size?: string;
  customizations?: string[];
};

export type Order = {
  id: string;
  createdAt: string; // ISO string
  restaurantId: string;
  restaurantName: string;
  items: OrderCartItem[];
  fulfillment: 'delivery' | 'pickup';
  deliveryFee: number;
  subtotal: number;
  total: number;
  status: 'placed' | 'preparing' | 'in_transit' | 'delivered' | 'declined' | 'cancelled';
};

// Input shape when placing a new order — no id/createdAt yet, Supabase generates both
export type NewOrder = Omit<Order, 'id' | 'createdAt'>;

export async function getOrdersForVendor(restaurantId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, restaurant_id, restaurant_name, fulfillment, delivery_fee,
      subtotal, total, status, created_at,
      order_items ( id, name, unit_price, qty, size, customizations )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function saveOrder(order: NewOrder): Promise<Order | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('saveOrder called with no authenticated user');
    return null;
  }

  const { data: orderRow, error: orderErr } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      restaurant_id: order.restaurantId,
      restaurant_name: order.restaurantName,
      fulfillment: order.fulfillment,
      delivery_fee: order.deliveryFee,
      subtotal: order.subtotal,
      total: order.total,
      status: order.status,
    })
    .select()
    .single();

  if (orderErr || !orderRow) {
    console.error('saveOrder: failed to insert order', orderErr);
    return null;
  }

  const itemRows = order.items.map(item => ({
    order_id: orderRow.id,
    item_id: item.itemId,
    name: item.name,
    unit_price: item.unitPrice,
    qty: item.qty,
    size: item.size ?? null,
    customizations: item.customizations ?? null,
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(itemRows);

  if (itemsErr) {
    console.error('saveOrder: failed to insert order items', itemsErr);
    // Order row exists but items failed — surfacing this rather than silently
    // returning a partial order, since it'd show as an empty order in history
    return null;
  }

  return mapOrder(orderRow, order.items);
}

export async function getOrders(): Promise<Order[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('getOrders failed', error);
    return [];
  }

  return data.map(row => mapOrder(row, row.order_items.map(mapItem)));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('getOrderById failed', error);
    return null;
  }

  return mapOrder(data, data.order_items.map(mapItem));
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const updatePayload: { status: string; accepted_at?: string } = { status: newStatus };

  // accepted_at must be set when a vendor moves an order into 'preparing',
  // since the (not-yet-built) escalation check depends on it
  if (newStatus === 'preparing') {
    updatePayload.accepted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rateOrder(orderId: string, rating: number): Promise<boolean> {
  if (rating < 1 || rating > 5) {
    console.error('rateOrder: rating must be between 1 and 5');
    return false;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('order_ratings')
    .upsert(
      { order_id: orderId, customer_id: user.id, rating },
      { onConflict: 'order_id' }
    );

  if (error) {
    console.error('rateOrder failed', error);
    return false;
  }
  return true;
}

export async function getRatingsForOrders(orderIds: string[]): Promise<Record<string, number>> {
  if (orderIds.length === 0) return {};

  const { data, error } = await supabase
    .from('order_ratings')
    .select('order_id, rating')
    .in('order_id', orderIds);

  if (error || !data) {
    console.error('getRatingsForOrders failed', error);
    return {};
  }

  const map: Record<string, number> = {};
  for (const row of data) {
    map[row.order_id] = row.rating;
  }
  return map;
}

function mapItem(row: any): OrderCartItem {
  return {
    key: row.id,
    itemId: row.item_id,
    name: row.name,
    unitPrice: row.unit_price,
    qty: row.qty,
    size: row.size ?? undefined,
    customizations: row.customizations ?? undefined,
  };
}

function mapOrder(row: any, items: OrderCartItem[]): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    items,
    fulfillment: row.fulfillment,
    deliveryFee: row.delivery_fee,
    subtotal: row.subtotal,
    total: row.total,
    status: row.status,
  };
}

export async function getTopSellingItems(restaurantId: string, limit = 3) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_items ( name, unit_price, qty, item_id, menu_items ( image ) )')
    .eq('restaurant_id', restaurantId);

  if (error) throw error;

  const itemMap: Record<string, { revenue: number; orderCount: number; image: string | null }> = {};

  for (const order of data ?? []) {
    for (const item of order.order_items ?? []) {
      if (!itemMap[item.name]) {
        itemMap[item.name] = {
          revenue: 0,
          orderCount: 0,
          image: item.menu_items?.image ?? null,
        };
      }
      itemMap[item.name].revenue += item.unit_price * item.qty;
      itemMap[item.name].orderCount += 1;
    }
  }

  return Object.entries(itemMap)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getSalesOverview(restaurantId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('orders')
    .select('total, created_at')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  const dayTotals: Record<string, number> = {};
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (const order of data ?? []) {
    const label = dayLabels[new Date(order.created_at).getDay()];
    dayTotals[label] = (dayTotals[label] ?? 0) + order.total;
  }

  const totalSales = (data ?? []).reduce((sum, o) => sum + o.total, 0);
  const totalOrders = (data ?? []).length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  return {
    points: dayLabels.map((label) => ({ label, value: dayTotals[label] ?? 0 })),
    totalSales,
    totalOrders,
    avgOrderValue,
  };
}