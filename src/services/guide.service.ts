import api from "./api";

export interface Guide {
  id: number;
  name: string;
  phone: string;
  activeTripName: string | null;
  todayStatus: "checked_in" | "checked_out" | "missing" | "idle";
  lastCheckInTime: string | null;
  flagged: boolean;
  daysLogged: number;
  email: string | null;
  profilePhoto: string | null;
  address: string | null;
  notes: string | null;
}

export interface AttendanceLog {
  id: number;
  guideName: string;
  tripName: string;
  date: string;
  checkInTime: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkInLocationName: string | null;
  checkInSelfieUrl: string | null;
  checkInDistance: number | null;
  checkOutTime: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkOutLocationName: string | null;
  checkOutSelfieUrl: string | null;
  checkOutDistance: number | null;
  notes: string | null;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "location_mismatch"
    | "incomplete";
}

export interface PayrollItem {
  guideId: number;
  guideName: string;
  dailyRate: number;
  approvedDays: number;
  payableAmount: number;
  tripBreakdown: {
    tripName: string;
    approvedDays: number;
    amount: number;
  }[];
}

export interface Assignment {
  id: number;
  guideId: number;
  guideName: string;
  tripId: number | null;
  tripName: string;
  departureDate: string;
  role: "guide" | "coordinator" | "captain" | "lead_guide" | "assistant_guide";
  perDayAmount: number;
  allowedLatitude: number | null;
  allowedLongitude: number | null;
  allowedRadius: number;
  status: "assigned" | "ongoing" | "completed" | "cancelled";
  mainBackendTripId: string | null;
  mainBackendTripName: string | null;
  createdAt: string;
}

export interface GuideTrip {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  leadGuideId: number;
  leadGuideName: string;
  status: string;
}

export interface MainBackendTrip {
  id: string;
  title: string;
  slug: string;
  location: string;
  duration: string;
  description: string;
  price: number;
  status: string;
}

export interface TravelerInfo {
  bookingId: string;
  bookingCuid?: string;
  name: string;
  phone: string;
  email: string;
  departureDate: string;
  pickupCity: string;
  paymentStatus: string;
  totalAmount: number;
  advancePaid: number;
  remainingAmount: number;
  isPrimaryBooker: boolean;
  age: number | null;
  gender: string | null;
  foodPreference?: string;
}

export interface Expense {
  id: number;
  guideId: number;
  guideName: string;
  assignmentId: number;
  tripName: string;
  category:
    | "hotel_payment"
    | "toll_receipt"
    | "fuel_bill"
    | "entry_ticket"
    | "misc_expense";
  amount: number;
  description: string;
  receiptUrl: string;
  status: "pending" | "approved" | "rejected";
  adminRemarks: string | null;
  createdAt: string;
}

export interface TravelerAttendance {
  id: number;
  assignmentId: number;
  bookingId: string;
  travelerName: string;
  travelerPhone: string | null;
  status:
    | "arrived_pickup"
    | "boarded_train"
    | "reached_destination"
    | "missing_delayed";
  notes: string | null;
  markedByGuideId: number;
  markedByGuideName: string;
  updatedAt: string;
}

export interface TripStatusUpdate {
  id: number;
  assignmentId: number;
  guideId: number;
  guideName: string;
  status:
    | "trip_started"
    | "train_boarded"
    | "destination_reached"
    | "hotel_checkin_complete"
    | "sightseeing_started"
    | "return_journey_started";
  notes: string | null;
  location: string | null;
  updatedAt: string;
}

