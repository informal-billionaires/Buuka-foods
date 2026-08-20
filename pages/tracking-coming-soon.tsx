import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';

export default function TrackingComingSoonPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Live Tracking — Bukka Foods</title>
      </Head>
      <div className="min-h-screen bg-page text-neutral-900">
        <NavBar />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-surface border border-neutral-200 rounded-2xl p-10 shadow-sm">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-primary">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <h1 className="text-xl font-bold mb-2">Live tracking is coming soon</h1>
            <p className="text-sm text-muted mb-6">
              We're building real-time rider tracking so you can watch your order arrive on a map. Until then, check your order's status right here on the orders page.
            </p>
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-full bg-primary text-neutral-white text-sm font-semibold"
            >
              Back to Orders
            </button>
          </div>
        </main>
      </div>
    </>
  );
}