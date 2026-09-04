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
  const R = 6371;
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

  const skippedRef = useRef(false);

  const RADIUS_KM = 10;

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.skipAddressPrompt === '1') {
      skippedRef.current = true;
      try { sessionStorage.setItem('skipAddressPrompt', '1'); } catch {}
      setHasAddress(true);
      const { skipAddressPrompt, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
      return;
    }

    if (skippedRef.current) return;

    if (router.query.enterAddress) {
      setShowModal(true);
      const { enterAddress, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
      return;
    }

    const latQ = typeof router.query.lat === 'string' ? Number(router.query.lat) : undefined;
    const lngQ = typeof router.query.lng === 'string' ? Number(router.query.lng) : undefined;
    if (typeof latQ === 'number' && !Number.isNaN(latQ) && typeof lngQ === 'number' && !Number.isNaN(lngQ)) {
      setUserCoords({ lat: latQ, lng: lngQ });
      setHasAddress(true);
      try { localStorage.setItem('deliveryCoords', `${latQ},${lngQ}`); } catch {}
      return;
    }

    const qParam = typeof router.query.q === 'string' ? router.query.q : '';
    if (qParam) {
      setQuery(qParam);
      setHasAddress(true);
      try { localStorage.setItem('deliveryAddress', qParam); } catch {}
      return;
    }

    try {
      if (sessionStorage.getItem('skipAddressPrompt') === '1') {
        setHasAddress(true);
        return;
      }
    } catch {}

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

  useEffect(() => {
    if (!router.isReady) return;
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
        console.error('Error loading restaurants', err);
        if (mounted) setAllRestaurants([]);
      } finally {
        if (mounted) setRestaurantsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
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
        .filter(r => {
          if (r.__distanceKm === null) return true;
          return r.__distanceKm <= RADIUS_KM;
        })
        .sort((a, b) => {
          const da = a.__distanceKm;
          const db = b.__distanceKm;
          if (da === null && db === null) return 0;
          if (da === null) return 1;
          if (db === null) return -1;
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

  if (hasAddress === null) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">Checking address…</div>
        </main>
      </div>
    );
  }

  if (hasAddress === false) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-neutral-500">Redirecting…</div>
        </main>
      </div>
    );
  }

  if (restaurantsLoading && hasAddress) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-neutral-500">Loading restaurants…</div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Browse — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <NavBar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <SearchBar value={query} onChange={(v) => { setQuery(v); try { localStorage.setItem('deliveryAddress', v); } catch {} }} placeholder="Search restaurants, cuisines or dishes..." />
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-sm text-neutral-500 mr-2">View</div>
                <button onClick={() => setView('grid')} className={`px-3 py-2 rounded-xl ${view === 'grid' ? 'bg-primary text-white' : 'bg-white border border-neutral-200 text-neutral-700'}`}>Grid</button>
                <button onClick={() => setView('list')} className={`px-3 py-2 rounded-xl ${view === 'list' ? 'bg-primary text-white' : 'bg-white border border-neutral-200 text-neutral-700'}`}>List</button>
              </div>
            </div>

            <FiltersBar selectedCategory={category} onSelectCategory={(c) => setCategory(prev => prev === c ? null : c)} sortBy={sortBy} onSortChange={setSortBy} onlyOpen={onlyOpen} onToggleOpen={() => setOnlyOpen(v => !v)} />

            <section>
              <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filtered.length === 0 && (
                  <div className="p-8 bg-white border border-neutral-200 rounded-xl text-neutral-500">No restaurants match your search.</div>
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