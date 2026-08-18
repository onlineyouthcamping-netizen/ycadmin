import api from "./api";

export interface FinanceAuditLogEntry {
  id: string;
  tenantId: string;
  entityType: "CUSTOMER_PAYMENT" | "VENDOR_PAYMENT" | "STATION_PAYMENT" | "REFUND";
  entityId: string;
  tripId?: string | null;
  action: "CREATED" | "REVIEWED_FC" | "APPROVED_FOUNDER" | "REJECTED" | "PROOF_UPLOADED" | "STATUS_CHANGED";
  performedBy: string;
  performedByName: string;
  performedAt: string;
  oldValue?: string | null;
  newValue?: string | null;
  changeDescription: string;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface CollectionAuditResponse {
  success: boolean;
  payment: any;
  auditTrail: FinanceAuditLogEntry[];
  approvalChain: {
    step1_financeController: {
      status: "DONE" | "PENDING" | "REJECTED";
      approvedAt?: string | null;
      approvedBy?: string | null;
    };
    step2_founder: {
      status: "DONE" | "PENDING";
      approvedAt?: string | null;
      approvedBy?: string | null;
    };
  };
}

export interface PendingApprovalsResponse {
  success: boolean;
  pendingApprovals: {
    customerCollections: number;
    vendorPayouts: number;
    total: number;
    breakdown: {
      collectionsPendingFC: number;
      collectionsAwaitingFounder: number;
      vendorPendingFC: number;
      vendorAwaitingFounder: number;
    };
    items: {
      customerPayments: any[];
      vendorPayments: any[];
    };
  };
}

export interface MonthlyReconciliationResponse {
  success: boolean;
  data: {
    period: string;
    summary: {
      totalCollections: number;
      totalPayouts: number;
      netCashFlow: number;
      collectionsByStatus: {
        pending: number;
        reviewedFC: number;
        approvedFounder: number;
        rejected: number;
      };
      payoutsByStatus: {
        pending: number;
        reviewedFC: number;
        approvedFounder: number;
        rejected: number;
      };
    };
    collections: any[];
    payouts: any[];
    auditTrail: FinanceAuditLogEntry[];
  };
}

export const financeApprovalsService = {
  // Collections 2-Tier Approval
  reviewCollectionFC: async (paymentId: string, reason?: string) => {
    const res = await api.patch(`/finance/collections/${paymentId}/review-fc`, { reason });
    return res.data;
  },

  approveCollectionFounder: async (
    paymentId: string,
    payload?: { reason?: string; proofFileUrl?: string }
  ) => {
    const res = await api.patch(`/finance/collections/${paymentId}/approve-founder`, payload || {});
    return res.data;
  },

  rejectCollection: async (paymentId: string, reason: string) => {
    const res = await api.patch(`/finance/collections/${paymentId}/reject`, { reason });
    return res.data;
  },

  uploadCollectionProof: async (
    paymentId: string,
    payload: { proofFileUrl: string; proofFileName?: string; proofFileType?: string }
  ) => {
    const res = await api.post(`/finance/collections/${paymentId}/upload-proof`, payload);
    return res.data;
  },

  getCollectionAuditTrail: async (paymentId: string): Promise<CollectionAuditResponse> => {
    const res = await api.get(`/finance/collections/${paymentId}`);
    return res.data;
  },

  // Outgoing Vendor Payments Approval
  reviewVendorPaymentFC: async (
    paymentId: string,
    payload?: { reason?: string; directClear?: boolean }
  ) => {
    const res = await api.patch(`/finance/vendor-payments/${paymentId}/review-fc`, payload || {});
    return res.data;
  },

  approveVendorPaymentFounder: async (
    paymentId: string,
    payload?: { reason?: string; invoiceFileUrl?: string }
  ) => {
    const res = await api.patch(`/finance/vendor-payments/${paymentId}/approve-founder`, payload || {});
    return res.data;
  },

  rejectVendorPayment: async (paymentId: string, reason: string) => {
    const res = await api.patch(`/finance/vendor-payments/${paymentId}/reject`, { reason });
    return res.data;
  },

  // Dashboard & Metrics
  getPendingApprovals: async (): Promise<PendingApprovalsResponse> => {
    const res = await api.get("/finance/approvals/pending");
    return res.data;
  },

  getMonthlyReconciliation: async (
    year: number,
    month: number
  ): Promise<MonthlyReconciliationResponse> => {
    const res = await api.get(`/finance/reconciliation/monthly/${year}/${month}`);
    return res.data;
  },
};
