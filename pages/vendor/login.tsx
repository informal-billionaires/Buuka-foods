import Head from 'next/head';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

interface VendorLoginForm {
  email: string;
  password: string;
}

export default function VendorLogin() {
  const router = useRouter();
  const [form, setForm] = useState<VendorLoginForm>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejectedMessage, setRejectedMessage] = useState<string | null>(null);

  function update<K extends keyof VendorLoginForm>(k: K, v: VendorLoginForm[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRejectedMessage(null);
    setLoading(true);

    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.');
      setLoading(false);
      return;
    }

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
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

      // fetch vendor row
      const { data: vendorRow, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', userId)
        .single();

      if (vendorError) {
        setError(vendorError.message || 'Failed to load vendor profile.');
        setLoading(false);
        return;
      }

      const status = (vendorRow as any)?.status;
      if (status === 'pending') {
        router.push('/vendor/pending');
        return;
      }
      if (status === 'approved') {
        router.push('/vendor/dashboard');
        return;
      }
      if (status === 'rejected') {
        setRejectedMessage('Your application was rejected. Please contact support for more information.');
        setLoading(false);
        return;
      }

      // default fallback
      router.push('/vendor/pending');
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Vendor Log in — Bukka Foods</title></Head>

      <div className="min-h-screen bg-neutral-900 text-neutral-white flex items-center justify-center py-12">
        <main className="w-full max-w-md px-6">
          <div className="bg-neutral-950 rounded-2xl p-6">
            <h1 className="text-xl font-bold mb-2">Vendor log in</h1>
            <p className="text-sm text-neutral-400 mb-4">Access your vendor dashboard and application status.</p>

            {error && <div className="text-sm text-rose-400 mb-3">{error}</div>}
            {rejectedMessage && <div className="text-sm text-rose-400 mb-3">{rejectedMessage}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  type="email"
                  className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Password</label>
                <input
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
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
              Don't have an account?{' '}
              <Link href="/vendor/signup" className="text-primary font-medium">Sign up</Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}