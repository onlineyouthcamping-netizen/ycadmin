import { describe, expect, it } from "vitest";
import {
  classifyReceiptStatus,
  displayPaymentRef,
  isClearedReceipt,
  sumReceipts,
} from "../paymentUtils";

describe("paymentUtils finance receipt helpers", () => {
  it("classifies verification states for the booking payments tabs", () => {
    expect(classifyReceiptStatus("Pending Verification")).toBe("pending");
    expect(classifyReceiptStatus("pending")).toBe("pending");
    expect(classifyReceiptStatus("Rejected")).toBe("failed");
  });

  it("does not treat OpsClientPayment.status Verified as collected without founder approval", () => {
    expect(
      isClearedReceipt({
        status: "success",
        approvalStatus: "PENDING",
      }),
    ).toBe(false);
    expect(
      isClearedReceipt({
        status: "Verified",
        approvalStatus: "PENDING",
      }),
    ).toBe(false);
    expect(
      isClearedReceipt({
        status: "Verified",
        approvalStatus: "APPROVED_FOUNDER",
      }),
    ).toBe(true);
  });

  it("hides plugin leftover refs like payments.offlinepayment", () => {
    expect(
      displayPaymentRef({
        transactionId: "payments.offlinepayment",
        utrNumber: "PAY-1787403602774",
      }),
    ).toBe("PAY-1787403602774");
    expect(displayPaymentRef({ transactionId: "payments.offlinepayment", id: "abc123xyz" })).toBe(
      "PAY-BC123XYZ",
    );
  });

  it("sums only finance-cleared money toward due", () => {
    const rows = [
      { amount: 5000, status: "pending", approvalStatus: "PENDING" },
      { amount: 10000, status: "success", approvalStatus: "APPROVED_FOUNDER" },
      { amount: 2000, status: "failed", approvalStatus: "REJECTED" },
    ];
    expect(sumReceipts(rows, "success")).toBe(10000);
    expect(sumReceipts(rows, "pending")).toBe(5000);
  });
});
