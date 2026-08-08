import React from "react";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  DashboardWidget,
  DashboardWidgetContextProps,
} from "@/config/dashboardWidgetRegistry";

// Announcements Widget
export const AnnouncementsWidget: React.FC<DashboardWidgetContextProps> = ({
  announcements,
  loadingAnnouncements,
  setShowAddAnnouncement,
  setShowAllAnnouncements,
  hasPermission,
  userPerms,
  userRole,
}) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">
        Announcements
      </span>
      <div className="flex items-center gap-2">
        {hasPermission(userPerms, PERMISSIONS.SETTINGS_VIEW, userRole) && (
          <button
            onClick={() => setShowAddAnnouncement(true)}
            className="text-[10px] font-bold text-[#F97316] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2 py-0.5 rounded transition-all"
          >
            + Add
          </button>
        )}
        <span
          onClick={() => setShowAllAnnouncements(true)}
          className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
        >
          View All
        </span>
      </div>
    </div>
    <div className="p-3.5 flex-1 space-y-3 text-[12px] overflow-y-auto max-h-[160px] no-scrollbar">
      {loadingAnnouncements ? (
        <p className="text-[11px] text-[#74839A] italic">
          Loading announcements...
        </p>
      ) : announcements.length === 0 ? (
        <p className="text-[11px] text-[#74839A] italic text-center py-2">
          No announcements posted.
        </p>
      ) : (
        announcements.slice(0, 5).map((ann: any) => (
          <div
            key={ann.id}
            className="space-y-0.5 pb-1 border-b border-[#E3EAF2]/30 last:border-0"
          >
            <p className="font-bold text-[#162B45] leading-tight">
              {ann.title}
            </p>
            <p className="text-[9px] text-[#74839A] font-semibold leading-none">
              By {ann.author} •{" "}
              {(() => {
                const diffMs =
                  new Date().getTime() - new Date(ann.createdAt).getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diffMins < 1) return "just now";
                if (diffMins < 60) return `${diffMins}m ago`;
                if (diffHrs < 24) return `${diffHrs}h ago`;
                return `${diffDays}d ago`;
              })()}
            </p>
          </div>
        ))
      )}
    </div>
  </div>
);

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
    <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
      <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
        <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">
          Today's Tasks
        </span>
        <span
          onClick={() => navigate("/admin/bookings")}
          className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
        >
          View All
        </span>
      </div>
      <div className="p-3.5 flex-1 flex items-center gap-4">
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
    </div>
  );
};

// Recent Bookings Widget
export const RecentBookingsWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  loading,
  navigate,
}) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">
        Recent Bookings
      </span>
      <span
        onClick={() => navigate("/admin/bookings")}
        className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
      >
        View All
      </span>
    </div>
    <div className="p-3.5 flex-1 space-y-2.5 overflow-y-auto max-h-[160px] no-scrollbar text-[12px]">
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
  </div>
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
