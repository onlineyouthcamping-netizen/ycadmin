import api from './api';

export interface TicketingSopItem {
  id: string;
  sopId: string;
  title: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketingSop {
  id: string;
  tripId: string;
  category: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  items: TicketingSopItem[];
  _count?: { items: number };
}

export interface TicketingLink {
  id: string;
  tripId: string;
  label: string;
  val: string;
  icon: string;
  linkUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryDay {
  id: string;
  itineraryId: string;
  dayNumber: string;
  dayDate: string;
  plan: string;
  stay: string;
  meals: string;
  transport: string;
  distance: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryRouteMap {
  id: string;
  itineraryId: string;
  mapUrl?: string;
  description?: string;
}

export interface ItineraryInclusion {
  id: string;
  itineraryId: string;
  text: string;
}

export interface ItineraryExclusion {
  id: string;
  itineraryId: string;
  text: string;
}

export interface ItineraryNote {
  id: string;
  itineraryId: string;
  title: string;
  body: string;
}

export interface Itinerary {
  id: string;
  tripId: string;
  name: string;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  days: ItineraryDay[];
  routeMaps: ItineraryRouteMap[];
  inclusions: ItineraryInclusion[];
  exclusions: ItineraryExclusion[];
  notes: ItineraryNote[];
}

export interface TripSopItem {
  id: string;
  sopId: string;
  title: string;
  content?: string;
}

export interface TripSop {
  id: string;
  tripId: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  items: TripSopItem[];
  _count?: { items: number };
}

export interface TripDocument {
  id: string;
  tripId: string;
  name: string;
  category: string;
  fileType: string;
  size?: string;
  addedBy: string;
  dateAdded: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripGallery {
  id: string;
  tripId: string;
  title: string;
  imageUrl?: string;
}

export interface TripNote {
  id: string;
  tripId: string;
  title: string;
  content?: string;
  category: string;
  linkUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const travelDeskService = {
  // ── TICKETING ──
  getTicketing: async (tripId: string): Promise<{ sops: TicketingSop[]; links: TicketingLink[] }> => {
    const res = await api.get(`/travel-desk/ticketing/${tripId}`);
    return res.data.data;
  },
  createTicketingSop: async (data: Partial<TicketingSop>): Promise<TicketingSop> => {
    const res = await api.post(`/travel-desk/ticketing/sops`, data);
    return res.data.data;
  },
  updateTicketingSop: async (id: string, data: Partial<TicketingSop>): Promise<TicketingSop> => {
    const res = await api.put(`/travel-desk/ticketing/sops/${id}`, data);
    return res.data.data;
  },
  deleteTicketingSop: async (id: string): Promise<void> => {
    await api.delete(`/travel-desk/ticketing/sops/${id}`);
  },
  createTicketingLink: async (data: Partial<TicketingLink>): Promise<TicketingLink> => {
    const res = await api.post(`/travel-desk/ticketing/links`, data);
    return res.data.data;
  },
  updateTicketingLink: async (id: string, data: Partial<TicketingLink>): Promise<TicketingLink> => {
    const res = await api.put(`/travel-desk/ticketing/links/${id}`, data);
    return res.data.data;
  },
  deleteTicketingLink: async (id: string): Promise<void> => {
    await api.delete(`/travel-desk/ticketing/links/${id}`);
  },

  // ── ITINERARY ──
  getItineraries: async (tripId: string): Promise<Itinerary[]> => {
    const res = await api.get(`/travel-desk/itineraries/${tripId}`);
    return res.data.data;
  },
  createItinerary: async (data: Partial<Itinerary>): Promise<Itinerary> => {
    const res = await api.post(`/travel-desk/itineraries`, data);
    return res.data.data;
  },
  duplicateItinerary: async (id: string): Promise<Itinerary> => {
    const res = await api.post(`/travel-desk/itineraries/${id}/duplicate`);
    return res.data.data;
  },
  updateItinerary: async (id: string, data: Partial<Itinerary>): Promise<Itinerary> => {
    const res = await api.put(`/travel-desk/itineraries/${id}`, data);
    return res.data.data;
  },
  deleteItinerary: async (id: string): Promise<void> => {
    await api.delete(`/travel-desk/itineraries/${id}`);
  },
  setDefaultItinerary: async (id: string): Promise<Itinerary> => {
    const res = await api.put(`/travel-desk/itineraries/${id}/default`);
    return res.data.data;
  },

  // ── SOPs ──
  getSops: async (tripId: string): Promise<TripSop[]> => {
    const res = await api.get(`/travel-desk/sops/${tripId}`);
    return res.data.data;
  },
  createSop: async (data: Partial<TripSop>): Promise<TripSop> => {
    const res = await api.post(`/travel-desk/sops`, data);
    return res.data.data;
  },
  updateSop: async (id: string, data: Partial<TripSop>): Promise<TripSop> => {
    const res = await api.put(`/travel-desk/sops/${id}`, data);
    return res.data.data;
  },
  deleteSop: async (id: string): Promise<void> => {
    await api.delete(`/travel-desk/sops/${id}`);
  },

  // ── DOCUMENTS ──
  getDocuments: async (tripId: string): Promise<{ data: TripDocument[]; summary: Record<string, number> }> => {
    const res = await api.get(`/travel-desk/documents/${tripId}`);
    return res.data;
  },
  createDocument: async (data: Partial<TripDocument>): Promise<TripDocument> => {
    const res = await api.post(`/travel-desk/documents`, data);
    return res.data.data;
  },
  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/travel-desk/documents/${id}`);
  },

  // ── GALLERY ──
  getGallery: async (tripId: string): Promise<TripGallery[]> => {
    const res = await api.get(`/travel-desk/gallery/${tripId}`);
    return res.data.data;
  },
  createGalleryItem: async (data: Partial<TripGallery>): Promise<TripGallery> => {
    const res = await api.post(`/travel-desk/gallery`, data);
    return res.data.data;
  },
  deleteGalleryItem: async (id: string): Promise<void> => {
    await api.delete(`/travel-desk/gallery/${id}`);
  },

  // ── NOTES & UPDATES ──
  getNotes: async (tripId: string): Promise<{ data: TripNote[]; summary: Record<string, number> }> => {
    const res = await api.get(`/travel-desk/notes/${tripId}`);
    return res.data;
  },
  createNote: async (data: Partial<TripNote>): Promise<TripNote> => {
    const res = await api.post(`/travel-desk/notes`, data);
    return res.data.data;
  },
  updateNote: async (id: string, data: Partial<TripNote>): Promise<TripNote> => {
    const res = await api.put(`/travel-desk/notes/${id}`, data);
    return res.data.data;
  },
  deleteNote: async (id: string): Promise<void> => {
    await api.delete(`/travel-desk/notes/${id}`);
  },
};
