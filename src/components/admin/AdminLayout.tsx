import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Compass,
  Map,
  CalendarCheck,
  MessageSquare,
  Image,
  Layout,
  Settings,
  LogOut,
  Loader2,
  Plane,
  BookOpen,
  FileText,
  Paintbrush,
  Star,
  Users,
  Search,
  Globe,
  Banknote,
  Link2,
  Sparkles,
  Plus,
  User,
  Palette,
  PlusCircle,
  ChevronDown,
  FilePlus,
  HelpCircle,
  Bell,
  Shield,
  ClipboardCheck,
  Train,
  Building2,
  History,
  Wrench,
  CreditCard,
  BarChart3,
  ChevronRight,
  ShoppingCart,
  CheckSquare,
  Briefcase,
  Megaphone,
  ShieldAlert,
  Ticket
} from "lucide-react";
import { AdminContainer } from "@/components/layout";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NewBookingModal from "./NewBookingModal";
import { knowledgeService } from "@/services/knowledge.service";
import { erpService } from "@/services/erp.service";

// Reconfigured hierarchical modules config for accordion logic:
interface SidebarModule {
  title: string;
  url?: string;
  icon: any;
  hasSubItems: boolean;
  subItems?: { title: string; url: string; isNew?: boolean }[];
}

const sidebarModules: SidebarModule[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: BarChart3,
    hasSubItems: false
  },
  {
    title: "Sales",
    icon: Briefcase,
    hasSubItems: true,
    subItems: [
      { title: "Inquiries", url: "/admin/inquiries" },
      { title: "Package Builder", url: "/admin/package-builder" },
      { title: "Quotations", url: "/admin/quotations" },
      { title: "Booking Links", url: "/admin/booking-forms", isNew: true },
      { title: "Bookings", url: "/admin/bookings" }
    ]
  },
  {
    title: "Operations",
    icon: Compass,
    hasSubItems: true,
    subItems: [
      { title: "Departures Hub", url: "/admin/operations" },
      { title: "Vendors", url: "/admin/vendors" },
      { title: "Guide Management", url: "/admin/guides-hub" },
      { title: "Documents", url: "/admin/company-documents" },
      { title: "Reports", url: "/admin/reports" }
    ]
  },
  {
    title: "Approval Center",
    icon: ClipboardCheck,
    hasSubItems: true,
    subItems: [
      { title: "Booking Verification", url: "/admin/approvals-hub" },
      { title: "Ticket Approvals", url: "/admin/ticket-approvals" },
      { title: "Payment Approvals", url: "/admin/approvals-hub" },
      { title: "Vendor Bills", url: "/admin/approvals-hub" },
      { title: "Refund Requests", url: "/admin/approvals-hub" },
      { title: "Expense Claims", url: "/admin/approvals-hub" }
    ]
  },
  {
    title: "Finance",
    icon: Banknote,
    hasSubItems: true,
    subItems: [
      { title: "Overview", url: "/admin/accounting?tab=overview" },
      { title: "Transactions", url: "/admin/accounting?tab=transactions" },
      { title: "Cash Book", url: "/admin/accounting?tab=cash_book" },
      { title: "Bank Accounts", url: "/admin/accounting?tab=bank_accounts" },
      { title: "Vendor Payments", url: "/admin/accounting?tab=vendor_payments" },
      { title: "Office Expenses", url: "/admin/accounting?tab=office_expenses" },
      { title: "Payments", url: "/admin/accounting?tab=payments" },
      { title: "Profit & Loss", url: "/admin/accounting?tab=profit_loss" },
      { title: "Trip Profitability", url: "/admin/accounting?tab=trip_profitability" },
      { title: "Reports", url: "/admin/accounting?tab=reports" }
    ]
  },
  {
    title: "Travel Desk",
    url: "/admin/travel-desk",
    icon: Plane,
    hasSubItems: false
  },
  {
    title: "People",
    icon: Users,
    hasSubItems: true,
    subItems: [
      { title: "Employees", url: "/admin/hr?tab=staff" },
      { title: "Tasks", url: "/admin/hr?tab=tasks" },
      { title: "Attendance", url: "/admin/attendance-logs" },
      { title: "Leave Management", url: "/admin/hr?tab=leaves" },
      { title: "Payroll", url: "/admin/payroll" },
      { title: "Performance", url: "/admin/hr?tab=performance" },
      { title: "Documents", url: "/admin/hr?tab=docs" }
    ]
  },
  {
    title: "Business",
    icon: Globe,
    hasSubItems: true,
    subItems: [
      { title: "Trips / Products", url: "/admin/trips" },
      { title: "Master Database", url: "/admin/master-database" },
      { title: "Website", url: "/admin/website" }
    ]
  },
  {
    title: "Marketing",
    icon: Megaphone,
    hasSubItems: true,
    subItems: [
      { title: "Overview", url: "/admin/marketing/overview" },
      { title: "Content Studio", url: "/admin/marketing/content-studio" },
      { title: "Campaigns (Journal)", url: "/admin/marketing/campaigns" },
      { title: "Learnings", url: "/admin/marketing/learnings" },
      { title: "Assets (Drive Links)", url: "/admin/marketing/assets" },
      { title: "Reports", url: "/admin/reports" },
      { title: "Blogs", url: "/admin/blogs" },
      { title: "Reviews & Socials", url: "/admin/reviews" }
    ]
  },
  {
    title: "Administration",
    icon: Settings,
    hasSubItems: true,
    subItems: [
      { title: "Users & Roles", url: "/admin/users" },
      { title: "Roles & Permissions", url: "/admin/access-control" },
      { title: "Email Templates", url: "/admin/email-templates" },
      { title: "Automation", url: "/admin/automation" },
      { title: "Audit Logs", url: "/admin/audit-logs" },
      { title: "Company Documents", url: "/admin/company-documents" }
    ]
  }
];

function AdminSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { logout, admin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // State to track the single expanded module title
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Fetch navigation persistence on mount
  useEffect(() => {
    const fetchNavState = async () => {
      try {
        const dbSavedModule = await knowledgeService.getNavState();
        if (dbSavedModule) {
          setExpandedModule(dbSavedModule);
        }
      } catch (err) {
        console.error("Failed to load nav state:", err);
      }
    };
    fetchNavState();
  }, []);

  // Handle module header click
  const handleModuleClick = async (mod: SidebarModule) => {
    if (!mod.hasSubItems) {
      if (mod.url) {
        navigate(mod.url);
        if (isMobile) setOpenMobile(false);
      }
      return;
    }

    // Toggle single expanded navigation section
    const nextState = expandedModule === mod.title ? null : mod.title;
    setExpandedModule(nextState);

    // Save state to database persistence
    if (nextState) {
      try {
        await knowledgeService.saveNavState(nextState);
      } catch (err) {
        console.error("Failed to save nav state:", err);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-[#E2E8F0] shadow-xs">
      <SidebarContent className="scrollbar-hide flex flex-col h-full bg-[#0F172A] text-[#94A3B8] font-sans">
        {/* Brand / Logo */}
        <div className={cn(
          "flex items-center gap-2.5 border-b border-[#1E293B] shrink-0 h-14 px-4 bg-[#0F172A]",
          collapsed && "justify-center px-0"
        )}>
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden p-0.5">
            <img src="/brand/logo.png" className="w-full h-full object-contain" alt="YouthCamping Logo" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-white text-[13.5px] tracking-tight leading-none">
                YouthCamping
              </span>
              <span className="text-[7px] text-[#94A3B8] font-bold mt-1.5 tracking-[0.08em] uppercase leading-none">
                ONE TRIP AT A TIME
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-1">
          {sidebarModules.map((mod) => {
            // Role and permission-based visibility checks
            if (admin) {
              if (admin.role === 'sales') {
                const salesAllowedGroup = ["Dashboard", "Sales", "Inquiries", "Quotations", "Business", "Master Database", "Approval Center"];
                if (!salesAllowedGroup.includes(mod.title)) return null;
              }
              if (admin.role === 'guide') {
                if (mod.title !== "Dashboard" && mod.title !== "Operations") return null;
              }
            }

            const hasSub = mod.hasSubItems;
            
            // Check if any sub-item is active
            const isSubActive = (url: string) => {
              const [urlPath, urlSearch] = url.split('?');
              const pathMatches = location.pathname === urlPath || (urlPath !== "/admin" && location.pathname.startsWith(urlPath + '/'));
              
              if (!pathMatches) return false;
              
              const searchParams = new URLSearchParams(location.search);
              const currentTab = searchParams.get('tab');

              if (urlSearch) {
                const urlParams = new URLSearchParams(urlSearch);
                const urlTab = urlParams.get('tab');
                
                if (urlTab) {
                  if (currentTab) {
                    return urlTab === currentTab;
                  } else {
                    // Match default tab if no tab parameter in active URL
                    if (urlPath === '/admin/accounting') {
                      return urlTab === 'overview';
                    }
                    if (urlPath === '/admin/hr') {
                      return urlTab === 'dashboard';
                    }
                    // Fallback to first tab sibling in list
                    const firstTabSubItem = mod.subItems?.find(sub => sub.url.startsWith(urlPath + '?tab='));
                    if (firstTabSubItem) {
                      const firstTab = new URLSearchParams(firstTabSubItem.url.split('?')[1]).get('tab');
                      return urlTab === firstTab;
                    }
                  }
                }
                
                // General query param checks
                for (const [key, val] of urlParams.entries()) {
                  if (searchParams.get(key) !== val) {
                    return false;
                  }
                }
                return true;
              }
              
              // If the sub-item has no query params, but the current url has tab parameter,
              // check if any of the other sub-items under the same path matches the current tab.
              if (currentTab) {
                const hasSiblingWithThisTab = mod.subItems?.some(sub => {
                  const [subPath, subSearch] = sub.url.split('?');
                  if (subPath !== urlPath || !subSearch) return false;
                  const subParams = new URLSearchParams(subSearch);
                  return subParams.get('tab') === currentTab;
                });
                if (hasSiblingWithThisTab) return false;
              }
              
              return true;
            };

            // Filter subItems based on role permissions
            const visibleSubItems = mod.subItems?.filter(sub => {
              if (admin?.role === 'sales') {
                const salesAllowedUrls = ["/admin/bookings", "/admin/booking-forms", "/admin/inquiries", "/admin/quotations", "/admin/package-builder", "/admin/master-database", "/admin/approvals-hub", "/admin/ticket-approvals"];
                return salesAllowedUrls.includes(sub.url.split('?')[0]);
              }
              if (admin?.role === 'guide') {
                const guideAllowedUrls = ["/admin/live-operations", "/admin/guides-hub"];
                return guideAllowedUrls.includes(sub.url.split('?')[0]);
              }
              return true;
            }) || [];

            if (hasSub && visibleSubItems.length === 0) return null;

            const isAnySubActive = hasSub && visibleSubItems.some(sub => isSubActive(sub.url));
            const isDirectActive = !hasSub && mod.url && (location.pathname === mod.url || (mod.url !== "/admin" && location.pathname.startsWith(mod.url)));
            const isModuleActive = isDirectActive || isAnySubActive;
            const isExpanded = expandedModule === mod.title || isAnySubActive;

            return (
              <div key={mod.title} className="flex flex-col gap-0.5">
                {/* Module Header Row */}
                <button
                  onClick={() => handleModuleClick(mod)}
                  className={cn(
                    "flex items-center w-full h-[36px] rounded px-2.5 transition-colors relative text-left text-[11.5px] font-semibold tracking-tight",
                    isModuleActive 
                      ? "text-[#FFFFFF] bg-white/5 font-bold" 
                      : "text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-white/5"
                  )}
                >
                  {isModuleActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-[#FF6B00] rounded-r" />
                  )}
                  <mod.icon className={cn(
                    "h-4 w-4 shrink-0 transition-colors mr-2.5",
                    isModuleActive ? "text-[#FF6B00]" : "opacity-80"
                  )} />
                  {!collapsed && <span className="flex-1 truncate">{mod.title}</span>}
                  
                  {/* Chevron logic */}
                  {!collapsed && hasSub && (
                    isExpanded ? <ChevronDown className="h-3 w-3 opacity-80 ml-auto" /> : <ChevronRight className="h-3 w-3 opacity-80 ml-auto" />
                  )}
                </button>

                {/* Sub-items block */}
                {!collapsed && hasSub && isExpanded && (
                  <div className="pl-4 pr-1 py-1 flex flex-col gap-0.5 border-l border-white/5 ml-4.5 mt-0.5">
                    {visibleSubItems.map((sub) => {
                      const active = isSubActive(sub.url);
                      return (
                        <NavLink
                          key={sub.url}
                          to={sub.url}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                          className={cn(
                            "text-[10.5px] font-medium py-1.5 px-2.5 rounded transition-colors block truncate",
                            active 
                              ? "text-[#FF6B00] bg-white/5 font-semibold" 
                              : "text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-white/5"
                          )}
                          activeClassName=""
                        >
                          {sub.title}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Logout (pinned to bottom, compact) */}
        <div className="p-3 border-t border-white/5 bg-[#0B1329]">
          <Button variant="ghost" size={collapsed ? "icon" : "default"} onClick={handleLogout}
            className="w-full text-white/40 hover:text-rose-400 hover:bg-white/5 justify-start h-8 rounded px-2.5">
            <LogOut className="h-4 w-4 mr-2.5 text-[#94A3B8]" />
            {!collapsed && <span className="text-[11.5px] font-semibold tracking-tight text-[#94A3B8]">Logout System</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Record<string, { title: string; path: string }[]>>({});
  const [isSearching, setIsSearching] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const list = await erpService.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await erpService.markAllRead(admin?.role);
      loadNotifications();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all read");
    }
  };

  const handleNotifClick = async (notif: any) => {
    try {
      await erpService.markRead(notif.id);
      loadNotifications();
      setNotifOpen(false);
      navigate(notif.link);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({});
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await erpService.searchAll(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !isInput)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !admin) {
      checkAuth();
    }
  }, [checkAuth, isAuthenticated, admin]);

  useEffect(() => {
    if (!admin || isLoading) return;

    const currentPath = location.pathname;
    
    // Skip checks for login and unauthorized pages
    if (currentPath === "/admin/login" || currentPath === "/admin/unauthorized" || currentPath === "/admin/travel-desk") return;

    // Special redirect for guides accessing dashboard root
    if ((currentPath === "/admin" || currentPath === "/") && admin.role === 'guide') {
      navigate("/admin/guide-portal");
      return;
    }

    let allowed = true;

    // Special permissions check for guide portal: only guide and superadmin can view
    if (currentPath.startsWith("/admin/guide-portal") && admin.role !== "guide" && admin.role !== "superadmin") {
      allowed = false;
    }

    if (!allowed) {
      console.warn("🚫 Unauthorized access attempt to:", currentPath);
      navigate("/admin/unauthorized");
    }
  }, [location.pathname, admin, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== "/admin/login") {
      console.log("🔒 Not authenticated, redirecting to login...");
      navigate("/admin/login");
    }
  }, [isLoading, isAuthenticated, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-6">
           <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white opacity-40">System Initializing...</p>
        </div>
      </div>
    );
  }

  // The redirect effect above handles unauthenticated access.

  // Determine if we should show the "Need Help" sidebar (VacationLabs style)
  const showHelpPanel = location.pathname.includes('/settings') || location.pathname.includes('/seo') || location.pathname.includes('/pages');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={{ background: "#f1f5f9" }}>
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Top Navbar */}
          <header className="h-12 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-6 shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-3 min-w-0">
               <SidebarTrigger className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-8 w-8 rounded-md shrink-0 flex items-center justify-center transition-colors" />
               <div className="h-4 w-px bg-slate-200 hidden md:block" />
               <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 truncate leading-none">
                 {(() => {
                   const parts = location.pathname.split("/").filter(Boolean);
                   if (parts.length === 0 || (parts.length === 1 && parts[0] === "admin")) {
                     return <span className="text-slate-800 font-bold">Dashboard</span>;
                   }
                   if (location.pathname.startsWith("/admin/accounting")) {
                     const tab = searchParams.get("tab") || "overview";
                     const tabLabel = tab.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                     return (
                       <div className="flex items-center gap-1.5">
                         <span className="text-slate-400 font-medium">Accounting</span>
                         <span className="text-slate-350 font-normal">›</span>
                         <span className="text-slate-800 font-bold">{tabLabel}</span>
                       </div>
                     );
                   }
                   if (location.pathname.startsWith("/admin/operations")) {
                     const tripId = searchParams.get("tripId") || "MKA-2";
                     const tab = searchParams.get("tab") || "passengers";
                     const tabLabel = tab.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                     return (
                       <div className="flex items-center gap-1.5">
                         <span className="text-slate-400 font-medium">Departures Hub</span>
                         <span className="text-slate-355 font-normal">›</span>
                         <span className="text-slate-400 font-medium">{tripId}</span>
                         <span className="text-slate-355 font-normal">›</span>
                         <span className="text-slate-800 font-bold">{tabLabel}</span>
                       </div>
                     );
                   }
                   const lastPart = parts.pop() || "";
                   const cleanName = lastPart.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                   return (
                     <div className="flex items-center gap-1.5">
                       <span className="text-slate-400 font-medium">Admin</span>
                       <span className="text-slate-350 font-normal">›</span>
                       <span className="text-slate-800 font-bold">{cleanName}</span>
                     </div>
                   );
                 })()}
               </div>
            </div>

            <div className="flex items-center gap-3.5 shrink-0">
               {/* Search Input */}
               <div className="relative hidden md:block cursor-pointer" onClick={() => setIsSearchOpen(true)}>
                   <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                   <Input 
                     readOnly
                     placeholder="Search anything... (Press Ctrl+K)" 
                     className="h-8 w-52 bg-slate-50 border border-slate-200 rounded-[4px] text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#F97316] pl-8 shadow-xs cursor-pointer"
                   />
                   <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-350 bg-slate-200/50 px-1 py-0.5 rounded">⌘K</span>
               </div>
 
               <div className="w-px h-4 bg-slate-200 hidden sm:block" />
 
               {/* Notifications, Help, Settings & Avatar */}
                <div className="flex items-center gap-3">
                  <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                    <DropdownMenuTrigger asChild>
                      <button className="relative text-slate-500 hover:text-[#0F172A] transition-colors mt-0.5 p-1 hover:bg-slate-50 rounded-[4px] outline-none">
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-[#E23D4D] text-[8px] font-extrabold text-white h-3.5 w-3.5 rounded-full flex items-center justify-center border border-white">
                            {unreadCount}
                          </span>
                        )}
                        <Bell className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[320px] p-0 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="font-bold text-slate-800 text-xs">Notifications Center</span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[10px] text-[#FF6B00] font-bold hover:underline">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-100/65">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={cn(
                                "p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer relative",
                                !notif.read && "bg-orange-50/10"
                              )}
                            >
                              {!notif.read && (
                                <div className="absolute top-4.5 left-2 w-1.5 h-1.5 bg-[#FF6B00] rounded-full" />
                              )}
                              <div className="pl-3.5 space-y-0.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-800 text-xs truncate max-w-[170px]">{notif.title}</span>
                                  <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                                    notif.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-105' :
                                    notif.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-105' :
                                    'bg-slate-50 text-slate-600 border-slate-105'
                                  }`}>
                                    {notif.priority}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-semibold leading-normal">{notif.message}</p>
                                <div className="flex items-center gap-1.5 pt-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                  <span>{notif.module}</span>
                                  <span>•</span>
                                  <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 font-semibold">
                            No notifications yet.
                          </div>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
 
                  <button className="text-slate-450 hover:text-[#0F172A] transition-colors p-1 hover:bg-slate-50 rounded-[4px]">
                    <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                  </button>

                  <div className="flex items-center gap-2 border-l border-slate-200 pl-3.5 h-7 cursor-pointer hover:opacity-80 transition-all" onClick={() => navigate("/admin/settings")}>
                    <img src={admin?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-[11px] font-bold text-slate-850 leading-none">{admin?.name || admin?.fullName || "Hetal Patel"}</span>
                      <span className="text-[8.5px] text-[#74839A] font-bold mt-0.5 leading-none">{admin?.role === "superadmin" ? "Founder" : (admin?.role || "Founder")}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="hidden sm:flex items-center gap-2 pl-1">
                   <Button 
                     onClick={() => setBookingModalOpen(true)}
                     className="bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[6px] h-8 px-3.5 font-semibold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                   >
                     <Plus className="w-3.5 h-3.5" />New Booking
                   </Button>
                </div>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
             {/* Main Content Area */}
             <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 no-scrollbar">
                <div className="w-full h-full">
                   {children}
                </div>
             </main>

             {/* Help Sidebar */}
             {showHelpPanel && (
               <aside className="w-[380px] border-l bg-white hidden 2xl:flex flex-col overflow-y-auto p-12 no-scrollbar">
                  <div className="space-y-12">
                     <section className="space-y-8">
                        <div className="flex items-center justify-between">
                           <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Resources</h3>
                           <HelpCircle className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="bg-slate-50 rounded-[40px] p-10 border border-slate-100 relative overflow-hidden group">
                           <div className="relative z-10 space-y-6">
                              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-premium">
                                 <BookOpen className="w-6 h-6 text-slate-900" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-lg tracking-tight text-slate-900">Knowledge Base</h4>
                                <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                                   Learn how to configure your platform with our step-by-step tutorials.
                                </p>
                              </div>
                           </div>
                        </div>
                     </section>

                     <section className="space-y-8">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Pro Tips</h3>
                        <div className="bg-primary rounded-[40px] p-10 text-white relative overflow-hidden shadow-luxury">
                           <div className="relative z-10 space-y-6">
                              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                 <Sparkles className="w-6 h-6 text-white" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-xl tracking-tight leading-tight">Master the platform like a pro.</h4>
                                <p className="text-[12px] text-white/80 font-medium">Join our weekly webinars to learn about advanced growth features.</p>
                              </div>
                           </div>
                        </div>
                     </section>
                  </div>
               </aside>
             )}
          </div>
        </div>
      </div>
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-white border border-slate-100 rounded-xl shadow-xl">
          <DialogTitle className="sr-only">Global Search</DialogTitle>
          <DialogDescription className="sr-only">Search modules, paths, and settings instantly.</DialogDescription>
          <div className="relative p-4 border-b border-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              autoFocus
              type="text"
              placeholder="Search anything... (e.g. BK-2026, Rahul, GST, MKA)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none border-none bg-transparent"
            />
          </div>
          <div className="max-h-[380px] overflow-y-auto p-3.5 space-y-4">
            {isSearching ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
                <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">Searching Database...</span>
              </div>
            ) : Object.keys(searchResults).length > 0 ? (
              Object.entries(searchResults).map(([category, items]) => (
                <div key={category} className="space-y-1.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">{category}</h4>
                  <div className="space-y-1">
                    {items.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => {
                          navigate(item.path);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                          setSearchResults({});
                        }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl cursor-pointer transition-all"
                      >
                        <span className="text-xs font-semibold text-slate-850">{item.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : searchQuery.trim() ? (
              <p className="text-xs text-slate-400 text-center py-6 font-semibold">No records match your query.</p>
            ) : (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Quick Navigation Suggestions</h4>
                <div className="space-y-1">
                  {[
                    { title: "Dashboard Overview", path: "/admin" },
                    { title: "Bookings Ledger", path: "/admin/bookings" },
                    { title: "Inquiries & Leads", path: "/admin/inquiries" },
                    { title: "Staff Directory", path: "/admin/hr?tab=staff" },
                    { title: "Company Legal Documents", path: "/admin/company-documents" }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        navigate(item.path);
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl cursor-pointer transition-all"
                    >
                      <span className="text-xs font-semibold text-slate-850">{item.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <NewBookingModal 
        open={bookingModalOpen} 
        onOpenChange={setBookingModalOpen} 
        onSuccess={() => {
          console.log("📅 Booking created successfully!");
          if (location.pathname === '/admin/bookings') {
             window.location.reload();
          }
        }}
      />
    </SidebarProvider>
  );
}
