import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';


export default function NavBar() {
  const router = useRouter();
  const isActive = (path: string) => router.pathname === path || router.pathname.startsWith(path);
  const [initials, setInitials] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        setInitials(null);
        return;
      }
      setInitials(await deriveInitials(user));
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setInitials(null);
        return;
      }
      setInitials(await deriveInitials(session.user));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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
    <header className="bg-neutral-black/100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-soft-lg">
              <span className="text-black font-heading text-lg">B</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-heading text-lg text-neutral-white">Bukka Foods</div>
              <div className="text-xs text-neutral-charcoal/50">Real Nigerian Food. Delivered Fast.</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="/browse" onClick={handleBrowseClick} className={`${isActive('/browse') ? 'text-primary' : 'text-neutral-white/90'} text-sm cursor-pointer`}>Browse</a>
            <Link href="/orders" className={`${isActive('/orders') ? 'text-primary' : 'text-neutral-white/90'} text-sm`}>Orders</Link>
            <Link href="/vendor" className={`${isActive('/vendor') ? 'text-primary' : 'text-neutral-white/90'} text-sm`}>Become a Vendor</Link>

            <Link href="/browse?enterAddress=1" className="text-sm">
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/6">
                <span className="text-neutral-white/90">Change address</span>
              </span>
            </Link>

            <Link href="/order" className="ml-4">
              <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-gradient-to-b from-primary to-primary-deep text-neutral-black font-semibold shadow-btn-glow">
                Order Now
              </span>
            </Link>
            {initials && (
              <div className="relative ml-2" data-user-menu>
                <button
                  onClick={() => setMenuOpen(prev => !prev)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-black text-sm font-semibold"
                >
                  {initials}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl py-2 min-w-[120px] shadow-lg z-50">
                    <Link href="/orders" onClick={() => setMenuOpen(false)}>
                      <span className="block px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer">
                        Orders
                      </span>
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); handleLogout(); }}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          <div className="md:hidden">
            <button aria-label="open menu" className="p-2 rounded-md bg-neutral-white/5">
              <svg width="20" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}