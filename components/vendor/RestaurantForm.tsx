import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Restaurant } from './types';

export interface RestaurantFormProps {
  vendorId: string;
  onCreated: (restaurant: Restaurant) => void;
}

export default function RestaurantForm({ vendorId, onCreated }: RestaurantFormProps) {
  const [form, setForm] = useState({
    name: '',
    cuisine: '',
    description: '',
    location: '',
    hours: '',
    cover: '',
    logo: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gettingLocation, setGettingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function handleUseMyLocation() {
    setGeoError(null);

    if (!navigator?.geolocation) {
      setGeoError('Geolocation is not available in your browser.');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // update numeric lat/lng
        update('latitude', lat);
        update('longitude', lng);
        setGettingLocation(false);
      },
      (err) => {
        if (err && (err as any).code === 1) {
          setGeoError('Permission denied. Please allow location access in your browser.');
        } else {
          setGeoError('Unable to get your location. Please try again.');
        }
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.cuisine.trim()) {
      setError('Please provide at least a name and cuisine.');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        vendor_id: vendorId,
        name: form.name.trim(),
        cuisine: form.cuisine.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        hours: form.hours.trim() || null,
        cover: form.cover.trim() || null,
        logo: form.logo.trim() || null,
        latitude: form.latitude,
        longitude: form.longitude,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from<Restaurant>('restaurants')
        .insert([payload])
        .select()
        .single();

      if (insertErr) {
        setError(insertErr.message || 'Failed to create restaurant');
        return;
      }

      if (inserted) {
        onCreated(inserted);
        // clear form including coords
        setForm({
          name: '',
          cuisine: '',
          description: '',
          location: '',
          hours: '',
          cover: '',
          logo: '',
          latitude: null,
          longitude: null,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error creating restaurant');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Create your restaurant</h2>
      <p className="text-sm text-neutral-500 mt-1">Add details so customers can find you.</p>

      {error && <div className="text-sm text-rose-400 mt-3">{error}</div>}

      <form onSubmit={handleCreate} className="mt-4 space-y-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Cuisine</label>
          <input
            value={form.cuisine}
            onChange={(e) => update('cuisine', e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Description</label>
          <input
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Location</label>
            <input
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={gettingLocation}
                className={`px-3 py-1.5 rounded-full text-sm ${gettingLocation ? 'bg-neutral-200 text-neutral-500' : 'bg-primary text-black font-semibold'}`}
              >
                {gettingLocation ? 'Getting location…' : '📍 Use my current location'}
              </button>

              {form.latitude !== null && form.longitude !== null && (
                <div className="text-sm text-green-400">✓ Location set</div>
              )}
            </div>

            {geoError && <div className="text-sm text-rose-400 mt-2">{geoError}</div>}
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1">Hours</label>
            <input
              value={form.hours}
              onChange={(e) => update('hours', e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Cover image URL (optional)</label>
          <input
            value={form.cover}
            onChange={(e) => update('cover', e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Logo image URL (optional)</label>
          <input
            value={form.logo}
            onChange={(e) => update('logo', e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 mt-3">
          <button
            type="submit"
            disabled={creating}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${creating ? 'bg-neutral-200 text-neutral-500' : 'bg-primary text-black'}`}
          >
            {creating ? 'Creating…' : 'Create restaurant'}
          </button>
        </div>
      </form>
    </div>
  );
}