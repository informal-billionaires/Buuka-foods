import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

export default function VendorPending() {
  return (
    <>
      <Head><title>Application submitted — Bukka Foods</title></Head>

      <div className="min-h-screen bg-neutral-900 text-neutral-white flex items-center justify-center">
        <main className="max-w-2xl w-full px-6 py-12">
          <div className="bg-neutral-950 rounded-2xl p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Thanks — your application is under review</h1>
            <p className="text-sm text-neutral-400 mb-6">
              We have received your vendor application. Our team will review it and notify you once it's approved.
            </p>

            <div className="flex justify-center">
              <Link href="/" className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-black text-sm font-semibold">
                Back to homepage
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}