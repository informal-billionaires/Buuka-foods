import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Bike,
  Wallet,
  TrendingUp,
  BarChart2,
  Tag,
  Star,
  LifeBuoy,
  Settings,
  LucideIcon,
} from "lucide-react";

export type AdminNavStatus = "live" | "coming_soon";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  status: AdminNavStatus;
}

export const adminNav: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, status: "live" },
  { label: "Orders", href: "#", icon: ClipboardList, status: "coming_soon" },
  { label: "Customers", href: "#", icon: Users, status: "coming_soon" },
  { label: "Riders", href: "#", icon: Bike, status: "coming_soon" },
  { label: "Payouts", href: "#", icon: Wallet, status: "coming_soon" },
  { label: "Earnings", href: "#", icon: TrendingUp, status: "coming_soon" },
  { label: "Reports", href: "#", icon: BarChart2, status: "coming_soon" },
  { label: "Promotions", href: "#", icon: Tag, status: "coming_soon" },
  { label: "Reviews", href: "#", icon: Star, status: "coming_soon" },
  { label: "Support Tickets", href: "#", icon: LifeBuoy, status: "coming_soon" },
  { label: "Settings", href: "#", icon: Settings, status: "coming_soon" },
];