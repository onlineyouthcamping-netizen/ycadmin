import api from "./api";

export interface CollectionAccount {
  id: string;
  accountName: string;
  accountHolderName: string;
  accountType: "COMPANY" | "INDIVIDUAL" | "BANK" | "UPI" | "CASH" | "CARD" | "OTHER";
  ownershipType?: string;
  paymentMethods: string[];
  bankName?: string | null;
  accountNumber?: string | null;
  maskedAccountNumber?: string | null;
  ifsc?: string | null;
  upiId?: string | null;
  description?: string | null;
  isActive: boolean;
  totalCollected: number;
  totalSubmitted: number;
  pending: number;
  status: "SETTLED" | "PENDING";
  lastCollection?: string | null;
  lastSubmission?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollectionAccountsResponse {
  data: CollectionAccount[];
  summary: {
    totalCollected: number;
    totalSubmitted: number;
    totalPending: number;
  };
}

export const collectionAccountsService = {
  async getAccounts(params?: { activeOnly?: boolean }): Promise<CollectionAccountsResponse> {
    const query = params?.activeOnly ? "?activeOnly=true" : "";
    const res = await api.get(`/payments/accounts${query}`);
    return {
      data: res.data?.data || [],
      summary: res.data?.summary || { totalCollected: 0, totalSubmitted: 0, totalPending: 0 },
    };
  },

  async createAccount(data: {
    accountName: string;
    accountHolderName?: string;
    accountType: string;
    paymentMethods: string[];
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<CollectionAccount> {
    const res = await api.post("/payments/accounts", data);
    return res.data?.data;
  },

  async updateAccount(
    id: string,
    data: Partial<CollectionAccount>,
  ): Promise<CollectionAccount> {
    const res = await api.put(`/payments/accounts/${id}`, data);
    return res.data?.data;
  },

  async deleteAccount(id: string): Promise<any> {
    const res = await api.delete(`/payments/accounts/${id}`);
    return res.data;
  },

  async getAccountLedger(id: string): Promise<any> {
    const res = await api.get(`/payments/accounts/${id}/ledger`);
    return res.data?.data;
  },

  async recordSubmission(
    id: string,
    data: {
      amount: number;
      paymentMode?: string;
      referenceNumber?: string;
      notes?: string;
    },
  ): Promise<any> {
    const res = await api.post(`/payments/accounts/${id}/submit`, data);
    return res.data;
  },
};

export default collectionAccountsService;
