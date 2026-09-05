import React from 'react';
import { useRouter } from 'next/router';
import AddressSearch from './AddressSearch';

export default function HeroLarge() {
  const router = useRouter();

  function handleOrderNowClick() {
    try {
      const addr = typeof window !== 'undefined' ? localStorage.getItem('deliveryAddress') : null;
      const coords = typeof window !== 'undefined' ? localStorage.getItem('deliveryCoords') : null;
      if ((addr && addr.trim().length > 0) || (coords && coords.trim().length > 0)) {
        router.push('/browse');
      } else {
        router.push('/?enterAddress=1');
      }
    } catch {
      router.push('/?enterAddress=1');
    }
  }

  return (
    <>
      {/* Desktop hero (unchanged photo-background style) */}
      <section
        className="relative overflow-hidden hidden md:block"
        style={{
          backgroundImage: "url('/images/hero-food.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-label="Hero: Delicious meals from nearby vendors"
      >
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

      {/* Mobile hero (card + illustration style, matches mockup) */}
      <section className="md:hidden mx-4 mt-3 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden relative">
        <div className="px-5 pt-5 pb-6 relative z-10">
          <h1 className="text-2xl leading-tight font-extrabold text-neutral-900">
            Delicious meals
            <span className="block text-primary mt-0.5">from nearby vendors</span>
          </h1>
          <p className="mt-2 text-sm text-neutral-600 max-w-[75%]">
            Order from trusted local restaurants and get your food delivered fast.
          </p>
          <button
            onClick={handleOrderNowClick}
            className="mt-4 inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            Order Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* Inline SVG rider illustration */}
        <svg
          className="absolute right-2 bottom-0 w-32 h-32 sm:w-36 sm:h-36"
          viewBox="0 0 160 160"
          fill="none"
          aria-hidden="true"
        >
          {/* ground shadow */}
          <ellipse cx="90" cy="140" rx="55" ry="8" fill="#00000010" />
          {/* rear wheel */}
          <circle cx="45" cy="128" r="16" fill="#2b2b2b" />
          <circle cx="45" cy="128" r="7" fill="#e5e5e5" />
          {/* front wheel */}
          <circle cx="120" cy="128" r="16" fill="#2b2b2b" />
          <circle cx="120" cy="128" r="7" fill="#e5e5e5" />
          {/* scooter body */}
          <path d="M45 128 L60 100 L110 100 L120 128" stroke="#f97316" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="55" y="86" width="26" height="20" rx="4" fill="#f97316" />
          {/* delivery box */}
          <rect x="30" y="78" width="26" height="24" rx="3" fill="#ea580c" />
          <text x="43" y="93" fontSize="6" fill="#fff" textAnchor="middle" fontWeight="bold">B</text>
          {/* rider body */}
          <circle cx="95" cy="60" r="10" fill="#f97316" />
          <path d="M90 68 Q85 85 88 100" stroke="#1f2937" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M95 75 L110 90" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" />
          <path d="M95 75 L118 78" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </section>
    </>
  );
}