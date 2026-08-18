import React from "react";
import { User, MapPin } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  DashboardWidget,
  DashboardWidgetContextProps,
} from "@/config/dashboardWidgetRegistry";
import {
  DashBody,
  DashCard,
  DashHead,
  DashList,
  DashRow,
  dashEmpty,
  dashLink,
  dashRowLabel,
} from "@/modules/dashboard.chrome";

const ATTENTION_FALLBACK = [
  {
    label: "Payments waiting verification",
    count: 8,
    color: "bg-[#E23D4D]",
    urgent: true,
    path: "/admin/approvals-hub",
  },
  {
    label: "Aadhaar pending",
    count: 16,
    color: "bg-[#D97706]",
    path: "/admin/approvals-hub",
  },
  {
    label: "Hotels pending confirmation",
    count: 5,
    color: "bg-[#D97706]",
    path: "/admin/departure-workspace",
  },
  {
    label: "Vendors with payments due today",
    count: 3,
    color: "bg-[#E23D4D]",
    urgent: true,
    path: "/admin/accounting-workspace",
  },
  {
    label: "Rooming pending",
    count: 12,
    color: "bg-[#D97706]",
    path: "/admin/departure-workspace",
  },
  {
    label: "Customer complaints",
    count: 2,
    color: "bg-[#E23D4D]",
    urgent: true,
    path: "/admin/departure-workspace",
  },
  {
    label: "Tasks pending > 24 hours",
    count: 14,
    color: "bg-[#E23D4D]",
    urgent: true,
    path: "/admin/departure-workspace",
  },
  {
    label: "Missing train tickets",
    count: 6,
    color: "bg-[#E23D4D]",
    urgent: true,
    path: "/admin/approvals-hub",
  },
  {
    label: "Missing tempo confirmation",
    count: 4,
    color: "bg-[#D97706]",
    path: "/admin/departure-workspace",
  },
];

// Needs Your Attention Widget
export const NeedsAttentionWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <DashCard>
    <DashHead
      title="Needs your attention"
      action={
        <button
          type="button"
          onClick={() => navigate("/admin/approvals-hub")}
          className={dashLink}
        >
          View all
        </button>
      }
    />
    <DashBody>
      <DashList>
        {(stats?.attentionItems || ATTENTION_FALLBACK).map(
          (item: any, idx: number) => (
            <DashRow
              key={idx}
              onClick={() => navigate(item.path)}
              className="py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.color}`}
                />
                <span className={dashRowLabel}>{item.label}</span>
              </span>
              <span
                className={`shrink-0 text-[11px] font-semibold tabular-nums ${
                  item.urgent ? "text-[#E23D4D]" : "text-slate-400"
                }`}
              >
                {item.count}
              </span>
            </DashRow>
          ),
        )}
      </DashList>
    </DashBody>
  </DashCard>
);

// Trips Running Now Widget
export const TripsRunningNowWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <DashCard>
    <DashHead
      title="Trips running now"
      action={
        <button
          type="button"
          onClick={() => navigate("/admin/departure-workspace")}
          className={dashLink}
        >
          View all
        </button>
      }
    />
    <DashBody>
      {!stats?.tripsRunningNow || stats.tripsRunningNow.length === 0 ? (
        <p className={dashEmpty}>No active trips running today.</p>
      ) : (
        <DashList>
          {stats.tripsRunningNow.map((trip: any, idx: number) => (
            <DashRow
              key={idx}
              onClick={() => navigate("/admin/departure-workspace")}
              className="py-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-semibold leading-tight text-[#0B1528]">
                  {trip.code}
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-medium leading-none text-slate-400">
                  {trip.name}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="flex items-center justify-end gap-1 text-[11px] font-semibold leading-tight text-[#0B1528]">
                  <User className="h-3 w-3 text-slate-400" strokeWidth={1.75} />
                  {trip.size}
                </span>
                <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-medium leading-none text-emerald-600">
                  <MapPin className="h-3 w-3" strokeWidth={1.75} />
                  {trip.stay}
                </span>
              </span>
            </DashRow>
          ))}
        </DashList>
      )}
    </DashBody>
  </DashCard>
);

