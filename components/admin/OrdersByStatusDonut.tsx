import { StatusCount } from '../../lib/adminStats';

const STATUS_COLORS: Record<string, string> = {
  placed: '#f59e0b',
  preparing: '#f97316',
  in_transit: '#3b82f6',
  delivered: '#22c55e',
  declined: '#ef4444',
  cancelled: '#a3a3a3',
};

const STATUS_LABELS: Record<string, string> = {
  placed: 'Placed',
  preparing: 'Preparing',
  in_transit: 'On the way',
  delivered: 'Delivered',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export default function OrdersByStatusDonut({ data }: { data: StatusCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  let offsetAccumulator = 0;
  const segments = data
    .filter(d => d.count > 0)
    .map(d => {
      const fraction = total > 0 ? d.count / total : 0;
      const dash = fraction * circumference;
      const segment = {
        ...d,
        dashArray: `${dash} ${circumference - dash}`,
        dashOffset: -offsetAccumulator,
      };
      offsetAccumulator += dash;
      return segment;
    });

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
      <div className="text-sm font-semibold text-neutral-900 mb-4">Orders by Status</div>
      <div className="flex items-center gap-6">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <g transform="rotate(-90 80 80)">
            {total === 0 ? (
              <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e5e5" strokeWidth="20" />
            ) : (
              segments.map(seg => (
                <circle
                  key={seg.status}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={STATUS_COLORS[seg.status]}
                  strokeWidth="20"
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                />
              ))
            )}
          </g>
        </svg>
        <div className="space-y-2">
          {data.map(d => (
            <div key={d.status} className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: STATUS_COLORS[d.status] }}
              />
              <span className="text-neutral-600">{STATUS_LABELS[d.status]}</span>
              <span className="text-neutral-900 font-medium">
                {d.count} {total > 0 ? `(${Math.round((d.count / total) * 100)}%)` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}