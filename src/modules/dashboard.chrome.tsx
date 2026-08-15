import React from "react";
import { cn } from "@/lib/utils";

export const dashLink =
  "text-[11px] font-semibold text-[#FF4D00] hover:text-[#E04400] whitespace-nowrap shrink-0 cursor-pointer";

export function DashCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-[#E8EEF4] rounded-xl shadow-none flex flex-col overflow-hidden h-full",
        onClick && "cursor-pointer hover:border-slate-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashHead({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-10 px-4 py-2 flex items-center justify-between gap-3 border-b border-[#E8EEF4] shrink-0 bg-[#F8FAFC]">
      <span className="text-[11px] font-semibold text-[#0B1528] tracking-wide truncate">
        {title}
      </span>
      {action ? <div className="flex items-center gap-3 shrink-0">{action}</div> : null}
    </div>
  );
}
