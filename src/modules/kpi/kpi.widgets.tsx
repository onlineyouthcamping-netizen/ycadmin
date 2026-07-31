import React from "react";
import { PERMISSIONS } from "@/lib/permissions";
import type { DashboardWidget, DashboardWidgetContextProps } from "@/config/dashboardWidgetRegistry";

// KPI 1: Total Revenue Widget
export const TotalRevenueCard: React.FC<DashboardWidgetContextProps> = ({ stats, loading, navigate }) => (
  <div 
    onClick={() => navigate("/admin/accounting")}
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full min-h-[108px]"
  >
    <div className="flex items-start justify-between">
      <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Total Revenue</span>
      <div className="w-[26px] h-[26px] rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
        <span className="text-xs font-bold">₹</span>
      </div>
    </div>
    <div className="space-y-0.5">
      <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
        {loading ? "Loading..." : `₹ ${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
      </h3>
      <p className="text-[9.5px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
        ▲ Gross <span className="text-[#74839A] font-medium">all-time</span>
      </p>
    </div>
  </div>
);

// KPI 2: Monthly Revenue Widget
export const MonthlyRevenueCard: React.FC<DashboardWidgetContextProps> = ({ stats, loading, navigate }) => (
  <div 
    onClick={() => navigate("/admin/accounting")}
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full min-h-[108px]"
  >
    <div className="flex items-start justify-between">
      <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Monthly Revenue</span>
      <div className="w-[26px] h-[26px] rounded bg-blue-50 flex items-center justify-center text-blue-600">
        <span className="text-xs font-bold">📊</span>
      </div>
    </div>
    <div className="space-y-0.5">
      <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
        {loading ? "Loading..." : `₹ ${(stats?.monthlyRevenue?.[stats.monthlyRevenue.length - 1]?.revenue || stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
      </h3>
      <p className="text-[9.5px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
        ▲ Active <span className="text-[#74839A] font-medium">this month</span>
      </p>
    </div>
  </div>
);

// KPI 3: Pending Customers Widget
export const PendingCustomersCard: React.FC<DashboardWidgetContextProps> = ({ stats, loading, navigate }) => (
  <div 
    onClick={() => navigate("/admin/accounting?tab=payments")}
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full min-h-[108px]"
  >
    <div className="flex items-start justify-between">
      <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Pending Customers</span>
      <div className="w-[26px] h-[26px] rounded bg-amber-50 flex items-center justify-center text-amber-600">
        <span className="text-xs font-bold">👥</span>
      </div>
    </div>
    <div className="space-y-0.5">
      <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
        {loading ? "Loading..." : `₹ ${(stats?.pendingPayments || 0).toLocaleString('en-IN')}`}
      </h3>
      <p className="text-[9.5px] font-semibold text-[#74839A] flex items-center gap-0.5 mt-1">
        {loading ? "..." : stats?.totalBookings || 0} <span className="text-[#74839A] font-medium">bookings</span>
      </p>
    </div>
  </div>
);

// KPI 4: Pending Vendors Widget
export const PendingVendorsCard: React.FC<DashboardWidgetContextProps> = ({ stats, loading, navigate }) => (
  <div 
    onClick={() => navigate("/admin/accounting?tab=vendor_payments")}
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full min-h-[108px]"
  >
    <div className="flex items-start justify-between">
      <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Pending Vendors</span>
      <div className="w-[26px] h-[26px] rounded bg-rose-50 flex items-center justify-center text-rose-600">
        <span className="text-xs font-bold">🏢</span>
      </div>
    </div>
    <div className="space-y-0.5">
      <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
        {loading ? "Loading..." : `₹ ${(stats?.pendingVendorsCost || 0).toLocaleString('en-IN')}`}
      </h3>
      <p className="text-[9.5px] font-semibold text-[#74839A] flex items-center gap-0.5 mt-1">
        {loading ? "..." : stats?.pendingVendorsCount || 0} <span className="text-[#74839A] font-medium">vendors</span>
      </p>
    </div>
  </div>
);

// KPI 5: Trips Running Widget
export const TripsRunningCard: React.FC<DashboardWidgetContextProps> = ({ stats, loading, navigate }) => (
  <div 
    onClick={() => navigate("/admin/live-operations")}
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full min-h-[108px]"
  >
    <div className="flex items-start justify-between">
      <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Trips Running</span>
      <div className="w-[26px] h-[26px] rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
        <span className="text-xs font-bold">🎒</span>
      </div>
    </div>
    <div className="space-y-0.5">
      <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
        {loading ? "..." : stats?.totalTrips || 0}
      </h3>
      <p className="text-[9.5px] font-semibold text-[#74839A] flex items-center gap-0.5 mt-1">
        Active <span className="text-[#74839A] font-medium">itineraries</span>
      </p>
    </div>
  </div>
);

// KPI 6: Bookings Month Widget
export const BookingsMonthCard: React.FC<DashboardWidgetContextProps> = ({ stats, loading, navigate }) => (
  <div 
    onClick={() => navigate("/admin/bookings")}
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full min-h-[108px]"
  >
    <div className="flex items-start justify-between">
      <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Bookings Month</span>
      <div className="w-[26px] h-[26px] rounded bg-teal-50 flex items-center justify-center text-teal-600">
        <span className="text-xs font-bold">📅</span>
      </div>
    </div>
    <div className="space-y-0.5">
      <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
        {loading ? "..." : stats?.totalBookings || 0}
      </h3>
      <p className="text-[9.5px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
        ▲ Overall <span className="text-[#74839A] font-medium">reservations</span>
      </p>
    </div>
  </div>
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