// Trips Departing Next 7 Days Widget
export const TripsNext7DaysWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <DashCard>
    <DashHead
      title="Departing next 7 days"
      action={
        <button
          type="button"
          onClick={() => navigate("/admin/operations")}
          className={dashLink}
        >
          View all
        </button>
      }
    />
    <DashBody>
      {!stats?.tripsDepartingNext7Days ||
      stats.tripsDepartingNext7Days.length === 0 ? (
        <p className={dashEmpty}>No departures in the next 7 days.</p>
      ) : (
        <DashList>
          {stats.tripsDepartingNext7Days.map((trip: any, idx: number) => (
            <DashRow
              key={idx}
              onClick={() => navigate("/admin/operations")}
              className="py-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-semibold leading-tight text-[#0B1528]">
                  {trip.name}
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-medium leading-none text-slate-400">
                  {trip.date}
                </span>
              </span>
              <span
                className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                  trip.status === "full"
                    ? "border-emerald-200 bg-[#ECFDF3] text-[#16A34A]"
                    : "border-blue-200 bg-[#EFF6FF] text-[#2563EB]"
                }`}
              >
                {trip.count} booked
              </span>
            </DashRow>
          ))}
        </DashList>
      )}
    </DashBody>
  </DashCard>
);

// Today's Schedule Widget
export const TodaysScheduleWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <DashCard>
    <DashHead
      title="Today's schedule"
      action={
        <button
          type="button"
          onClick={() => navigate("/admin/departure-workspace")}
          className={dashLink}
        >
          View all
        </button>
      }
    />
    <DashBody>
      {!stats?.todaysSchedule || stats.todaysSchedule.length === 0 ? (
        <p className={dashEmpty}>No tasks or departures scheduled today.</p>
      ) : (
        <DashList>
          {stats.todaysSchedule.map((sched: any, idx: number) => (
            <DashRow
              key={idx}
              onClick={() => navigate("/admin/departure-workspace")}
              className="justify-start gap-2 py-1.5"
            >
              <span className="w-[52px] shrink-0 text-[10px] font-medium tabular-nums text-slate-400">
                {sched.time}
              </span>
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${sched.color}`}
              />
              <span className={`${dashRowLabel} min-w-0`}>{sched.label}</span>
            </DashRow>
          ))}
        </DashList>
      )}
    </DashBody>
  </DashCard>
);

export const opsWidgets: DashboardWidget[] = [
  {
    id: "needs-attention",
    title: "Needs Your Attention",
    category: "operations",
    permission: PERMISSIONS.OPS_VIEW,
    order: 20,
    colSpanDesktop: "col-span-12 lg:col-span-4",
    component: NeedsAttentionWidget,
  },
  {
    id: "trips-running-now",
    title: "Trips Running Now",
    category: "operations",
    permission: PERMISSIONS.TRIPS_VIEW,
    order: 30,
    colSpanDesktop: "col-span-12 lg:col-span-4",
    component: TripsRunningNowWidget,
  },
  {
    id: "trips-next-7-days",
    title: "Trips Departing Next 7 Days",
    category: "operations",
    permission: PERMISSIONS.TRIPS_VIEW,
    order: 40,
    colSpanDesktop: "col-span-12 lg:col-span-4",
    component: TripsNext7DaysWidget,
  },
  {
    id: "todays-schedule",
    title: "Today's Schedule",
    category: "management",
    permission: PERMISSIONS.OPS_VIEW,
    order: 50,
    colSpanDesktop: "col-span-12 md:col-span-6 lg:col-span-3",
    component: TodaysScheduleWidget,
  },
];
