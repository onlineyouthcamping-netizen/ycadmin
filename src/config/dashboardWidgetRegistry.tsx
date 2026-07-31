import React from "react";

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

export interface DashboardWidget {
  id: string;
  title: string;
  category: 'kpi' | 'operations' | 'finance' | 'approval' | 'team' | 'general';
  permission: string; // Specific module permission required e.g. "accounting.view"
  order: number;
  colSpanDesktop: string; // Tailwind grid span
  component: React.ComponentType<DashboardWidgetContextProps>;
}

// ─────────────────────────────────────────────────────────────
// INDIVIDUAL METADATA-DRIVEN WIDGET COMPONENTS
// ─────────────────────────────────────────────────────────────

// KPI 1: Total Revenue Widget
export const TotalRevenueCard: React.FC<DashboardWidgetContextProps> = ({ stats, loading, navigate }) => (
  <div 
    onClick={() => navigate("/admin/accounting")}
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full"
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
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full"
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
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full"
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
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full"
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
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full"
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
    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-all h-full"
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

// Needs Your Attention Widget
export const NeedsAttentionWidget: React.FC<DashboardWidgetContextProps> = ({ stats, navigate }) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Needs Your Attention</span>
      <span onClick={() => navigate("/admin/approvals-hub")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
    </div>
    <div className="p-3.5 flex-1 space-y-2">
      {(stats?.attentionItems || [
        { label: "Payments waiting verification", count: 8, color: "bg-[#E23D4D]", urgent: true, path: "/admin/approvals-hub" },
        { label: "Aadhaar pending", count: 16, color: "bg-[#D97706]", path: "/admin/approvals-hub" },
        { label: "Hotels pending confirmation", count: 5, color: "bg-[#D97706]", path: "/admin/departure-workspace" },
        { label: "Vendors with payments due today", count: 3, color: "bg-[#E23D4D]", urgent: true, path: "/admin/accounting-workspace" },
        { label: "Rooming pending", count: 12, color: "bg-[#D97706]", path: "/admin/departure-workspace" },
        { label: "Customer complaints", count: 2, color: "bg-[#E23D4D]", urgent: true, path: "/admin/departure-workspace" },
        { label: "Tasks pending > 24 hours", count: 14, color: "bg-[#E23D4D]", urgent: true, path: "/admin/departure-workspace" },
        { label: "Missing train tickets", count: 6, color: "bg-[#E23D4D]", urgent: true, path: "/admin/approvals-hub" },
        { label: "Missing tempo confirmation", count: 4, color: "bg-[#D97706]", path: "/admin/departure-workspace" }
      ]).map((item: any, idx: number) => (
        <div key={idx} onClick={() => navigate(item.path)} className="flex items-center justify-between min-h-[22px] text-[12px] hover:bg-[#F8FAFD] px-1 rounded transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
            <span className="font-semibold text-[#162B45]">{item.label}</span>
          </div>
          <span className={`font-bold text-[11px] ${item.urgent ? "text-[#E23D4D]" : "text-[#74839A]"}`}>{item.count}</span>
        </div>
      ))}
    </div>
  </div>
);

// Trips Running Now Widget
export const TripsRunningNowWidget: React.FC<DashboardWidgetContextProps> = ({ stats, navigate }) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Trips Running Now</span>
      <span onClick={() => navigate("/admin/departure-workspace")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
    </div>
    <div className="p-3.5 flex-1 space-y-3.5">
      {(!stats?.tripsRunningNow || stats.tripsRunningNow.length === 0) ? (
        <p className="text-xs text-[#74839A] italic text-center py-4">No active trips running today.</p>
      ) : (
        stats.tripsRunningNow.map((trip: any, idx: number) => (
          <div key={idx} onClick={() => navigate("/admin/departure-workspace")} className="flex items-center justify-between min-h-[34px] hover:bg-[#F8FAFD] p-1 rounded transition-colors cursor-pointer">
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-[#162B45]">{trip.code}</p>
              <p className="text-[10px] text-[#74839A] font-medium leading-none">{trip.name}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[10.5px] font-semibold text-[#162B45] flex items-center justify-end gap-1">👤 {trip.size}</p>
              <p className="text-[9.5px] text-emerald-600 font-bold leading-none">📍 {trip.stay}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Trips Departing Next 7 Days Widget
export const TripsNext7DaysWidget: React.FC<DashboardWidgetContextProps> = ({ stats, navigate }) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Trips Departing Next 7 Days</span>
      <span onClick={() => navigate("/admin/operations")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
    </div>
    <div className="p-3.5 flex-1 space-y-3.5">
      {(!stats?.tripsDepartingNext7Days || stats.tripsDepartingNext7Days.length === 0) ? (
        <p className="text-xs text-[#74839A] italic text-center py-4">No departures in the next 7 days.</p>
      ) : (
        stats.tripsDepartingNext7Days.map((trip: any, idx: number) => (
          <div key={idx} onClick={() => navigate("/admin/operations")} className="flex items-center justify-between min-h-[34px] hover:bg-[#F8FAFD] p-1 rounded transition-colors cursor-pointer">
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-[#162B45]">{trip.name}</p>
              <p className="text-[10px] text-[#74839A] font-semibold leading-none">{trip.date}</p>
            </div>
            <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-sm border ${trip.status === "full" ? "bg-[#ECFDF3] text-[#16A34A] border-emerald-200" : "bg-[#EFF6FF] text-[#2563EB] border-blue-200"}`}>
              {trip.count} Booked
            </span>
          </div>
        ))
      )}
    </div>
  </div>
);

// Today's Schedule Widget
export const TodaysScheduleWidget: React.FC<DashboardWidgetContextProps> = ({ stats, navigate }) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Today's Schedule</span>
      <span onClick={() => navigate("/admin/departure-workspace")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View Full</span>
    </div>
    <div className="p-3.5 flex-1 space-y-3">
      {(!stats?.todaysSchedule || stats.todaysSchedule.length === 0) ? (
        <p className="text-xs text-[#74839A] italic text-center py-4">No tasks or departures scheduled today.</p>
      ) : (
        stats.todaysSchedule.map((sched: any, idx: number) => (
          <div key={idx} onClick={() => navigate("/admin/departure-workspace")} className="flex gap-2 items-start min-h-[30px] cursor-pointer hover:bg-slate-50/55 p-0.5 rounded transition-colors">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#74839A] w-[54px] shrink-0 mt-0.5">{sched.time}</span>
            <div className="flex items-start gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${sched.color}`} />
              <span className="text-[12px] font-semibold text-[#162B45] leading-tight truncate max-w-[130px]">{sched.label}</span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// My Approval Queue Widget
export const ApprovalQueueWidget: React.FC<DashboardWidgetContextProps> = ({ ticketPendingCount, navigate }) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">My Approval Queue</span>
      <span onClick={() => navigate("/admin/approvals-hub")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">Go to Center</span>
    </div>
    <div className="p-3.5 flex-1 space-y-3">
      {[
        { label: "Payment Approvals", count: 5, color: "text-[#D97706] bg-[#FFF7E6] border-[#FFD580]", path: "/admin/approvals-hub" },
        { label: "Vendor Bills", count: 2, color: "text-[#E23D4D] bg-[#FFF1F3] border-[#FFCCD3]", path: "/admin/approvals-hub" },
        { label: "Ticket Approvals", count: ticketPendingCount, color: "text-[#F97316] bg-[#FFF7E6] border-[#FFD580]", path: "/admin/ticket-approvals" },
        { label: "Refund Requests", count: 1, color: "text-[#2563EB] bg-[#EFF6FF] border-[#B8D4FF]", path: "/admin/approvals-hub" },
        { label: "Expense Claims", count: 3, color: "text-teal-600 bg-teal-50 border-teal-200", path: "/admin/approvals-hub" }
      ].map((appr: any, idx: number) => (
        <div key={idx} onClick={() => navigate(appr.path)} className="flex items-center justify-between min-h-[30px] text-[12px] cursor-pointer hover:bg-slate-50/50 p-0.5 rounded transition-colors">
          <span className="font-semibold text-[#162B45]">{appr.label}</span>
          <span className={`font-bold text-[10px] px-2 py-0.5 rounded border ${appr.color}`}>
            {appr.count} Pending
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Cash Flow Overview Widget
export const CashFlowOverviewWidget: React.FC<DashboardWidgetContextProps> = ({ stats, navigate }) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Cash Flow Overview</span>
      <span onClick={() => navigate("/admin/accounting-workspace")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">Details</span>
    </div>
    <div className="p-3.5 flex-1 flex flex-col justify-between">
      <div onClick={() => navigate("/admin/accounting-workspace")} className="bg-[#ECFDF3] p-2 rounded border border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-50/80 transition-colors">
        <div>
          <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider">Collection Today</p>
          <p className="text-[13px] font-bold text-[#16A34A]">₹ {(stats?.cashFlow?.collectionToday || 0).toLocaleString('en-IN')}</p>
        </div>
        <span className="text-[#16A34A] text-xs">📈</span>
      </div>

      <div onClick={() => navigate("/admin/accounting-workspace")} className="bg-[#FFF1F3] p-2 rounded border border-rose-100 flex items-center justify-between mt-1 cursor-pointer hover:bg-rose-50/80 transition-colors">
        <div>
          <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider">Payments Today</p>
          <p className="text-[13px] font-bold text-[#E23D4D]">₹ {(stats?.cashFlow?.paymentsToday || 0).toLocaleString('en-IN')}</p>
        </div>
        <span className="text-[#E23D4D] text-xs">📉</span>
      </div>

      <div className="border-t border-[#E3EAF2] pt-2 mt-2 flex items-center justify-between text-[11px] font-bold">
        <span className="text-[#74839A] uppercase tracking-wider">Net Cash Inflow:</span>
        <span className={`font-extrabold text-[12px] ${(stats?.cashFlow?.netCashInflow || 0) >= 0 ? "text-[#16A34A]" : "text-[#E23D4D]"}`}>
          ₹ {(stats?.cashFlow?.netCashInflow || 0).toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  </div>
);

// Announcements Widget
export const AnnouncementsWidget: React.FC<DashboardWidgetContextProps> = ({ announcements, loadingAnnouncements, setShowAddAnnouncement, setShowAllAnnouncements, hasPermission, userPerms, userRole }) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Announcements</span>
      <div className="flex items-center gap-2">
        {hasPermission(userPerms, 'settings.view', userRole) && (
          <button 
            onClick={() => setShowAddAnnouncement(true)}
            className="text-[10px] font-bold text-[#F97316] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2 py-0.5 rounded transition-all"
          >
            + Add
          </button>
        )}
        <span onClick={() => setShowAllAnnouncements(true)} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
      </div>
    </div>
    <div className="p-3.5 flex-1 space-y-3 text-[12px] overflow-y-auto max-h-[160px] no-scrollbar">
      {loadingAnnouncements ? (
        <p className="text-[11px] text-[#74839A] italic">Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p className="text-[11px] text-[#74839A] italic text-center py-2">No announcements posted.</p>
      ) : (
        announcements.slice(0, 5).map((ann: any) => (
          <div key={ann.id} className="space-y-0.5 pb-1 border-b border-[#E3EAF2]/30 last:border-0">
            <p className="font-bold text-[#162B45] leading-tight">{ann.title}</p>
            <p className="text-[9px] text-[#74839A] font-semibold leading-none">
              By {ann.author} • {(() => {
                const diffMs = new Date().getTime() - new Date(ann.createdAt).getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diffMins < 1) return 'just now';
                if (diffMins < 60) return `${diffMins}m ago`;
                if (diffHrs < 24) return `${diffHrs}h ago`;
                return `${diffDays}d ago`;
              })()}
            </p>
          </div>
        ))
      )}
    </div>
  </div>
);

// Today's Tasks Widget
export const TodaysTasksWidget: React.FC<DashboardWidgetContextProps> = ({ stats, navigate }) => {
  const total = stats?.tasksTotal ?? 0;
  const completed = stats?.tasksCompleted ?? 0;
  const pending = stats?.tasksPending ?? 0;
  const overdue = stats?.tasksOverdue ?? 0;
  const circumference = 2 * Math.PI * 26;
  const pct = total > 0 ? (completed / total) : 0;
  const offset = circumference - (pct * circumference);

  return (
    <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
      <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
        <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Today's Tasks</span>
        <span onClick={() => navigate("/admin/bookings")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
      </div>
      <div className="p-3.5 flex-1 flex items-center gap-4">
        <div className="relative w-[60px] h-[60px] flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="30" cy="30" r="26" className="stroke-slate-100" strokeWidth="4" fill="transparent" />
            <circle cx="30" cy="30" r="26" className="stroke-emerald-500" strokeWidth="4" fill="transparent"
              strokeDasharray={circumference.toString()} strokeDashoffset={offset.toString()} />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[12px] font-extrabold text-[#162B45]">{total}</span>
            <span className="text-[8px] text-[#74839A] font-bold uppercase mt-0.5">Tasks</span>
          </div>
        </div>
        <div className="space-y-1 text-[11px] flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[#74839A] font-medium">Completed</span>
            <span className="font-bold text-[#16A34A]">{completed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#74839A] font-medium">Pending</span>
            <span className="font-bold text-[#D97706]">{pending}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#74839A] font-medium">Overdue</span>
            <span className="font-bold text-[#E23D4D]">{overdue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Employee Status Widget
export const EmployeeStatusWidget: React.FC<DashboardWidgetContextProps> = ({ stats, navigate }) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Employee Status</span>
      <span onClick={() => navigate("/admin/hr")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
    </div>
    <div className="p-3.5 flex-1 grid grid-cols-2 gap-3 text-[11px]">
      <div className="space-y-1.5">
        <p className="text-[8px] font-bold text-[#16A34A] uppercase tracking-wider">
          Online Now ({stats?.employeeStatus?.online?.length ?? 6})
        </p>
        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto no-scrollbar">
          {(stats?.employeeStatus?.online || ['Suresh', 'Vidhi', 'Zeel', 'Parth', 'Neeki', 'Vibhuti']).map((name: string, i: number) => (
            <span key={i} onClick={() => navigate("/admin/hr")} className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors">
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[8px] font-bold text-[#D97706] uppercase tracking-wider">
          On Leave ({stats?.employeeStatus?.offline?.length ?? 2})
        </p>
        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto no-scrollbar">
          {(stats?.employeeStatus?.offline || ['Sachin', 'Jatin']).map((name: string, i: number) => (
            <span key={i} onClick={() => navigate("/admin/hr")} className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Employee Workload Widget
export const EmployeeWorkloadWidget: React.FC<DashboardWidgetContextProps> = ({ stats, navigate }) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Employee Workload</span>
      <span onClick={() => navigate("/admin/hr")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
    </div>
    <div className="p-3.5 flex-1 space-y-2 text-[11px]">
      {(stats?.employeeWorkload || [
        { name: "Suresh Bhai", state: "Normal", pct: 70, color: "bg-[#16A34A]" },
        { name: "Vidhi", state: "High", pct: 78, color: "bg-[#D97706]" },
        { name: "Zeel", state: "High", pct: 75, color: "bg-[#D97706]" },
        { name: "Parth", state: "Available", pct: 50, color: "bg-[#2563EB]" },
        { name: "Neeki", state: "Normal", pct: 60, color: "bg-[#16A34A]" }
      ]).map((emp: any, i: number) => (
        <div key={i} onClick={() => navigate("/admin/hr")} className="space-y-0.5 cursor-pointer hover:bg-slate-50/50 p-0.5 rounded transition-colors">
          <div className="flex items-center justify-between font-semibold leading-none">
            <span className="text-[#162B45] text-[11px]">{emp.name}</span>
            <span className="text-[#74839A] text-[9.5px] uppercase tracking-wider font-extrabold">{emp.state} ({emp.pct}%)</span>
          </div>
          <div className="w-full h-1 bg-[#E3EAF2] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${emp.color}`} style={{ width: `${emp.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Recent Bookings Widget
export const RecentBookingsWidget: React.FC<DashboardWidgetContextProps> = ({ stats, loading, navigate }) => (
  <div className="bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden h-full">
    <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
      <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Recent Bookings</span>
      <span onClick={() => navigate("/admin/bookings")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
    </div>
    <div className="p-3.5 flex-1 space-y-2.5 overflow-y-auto max-h-[160px] no-scrollbar text-[12px]">
      {loading ? (
        <p className="text-[11px] text-[#74839A] italic">Loading transactions...</p>
      ) : (!stats?.recentBookings || stats.recentBookings.length === 0) ? (
        <p className="text-[11px] text-[#74839A] italic">No recent transactions found.</p>
      ) : (
        stats.recentBookings.map((b: any) => (
          <div key={b.id} onClick={() => navigate("/admin/bookings")} className="flex gap-2 items-start leading-tight cursor-pointer hover:bg-slate-50/50 p-1 rounded transition-colors">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-blue-500" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[#162B45] leading-none">
                {b.userName} – {b.tripTitle}
              </p>
              <p className="text-[9px] text-[#74839A] font-semibold leading-none mt-0.5">
                ₹{Number(b.amount || 0).toLocaleString('en-IN')} · <span className="uppercase text-[8px] font-extrabold text-slate-500">{b.status}</span>
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// METADATA-ONLY CENTRAL REGISTRY (UNGROUPED & PERMISSION-GATED)
// ─────────────────────────────────────────────────────────────
export const DASHBOARD_WIDGET_REGISTRY: DashboardWidget[] = [
  // ─── UNGROUPED INDIVIDUAL KPI METRICS ───
  {
    id: "total-revenue",
    title: "Total Revenue",
    category: "kpi",
    permission: "accounting.view",
    order: 10,
    colSpanDesktop: "col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-2",
    component: TotalRevenueCard,
  },
  {
    id: "monthly-revenue",
    title: "Monthly Revenue",
    category: "kpi",
    permission: "accounting.view",
    order: 12,
    colSpanDesktop: "col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-2",
    component: MonthlyRevenueCard,
  },
  {
    id: "pending-customers",
    title: "Pending Customers",
    category: "kpi",
    permission: "bookings.view",
    order: 14,
    colSpanDesktop: "col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-2",
    component: PendingCustomersCard,
  },
  {
    id: "pending-vendors",
    title: "Pending Vendors",
    category: "kpi",
    permission: "vendors.view",
    order: 16,
    colSpanDesktop: "col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-2",
    component: PendingVendorsCard,
  },
  {
    id: "trips-running",
    title: "Trips Running",
    category: "kpi",
    permission: "trips.view",
    order: 18,
    colSpanDesktop: "col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-2",
    component: TripsRunningCard,
  },
  {
    id: "bookings-month",
    title: "Bookings Month",
    category: "kpi",
    permission: "bookings.view",
    order: 19,
    colSpanDesktop: "col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-2",
    component: BookingsMonthCard,
  },

  // ─── OPERATIONAL & MANAGEMENT PANELS ───
  {
    id: "needs-attention",
    title: "Needs Your Attention",
    category: "operations",
    permission: "ops.view",
    order: 20,
    colSpanDesktop: "col-span-12 lg:col-span-4",
    component: NeedsAttentionWidget,
  },
  {
    id: "trips-running-now",
    title: "Trips Running Now",
    category: "operations",
    permission: "trips.view",
    order: 30,
    colSpanDesktop: "col-span-12 lg:col-span-4",
    component: TripsRunningNowWidget,
  },
  {
    id: "trips-next-7-days",
    title: "Trips Departing Next 7 Days",
    category: "operations",
    permission: "trips.view",
    order: 40,
    colSpanDesktop: "col-span-12 lg:col-span-4",
    component: TripsNext7DaysWidget,
  },
  {
    id: "todays-schedule",
    title: "Today's Schedule",
    category: "operations",
    permission: "ops.view",
    order: 50,
    colSpanDesktop: "col-span-12 sm:col-span-6 lg:col-span-3",
    component: TodaysScheduleWidget,
  },
  {
    id: "approval-queue",
    title: "My Approval Queue",
    category: "approval",
    permission: "bookings.verify",
    order: 60,
    colSpanDesktop: "col-span-12 sm:col-span-6 lg:col-span-3",
    component: ApprovalQueueWidget,
  },
  {
    id: "cash-flow-overview",
    title: "Cash Flow Overview",
    category: "finance",
    permission: "accounting.view",
    order: 70,
    colSpanDesktop: "col-span-12 sm:col-span-6 lg:col-span-3",
    component: CashFlowOverviewWidget,
  },
  {
    id: "announcements",
    title: "Announcements",
    category: "general",
    permission: "announcements.view",
    order: 80,
    colSpanDesktop: "col-span-12 sm:col-span-6 lg:col-span-3",
    component: AnnouncementsWidget,
  },
  {
    id: "todays-tasks",
    title: "Today's Tasks",
    category: "general",
    permission: "tasks.view",
    order: 90,
    colSpanDesktop: "col-span-12 sm:col-span-6 lg:col-span-3",
    component: TodaysTasksWidget,
  },
  {
    id: "employee-status",
    title: "Employee Status",
    category: "team",
    permission: "users.view",
    order: 100,
    colSpanDesktop: "col-span-12 sm:col-span-6 lg:col-span-3",
    component: EmployeeStatusWidget,
  },
  {
    id: "employee-workload",
    title: "Employee Workload",
    category: "team",
    permission: "users.view",
    order: 110,
    colSpanDesktop: "col-span-12 sm:col-span-6 lg:col-span-3",
    component: EmployeeWorkloadWidget,
  },
  {
    id: "recent-bookings",
    title: "Recent Bookings",
    category: "operations",
    permission: "bookings.view",
    order: 120,
    colSpanDesktop: "col-span-12 sm:col-span-6 lg:col-span-3",
    component: RecentBookingsWidget,
  }
];
