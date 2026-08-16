import React from "react";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  DashboardWidget,
  DashboardWidgetContextProps,
} from "@/config/dashboardWidgetRegistry";

// Employee Status Widget
export const EmployeeStatusWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[11px] font-semibold tracking-wide text-[#0B1528]">
        Employee status
      </span>
      <span
        onClick={() => navigate("/admin/hr")}
        className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
      >
        View All
      </span>
    </div>
    <div className="p-3.5 flex-1 grid grid-cols-2 gap-3 text-[11px]">
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium tracking-wide text-emerald-700">
          Online now ({stats?.employeeStatus?.online?.length ?? 6})
        </p>
        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto no-scrollbar">
          {(
            stats?.employeeStatus?.online || [
              "Suresh",
              "Vidhi",
              "Zeel",
              "Parth",
              "Neeki",
              "Vibhuti",
            ]
          ).map((name: string, i: number) => (
            <span
              key={i}
              onClick={() => navigate("/admin/hr")}
              className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-medium tracking-wide text-amber-700">
          On leave ({stats?.employeeStatus?.offline?.length ?? 2})
        </p>
        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto no-scrollbar">
          {(stats?.employeeStatus?.offline || ["Sachin", "Jatin"]).map(
            (name: string, i: number) => (
              <span
                key={i}
                onClick={() => navigate("/admin/hr")}
                className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
              >
                {name}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  </div>
);

// Employee Workload Widget
export const EmployeeWorkloadWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[11px] font-semibold tracking-wide text-[#0B1528]">
        Employee workload
      </span>
      <span
        onClick={() => navigate("/admin/hr")}
        className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
      >
        View All
      </span>
    </div>
    <div className="p-3.5 flex-1 space-y-2 text-[11px]">
      {(
        stats?.employeeWorkload || [
          {
            name: "Suresh Bhai",
            state: "Normal",
            pct: 70,
            color: "bg-[#16A34A]",
          },
          { name: "Vidhi", state: "High", pct: 78, color: "bg-[#D97706]" },
          { name: "Zeel", state: "High", pct: 75, color: "bg-[#D97706]" },
          { name: "Parth", state: "Available", pct: 50, color: "bg-[#2563EB]" },
          { name: "Neeki", state: "Normal", pct: 60, color: "bg-[#16A34A]" },
        ]
      ).map((emp: any, i: number) => (
        <div
          key={i}
          onClick={() => navigate("/admin/hr")}
          className="space-y-0.5 cursor-pointer hover:bg-slate-50/50 p-0.5 rounded transition-colors"
        >
          <div className="flex items-center justify-between font-semibold leading-none">
            <span className="text-[#162B45] text-[11px]">{emp.name}</span>
            <span className="text-[#74839A] text-[9.5px] uppercase tracking-wider font-extrabold">
              {emp.state} ({emp.pct}%)
            </span>
          </div>
          <div className="w-full h-1 bg-[#E3EAF2] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${emp.color}`}
              style={{ width: `${emp.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
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
