import React from "react";
import {
  BarChart2,
  Users,
  Building2,
  Compass,
  Calendar,
  IndianRupee,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  DashboardWidget,
  DashboardWidgetContextProps,
} from "@/config/dashboardWidgetRegistry";

function KpiIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#E8EEF4] bg-[#F4F7FB] text-[#0B1528]">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
    </div>
  );
}

function KpiCard({
  label,
  icon,
  loading,
  value,
  caption,
  onClick,
  trend,
}: {
  label: string;
  icon: LucideIcon;
  loading: boolean;
  value: string;
  caption: React.ReactNode;
  onClick: () => void;
  trend?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className="flex h-full min-h-[108px] min-w-0 cursor-pointer flex-col justify-between rounded-xl border border-[#E8EEF4] bg-white p-3.5 shadow-none transition-colors hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wide text-slate-500">
          {label}
        </span>
        <KpiIcon icon={icon} />
      </div>
      <div className="min-w-0 space-y-0.5">
        <h3 className="truncate text-[18px] font-bold leading-none text-[#0B1528]">
          {loading ? "Loading..." : value}
        </h3>
        <p
          className={`mt-1 flex items-center gap-1 text-[10px] font-medium ${
            trend ? "text-emerald-600" : "text-slate-400"
          }`}
        >
          {trend ? (
            <TrendingUp className="h-3 w-3 shrink-0" strokeWidth={1.75} />
          ) : null}
          {caption}
        </p>
      </div>
    </div>
  );
}

export const TotalRevenueCard: React.FC<DashboardWidgetContextProps> = ({
  stats,
  loading,
  navigate,
}) => (
  <KpiCard
    label="Total revenue"
    icon={IndianRupee}
    loading={loading}
    value={`₹ ${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`}
    trend
    caption={
      <>
        Gross <span className="font-medium text-slate-400">all-time</span>
      </>
    }
    onClick={() => navigate("/admin/accounting")}
  />
);

export const MonthlyRevenueCard: React.FC<DashboardWidgetContextProps> = ({
  stats,
  loading,
  navigate,
}) => (
  <KpiCard
    label="Monthly revenue"
    icon={BarChart2}
    loading={loading}
    value={`₹ ${(stats?.monthlyRevenue?.[stats.monthlyRevenue.length - 1]?.revenue || stats?.totalRevenue || 0).toLocaleString("en-IN")}`}
    trend
    caption={
      <>
        Active <span className="font-medium text-slate-400">this month</span>
      </>
    }
    onClick={() => navigate("/admin/accounting")}
  />
);

export const PendingCustomersCard: React.FC<DashboardWidgetContextProps> = ({
  stats,
  loading,
  navigate,
}) => (
  <KpiCard
    label="Pending customers"
    icon={Users}
    loading={loading}
    value={`₹ ${(stats?.pendingPayments || 0).toLocaleString("en-IN")}`}
    caption={
      <>
        {loading ? "..." : stats?.totalBookings || 0}{" "}
        <span className="font-medium text-slate-400">bookings</span>
      </>
    }
    onClick={() => navigate("/admin/accounting?tab=payments")}
  />
);

export const PendingVendorsCard: React.FC<DashboardWidgetContextProps> = ({
  stats,
  loading,
  navigate,
}) => (
  <KpiCard
    label="Pending vendors"
    icon={Building2}
    loading={loading}
    value={`₹ ${(stats?.pendingVendorsCost || 0).toLocaleString("en-IN")}`}
    caption={
      <>
        {loading ? "..." : stats?.pendingVendorsCount || 0}{" "}
        <span className="font-medium text-slate-400">vendors</span>
      </>
    }
    onClick={() => navigate("/admin/accounting?tab=vendor_payments")}
  />
);

export const TripsRunningCard: React.FC<DashboardWidgetContextProps> = ({
  stats,
  loading,
  navigate,
}) => (
  <KpiCard
    label="Trips running"
    icon={Compass}
    loading={loading}
    value={loading ? "..." : String(stats?.totalTrips || 0)}
    caption={
      <>
        Active <span className="font-medium text-slate-400">itineraries</span>
      </>
    }
    onClick={() => navigate("/admin/live-operations")}
  />
);

export const BookingsMonthCard: React.FC<DashboardWidgetContextProps> = ({
  stats,
  loading,
  navigate,
}) => (
  <KpiCard
    label="Bookings this month"
    icon={Calendar}
    loading={loading}
    value={loading ? "..." : String(stats?.totalBookings || 0)}
    trend
    caption={
      <>
        Overall <span className="font-medium text-slate-400">reservations</span>
      </>
    }
    onClick={() => navigate("/admin/bookings")}
  />
);

export const kpiWidgets: DashboardWidget[] = [
  {
    id: "total-revenue",
    title: "Total Revenue",
    category: "kpi",
    permission: PERMISSIONS.ACCOUNTING_VIEW,
    order: 10,
    colSpanDesktop: "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2",
    component: TotalRevenueCard,
  },
  {
    id: "monthly-revenue",
    title: "Monthly Revenue",
    category: "kpi",
    permission: PERMISSIONS.ACCOUNTING_VIEW,
    order: 12,
    colSpanDesktop: "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2",
    component: MonthlyRevenueCard,
  },
  {
    id: "pending-customers",
    title: "Pending Customers",
    category: "kpi",
    permission: PERMISSIONS.BOOKINGS_VIEW,
    order: 14,
    colSpanDesktop: "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2",
    component: PendingCustomersCard,
  },
  {
    id: "pending-vendors",
    title: "Pending Vendors",
    category: "kpi",
    permission: PERMISSIONS.VENDORS_VIEW,
    order: 16,
    colSpanDesktop: "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2",
    component: PendingVendorsCard,
  },
  {
    id: "trips-running",
    title: "Trips Running",
    category: "kpi",
    permission: PERMISSIONS.TRIPS_VIEW,
    order: 18,
    colSpanDesktop: "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2",
    component: TripsRunningCard,
  },
  {
    id: "bookings-month",
    title: "Bookings Month",
    category: "kpi",
    permission: PERMISSIONS.BOOKINGS_VIEW,
    order: 19,
    colSpanDesktop: "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2",
    component: BookingsMonthCard,
  },
];
