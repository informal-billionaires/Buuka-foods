import { useEffect, useState, type ReactNode } from 'react';
import { Eye, ShoppingBag, Star, Wallet } from 'lucide-react';
import { getOrdersForVendor } from '../../lib/orders';

type StatCardProps = {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  muted?: boolean;
};

function StatCard({
  icon,
  iconBg,
  label,
  value,
  muted = false,
}: StatCardProps) {
  return (
    <div className="flex min-h-[104px] items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={`text-xl font-bold ${
            muted ? 'text-neutral-400' : 'text-neutral-900'
          }`}
        >
          {value}
        </p>
        <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

export default function StatsOverview({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const [ordersToday, setOrdersToday] = useState<number | null>(null);
  const [salesToday, setSalesToday] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    getOrdersForVendor(restaurantId)
      .then((orders) => {
        if (!mounted) return;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const todayOrders = orders.filter(
          (order) => new Date(order.created_at) >= startOfToday
        );

        setOrdersToday(todayOrders.length);
        setSalesToday(
          todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
        );
      })
      .catch(() => {
        if (!mounted) return;
        setOrdersToday(0);
        setSalesToday(0);
      });

    return () => {
      mounted = false;
    };
  }, [restaurantId]);

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<ShoppingBag size={19} className="text-orange-500" />}
        iconBg="bg-orange-50"
        label="Orders today"
        value={ordersToday === null ? '...' : String(ordersToday)}
      />

      <StatCard
        icon={<Wallet size={19} className="text-emerald-500" />}
        iconBg="bg-emerald-50"
        label="Sales today"
        value={
          salesToday === null ? '...' : `₦${salesToday.toLocaleString()}`
        }
      />

      <StatCard
        icon={<Star size={19} className="text-violet-500" />}
        iconBg="bg-violet-50"
        label="Avg. rating"
        value="Coming soon"
        muted
      />

      <StatCard
        icon={<Eye size={19} className="text-sky-500" />}
        iconBg="bg-sky-50"
        label="Views today"
        value="Coming soon"
        muted
      />
    </section>
  );
}