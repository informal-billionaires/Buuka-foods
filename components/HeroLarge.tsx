import React from 'react';
import AddressSearch from './AddressSearch';

export default function HeroLarge() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/hero-food.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      aria-label="Hero: Delicious meals from nearby vendors"
    >
      {/* light gradient overlay so text stays readable over the photo */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/20" />

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-3 py-1 text-xs text-neutral-600">
            🥘 Good food. Near you.
          </div>

          <h1 className="mt-4 text-4xl sm:text-5xl leading-tight font-extrabold text-neutral-900">
            Delicious meals
            <span className="block text-primary mt-1">from nearby vendors</span>
          </h1>

          <p className="mt-4 text-neutral-700">
            Order from trusted local restaurants and get your food delivered fast.
          </p>

          <div className="mt-6">
            <AddressSearch />
          </div>

          <div className="mt-8 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow">🛵</div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">Fast delivery</div>
                <div className="text-xs text-neutral-600">On-time, every time</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow">🛡️</div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">Trusted vendors</div>
                <div className="text-xs text-neutral-600">Quality you can trust</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow">🔒</div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">Secure payment</div>
                <div className="text-xs text-neutral-600">Pay safely online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}