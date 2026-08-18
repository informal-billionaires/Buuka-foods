import React from 'react';
import Image from 'next/image';

export default function RiderCard() {
  return (
    <div className="sticky top-20">
      <div className="rounded-2xl bg-black/85 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden relative">
            <Image src="/images/rider.jpg" alt="Rider" fill className="object-cover" />
          </div>
          <div>
            <div className="font-semibold">Your Rider</div>
            <div className="text-xs text-white/70">En route · 12 min</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs text-white/70 mb-2">Current task</div>
          <div className="rounded-lg bg-white/5 p-3 text-sm">Picking up Jollof Hub</div>
        </div>

        <div className="mt-6">
          <button className="w-full bg-primary text-black py-3 rounded-full font-semibold">Track Order</button>
        </div>
      </div>
    </div>
  );
}