import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { geocodeAddress } from '../lib/geocode';
import { useRouter } from 'next/router';

type Coords = { lat: number; lng: number } | null;

type Props = {
  isOpen: boolean;
  initial?: string;
  onClose: () => void;
  onSubmit?: (address: string, coords?: Coords) => void;
};

export default function AddressModal({ isOpen, initial = '', onClose, onSubmit }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function submitAddress(addr: string, coords: Coords = null) {
    const trimmed = addr.trim();
    if (!trimmed && !coords) {
      inputRef.current?.focus();
      return;
    }

    setGeoError(null);

    if (trimmed) {
      setLoadingGeocode(true);
      try {
        let formatted = trimmed;
        let geoCoords: Coords = null;

        if (typeof geocodeAddress === 'function') {
          try {
            const geo = await geocodeAddress(trimmed);
            if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
              geoCoords = { lat: geo.lat, lng: geo.lng };
              if (geo.formatted) formatted = geo.formatted;
            }
          } catch {}
        }

        if (onSubmit) {
          onSubmit(formatted, geoCoords);
        } else {
          try {
            if (geoCoords) localStorage.setItem('deliveryCoords', `${geoCoords.lat},${geoCoords.lng}`);
            localStorage.setItem('deliveryAddress', formatted);
          } catch {}
          const query: any = { q: formatted };
          if (geoCoords) {
            query.lat = geoCoords.lat;
            query.lng = geoCoords.lng;
          }
          router.push({ pathname: '/browse', query });
        }
      } finally {
        setLoadingGeocode(false);
        onClose();
      }
      return;
    }

    if (coords) {
      if (onSubmit) {
        onSubmit('', coords);
      } else {
        try { localStorage.setItem('deliveryCoords', `${coords.lat},${coords.lng}`); } catch {}
        router.push({ pathname: '/browse', query: { lat: coords.lat, lng: coords.lng } });
      }
      onClose();
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    await submitAddress(value);
  }

  function handleUseCurrentLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not available in your browser.');
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLoadingLocation(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        await submitAddress('', coords);
      },
      (err) => {
        setLoadingLocation(false);
        if (err.code === 1) setGeoError('Permission denied. Allow location access to use this feature.');
        else setGeoError('Unable to fetch location. Try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Enter delivery address"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white text-neutral-900 rounded-2xl p-8 shadow-2xl"
        role="document"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-0.5">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="9" r="2.2" fill="currentColor" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight text-neutral-900">
                <span>Delivery</span>
                <span className="text-primary"> address</span>
              </h2>
              <p className="text-sm text-neutral-500 mt-2">Enter an address or use your current location to see nearby vendors.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          >
            <span className="text-xl leading-none">✕</span>
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="address-modal-input" className="sr-only">Search for area, street or landmark</label>

          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-neutral-400" viewBox="0 0 24 24" fill="none">
              <path stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
            </svg>

            <input
              id="address-modal-input"
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search for area, street or landmark"
              className="bg-transparent flex-1 text-sm md:text-base outline-none placeholder:text-neutral-400 text-neutral-900"
              autoComplete="off"
            />

            <button
              type="submit"
              aria-label="Search"
              className="ml-1 inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:brightness-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h11M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {geoError && <div className="mt-3 text-sm text-rose-600">{geoError}</div>}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-200" />
          <div className="text-xs text-neutral-400">or</div>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="w-full inline-flex items-center justify-center gap-3 rounded-full py-3 px-4 bg-neutral-50 border border-neutral-200 text-neutral-800 font-semibold hover:bg-neutral-100"
          >
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3.2" fill="currentColor"/>
            </svg>

            <span>{loadingLocation ? 'Detecting…' : 'Use my current location'}</span>
          </button>
        </div>

        <div className="mt-6">
          <div
            className="w-full px-4 py-3 flex items-center justify-between gap-4"
            role="contentinfo"
            aria-label="Feature highlights"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <img
                  src="/images/icons/fast-delivery.svg"
                  alt="Fast delivery"
                  width={40}
                  height={40}
                  className="object-contain block"
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-900 truncate">Fast Delivery</div>
                <div className="text-xs text-neutral-500 truncate">25–35 min</div>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-primary/30 to-transparent" aria-hidden />

            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2v2M12 20v2M4 9h16M4 15h16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-900 truncate">Safe & Secure</div>
                <div className="text-xs text-neutral-500 truncate">100% protection</div>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-primary/30 to-transparent" aria-hidden />

            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2l3 6 6 .5-4.5 3.5L19 20l-7-4-7 4 2.5-7L3 8.5 9 8z" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-900 truncate">Trusted Vendors</div>
                <div className="text-xs text-neutral-500 truncate">Quality assured</div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}