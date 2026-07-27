import api from "./api";
import type { Payment, PaymentSummary } from "@/types";

export const paymentsService = {
  async getByBooking(bookingId: string): Promise<{ payments: Payment[]; summary: PaymentSummary }> {
    try {
      const res = await api.get(`/payments/booking/${bookingId}`);
      const rawData = res.data?.data || res.data || [];
      const payments = Array.isArray(rawData) ? rawData : (rawData.payments || []);
      const summary = rawData.summary || {
        totalAmount: 0,
        advancePaid: 0,
        remainingAmount: 0,
        paymentStatus: 'Pending'
      };
      return { payments, summary };
    } catch (e) {
      console.warn("Failed to fetch payments by booking:", e);
      return { payments: [], summary: { totalAmount: 0, advancePaid: 0, remainingAmount: 0, paymentStatus: 'Pending' } };
    }
  },

  async add(data: {
    bookingId: string;
    amount: number;
    paymentMode: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
    status?: string;
    remarks?: string;
  }): Promise<any> {
    try {
      // Primary backend endpoint: POST /payments/client/add/:bookingId
      const res = await api.post(`/payments/client/add/${data.bookingId}`, {
        amount: data.amount,
        paymentMode: data.paymentMode,
        transactionId: data.reference || `TXN-${Date.now()}`,
        paymentDate: data.paymentDate || new Date().toISOString(),
        status: data.status || 'Verified',
        remarks: data.notes || data.remarks || 'Collected Payment'
      });
      return res.data?.data || res.data;
    } catch (e: any) {
      console.warn("Primary endpoint /payments/client/add failed, trying fallback /payments endpoint:", e);
      const res = await api.post("/payments", data);
      return res.data?.data || res.data;
    }
  },

  async getAll(): Promise<{ payments: Payment[]; totalRevenue: number }> {
    try {
      const res = await api.get("/payments");
      return { payments: res.data?.data || [], totalRevenue: res.data?.totalRevenue || 0 };
    } catch (e) {
      console.warn("Failed to fetch all payments:", e);
      return { payments: [], totalRevenue: 0 };
    }
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/payments/${id}`);
  },

  async refund(id: string, data: { reason: string; amount?: number }): Promise<void> {
    await api.post(`/payments/${id}/refund`, data);
  },

  async reverse(id: string, data: { reason: string }): Promise<void> {
    await api.post(`/payments/${id}/reverse`, data);
  },
};
