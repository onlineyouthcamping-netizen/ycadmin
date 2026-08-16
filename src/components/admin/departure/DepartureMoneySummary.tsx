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

  const amountBlock = (n: number, emphasize = false, tone?: "ok" | "warn" | "bad") => (
    <div className="text-right min-w-0">
      <span
        className={cn(
          "tabular-nums",
          emphasize ? "font-semibold text-sm" : "font-medium text-xs",
          tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-[#FF4D00]" : tone === "bad" ? "text-rose-600" : "text-[#0B1528]",
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
          <div
            className={cn(
              "border border-[#E8EEF4] rounded-lg px-2.5 py-2 min-w-0 bg-white",
              unitMetrics.length % 2 === 0 ? "col-span-2 sm:col-span-1" : "col-span-1",
            )}
          >
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
          <div className="space-y-2">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[12px] text-slate-500">Total bookings</span>
              {amountBlock(revenue)}
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[12px] text-slate-500">Received</span>
              {amountBlock(received)}
            </div>
            <div className="flex justify-between items-baseline gap-2 pt-2 border-t border-[#E8EEF4]">
              <span className="text-[12px] font-medium text-[#0B1528]">Pending due</span>
              {amountBlock(pending, true, pending > 0 ? "warn" : undefined)}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E8EEF4] rounded-xl p-4 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <p className="text-[12px] font-semibold text-[#0B1528]">
                Vendor payables
              </p>
            </div>
            <span className="text-[10px] font-medium text-slate-400 tabular-nums shrink-0">
              {viewMode === "perpax" ? fmtPax(totalVendorDue) : `${fmt(totalVendorDue)} due`}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[12px] text-slate-500">Hotels ({hotels.length})</span>
              {amountBlock(hotelsCost)}
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[12px] text-slate-500">Transport ({transports.length})</span>
              {amountBlock(transportsCost)}
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[12px] text-slate-500">Guides ({guides.length})</span>
              {amountBlock(guidesCost)}
            </div>
            <div className="flex justify-between items-baseline gap-2 pt-2 border-t border-[#E8EEF4]">
              <span className="text-[12px] font-medium text-[#0B1528]">Paid / due</span>
              <div className="text-right min-w-0">
                <span className="text-xs font-medium text-[#0B1528] tabular-nums">
                  {viewMode === "perpax" ? fmtPax(totalVendorPaid) : fmt(totalVendorPaid)}
                  <span className="text-slate-300"> / </span>
                  <span className={totalVendorDue > 0 ? "text-[#FF4D00]" : "text-slate-500"}>
                    {viewMode === "perpax" ? fmtPax(totalVendorDue) : fmt(totalVendorDue)}
                  </span>
                </span>
                {viewMode === "both" && (
                  <span className="text-[10px] text-slate-400 block tabular-nums">
                    {fmtPax(totalVendorPaid)} / {fmtPax(totalVendorDue)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E8EEF4] rounded-xl p-4 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <p className="text-[12px] font-semibold text-[#0B1528]">
                Trip profitability
              </p>
            </div>
            <span className="text-[10px] font-medium text-slate-400 tabular-nums shrink-0">
              Margin {margin}%
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[12px] text-slate-500">Gross revenue</span>
              {amountBlock(revenue)}
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[12px] text-slate-500">Total vendor cost</span>
              {amountBlock(totalVendorCost)}
            </div>
            <div className="flex justify-between items-baseline gap-2 pt-2 border-t border-[#E8EEF4]">
              <span className="text-[12px] font-medium text-[#0B1528]">Net profit</span>
              {amountBlock(netProfit, true, netProfit >= 0 ? "ok" : "bad")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
