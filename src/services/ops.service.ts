import api from "./api";

export interface OpsDayItinerary {
  id?: string;
  departureDate?: string;
  date?: string;
  dayTitle: string;
  paxCount: number;
  hotelName?: string;
  hotelVerified: boolean;
  vehicleType?: string;
  vehicleVerified: boolean;
  remarks?: string;
  guideDriverDetails?: string;
  guideVerified: boolean;
  checkInDone: boolean;
}

export interface OpsTripExpense {
  id?: string;
  departureDate?: string;
  serviceDate?: string;
  activity: string;
  paymentDate?: string;
  totalAmount: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: string;
  remarks?: string;
}

export interface OpsAccountingSummary {
  hotelCost: number;
  transportCost: number;
  guideCost: number;
  miscCost: number;
  detailedExpensesCost: number;
  totalOpsCost: number;
  travelerCount: number;
  perPersonOpsCost: number;
  totalRevenueCollected: number;
  profitPerTrip: number;
}

export interface OpsSeatConfig {
  id?: string;
  departureDate?: string;
  totalSeatsCap: number;
  alertThreshold: number;
  blockedSeats: number;
  seatsSold: number;
  seatsAvailable: number;
  waitingList: number;
}

export interface AutoAllocationResult {
  allocationRunId?: string;
  version?: number;
  status?: string;
  vehicleAllocations: { fleetId: string; bookingId: string; travelerName: string; seatNumber?: number }[];
  roomAllocations: { roomNumber: string; roomType: string; genderGroup: string; bookingId: string; travelerName: string }[];
  flags: string[];
  whatsappTempoText: string;
  whatsappRoomText: string;
}

export interface OpsTransportFleet {
  id?: string;
  departureDate?: string;
  vehicleType: string;
  capacity: number;
  vendorId?: string;
  vendor?: { id: string; name: string };
  driverName?: string;
  driverPhone?: string;
  route?: string;
  pickupPoints?: string;
  dropPoints?: string;
  totalAmount?: number;
  advancePaid?: number;
  balanceAmount?: number;
  notes?: string;
}

export interface OpsRoomInventory {
  id?: string;
  departureDate?: string;
  roomLabel: string;
  roomType: string;
  genderGroup: string;
  capacity: number;
  hotelName?: string;
  notes?: string;
}

export const opsService = {
  async getDayItinerary(tripId: string, departureDate?: string): Promise<OpsDayItinerary[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/itinerary/${tripId}${q}`);
    return res.data?.data || [];
  },
  async upsertDayItinerary(tripId: string, data: Partial<OpsDayItinerary>, departureDate?: string): Promise<OpsDayItinerary> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/itinerary/${tripId}${q}`, data);
    return res.data?.data;
  },
  async deleteDayItinerary(id: string): Promise<void> {
    await api.delete(`/ops/itinerary/${id}`);
  },

  async getTripExpenses(tripId: string, departureDate?: string): Promise<OpsTripExpense[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/expenses/${tripId}${q}`);
    return res.data?.data || [];
  },
  async upsertTripExpense(tripId: string, data: Partial<OpsTripExpense>, departureDate?: string): Promise<OpsTripExpense> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/expenses/${tripId}${q}`, data);
    return res.data?.data;
  },
  async deleteTripExpense(id: string): Promise<void> {
    await api.delete(`/ops/expenses/${id}`);
  },

  async getTransportFleet(tripId: string, departureDate?: string): Promise<OpsTransportFleet[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/transport/${tripId}${q}`);
    return res.data?.data || [];
  },
  async createTransportFleet(tripId: string, data: Partial<OpsTransportFleet>, departureDate?: string): Promise<OpsTransportFleet> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/transport/${tripId}${q}`, data);
    return res.data?.data;
  },
  async deleteTransportFleet(id: string): Promise<void> {
    await api.delete(`/ops/transport/${id}`);
  },

  async getRoomInventory(tripId: string, departureDate?: string): Promise<OpsRoomInventory[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/rooms/${tripId}${q}`);
    return res.data?.data || [];
  },
  async createRoomInventory(tripId: string, data: Partial<OpsRoomInventory>, departureDate?: string): Promise<OpsRoomInventory> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/rooms/${tripId}${q}`, data);
    return res.data?.data;
  },
  async deleteRoomInventory(id: string): Promise<void> {
    await api.delete(`/ops/rooms/${id}`);
  },

  async getAccountingSummary(tripId: string, departureDate?: string): Promise<OpsAccountingSummary> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/accounting-summary/${tripId}${q}`);
    return res.data?.data;
  },

  async getSeatConfig(tripId: string, departureDate?: string): Promise<OpsSeatConfig> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/seats/${tripId}${q}`);
    return res.data?.data;
  },

  async executeAutoAllocation(tripId: string, departureDate?: string): Promise<AutoAllocationResult> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/auto-allocate/${tripId}${q}`);
    return res.data?.data;
  },

  async confirmAllocation(allocationRunId: string): Promise<any> {
    const res = await api.post(`/ops/auto-allocate/confirm`, { allocationRunId });
    return res.data;
  },

  async overrideAllocation(data: { allocationRunId: string; targetType: string; targetId: string; beforeValue?: any; afterValue: any; reason: string }): Promise<any> {
    const res = await api.post(`/ops/auto-allocate/override`, data);
    return res.data;
  }
};
