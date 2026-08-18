import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

export default function VendorLanding() {
  return (
    <>
      <Head>
        <title>Become a Vendor — Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-neutral-900 text-neutral-white flex items-center justify-center">
        <main className="max-w-3xl w-full px-6 py-12">
          <div className="bg-neutral-950 rounded-2xl p-8 shadow-md">
            <h1 className="text-2xl font-extrabold mb-3">Partner with Bukka Foods</h1>
            <p className="text-sm text-neutral-400 mb-6">
              Reach more customers and grow your business. Sign up to join Bukka Foods as a vendor —
              we'll review your application and get you live as soon as you're approved.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/vendor/signup"
                className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-black text-sm font-semibold"
              >
                Sign up
              </Link>

              <Link
                href="/vendor/login"
                className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-neutral-white/5 text-sm"
              >
                Log in
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}