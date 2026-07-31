import React from "react";
import { kpiWidgets } from "@/modules/kpi/kpi.widgets";
import { opsWidgets } from "@/modules/operations/ops.widgets";
import { financeWidgets } from "@/modules/finance/finance.widgets";
import { approvalWidgets } from "@/modules/approval/approval.widgets";
import { teamWidgets } from "@/modules/team/team.widgets";
import { generalWidgets } from "@/modules/general/general.widgets";

export interface DashboardWidgetContextProps {
  stats: any;
  loading: boolean;
  ticketPendingCount: number;
  announcements: any[];
  loadingAnnouncements: boolean;
  admin: any;
  userPerms: any;
  userRole?: string;
  navigate: (path: string) => void;
  setShowAddAnnouncement: (val: boolean) => void;
  setShowAllAnnouncements: (val: boolean) => void;
  hasPermission: (perms: any, required: string, role?: string) => boolean;
}

export type DashboardCategory = 'kpi' | 'operations' | 'finance' | 'approval' | 'team' | 'general';

export interface DashboardWidget {
  id: string;
  title: string;
  category: DashboardCategory;
  permission: string; // Specific PERMISSIONS constant required
  order: number;
  colSpanDesktop: string; // Tailwind grid span
  component: React.ComponentType<DashboardWidgetContextProps>;
}

export const CATEGORY_LABELS: Record<DashboardCategory, { title: string; subtitle: string }> = {
  kpi: { title: "KPI Summary", subtitle: "Key performance indicators and business metrics" },
  operations: { title: "Operational Workspace", subtitle: "Active departures, itinerary schedules, and urgent alerts" },
  finance: { title: "Finance & Cash Flow", subtitle: "Daily cash movements, collections, and vendor payables" },
  approval: { title: "Approvals & Verification", subtitle: "Pending verifications and ticket issuance queue" },
  team: { title: "Team & Workforce", subtitle: "Employee presence and task workload meters" },
  general: { title: "General Updates & Activity", subtitle: "Recent bookings, tasks progress, and announcements" }
};

// ─────────────────────────────────────────────────────────────
// ENTERPRISE PLUGIN DASHBOARD REGISTRY AGGREGATOR
// ─────────────────────────────────────────────────────────────
export const DASHBOARD_WIDGET_REGISTRY: DashboardWidget[] = [
  ...kpiWidgets,
  ...opsWidgets,
  ...financeWidgets,
  ...approvalWidgets,
  ...teamWidgets,
  ...generalWidgets,
];
