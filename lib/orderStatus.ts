import { Order } from './orders';

export function statusLabel(status: Order['status']): string {
  const labels: Record<Order['status'], string> = {
    placed: 'Placed',
    preparing: 'Preparing',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    declined: 'Declined',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}

export function statusColor(status: Order['status']): string {
  const colors: Record<Order['status'], string> = {
    placed: 'text-amber-400',
    preparing: 'text-primary',
    in_transit: 'text-sky-400',
    delivered: 'text-emerald-400',
    declined: 'text-rose-400',
    cancelled: 'text-neutral-400',
  };
  return colors[status] ?? 'text-primary';
}

export function statusBadgeColor(status: Order['status']): string {
  const colors: Record<Order['status'], string> = {
    placed: 'bg-amber-400 text-black',
    preparing: 'bg-primary text-black',
    in_transit: 'bg-sky-400 text-black',
    delivered: 'bg-emerald-400 text-black',
    declined: 'bg-rose-400 text-black',
    cancelled: 'bg-neutral-400 text-black',
  };
  return colors[status] ?? 'bg-primary text-black';
}