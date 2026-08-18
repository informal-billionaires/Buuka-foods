import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function CustomerSignupPage() {
  const router = useRouter();

  const redirectTo = typeof router.query.redirectTo === 'string' ? router.query.redirectTo : '/';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please provide your name, email and a password.');
      return;
    }

    setLoading(true);
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpErr) {
        setError(signUpErr.message || 'Sign up failed');
        setLoading(false);
        return;
      }

      const userId = signUpData?.user?.id;
      if (!userId) {
        setError('Unable to create account. Please try again.');
        setLoading(false);
        return;
      }

      // Insert customers row with id = auth user id
      const payload = {
        id: userId,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      };

      const { error: insertErr } = await supabase.from('customers').insert([payload]);

      if (insertErr) {
        // Show error. Do not try to remove the auth user here.
        setError(insertErr.message || 'Failed to create customer record.');
        setLoading(false);
        return;
      }

      // Success - redirect to homepage
      router.replace(redirectTo);
    } catch (err: any) {
      setError(err?.message || 'Unexpected error during sign up');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Sign up — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-neutral-900 text-neutral-white flex items-center justify-center py-12">
        <main className="w-full max-w-md px-6">
          <div className="bg-neutral-950 rounded-2xl p-6">
            <h1 className="text-xl font-bold mb-2">Create account</h1>
            <p className="text-sm text-neutral-400 mb-4">Sign up to order from your favourite restaurants.</p>

            {error && <div className="text-sm text-rose-400 mb-3">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                  required
                />
              </div>

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
                <label className="block text-xs text-neutral-400 mb-1">Phone (optional)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
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
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm text-neutral-400">
              Already have an account? 
              <a className="text-primary underline"
              href={redirectTo !== '/' ? `/account/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/account/login'}>
                Log in
              </a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}