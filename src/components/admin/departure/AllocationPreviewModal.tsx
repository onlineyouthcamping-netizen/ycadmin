/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AllocationPreviewModal — YouthCamping Admin
 * Renders proposed room/vehicle auto-allocations, sharing groups, capacity metrics,
 * and capacity conflict warnings BEFORE committing changes to the backend API.
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Bed, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AllocationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSave: () => void;
  proposedAllocations: Record<string, { room?: string; vehicle?: string; seat?: string }>;
  allPassengers: any[];
  roomCapacity: number;
  totalPax: number;
  isSaving: boolean;
}

export default function AllocationPreviewModal({
  isOpen,
  onClose,
  onConfirmSave,
  proposedAllocations,
  allPassengers,
  roomCapacity,
  totalPax,
  isSaving,
}: AllocationPreviewModalProps) {
  // Group proposed room assignments
  const roomGroups: Record<string, any[]> = {};
  const unassigned: any[] = [];

  allPassengers.forEach((p) => {
    const alloc = proposedAllocations[p.id] || proposedAllocations[p.name];
    if (alloc && alloc.room && alloc.room !== "—" && alloc.room !== "Unassigned") {
      if (!roomGroups[alloc.room]) roomGroups[alloc.room] = [];
      roomGroups[alloc.room].push(p);
    } else {
      unassigned.push(p);
    }
  });

  const allocatedPaxCount = totalPax - unassigned.length;
  const isShortfall = roomCapacity < totalPax && totalPax > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-6 rounded-[12px] shadow-2xl border border-slate-200 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-[#FF4D00]" />
            <DialogTitle className="text-lg font-black text-slate-800">
              Proposed Allocation Preview
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Review proposed room assignments and capacity metrics before saving to database.
          </DialogDescription>
        </DialogHeader>

        {/* Capacity Warning Badge */}
        {isShortfall && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5 my-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 font-medium">
              <span className="font-bold">Capacity Conflict Warning:</span> Total active passengers ({totalPax}) exceeds configured room capacity ({roomCapacity}). {totalPax - roomCapacity} pax will require extra beds or additional rooms.
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3 my-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pax</span>
            <span className="text-base font-black text-slate-800">{totalPax}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Room Capacity</span>
            <span className="text-base font-black text-blue-800">{roomCapacity} Beds</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider block">Proposed Rooms</span>
            <span className="text-base font-black text-green-700">{Object.keys(roomGroups).length} Rooms</span>
          </div>
        </div>

        {/* Proposed Room List */}
        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 my-2 border border-slate-100 rounded-lg p-2">
          {Object.entries(roomGroups).map(([roomNo, members]) => (
            <div key={roomNo} className="bg-slate-50 border border-slate-200 rounded-md p-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-800 block">{roomNo}</span>
                <span className="text-xs font-semibold text-slate-600">
                  {members.map((m) => `${m.name} (${m.gender || "Pax"})`).join(", ")}
                </span>
              </div>
              <span className="text-[11px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {members.length} Pax
              </span>
            </div>
          ))}

          {unassigned.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2.5">
              <span className="text-xs font-black text-red-700 block">Unassigned Passengers ({unassigned.length})</span>
              <span className="text-xs text-red-700 font-medium">
                {unassigned.map((m) => m.name).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel (Keep Current)
          </Button>
          <Button
            size="sm"
            onClick={onConfirmSave}
            disabled={isSaving}
            className="bg-[#FF4D00] hover:bg-[#E04400] text-white font-bold"
          >
            {isSaving ? "Saving to Database..." : "Confirm & Save Allocation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

