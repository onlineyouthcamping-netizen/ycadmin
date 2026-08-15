import React from "react";
import { Plus } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  DashboardWidget,
  DashboardWidgetContextProps,
} from "@/config/dashboardWidgetRegistry";
import { DashCard, DashHead, dashLink } from "@/modules/dashboard.chrome";

export const AnnouncementsWidget: React.FC<DashboardWidgetContextProps> = ({
  announcements,
  loadingAnnouncements,
  setShowAddAnnouncement,
  setShowAllAnnouncements,
  hasPermission,
  userPerms,
  userRole,
}) => (
  <DashCard>
    <DashHead
      title="Announcements"
      action={
        <>
          {hasPermission(userPerms, PERMISSIONS.SETTINGS_VIEW, userRole) && (
            <button
              type="button"
              onClick={() => setShowAddAnnouncement(true)}
              className={cnDashAction()}
            >
              <Plus className="w-3 h-3" strokeWidth={2.25} />
              Add
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAllAnnouncements(true)}
            className={dashLink}
          >
            View all
          </button>
        </>
      }
    />
    <div className="px-4 py-3.5 flex-1 space-y-3 text-[12px] overflow-y-auto max-h-[180px] no-scrollbar">
      {loadingAnnouncements ? (
        <p className="text-[12px] text-slate-400">Loading…</p>
      ) : announcements.length === 0 ? (
        <p className="text-[12px] text-slate-400 text-center py-4">No announcements yet.</p>
      ) : (
        announcements.slice(0, 5).map((ann: any) => (
          <div key={ann.id} className="space-y-1 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
            <p className="font-semibold text-[#0B1528] leading-snug">{ann.title}</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {ann.author} · {relativeTime(ann.createdAt)}
            </p>
          </div>
        ))
      )}
    </div>
  </DashCard>
);

function cnDashAction() {
  return "inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF4D00] hover:text-[#E04400] whitespace-nowrap";
}

function relativeTime(createdAt: string) {
  const diffMs = new Date().getTime() - new Date(createdAt).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${diffDays}d ago`;
}

// Today's Tasks Widget
export const TodaysTasksWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => {
  const total = stats?.tasksTotal ?? 0;
  const completed = stats?.tasksCompleted ?? 0;
  const pending = stats?.tasksPending ?? 0;
  const overdue = stats?.tasksOverdue ?? 0;
  const circumference = 2 * Math.PI * 26;
  const pct = total > 0 ? completed / total : 0;
  const offset = circumference - pct * circumference;

  return (
    <DashCard>
      <DashHead
        title="Today's tasks"
        action={
          <button type="button" onClick={() => navigate("/admin/bookings")} className={dashLink}>
            View all
          </button>
        }
      />
      <div className="px-4 py-3.5 flex-1 flex items-center gap-4">
        <div className="relative w-[60px] h-[60px] flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="30"
              cy="30"
              r="26"
              className="stroke-slate-100"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="30"
              cy="30"
              r="26"
              className="stroke-emerald-500"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference.toString()}
              strokeDashoffset={offset.toString()}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[12px] font-extrabold text-[#162B45]">
              {total}
            </span>
            <span className="text-[8px] text-[#74839A] font-bold uppercase mt-0.5">
              Tasks
            </span>
          </div>
        </div>
        <div className="space-y-1 text-[11px] flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[#74839A] font-medium">Completed</span>
            <span className="font-bold text-[#16A34A]">{completed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#74839A] font-medium">Pending</span>
            <span className="font-bold text-[#D97706]">{pending}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#74839A] font-medium">Overdue</span>
            <span className="font-bold text-[#E23D4D]">{overdue}</span>
          </div>
        </div>
      </div>
    </DashCard>
  );
};

// Recent Bookings Widget
export const RecentBookingsWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  loading,
  navigate,
}) => (
  <DashCard>
    <DashHead
      title="Recent bookings"
      action={
        <button type="button" onClick={() => navigate("/admin/bookings")} className={dashLink}>
          View all
        </button>
      }
    />
    <div className="px-4 py-3.5 flex-1 space-y-3 overflow-y-auto max-h-[180px] no-scrollbar text-[12px]">
      {loading ? (
        <p className="text-[11px] text-[#74839A] italic">
          Loading transactions...
        </p>
      ) : !stats?.recentBookings || stats.recentBookings.length === 0 ? (
        <p className="text-[11px] text-[#74839A] italic">
          No recent transactions found.
        </p>
      ) : (
        stats.recentBookings.map((b: any) => (
          <div
            key={b.id}
            onClick={() => navigate("/admin/bookings")}
            className="flex gap-2 items-start leading-tight cursor-pointer hover:bg-slate-50/50 p-1 rounded transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-blue-500" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[#162B45] leading-none">
                {b.userName} – {b.tripTitle}
              </p>
              <p className="text-[9px] text-[#74839A] font-semibold leading-none mt-0.5">
                ₹{Number(b.amount || 0).toLocaleString("en-IN")} ·{" "}
                <span className="uppercase text-[8px] font-extrabold text-slate-500">
                  {b.status}
                </span>
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  </DashCard>
);

export const generalWidgets: DashboardWidget[] = [
  {
    id: "announcements",
    title: "Announcements",
    category: "management",
    permission: PERMISSIONS.ANNOUNCEMENTS_VIEW,
    order: 80,
    colSpanDesktop: "col-span-12 md:col-span-6 lg:col-span-3",
    component: AnnouncementsWidget,
  },
  {
    id: "todays-tasks",
    title: "Today's Tasks",
    category: "team",
    permission: PERMISSIONS.TASKS_VIEW,
    order: 90,
    colSpanDesktop: "col-span-12 md:col-span-6 lg:col-span-3",
    component: TodaysTasksWidget,
  },
  {
    id: "recent-bookings",
    title: "Recent Bookings",
    category: "team",
    permission: PERMISSIONS.BOOKINGS_VIEW,
    order: 120,
    colSpanDesktop: "col-span-12 md:col-span-6 lg:col-span-3",
    component: RecentBookingsWidget,
  },
];
