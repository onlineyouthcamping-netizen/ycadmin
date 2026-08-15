import React from "react";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  DashboardWidget,
  DashboardWidgetContextProps,
} from "@/config/dashboardWidgetRegistry";

// My Approval Queue Widget
export const ApprovalQueueWidget: React.FC<DashboardWidgetContextProps> = ({
  ticketPendingCount,
  navigate,
}) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">
        My Approval Queue
      </span>
      <span
        onClick={() => navigate("/admin/approvals-hub")}
        className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer"
      >
        Go to Center
      </span>
    </div>
    <div className="p-3.5 flex-1 space-y-3">
      {[
        {
          label: "Payment Approvals",
          count: 5,
          color: "text-[#D97706] bg-[#FFF7E6] border-[#FFD580]",
          path: "/admin/approvals-hub",
        },
        {
          label: "Vendor Bills",
          count: 2,
          color: "text-[#E23D4D] bg-[#FFF1F3] border-[#FFCCD3]",
          path: "/admin/approvals-hub",
        },
        {
          label: "Refund Requests",
          count: 1,
          color: "text-[#2563EB] bg-[#EFF6FF] border-[#B8D4FF]",
          path: "/admin/approvals-hub",
        },
        {
          label: "Expense Claims",
          count: 3,
          color: "text-teal-600 bg-teal-50 border-teal-200",
          path: "/admin/approvals-hub",
        },
      ].map((appr: any, idx: number) => (
        <div
          key={idx}
          onClick={() => navigate(appr.path)}
          className="flex items-center justify-between min-h-[30px] text-[12px] cursor-pointer hover:bg-slate-50/50 p-0.5 rounded transition-colors"
        >
          <span className="font-semibold text-[#162B45]">{appr.label}</span>
          <span
            className={`font-bold text-[10px] px-2 py-0.5 rounded border ${appr.color}`}
          >
            {appr.count} Pending
          </span>
        </div>
      ))}
    </div>
  </div>
);

export const approvalWidgets: DashboardWidget[] = [
  {
    id: "approval-queue",
    title: "My Approval Queue",
    category: "management",
    permission: PERMISSIONS.BOOKINGS_VERIFY,
    order: 60,
    colSpanDesktop: "col-span-12 md:col-span-6 lg:col-span-3",
    component: ApprovalQueueWidget,
  },
];
