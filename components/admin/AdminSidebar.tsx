import { useRouter } from "next/router";
import Link from "next/link";
import { adminNav } from "../../lib/adminNav";

export default function AdminSidebar() {
  const router = useRouter();

  return (
    <aside className="w-64 h-screen sticky top-0 border-r border-neutral-200 bg-white flex flex-col">
      <div className="px-6 py-6 border-b border-neutral-200">
        <h1 className="text-lg font-bold text-neutral-900">Bukka Foods</h1>
        <p className="text-xs text-neutral-500">Admin</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {adminNav.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;

          if (item.status === "coming_soon") {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-neutral-400 cursor-not-allowed select-none"
              >
                <span className="flex items-center gap-3 text-sm">
                  <Icon size={18} />
                  {item.label}
                </span>
                <span className="text-xs bg-neutral-100 text-neutral-500 rounded-full px-2 py-0.5">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}