import React from "react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  badgeText,
  badgeColor = "bg-[#FF4D00]/10 text-[#FF6B00] border-[#FF4D00]/30/60",
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 pb-1",
        className,
      )}
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
          {title}
          {badgeText && (
            <span
              className={cn(
                "text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                badgeColor,
              )}
            >
              {badgeText}
            </span>
          )}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
