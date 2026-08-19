import React from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Ticket,
  Wallet,
  Calendar,
  Plus,
  Search,
  ChevronRight,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import type { DashboardStats } from "@/types";
import { cn } from "@/lib/utils";

interface MobileDashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  userPerms: unknown;
  userRole?: string;
  onOpenNewBooking: () => void;
  onOpenSearch: () => void;
}

const PERIOD_OPTIONS: { value: string; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

/** Prefix used on period-scoped metric labels so the number always matches the filter. */
const PERIOD_PREFIX: Record<string, string> = {
  today: "Today's",
  week: "This week's",
  month: "This month's",
  year: "This year's",
  all: "Total",
};

const formatInr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/**
 * Renders a metric value, distinguishing "still loading" from "no data returned"
 * so an API failure never renders as a real-looking zero.
 */
const MetricValue: React.FC<{
  loading: boolean;
  value: number | undefined;
  format?: (value: number) => string;
}> = ({ loading, value, format }) => {
  if (loading) {
    return (
      <div className="h-6 w-20 mt-1 rounded bg-slate-200/80 animate-pulse" />
    );
  }
  if (value === undefined || value === null) {
    return (
      <p className="text-[18px] font-black text-slate-400 mt-1 leading-tight">
        —
      </p>
    );
  }
  const text = format ? format(value) : value.toLocaleString("en-IN");
  return (
    <p
      title={text}
      className="text-[18px] font-black text-slate-900 mt-1 leading-tight tabular-nums truncate"
    >
      {text}
    </p>
  );
};

const MetricCard: React.FC<{
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading: boolean;
  value: number | undefined;
  format?: (value: number) => string;
  caption: React.ReactNode;
}> = ({ label, icon, onClick, loading, value, format, caption }) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm text-left min-w-0 active:bg-slate-50 active:scale-[0.98] transition-all"
  >
    <div className="flex items-start justify-between gap-1.5">
      <span className="min-w-0 text-[10px] font-semibold leading-tight tracking-wide text-slate-500">
        {label}
      </span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#E8EEF4] bg-[#F4F7FB] text-[#0B1528]">
        {icon}
      </span>
    </div>
    <MetricValue loading={loading} value={value} format={format} />
    <span className="text-[10px] font-bold text-slate-500 mt-0.5 block truncate">
      {caption}
    </span>
  </button>
);

