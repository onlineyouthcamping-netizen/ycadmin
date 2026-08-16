import React from "react";
import { User, MapPin } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  DashboardWidget,
  DashboardWidgetContextProps,
} from "@/config/dashboardWidgetRegistry";

// Needs Your Attention Widget
export const NeedsAttentionWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[11px] font-semibold tracking-wide text-[#0B1528]">
        Needs your attention
      </span>
      <span
        onClick={() => navigate("/admin/approvals-hub")}
        className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
      >
        View All
      </span>
    </div>
    <div className="p-3.5 flex-1 space-y-2">
      {(
        stats?.attentionItems || [
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
        ]
      ).map((item: any, idx: number) => (
        <div
          key={idx}
          onClick={() => navigate(item.path)}
          className="flex items-center justify-between min-h-[22px] text-[12px] hover:bg-[#F8FAFD] px-1 rounded transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
            <span className="font-semibold text-[#162B45]">{item.label}</span>
          </div>
          <span
            className={`font-bold text-[11px] ${item.urgent ? "text-[#E23D4D]" : "text-[#74839A]"}`}
          >
            {item.count}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Trips Running Now Widget
export const TripsRunningNowWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[11px] font-semibold tracking-wide text-[#0B1528]">
        Trips running now
      </span>
      <span
        onClick={() => navigate("/admin/departure-workspace")}
        className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
      >
        View All
      </span>
    </div>
    <div className="p-3.5 flex-1 space-y-3.5">
      {!stats?.tripsRunningNow || stats.tripsRunningNow.length === 0 ? (
        <p className="text-xs text-[#74839A] italic text-center py-4">
          No active trips running today.
        </p>
      ) : (
        stats.tripsRunningNow.map((trip: any, idx: number) => (
          <div
            key={idx}
            onClick={() => navigate("/admin/departure-workspace")}
            className="flex items-center justify-between min-h-[34px] hover:bg-[#F8FAFD] p-1 rounded transition-colors cursor-pointer"
          >
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-[#162B45]">
                {trip.code}
              </p>
              <p className="text-[10px] text-[#74839A] font-medium leading-none">
                {trip.name}
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[10.5px] font-semibold text-[#162B45] flex items-center justify-end gap-1">
                <User className="w-3 h-3 text-[#74839A]" /> {trip.size}
              </p>
              <p className="text-[9.5px] text-emerald-600 font-bold leading-none flex items-center justify-end gap-0.5">
                <MapPin className="w-3 h-3 text-emerald-600" /> {trip.stay}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Trips Departing Next 7 Days Widget
export const TripsNext7DaysWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[11px] font-semibold tracking-wide text-[#0B1528]">
        Trips departing next 7 days
      </span>
      <span
        onClick={() => navigate("/admin/operations")}
        className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
      >
        View All
      </span>
    </div>
    <div className="p-3.5 flex-1 space-y-3.5">
      {!stats?.tripsDepartingNext7Days ||
      stats.tripsDepartingNext7Days.length === 0 ? (
        <p className="text-xs text-[#74839A] italic text-center py-4">
          No departures in the next 7 days.
        </p>
      ) : (
        stats.tripsDepartingNext7Days.map((trip: any, idx: number) => (
          <div
            key={idx}
            onClick={() => navigate("/admin/operations")}
            className="flex items-center justify-between min-h-[34px] hover:bg-[#F8FAFD] p-1 rounded transition-colors cursor-pointer"
          >
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-[#162B45]">
                {trip.name}
              </p>
              <p className="text-[10px] text-[#74839A] font-semibold leading-none">
                {trip.date}
              </p>
            </div>
            <span
              className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-sm border ${trip.status === "full" ? "bg-[#ECFDF3] text-[#16A34A] border-emerald-200" : "bg-[#EFF6FF] text-[#2563EB] border-blue-200"}`}
            >
              {trip.count} Booked
            </span>
          </div>
        ))
      )}
    </div>
  </div>
);

// Today's Schedule Widget
export const TodaysScheduleWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[11px] font-semibold tracking-wide text-[#0B1528]">
        Today's schedule
      </span>
      <span
        onClick={() => navigate("/admin/departure-workspace")}
        className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
      >
        View Full
      </span>
    </div>
    <div className="p-3.5 flex-1 space-y-3">
      {!stats?.todaysSchedule || stats.todaysSchedule.length === 0 ? (
        <p className="text-xs text-[#74839A] italic text-center py-4">
          No tasks or departures scheduled today.
        </p>
      ) : (
        stats.todaysSchedule.map((sched: any, idx: number) => (
          <div
            key={idx}
            onClick={() => navigate("/admin/departure-workspace")}
            className="flex gap-2 items-start min-h-[30px] cursor-pointer hover:bg-slate-50/55 p-0.5 rounded transition-colors"
          >
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#74839A] w-[54px] shrink-0 mt-0.5">
              {sched.time}
            </span>
            <div className="flex items-start gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${sched.color}`}
              />
              <span className="text-[12px] font-semibold text-[#162B45] leading-tight truncate max-w-[130px]">
                {sched.label}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
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
