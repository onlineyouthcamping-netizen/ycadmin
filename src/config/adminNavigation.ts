import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Ticket,
  ListTodo,
  Compass,
  Wallet,
  BadgeCheck,
  MapPin,
  Building2,
  FileText,
  Settings,
  Users,
  ShieldCheck,
  Link2,
  FilePlus,
  Globe,
  Mail,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  matchPaths?: string[];
  founderOnly?: boolean;
};

/** Primary bottom bar — most-used modules on phone */
export const MOBILE_BOTTOM_NAV: AdminNavItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    matchPaths: ["/admin"],
  },
  {
    title: "Bookings",
    url: "/admin/bookings",
    icon: Ticket,
    matchPaths: ["/admin/bookings"],
  },
  {
    title: "Departures",
    url: "/admin/operations",
    icon: Compass,
    matchPaths: [
      "/admin/operations",
      "/admin/departure-workspace",
      "/admin/departures",
    ],
  },
  {
    title: "Finance",
    url: "/admin/finance",
    icon: Wallet,
    matchPaths: ["/admin/finance", "/admin/accounting"],
  },
];

/** Full module list in the “More” drawer — mirrors desktop sidebar */
export const MOBILE_DRAWER_NAV: AdminNavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Bookings", url: "/admin/bookings", icon: Ticket },
  { title: "Booking Links", url: "/admin/booking-forms", icon: Link2 },
  { title: "Quotations", url: "/admin/quotations", icon: FilePlus },
  { title: "Tasks & Allotments", url: "/admin/tasks", icon: ListTodo },
  { title: "Departures", url: "/admin/operations", icon: Compass },
  { title: "Daily Tasks", url: "/admin/operations/daily-tasks", icon: ListTodo },
  { title: "SOP & Checklists", url: "/admin/operations/sops", icon: FileText },
  { title: "Finance", url: "/admin/finance", icon: Wallet },
  {
    title: "Incoming Payments",
    url: "/admin/approvals-hub?tab=payment-approvals",
    icon: BadgeCheck,
  },
  {
    title: "Vendor Payouts",
    url: "/admin/approvals-hub?tab=vendor-bills",
    icon: BadgeCheck,
  },
  {
    title: "Refund Requests",
    url: "/admin/approvals-hub?tab=refund-requests",
    icon: BadgeCheck,
  },
  { title: "Trips", url: "/admin/trips", icon: MapPin },
  { title: "Vendors", url: "/admin/vendors", icon: Building2 },
  {
    title: "Company Documents",
    url: "/admin/company-documents",
    icon: FileText,
  },
  { title: "Website", url: "/admin/website", icon: Globe },
  { title: "Email Templates", url: "/admin/email-templates", icon: Mail },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "My Profile", url: "/admin/my-profile", icon: Users },
  {
    title: "Staff Profiles",
    url: "/admin/staff-profiles",
    icon: Users,
    founderOnly: true,
  },
  {
    title: "Roles & Permissions",
    url: "/admin/roles",
    icon: ShieldCheck,
    founderOnly: true,
  },
];

export function isAdminNavActive(
  pathname: string,
  item: AdminNavItem,
  search = "",
): boolean {
  const [urlPath, urlSearch] = item.url.split("?");
  const paths = item.matchPaths?.length ? item.matchPaths : [urlPath];

  const pathMatches = paths.some((p) => {
    if (pathname === p) return true;
    if (p === "/admin") return pathname === "/admin" || pathname === "/admin/";
    if (
      p === "/admin/operations" &&
      pathname.startsWith("/admin/departure-workspace")
    ) {
      return true;
    }
    return p !== "/admin" && pathname.startsWith(p);
  });

  if (!pathMatches) return false;

  if (urlSearch) {
    const expected = new URLSearchParams(urlSearch);
    const current = new URLSearchParams(search);
    for (const [key, val] of expected.entries()) {
      if (current.get(key) !== val) return false;
    }
    return true;
  }

  if (search.includes("tab=")) {
    const currentTab = new URLSearchParams(search).get("tab");
    const siblingWithTab = MOBILE_DRAWER_NAV.some((other) => {
      if (other.url === item.url) return false;
      const [otherPath, otherSearch] = other.url.split("?");
      if (otherPath !== urlPath || !otherSearch) return false;
      return new URLSearchParams(otherSearch).get("tab") === currentTab;
    });
    if (siblingWithTab) return false;
  }

  return true;
}
