import api from "./api";
import type { Trip, TripFormData } from "@/types";

let _cache: Trip[] | null = null;
let _cacheAt = 0;
let _compactCache: Trip[] | null = null;
let _compactCacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

function invalidate() {
  _cache = null;
  _cacheAt = 0;
  _compactCache = null;
  _compactCacheAt = 0;
}

export const tripsService = {
  async getAll(): Promise<Trip[]> {
    if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache;
    const res = await api.get("/trips?status=all");
    _cache = res.data.data;
    _cacheAt = Date.now();
    return _cache!;
  },

  async getCompact(): Promise<Trip[]> {
    if (_compactCache && Date.now() - _compactCacheAt < CACHE_TTL) return _compactCache;
    const res = await api.get("/trips/compact?status=all");
    _compactCache = res.data.data;
    _compactCacheAt = Date.now();
    return _compactCache!;
  },

  async getById(id: string): Promise<Trip | undefined> {
    const res = await api.get(`/trips/${id}`);
    return res.data.data;
  },

  async create(data: TripFormData): Promise<Trip> {
    const res = await api.post("/trips", data);
    invalidate();
    return res.data.data;
  },

  async update(id: string, data: Partial<TripFormData>): Promise<Trip> {
    const res = await api.put(`/trips/${id}`, data);
    invalidate();
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/trips/${id}`);
    invalidate();
  },
  async shuffle(): Promise<void> {
    await api.post("/trips/shuffle");
    invalidate();
  },
  async bulkUpdateOrder(orderMap: Record<string, number>): Promise<void> {
    await api.post("/trips/bulk-order", { orderMap });
    invalidate();
  },
};
