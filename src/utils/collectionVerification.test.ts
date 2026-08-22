import { describe, expect, it } from "vitest";
import {
  canVerifyCollection,
  canonicalCollectionStatus,
  isCollectionPending,
  isCollectionVerified,
} from "./collectionVerification";

describe("canonicalCollectionStatus", () => {
  it("does not display a pending approval as verified", () => {
    expect(canonicalCollectionStatus("PENDING", "Verified")).toBe("PENDING");
    expect(canonicalCollectionStatus("REVIEWED_FINANCE_CONTROLLER", "Pending Verification")).toBe(
      "PENDING",
    );
    expect(isCollectionVerified("PENDING")).toBe(false);
    expect(isCollectionPending("PENDING", "Verified")).toBe(true);
  });

  it("displays APPROVED_FOUNDER as verified even if receipt text differs", () => {
    expect(canonicalCollectionStatus("APPROVED_FOUNDER", "Pending Verification")).toBe(
      "VERIFIED",
    );
    expect(isCollectionVerified("APPROVED_FOUNDER")).toBe(true);
    expect(isCollectionPending("APPROVED_FOUNDER", "Verified")).toBe(false);
  });
});

describe("canVerifyCollection identity", () => {
  it("allows founder and finance controller", () => {
    expect(canVerifyCollection({ role: "founder" })).toBe(true);
    expect(canVerifyCollection({ role: "superadmin" })).toBe(true);
    expect(canVerifyCollection({ role: "finance_controller" })).toBe(true);
  });

  it("allows admin only when they are the protected founder identity", () => {
    expect(canVerifyCollection({ role: "admin" })).toBe(false);
    expect(
      canVerifyCollection({
        role: "admin",
        email: "hemal.patel@youthcamping.online",
      }),
    ).toBe(true);
  });

  it("denies sales, viewer, ops, guide, generic finance, and custom roles", () => {
    expect(canVerifyCollection({ role: "sales" })).toBe(false);
    expect(canVerifyCollection({ role: "viewer" })).toBe(false);
    expect(canVerifyCollection({ role: "operations" })).toBe(false);
    expect(canVerifyCollection({ role: "guide" })).toBe(false);
    expect(canVerifyCollection({ role: "finance" })).toBe(false);
    expect(
      canVerifyCollection({
        role: "custom",
        permissions: ["finance.incoming.verify", "accounting.approve", "ops.manage"],
      }),
    ).toBe(false);
  });
});
