import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "./api";
import { paymentsService } from "./payments.service";

describe("paymentsService.uploadProof", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("returns the persisted payment only after the API reports success with a proof URL", async () => {
    const payment = {
      id: "pay_1",
      proofFileUrl: "/uploads/payment-proofs/receipt.jpg",
      proofUrl: "/uploads/payment-proofs/receipt.jpg",
    };
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        payment,
        proof_url: payment.proofFileUrl,
      },
    });

    const result = await paymentsService.uploadProof(
      "pay_1",
      new File(["x"], "receipt.jpg", { type: "image/jpeg" }),
    );

    expect(api.post).toHaveBeenCalledWith(
      "/finance/collections/pay_1/upload-proof",
      expect.any(FormData),
      expect.objectContaining({
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
    expect(result.success).toBe(true);
    expect(result.payment.proofFileUrl).toBe(
      "/uploads/payment-proofs/receipt.jpg",
    );
  });

  it("does not treat a success flag without a persisted proof as complete", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, payment: { id: "pay_1" } },
    });

    await expect(
      paymentsService.uploadProof(
        "pay_1",
        new File(["x"], "receipt.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toThrow(/not persisted/i);
  });

  it("throws when the API reports failure so callers cannot show a success toast", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: false,
        message: "Collection payment not found or access denied",
      },
    });

    await expect(
      paymentsService.uploadProof(
        "pay_1",
        new File(["x"], "receipt.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toThrow(/not found|access denied/i);
  });
});
