import api from "./api";

export interface Idea {
  id: string;
  title: string;
  description: string;
  trip: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string;
  addedOn: string;
}

export interface Campaign {
  id: string;
  name: string;
  period: string;
  platform: string;
  spend: number;
  leads: number;
  bookings: number;
  revenue: number;
  roas: number;
  status: string;
}

export interface Learning {
  campaignInfo: {
    name: string;
    objective: string;
    buyingType: string;
    budget: string;
    startDate: string;
    endDate: string;
    status: string;
    createdBy: string;
    createdOn: string;
  };
  metrics: {
    spend: number;
    spendChange: number;
    leads: number;
    leadsChange: number;
    bookings: number;
    bookingsChange: number;
    revenue: number;
    revenueChange: number;
    roas: number;
    roasChange: number;
    costPerBooking: number;
    costPerBookingChange: number;
  };
  whatWorked: string[];
  whatDidntWork: string[];
  ideasNextSeason: string[];
  competitorObservations: {
    competitor: string;
    observation: string;
    whatTheyDid: string;
    shouldTry: string;
    notes: string;
  }[];
  importantNotes: string[];
  aiSuggestions: string[];
  driveLinks: {
    creatives: string;
    adCopies: string;
    rawVideos: string;
    thumbnails: string;
    screenshots: string;
  };
  bestCreatives: {
    id: string;
    name: string;
    leads: number;
    bookings: number;
    videoUrl: string;
  }[];
}

export interface Asset {
  name: string;
  type: string;
  link: string;
  addedOn: string;
}

export interface Report {
  season: string;
  period: string;
  duration: number;
  campaigns: number;
  spend: number;
  leads: number;
  bookings: number;
  revenue: number;
  roas: number;
  costPerBooking: number;
  conversionRate: number;
  icon: string;
}

export const marketingService = {
  async getOverview(tripId: string = "MKA") {
    const res = await api.get(`/marketing/overview?tripId=${tripId}`);
    return res.data.data;
  },

  async getContentStudio() {
    const res = await api.get("/marketing/content-studio");
    return res.data.data;
  },

  async createIdea(data: any): Promise<Idea> {
    const res = await api.post("/marketing/content-studio/idea", data);
    return res.data.data;
  },

  async updateIdea(id: string, data: any): Promise<Idea> {
    const res = await api.put(`/marketing/content-studio/idea/${id}`, data);
    return res.data.data;
  },

  async deleteIdea(id: string): Promise<void> {
    await api.delete(`/marketing/content-studio/idea/${id}`);
  },

  async getCampaigns() {
    const res = await api.get("/marketing/campaigns");
    return res.data.data;
  },

  async getLearnings(campaignId: string = "campaign_2"): Promise<Learning> {
    const res = await api.get(`/marketing/learnings/${campaignId}`);
    return res.data.data;
  },

  async getAssets(campaignId: string = "campaign_2"): Promise<Asset[]> {
    const res = await api.get(`/marketing/assets/${campaignId}`);
    return res.data.data;
  },

  async getReports(tripId: string = "MKA"): Promise<Report[]> {
    const res = await api.get(`/marketing/reports?tripId=${tripId}`);
    return res.data.data;
  }
};
