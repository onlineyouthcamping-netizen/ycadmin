/**
 * Centralized Payment Color & Formatting Utilities
 *
 * Status Color Mapping:
 * - Inquiry / Pending / Unconfirmed / Awaiting Confirmation => Received = RED (#DC2626)
 * - Confirmed => Received = GREEN (#059669)
 * - Cancelled => Received = GREY (#64748B)
 * - Refunded => Received = BLUE (#2563EB)
 * - Partially Refunded => Received = ORANGE (#D97706)
 */

export enum BookingPaymentState {
  CONFIRMED = "confirmed",
  PENDING = "pending",
  UNCONFIRMED = "unconfirmed",
  INQUIRY = "inquiry",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  REFUNDED = "refunded",
  PARTIALLY_REFUNDED = "partially_refunded",
}

export function normalizeBookingStatus(
  status?: string,
  paymentStatus?: string,
): string {
  if (!status && !paymentStatus) return "pending";

  const s = (status || "").toLowerCase().trim();
  const ps = (paymentStatus || "").toLowerCase().trim();

  if (ps === "refunded" || s === "refunded")
    return BookingPaymentState.REFUNDED;
  if (ps === "partially refunded" || ps === "partially_refunded")
    return BookingPaymentState.PARTIALLY_REFUNDED;
  if (s === "cancelled" || ps === "cancelled")
    return BookingPaymentState.CANCELLED;
  if (s === "expired") return BookingPaymentState.EXPIRED;
  if (s === "confirmed") return BookingPaymentState.CONFIRMED;

  return BookingPaymentState.PENDING;
}

export function getPaymentReceivedColorClass(
  status?: string,
  paymentStatus?: string,
  fontClass: string = "font-bold",
): string {
  const state = normalizeBookingStatus(status, paymentStatus);

  switch (state) {
    case BookingPaymentState.CONFIRMED:
      return `text-green-600 ${fontClass}`;
    case BookingPaymentState.REFUNDED:
      return `text-blue-600 ${fontClass}`;
    case BookingPaymentState.PARTIALLY_REFUNDED:
      return `text-amber-600 ${fontClass}`;
    case BookingPaymentState.CANCELLED:
    case BookingPaymentState.EXPIRED:
      return `text-slate-500 ${fontClass}`;
    case BookingPaymentState.PENDING:
    case BookingPaymentState.UNCONFIRMED:
    case BookingPaymentState.INQUIRY:
    default:
      return `text-red-600 ${fontClass}`;
  }
}

export function getPaymentReceivedColorHex(
  status?: string,
  paymentStatus?: string,
): string {
  const state = normalizeBookingStatus(status, paymentStatus);

  switch (state) {
    case BookingPaymentState.CONFIRMED:
      return "#059669"; // Green
    case BookingPaymentState.REFUNDED:
      return "#2563EB"; // Blue
    case BookingPaymentState.PARTIALLY_REFUNDED:
      return "#D97706"; // Orange
    case BookingPaymentState.CANCELLED:
    case BookingPaymentState.EXPIRED:
      return "#64748B"; // Grey
    case BookingPaymentState.PENDING:
    case BookingPaymentState.UNCONFIRMED:
    case BookingPaymentState.INQUIRY:
    default:
      return "#DC2626"; // Red
  }
}

export type ReceiptFinanceStatus = "success" | "pending" | "failed";

export function classifyReceiptStatus(raw?: string): ReceiptFinanceStatus {
  const s = String(raw || "").toLowerCase().trim();
  if (
    s === "success" ||
    s === "verified" ||
    s === "paid" ||
    s === "approved" ||
    s === "cleared"
  ) {
    return "success";
  }
  if (
    s === "failed" ||
    s === "rejected" ||
    s === "expired" ||
    s === "cancelled" ||
    s === "refunded"
  ) {
    return "failed";
  }
  return "pending";
}

export function isClearedReceipt(p: { status?: string; approvalStatus?: string }): boolean {
  if (classifyReceiptStatus(p?.approvalStatus) === "success") return true;
  return classifyReceiptStatus(p?.status) === "success";
}

/** Staff-facing UTR / txn id — never Razorpay/plugin codes like payments.offlinepayment */
export function displayPaymentRef(p: {
  transactionId?: string | null;
  utrNumber?: string | null;
  referenceNumber?: string | null;
  id?: string;
}): string {
  const candidates = [p?.transactionId, p?.utrNumber, p?.referenceNumber];
  for (const raw of candidates) {
    const t = String(raw || "").trim();
    if (!t) continue;
    if (/^payments\./i.test(t)) continue;
    if (/offlinepayment/i.test(t)) continue;
    return t;
  }
  const id = String(p?.id || "").trim();
  return id ? `PAY-${id.slice(-8).toUpperCase()}` : "—";
}

export function sumReceipts(
  payments: Array<{ amount?: number; status?: string; approvalStatus?: string }>,
  kind: ReceiptFinanceStatus,
): number {
  return (payments || []).reduce((sum, p) => {
    const status = isClearedReceipt(p) ? "success" : classifyReceiptStatus(p?.status);
    return status === kind ? sum + (Number(p?.amount) || 0) : sum;
  }, 0);
}

