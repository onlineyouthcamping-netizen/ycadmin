import React from "react";
import { cn } from "@/lib/utils";

export const dashLink =
  "text-[11px] font-semibold text-[#FF4D00] hover:text-[#E04400] whitespace-nowrap shrink-0 cursor-pointer";

export const dashEmpty =
  "p-6 text-center text-xs text-slate-400 font-medium";

export const dashRowLabel =
  "text-xs font-medium text-[#0B1528] truncate";

export function cnDashAction(className?: string) {
  return cn(
    "inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B1528] hover:text-[#FF4D00] transition-colors cursor-pointer",
    className,
  );
}

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

export function DashBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-4 flex-1 overflow-y-auto min-w-0", className)}>
      {children}
    </div>
  );
}

export function DashList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-[#E8EEF4] -my-1", className)}>
      {children}
    </div>
  );
}

export function DashRow({
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
        "py-2.5 flex items-center justify-between gap-2 text-xs",
        onClick && "cursor-pointer hover:bg-[#F8FAFC] -mx-4 px-4 transition-colors",
        className,
      )}
    >
      {children}
    </div>
  );
}
