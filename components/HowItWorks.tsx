import React from 'react';

type Props = {
  compact?: boolean;
};

export default function HowItWorks({ compact = false }: Props) {
  const containerClass = compact ? 'px-4 py-6' : 'px-6 py-12';
  const titleClass = compact ? 'text-lg' : 'text-2xl';

  const steps = [
    {
      title: 'Search',
      subtitle: 'Search your search',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Order',
      subtitle: 'Order your order',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
          <rect x="5" y="4" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 8h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 17l2-2 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Enjoy',
      subtitle: 'Enjoy your favourite',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
          <path d="M6 14c0-3 2-5 5-5s5 2 5 5v3H6v-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8.5c0-.9.9-1.5 1.6-1 0 0 .3.2.4.4.1.2.3.3.7.3.4 0 1-.5.8-1.1-.3-.9-1.3-1.6-2.5-1.6-1.2 0-2.2.7-2.5 1.6-.2.6.4 1.1.8 1.1.4 0 .6-.1.7-.3.1-.2.4-.4.4-.4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  return (
    <section
        className={`rounded-2xl border border-white/6 bg-gradient-to-b from-black/80 to-black/60 ${containerClass} shadow-md backdrop-blur-sm`}
    >
        <div className="max-w-4xl mx-auto">
            {/* decorative thin bar centered above title */}
            <div className="mx-auto w-20 h-1 rounded-full bg-gradient-to-r from-primary to-primary-deep mb-4" />

            <h3 className={`font-heading ${titleClass} text-neutral-white text-center mb-6`}>How It Works</h3>

        <div className="flex items-center justify-between gap-4">
          {steps.map((s, i) => (
            <div key={s.title} className="flex-1 flex flex-col items-center text-center px-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ color: '#FF9900' }}>
                {s.icon}
              </div>

              <div className="font-semibold text-neutral-white mt-3">{s.title}</div>
              <div className="text-xs text-neutral-white/60 mt-1">{s.subtitle}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}