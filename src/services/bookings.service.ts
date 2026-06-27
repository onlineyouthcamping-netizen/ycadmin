import api from "./api";
import type { Booking, BookingTrip } from "@/types";

export const bookingsService = {
  // ── BOOKINGS ──
  
  async getAll(filters?: {
    status?: string;
    tripId?: string;
    paymentStatus?: string;
    payment_status?: string;
    search?: string;
    salesAdminId?: string;
    balanceOnly?: boolean | string;
    bookingStart?: string;
    bookingEnd?: string;
    depStart?: string;
    depEnd?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== "") {
            params.append(key, String(val));
          }
        });
      }

      const res = await api.get(`/bookings?${params.toString()}`);
      return res.data;
    } catch (err) {
      console.error("🔥 Bookings fetch failed:", err);
      throw err;
    }
  },

  async getById(id: string): Promise<Booking> {
    const res = await api.get(`/bookings/${id}`);
    return res.data.data;
  },

  async create(data: any): Promise<Booking> {
    const res = await api.post("/bookings", data);
    return res.data.data;
  },

  async update(id: string, data: any): Promise<Booking> {
    const res = await api.put(`/bookings/${id}`, data);
    return res.data.data;
  },

  async confirm(id: string, data: { totalAmount: number; advancePaid: number; paymentMode: string; paymentStatus: string }): Promise<Booking> {
    const res = await api.put(`/bookings/${id}/confirm`, data);
    return res.data.data;
  },

  async confirmPayment(id: string): Promise<Booking> {
    const res = await api.patch(`/bookings/${id}/confirm-payment`);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/bookings/${id}`);
  },

  // ── TRIPS ──

  async getTrips(): Promise<BookingTrip[]> {
    try {
      const res = await api.get("/bookings/trips");
      return res.data.data;
    } catch (err) {
      console.error("🔥 Trips fetch failed:", err);
      throw err;
    }
  },

  async createTrip(data: { tripCode: string; tripName: string; price?: number }): Promise<BookingTrip> {
    const res = await api.post("/bookings/trips", data);
    return res.data.data;
  },

  async updateTrip(id: string, data: { tripCode?: string; tripName?: string; price?: number }): Promise<BookingTrip> {
    const res = await api.put(`/bookings/trips/${id}`, data);
    return res.data.data;
  },

  async deleteTrip(id: string): Promise<void> {
    await api.delete(`/bookings/trips/${id}`);
  },

  // ── EMAILS ──

  async sendEmail(bookingId: string, type: 'confirmation' | 'payment' | 'reminder' | 'cancellation' | 'invoice', amount?: number): Promise<void> {
    console.log("📡 [bookingsService] Sending email request:", { bookingId, type, amount });
    await api.post("/emails/send", { 
      bookingId, 
      type, 
      amount: amount || 0 
    });
  },

  async getEmailLogs(bookingId: string): Promise<any[]> {
    const res = await api.get(`/emails/logs/${bookingId}`);
    return res.data;
  }
};
