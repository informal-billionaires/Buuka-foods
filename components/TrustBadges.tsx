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
    <section className="max-w-7xl mx-auto px-6 pb-12">
      <div className="border border-neutral-200 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.title} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">{b.title}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{b.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}