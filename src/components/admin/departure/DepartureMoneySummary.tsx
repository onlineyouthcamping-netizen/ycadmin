import React, { useState } from "react";
import {
  TrendingUp,
  Building,
  Bus,
  Train,
  UserCheck,
  Users,
  Percent,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calculator,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DepartureMoneySummaryProps {
  tripId: string;
  departureDateStr: string;
  stats: {
    totalRevenue: number;
    customerPaid: number;
    customerOutstanding: number;
    customerPaidPercent: number | string;
    totalParticipants?: number;
    outstandingParticipantsCount?: number;
    totalVendorCost?: number;
    totalVendorPaid?: number;
    totalVendorPayables?: number;
    totalTrainCost?: number;
    totalTrainPaid?: number;
    estProfit?: number;
    profitPercent?: string;
    customerOutstandingPercent?: string;
    vendorPaidPercent?: string;
    vendorPayablePercent?: string;
    totalCollected?: number;
    totalAdvance?: number;
    totalExpenses?: number;
  };
  tripVendors: any[];
}

export default function DepartureMoneySummary({
  tripId,
  departureDateStr,
  stats,
  tripVendors,
}: DepartureMoneySummaryProps) {
  const [viewMode, setViewMode] = useState<"both" | "perpax" | "aggregate">("both");

  const totalPax = stats.totalParticipants && stats.totalParticipants > 0 ? stats.totalParticipants : 1;

  const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

  const fmtPax = (n: number) => `₹${Math.round((n || 0) / totalPax).toLocaleString("en-IN")}/pax`;

  const hotels = tripVendors.filter((v: any) => v.vendorType === "hotel");
  const transports = tripVendors.filter((v: any) => v.vendorType === "transport");
  const guides = tripVendors.filter((v: any) => v.vendorType === "guide");

  const hotelsCost = hotels.reduce((s: number, v: any) => s + (v.agreedCost || 0), 0);
  const transportsCost = transports.reduce((s: number, v: any) => s + (v.agreedCost || 0), 0);
  const guidesCost = guides.reduce((s: number, v: any) => s + (v.agreedCost || 0), 0);
  const trainCost = stats.totalTrainCost || 0;

  const hotelsPaid = hotels.reduce((s: number, v: any) => s + (v.paidAmount || 0), 0);
  const transportsPaid = transports.reduce((s: number, v: any) => s + (v.paidAmount || 0), 0);
  const guidesPaid = guides.reduce((s: number, v: any) => s + (v.paidAmount || 0), 0);
  const trainPaid = stats.totalTrainPaid || 0;

  const totalVendorCost = hotelsCost + transportsCost + guidesCost + trainCost;
  const totalVendorPaid = hotelsPaid + transportsPaid + guidesPaid + trainPaid;
  const totalVendorDue = totalVendorCost - totalVendorPaid;

  const revenue = stats.totalRevenue;
  const received = stats.customerPaid;
  const pending = stats.customerOutstanding;
  const netProfit = revenue - totalVendorCost;
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0";
  const paidPct = stats.customerPaidPercent || 0;

  // Per Person Unit Metrics
  const revenuePerPax = Math.round(revenue / totalPax);
  const hotelPerPax = Math.round(hotelsCost / totalPax);
  const transportPerPax = Math.round(transportsCost / totalPax);
  const guidePerPax = Math.round(guidesCost / totalPax);
  const trainPerPax = Math.round(trainCost / totalPax);
  const costPerPax = Math.round(totalVendorCost / totalPax);
  const profitPerPax = Math.round(netProfit / totalPax);

  return (
    <div className="space-y-3">
      {/* TOP BAR: PER PERSON UNIT ECONOMICS STRIP & VIEW SWITCHER */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                Per-Person Unit Economics
              </span>
              <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {totalPax} {totalPax === 1 ? "Pax" : "Pax"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live per-traveler realization, train ticketing baseline & net margin for this departure
            </p>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-[10px] font-sans font-semibold text-slate-400 block uppercase">Rev/Pax</span>
            <span className="text-emerald-400 font-black font-mono">₹{revenuePerPax.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-[10px] font-sans font-semibold text-slate-400 block uppercase">Stay/Pax</span>
            <span className="text-blue-400 font-bold font-mono">₹{hotelPerPax.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-[10px] font-sans font-semibold text-slate-400 block uppercase">Fleet/Pax</span>
            <span className="text-amber-400 font-bold font-mono">₹{transportPerPax.toLocaleString("en-IN")}</span>
          </div>
          {trainCost > 0 && (
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-[10px] font-sans font-semibold text-indigo-300 block uppercase">Train/Pax</span>
              <span className="text-indigo-400 font-bold font-mono">₹{trainPerPax.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-[10px] font-sans font-semibold text-slate-400 block uppercase">Cost/Pax</span>
            <span className="text-slate-300 font-bold font-mono">₹{costPerPax.toLocaleString("en-IN")}</span>
          </div>
          <div className={cn(
            "px-3 py-1.5 rounded-lg border",
            profitPerPax >= 0 
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" 
              : "bg-red-950/60 border-red-500/40 text-red-300"
          )}>
            <span className="text-[10px] font-sans font-semibold text-slate-300 block uppercase">Profit/Pax</span>
            <span className="font-black font-mono">₹{profitPerPax.toLocaleString("en-IN")}</span>
          </div>

          {/* VIEW SWITCHER */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px] font-sans">
            <button
              type="button"
              onClick={() => setViewMode("both")}
              className={cn(
                "px-2.5 py-1 rounded font-bold transition-all",
                viewMode === "both" ? "bg-orange-500 text-white shadow-xs" : "text-slate-400 hover:text-white"
              )}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode("perpax")}
              className={cn(
                "px-2.5 py-1 rounded font-bold transition-all",
                viewMode === "perpax" ? "bg-orange-500 text-white shadow-xs" : "text-slate-400 hover:text-white"
              )}
            >
              Per Pax
            </button>
            <button
              type="button"
              onClick={() => setViewMode("aggregate")}
              className={cn(
                "px-2.5 py-1 rounded font-bold transition-all",
                viewMode === "aggregate" ? "bg-orange-500 text-white shadow-xs" : "text-slate-400 hover:text-white"
              )}
            >
              Total
            </button>
          </div>
        </div>
      </div>

      {/* 3-PANEL CONSOLIDATED P&L SUMMARY HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Panel 1: Customer Receivables */}
        <div className="bg-white border border-emerald-200 rounded-[8px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                Customer Receivables
              </p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold">
              {paidPct}% Collected
            </Badge>
          </div>
          <div className="space-y-1.5 font-sans">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500">Total Bookings</span>
              <div className="text-right">
                <span className="font-black text-slate-800">
                  {viewMode === "perpax" ? fmtPax(revenue) : fmt(revenue)}
                </span>
                {viewMode === "both" && (
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {fmtPax(revenue)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500">Received</span>
              <div className="text-right">
                <span className="font-bold text-emerald-600">
                  {viewMode === "perpax" ? fmtPax(received) : fmt(received)}
                </span>
                {viewMode === "both" && (
                  <span className="text-[10px] text-emerald-600/70 block font-mono">
                    {fmtPax(received)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-baseline text-xs pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700">Pending Due</span>
              <div className="text-right">
                <span className="font-black text-orange-600">
                  {viewMode === "perpax" ? fmtPax(pending) : fmt(pending)}
                </span>
                {viewMode === "both" && (
                  <span className="text-[10px] text-orange-500 block font-mono">
                    {fmtPax(pending)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Vendor Payables */}
        <div className="bg-white border border-red-200 rounded-[8px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-red-600" />
              <p className="text-[10px] font-black text-red-700 uppercase tracking-wider">
                Vendor Payables
              </p>
            </div>
            <Badge className="bg-red-50 text-red-700 border-red-200 text-[9px] font-bold">
              {viewMode === "perpax" ? fmtPax(totalVendorDue) : `${fmt(totalVendorDue)} Due`}
            </Badge>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Hotels ({hotels.length})</span>
              <div className="text-right">
                <span className="font-semibold text-slate-700">
                  {viewMode === "perpax" ? fmtPax(hotelsCost) : fmt(hotelsCost)}
                </span>
                {viewMode === "both" && (
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {fmtPax(hotelsCost)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Transport ({transports.length})</span>
              <div className="text-right">
                <span className="font-semibold text-slate-700">
                  {viewMode === "perpax" ? fmtPax(transportsCost) : fmt(transportsCost)}
                </span>
                {viewMode === "both" && (
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {fmtPax(transportsCost)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Guides ({guides.length})</span>
              <div className="text-right">
                <span className="font-semibold text-slate-700">
                  {viewMode === "perpax" ? fmtPax(guidesCost) : fmt(guidesCost)}
                </span>
                {viewMode === "both" && (
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {fmtPax(guidesCost)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-100">
              <span className="font-bold text-slate-700">Paid / Due</span>
              <span className="font-black text-slate-900">
                {viewMode === "perpax" ? fmtPax(totalVendorPaid) : fmt(totalVendorPaid)} /{" "}
                <span className="text-red-600">
                  {viewMode === "perpax" ? fmtPax(totalVendorDue) : fmt(totalVendorDue)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Panel 3: Trip Profit */}
        <div className="bg-white border border-indigo-200 rounded-[8px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                Trip Profitability
              </p>
            </div>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] font-bold">
              Margin {margin}%
            </Badge>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Gross Revenue</span>
              <div className="text-right">
                <span className="font-semibold text-slate-700">
                  {viewMode === "perpax" ? fmtPax(revenue) : fmt(revenue)}
                </span>
                {viewMode === "both" && (
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {fmtPax(revenue)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Total Vendor Cost</span>
              <div className="text-right">
                <span className="font-semibold text-slate-700">
                  {viewMode === "perpax" ? fmtPax(totalVendorCost) : fmt(totalVendorCost)}
                </span>
                {viewMode === "both" && (
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {fmtPax(totalVendorCost)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700">Net Profit</span>
              <div className="text-right">
                <span
                  className={`font-black text-sm ${
                    netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {viewMode === "perpax" ? fmtPax(netProfit) : fmt(netProfit)}
                </span>
                {viewMode === "both" && (
                  <span
                    className={`text-[10px] font-bold block font-mono ${
                      netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {fmtPax(netProfit)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
