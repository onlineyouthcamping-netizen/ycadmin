/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  X,
  Hotel,
  Bus,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Building,
  Phone,
  Calendar,
  Users,
  MapPin,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TripControlRowData {
  dayNum: number;
  dateStr: string;
  dayLabel: string;
  destination: string;
  planTitle?: string;
  isNightJourney?: boolean;
  paxCount: number;
  hotelName: string;
  hotelPhone: string;
  hotelStatus: "BOOKED" | "PENDING" | "CANCELLED" | "NOT REQUIRED";
  hotelBookingRef?: any;
  transportName: string;
  transportStatus: "BOOKED" | "PENDING" | "NOT ASSIGNED";
  guideName: string;
  guidePhone: string;
  checkInStatus: "CHECKED-IN" | "PENDING" | "NOT REQUIRED";
  remark: string;
}

interface TripControlRowDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: TripControlRowData | null;
  onEditHotel: (row: TripControlRowData) => void;
  onChangeTransport: (row: TripControlRowData) => void;
  onAssignGuide: (row: TripControlRowData) => void;
  onToggleCheckIn: (row: TripControlRowData, newStatus: "CHECKED-IN" | "PENDING" | "NOT REQUIRED") => void;
  onSaveRemark: (row: TripControlRowData, remark: string) => void;
  onSaveDayDetail: (row: TripControlRowData, field: "vehicleType" | "guideDriverDetails", value: string) => void;
}

export default function TripControlRowDrawer({
  isOpen,
  onClose,
  rowData,
  onEditHotel,
  onChangeTransport,
  onAssignGuide,
  onToggleCheckIn,
  onSaveRemark,
  onSaveDayDetail,
}: TripControlRowDrawerProps) {
  const [remarkInput, setRemarkInput] = useState(rowData?.remark || "");
  const [transportInput, setTransportInput] = useState(rowData?.transportName || "");
  const [guideInput, setGuideInput] = useState(rowData?.guideName || "");

  React.useEffect(() => {
    if (rowData) {
      setRemarkInput(rowData.remark || "");
      setTransportInput(rowData.transportName !== "—" ? rowData.transportName : "");
      setGuideInput(rowData.guideName !== "—" ? rowData.guideName : "");
    }
  }, [rowData]);

  if (!rowData) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-white p-0 border-l border-slate-200 flex flex-col h-full shadow-2xl">
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-[#F97316] text-white hover:bg-[#F97316] font-bold text-[10px] uppercase tracking-wider">
              {rowData.dayLabel}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{rowData.dateStr}</span>
            </div>
          </div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#F97316]" />
            {rowData.destination}
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              {rowData.paxCount} Pax
            </span>
          </div>
        </div>

        {/* Drawer Scroll Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* SECTION 1: HOTEL SUMMARY */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#F97316]" /> Hotel Booking
              </span>
              <Badge
                className={cn(
                  "text-[10px] font-extrabold uppercase px-2 py-0.5 border",
                  rowData.hotelStatus === "BOOKED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : rowData.hotelStatus === "CANCELLED"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {rowData.hotelStatus}
              </Badge>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{rowData.hotelName || "No Hotel Assigned"}</p>
              {rowData.hotelPhone && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {rowData.hotelPhone}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onEditHotel(rowData);
              }}
              className="w-full h-8 text-xs font-bold border-slate-300 text-slate-700 hover:bg-white hover:border-[#F97316] hover:text-[#F97316] transition-colors"
            >
              <Hotel className="w-3.5 h-3.5 mr-1.5" /> Edit Hotel Assignment
            </Button>
          </div>

          {/* SECTION 2: TRANSPORT FLEET */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-[#F97316]" /> Transport Fleet
              </span>
              <Badge
                className={cn(
                  "text-[10px] font-extrabold uppercase px-2 py-0.5 border",
                  rowData.transportStatus === "BOOKED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {rowData.transportStatus}
              </Badge>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{rowData.transportName || "Standard Vehicle"}</p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Override for {rowData.dayLabel}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={transportInput}
                  onChange={(e) => setTransportInput(e.target.value)}
                  placeholder="Tempo details..."
                  className="w-full text-xs p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-[#F97316]"
                />
                <Button
                  size="sm"
                  onClick={() => onSaveDayDetail(rowData, "vehicleType", transportInput)}
                  className="h-[34px] px-3 bg-[#F97316] hover:bg-[#E05E00] text-white text-xs"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>

          {/* SECTION 3: GUIDE / DRIVER */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#F97316]" /> Guide / Driver
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{rowData.guideName || "Assign Guide"}</p>
              {rowData.guidePhone && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" /> {rowData.guidePhone}
                </p>
              )}
            </div>
            <div className="pt-2 border-t border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Override for {rowData.dayLabel}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guideInput}
                  onChange={(e) => setGuideInput(e.target.value)}
                  placeholder="Guide / Driver details..."
                  className="w-full text-xs p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-[#F97316]"
                />
                <Button
                  size="sm"
                  onClick={() => onSaveDayDetail(rowData, "guideDriverDetails", guideInput)}
                  className="h-[34px] px-3 bg-[#F97316] hover:bg-[#E05E00] text-white text-xs"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>

          {/* SECTION 4: HOTEL CHECK-IN UPDATE */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hotel Check-in Update
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "CHECKED-IN", label: "Checked In", color: "bg-emerald-600 text-white" },
                { id: "PENDING", label: "Pending", color: "bg-amber-500 text-white" },
                { id: "NOT REQUIRED", label: "N/A", color: "bg-slate-500 text-white" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onToggleCheckIn(rowData, st.id as any)}
                  className={cn(
                    "h-8 rounded-lg text-xs font-bold transition-all border",
                    rowData.checkInStatus === st.id
                      ? `${st.color} border-transparent shadow-xs`
                      : "bg-[#F4F7FB] text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 5: OPERATIONAL REMARK */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#F97316]" /> Operational Remark
            </label>
            <textarea
              rows={3}
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder="e.g. Guest arriving late, room upgrade requested..."
              className="w-full text-xs p-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#F97316] text-slate-800"
            />
            <Button
              size="sm"
              onClick={() => onSaveRemark(rowData, remarkInput)}
              className="w-full h-8 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-lg shadow-sm"
            >
              Save Operational Remark
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
