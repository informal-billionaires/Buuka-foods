import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Vendor, Margin } from './types';

export interface VendorAdminCardProps {
  vendor: Vendor;
  adminId: string;
  margin?: Margin | null;
  restaurant?: {
    id: string;
    vendor_id: string;
    name: string | null;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    pending_name: string | null;
    pending_location: string | null;
    pending_latitude: number | null;
    pending_longitude: number | null;
    pending_submitted_at: string | null;
  } | null;
  onStatusChange: (vendorId: string, status: Vendor['status']) => void;
  onMarginSaved: (vendorId: string, percentage: number, marginRow: Margin) => void;
}

export default function VendorAdminCard({
  vendor,
  adminId,
  margin,
  restaurant,
  onStatusChange,
  onMarginSaved,
}: VendorAdminCardProps) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [marginValue, setMarginValue] = useState<number>(margin?.percentage ?? 15);
  const [marginLoading, setMarginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // local copy of restaurant for optimistic updates and UI after approve/reject
  const [localRestaurant, setLocalRestaurant] = useState<typeof restaurant>(restaurant ?? null);

  useEffect(() => {
    setLocalRestaurant(restaurant ?? null);
  }, [restaurant]);

  async function updateStatus(newStatus: Vendor['status']) {
    if (!vendor?.id) return;
    setError(null);
    setStatusLoading(true);
    try {
      const { error: updErr } = await supabase
        .from('vendors')
        .update({ status: newStatus })
        .eq('id', vendor.id);

      if (updErr) {
        setError(updErr.message || 'Failed to update status');
        return;
      }

      onStatusChange(vendor.id, newStatus);
    } catch (err: any) {
      setError(err?.message || 'Unexpected error updating status');
    } finally {
      setStatusLoading(false);
    }
  }

  async function saveMargin() {
    if (!vendor?.id) return;
    setError(null);
    setMarginLoading(true);
    try {
      const payload = {
        vendor_id: vendor.id,
        percentage: Number(marginValue),
        set_by: adminId,
      };

      // upsert margin row by vendor_id (onConflict vendor_id)
      const { data, error: upsertErr } = await supabase
        .from<Margin>('margins')
        .upsert([payload], { onConflict: 'vendor_id' })
        .select()
        .single();

      if (upsertErr) {
        setError(upsertErr.message || 'Failed to save margin');
        return;
      }

      if (data) {
        onMarginSaved(vendor.id, Number(data.percentage), data);
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error saving margin');
    } finally {
      setMarginLoading(false);
    }
  }

  function statusBadge(status?: Vendor['status']) {
    if (status === 'approved') return <span className="px-2 py-1 rounded-full bg-green-500 text-black text-xs font-semibold">Approved</span>;
    if (status === 'rejected') return <span className="px-2 py-1 rounded-full bg-rose-400 text-black text-xs font-semibold">Rejected</span>;
    return <span className="px-2 py-1 rounded-full bg-yellow-400 text-black text-xs font-semibold">Pending</span>;
  }

  const noRestaurant = !restaurant;
  const missingLocation = !!restaurant && (restaurant.latitude == null || restaurant.longitude == null);

  // per your instruction: derived boolean (keeps the exact requested form)
  const hasPendingChange = !!restaurant && !!restaurant.pending_submitted_at;

  // For UI rendering and optimistic updates, prefer localRestaurant when present
  const pendingTimestamp = localRestaurant?.pending_submitted_at ?? restaurant?.pending_submitted_at;
  const hasPending = !!pendingTimestamp;

  // verify state for admin geolocation check against pending coords
  const [adminCoords, setAdminCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyDistanceKm, setVerifyDistanceKm] = useState<number | null>(null);

  // approve/reject loading
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (v: number) => v * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async function verifyWithMyLocation() {
    setVerifyError(null);
    setVerifyDistanceKm(null);
    if (!localRestaurant?.pending_latitude || !localRestaurant?.pending_longitude) {
      setVerifyError('No pending coordinates to verify.');
      return;
    }
    if (!navigator?.geolocation) {
      setVerifyError('Geolocation is not available in your browser.');
      return;
    }

    setVerifying(true);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setAdminCoords({ lat, lng });
          const dist = haversineKm(lat, lng, Number(localRestaurant.pending_latitude), Number(localRestaurant.pending_longitude));
          setVerifyDistanceKm(dist);
          setVerifying(false);
        },
        (err) => {
          if (err && (err as any).code === 1) {
            setVerifyError('Permission denied. Please allow location access in your browser.');
          } else {
            setVerifyError('Unable to get your location. Please try again.');
          }
          setVerifying(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (err: any) {
      setVerifyError(err?.message || 'Unexpected error obtaining location.');
      setVerifying(false);
    }
  }

  async function approveChanges() {
    if (!localRestaurant?.id) return;
    setError(null);
    setApproving(true);
    try {
      const payload = {
        name: localRestaurant.pending_name,
        location: localRestaurant.pending_location,
        latitude: localRestaurant.pending_latitude,
        longitude: localRestaurant.pending_longitude,
        pending_name: null,
        pending_location: null,
        pending_latitude: null,
        pending_longitude: null,
        pending_submitted_at: null,
      };

      const { data: updated, error: updateErr } = await supabase
        .from('restaurants')
        .update(payload)
        .eq('id', localRestaurant.id)
        .select()
        .single();

      if (updateErr) {
        setError(updateErr.message || 'Failed to approve changes');
        return;
      }

      if (updated) {
        // optimistic/local update: replace localRestaurant with updated values
        setLocalRestaurant({
          id: updated.id,
          vendor_id: updated.vendor_id,
          name: updated.name ?? null,
          location: updated.location ?? null,
          latitude: typeof updated.latitude === 'number' ? updated.latitude : (updated.latitude == null ? null : Number(updated.latitude)),
          longitude: typeof updated.longitude === 'number' ? updated.longitude : (updated.longitude == null ? null : Number(updated.longitude)),
          pending_name: null,
          pending_location: null,
          pending_latitude: null,
          pending_longitude: null,
          pending_submitted_at: null,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error approving changes');
    } finally {
      setApproving(false);
    }
  }

  async function rejectChanges() {
    if (!localRestaurant?.id) return;
    setError(null);
    setRejecting(true);
    try {
      const payload = {
        pending_name: null,
        pending_location: null,
        pending_latitude: null,
        pending_longitude: null,
        pending_submitted_at: null,
      };

      const { data: updated, error: updateErr } = await supabase
        .from('restaurants')
        .update(payload)
        .eq('id', localRestaurant.id)
        .select()
        .single();

      if (updateErr) {
        setError(updateErr.message || 'Failed to reject changes');
        return;
      }

      if (updated) {
        // optimistic/local update: clear pending fields
        setLocalRestaurant(prev => prev ? {
          ...prev,
          pending_name: null,
          pending_location: null,
          pending_latitude: null,
          pending_longitude: null,
          pending_submitted_at: null,
        } : prev);
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error rejecting changes');
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="bg-neutral-950 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="text-base font-semibold">{vendor.business_name || 'Unnamed'}</div>
            {statusBadge(vendor.status)}
            {noRestaurant ? (
              <div className="text-sm text-orange-400 ml-2">⚠️ No restaurant created</div>
            ) : missingLocation ? (
              <div className="text-sm text-yellow-400 ml-2">📍 Location missing</div>
            ) : null}
          </div>

          <div className="mt-2 text-sm text-neutral-400">
            <div>{vendor.cuisine || '—'}</div>
            <div className="mt-1 text-xs text-neutral-500">{vendor.email || '—'}</div>
            <div className="mt-1 text-xs text-neutral-500">{vendor.phone || '—'}</div>
            <div className="mt-1 text-xs text-neutral-500">{vendor.location || '—'}</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-sm font-semibold">Added {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : '—'}</div>

          <div className="flex items-center gap-2">
            {vendor.status === 'pending' && (
              <>
                <button
                  onClick={() => updateStatus('approved')}
                  disabled={statusLoading}
                  className="px-3 py-1.5 rounded-full bg-primary text-black text-sm font-semibold"
                >
                  {statusLoading ? 'Saving…' : 'Approve'}
                </button>

                <button
                  onClick={() => updateStatus('rejected')}
                  disabled={statusLoading}
                  className="px-3 py-1.5 rounded-full bg-neutral-white/5 text-sm"
                >
                  {statusLoading ? 'Saving…' : 'Reject'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-neutral-800 pt-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-neutral-400">Margin (%)</label>
          <input
            type="number"
            value={marginValue}
            onChange={(e) => setMarginValue(Number(e.target.value))}
            className="w-24 px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
            min={0}
            max={100}
          />
          <button
            onClick={saveMargin}
            disabled={marginLoading}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold ${marginLoading ? 'bg-neutral-white/5 text-neutral-500' : 'bg-primary text-black'}`}
          >
            {marginLoading ? 'Saving…' : 'Save'}
          </button>
        </div>

        {error && <div className="mt-3 text-sm text-rose-400">{error}</div>}
      </div>

      {/* Pending changes panel (render when there's a pending submission) */}
      {hasPending && (
        <div className="mt-4 bg-neutral-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm text-yellow-400 font-semibold">🕒 Pending changes</div>
            <div className="text-xs text-neutral-500">Submitted {localRestaurant?.pending_submitted_at ? new Date(localRestaurant.pending_submitted_at).toLocaleString() : '—'}</div>
          </div>

          {/* Show rows for each changed sensitive field */}
          <div className="space-y-2">
            {localRestaurant && localRestaurant.pending_name != null && (localRestaurant.pending_name !== localRestaurant.name) && (
              <div className="flex items-center gap-2 text-sm">
                <div className="text-neutral-500 w-24">Name:</div>
                <div className="text-neutral-500">{localRestaurant.name ?? '—'}</div>
                <div className="text-neutral-400">→</div>
                <div className="text-primary font-medium">{localRestaurant.pending_name}</div>
              </div>
            )}

            {localRestaurant && localRestaurant.pending_location != null && (localRestaurant.pending_location !== localRestaurant.location) && (
              <div className="flex items-center gap-2 text-sm">
                <div className="text-neutral-500 w-24">Location:</div>
                <div className="text-neutral-500">{localRestaurant.location ?? '—'}</div>
                <div className="text-neutral-400">→</div>
                <div className="text-primary font-medium">{localRestaurant.pending_location}</div>
              </div>
            )}

            {localRestaurant && (localRestaurant.pending_latitude != null || localRestaurant.pending_longitude != null) && (
              // show lat/lng row only if pending differs from current
              ((localRestaurant.pending_latitude !== localRestaurant.latitude) || (localRestaurant.pending_longitude !== localRestaurant.longitude)) && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-neutral-500 w-24">Coordinates:</div>
                  <div className="text-neutral-500">{(localRestaurant.latitude != null && localRestaurant.longitude != null) ? `${localRestaurant.latitude}, ${localRestaurant.longitude}` : '—'}</div>
                  <div className="text-neutral-400">→</div>
                  <div className="text-primary font-medium">
                    {(localRestaurant.pending_latitude != null && localRestaurant.pending_longitude != null)
                      ? `${localRestaurant.pending_latitude}, ${localRestaurant.pending_longitude}`
                      : '—'}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Map link (if pending coords present) */}
          {localRestaurant?.pending_latitude != null && localRestaurant?.pending_longitude != null && (
            <div className="mt-3">
              <a
                href={`https://www.google.com/maps?q=${localRestaurant.pending_latitude},${localRestaurant.pending_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline text-sm"
              >
                View pending location on map
              </a>
            </div>
          )}

          {/* Verify with admin location */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={verifyWithMyLocation}
              disabled={verifying}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${verifying ? 'bg-neutral-white/5 text-neutral-500' : 'bg-primary text-black'}`}
            >
              {verifying ? 'Checking…' : 'Verify with my location'}
            </button>

            {verifyError && <div className="text-sm text-rose-400">{verifyError}</div>}
            {verifyDistanceKm != null && <div className="text-sm text-neutral-400">You are approximately {verifyDistanceKm.toFixed(1)} km from the submitted location.</div>}
          </div>

          {/* Approve / Reject actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={approveChanges}
              disabled={approving}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${approving ? 'bg-neutral-white/5 text-neutral-500' : 'bg-primary text-black'}`}
            >
              {approving ? 'Approving…' : 'Approve changes'}
            </button>

            <button
              onClick={rejectChanges}
              disabled={rejecting}
              className={`px-4 py-2 rounded-full text-sm ${rejecting ? 'bg-neutral-white/5 text-neutral-500' : 'bg-neutral-white/5'}`}
            >
              {rejecting ? 'Rejecting…' : 'Reject changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}