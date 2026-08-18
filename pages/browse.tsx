import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import SearchBar from '../components/SearchBar';
import FiltersBar from '../components/FiltersBar';
import RestaurantCard from '../components/RestaurantCard';
import AddressModal from '../components/AddressModal';
import { getApprovedRestaurants } from '../lib/restaurants';
import type { Restaurant } from '../lib/restaurants';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => v * Math.PI / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type Coords = { lat: number; lng: number } | null;

export default function BrowsePage() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'delivery' | 'distance'>('rating');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const [hasAddress, setHasAddress] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userCoords, setUserCoords] = useState<Coords>(null);

  
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState<boolean>(true);

  // Guard so the effect doesn't re-run the fallback address checks
  // after skipAddressPrompt has already resolved hasAddress=true.
  const skippedRef = useRef(false);

  const RADIUS_KM = 10;

  useEffect(() => {
    if (!router.isReady) return;

    // If page opened with ?skipAddressPrompt=1, bypass the address prompt and show browse UI
    if (router.query.skipAddressPrompt === '1') {
      skippedRef.current = true;
      try { sessionStorage.setItem('skipAddressPrompt', '1'); } catch {}
      setHasAddress(true);
      // remove the param so it doesn't persist in the URL
      const { skipAddressPrompt, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
      return;
    }

    // Already resolved via skip earlier in this render cycle — don't
    // let the fallback checks below overwrite hasAddress back to false.
    if (skippedRef.current) return;

    // auto open modal when ?enterAddress=1 present
    if (router.query.enterAddress) {
      setShowModal(true);
      const { enterAddress, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
      return;
    }

    // Query lat/lng in url?
    const latQ = typeof router.query.lat === 'string' ? Number(router.query.lat) : undefined;
    const lngQ = typeof router.query.lng === 'string' ? Number(router.query.lng) : undefined;
    if (typeof latQ === 'number' && !Number.isNaN(latQ) && typeof lngQ === 'number' && !Number.isNaN(lngQ)) {
      setUserCoords({ lat: latQ, lng: lngQ });
      setHasAddress(true);
      try { localStorage.setItem('deliveryCoords', `${latQ},${lngQ}`); } catch {}
      return;
    }

    // Query q?
    const qParam = typeof router.query.q === 'string' ? router.query.q : '';
    if (qParam) {
      setQuery(qParam);
      setHasAddress(true);
      try { localStorage.setItem('deliveryAddress', qParam); } catch {}
      return;
    }

    // sessionStorage fallback — set earlier in this session via skipAddressPrompt
    try {
      if (sessionStorage.getItem('skipAddressPrompt') === '1') {
        setHasAddress(true);
        return;
      }
    } catch {}

    // localStorage fallback
    try {
      const addr = localStorage.getItem('deliveryAddress');
      const coordsRaw = localStorage.getItem('deliveryCoords');
      if (coordsRaw) {
        const [latStr, lngStr] = coordsRaw.split(',');
        const lat = Number(latStr);
        const lng = Number(lngStr);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          setUserCoords({ lat, lng });
          setHasAddress(true);
          return;
        }
      }
      if (addr && addr.trim().length > 0) {
        setQuery(addr);
        setHasAddress(true);
        return;
      }
      setHasAddress(false);
    } catch (err) {
      setHasAddress(false);
    }
  }, [router.isReady, router.query.lat, router.query.lng, router.query.q, router.query.enterAddress, router.query.skipAddressPrompt]);

  // Redirect users without a saved address back to the homepage,
  // where ?enterAddress=1 will automatically open AddressModal.
  useEffect(() => {
    if (!router.isReady) return;

    // Wait until address detection has completed.
    if (hasAddress !== false) return;

    router.replace('/?enterAddress=1');
  }, [router.isReady, hasAddress, router]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setRestaurantsLoading(true);
      try {
        const rows = await getApprovedRestaurants();
        if (!mounted) return;
        setAllRestaurants(rows);
      } catch (err) {
        // getApprovedRestaurants already logs; keep UI working
        console.error('Error loading restaurants', err);
        if (mounted) setAllRestaurants([]);
      } finally {
        if (mounted) setRestaurantsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  function handleOpenModal() {
    setShowModal(true);
  }

  function handleModalSubmit(address: string, coords?: { lat: number; lng: number } | null) {
    try {
      if (address && address.trim()) {
        localStorage.setItem('deliveryAddress', address);
      } else if (coords) {
        localStorage.setItem('deliveryCoords', `${coords.lat},${coords.lng}`);
      }
    } catch (err) {}
    if (coords) setUserCoords(coords);
    setQuery(address || '');
    setHasAddress(true);
    setShowModal(false);
    if (address) {
      router.replace({ pathname: '/browse', query: { q: address } }, undefined, { shallow: true });
    }
  }

  /**
   * Compute filtered list unconditionally so hooks order remains stable.
   * If address isn't ready (null) or not set (false) we return an empty list here
   * and later render the AddressRequired UI.
   */
  const filtered = useMemo(() => {
    if (hasAddress === null || hasAddress === false) {
      return [] as Array<Restaurant & { __distanceKm?: number }>;
    }

    const q = query.trim().toLowerCase();
    let items = allRestaurants.slice() as Array<Restaurant & { __distanceKm?: number }>;

    if (q) {
      items = items.filter(r => {
        const name = (r.name || '').toLowerCase();
        const cuisine = (r.cuisine || '').toLowerCase();
        return name.includes(q) || cuisine.includes(q);
      });
    }

    if (userCoords) {
      items = items
        .map(r => {
          const latVal = (r as any).latitude;
          const lngVal = (r as any).longitude;
          // Treat missing/null/invalid coords as "unknown distance" (null)
          const hasValidCoords =
            latVal !== null &&
            latVal !== undefined &&
            lngVal !== null &&
            lngVal !== undefined &&
            isFinite(Number(latVal)) &&
            isFinite(Number(lngVal));
          const dist = hasValidCoords
            ? haversineKm(userCoords.lat, userCoords.lng, Number(latVal), Number(lngVal))
            : null;
          return { ...r, __distanceKm: dist as number | null };
        })
        // Keep restaurants with unknown distance (null) and those within the radius.
        .filter(r => {
          // if distance is unknown -> keep
          if (r.__distanceKm === null) return true;
          // if distance is known -> only keep if within radius
          return r.__distanceKm <= RADIUS_KM;
        })
        // Sort: known distances ascending, unknown distances at the end
        .sort((a, b) => {
          const da = a.__distanceKm;
          const db = b.__distanceKm;
          if (da === null && db === null) return 0;
          if (da === null) return 1; // a unknown -> after b
          if (db === null) return -1; // b unknown -> after a
          return da - db;
        });
    } else {
      if (sortBy === 'rating') items.sort((a, b) => b.rating - a.rating);
      else if (sortBy === 'delivery') items.sort((a, b) => a.deliveryTime - b.deliveryTime);
    }

    if (category) items = items.filter(r => r.tags?.includes(category));
    if (onlyOpen) items = items.filter(r => r.isOpen);

    return items;
  }, [query, category, sortBy, onlyOpen, userCoords, hasAddress, allRestaurants]);
  // Render while we check for an address
  if (hasAddress === null) {
    return (
      <div className="min-h-screen bg-neutral-black text-neutral-white">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">Checking address…</div>
        </main>
      </div>
    );
  }


  if (hasAddress === false) {
  // we've already kicked off a router.replace in the effect above; render minimal UI while redirect happens
    return (
      <div className="min-h-screen bg-neutral-black text-neutral-white">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-neutral-400">Redirecting…</div>
        </main>
      </div>
    );
  }

  if (restaurantsLoading && hasAddress) {
    return (
      <div className="min-h-screen bg-neutral-black text-neutral-white">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-neutral-400">Loading restaurants…</div>
        </main>
      </div>
    );
  }

  // Normal browse UI when address exists
  return (
    <>
      <Head>
        <title>Browse — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-neutral-black text-neutral-white">
        <NavBar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <SearchBar value={query} onChange={(v) => { setQuery(v); try { localStorage.setItem('deliveryAddress', v); } catch {} }} placeholder="Search restaurants, cuisines or dishes..." />
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-sm text-neutral-white/70 mr-2">View</div>
                <button onClick={() => setView('grid')} className={`px-3 py-2 rounded-xl ${view === 'grid' ? 'bg-primary text-neutral-black' : 'bg-neutral-white/5'}`}>Grid</button>
                <button onClick={() => setView('list')} className={`px-3 py-2 rounded-xl ${view === 'list' ? 'bg-primary text-neutral-black' : 'bg-neutral-white/5'}`}>List</button>
              </div>
            </div>

            <FiltersBar selectedCategory={category} onSelectCategory={(c) => setCategory(prev => prev === c ? null : c)} sortBy={sortBy} onSortChange={setSortBy} onlyOpen={onlyOpen} onToggleOpen={() => setOnlyOpen(v => !v)} />

            <section>
              <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filtered.length === 0 && (
                  <div className="p-8 bg-neutral-white/3 rounded-xl">No restaurants match your search.</div>
                )}

                {filtered.map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} layout={view} />
                ))}
              </div>
            </section>
          </div>
        </main>

        <AddressModal isOpen={showModal} initial={query} onClose={() => setShowModal(false)} onSubmit={handleModalSubmit} />
      </div>
    </>
  );
}