import React from "react";
import { DashBody, DashCard, DashHead, dashLink } from "@/modules/dashboard.chrome";
import { TrendingUp, TrendingDown } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  DashboardWidget,
  DashboardWidgetContextProps,
} from "@/config/dashboardWidgetRegistry";

// Cash Flow Overview Widget
export const CashFlowOverviewWidget: React.FC<DashboardWidgetContextProps> = ({
  stats,
  navigate,
}) => (
  <DashCard>
    <DashHead
      title="Cash flow"
      action={
        <button type="button" onClick={() => navigate("/admin/finance")} className={dashLink}>
          View all
        </button>
      }
    />
    <DashBody className="flex flex-col justify-between gap-2">
      <div
        onClick={() => navigate("/admin/finance")}
        className="flex cursor-pointer items-center justify-between rounded-xl border border-green-900/30 bg-green-950/30 px-2.5 py-2 transition-colors hover:bg-green-950/50"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Collection today
          </p>
          <p className="mt-0.5 text-[14px] font-bold tabular-nums text-green-400">
            &#8377; {(stats?.cashFlow?.collectionToday || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <TrendingUp className="h-4 w-4 shrink-0 text-green-500" strokeWidth={1.75} />
      </div>

      <div
        onClick={() => navigate("/admin/finance")}
        className="flex cursor-pointer items-center justify-between rounded-xl border border-red-900/30 bg-red-950/30 px-2.5 py-2 transition-colors hover:bg-red-950/50"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Payments today
          </p>
          <p className="mt-0.5 text-[14px] font-bold tabular-nums text-red-400">
            &#8377; {(stats?.cashFlow?.paymentsToday || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <TrendingDown className="h-4 w-4 shrink-0 text-red-400" strokeWidth={1.75} />
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-[#1E2D45] pt-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Net inflow</span>
        <span
          className={`text-[12px] font-bold tabular-nums ${(stats?.cashFlow?.netCashInflow || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          &#8377; {(stats?.cashFlow?.netCashInflow || 0).toLocaleString("en-IN")}
        </span>
      </div>
    </DashBody>
  </DashCard>
);

export const financeWidgets: DashboardWidget[] = [
  {
    id: "cash-flow-overview",
    title: "Cash Flow Overview",
    category: "management",
    permission: PERMISSIONS.ACCOUNTING_VIEW,
    order: 70,
    colSpanDesktop: "col-span-12 md:col-span-6 lg:col-span-3",
    component: CashFlowOverviewWidget,
  },
];

