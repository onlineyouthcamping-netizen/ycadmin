import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { dashboardService } from "@/services/dashboard.service";
import { ticketApprovalService } from "@/services/ticketApproval.service";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission } from "@/lib/permissions";
import type { DashboardStats } from "@/types";
import { announcementsService, Announcement } from "@/services/announcements.service";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileDashboardView } from "@/components/mobile/MobileDashboardView";
import { DASHBOARD_WIDGET_REGISTRY } from "@/config/dashboardWidgetRegistry";
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

  const [dateFilter, setDateFilter] = useState("all");

  const [currentDateString] = useState(() => {
    return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  });

  const userPerms = (admin as any)?.permissions || (admin as any)?.customPermissions || [];
  const userRole = admin?.role;

  // Filter widgets strictly by user permissions and sort by order
  const visibleWidgets = useMemo(() => {
    return DASHBOARD_WIDGET_REGISTRY
      .filter((w) => !w.permission || hasPermission(userPerms, w.permission, userRole))
      .sort((a, b) => a.order - b.order);
  }, [userPerms, userRole]);

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
    setLoading(true);
    Promise.all([
      dashboardService.getStats(dateFilter),
      ticketApprovalService.getPendingCount().catch(() => 0),
      announcementsService.getAll().catch(() => [])
    ])
      .then(([data, pendingCount, list]) => {
        setStats(data);
        setTicketPendingCount(pendingCount);
        setAnnouncements(list);
        setLoadingAnnouncements(false);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setLoadingAnnouncements(false);
      });
  }, [dateFilter]);

  return (
    <div className="space-y-4 pb-12 select-none px-4 py-3 bg-[#F4F7FB] min-h-screen text-[#162B45] font-sans antialiased">
      
      {/* ─── MOBILE DASHBOARD VIEW (<768px) ─── */}
      <div className="block md:hidden">
        <MobileDashboardView 
          onOpenNewBooking={() => {}} 
          onOpenSearch={() => {}} 
        />
      </div>

      {/* ─── DESKTOP DASHBOARD VIEW (>=768px) ─── */}
      <div className="hidden md:block space-y-4">

        {/* ─── SUB-HEADER BAR ─── */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] h-[40px] px-5 flex items-center justify-between font-sans -mx-4 -mt-3 mb-3">
          <div className="text-[12px] font-normal text-[#64748B]">
            {currentDateString}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-[6px] px-3 py-1 text-[12px] font-medium text-[#0A192F] cursor-pointer hover:bg-slate-50 transition-colors">
              <span className="uppercase font-bold text-[10px] text-orange-600">{userRole ? `${userRole} VIEW` : "OPERATOR VIEW"}</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </div>

            <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-[6px] px-2 py-1 text-[11px] font-semibold text-[#0A192F]">
              <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent border-0 outline-none cursor-pointer text-[#0A192F] font-medium text-[11px]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── DYNAMIC PERMISSION-BASED WIDGET GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {visibleWidgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <div key={widget.id} className={cn("flex flex-col", widget.colSpanDesktop)}>
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

      </div>

      {/* ─── DIALOG: CREATE ANNOUNCEMENT ─── */}
      <Dialog open={showAddAnnouncement} onOpenChange={setShowAddAnnouncement}>
        <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              📢 Publish Announcement
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              Post an update or announcement to the admin dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">Announcement Title *</label>
              <Input 
                required 
                value={announcementTitle} 
                onChange={e => setAnnouncementTitle(e.target.value)} 
                placeholder="e.g. Office closed tomorrow due to weather" 
                className="h-9 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <DialogFooter className="pt-2 flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowAddAnnouncement(false)}
                className="h-9 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={creatingAnnouncement} 
                className="h-9 text-xs font-semibold bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg px-4"
              >
                {creatingAnnouncement ? "Publishing..." : "Publish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: ALL ANNOUNCEMENTS ─── */}
      <Dialog open={showAllAnnouncements} onOpenChange={setShowAllAnnouncements}>
        <DialogContent className="sm:max-w-[500px] bg-white p-6 rounded-xl shadow-lg border border-slate-200 flex flex-col max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              📢 All Announcements ({announcements.length})
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              List of updates and announcements published to the company.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 mt-4 max-h-[50vh] no-scrollbar">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No announcements posted.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/50 space-y-1">
                  <p className="font-bold text-[#162B45] text-xs leading-snug">{ann.title}</p>
                  <p className="text-[9px] text-[#74839A] font-semibold flex items-center gap-2">
                    <span>By {ann.author}</span>
                    <span>•</span>
                    <span>{new Date(ann.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </p>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 mt-2 shrink-0">
            <Button 
              type="button" 
              onClick={() => setShowAllAnnouncements(false)}
              className="h-9 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-4"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
