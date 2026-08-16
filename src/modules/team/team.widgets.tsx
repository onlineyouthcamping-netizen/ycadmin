import React from "react";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  DashboardWidget,
  DashboardWidgetContextProps,
} from "@/config/dashboardWidgetRegistry";
import {
  DashBody,
  DashCard,
  DashHead,
  dashLink,
} from "@/modules/dashboard.chrome";

const ONLINE_FALLBACK = ["Suresh", "Vidhi", "Zeel", "Parth", "Neeki", "Vibhuti"];
const LEAVE_FALLBACK = ["Sachin", "Jatin"];

const WORKLOAD_FALLBACK = [
  { name: "Suresh Bhai", state: "Normal", pct: 70, color: "bg-[#16A34A]" },
  { name: "Vidhi", state: "High", pct: 78, color: "bg-[#D97706]" },
  { name: "Zeel", state: "High", pct: 75, color: "bg-[#D97706]" },
  { name: "Parth", state: "Available", pct: 50, color: "bg-[#2563EB]" },
  { name: "Neeki", state: "Normal", pct: 60, color: "bg-[#16A34A]" },
];

// Employee Status Widget
export const EmployeeStatusWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => {
  const online: string[] = stats?.employeeStatus?.online || ONLINE_FALLBACK;
  const onLeave: string[] = stats?.employeeStatus?.offline || LEAVE_FALLBACK;

  return (
    <DashCard>
      <DashHead
        title="Employee status"
        action={
          <button
            type="button"
            onClick={() => navigate("/admin/hr")}
            className={dashLink}
          >
            View all
          </button>
        }
      />
      <DashBody className="grid grid-cols-2 gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-medium tabular-nums text-slate-400">
            Online now ({online.length})
          </p>
          <div className="no-scrollbar flex max-h-[80px] flex-wrap gap-1 overflow-y-auto">
            {online.map((name: string, i: number) => (
              <span
                key={i}
                onClick={() => navigate("/admin/hr")}
                className="cursor-pointer rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-medium tabular-nums text-slate-400">
            On leave ({onLeave.length})
          </p>
          <div className="no-scrollbar flex max-h-[80px] flex-wrap gap-1 overflow-y-auto">
            {onLeave.map((name: string, i: number) => (
              <span
                key={i}
                onClick={() => navigate("/admin/hr")}
                className="cursor-pointer rounded border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </DashBody>
    </DashCard>
  );
};

// Employee Workload Widget
export const EmployeeWorkloadWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <DashCard>
    <DashHead
      title="Employee workload"
      action={
        <button
          type="button"
          onClick={() => navigate("/admin/hr")}
          className={dashLink}
        >
          View all
        </button>
      }
    />
    <DashBody className="flex flex-col gap-2.5">
      {(stats?.employeeWorkload || WORKLOAD_FALLBACK).map(
        (emp: any, i: number) => (
          <div
            key={i}
            onClick={() => navigate("/admin/hr")}
            className="-mx-1.5 cursor-pointer space-y-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-[#F4F7FB]"
          >
            <div className="flex items-center justify-between gap-3 leading-none">
              <span className="min-w-0 truncate text-[12px] font-medium text-[#0B1528]">
                {emp.name}
              </span>
              <span className="shrink-0 text-[10px] font-medium tabular-nums text-slate-400">
                {emp.state} · {emp.pct}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#E8EEF4]">
              <div
                className={`h-full rounded-full ${emp.color}`}
                style={{ width: `${emp.pct}%` }}
              />
            </div>
          </div>
        ),
      )}
    </DashBody>
  </DashCard>
);

export const teamWidgets: DashboardWidget[] = [
  {
    id: "employee-status",
    title: "Employee Status",
    category: "team",
    permission: PERMISSIONS.USERS_VIEW,
    order: 100,
    colSpanDesktop: "col-span-12 sm:col-span-6 lg:col-span-4",
    component: EmployeeStatusWidget,
  },
  {
    id: "employee-workload",
    title: "Employee Workload",
    category: "team",
    permission: PERMISSIONS.USERS_VIEW,
    order: 110,
    colSpanDesktop: "col-span-12 sm:col-span-6 lg:col-span-4",
    component: EmployeeWorkloadWidget,
  },
];
