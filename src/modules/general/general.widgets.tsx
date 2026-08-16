import React from "react";
import { Plus } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  DashboardWidget,
  DashboardWidgetContextProps,
} from "@/config/dashboardWidgetRegistry";
import {
  DashBody,
  DashCard,
  DashHead,
  dashEmpty,
  dashLink,
} from "@/modules/dashboard.chrome";

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
    <DashBody className="no-scrollbar max-h-[180px] space-y-2.5 overflow-y-auto text-[12px]">
      {loadingAnnouncements ? (
        <p className={dashEmpty}>Loading…</p>
      ) : announcements.length === 0 ? (
        <p className={dashEmpty}>No announcements yet.</p>
      ) : (
        announcements.slice(0, 5).map((ann: any) => (
          <div key={ann.id} className="border-b border-[#E8EEF4] pb-2.5 last:border-0 last:pb-0">
            <p className="font-medium leading-snug text-[#0B1528]">{ann.title}</p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">
              {ann.author} · {relativeTime(ann.createdAt)}
            </p>
          </div>
        ))
      )}
    </DashBody>
  </DashCard>
);

function cnDashAction() {
  return `inline-flex items-center gap-1 ${dashLink}`;
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
      <DashBody className="flex items-center gap-4">
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
            <span className="text-[13px] font-semibold tabular-nums text-[#0B1528]">
              {total}
            </span>
            <span className="mt-0.5 text-[9px] font-medium text-slate-400">
              tasks
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-400">Completed</span>
            <span className="font-semibold tabular-nums text-[#16A34A]">
              {completed}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-400">Pending</span>
            <span className="font-semibold tabular-nums text-[#D97706]">
              {pending}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-400">Overdue</span>
            <span className="font-semibold tabular-nums text-[#E23D4D]">
              {overdue}
            </span>
          </div>
        </div>
      </DashBody>
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
    <DashBody className="no-scrollbar max-h-[180px] space-y-2 overflow-y-auto text-[12px]">
      {loading ? (
        <p className={dashEmpty}>Loading…</p>
      ) : !stats?.recentBookings || stats.recentBookings.length === 0 ? (
        <p className={dashEmpty}>No recent bookings yet.</p>
      ) : (
        stats.recentBookings.map((b: any) => (
          <div
            key={b.id}
            onClick={() => navigate("/admin/bookings")}
            className="-mx-1.5 flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-[#F4F7FB]"
          >
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <div className="min-w-0">
              <p className="truncate font-medium leading-tight text-[#0B1528]">
                {b.userName} – {b.tripTitle}
              </p>
              <p className="mt-1 text-[10px] font-medium leading-none text-slate-400">
                ₹{Number(b.amount || 0).toLocaleString("en-IN")} ·{" "}
                <span className="capitalize">{String(b.status || "").toLowerCase()}</span>
              </p>
            </div>
          </div>
        ))
      )}
    </DashBody>
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
