import React from "react";
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
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">
        Cash Flow Overview
      </span>
      <span
        onClick={() => navigate("/admin/accounting-workspace")}
        className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
      >
        Details
      </span>
    </div>
    <div className="p-3.5 flex-1 flex flex-col justify-between">
      <div
        onClick={() => navigate("/admin/accounting-workspace")}
        className="bg-[#ECFDF3] p-2 rounded border border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-50/80 transition-colors"
      >
        <div>
          <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider">
            Collection Today
          </p>
          <p className="text-[13px] font-bold text-[#16A34A]">
            ₹ {(stats?.cashFlow?.collectionToday || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
      </div>

      <div
        onClick={() => navigate("/admin/accounting-workspace")}
        className="bg-[#FFF1F3] p-2 rounded border border-rose-100 flex items-center justify-between mt-1 cursor-pointer hover:bg-rose-50/80 transition-colors"
      >
        <div>
          <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider">
            Payments Today
          </p>
          <p className="text-[13px] font-bold text-[#E23D4D]">
            ₹ {(stats?.cashFlow?.paymentsToday || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <TrendingDown className="w-3.5 h-3.5 text-[#E23D4D]" />
      </div>

      <div className="border-t border-[#E3EAF2] pt-2 mt-2 flex items-center justify-between text-[11px] font-bold">
        <span className="text-[#74839A] uppercase tracking-wider">
          Net Cash Inflow:
        </span>
        <span
          className={`font-extrabold text-[12px] ${(stats?.cashFlow?.netCashInflow || 0) >= 0 ? "text-[#16A34A]" : "text-[#E23D4D]"}`}
        >
          ₹ {(stats?.cashFlow?.netCashInflow || 0).toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  </div>
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
