import React from "react";
import { Inbox, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatINR } from "@/lib/utils";

export const FINANCE_ORANGE = "#FF4D00";
export const FINANCE_NAVY = "#0B1528";

export const financePrimaryBtn =
  "h-8 text-xs font-semibold bg-[#FF4D00] hover:bg-[#E04400] text-white shadow-xs";
export const financeApproveBtn =
  "h-7 text-xs font-bold bg-green-600 hover:bg-green-700 text-white shadow-xs";
export const financeRejectBtn =
  "h-7 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50";
export const financeOutlineBtn =
  "h-8 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200";

export function formatStatusLabel(status?: string | null) {
  if (!status) return "—";
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  PENDING_APPROVAL: "bg-amber-50 text-amber-800 border-amber-200",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-800 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-800 border-blue-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  VERIFIED: "bg-green-50 text-green-700 border-green-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  DISCREPANCY: "bg-orange-50 text-orange-800 border-orange-200",
  FLAG_DISCREPANCY: "bg-orange-50 text-orange-800 border-orange-200",
  PARTIAL: "bg-sky-50 text-sky-800 border-sky-200",
  PARTIALLY_USED: "bg-sky-50 text-sky-800 border-sky-200",
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  BLOCKED: "bg-red-50 text-red-700 border-red-200",
  IN_PROGRESS: "bg-blue-50 text-blue-800 border-blue-200",
  CANCELLED: "bg-slate-50 text-slate-600 border-slate-200",
  EXPIRED: "bg-slate-50 text-slate-600 border-slate-200",
};

export function FinanceStatusBadge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  const key = (status || "").toUpperCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5",
        STATUS_TONE[key] || "bg-slate-50 text-slate-700 border-slate-200",
        className,
      )}
    >
      {formatStatusLabel(status)}
    </Badge>
  );
}

type MoneyTone = "neutral" | "credit" | "debit" | "outstanding" | "muted";

export function MoneyAmount({
  value,
  tone = "neutral",
  signed = false,
  empty = "—",
  className,
}: {
  value?: number | null;
  tone?: MoneyTone;
  signed?: boolean;
  empty?: string;
  className?: string;
}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return <span className={cn("font-mono text-slate-400", className)}>{empty}</span>;
  }
  const amount = Number(value);
  const resolvedTone: MoneyTone =
    tone !== "neutral"
      ? tone
      : amount < 0
        ? "debit"
        : "neutral";
  const prefix = signed && amount > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "font-mono tabular-nums font-semibold",
        resolvedTone === "credit" && text-green-600,
        resolvedTone === "debit" && text-red-600,
        resolvedTone === "outstanding" && "text-amber-700",
        resolvedTone === "muted" && "text-slate-500 font-medium",
        resolvedTone === "neutral" && "text-slate-900",
        className,
      )}
    >
      {prefix}
      {formatINR(amount)}
    </span>
  );
}

export function FinanceEmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}

export function FinanceLoadingBlock({ label = "Loading finance data…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-xs font-semibold text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin text-[#FF4D00]" />
      {label}
    </div>
  );
}

export function FinanceQueueCard({
  title,
  description,
  toolbar,
  children,
}: {
  title: string;
  description?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl border border-slate-200 shadow-xs bg-white overflow-hidden">
      <CardHeader className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-sm font-bold text-[#0B1528]">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs text-slate-500 mt-0.5">{description}</CardDescription>
          )}
        </div>
        {toolbar ? <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">{toolbar}</div> : null}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export function FinanceKpiCard({
  label,
  value,
  sub,
  active,
  alert,
  onClick,
}: {
  label: string;
  value: number | string;
  sub?: string;
  active?: boolean;
  alert?: boolean;
  onClick?: () => void;
}) {
  const numeric = typeof value === "number" ? value : Number(value);
  const needsAttention = alert && Number.isFinite(numeric) && numeric > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left p-3 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between min-h-[84px] min-w-0",
        active
          ? "bg-orange-50 border-[#FF4D00] shadow-xs"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70",
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</div>
      <div
        className={cn(
          "text-xl font-extrabold mt-1 tabular-nums leading-none",
          needsAttention ? "text-amber-700" : "text-[#0B1528]",
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] font-medium text-slate-500 truncate mt-1.5">{sub}</div>}
    </button>
  );
}

export const financeTh =
  "py-2.5 px-3 md:px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap";
export const financeTd = "py-3 px-3 md:px-4 align-middle";

export function FinanceTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-xs border-collapse">{children}</table>
    </div>
  );
}

export function FinanceTableHead({ columns }: { columns: { label: string; align?: "left" | "right" }[] }) {
  return (
    <thead>
      <tr className="bg-slate-50/90 border-b border-slate-200">
        {columns.map((col) => (
          <th key={col.label} className={cn(financeTh, col.align === "right" && "text-right")}>
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function FinancePrimaryButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button size="sm" className={cn(financePrimaryBtn, className)} {...props} />;
}

export function FinanceApproveButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button size="sm" className={cn(financeApproveBtn, className)} {...props} />;
}

export function FinanceRejectButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" size="sm" className={cn(financeRejectBtn, className)} {...props} />
  );
}