export const guideService = {
  async getDashboard() {
    const res = await api.get<{
      activeTrips: number;
      totalGuides: number;
      todayCheckIns: number;
      missingCheckIns: number;
      locationMismatchFlags: number;
    }>("/admin/dashboard");
    return res.data;
  },

  async getGuides() {
    const res = await api.get<Guide[]>("/admin/guides");
    return res.data;
  },

  async createGuide(data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
    profilePhoto?: string;
  }) {
    const res = await api.post<Guide>("/admin/guides", data);
    return res.data;
  },

  async updateGuide(
    id: number,
    data: Partial<{
      name: string;
      phone: string;
      email: string;
      address: string;
      notes: string;
      profilePhoto: string;
      todayStatus: string;
      flagged: boolean;
    }>,
  ) {
    const res = await api.put<Guide>(`/admin/guides/${id}`, data);
    return res.data;
  },

  async deleteGuide(id: number) {
    const res = await api.delete<{ success: boolean; message: string }>(
      `/admin/guides/${id}`,
    );
    return res.data;
  },

  async getAttendanceLogs() {
    const res = await api.get<AttendanceLog[]>("/admin/attendance-logs");
    return res.data;
  },

  async verifyAttendance(logId: number, status: "approved" | "rejected") {
    const res = await api.post("/admin/verify-attendance", { logId, status });
    return res.data;
  },

  async getPayroll() {
    const res = await api.get<PayrollItem[]>("/admin/payroll");
    return res.data;
  },

  async getAssignments() {
    const res = await api.get<Assignment[]>("/admin/assignments");
    return res.data;
  },

  async createAssignment(data: {
    guideId: number;
    tripId?: number | null;
    tripName: string;
    departureDate: string;
    role: "guide" | "coordinator" | "captain" | "lead_guide" | "assistant_guide";
    perDayAmount: number;
    allowedLatitude?: number | null;
    allowedLongitude?: number | null;
    allowedRadius?: number;
    mainBackendTripId?: string | null;
    mainBackendTripName?: string | null;
  }) {
    const res = await api.post<Assignment>("/admin/assignments", data);
    return res.data;
  },

  async updateAssignment(
    id: number,
    data: Partial<{
      guideId: number;
      tripName: string;
      departureDate: string;
      role: string;
      perDayAmount: number;
      allowedRadius: number;
      status: string;
    }>,
  ) {
    const res = await api.put<Assignment>(
      `/admin/assignments/${id}`,
      data,
    );
    return res.data;
  },

  async deleteAssignment(id: number) {
    const res = await api.delete(`/admin/assignments/${id}`);
    return res.data;
  },

  async getTrips() {
    const res = await api.get<GuideTrip[]>("/admin/trips");
    return res.data;
  },

  async getMainBackendTrips() {
    const res = await api.get<MainBackendTrip[]>("/admin/main-trips");
    return res.data;
  },

  async getRecentTripStatuses() {
    const res = await api.get<any[]>("/admin/trip-status/recent");
    return res.data;
  },

  async getTravelersForAssignment(assignmentId: number) {
    const res = await api.get<TravelerInfo[]>(
      `/admin/travelers/${assignmentId}`,
    );
    return res.data;
  },

  async getExpenses() {
    const res = await api.get<Expense[]>("/admin/expenses");
    return res.data;
  },

  async updateExpenseStatus(
    id: number,
    status: "approved" | "rejected",
    adminRemarks?: string,
  ) {
    const res = await api.put<Expense>(`/admin/expenses/${id}/status`, {
      status,
      adminRemarks,
    });
    return res.data;
  },

  async getTravelerAttendanceLogs(assignmentId: number) {
    const res = await api.get<TravelerAttendance[]>(
      `/admin/traveler-attendance/${assignmentId}`,
    );
    return res.data;
  },

  async getTripStatusUpdates(assignmentId: number) {
    const res = await api.get<TripStatusUpdate[]>(
      `/admin/trip-status/${assignmentId}`,
    );
    return res.data;
  },

  async getLiveOperationsTimeline(filters?: {
    tripId?: number;
    assignmentId?: number;
    guideId?: number;
    date?: string;
    type?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.tripId) params.append("tripId", String(filters.tripId));
    if (filters?.assignmentId)
      params.append("assignmentId", String(filters.assignmentId));
    if (filters?.guideId) params.append("guideId", String(filters.guideId));
    if (filters?.date) params.append("date", filters.date);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);

    const res = await api.get<any[]>(
      `/admin/operations/live?${params.toString()}`,
    );
    return res.data;
  },

  async getLiveOperationsStats(assignmentId: number) {
    const res = await api.get<{
      totalParticipants: number;
      confirmedCount: number;
      pendingCount: number;
      cancelledCount: number;
      maleCount: number;
      femaleCount: number;
      jainPreferenceCount: number;
      nonJainPreferenceCount: number;
      otherFoodPreferenceCount: number;
      pickupCityBreakdown: Record<string, number>;
    }>(`/admin/operations/stats/${assignmentId}`);
    return res.data;
  },

  async getLiveOperationsAlerts() {
    const res = await api.get<any[]>("/admin/operations/alerts");
    return res.data;
  },

  async approveHotelUpdate(
    id: number,
    status: "approved" | "rejected" | "done",
    notes?: string,
  ) {
    const res = await api.put(`/admin/operations/hotel/${id}`, {
      status,
      notes,
    });
    return res.data;
  },

  async syncFoodPreference(
    bookingCuid: string,
    bookingId: string,
    passengerName: string,
    foodPreference: string,
    isPrimaryBooker: boolean,
    reason?: string,
  ) {
    const res = await api.post("/admin/operations/sync-food-preference", {
      bookingCuid,
      bookingId,
      passengerName,
      foodPreference,
      isPrimaryBooker,
      reason,
    });
    return res.data;
  },
};

export default guideService;
