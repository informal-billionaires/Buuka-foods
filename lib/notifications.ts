import { supabase } from './supabaseClient';

export interface Notification {
  id: string;
  customerId: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function mapRow(row: any): Notification {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    message: row.message,
    link: row.link ?? null,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function getNotificationsForCustomer(customerId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getNotificationsForCustomer error:', error);
    return [];
  }
  return (data ?? []).map(mapRow);
}

export async function getUnreadNotificationCount(customerId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('is_read', false);

  if (error) {
    console.error('getUnreadNotificationCount error:', error);
    return 0;
  }
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('markNotificationRead error:', error);
  }
}