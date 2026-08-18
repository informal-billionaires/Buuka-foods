import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      setLoading(false);
      return;
    }

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Sign in failed');
        setLoading(false);
        return;
      }

      const userId = signInData?.user?.id;
      if (!userId) {
        setError('Unable to determine user after sign-in.');
        setLoading(false);
        return;
      }

      // Check admins table for a matching row
      const { data: adminRow, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .single();

      if (adminError || !adminRow) {
        // Not authorized — sign out and show error
        await supabase.auth.signOut();
        setError('Not authorized');
        setLoading(false);
        return;
      }

      // authorized
      router.replace('/admin/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Unexpected error during sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Log in — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-neutral-900 text-neutral-white flex items-center justify-center py-12">
        <main className="w-full max-w-md px-6">
          <div className="bg-neutral-950 rounded-2xl p-6">
            <h1 className="text-xl font-bold mb-2">Admin log in</h1>
            <p className="text-sm text-neutral-400 mb-4">Sign in with your admin account.</p>

            {error && <div className="text-sm text-rose-400 mb-3">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold ${loading ? 'bg-neutral-white/5 text-neutral-500' : 'bg-primary text-black'}`}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm text-neutral-400">
              This site has no self-serve admin signup. If you need an admin account, contact the developer.
            </div>
          </div>
        </main>
      </div>
    </>
  );
}