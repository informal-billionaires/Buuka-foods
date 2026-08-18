import { ReactNode, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard, UtensilsCrossed, ClipboardList, BarChart3,
  Wallet, Star, Megaphone, User, Settings,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/menu-items', label: 'Menu Items', icon: UtensilsCrossed },
  { href: '/vendor/orders', label: 'Orders', icon: ClipboardList },
  { href: '/vendor/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/vendor/payouts', label: 'Payouts', icon: Wallet },
  { href: '/vendor/reviews', label: 'Reviews', icon: Star },
  { href: '/vendor/promotions', label: 'Promotions', icon: Megaphone },
  { href: '/vendor/profile', label: 'Profile', icon: User },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
];

export default function VendorLayout({
  children,
  vendorName,
  onSignOut,
  restaurantId,
}: {
  children: ReactNode;
  vendorName?: string;
  onSignOut?: () => void;
  restaurantId?: string;
}) {
  const router = useRouter();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);   

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col py-6 px-3">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-sm">
            B
          </div>
          <span className="font-bold text-neutral-900">Bukka Foods</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6">
          <div className="rounded-2xl bg-orange-50 p-4">
            <div className="mb-2 text-2xl">🚀</div>
            <h3 className="text-sm font-semibold text-neutral-900">Grow your business</h3>
            <p className="mt-1 text-xs text-neutral-500">Promote your restaurant and reach more customers.</p>
            <Link
              href="/vendor/promotions"
              className="mt-3 block rounded-full bg-primary px-3 py-2 text-center text-sm font-semibold text-black"
            >
              Create Promotion
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-4">
            <Link href="/" className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-sm text-neutral-900">
              Back to homepage
            </Link>
            {restaurantId && <NotificationBell restaurantId={restaurantId} />}
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setAvatarOpen(prev => !prev)}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">
                  {vendorName ? vendorName.slice(0, 2).toUpperCase() : 'V'}
                </div>
                <div className="text-sm text-left">
                  <div className="font-semibold text-neutral-900 leading-tight">
                    {vendorName || 'Vendor'}
                  </div>
                  <div className="text-neutral-400 text-xs leading-tight">Vendor</div>
                </div>
              </button>
              {avatarOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg border border-neutral-200 py-2 z-50">
                  <Link
                    href="/vendor/profile"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    onClick={() => setAvatarOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={onSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 text-neutral-900">{children}</main>
      </div>
    </div>
  );
}