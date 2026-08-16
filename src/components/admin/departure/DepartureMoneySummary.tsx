import React, { useState } from "react";
import {
  TrendingUp,
  Building,
  Users,
} from "lucide-react";
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

  const unitMetrics = [
    { label: "Rev / pax", value: revenuePerPax },
    { label: "Stay / pax", value: hotelPerPax },
    { label: "Fleet / pax", value: transportPerPax },
    ...(trainCost > 0 ? [{ label: "Train / pax", value: trainPerPax }] : []),
    { label: "Cost / pax", value: costPerPax },
  ];
  const metricCols =
    unitMetrics.length + 1 >= 6
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
      : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5";

  const amountBlock = (n: number, emphasize = false, tone?: "ok" | "warn" | "muted") => (
    <div className="text-right min-w-0">
      <span
        className={cn(
          "tabular-nums",
          emphasize ? "font-semibold text-sm" : "font-medium text-xs",
          tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-[#FF4D00]" : "text-[#0B1528]",
        )}
      >
        {viewMode === "perpax" ? fmtPax(n) : fmt(n)}
      </span>
      {viewMode === "both" && (
        <span className="text-[10px] text-slate-400 block tabular-nums">{fmtPax(n)}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-3 min-w-0 pb-8 md:pb-0">
      <div className="bg-white border border-[#E8EEF4] rounded-xl p-3.5 sm:p-4 min-w-0 text-[#0B1528]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#0B1528] tracking-tight">
              Per-person unit economics
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalPax} travellers · realisation, cost, and margin per person
            </p>
          </div>
          <div className="inline-flex items-center rounded-md border border-[#E8EEF4] bg-[#F4F7FB] p-0.5 self-start shrink-0">
            {(
              [
                { id: "both", label: "Split" },
                { id: "perpax", label: "Per pax" },
                { id: "aggregate", label: "Total" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setViewMode(opt.id)}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                  viewMode === opt.id
                    ? "bg-white text-[#0B1528] shadow-xs"
                    : "text-slate-500 hover:text-[#0B1528]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("mt-3 grid gap-2 min-w-0", metricCols)}>
          {unitMetrics.map((m) => (
            <div
              key={m.label}
              className="border border-[#E8EEF4] rounded-lg px-2.5 py-2 min-w-0 bg-white"
            >
              <p className="text-[10px] font-medium text-slate-400">{m.label}</p>
              <p className="text-sm font-semibold text-[#0B1528] tabular-nums mt-0.5">
                ₹{m.value.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
          <div className="border border-[#E8EEF4] rounded-lg px-2.5 py-2 min-w-0 bg-white col-span-2 sm:col-span-1">
            <p className="text-[10px] font-medium text-slate-400">Profit / pax</p>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums mt-0.5",
                profitPerPax >= 0 ? "text-emerald-600" : "text-rose-600",
              )}
            >
              ₹{profitPerPax.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
        <div className="bg-white border border-[#E8EEF4] rounded-xl p-4 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <p className="text-[12px] font-semibold text-[#0B1528]">
                Customer receivables
              </p>
            </div>
            <span className="text-[10px] font-medium text-slate-400 tabular-nums shrink-0">
              {paidPct}% collected
            </span>
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
