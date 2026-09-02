import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { geocodeAddress } from '../lib/geocode';

export default function AddressSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  function clear() {
    setValue('');
    inputRef.current?.focus();
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const addr = value.trim();
    if (!addr) {
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      let formatted: string | undefined;
      try {
        if (typeof geocodeAddress === 'function') {
          const geo = await geocodeAddress(addr);
          if (geo) {
            lat = geo.lat;
            lng = geo.lng;
            formatted = geo.formatted || addr;
          }
        }
      } catch (err) {
        formatted = addr;
      }
      try {
        if (formatted) localStorage.setItem('deliveryAddress', formatted);
        if (typeof lat === 'number' && typeof lng === 'number') {
          localStorage.setItem('deliveryCoords', `${lat},${lng}`);
        }
      } catch (_err) {}
      const query: Record<string, string> = {};
      if (formatted) query.q = formatted;
      if (typeof lat === 'number' && typeof lng === 'number') {
        query.lat = String(lat);
        query.lng = String(lng);
      }
      await router.push({ pathname: '/browse', query }, undefined, { shallow: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full sm:w-[480px]" aria-label="Enter your delivery address">
      <div className="flex items-center gap-2 rounded-full bg-white shadow-md border border-neutral-200 pl-4 pr-1.5 py-1.5">
        <svg className="w-5 h-5 flex-shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.2" strokeWidth="1.8" />
        </svg>

        <label htmlFor="hero-address-input" className="sr-only">Enter delivery address</label>
        <input
          id="hero-address-input"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter delivery address (street, city or postcode)"
          className="bg-transparent outline-none text-sm w-full placeholder:text-neutral-400 text-black"
          aria-label="Delivery address"
          autoComplete="off"
        />

        {value ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clear(); }}
            aria-label="Clear address"
            className="p-1 rounded-full hover:bg-neutral-100"
          >
            <svg className="w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}

        <button
          type="submit"
          className={`rounded-full px-5 py-2.5 font-semibold text-sm transition-opacity ${loading ? 'opacity-60 pointer-events-none' : 'bg-primary text-black'}`}
          aria-label="Search"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
    </form>
  );
}