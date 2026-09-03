import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ShoppingCart, User } from "lucide-react";


export default function Header() {
  const router = useRouter();
  const [address, setAddress] = useState("Set location");
  const [user, setUser] = useState(null); // wired to your existing auth listener
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("deliveryAddress");
    if (saved) setAddress(saved);
  }, []);

  // click-outside handler (existing logic, unchanged)
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deriveInitials = (name) =>
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const handleLogout = async () => {
    // existing auth logout logic — unchanged, paste in
  };

  const handleBrowseClick = () => {
    // existing logic — unchanged, paste in
    router.push("/browse");
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Browse", href: "/browse" },
    { label: "Orders", href: "/orders" },
    { label: "Favorites", href: "/favorites" },
    { label: "Become a Vendor", href: "/vendor" },
  ];

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <span className="text-2xl font-bold">
            <span className="text-primary">Bukka</span>{" "}
            <span className="text-neutral-900">Foods</span>
          </span>
          <span className="text-xs text-neutral-500">
            Real Nigerian food. Delivered fast.
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = router.pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={link.href === "/browse" ? handleBrowseClick : undefined}
                className={`text-sm pb-1 border-b-2 ${
                  active
                    ? "text-primary border-primary font-medium"
                    : "text-neutral-600 border-transparent hover:text-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/browse?enterAddress=1"
            className="hidden sm:flex items-center gap-1.5 text-sm text-neutral-700 border border-neutral-200 rounded-full px-3 py-1.5"
          >
            📍 {address}
            <span className="text-neutral-400">▾</span>
          </Link>

          <Link href="/orders">
            <ShoppingCart className="w-6 h-6 text-neutral-700" />
          </Link>

          <div ref={menuRef} className="relative">
            {user ? (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-full bg-primary text-white text-sm flex items-center justify-center"
              >
                {deriveInitials(user.full_name)}
              </button>
            ) : (
              <Link href="/account/login">
                <User className="w-6 h-6 text-neutral-700" />
              </Link>
            )}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-neutral-200 rounded-xl shadow-lg py-1">
                <Link href="/account" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                  My account
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}