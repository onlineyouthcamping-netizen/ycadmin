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
  DashList,
  DashRow,
  dashLink,
  dashRowLabel,
} from "@/modules/dashboard.chrome";

const APPROVAL_QUEUE = [
  {
    label: "Payment approvals",
    count: 5,
    color: "text-[#D97706] bg-[#FFF7E6] border-[#FFD580]",
    path: "/admin/approvals-hub",
  },
  {
    label: "Vendor bills",
    count: 2,
    color: "text-[#E23D4D] bg-[#FFF1F3] border-[#FFCCD3]",
    path: "/admin/approvals-hub",
  },
  {
    label: "Refund requests",
    count: 1,
    color: "text-[#2563EB] bg-[#EFF6FF] border-[#B8D4FF]",
    path: "/admin/approvals-hub",
  },
  {
    label: "Expense claims",
    count: 3,
    color: "text-teal-600 bg-teal-50 border-teal-200",
    path: "/admin/approvals-hub",
  },
];

// My Approval Queue Widget
export const ApprovalQueueWidget: React.FC<DashboardWidgetContextProps> = ({
  navigate,
}) => (
  <DashCard>
    <DashHead
      title="My approval queue"
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
        {APPROVAL_QUEUE.map((appr, idx) => (
          <DashRow
            key={idx}
            onClick={() => navigate(appr.path)}
            className="py-1.5"
          >
            <span className={`${dashRowLabel} min-w-0`}>{appr.label}</span>
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${appr.color}`}
            >
              {appr.count} pending
            </span>
          </DashRow>
        ))}
      </DashList>
    </DashBody>
  </DashCard>
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
