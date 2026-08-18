import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import type { Restaurant } from './types';

export interface RestaurantSummaryProps {
  restaurant: Restaurant;
  onUpdated: (restaurant: Restaurant) => void;
  vendorName?: string;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
}
export default function RestaurantSummary({
  restaurant,
  onUpdated,
  vendorName,
  editing,
  onEditingChange,
}: RestaurantSummaryProps) {
  const [form, setForm] = useState({
    name: restaurant.name || '',
    cuisine: restaurant.cuisine || '',
    description: restaurant.description || '',
    location: restaurant.location || '',
    hours: restaurant.hours || '',
    cover: restaurant.cover || '',
    logo: restaurant.logo || '',
    is_open: restaurant.is_open ?? true,
    latitude: restaurant.latitude ?? null as number | null,
    longitude: restaurant.longitude ?? null as number | null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gettingLocation, setGettingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // NEW: track whether vendor has pending sensitive changes awaiting admin approval
  const [pendingNotice, setPendingNotice] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function enterEdit() {
    setForm({
      name: restaurant.name || '',
      cuisine: restaurant.cuisine || '',
      description: restaurant.description || '',
      location: restaurant.location || '',
      hours: restaurant.hours || '',
      cover: restaurant.cover || '',
      logo: restaurant.logo || '',
      is_open: restaurant.is_open ?? true,
      latitude: restaurant.latitude ?? null,
      longitude: restaurant.longitude ?? null,
    });
    setError(null);
    onEditingChange(true);
  }

  function cancelEdit() {
    onEditingChange(false);
    setError(null);
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

  async function saveEdit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.cuisine.trim()) {
      setError('Name and cuisine are required.');
      return;
    }

    // Determine if any sensitive fields changed (name, location, latitude, longitude)
    const newName = form.name.trim();
    const currentName = restaurant.name || '';
    const newLocation = form.location.trim();
    const currentLocation = restaurant.location ?? '';
    const newLat = form.latitude ?? null;
    const currentLat = restaurant.latitude ?? null;
    const newLng = form.longitude ?? null;
    const currentLng = restaurant.longitude ?? null;

    const sensitiveChanged =
      newName !== currentName ||
      newLocation !== currentLocation ||
      (newLat === null ? currentLat !== null : currentLat === null ? true : Number(newLat) !== Number(currentLat)) ||
      (newLng === null ? currentLng !== null : currentLng === null ? true : Number(newLng) !== Number(currentLng));

    setSaving(true);
    try {
      // Build payload: always include the non-sensitive live-updated fields
      const livePayload: any = {
        cuisine: form.cuisine.trim(),
        description: form.description.trim() || null,
        hours: form.hours.trim() || null,
        cover: form.cover.trim() || null,
        logo: form.logo.trim() || null,
        is_open: form.is_open,
      };

      if (sensitiveChanged) {
        // Do NOT write live sensitive fields. Instead include pending_* fields.
        Object.assign(livePayload, {
          pending_name: newName,
          pending_location: newLocation || null,
          pending_latitude: newLat,
          pending_longitude: newLng,
          pending_submitted_at: new Date().toISOString(),
        });
      } else {
        // No sensitive changes: write everything live (including sensitive fields)
        Object.assign(livePayload, {
          name: newName,
          location: newLocation || null,
          latitude: newLat,
          longitude: newLng,
        });
      }

      const { data: updated, error: updateError } = await supabase
        .from<Restaurant>('restaurants')
        .update(livePayload)
        .eq('id', restaurant.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message || 'Failed to update restaurant.');
        return;
      }

      if (updated) {
        onUpdated(updated);
        onEditingChange(false);

        if (sensitiveChanged) {
          // Show a persistent notice in the non-editing view until next successful save without pending changes
          setPendingNotice(true);
        } else {
          // Clear any pending notice if we just saved without pending changes
          setPendingNotice(false);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error saving restaurant');
    } finally {
      setSaving(false);
    }
  }

    if (!editing) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-neutral-100 rounded-2xl p-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Welcome back{vendorName ? `, ${vendorName}` : ''}! 👋
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Here&apos;s what&apos;s happening with your restaurant today.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={`/restaurants/${restaurant.id}`}
              target="_blank"
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              View Store
            </Link>
            <Link
              href="/vendor/menu-items"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black"
            >
              + Add Item
            </Link>
          </div>
        </div>

        <div className="bg-white border border-neutral-100 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              {restaurant.logo ? (
                <img
                  src={restaurant.logo}
                  alt={restaurant.name}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-900 font-bold text-white">
                  {restaurant.name ? restaurant.name.slice(0, 2).toUpperCase() : 'R'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="truncate text-lg font-semibold text-neutral-900">
                    {restaurant.name}
                  </h3>
                  <button
                    onClick={enterEdit}
                    className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-200"
                  >
                    Edit
                  </button>
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {restaurant.cuisine}
                </p>
                {restaurant.description && (
                  <p className="mt-2 text-sm text-neutral-500">
                    {restaurant.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          {pendingNotice && (
            <p className="mt-4 text-sm text-yellow-600">
              Your name/location changes are pending admin approval.
            </p>
          )}
        </div>
      </div>
    );
  }


  // editing UI
  return (
    <form onSubmit={saveEdit} className="	bg-white border border-neutral-100 rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-neutral-500">Edit restaurant</div>
          <div className="text-lg font-semibold mb-2">Update details</div>
        </div>

        <div className="text-right">
          {restaurant.cover && <img src={restaurant.cover} alt={restaurant.name} className="mt-3 w-40 h-24 object-cover rounded-md" />}
        </div>
      </div>

      {error && <div className="text-sm text-rose-400 mt-3">{error}</div>}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Cuisine</label>
          <input
            value={form.cuisine}
            onChange={(e) => update('cuisine', e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 text-sm"
            required
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs text-neutral-500 mb-1">Description</label>
        <input
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 text-sm"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Location</label>
          <input
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 text-sm"
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
            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 text-sm"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <label className="block text-xs text-neutral-500">Restaurant status</label>
        <button
          type="button"
          onClick={() => update('is_open', !form.is_open)}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.is_open ? 'bg-emerald-500' : 'bg-neutral-300'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              form.is_open ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-neutral-700">{form.is_open ? 'Open' : 'Closed'}</span>
      </div>
      <div className="mt-3">
        <label className="block text-xs text-neutral-500 mb-1">Logo image URL</label>
        <input
          value={form.logo}
          onChange={(e) => update('logo', e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 text-sm"
        />
      </div>
      <div className="mt-3">
        <label className="block text-xs text-neutral-500 mb-1">Cover image URL</label>
        <input
          value={form.cover}
          onChange={(e) => update('cover', e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 text-sm"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${saving ? 'bg-neutral-200 text-neutral-500' : 'bg-primary text-black'}`}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        <button
          type="button"
          onClick={cancelEdit}
          className="px-4 py-2 rounded-full text-sm bg-neutral-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
