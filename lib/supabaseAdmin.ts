import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 *
 * This bypasses RLS entirely. It must NEVER be imported from:
 *   - any React component or page (client-side code)
 *   - lib/restaurants.ts or any other module that runs in the browser
 *
 * Only import this from pages/api/** route handlers or other files
 * that only ever run on the server.
 *
 * The guard below is a cheap safety net, not a substitute for
 * disciplined imports — if this ever gets bundled client-side,
 * SUPABASE_SERVICE_ROLE_KEY would need to be exposed via
 * NEXT_PUBLIC_*, which should never happen.
 */
if (typeof window !== 'undefined') {
  throw new Error('lib/supabaseAdmin.ts was imported client-side. This must only be used in API routes.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing server env vars. Add SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix) to .env.local — ' +
      'get it from Supabase dashboard > Project Settings > API > service_role key.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});