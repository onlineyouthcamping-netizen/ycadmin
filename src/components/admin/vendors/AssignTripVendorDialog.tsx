/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AssignTripVendorDialog — YouthCamping Admin
 *
 * Dialog allowing operators to search ALL master vendors and assign/unassign them to a specific trip.
 * Maps vendor to trip in OpsTripVendor. Master vendor record is never deleted.
 */

import React, { useState, useEffect } from "react";
import { Search, Plus, Building2, CheckCircle2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { toast } from "sonner";

interface AssignTripVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle: string;
  onSuccess: () => void;
}

export function AssignTripVendorDialog({
  isOpen,
  onClose,
  tripId,
  tripTitle,
  onSuccess,
}: AssignTripVendorDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [masterVendors, setMasterVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchVendors = async () => {
      setLoading(true);
      try {
        // Fetch ALL master vendors regardless of trip scope; no tripId filter so we see everything
        const queryParams = new URLSearchParams();
        queryParams.set("isActive", "all"); // show active + inactive so operator has full visibility
        if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());
        queryParams.set("limit", "100");

        const res = await api.get(`/vendors/directory?${queryParams.toString()}`);
        setMasterVendors(res.data?.data || []);
      } catch (err: any) {
        console.error("Failed to load master vendors:", err);
        toast.error("Failed to load vendor list");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchVendors, 300);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery]);

  const isMappedToTrip = (vendor: any): boolean => {
    return (vendor.tripVendors || []).some((tv: any) => tv.tripId === tripId);
  };

  const handleAssign = async (vendor: any) => {
    setAssigningId(vendor.id);
    try {
      await api.post(`/vendors/trips/${tripId}/assign`, {
        vendorId: vendor.id,
        category: vendor.type || "OTHER",
        destinationId: vendor.city || vendor.location || undefined,
      });
      toast.success(`Assigned "${vendor.name}" to ${tripTitle}`);
      onSuccess();
      // Refresh vendor list so badge updates
      const res = await api.get(
        `/vendors/directory?isActive=all&limit=100${searchQuery ? `&search=${searchQuery}` : ""}`
      );
      setMasterVendors(res.data?.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to assign ${vendor.name}`);
    } finally {
      setAssigningId(null);
    }
  };

  const handleRemove = async (vendor: any) => {
    setRemovingId(vendor.id);
    try {
      await api.delete(`/vendors/trips/${tripId}/remove/${vendor.id}`);
      toast.success(`Removed "${vendor.name}" from ${tripTitle} (master record preserved)`);
      onSuccess();
      const res = await api.get(
        `/vendors/directory?isActive=all&limit=100${searchQuery ? `&search=${searchQuery}` : ""}`
      );
      setMasterVendors(res.data?.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to remove ${vendor.name}`);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-white p-0 rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <DialogHeader className="border-b border-slate-100 px-5 pt-5 pb-4">
          <DialogTitle className="text-base font-black text-slate-800">
            Manage Vendors for Trip
          </DialogTitle>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Search all master vendors and assign or remove them from{" "}
            <span className="text-[#FF4D00] font-bold">{tripTitle}</span>
          </p>
        </DialogHeader>

        <div className="px-5 pt-4 pb-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, city, GST, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>
        </div>

        {/* Vendors List */}
        <div className="px-5 pb-5 space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400 font-medium">
              Loading all master vendors...
            </div>
          ) : masterVendors.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No vendors found</p>
              <p className="text-[10px] text-slate-400">Try a different search term</p>
            </div>
          ) : (
            masterVendors.map((vendor) => {
              const mapped = isMappedToTrip(vendor);
              const isAssigning = assigningId === vendor.id;
              const isRemoving = removingId === vendor.id;

              return (
                <div
                  key={vendor.id}
                  className={`p-3.5 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                    mapped
                      ? "bg-green-50/50 border-green-200"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-800 truncate">
                        {vendor.name}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {vendor.type || "VENDOR"}
                      </span>
                      {mapped && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 shrink-0 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Assigned
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                      {vendor.city || vendor.location || "Location N/A"}
                      {vendor.phone ? ` • ${vendor.phone}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {mapped ? (
                      <button
                        type="button"
                        disabled={isRemoving}
                        onClick={() => handleRemove(vendor)}
                        className="h-7 px-3 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-[10px] font-bold rounded border border-red-200 hover:border-rose-600 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {isRemoving ? "Removing..." : "Remove"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isAssigning}
                        onClick={() => handleAssign(vendor)}
                        className="h-7 px-3 bg-[#FF4D00] hover:bg-[#E05E00] text-white text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {isAssigning ? "Assigning..." : "Assign to Trip"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

