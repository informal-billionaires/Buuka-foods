import React from 'react';
import { Store, ShoppingBag, Bike, UtensilsCrossed } from 'lucide-react';

const steps = [
  {
    title: 'Choose a restaurant',
    subtitle: 'Browse from trusted local vendors near you.',
    icon: Store,
  },
  {
    title: 'Place your order',
    subtitle: 'Add your favorites to cart and checkout securely.',
    icon: ShoppingBag,
  },
  {
    title: 'We deliver fast',
    subtitle: 'Your order is prepared and delivered to you.',
    icon: Bike,
  },
  {
    title: 'Enjoy your meal',
    subtitle: 'Fresh, hot and delicious food at your doorstep.',
    icon: UtensilsCrossed,
  },
];

export default function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-bold text-neutral-900 text-center mb-10">How it works</h2>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 relative">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex flex-col items-center text-center relative">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </div>
              </div>

              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] border-t border-dashed border-neutral-300" />
              )}

              <div className="text-sm font-semibold text-neutral-900 mt-4">{step.title}</div>
              <div className="text-xs text-neutral-500 mt-1 max-w-[180px]">{step.subtitle}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}