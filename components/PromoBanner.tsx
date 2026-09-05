// components/PromoBanner.tsx
import React from 'react';
import Image from 'next/image';

export default function PromoBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="bg-primary/10 rounded-2xl px-5 py-5 md:px-8 md:py-6 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-neutral-900">
            First-order discounts — coming soon
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            We're working on launch offers for new customers. Check back soon.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Image
            src="/images/rider-illustration.png"
            alt=""
            width={140}
            height={100}
            className="hidden sm:block"
          />
        </div>
      </div>
    </section>
  );
}