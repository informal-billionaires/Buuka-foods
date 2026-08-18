// Client-side geocoding helper that tries OpenCage (if NEXT_PUBLIC_OPENCAGE_KEY) and falls back to Nominatim.
// Returns { lat, lng, formatted } or throws.
export type GeocodeResult = { lat: number; lng: number; formatted?: string };

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const q = encodeURIComponent(address.trim());
  // Prefer OpenCage if key is available
  const key = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_OPENCAGE_KEY || '') : (process.env.NEXT_PUBLIC_OPENCAGE_KEY || '');
  if (key) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${q}&key=${key}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocode (OpenCage) failed');
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      return { lat: r.geometry.lat, lng: r.geometry.lng, formatted: r.formatted };
    }
    throw new Error('No results from geocoder');
  }

  // Fallback to Nominatim (no key) — rate-limited; include email in user-agent ideally.
  const nomUrl = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
  const res2 = await fetch(nomUrl, { headers: { 'Accept-Language': 'en' } });
  if (!res2.ok) throw new Error('Geocode (Nominatim) failed');
  const data2 = await res2.json();
  if (Array.isArray(data2) && data2.length > 0) {
    const r = data2[0];
    return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), formatted: r.display_name };
  }
  throw new Error('No results from geocoder (fallback)');
}