import React from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Ticket, DollarSign, Calendar, AlertCircle, Plus, Search, ChevronRight, Users, Compass } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

interface MobileDashboardViewProps {
  onOpenNewBooking: () => void;
  onOpenSearch: () => void;
}

export const MobileDashboardView: React.FC<MobileDashboardViewProps> = ({
  onOpenNewBooking,
  onOpenSearch,
}) => {
  const navigate = useNavigate();
  const { admin } = useAuthStore();
  const isFounder = (admin?.email || "").toLowerCase().includes("hemal") || admin?.role === "superadmin";

  return (
    <div className="space-y-4 pb-20">
      {/* Welcome & Founder Mode Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-4 shadow-lg border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Welcome back,</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FF5400] text-white tracking-wider">
              {isFounder ? "FOUNDER" : "OPERATIONS"}
            </span>
          </div>
          <h2 className="text-base font-extrabold text-white mt-0.5">{admin?.name || "Admin Leader"}</h2>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">YouthCamping OS Mobile Command Center</p>
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all border border-white/10"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Founder / Manager Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onOpenNewBooking}
          className="p-3.5 rounded-2xl bg-[#FF5400] text-white shadow-md shadow-orange-500/20 text-left flex flex-col justify-between h-24 active:scale-98 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Plus className="w-5 h-5 stroke-[2.5px]" />
          </div>
          <div>
            <span className="text-xs font-black block leading-tight">New Booking</span>
            <span className="text-[10px] text-white/80 font-medium block">1-Tap Reservation</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/departures")}
          className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-md text-left flex flex-col justify-between h-24 active:scale-98 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Compass className="w-5 h-5 text-[#FF5400]" />
          </div>
          <div>
            <span className="text-xs font-black block leading-tight">Departure Hub</span>
            <span className="text-[10px] text-slate-400 font-medium block">Station Operations</span>
          </div>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Today's Sales */}
        <div
          onClick={() => navigate("/admin/bookings")}
          className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-2xs cursor-pointer active:bg-slate-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">TODAY'S SALES</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">₹42,500</p>
          <span className="text-[10px] font-bold text-emerald-600 mt-0.5 block">+18% vs yesterday</span>
        </div>

        {/* Today's Bookings */}
        <div
          onClick={() => navigate("/admin/bookings")}
          className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-2xs cursor-pointer active:bg-slate-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">TODAY'S BOOKINGS</span>
            <Ticket className="w-4 h-4 text-[#FF5400]" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">6 Bookings</p>
          <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">14 Travellers</span>
        </div>

        {/* Collections */}
        <div
          onClick={() => navigate("/admin/accounting")}
          className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-2xs cursor-pointer active:bg-slate-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">COLLECTIONS</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">₹35,000</p>
          <span className="text-[10px] font-bold text-purple-600 mt-0.5 block">UPI & Cash Received</span>
        </div>

        {/* Upcoming Departures */}
        <div
          onClick={() => navigate("/admin/departures")}
          className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-2xs cursor-pointer active:bg-slate-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">DEPARTURES</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">3 Upcoming</p>
          <span className="text-[10px] font-bold text-blue-600 mt-0.5 block">Next: 28 July Manali</span>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Live Operations Priority</h3>
          <span className="text-[10px] font-black bg-orange-50 text-[#FF5400] px-2 py-0.5 rounded border border-orange-100 uppercase">Active</span>
        </div>

        <div className="space-y-2">
          <div
            onClick={() => navigate("/admin/departures")}
            className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/60"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#FF5400] flex items-center justify-center font-bold text-xs">
                MKA
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Manali Kasol Expedition</h4>
                <p className="text-[10px] text-slate-500">28 July • 45/52 Collected</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div
            onClick={() => navigate("/admin/inquiries")}
            className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/60"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                CRM
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Pending Follow-ups</h4>
                <p className="text-[10px] text-slate-500">8 Hot Leads awaiting call</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboardView;
