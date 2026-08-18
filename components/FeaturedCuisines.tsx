import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function FeaturedCuisines() {
  const items = [
    { title: 'Soup Spot', img: '/images/soup1.jpg' },
    { title: 'Soup Shack', img: '/images/soup2.jpg' },
    { title: 'Suya Shack', img: '/images/suya.jpg' },
    { title: 'Jollof Hub', img: '/images/jollof.jpg' },
    // add more items as needed
  ];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Auto-scroll configuration
    const speedPxPerTick = 1.2;      // how many pixels per tick
    const tickMs = 16;               // ~60fps; increase for slower movement

    // Clear any existing interval
    if (scrollIntervalRef.current) {
      window.clearInterval(scrollIntervalRef.current);
    }

    function startAutoScroll() {
      scrollIntervalRef.current = window.setInterval(() => {
        if (!el) return;
        // If we've reached (or nearly) the end, smooth-scroll back to start
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
          // snap back smoothly to start
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // advance slightly
          el.scrollLeft = el.scrollLeft + speedPxPerTick;
        }
      }, tickMs);
    }

    function stopAutoScroll() {
      if (scrollIntervalRef.current) {
        window.clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    // Start on mount
    startAutoScroll();

    // Pause on hover
    const onEnter = () => stopAutoScroll();
    const onLeave = () => startAutoScroll();
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    // Clean up
    return () => {
      stopAutoScroll();
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section className="py-10">
      <h3 className="text-2xl font-heading mb-6 pl-1">Featured Cuisines</h3>

      <div className="relative">
        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory py-4 pb-8 -ml-1 no-scrollbar scroll-smooth"
          // allow touch scrolling while JS autoscroll runs; resize will still work
        >
          {items.map((it) => (
            <article
              key={it.title}
              className="w-[320px] sm:w-[360px] flex-shrink-0 snap-center rounded-2xl overflow-hidden bg-neutral-white/3 shadow-soft-lg"
            >
              <div className="relative h-48 sm:h-56">
                <Image src={it.img} alt={it.title} fill className="object-cover" />
              </div>

              <div className="p-4">
                <div className="font-semibold text-lg">{it.title}</div>
                <div className="text-xs text-neutral-white/60 mt-1">Popular · Nearby</div>
              </div>
            </article>
          ))}
        </div>

        {/* subtle edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-black/90 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-black/90 to-transparent" />
      </div>
    </section>
  );
}