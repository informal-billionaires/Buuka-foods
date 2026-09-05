import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { getUnreadNotificationCount } from '../lib/notifications';

export default function NavBar() {
  const router = useRouter();
  const isActive = (path: string) => router.pathname === path || router.pathname.startsWith(path);
  const [initials, setInitials] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedAddress, setSavedAddress] = useState<string>('Set location');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        setInitials(null);
        setUnreadCount(0);
        return;
      }
      setInitials(await deriveInitials(user));
      setUnreadCount(await getUnreadNotificationCount(user.id));
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setInitials(null);
        setUnreadCount(0);
        return;
      }
      setInitials(await deriveInitials(session.user));
      setUnreadCount(await getUnreadNotificationCount(session.user.id));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      const addr = typeof window !== 'undefined' ? localStorage.getItem('deliveryAddress') : null;
      if (addr && addr.trim().length > 0) setSavedAddress(addr);
    } catch {}
  }, [router.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-user-menu]')) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  async function deriveInitials(user: { id: string; email?: string }): Promise<string> {
    const { data } = await supabase
      .from('customers')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const fullName = data?.full_name;
    if (fullName && fullName.trim().length > 0) {
      const parts = fullName.trim().split(/\s+/);
      const first = parts[0]?.[0] ?? '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
      return (first + last).toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  function handleBrowseClick(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const addr = typeof window !== 'undefined' ? localStorage.getItem('deliveryAddress') : null;
      const coords = typeof window !== 'undefined' ? localStorage.getItem('deliveryCoords') : null;
      if ((addr && addr.trim().length > 0) || (coords && coords.trim().length > 0)) {
        router.push('/browse');
      } else {
        router.push('/?enterAddress=1');
      }
    } catch {
      router.push('/?enterAddress=1');
    }
  }

    return (
    <>
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="hidden md:flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div>
              <span className="font-heading text-xl text-primary font-bold">Bukka</span>
              <span className="font-heading text-xl text-neutral-900 font-bold"> Foods</span>
              <div className="text-xs text-neutral-500 -mt-0.5">Real Nigerian food. Delivered fast.</div>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7">
            <Link href="/" className={`relative text-sm font-medium pb-1 ${isActive('/') && router.pathname === '/' ? 'text-primary' : 'text-neutral-600'}`}>
              Home
              {isActive('/') && router.pathname === '/' && (
                <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-primary" />
              )}
            </Link>
            <a href="/browse" onClick={handleBrowseClick} className={`${isActive('/browse') ? 'text-primary' : 'text-neutral-600'} text-sm font-medium cursor-pointer`}>
              Browse
            </a>
            <Link href="/orders" className={`${isActive('/orders') ? 'text-primary' : 'text-neutral-600'} text-sm font-medium`}>
              Orders
            </Link>
            <Link href="/favorites" className={`${isActive('/favorites') ? 'text-primary' : 'text-neutral-600'} text-sm font-medium`}>
              Favorites
            </Link>
            <Link href="/vendor" className={`${isActive('/vendor') ? 'text-primary' : 'text-neutral-600'} text-sm font-medium`}>
              Become a Vendor
            </Link>
          </nav>

          {/* Right side: location, cart, profile */}
          <div className="flex items-center gap-4">
            <Link href="/browse?enterAddress=1" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-neutral-700 hover:text-neutral-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.6"/></svg>
              <span className="max-w-[140px] truncate">{savedAddress}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>

            <Link href="/orders" aria-label="cart" className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6h15l-1.5 9h-12L6 6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="9" cy="20" r="1.3" fill="currentColor"/><circle cx="18" cy="20" r="1.3" fill="currentColor"/></svg>
            </Link>

            {initials && (
              <button aria-label="notifications" className="relative w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {initials ? (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setMenuOpen(prev => !prev)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-black text-sm font-semibold"
                >
                  {initials}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 rounded-xl py-2 min-w-[140px] shadow-lg z-50">
                    <Link href="/orders" onClick={() => setMenuOpen(false)}>
                      <span className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer">
                        Orders
                      </span>
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); handleLogout(); }}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/account/login" aria-label="account" className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6"/><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </Link>
            )}
          </div>

            </div>

        {/* Mobile row */}
        <div className="flex md:hidden items-center justify-between py-3">
          <div className="flex items-center gap-2 min-w-0">
            <button aria-label="open menu" onClick={() => setDrawerOpen(true)} className="p-2 rounded-md bg-neutral-100 flex-shrink-0">
              <svg width="20" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="#111" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
            <Link href="/" className="min-w-0">
              <div>
                <span className="font-heading text-lg text-primary font-bold">Bukka</span>
                <span className="font-heading text-lg text-neutral-900 font-bold"> Foods</span>
                <div className="text-[11px] text-neutral-500 -mt-0.5 truncate">Real Nigerian food. Delivered fast.</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/browse?enterAddress=1" className="flex items-center gap-1 text-xs text-neutral-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.6"/></svg>
              <span className="max-w-[64px] truncate">{savedAddress}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>

            <Link href="/orders" aria-label="cart" className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6h15l-1.5 9h-12L6 6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="9" cy="20" r="1.3" fill="currentColor"/><circle cx="18" cy="20" r="1.3" fill="currentColor"/></svg>
            </Link>

            {initials && (
              <button aria-label="notifications" className="relative w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>

    {drawerOpen && (
      <div className="fixed inset-0 z-50 md:hidden">
        <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
        <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <span className="font-heading text-lg text-neutral-900 font-bold">Menu</span>
            <button aria-label="close menu" onClick={() => setDrawerOpen(false)} className="p-2 rounded-md bg-neutral-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </button>
          </div>
          <nav className="flex flex-col p-4 gap-1">
            <Link href="/" onClick={() => setDrawerOpen(false)} className={`px-3 py-3 rounded-lg text-sm font-medium ${isActive('/') && router.pathname === '/' ? 'text-primary bg-primary/10' : 'text-neutral-700'}`}>
              Home
            </Link>
            <a href="/browse" onClick={(e: React.MouseEvent) => { setDrawerOpen(false); handleBrowseClick(e); }} className={`px-3 py-3 rounded-lg text-sm font-medium cursor-pointer ${isActive('/browse') ? 'text-primary bg-primary/10' : 'text-neutral-700'}`}>
              Browse
            </a>
            <Link href="/orders" onClick={() => setDrawerOpen(false)} className={`px-3 py-3 rounded-lg text-sm font-medium ${isActive('/orders') ? 'text-primary bg-primary/10' : 'text-neutral-700'}`}>
              Orders
            </Link>
            <Link href="/favorites" onClick={() => setDrawerOpen(false)} className={`px-3 py-3 rounded-lg text-sm font-medium ${isActive('/favorites') ? 'text-primary bg-primary/10' : 'text-neutral-700'}`}>
              Favorites
            </Link>
            <Link href="/vendor" onClick={() => setDrawerOpen(false)} className={`px-3 py-3 rounded-lg text-sm font-medium ${isActive('/vendor') ? 'text-primary bg-primary/10' : 'text-neutral-700'}`}>
              Become a Vendor
            </Link>
          </nav>
        </div>
      </div>
    )}
    </>
  );
}