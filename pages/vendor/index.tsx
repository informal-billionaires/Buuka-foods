import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { Store, TrendingUp, Users, ShieldCheck, Headphones, LogIn } from 'lucide-react';

export default function VendorLanding() {
  return (
    <>
      <Head>
        <title>Become a Vendor Bukka Foods</title>
      </Head>

      <div className="min-h-screen bg-page py-10 px-4 sm:px-6">
        <main className="max-w-6xl mx-auto">
          {/* Hero card */}
          <div className="bg-surface rounded-2xl shadow-md border border-neutral-lightGray px-6 sm:px-10 py-10 sm:py-14 grid md:grid-cols-2 gap-10 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-neutral-cream text-primary-deep text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Store size={14} />
                Join our growing community
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-neutral-charcoal mb-2">
                Partner with
              </h1>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-primary mb-5">
                Bukka Foods
              </h1>

              <p className="text-muted text-base leading-relaxed mb-8 max-w-md">
                Reach more customers and grow your business. Sign up to join Bukka Foods as a vendor
                we'll review your application and get you live as soon as you're approved.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/vendor/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-neutral-white text-sm font-semibold"
                >
                  <Store size={16} />
                  Sign up
                </Link>

                <Link
                  href="/vendor/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-neutral-white border border-neutral-lightGray text-neutral-charcoal text-sm font-semibold"
                >
                  <LogIn size={16} />
                  Log in
                </Link>
              </div>
            </div>

            {/* Right: illustration */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-neutral-cream" />

              <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                <Image
                  src="/images/vendor-hero-shop.png"
                  alt="Bukka Foods vendor storefront illustration"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Floating badges */}
              <div className="absolute top-2 right-0 sm:right-4 bg-surface border border-neutral-lightGray rounded-2xl shadow-sm px-4 py-3 flex flex-col items-center text-center w-24">
                <Users size={18} className="text-primary mb-1" />
                <span className="text-xs font-semibold text-neutral-charcoal leading-tight">More Customers</span>
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 left-0 sm:-left-4 bg-surface border border-neutral-lightGray rounded-2xl shadow-sm px-4 py-3 flex flex-col items-center text-center w-24">
                <TrendingUp size={18} className="text-primary mb-1" />
                <span className="text-xs font-semibold text-neutral-charcoal leading-tight">Grow Your Business</span>
              </div>

              <div className="absolute bottom-2 right-0 sm:right-4 bg-surface border border-neutral-lightGray rounded-2xl shadow-sm px-4 py-3 flex flex-col items-center text-center w-24">
                <ShieldCheck size={18} className="text-primary mb-1" />
                <span className="text-xs font-semibold text-neutral-charcoal leading-tight">Trusted Platform</span>
              </div>
            </div>
          </div>

          {/* Feature row */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mt-10 px-2">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-neutral-cream flex items-center justify-center shrink-0">
                <Users size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-charcoal mb-0.5">More Exposure</h3>
                <p className="text-xs text-muted leading-relaxed">Get discovered by thousands of hungry customers.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-neutral-cream flex items-center justify-center shrink-0">
                <Store size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-charcoal mb-0.5">Easy to Manage</h3>
                <p className="text-xs text-muted leading-relaxed">Simple dashboard to manage orders and menu.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-neutral-cream flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-charcoal mb-0.5">Fast Payouts</h3>
                <p className="text-xs text-muted leading-relaxed">Receive your earnings quickly and securely.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-neutral-cream flex items-center justify-center shrink-0">
                <Headphones size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-charcoal mb-0.5">24/7 Support</h3>
                <p className="text-xs text-muted leading-relaxed">We're here to help you every step of the way.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}