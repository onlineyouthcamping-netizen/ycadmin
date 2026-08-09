import { describe, it, expect } from "vitest";
import {
  calculateBookingFinancialStatus,
  safeNumber,
} from "../paymentCalculator";

describe("paymentCalculator", () => {
  it("should convert numeric strings, null, and undefined cleanly", () => {
    expect(safeNumber("10000")).toBe(10000);
    expect(safeNumber("₹15,000")).toBe(15000);
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(undefined)).toBe(0);
    expect(safeNumber(0)).toBe(0);
  });

  it("should calculate UNPAID status when 0 paid", () => {
    const res = calculateBookingFinancialStatus({
      totalAmount: 10000,
      advancePaid: 0,
    });
    expect(res.paymentStatus).toBe("UNPAID");
    expect(res.remainingAmount).toBe(10000);
  });

  it("should calculate PARTIAL status when partially paid", () => {
    const res = calculateBookingFinancialStatus({
      totalAmount: 10000,
      advancePaid: 5000,
    });
    expect(res.paymentStatus).toBe("PARTIAL");
    expect(res.remainingAmount).toBe(5000);
  });

  it("should calculate PAID status when fully paid", () => {
    const res = calculateBookingFinancialStatus({
      totalAmount: 10000,
      advancePaid: 10000,
    });
    expect(res.paymentStatus).toBe("PAID");
    expect(res.remainingAmount).toBe(0);
  });

  it("should calculate OVERPAID status when overpaid", () => {
    const res = calculateBookingFinancialStatus({
      totalAmount: 10000,
      advancePaid: 12000,
    });
    expect(res.paymentStatus).toBe("OVERPAID");
    expect(res.overpaymentAmount).toBe(2000);
    expect(res.remainingAmount).toBe(0);
  });

  it("should calculate REFUNDED status when refunded", () => {
    const res = calculateBookingFinancialStatus({
      totalAmount: 10000,
      advancePaid: 5000,
      refundAmount: 5000,
    });
    expect(res.paymentStatus).toBe("REFUNDED");
    expect(res.netPaidAmount).toBe(0);
    expect(res.remainingAmount).toBe(10000);
  });

  it("should calculate CANCELLED status when booking is cancelled", () => {
    const res = calculateBookingFinancialStatus({
      totalAmount: 10000,
      advancePaid: 5000,
      status: "CANCELLED",
    });
    expect(res.paymentStatus).toBe("CANCELLED");
  });
});
