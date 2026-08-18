import { useEffect, useState } from 'react';
import { getTopSellingItems } from '../../lib/orders';

type Props = { restaurantId: string };

export default function TopSellingItems({ restaurantId }: Props) {
  const [items, setItems] = useState<{ name: string; revenue: number; orderCount: number; image: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopSellingItems(restaurantId).then(setItems).finally(() => setLoading(false));
  }, [restaurantId]);

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-neutral-900">Top Selling Items</h2>
        <a href="#" className="text-sm text-primary font-medium">View report</a>
      </div>

      {loading && <p className="text-sm text-neutral-400">Loading…</p>}
      {!loading && !items.length && <p className="text-sm text-neutral-400">No sales data yet.</p>}

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-sm font-semibold text-neutral-400 w-4">{i + 1}</span>
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-lg">
                🍽️
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">{item.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-neutral-900">₦{item.revenue.toLocaleString()}</p>
              <p className="text-xs text-neutral-500">{item.orderCount} orders</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}