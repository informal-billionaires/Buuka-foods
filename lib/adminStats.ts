import { supabase } from './supabaseClient';

export interface AdminStats {
  totalOrders: number;
  activeVendors: number;
  totalCustomers: number;
  totalRevenue: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [ordersRes, vendorsRes, customersRes, revenueRes] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('total')
      .not('status', 'in', '("cancelled","declined")'),
  ]);

  const totalRevenue = (revenueRes.data ?? []).reduce(
    (sum: number, row: any) => sum + (Number(row.total) || 0),
    0
  );

  return {
    totalOrders: ordersRes.count ?? 0,
    activeVendors: vendorsRes.count ?? 0,
    totalCustomers: customersRes.count ?? 0,
    totalRevenue,
  };
}

export interface StatusCount {
  status: string;
  count: number;
}

const ORDER_STATUSES = ['placed', 'preparing', 'in_transit', 'delivered', 'declined', 'cancelled'];

export async function getOrdersByStatus(): Promise<StatusCount[]> {
  const { data, error } = await supabase.from('orders').select('status');
  if (error || !data) return ORDER_STATUSES.map(status => ({ status, count: 0 }));

  const counts: Record<string, number> = {};
  ORDER_STATUSES.forEach(s => (counts[s] = 0));
  (data as any[]).forEach(row => {
    if (row.status && counts[row.status] !== undefined) counts[row.status]++;
  });

  return ORDER_STATUSES.map(status => ({ status, count: counts[status] }));
}

export interface DayCount {
  date: string; // e.g. "Aug 25"
  count: number;
}

export async function getOrdersLast7Days(): Promise<DayCount[]> {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('orders')
    .select('created_at')
    .gte('created_at', since.toISOString());

  const days: DayCount[] = [];
  const dayKeyFormat = (d: Date) => d.toISOString().slice(0, 10);
  const counts: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    counts[dayKeyFormat(d)] = 0;
  }

  if (!error && data) {
    (data as any[]).forEach(row => {
      if (!row.created_at) return;
      const key = dayKeyFormat(new Date(row.created_at));
      if (counts[key] !== undefined) counts[key]++;
    });
  }

  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = dayKeyFormat(d);
    days.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: counts[key],
    });
  }

  return days;
}