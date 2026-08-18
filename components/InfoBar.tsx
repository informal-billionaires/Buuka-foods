import React from 'react';

export default function InfoBar() {
  const items = [
    { icon: '🚚', title: 'Fast delivery', subtitle: '25–35 min' },
    { icon: '⏱️', title: 'On time', subtitle: 'Reliable ETA' },
    { icon: '🛡️', title: 'Safe payments', subtitle: 'Secure checkout' },
    { icon: '🏆', title: 'Top vendors', subtitle: 'Local favourites' }
  ];

  return (
    <div className="rounded-2xl bg-black/80 p-4 md:p-6 text-white shadow-lg">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 justify-between">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-white/6 flex items-center justify-center text-primary">{it.icon}</div>
            <div>
              <div className="font-semibold">{it.title}</div>
              <div className="text-xs text-white/70">{it.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}