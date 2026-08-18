import Head from 'next/head';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

interface VendorSignUpForm {
  businessName: string;
  cuisine: string;
  phone?: string;
  location?: string;
  email: string;
  password: string;
}

export default function VendorSignUp() {
  const router = useRouter();

  const [form, setForm] = useState<VendorSignUpForm>({
    businessName: '',
    cuisine: '',
    phone: '',
    location: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof VendorSignUpForm>(key: K, value: VendorSignUpForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // basic validation
    if (!form.businessName.trim() || !form.cuisine.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in the required fields.');
      setLoading(false);
      return;
    }

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });

      if (signUpError) {
        setError(signUpError.message || 'Sign up failed');
        setLoading(false);
        return;
      }

      const userId = signUpData?.user?.id;
      if (!userId) {
        // Unexpected: signUp succeeded but no user id returned
        setError('Unable to determine user id after sign up.');
        setLoading(false);
        return;
      }

      // insert vendor row
      const { error: insertError } = await supabase.from('vendors').insert([{
        id: userId,
        business_name: form.businessName.trim(),
        cuisine: form.cuisine.trim(),
        phone: form.phone?.trim() || null,
        email: form.email.trim(),
        location: form.location?.trim() || null,
        status: 'pending',
      }]);

      if (insertError) {
        setError(insertError.message || 'Failed to create vendor profile.');
        setLoading(false);
        return;
      }

      // success: redirect to pending
      router.push('/vendor/pending');
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Vendor Sign up — Bukka Foods</title></Head>

      <div className="min-h-screen bg-neutral-900 text-neutral-white flex items-center justify-center py-12">
        <main className="w-full max-w-md px-6">
          <div className="bg-neutral-950 rounded-2xl p-6">
            <h1 className="text-xl font-bold mb-2">Create a vendor account</h1>
            <p className="text-sm text-neutral-400 mb-4">Tell us about your business so we can review your application.</p>

            {error && (
              <div className="text-sm text-rose-400 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Business name</label>
                <input
                  value={form.businessName}
                  onChange={(e) => update('businessName', e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Cuisine</label>
                <input
                  value={form.cuisine}
                  onChange={(e) => update('cuisine', e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Phone (optional)</label>
                <input
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Location (optional)</label>
                <input
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                />
              </div>

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
                  {loading ? 'Signing up…' : 'Sign up'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm text-neutral-400">
              Already have an account?{' '}
              <Link href="/vendor/login" className="text-primary font-medium">Log in</Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}