import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeFormatDate(dateVal: any, options?: Intl.DateTimeFormatOptions, fallback: string = "N/A"): string {
  if (!dateVal) return fallback;
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);
  return date.toLocaleDateString('en-IN', options || { day: '2-digit', month: 'short', year: 'numeric' });
}

export function safeFormatDateTime(dateVal: any, options?: Intl.DateTimeFormatOptions, fallback: string = "N/A"): string {
  if (!dateVal) return fallback;
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);
  return date.toLocaleDateString('en-IN', options || {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

export function formatDate(dateVal: any, fallback: string = "N/A"): string {
  if (!dateVal) return fallback;
  const clean = typeof dateVal === 'string' ? dateVal : dateVal?.date || String(dateVal);
  const date = new Date(clean);
  if (isNaN(date.getTime())) return String(clean);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const TRAIN_TICKET_STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-amber-100 text-amber-700",
  BOOKED:      "bg-emerald-100 text-emerald-700",
  WAITLISTED:  "bg-indigo-100 text-indigo-700",
  CONFIRMED:   "bg-teal-100 text-teal-700",
  RAC:         "bg-pink-100 text-pink-700",
  SELF_BOOKED: "bg-purple-100 text-purple-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

export const TRAIN_TICKET_APPROVAL_COLORS: Record<string, string> = {
  DRAFT:     "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED:  "bg-emerald-100 text-emerald-700",
  REJECTED:  "bg-red-100 text-red-700",
  REOPENED:  "bg-orange-100 text-orange-700",
};

export function getUpcomingDefaultDates(count = 6, startDaysFromNow = 7): string[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + startDaysFromNow + i * 7);
    return d.toISOString().split('T')[0];
  });
}

export function computeGst(basePrice: number, discount: number, gstRate: number): number {
  const rawGst = (basePrice - discount) * gstRate;
  return Math.round(rawGst * 100) / 100;
}
