/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Bus,
  UserCheck,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DepartureMoneySummaryProps {
  tripId: string;
  departureDateStr: string;
  stats: {
    totalRevenue: number;
    customerPaid: number;
    customerOutstanding: number;
    customerPaidPercent: number;
  };
  tripVendors: any[];
}

export default function DepartureMoneySummary({
  tripId,
  departureDateStr,
  stats,
  tripVendors,
}: DepartureMoneySummaryProps) {
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n || 0).toLocaleString("en-IN")}`;

  const hotels = tripVendors.filter((v: any) => v.vendorType === "hotel");
  const transports = tripVendors.filter((v: any) => v.vendorType === "transport");
  const guides = tripVendors.filter((v: any) => v.vendorType === "guide");

  const hotelsCost = hotels.reduce((s: number, v: any) => s + (v.agreedCost || 0), 0);
  const transportsCost = transports.reduce((s: number, v: any) => s + (v.agreedCost || 0), 0);
  const guidesCost = guides.reduce((s: number, v: any) => s + (v.agreedCost || 0), 0);

  const hotelsPaid = hotels.reduce((s: number, v: any) => s + (v.paidAmount || 0), 0);
  const transportsPaid = transports.reduce((s: number, v: any) => s + (v.paidAmount || 0), 0);
  const guidesPaid = guides.reduce((s: number, v: any) => s + (v.paidAmount || 0), 0);

  const totalVendorCost = hotelsCost + transportsCost + guidesCost;
  const totalVendorPaid = hotelsPaid + transportsPaid + guidesPaid;
  const totalVendorDue = totalVendorCost - totalVendorPaid;

  const revenue = stats.totalRevenue;
  const received = stats.customerPaid;
  const pending = stats.customerOutstanding;
  const netProfit = revenue - totalVendorCost;
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0";
  const paidPct = stats.customerPaidPercent || 0;

  return (
    <div className="space-y-4">
      {/* 3-PANEL CONSOLIDATED P&L SUMMARY HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Panel 1: Customer Receivables */}
        <div className="bg-white border border-emerald-200 rounded-[8px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
              Customer Receivables
            </p>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold">
              {paidPct}% Collected
            </Badge>
          </div>
          <div className="space-y-1.5 font-sans">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total Bookings</span>
              <span className="font-black text-slate-800">{fmt(revenue)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Received</span>
              <span className="font-bold text-emerald-600">{fmt(received)}</span>
            </div>
            <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700">Pending Due</span>
              <span className="font-black text-orange-600">{fmt(pending)}</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Vendor Payables */}
        <div className="bg-white border border-red-200 rounded-[8px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-red-700 uppercase tracking-wider">
              Vendor Payables
            </p>
            <Badge className="bg-red-50 text-red-700 border-red-200 text-[9px] font-bold">
              {fmt(totalVendorDue)} Due
            </Badge>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Hotels ({hotels.length})</span>
              <span className="font-semibold text-slate-700">{fmt(hotelsCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transport ({transports.length})</span>
              <span className="font-semibold text-slate-700">{fmt(transportsCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Guides ({guides.length})</span>
              <span className="font-semibold text-slate-700">{fmt(guidesCost)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-100">
              <span className="font-bold text-slate-700">Paid / Due</span>
              <span className="font-black text-slate-900">
                {fmt(totalVendorPaid)} / <span className="text-red-600">{fmt(totalVendorDue)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Panel 3: Trip Profit */}
        <div className="bg-white border border-indigo-200 rounded-[8px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">
              Trip Profitability
            </p>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] font-bold">
              Margin {margin}%
            </Badge>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Gross Revenue</span>
              <span className="font-semibold text-slate-700">{fmt(revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Vendor Cost</span>
              <span className="font-semibold text-slate-700">{fmt(totalVendorCost)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700">Net Profit</span>
              <span className={`font-black text-sm ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {fmt(netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
