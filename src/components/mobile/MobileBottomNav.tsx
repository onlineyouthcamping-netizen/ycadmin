import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, CreditCard, Compass, Ticket, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onOpenDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenDrawer,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin",
      isActive:
        location.pathname === "/admin" || location.pathname === "/admin/",
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      path: "/admin/accounting",
      isActive: location.pathname.startsWith("/admin/accounting"),
    },
    {
      id: "operations",
      label: "Departures",
      icon: Compass,
      path: "/admin/operations",
      isActive:
        location.pathname.startsWith("/admin/operations") ||
        location.pathname.startsWith("/admin/departure-workspace") ||
        location.pathname.startsWith("/admin/departures"),
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: Ticket,
      path: "/admin/bookings",
      isActive: location.pathname.includes("/admin/bookings"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 md:hidden px-2 py-1 shadow-lg pb-safe">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-[56px] py-1 transition-all rounded-lg active:scale-95 touch-manipulation",
                item.isActive
                  ? "text-[#FF5400] font-bold"
                  : "text-slate-500 hover:text-slate-900 font-medium",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 mb-0.5",
                    item.isActive && "stroke-[2.5px]",
                  )}
                />
                {item.isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FF5400]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-none mt-1">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center flex-1 h-full min-w-[56px] py-1 transition-all text-slate-500 hover:text-slate-900 font-medium active:scale-95 touch-manipulation"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none mt-1">
            More
          </span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
