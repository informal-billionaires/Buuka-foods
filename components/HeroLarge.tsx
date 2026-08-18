import React from 'react';
import AddressSearch from './AddressSearch';

export default function HeroLarge() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/hero-bg.jpg')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
      }}
      aria-label="Hero: Crave it. We deliver."
    >
      {/* subtle overlay to improve contrast */}
      <div className="absolute inset-0 bg-black/12" />

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
          {/* LEFT: white panel containing headline, description and AddressSearch */}
          <div className="lg:col-span-7">
          
              <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl leading-tight font-extrabold text-black">
                CRAVE IT.
                <span className="block text-primary mt-2">WE DELIVER.</span>
              </h1>

              <p className="mt-6 text-neutral-700">
                Hot, fresh Nigerian favourites delivered to your door.
              </p>

              {/* AddressSearch (inline expanding pill) */}
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <AddressSearch />

                <a
                  className="inline-flex items-center gap-2 border border-neutral-200 px-5 py-3 rounded-full text-neutral-700"
                  href="#featured"
                >
                  Explore
                </a>
              </div>

              {/* icon row */}
              <div className="mt-8 flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">🚚</div>
                  <div>
                    <div className="text-sm font-semibold">Fast Delivery</div>
                    <div className="text-xs text-neutral-500">Under 30 mins</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">🍽️</div>
                  <div>
                    <div className="text-sm font-semibold">Local Bukkas</div>
                    <div className="text-xs text-neutral-500">Trusted vendors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: empty column (hero background image shows behind) */}
          <div className="lg:col-span-5" />
        </div>
      
    </section>
  );
}