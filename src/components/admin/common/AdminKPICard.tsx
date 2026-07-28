import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AdminKPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  diff?: string;
  isUp?: boolean;
  color?: string;
  bg?: string;
  onClick?: () => void;
  className?: string;
}

export function AdminKPICard({
  label,
  value,
  subtext,
  diff,
  isUp = true,
  color = "text-slate-900",
  bg = "bg-white",
  onClick,
  className
}: AdminKPICardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "border border-slate-200/80 rounded-xl p-3.5 shadow-2xs space-y-1 flex flex-col justify-between hover:border-slate-300 transition-all cursor-default select-none",
        bg,
        onClick && "cursor-pointer hover:shadow-xs hover:border-[#FF6B00]/40",
        className
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
          {label}
        </span>
        {diff && (
          <span className={cn(
            "text-[9.5px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5",
            isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {diff}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between pt-0.5">
        <span className={cn("text-xl font-black tracking-tight", color)}>
          {value}
        </span>
        {subtext && (
          <span className="text-[10px] font-bold text-slate-400">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
