import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import HeroLarge from '../components/HeroLarge';
import AddressModal from '../components/AddressModal';
import CategoriesRow from '../components/CategoriesRow';
import PopularNearYou from '../components/PopularNearYou';
import PromoBanner from '../components/PromoBanner';
import HowItWorks from '../components/HowItWorks';
import TrustBadges from '../components/TrustBadges';

export default function Home() {
  const router = useRouter();

  // controls whether the modal is visible
  const [showAddressModal, setShowAddressModal] = useState(false);
  // while we check storage we avoid flashing UI (optional)
  const [checkedAddress, setCheckedAddress] = useState(false);

  useEffect(() => {
    // Only run on client and when router is ready
    if (!router.isReady) return;

    // If the page was opened with ?enterAddress=1 => open modal and remove the query param
    if (router.query.enterAddress) {
      setShowAddressModal(true);
      // remove the query param from the URL (shallow so we don't reload)
      const { enterAddress, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
      setCheckedAddress(true);
      return;
    }

    // Otherwise, run the previous logic: open automatically if no saved address and not dismissed this session
    try {
      const addr = typeof window !== 'undefined' ? localStorage.getItem('deliveryAddress') : null;
      const dismissedThisSession = typeof window !== 'undefined' && sessionStorage.getItem('addressModalDismissed') === '1';

      if (!addr && !dismissedThisSession) {
        // no saved address and not dismissed this session => show modal
        setShowAddressModal(true);
      }
    } catch (err) {
      // localStorage/sessionStorage may be unavailable in some browsers; fall back to showing modal
      setShowAddressModal(true);
    } finally {
      setCheckedAddress(true);
    }
  }, [router.isReady, router.query, router]);

  function handleModalClose() {
    // Option: hide for this session so it doesn't immediately reappear
    try {
      sessionStorage.setItem('addressModalDismissed', '1');
    } catch {}
    setShowAddressModal(false);
  }

  function handleModalSubmit(address: string, coords?: { lat: number; lng: number } | null) {
    try {
      if (address && address.trim()) {
        localStorage.setItem('deliveryAddress', address);
      } else if (coords) {
        localStorage.setItem('deliveryCoords', `${coords.lat},${coords.lng}`);
      }
    } catch (err) {
      // ignore storage errors
    }

    setShowAddressModal(false);

    // Navigate to Browse after successful save.
    // Use a query object (Next will encode values for us).
    if (address && address.trim()) {
      router.push({ pathname: '/browse', query: { q: address.trim() } });
    } else if (coords) {
      router.push({ pathname: '/browse', query: { lat: String(coords.lat), lng: String(coords.lng) } });
    }
  }

  return (
    <>
      <Head>
        <title>Bukka Foods — Crave it. We deliver.</title>
      </Head>

      <div className="min-h-screen bg-neutral-100 text-neutral-black">
        <NavBar />
      
      <AddressModal
        isOpen={showAddressModal}
        initial={''}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />

        <main className="relative">
          {/* Hero */}
          <HeroLarge />
          <CategoriesRow />
          <PopularNearYou />
          <PromoBanner />
          <HowItWorks />
          <TrustBadges />
        </main>

      </div>
    </>
  );
}