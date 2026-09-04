import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function CustomerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Sign in failed');
        setLoading(false);
        return;
      }

      const redirectTo = typeof router.query.redirectTo === 'string' ? router.query.redirectTo : '/';
      router.replace(redirectTo);
    } catch (err: any) {
      setError(err?.message || 'Unexpected error during sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Log in — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center py-12">
        <main className="w-full max-w-md px-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <h1 className="text-xl font-bold mb-2">Log in</h1>
            <p className="text-sm text-neutral-500 mb-4">Sign in to your account.</p>

            {error && <div className="text-sm text-rose-600 mb-3">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm text-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm text-neutral-900"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold ${loading ? 'bg-neutral-100 text-neutral-400' : 'bg-primary text-white'}`}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm text-neutral-500">
              Don't have an account? <a className="text-primary underline" href={router.query.redirectTo ? 
              `/account/signup?redirectTo=${encodeURIComponent(router.query.redirectTo as string)}` : 
              '/account/signup'}>
              Create one
            </a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}