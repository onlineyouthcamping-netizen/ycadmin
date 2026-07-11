import api from "./api";
import type { Payment, PaymentSummary } from "@/types";

export const paymentsService = {
  async getByBooking(bookingId: string): Promise<{ payments: Payment[]; summary: PaymentSummary }> {
    const res = await api.get(`/payments/booking/${bookingId}`);
    return { payments: res.data.data, summary: res.data.summary };
  },

  async add(data: {
    bookingId: string;
    amount: number;
    paymentMode: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
  }): Promise<Payment> {
    const res = await api.post("/payments", data);
    return res.data.data;
  },

  async getAll(): Promise<{ payments: Payment[]; totalRevenue: number }> {
    const res = await api.get("/payments");
    return { payments: res.data.data, totalRevenue: res.data.totalRevenue };
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
