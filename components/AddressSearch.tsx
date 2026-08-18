import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { geocodeAddress } from '../lib/geocode'; // optional; falls back to raw address if missing

/**
 * Inline AddressSearch (expanded pill -> input)
 * - Expands on hover / focus / click
 * - Submits to /browse?q=... and persists deliveryAddress (+ deliveryCoords if geocoded)
 */
export default function AddressSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [value, setValue] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  function openAndFocus() {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleMouseEnter() {
    setHovering(true);
    setExpanded(true);
  }
  function handleMouseLeave() {
    setHovering(false);
    if (!focused) setExpanded(false);
  }

  function handleFocus() {
    setFocused(true);
    setExpanded(true);
  }
  function handleBlur() {
    setFocused(false);
    if (!hovering) setExpanded(false);
  }

  function clear() {
    setValue('');
    inputRef.current?.focus();
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const addr = value.trim();
    if (!addr) {
      openAndFocus();
      return;
    }

    setLoading(true);

    try {
      // attempt geocode (optional). If geocodeAddress isn't available, fallback to raw addr
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
        // ignore geocode error; fallback to raw address
        formatted = addr;
      }

      // persist
      try {
        if (formatted) localStorage.setItem('deliveryAddress', formatted);
        if (typeof lat === 'number' && typeof lng === 'number') {
          localStorage.setItem('deliveryCoords', `${lat},${lng}`);
        }
      } catch (_err) {
        // ignore localStorage errors
      }

      // navigate
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
    <form
      onSubmit={handleSubmit}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
      aria-label="Enter your delivery address"
    >
      <div
        onClick={() => openAndFocus()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openAndFocus();
          }
        }}
        className={`flex items-center gap-3 rounded-full transition-all duration-200 ease-in-out shadow-sm
          ${expanded ? 'bg-white px-3 py-1 w-full sm:w-[420px]' : 'bg-primary px-6 py-2 w-[220px] sm:w-[260px]'}
          cursor-text`}
      >
        {/* search icon */}
        <svg
          className={`w-5 h-5 flex-shrink-0 ${expanded ? 'text-neutral-500' : 'text-black'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
        </svg>

        {!expanded ? (
          <span className="font-medium text-black text-sm select-none">Enter delivery address</span>
        ) : (
          <>
            <label htmlFor="hero-address-input" className="sr-only">Enter delivery address</label>
            <input
              id="hero-address-input"
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Enter delivery address (street, city or postcode)"
              className="bg-transparent outline-none text-sm w-full placeholder:text-neutral-400 text-black"
              aria-expanded={expanded}
              aria-label="Delivery address"
              autoComplete="off"
            />

            {value ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clear();
                }}
                aria-label="Clear address"
                className="p-1 rounded-full hover:bg-neutral-100"
              >
                <svg className="w-4 h-4 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}

            <button
              type="submit"
              className={`ml-2 rounded-full px-4 py-2 font-semibold transition-opacity ${loading ? 'opacity-60 pointer-events-none' : 'bg-primary text-black'}`}
              aria-label="Search"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </>
        )}
      </div>
    </form>
  );
}