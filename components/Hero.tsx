import React, { useState } from 'react';
import Image from 'next/image';
import Button from './ui/Button';

const IMAGES = [
  { src: '/images/egusi.jpg', alt: 'Pounded yam & egusi' },
  { src: '/images/suya.jpg', alt: 'Suya skewers' },
  { src: '/images/jollof.jpg', alt: 'Jollof rice' }
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  function prev() { setIndex(i => (i - 1 + IMAGES.length) % IMAGES.length); }
  function next() { setIndex(i => (i + 1) % IMAGES.length); }

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left: text */}
        <div className="md:col-span-7">
          <h1 className="text-[56px] sm:text-[72px] md:text-[96px] leading-tight font-heading tracking-tight hero-heading">
            Hot meals<br/>delivered fast.
          </h1>

          <p className="mt-6 max-w-xl text-neutral-white/70 text-lg">
            Taste home wherever you are. Order from local bukkas and get fresh, warm Nigerian food brought to your door in minutes.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Button variant="primary">Order Now</Button>
            <Button variant="outline">View Menu</Button>
          </div>

          <div className="mt-6 flex gap-4">
            <div className="px-4 py-2 rounded-full bg-neutral-white/5 text-sm">Delivery in 25–35 min</div>
            <div className="px-4 py-2 rounded-full bg-neutral-white/5 text-sm">Safe & Contactless</div>
          </div>
        </div>

        {/* Right: image carousel */}
        <div className="md:col-span-5 relative flex items-center justify-center">
          <div className="w-full max-w-[520px] relative">
            <div className="rounded-2xl overflow-hidden shadow-soft-lg bg-[#2a1f12] p-6 relative">
              <div className="relative h-64 sm:h-72 md:h-80 flex items-center justify-center">
                {/* main image (fills 70% width area) */}
                <div className="absolute right-0 top-0 h-full w-[70%] rounded-2xl overflow-hidden">
                  <Image
                    src={IMAGES[index].src}
                    alt={IMAGES[index].alt}
                    fill
                    sizes="(max-width: 768px) 60vw, 40vw"
                    className="object-cover"
                  />
                </div>

                {/* stacked preview images on the left */}
                <div className="absolute left-0 top-4 flex flex-col gap-4">
                  <div className="w-28 h-20 relative rounded-xl overflow-hidden">
                    <Image src={IMAGES[(index+1)%IMAGES.length].src} alt="preview1" fill className="object-cover" />
                  </div>
                  <div className="w-28 h-20 relative rounded-xl overflow-hidden">
                    <Image src={IMAGES[(index+2)%IMAGES.length].src} alt="preview2" fill className="object-cover" />
                  </div>
                </div>
              </div>

              {/* improved carousel controls: centered pod with smaller orange buttons */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20">
                <div className="flex items-center gap-4 bg-neutral-black/70 rounded-full px-3 py-1 shadow-md backdrop-blur-sm">
                  <button
                    onClick={prev}
                    aria-label="Previous"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-primary shadow-md hover:scale-105 transform transition focus:outline-none focus:ring-4 focus:ring-primary/25"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M15 6 L9 12 L15 18" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <div className="px-4 py-1 rounded-full bg-neutral-black text-neutral-white text-sm font-medium min-w-[56px] text-center shadow-sm">
                    {index + 1} / {IMAGES.length}
                  </div>

                  <button
                    onClick={next}
                    aria-label="Next"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-primary shadow-md hover:scale-105 transform transition focus:outline-none focus:ring-4 focus:ring-primary/25"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M9 6 L15 12 L9 18" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 left-6 w-[300px] h-16 bg-gradient-to-r from-[#6a3f00] to-[#402400] rounded-full opacity-60 blur-sm -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
}