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
        className="flex cursor-pointer items-center justify-between rounded-lg bg-emerald-50/70 px-2.5 py-2 hover:bg-emerald-50"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-slate-500">
            Collection today
          </p>
          <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#16A34A]">
            ₹ {(stats?.cashFlow?.collectionToday || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" strokeWidth={1.75} />
      </div>

      <div
        onClick={() => navigate("/admin/finance")}
        className="flex cursor-pointer items-center justify-between rounded-lg bg-rose-50/70 px-2.5 py-2 hover:bg-rose-50"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-slate-500">
            Payments today
          </p>
          <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#E23D4D]">
            ₹ {(stats?.cashFlow?.paymentsToday || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <TrendingDown className="h-3.5 w-3.5 shrink-0 text-[#E23D4D]" strokeWidth={1.75} />
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-[#E8EEF4] pt-2">
        <span className="text-[11px] font-medium text-slate-400">Net inflow</span>
        <span
          className={`text-[12px] font-semibold tabular-nums ${(stats?.cashFlow?.netCashInflow || 0) >= 0 ? "text-[#16A34A]" : "text-[#E23D4D]"}`}
        >
          ₹ {(stats?.cashFlow?.netCashInflow || 0).toLocaleString("en-IN")}
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
