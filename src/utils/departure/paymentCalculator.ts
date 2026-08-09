/**
 * Financial & Payment Status Calculator Utility
 * Safely parses numeric values and calculates authoritative remaining balances and statuses.
 */

export type CanonicalPaymentStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID"
  | "OVERPAID"
  | "REFUNDED"
  | "CANCELLED";

export interface BookingFinancialSummary {
  totalAmount: number;
  paidAmount: number;
  refundAmount: number;
  netPaidAmount: number;
  remainingAmount: number;
  overpaymentAmount: number;
  paymentStatus: CanonicalPaymentStatus;
}

export function safeNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]/g, "").trim();
    if (!cleaned) return 0;
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function calculateBookingFinancialStatus(booking: any): BookingFinancialSummary {
  if (!booking) {
    return {
      totalAmount: 0,
      paidAmount: 0,
      refundAmount: 0,
      netPaidAmount: 0,
      remainingAmount: 0,
      overpaymentAmount: 0,
      paymentStatus: "UNPAID",
    };
  }

  // Check booking cancellation state
  const bookingStatus = String(booking.status || booking.bookingStatus || "")
    .trim()
    .toUpperCase();
  const isCancelled =
    bookingStatus === "CANCELLED" ||
    bookingStatus === "CANCELED" ||
    booking.isCancelled === true;

  // Determine total amount
  const totalAmount = Math.max(
    0,
    safeNumber(booking.totalAmount || booking.amount || booking.price || booking.totalPrice)
  );

  // Determine paid amount from payments array or direct fields
  let paidAmount = 0;
  let refundAmount = 0;

  if (Array.isArray(booking.payments) && booking.payments.length > 0) {
    booking.payments.forEach((p: any) => {
      const pAmt = safeNumber(p.amount || p.paidAmount);
      const pType = String(p.type || p.status || "").toUpperCase();
      if (pType.includes("REFUND")) {
        refundAmount += Math.abs(pAmt);
      } else {
        paidAmount += Math.max(0, pAmt);
      }
    });
  } else {
    paidAmount = safeNumber(booking.advancePaid || booking.paidAmount || booking.amountPaid);
    refundAmount = safeNumber(booking.refundAmount);
  }

  const netPaidAmount = Math.max(0, paidAmount - refundAmount);

  let remainingAmount = 0;
  let overpaymentAmount = 0;

  if (netPaidAmount > totalAmount && totalAmount > 0) {
    overpaymentAmount = netPaidAmount - totalAmount;
    remainingAmount = 0;
  } else {
    remainingAmount = Math.max(0, totalAmount - netPaidAmount);
  }

  // Determine Canonical Status
  let paymentStatus: CanonicalPaymentStatus = "UNPAID";

  if (isCancelled) {
    paymentStatus = "CANCELLED";
  } else if (refundAmount > 0 && netPaidAmount === 0) {
    paymentStatus = "REFUNDED";
  } else if (overpaymentAmount > 0) {
    paymentStatus = "OVERPAID";
  } else if (netPaidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = "PAID";
  } else if (netPaidAmount > 0) {
    paymentStatus = "PARTIAL";
  } else {
    paymentStatus = "UNPAID";
  }

  return {
    totalAmount,
    paidAmount,
    refundAmount,
    netPaidAmount,
    remainingAmount,
    overpaymentAmount,
    paymentStatus,
  };
}
