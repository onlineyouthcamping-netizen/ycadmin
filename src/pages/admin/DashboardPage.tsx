import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { dashboardService } from "@/services/dashboard.service";
import { ticketApprovalService } from "@/services/ticketApproval.service";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission } from "@/lib/permissions";
import type { DashboardStats } from "@/types";
import {
  announcementsService,
  Announcement,
} from "@/services/announcements.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileDashboardView } from "@/components/mobile/MobileDashboardView";
import {
  DASHBOARD_WIDGET_REGISTRY,
  DashboardCategory,
  CATEGORY_LABELS,
} from "@/config/dashboardWidgetRegistry";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { admin } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketPendingCount, setTicketPendingCount] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  const [dateFilter, setDateFilter] = useState("today");

  const [currentDateString] = useState(() => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  });

  const userPerms =
    (admin as any)?.permissions || (admin as any)?.customPermissions || [];
  const userRole = admin?.role;

  // Filter widgets strictly by module permissions
  const visibleWidgets = useMemo(() => {
    return DASHBOARD_WIDGET_REGISTRY.filter(
      (w) => !w.permission || hasPermission(userPerms, w.permission, userRole),
    ).sort((a, b) => a.order - b.order);
  }, [userPerms, userRole]);

  // Group visible widgets into balanced category buckets
  const categoryOrder: DashboardCategory[] = [
    "kpi",
    "operations",
    "management",
    "team",
  ];

  const widgetsByCategory = useMemo(() => {
    const map: Record<DashboardCategory, typeof visibleWidgets> = {
      kpi: [],
      operations: [],
      management: [],
      team: [],
    };
    visibleWidgets.forEach((w) => {
      if (map[w.category]) {
        map[w.category].push(w);
      }
    });
    return map;
  }, [visibleWidgets]);

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const list = await announcementsService.getAll();
      setAnnouncements(list || []);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim()) {
      toast.error("Announcement title is required");
      return;
    }
    setCreatingAnnouncement(true);
    try {
      await announcementsService.create(announcementTitle);
      toast.success("Announcement published successfully");
      setAnnouncementTitle("");
      setShowAddAnnouncement(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to publish announcement");
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      dashboardService.getStats(dateFilter),
      ticketApprovalService.getPendingCount().catch(() => 0),
      announcementsService.getAll().catch(() => []),
    ])
      .then(([data, pendingCount, list]) => {
        if (cancelled) return;
        setStats(data || null);
        setTicketPendingCount(pendingCount);
        setAnnouncements(list);
        setLoadingAnnouncements(false);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load dashboard stats:", err);
        setStats(null);
        setLoading(false);
        setLoadingAnnouncements(false);
        toast.error("Could not load live dashboard stats. Check API connection.");
      });
    return () => {
      cancelled = true;
    };
  }, [dateFilter]);

  return (
    <div className="min-w-0 select-none text-[#0B1528]">
      <div className="block md:hidden">
        <MobileDashboardView
          stats={stats}
          loading={loading}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          userPerms={userPerms}
          userRole={userRole}
          onOpenNewBooking={() =>
            window.dispatchEvent(new Event("yc:open-new-booking"))
          }
          onOpenSearch={() =>
            window.dispatchEvent(new Event("yc:open-global-search"))
          }
        />
      </div>

      {/* â”€â”€â”€ DESKTOP DASHBOARD VIEW (>=768px) â”€â”€â”€ */}
      <div className="hidden md:block space-y-4">
        <div className="flex min-h-7 items-center justify-between gap-3">
          <div className="text-[12px] font-medium text-slate-500">
            {currentDateString}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-7 items-center rounded-md border border-[#E8EEF4] bg-white px-2.5">
              <span className="text-[10px] font-semibold capitalize text-[#FF4D00]">
                {userRole ? `${userRole} view` : "Operator"}
              </span>
            </div>

            <div className="flex h-7 items-center gap-1.5 rounded-md border border-[#E8EEF4] bg-white px-2.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="cursor-pointer border-0 bg-transparent text-[11px] font-medium text-[#0B1528] outline-none"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
              </select>
            </div>
          </div>
        </div>

        {/* â”€â”€â”€ DYNAMIC CATEGORIZED WIDGET SECTIONS â”€â”€â”€ */}
        {categoryOrder.map((cat) => {
          const catWidgets = widgetsByCategory[cat];
          // If no widgets in this category have permission, the ENTIRE SECTION DISAPPEARS!
          if (!catWidgets || catWidgets.length === 0) return null;

          const info = CATEGORY_LABELS[cat];

          return (
            <section key={cat} className="space-y-2.5">
              {/* Render Section Header for Non-KPI Categories */}
              {cat !== "kpi" && (
                <div className="flex min-h-7 items-baseline justify-between gap-3 border-b border-[#E8EEF4] pb-1.5">
                  <h2 className="flex items-center gap-2 text-[11px] font-semibold text-[#0B1528]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D00]" />
                    {info.title}
                  </h2>
                  <span className="truncate text-[10px] font-medium text-slate-400">
                    {info.subtitle}
                  </span>
                </div>
              )}

              {/* Grid of Widgets inside Category */}
              <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-12">
                {catWidgets.map((widget) => {
                  const WidgetComponent = widget.component;
                  return (
                    <div
                      key={widget.id}
                      className={cn("flex min-w-0 flex-col", widget.colSpanDesktop)}
                    >
                      <WidgetComponent
                        stats={stats}
                        loading={loading}
                        ticketPendingCount={ticketPendingCount}
                        announcements={announcements}
                        loadingAnnouncements={loadingAnnouncements}
                        admin={admin}
                        userPerms={userPerms}
                        userRole={userRole}
                        navigate={navigate}
                        setShowAddAnnouncement={setShowAddAnnouncement}
                        setShowAllAnnouncements={setShowAllAnnouncements}
                        hasPermission={hasPermission}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* â”€â”€â”€ DIALOG: CREATE ANNOUNCEMENT â”€â”€â”€ */}
      <Dialog open={showAddAnnouncement} onOpenChange={setShowAddAnnouncement}>
        <DialogContent className="sm:max-w-[425px] bg-white p-5 rounded-xl shadow-lg border border-[#E8EEF4]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-[13px] font-semibold text-[#0B1528]">
              <Megaphone className="h-4 w-4 text-[#FF4D00]" strokeWidth={1.75} />
              Publish announcement
            </DialogTitle>
            <DialogDescription className="text-[11px] font-medium text-slate-400">
              Post an update to the admin dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAnnouncement} className="mt-3 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-500">
                Announcement title
              </label>
              <Input
                required
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Office closed tomorrow due to weather"
                className="h-8 rounded-md border border-[#E8EEF4] bg-white text-xs"
              />
            </div>
            <DialogFooter className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddAnnouncement(false)}
                className="h-8 rounded-md text-xs font-semibold text-slate-500 hover:bg-[#F4F7FB] hover:text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingAnnouncement}
                className="h-8 rounded-md bg-[#FF4D00] px-4 text-xs font-semibold text-white hover:bg-[#E04400]"
              >
                {creatingAnnouncement ? "Publishingâ€¦" : "Publish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* â”€â”€â”€ DIALOG: ALL ANNOUNCEMENTS â”€â”€â”€ */}
      <Dialog
        open={showAllAnnouncements}
        onOpenChange={setShowAllAnnouncements}
      >
        <DialogContent className="sm:max-w-[500px] bg-white p-5 rounded-xl shadow-lg border border-[#E8EEF4] flex flex-col max-h-[80vh]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-[13px] font-semibold text-[#0B1528]">
              <Megaphone className="h-4 w-4 text-[#FF4D00]" strokeWidth={1.75} />
              All announcements ({announcements.length})
            </DialogTitle>
            <DialogDescription className="text-[11px] font-medium text-slate-400">
              Updates published to the company.
            </DialogDescription>
          </DialogHeader>

          <div className="no-scrollbar mt-3 max-h-[50vh] flex-1 space-y-2 overflow-y-auto pr-1">
            {announcements.length === 0 ? (
              <p className="py-8 text-center text-[11px] font-medium text-slate-400">
                No announcements posted.
              </p>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="rounded-lg border border-[#E8EEF4] bg-[#F8FAFC] p-3"
                >
                  <p className="text-[12px] font-medium leading-snug text-[#0B1528]">
                    {ann.title}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    {ann.author} Â·{" "}
                    {new Date(ann.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="mt-3 shrink-0 border-t border-[#E8EEF4] pt-3">
            <Button
              type="button"
              onClick={() => setShowAllAnnouncements(false)}
              className="h-8 rounded-md bg-[#F4F7FB] px-4 text-xs font-semibold text-slate-600 hover:bg-[#E8EEF4]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