export const MobileDashboardView: React.FC<MobileDashboardViewProps> = ({
  stats,
  loading,
  dateFilter,
  onDateFilterChange,
  userPerms,
  userRole,
  onOpenNewBooking,
  onOpenSearch,
}) => {
  const navigate = useNavigate();
  const { admin } = useAuthStore();

  const adminEmail = (admin?.email || "").toLowerCase();
  const isFounder =
    adminEmail === "hemal.patel@youthcamping.online" ||
    adminEmail.includes("hemal") ||
    admin?.role === "superadmin";

  const canViewAccounting = hasPermission(
    userPerms,
    PERMISSIONS.ACCOUNTING_VIEW,
    userRole,
  );
  const canViewBookings = hasPermission(
    userPerms,
    PERMISSIONS.BOOKINGS_VIEW,
    userRole,
  );
  const canViewTrips = hasPermission(userPerms, PERMISSIONS.TRIPS_VIEW, userRole);
  const periodPrefix = PERIOD_PREFIX[dateFilter] || "TOTAL";

  const upcomingDepartures = stats?.tripsDepartingNext7Days || [];
  const nextDeparture = upcomingDepartures[0];

  // Only surface items that actually need action, urgent ones first.
  const attentionItems = (stats?.attentionItems || [])
    .filter((item) => (item?.count || 0) > 0)
    .sort((a, b) => Number(!!b.urgent) - Number(!!a.urgent))
    .slice(0, 4);

  const pendingPayments = stats?.pendingPayments;
  const netCashInflow = stats?.cashFlow?.netCashInflow;

  return (
    <div className="space-y-3">
      {/* Welcome & Role Banner */}
      <div className="bg-gradient-to-r from-[#0B1329] via-[#122040] to-[#0B1329] text-white rounded-2xl p-3.5 shadow-lg border border-slate-800 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              Welcome back,
            </span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FF5400] text-white tracking-wider shrink-0">
              {isFounder ? "FOUNDER" : userRole?.toUpperCase() || "OPERATIONS"}
            </span>
          </div>
          <h2 className="text-[15px] font-extrabold text-white mt-0.5 truncate">
            {admin?.name || (admin as { fullName?: string })?.fullName || "Admin"}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
            YouthCamping OS Mobile Command Center
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search"
          className="w-10 h-10 shrink-0 rounded-xl bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all border border-white/10"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onOpenNewBooking}
          className="p-3 rounded-2xl bg-[#FF5400] text-white shadow-md shadow-orange-500/20 text-left flex flex-col justify-between h-[88px] active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Plus className="w-5 h-5 stroke-[2.5px]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black block leading-tight truncate">
              New Booking
            </span>
            <span className="text-[10px] text-white/80 font-medium block truncate">
              1-Tap Reservation
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/departures")}
          className="p-3 rounded-2xl bg-[#0B1329] text-white shadow-md text-left flex flex-col justify-between h-[88px] active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Compass className="w-5 h-5 text-[#FF5400]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black block leading-tight truncate">
              Departure Hub
            </span>
            <span className="text-[10px] text-slate-400 font-medium block truncate">
              Station Operations
            </span>
          </div>
        </button>
      </div>

      {/* Period Filter — keeps metric labels honest about the range shown */}
      <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onDateFilterChange(option.value)}
            className={cn(
              "flex-1 h-8 rounded-lg text-[11px] font-bold transition-all active:scale-95",
              dateFilter === option.value
                ? "bg-[#0B1329] text-white shadow-sm"
                : "text-slate-500",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {canViewAccounting && (
          <MetricCard
            label={`${periodPrefix} payments`}
            icon={<TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />}
            onClick={() => navigate("/admin/accounting")}
            loading={loading}
            value={stats?.totalRevenue}
            format={formatInr}
            caption={
              stats?.collectionRate !== undefined
                ? `${stats.collectionRate}% collected`
                : "Paid & confirmed"
            }
          />
        )}

        {canViewBookings && (
          <MetricCard
            label={`${periodPrefix} bookings`}
            icon={<Users className="h-3.5 w-3.5" strokeWidth={1.75} />}
            onClick={() => navigate("/admin/bookings")}
            loading={loading}
            value={stats?.totalBookings}
            caption={
              stats?.totalTravelers
                ? `${stats.totalTravelers} travelers`
                : "Bookings recorded"
            }
          />
        )}

        {canViewTrips && (
          <MetricCard
            label="Departures · next 7 days"
            icon={<Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />}
            onClick={() => navigate("/admin/departures")}
            loading={loading}
            value={stats?.tripsDepartingNext7Days?.length}
            caption={
              nextDeparture
                ? `Next: ${nextDeparture.date}`
                : "None scheduled"
            }
          />
        )}
      </div>

      {/* Live Operations Priority */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <h3 className="truncate text-[11px] font-semibold tracking-wide text-[#0B1528]">
            Live operations
          </h3>
          <span className="text-[9px] font-black bg-orange-50 text-[#FF5400] px-2 py-0.5 rounded border border-orange-100 uppercase shrink-0">
            {loading ? "Syncing" : "Live"}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="h-14 rounded-xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {canViewTrips &&
              upcomingDepartures.slice(0, 3).map((departure, index) => (
                <button
                  key={`${departure.name}-${departure.date}-${index}`}
                  type="button"
                  onClick={() => navigate("/admin/departures")}
                  className="w-full flex items-center justify-between gap-2 p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-left active:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-orange-100 text-[#FF5400] flex items-center justify-center">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-900 truncate">
                        {departure.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">
                        {departure.date} • {departure.count} booked
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}

            {attentionItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between gap-2 p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-left active:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center",
                      item.urgent
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-600",
                    )}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-slate-900 truncate">
                      {item.label}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate">
                      {item.count} awaiting action
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}

            {upcomingDepartures.length === 0 && attentionItems.length === 0 && (
              <div className="flex items-center gap-2 py-4 justify-center text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-[11px] font-semibold">
                  {stats
                    ? "Nothing needs attention right now"
                    : "Operations data unavailable"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileDashboardView;

