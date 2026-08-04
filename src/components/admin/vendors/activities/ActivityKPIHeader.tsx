import React from "react";
import { Activity, DollarSign, TrendingUp, AlertCircle, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityKPIProps {
  stats?: {
    todayActivities: number;
    pendingVendorConfirmations: number;
    passengersBooked: number;
    totalRevenue: number;
    totalVendorCost: number;
    grossProfit: number;
  };
}

export default function ActivityKPIHeader({ stats }: ActivityKPIProps) {
  const data = stats || {
    todayActivities: 28,
    pendingVendorConfirmations: 6,
    passengersBooked: 412,
    totalRevenue: 480000,
    totalVendorCost: 305000,
    grossProfit: 175000,
  };

  const margin = data.totalRevenue > 0
    ? Math.round((data.grossProfit / data.totalRevenue) * 100)
    : 36;

  const kpis = [
    {
      label: "Today's Activities",
      value: data.todayActivities.toString(),
      subtext: "Across all active departures",
      icon: Activity,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      iconColor: "text-amber-600",
    },
    {
      label: "Revenue",
      value: `₹${data.totalRevenue.toLocaleString("en-IN")}`,
      subtext: `Cost ₹${data.totalVendorCost.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      label: "Profit",
      value: `₹${data.grossProfit.toLocaleString("en-IN")}`,
      subtext: `${margin}% net margin`,
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-600",
    },
    {
      label: "Pending",
      value: data.pendingVendorConfirmations.toString(),
      subtext: "Vendor confirmations due",
      icon: AlertCircle,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      iconColor: "text-rose-600",
    },
    {
      label: "Passengers Booked",
      value: data.passengersBooked.toString(),
      subtext: "Opted-in travellers",
      icon: Users,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
    },
    {
      label: "Vendor Cost",
      value: `₹${data.totalVendorCost.toLocaleString("en-IN")}`,
      subtext: "Direct net liabilities",
      icon: CreditCard,
      color: "text-slate-700 bg-slate-50 border-slate-200",
      iconColor: "text-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {kpi.label}
              </span>
              <div className={cn("p-1.5 rounded-lg border", kpi.color)}>
                <Icon className={cn("w-4 h-4", kpi.iconColor)} />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">
                {kpi.value}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {kpi.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
