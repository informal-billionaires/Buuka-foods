import { DayCount } from '../../lib/adminStats';

export default function OrdersOverviewChart({ data }: { data: DayCount[] }) {
  const width = 500;
  const height = 200;
  const padding = 30;
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.count / maxCount) * (height - padding * 2);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
      <div className="text-sm font-semibold text-neutral-900 mb-4">Orders Overview (Last 7 Days)</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <path d={areaPath} fill="#f97316" fillOpacity="0.1" />
        <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2" />
        {points.map(p => (
          <circle key={p.date} cx={p.x} cy={p.y} r="3" fill="#f97316" />
        ))}
        {points.map(p => (
          <text
            key={`label-${p.date}`}
            x={p.x}
            y={height - 8}
            fontSize="10"
            fill="#a3a3a3"
            textAnchor="middle"
          >
            {p.date}
          </text>
        ))}
      </svg>
    </div>
  );
}