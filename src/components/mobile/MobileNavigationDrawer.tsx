import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/store/auth.store";
import {
  BarChart3,
  Users,
  Ticket,
  MapPin,
  Compass,
  Building2,
  DollarSign,
  Briefcase,
  Settings,
  LogOut,
  X,
  User,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavigationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAuthStore();

  const isFounder =
    (admin?.email || "").toLowerCase().includes("hemal") ||
    admin?.role === "superadmin" ||
    admin?.role === "admin";

  const modules = [
    { title: "Dashboard", url: "/admin", icon: BarChart3 },
    { title: "Sales & Leads", url: "/admin/inquiries", icon: Users },
    { title: "Bookings Ledger", url: "/admin/bookings", icon: Ticket },
    { title: "Departure Hub", url: "/admin/departures", icon: Compass },
    { title: "Expeditions & Trips", url: "/admin/trips", icon: MapPin },
    { title: "Accounting & Cash", url: "/admin/accounting", icon: DollarSign },
    {
      title: "Vendors Directory",
      url: "/admin/vendor-directory",
      icon: Building2,
    },
    { title: "Staff & HR", url: "/admin/hr?tab=staff", icon: Briefcase },
    {
      title: "Company Documents",
      url: "/admin/company-documents",
      icon: FileText,
    },
    { title: "System Settings", url: "/admin/settings", icon: Settings },
  ];

  const handleNavigate = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[85%] sm:w-[320px] p-0 bg-slate-900 text-white border-r-0"
      >
        {/* Profile Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF5400] text-white flex items-center justify-center font-black text-sm">
              {admin?.name?.charAt(0) || "A"}
            </div>
            <div>
              <h3 className="text-xs font-bold text-white truncate max-w-[150px]">
                {admin?.name || "Admin User"}
              </h3>
              <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-[#FF5400] border border-orange-500/30">
                {isFounder ? "FOUNDER" : admin?.role || "Staff"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isActive =
              location.pathname === mod.url ||
              (mod.url !== "/admin" && location.pathname.startsWith(mod.url));
            return (
              <button
                key={mod.title}
                type="button"
                onClick={() => handleNavigate(mod.url)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left active:scale-98",
                  isActive
                    ? "bg-[#FF5400] text-white font-bold shadow-md shadow-orange-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{mod.title}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Logout Action */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800 bg-slate-950">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              logout();
              navigate("/admin/login");
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigationDrawer;
