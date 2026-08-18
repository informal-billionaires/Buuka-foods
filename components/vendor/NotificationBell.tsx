import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { getOrdersForVendor } from '../../lib/orders';

type Props = { restaurantId: string };

const SEEN_KEY = 'bukkaVendorNotifsLastSeen';

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function NotificationBell({ restaurantId }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SEEN_KEY);
    setLastSeen(stored ? parseInt(stored, 10) : 0);
    getOrdersForVendor(restaurantId).then(setOrders);
  }, [restaurantId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unread = orders.filter((o) => new Date(o.created_at).getTime() > lastSeen);

  function handleOpen() {
    setOpen((prev) => !prev);
    const now = Date.now();
    localStorage.setItem(SEEN_KEY, String(now));
    setLastSeen(now);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-neutral-100 transition"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-neutral-700" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-neutral-200 p-3 z-50">
          <p className="text-sm font-semibold text-neutral-900 mb-2 px-1">Notifications</p>
          {!orders.length && (
            <p className="text-sm text-neutral-500 px-1 py-4 text-center">No notifications yet.</p>
          )}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {orders.slice(0, 8).map((order) => (
              <div key={order.id} className="rounded-xl px-3 py-2 hover:bg-neutral-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-900">New order #{order.id.slice(0, 4)}</span>
                  <span className="text-xs text-neutral-400">{timeAgo(order.created_at)}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''} · ₦{order.total}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}