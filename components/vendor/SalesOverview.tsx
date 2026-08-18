import { useEffect, useState } from 'react';
import { getSalesOverview } from '../../lib/orders';

type Props = { restaurantId: string };

export default function SalesOverview({ restaurantId }: Props) {
  const [data, setData] = useState<{
    points: { label: string; value: number }[];
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
  } | null>(null);

  useEffect(() => {
    getSalesOverview(restaurantId, 7).then(setData);
  }, [restaurantId]);

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
        <p className="text-sm text-neutral-400">Loading sales data…</p>
      </div>
    );
  }

  const max = Math.max(...data.points.map((p) => p.value), 1);
  const w = 600;
  const h = 160;
  const stepX = w / (data.points.length - 1);

  const coords = data.points.map((p, i) => ({
    x: i * stepX,
    y: h - (p.value / max) * (h - 20) - 10,
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-neutral-900">Sales Overview</h2>
        <select className="text-sm border border-neutral-200 rounded-lg px-2 py-1">
          <option>This Week</option>
        </select>
      </div>

      <p className="text-2xl font-bold text-neutral-900">₦{data.totalSales.toLocaleString()}</p>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full mt-4" preserveAspectRatio="none">
        <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="2.5" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="var(--primary)" />
        ))}
      </svg>

      <div className="flex justify-between mt-1">
        {data.points.map((p) => (
          <span key={p.label} className="text-xs text-neutral-400">{p.label}</span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-100">
        <div>
          <p className="text-xs text-neutral-500">Total Orders</p>
          <p className="text-sm font-semibold text-neutral-900">{data.totalOrders}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Avg. Order Value</p>
          <p className="text-sm font-semibold text-neutral-900">₦{data.avgOrderValue.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}