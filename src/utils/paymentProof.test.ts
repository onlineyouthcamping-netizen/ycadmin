import { describe, expect, it } from "vitest";
import {
  formatProofDisplayUrl,
  isProofUploadPersisted,
  resolvePaymentProofUrl,
} from "./paymentProof";

describe("resolvePaymentProofUrl", () => {
  it("prefers proofFileUrl over proofUrl", () => {
    expect(
      resolvePaymentProofUrl({
        proofFileUrl: "/uploads/payment-proofs/a.jpg",
        proofUrl: "/uploads/payment-proofs/old.jpg",
      }),
    ).toBe("/uploads/payment-proofs/a.jpg");
  });

  it("falls back to proofUrl", () => {
    expect(
      resolvePaymentProofUrl({
        proofFileUrl: null,
        proofUrl: "https://cdn.example.com/receipt.png",
      }),
    ).toBe("https://cdn.example.com/receipt.png");
  });

  it("returns null when no proof is persisted", () => {
    expect(resolvePaymentProofUrl({})).toBeNull();
    expect(resolvePaymentProofUrl({ proofUrl: "  " })).toBeNull();
    expect(resolvePaymentProofUrl(null)).toBeNull();
  });
});

describe("formatProofDisplayUrl", () => {
  it("keeps absolute URLs", () => {
    expect(
      formatProofDisplayUrl("https://cdn.example.com/a.png", "http://localhost:3001/api"),
    ).toBe("https://cdn.example.com/a.png");
  });

  it("prefixes relative upload paths with the API origin", () => {
    expect(
      formatProofDisplayUrl(
        "/uploads/payment-proofs/a.jpg",
        "http://localhost:3001/api",
      ),
    ).toBe("http://localhost:3001/uploads/payment-proofs/a.jpg");
  });
});

describe("isProofUploadPersisted", () => {
  it("requires success and a persisted proof URL before treating upload as complete", () => {
    expect(isProofUploadPersisted({ success: true })).toBe(false);
    expect(
      isProofUploadPersisted({
        success: false,
        payment: { proofFileUrl: "/uploads/payment-proofs/a.jpg" },
      }),
    ).toBe(false);
    expect(
      isProofUploadPersisted({
        success: true,
        payment: { proofFileUrl: "/uploads/payment-proofs/a.jpg" },
      }),
    ).toBe(true);
  });
});
