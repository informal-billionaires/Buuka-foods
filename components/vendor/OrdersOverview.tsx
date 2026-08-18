import { useEffect, useState } from 'react';
import { getOrdersForVendor, updateOrderStatus } from '../../lib/orders';

const statusStyles: Record<string, string> = {
  placed: 'bg-orange-50 text-primary',
  preparing: 'bg-blue-50 text-blue-600',
  in_transit: 'bg-purple-50 text-purple-600',
  delivered: 'bg-green-50 text-green-600',
  declined: 'bg-red-50 text-red-600',
  cancelled: 'bg-neutral-100 text-neutral-500',
};

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function OrdersOverview({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getOrdersForVendor(restaurantId)
      .then(data => { if (mounted) setOrders(data); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [restaurantId]);

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert('Could not update order status. Please try again.');
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  function renderActions(order: any) {
    const isUpdating = updatingId === order.id;
    const disabledClass = isUpdating ? 'opacity-50 pointer-events-none' : '';

    if (order.status === 'placed') {
      return (
        <div className={`flex gap-2 ${disabledClass}`}>
          <button
            onClick={() => handleStatusChange(order.id, 'declined')}
            className="px-3 py-1.5 rounded-full text-sm font-medium border border-neutral-200 text-neutral-600"
          >
            Decline
          </button>
          <button
            onClick={() => handleStatusChange(order.id, 'preparing')}
            className="px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-black"
          >
            Accept
          </button>
        </div>
      );
    }
    if (order.status === 'preparing') {
      return (
        <button
          onClick={() => handleStatusChange(order.id, 'in_transit')}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-black ${disabledClass}`}
        >
          Mark as Out for Delivery
        </button>
      );
    }
    // in_transit, delivered, declined, cancelled — no vendor action, handled by admin/rider per Cluster C
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Orders Overview</h2>
          <p className="text-xs text-neutral-400 mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        </div>
        <a href="/vendor/orders" className="text-sm text-primary font-medium">View all orders</a>
      </div>
      {loading && <p className="text-sm text-neutral-400">Loading…</p>}
      {!loading && !orders.length && (
        <p className="text-sm text-neutral-400">No orders yet.</p>
      )}
      <div className="space-y-3">
        {orders.slice(0, 5).map((order) => (
          <div key={order.id} className="border border-neutral-100 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900">#{order.id.slice(0, 4)}</span>
                <span className="text-xs text-neutral-400">{timeAgo(order.created_at)}</span>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusStyles[order.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
            <ul className="text-sm text-neutral-700 mb-2">
              {order.order_items.map((item: any) => (
                <li key={item.id}>{item.qty}x {item.name}</li>
              ))}
            </ul>
            <div className="flex justify-between items-center text-xs text-neutral-500 mb-3">
              <span className="capitalize">{order.fulfillment}</span>
              <span className="text-sm font-semibold text-neutral-900">₦{order.total}</span>
            </div>
            {renderActions(order)}
          </div>
        ))}
      </div>
    </div>
  );
}