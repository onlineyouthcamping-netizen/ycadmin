import React from "react";
import { DashCard, DashHead, dashLink } from "@/modules/dashboard.chrome";
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
          Details
        </button>
      }
    />
    <div className="px-4 py-3.5 flex-1 flex flex-col justify-between gap-2">
      <div
        onClick={() => navigate("/admin/finance")}
        className="bg-emerald-50/70 p-2.5 rounded-lg flex items-center justify-between cursor-pointer hover:bg-emerald-50"
      >
        <div>
          <p className="text-[10px] font-medium tracking-wide text-slate-500">
            Collection today
          </p>
          <p className="text-[13px] font-bold text-[#16A34A]">
            ₹ {(stats?.cashFlow?.collectionToday || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <TrendingUp className="h-3.5 w-3.5 text-[#16A34A]" strokeWidth={1.75} />
      </div>

      <div
        onClick={() => navigate("/admin/finance")}
        className="bg-rose-50/70 p-2.5 rounded-lg flex items-center justify-between cursor-pointer hover:bg-rose-50"
      >
        <div>
          <p className="text-[10px] font-medium tracking-wide text-slate-500">
            Payments today
          </p>
          <p className="text-[13px] font-bold text-[#E23D4D]">
            ₹ {(stats?.cashFlow?.paymentsToday || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <TrendingDown className="h-3.5 w-3.5 text-[#E23D4D]" strokeWidth={1.75} />
      </div>

      <div className="pt-2 mt-1 flex items-center justify-between text-[11px] font-semibold">
        <span className="text-slate-400">Net inflow</span>
        <span
          className={`font-extrabold text-[12px] ${(stats?.cashFlow?.netCashInflow || 0) >= 0 ? "text-[#16A34A]" : "text-[#E23D4D]"}`}
        >
          ₹ {(stats?.cashFlow?.netCashInflow || 0).toLocaleString("en-IN")}
        </span>
      </div>
    </div>
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
