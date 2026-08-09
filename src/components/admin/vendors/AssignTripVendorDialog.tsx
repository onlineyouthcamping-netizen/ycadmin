/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AssignTripVendorDialog — YouthCamping Admin
 *
 * Dialog allowing operators to search global master vendors and assign/map them to a specific trip.
 * Maps vendor to trip in OpsTripVendor without duplicating master vendor records.
 */

import React, { useState, useEffect } from "react";
import { Search, Plus, Building2, CheckCircle2, MapPin, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/input";
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

  // Fetch master vendors when modal opens or search query changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchVendors = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.set("tripId", "GLOBAL");
        if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());
        queryParams.set("limit", "20");

        const res = await api.get(`/vendors/directory?${queryParams.toString()}`);
        setMasterVendors(res.data?.data || []);
      } catch (err: any) {
        console.error("Failed to load master vendors:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchVendors, 250);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery]);

  const handleAssign = async (vendor: any) => {
    setAssigningId(vendor.id);
    try {
      await api.post(`/vendors/trips/${tripId}/assign`, {
        vendorId: vendor.id,
        category: vendor.type || "OTHER",
        destinationId: vendor.city || vendor.location || undefined,
      });

      toast.success(`Assigned ${vendor.name} to ${tripTitle}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || `Failed to assign ${vendor.name} to trip`
      );
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-white p-6 rounded-[12px] shadow-2xl border border-slate-200 overflow-hidden">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="text-base font-black text-slate-800">
            Assign Master Vendor to Trip
          </DialogTitle>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Map existing global master vendor to <span className="text-[#F97316] font-bold">{tripTitle}</span>
          </p>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search master vendors by name, phone, GST, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-xs font-medium border border-slate-200 rounded-md bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Vendors List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                Loading master vendors...
              </div>
            ) : masterVendors.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No master vendors found</p>
                <p className="text-[10px] text-slate-400">Try adjusting your search query</p>
              </div>
            ) : (
              masterVendors.map((vendor) => {
                const isAlreadyMapped = (vendor.tripVendors || []).some(
                  (tv: any) => tv.tripId === tripId
                );

                return (
                  <div
                    key={vendor.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">
                          {vendor.name}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {vendor.type || "VENDOR"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {vendor.city || vendor.location || "Location N/A"}{" "}
                        {vendor.phone ? `• ${vendor.phone}` : ""}
                      </p>
                    </div>

                    {isAlreadyMapped ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Already Mapped
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={assigningId === vendor.id}
                        onClick={() => handleAssign(vendor)}
                        className="h-7 px-3 bg-[#F97316] hover:bg-[#E05E00] text-white text-[10px] font-bold rounded shadow-xs transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {assigningId === vendor.id ? "Assigning..." : "Assign to Trip"}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
