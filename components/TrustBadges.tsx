import React from 'react';
import { ChefHat, ShieldCheck, Lock, Headset } from 'lucide-react';

const badges = [
  {
    title: 'Local & Loved',
    subtitle: 'We support local vendors and communities.',
    icon: ChefHat,
  },
  {
    title: 'Quality Guarantee',
    subtitle: 'We ensure top quality in every order.',
    icon: ShieldCheck,
  },
  {
    title: 'Safe & Secure',
    subtitle: 'Your payments and data are protected.',
    icon: Lock,
  },
  {
    title: '24/7 Support',
    subtitle: "We're here to help anytime, anywhere.",
    icon: Headset,
  },
];

export default function TrustBadges() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 pb-8 md:pb-12">
      <div className="border border-neutral-200 rounded-2xl p-3 md:p-6 grid grid-cols-4 gap-2 md:gap-6">
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.title} className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-1.5 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <div className="text-[10px] md:text-sm font-semibold text-neutral-900 leading-tight">{b.title}</div>
                <div className="hidden md:block text-xs text-neutral-500 mt-0.5">{b.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}