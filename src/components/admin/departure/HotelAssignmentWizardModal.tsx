/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * HotelAssignmentWizardModal — YouthCamping Admin
 *
 * Fast, Unified & Simple Hotel & Stay Assignment Screen:
 * - Single-screen easy workflow (No multi-step friction)
 * - Auto-populates real hotel rates and formatted dates
 * - Clear room counters and live cost calculations
 * - 1-Click instant save to Departure accommodation grid
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  MapPin,
  Hotel,
  CheckCircle2,
  Calendar,
  Bed,
  Users,
  X,
  Sparkles,
  Plus,
  Minus,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { opsService } from "@/services/ops.service";
import api from "@/services/api";
import { toast } from "sonner";
import {
  formatINR,
  getHotelEligibleDestinations,
  normalizeDestinationName,
  HotelEligibleDestination,
} from "@/utils/accommodationCalculator";

interface InitialDayInfo {
  dayNum?: number;
  dayLabel?: string;
  destination?: string;
  dateStr?: string;
  existingBooking?: any;
}

interface HotelAssignmentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  computedItinerary: any[];
  dbVendors: any[];
  tripId: string;
  departureDateStr: string;
  totalPax: number;
  initialDayInfo?: InitialDayInfo | null;
  onSaveSuccess: () => void;
}

function formatDateForInput(
  dateVal: any,
  fallbackDepartureDate?: string,
  dayOffset = 0,
): string {
  if (dateVal) {
    if (
      typeof dateVal === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())
    ) {
      return dateVal.trim();
    }
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  if (fallbackDepartureDate) {
    const parsed = new Date(fallbackDepartureDate);
    if (!isNaN(parsed.getTime())) {
      if (dayOffset > 0) {
        parsed.setDate(parsed.getDate() + dayOffset);
      }
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function extractHotelRates(hotelOrVendor: any) {
  let doubleRate = 1100;
  let tripleRate = 800;
  let quadRate = 800;
  let extraBedRate = 500;

  const v = hotelOrVendor?.vendorObj || hotelOrVendor;
  if (!v) return { doubleRate, tripleRate, quadRate, extraBedRate };

  const name = (v.name || v.hotelName || "").toLowerCase();

  if (name.includes("barpa")) {
    doubleRate = 1100;
    tripleRate = 800;
    quadRate = 800;
    extraBedRate = 500;
  } else if (name.includes("kasol")) {
    doubleRate = 1000;
    tripleRate = 800;
    quadRate = 800;
    extraBedRate = 500;
  } else if (name.includes("kullu") || name.includes("goti")) {
    doubleRate = 900;
    tripleRate = 700;
    quadRate = 700;
    extraBedRate = 400;
    if (name.includes("goti")) doubleRate = 750;
  } else if (v.doubleSharingRate || v.doubleRate || v.baseRate) {
    doubleRate =
      Number(v.doubleSharingRate || v.doubleRate || v.baseRate) || 1200;
    tripleRate =
      Number(v.tripleSharingRate || v.tripleRate) ||
      Math.round(doubleRate * 0.8);
    quadRate =
      Number(v.quadSharingRate || v.quadRate) || Math.round(doubleRate * 0.75);
    extraBedRate = Number(v.extraBedRate) || 500;
  }

  return { doubleRate, tripleRate, quadRate, extraBedRate };
}

export default function HotelAssignmentWizardModal({
  isOpen,
  onClose,
  computedItinerary,
  dbVendors,
  tripId,
  departureDateStr,
  totalPax,
  initialDayInfo,
  onSaveSuccess,
}: HotelAssignmentWizardModalProps) {
  // Selected values
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [selectedHotel, setSelectedHotel] = useState<any | null>(null);

  // Additional admin hotels loaded from API
  const [adminHotels, setAdminHotels] = useState<any[]>([]);

  // Stay configuration state
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [nightsCount, setNightsCount] = useState<number>(1);
  const [pricingMethod, setPricingMethod] = useState<
    "room-wise" | "per-person"
  >("room-wise");

  const [doubleRoomsCount, setDoubleRoomsCount] = useState<number>(1);
  const [tripleRoomsCount, setTripleRoomsCount] = useState<number>(0);
  const [quadRoomsCount, setQuadRoomsCount] = useState<number>(0);
  const [extraPersonsCount, setExtraPersonsCount] = useState<number>(0);

  const [doubleRate, setDoubleRate] = useState<number>(1100);
  const [tripleRate, setTripleRate] = useState<number>(800);
  const [quadRate, setQuadRate] = useState<number>(800);
  const [extraBedRate, setExtraBedRate] = useState<number>(500);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);

  const [remarks, setRemarks] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Current day number
  const currentDayNum = useMemo(() => {
    if (initialDayInfo?.dayNum) return initialDayInfo.dayNum;
    if (initialDayInfo?.dayLabel) {
      const parsed = parseInt(initialDayInfo.dayLabel.replace(/\D/g, ""), 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 1;
  }, [initialDayInfo]);

  // Fetch admin hotels when modal opens
  useEffect(() => {
    if (isOpen) {
      api
        .get("/admin/hotels")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setAdminHotels(res.data.data);
          }
        })
        .catch(() => null);
    }
  }, [isOpen]);

  // 1. Authoritative Destinations
  const hotelEligibleDestinations = useMemo(() => {
    if (!isOpen) return [];
    return getHotelEligibleDestinations(
      computedItinerary,
      currentDayNum,
      dbVendors,
    );
  }, [isOpen, computedItinerary, currentDayNum, dbVendors]);

  // Determine current day destination
  const currentDayDestination = useMemo<HotelEligibleDestination | null>(() => {
    const match = hotelEligibleDestinations.find((d) => d.isCurrentDay);
    if (match) return match;

    if (initialDayInfo?.destination) {
      const normInit = normalizeDestinationName(initialDayInfo.destination);
      return (
        hotelEligibleDestinations.find((d) => d.normalizedName === normInit) ||
        null
      );
    }

    return null;
  }, [hotelEligibleDestinations, initialDayInfo]);

  // Combine directory vendors & admin hotels into unified properties list
  const combinedHotelProperties = useMemo(() => {
    const list: any[] = [];
    const seenNames = new Set<string>();

    dbVendors.forEach((v: any) => {
      const name = v.name || v.hotelName || "";
      const city = v.city || v.location || "Manali";
      if (name && !seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        list.push({
          id: v.id,
          name,
          city,
          category: v.accommodationType || "Standard Hotel",
          rating: v.rating || "4.5 ★",
          phone: v.contactNumber || v.phone || "",
          vendorObj: v,
        });
      }
    });

    adminHotels.forEach((h: any) => {
      if (h.name && !seenNames.has(h.name.toLowerCase())) {
        seenNames.add(h.name.toLowerCase());
        list.push({
          id: h.id || `HTL-${list.length + 1}`,
          name: h.name,
          city: h.city || "Manali",
          category: h.category || "Deluxe Hotel",
          rating:
            typeof h.rating === "number"
              ? "★".repeat(h.rating)
              : h.rating || "4.5 ★",
          phone: h.phone || "",
          vendorObj: h,
        });
      }
    });

    return list;
  }, [dbVendors, adminHotels]);

  // Filter hotels for current destination or all
  const matchingHotels = useMemo(() => {
    if (!selectedDestination) return combinedHotelProperties;
    const normSelected = normalizeDestinationName(selectedDestination);

    const filtered = combinedHotelProperties.filter((h) => {
      const normCity = normalizeDestinationName(h.city || "");
      return normCity.includes(normSelected) || normSelected.includes(normCity);
    });

    return filtered.length > 0 ? filtered : combinedHotelProperties;
  }, [selectedDestination, combinedHotelProperties]);

  // Initialize state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const dayOffset = Math.max(0, currentDayNum - 1);
    const existingB = initialDayInfo?.existingBooking;

    // Set Destination
    let destName = "";
    if (currentDayDestination) {
      destName = currentDayDestination.name;
    } else if (initialDayInfo?.destination) {
      destName = initialDayInfo.destination;
    } else if (hotelEligibleDestinations.length > 0) {
      destName = hotelEligibleDestinations[0].name;
    } else {
      destName = "Manali";
    }
    setSelectedDestination(destName);

    // Initial check-in date (strictly formatted YYYY-MM-DD)
    const initCheckIn = formatDateForInput(
      existingB?.checkInDate ||
        existingB?.checkIn ||
        initialDayInfo?.dateStr ||
        currentDayDestination?.dateStr,
      departureDateStr,
      dayOffset,
    );
    setCheckInDate(initCheckIn);

    const n = existingB?.nightsCount || 1;
    setNightsCount(n);

    // Check-out date
    try {
      const d = new Date(initCheckIn);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + n);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dy = String(d.getDate()).padStart(2, "0");
        setCheckOutDate(`${y}-${m}-${dy}`);
      }
    } catch {
      setCheckOutDate(initCheckIn);
    }

    // Select Hotel Property
    if (
      existingB &&
      (existingB.hotelName || existingB.vendorName || existingB.hotel)
    ) {
      const hName =
        existingB.hotelName || existingB.hotel || existingB.vendorName || "";
      const matched = combinedHotelProperties.find(
        (h) => h.name.toLowerCase() === hName.toLowerCase(),
      );
      if (matched) {
        setSelectedHotel(matched);
        const rates = extractHotelRates(matched);
        setDoubleRate(existingB.doubleRate || rates.doubleRate);
        setTripleRate(existingB.tripleRate || rates.tripleRate);
        setQuadRate(existingB.quadRate || rates.quadRate);
        setExtraBedRate(existingB.extraBedRate || rates.extraBedRate);
      } else {
        const fallbackHotel = {
          id: existingB.id || `h-${Date.now()}`,
          name: hName,
          city: destName,
          category: "Standard Property",
          rating: "4.5 ★",
        };
        setSelectedHotel(fallbackHotel);
        setDoubleRate(existingB.doubleRate || 1100);
        setTripleRate(existingB.tripleRate || 800);
        setQuadRate(existingB.quadRate || 800);
        setExtraBedRate(existingB.extraBedRate || 500);
      }
    } else {
      // Pick first hotel matching destination
      const normDest = normalizeDestinationName(destName);
      const firstMatch =
        combinedHotelProperties.find((h) =>
          normalizeDestinationName(h.city).includes(normDest),
        ) || combinedHotelProperties[0];

      if (firstMatch) {
        setSelectedHotel(firstMatch);
        const rates = extractHotelRates(firstMatch);
        setDoubleRate(rates.doubleRate);
        setTripleRate(rates.tripleRate);
        setQuadRate(rates.quadRate);
        setExtraBedRate(rates.extraBedRate);
      }
    }

    // Room Allocation
    if (existingB) {
      setDoubleRoomsCount(
        existingB.doubleRoomsCount ??
          existingB.doubleRooms ??
          (totalPax > 0 ? Math.ceil(totalPax / 2) : 1),
      );
      setTripleRoomsCount(
        existingB.tripleRoomsCount ?? existingB.tripleRooms ?? 0,
      );
      setQuadRoomsCount(existingB.quadRoomsCount ?? existingB.quadRooms ?? 0);
      setExtraPersonsCount(
        existingB.extraPersonsCount ?? existingB.extraBeds ?? 0,
      );
      setRemarks(existingB.remarks || "");
    } else {
      const dRooms = totalPax > 0 ? Math.ceil(totalPax / 2) : 1;
      setDoubleRoomsCount(dRooms);
      setTripleRoomsCount(0);
      setQuadRoomsCount(0);
      setExtraPersonsCount(0);
      setRemarks("");
    }
  }, [
    isOpen,
    currentDayNum,
    currentDayDestination,
    hotelEligibleDestinations,
    initialDayInfo,
    departureDateStr,
    totalPax,
    combinedHotelProperties,
  ]);

  // Handle Hotel Selection change
  const handleSelectHotel = (hotel: any) => {
    setSelectedHotel(hotel);
    const rates = extractHotelRates(hotel);
    setDoubleRate(rates.doubleRate);
    setTripleRate(rates.tripleRate);
    setQuadRate(rates.quadRate);
    setExtraBedRate(rates.extraBedRate);
  };

  // Handle Nights change -> recalculate Check-Out Date
  const handleNightsChange = (nights: number) => {
    const validNights = Math.max(1, nights);
    setNightsCount(validNights);
    if (checkInDate) {
      try {
        const d = new Date(checkInDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + validNights);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const dy = String(d.getDate()).padStart(2, "0");
          setCheckOutDate(`${y}-${m}-${dy}`);
        }
      } catch {}
    }
  };

  // Total physical rooms calculation
  const totalPhysicalRooms =
    doubleRoomsCount + tripleRoomsCount + quadRoomsCount;

  // Pax capacity covered
  const paxCapacityCovered =
    doubleRoomsCount * 2 +
    tripleRoomsCount * 3 +
    quadRoomsCount * 4 +
    extraPersonsCount;

  // Live cost calculation
  const calculatedCosts = useMemo(() => {
    let preTax = 0;
    if (pricingMethod === "room-wise") {
      const doubleTotal = doubleRoomsCount * doubleRate * nightsCount;
      const tripleTotal = tripleRoomsCount * tripleRate * nightsCount;
      const quadTotal = quadRoomsCount * quadRate * nightsCount;
      const extraTotal = extraPersonsCount * extraBedRate * nightsCount;
      preTax = doubleTotal + tripleTotal + quadTotal + extraTotal;
    } else {
      // Per person
      const targetPax =
        totalPax > 0 ? totalPax : paxCapacityCovered > 0 ? paxCapacityCovered : 2;
      preTax = targetPax * doubleRate * nightsCount;
    }

    const taxAmount = (preTax * taxPercent) / 100;
    const grandTotal = preTax + taxAmount;
    const effectivePax = totalPax > 0 ? totalPax : paxCapacityCovered || 1;
    const costPerPaxStay = effectivePax > 0 ? grandTotal / effectivePax : grandTotal;
    const costPerPaxNight = nightsCount > 0 ? costPerPaxStay / nightsCount : costPerPaxStay;

    return {
      preTax,
      taxAmount,
      grandTotal,
      costPerPaxStay,
      costPerPaxNight,
    };
  }, [
    pricingMethod,
    doubleRoomsCount,
    tripleRoomsCount,
    quadRoomsCount,
    extraPersonsCount,
    doubleRate,
    tripleRate,
    quadRate,
    extraBedRate,
    nightsCount,
    totalPax,
    paxCapacityCovered,
    taxPercent,
  ]);

  // Save Stay Handler
  const handleSaveStayAssignment = async () => {
    if (!selectedHotel) {
      toast.error("Please select a hotel property");
      return;
    }
    if (!checkInDate) {
      toast.error("Please enter a valid Check-In Date");
      return;
    }

    setIsSaving(true);
    try {
      const realVendorId =
        selectedHotel?.vendorObj?.id &&
        !String(selectedHotel.vendorObj.id).startsWith("HTL-")
          ? selectedHotel.vendorObj.id
          : null;

      const payload = {
        hotelName: selectedHotel.name,
        location: selectedDestination || selectedHotel.city || "Manali",
        roomType: selectedHotel.category || "Standard Room",
        numberOfRooms: totalPhysicalRooms > 0 ? totalPhysicalRooms : 1,
        totalAmount: calculatedCosts.grandTotal,
        advancePaid: advancePaid || 0,
        confirmed: "CONFIRMED",
        pricingMethod,
        doubleRoomsCount,
        tripleRoomsCount,
        quadRoomsCount,
        extraPersonsCount,
        nightsCount,
        doubleRate,
        tripleRate,
        quadRate,
        extraBedRate,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        vendorId: realVendorId,
        notes: remarks || "",
      };

      await opsService.saveHotelBookings(tripId, departureDateStr, [payload]);
      toast.success(`Assigned ${selectedHotel.name} for ${selectedDestination}!`);
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save stay assignment:", err);
      toast.error(err.response?.data?.message || "Failed to save stay assignment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-6 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F97316]">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-800">
                  Hotel & Stay Assignment
                </h3>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  {initialDayInfo?.dayLabel || `Day ${currentDayNum}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Configure destination, stay dates, room allocation, and pricing
              </p>
            </div>
          </div>
          <span className="text-xs font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
            {totalPax > 0 ? `${totalPax} Confirmed Pax` : "2 Pax"}
          </span>
        </div>

        {/* Scrollable Body */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* SECTION 1: DESTINATION & HOTEL PICKER */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" /> Select Destination & Stay Location
              </label>
            </div>

            {/* Destination Chips */}
            <div className="flex flex-wrap gap-2">
              {hotelEligibleDestinations.map((dest) => {
                const isSelected =
                  normalizeDestinationName(selectedDestination) ===
                  dest.normalizedName;
                return (
                  <button
                    key={dest.normalizedName}
                    type="button"
                    onClick={() => {
                      setSelectedDestination(dest.name);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-[#F97316] text-white border-[#F97316] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100",
                    )}
                  >
                    <span>📍 {dest.name}</span>
                    {dest.isCurrentDay && (
                      <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded font-black">
                        Day {currentDayNum}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Hotel Cards / Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase">
                Select Hotel Property ({matchingHotels.length} Available in {selectedDestination || "Destination"})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {matchingHotels.map((h) => {
                  const isSelected = selectedHotel?.name === h.name;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleSelectHotel(h)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all flex items-center justify-between",
                        isSelected
                          ? "bg-orange-50/80 border-[#F97316] shadow-xs ring-1 ring-[#F97316]"
                          : "bg-white border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-xs text-slate-800 truncate">
                          {h.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{h.city || selectedDestination}</span>
                          <span>•</span>
                          <span className="text-amber-600 font-bold">{h.rating}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: DATES & NIGHTS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-1">
                Check In Date
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded-lg px-2.5 bg-white text-slate-800 shadow-2xs focus:border-[#F97316] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-1">
                Nights
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleNightsChange(n)}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-xs font-black transition-all border",
                      nightsCount === n
                        ? "bg-[#F97316] text-white border-[#F97316]"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    {n} {n === 1 ? "Night" : "Nights"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-1">
                Check Out Date
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded-lg px-2.5 bg-white text-slate-800 shadow-2xs focus:border-[#F97316] focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 3: ROOM ALLOCATION & RATES */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                  Physical Room Allocation & Rates
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Total {totalPhysicalRooms} Room{totalPhysicalRooms !== 1 ? "s" : ""} · Covering {paxCapacityCovered} Pax
                </span>
              </div>
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPricingMethod("room-wise")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-colors",
                    pricingMethod === "room-wise"
                      ? "bg-white text-slate-900 shadow-2xs font-black"
                      : "text-slate-500",
                  )}
                >
                  Per Physical Room
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMethod("per-person")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-colors",
                    pricingMethod === "per-person"
                      ? "bg-white text-slate-900 shadow-2xs font-black"
                      : "text-slate-500",
                  )}
                >
                  Per Person (Pax)
                </button>
              </div>
            </div>

            {/* Room Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Double Rooms */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-700">
                  <span>DOUBLE ROOM</span>
                  <span className="text-slate-400">2 Pax</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDoubleRoomsCount(Math.max(0, doubleRoomsCount - 1))}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={doubleRoomsCount}
                    onChange={(e) => setDoubleRoomsCount(Math.max(0, Number(e.target.value)))}
                    className="w-10 h-7 text-center text-xs font-black border border-slate-200 rounded bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setDoubleRoomsCount(doubleRoomsCount + 1)}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block">Rate (₹)</label>
                  <input
                    type="number"
                    value={doubleRate}
                    onChange={(e) => setDoubleRate(Number(e.target.value))}
                    className="w-full h-6 text-[11px] font-bold border border-slate-200 rounded px-1.5 bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Triple Rooms */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-700">
                  <span>TRIPLE ROOM</span>
                  <span className="text-slate-400">3 Pax</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTripleRoomsCount(Math.max(0, tripleRoomsCount - 1))}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={tripleRoomsCount}
                    onChange={(e) => setTripleRoomsCount(Math.max(0, Number(e.target.value)))}
                    className="w-10 h-7 text-center text-xs font-black border border-slate-200 rounded bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setTripleRoomsCount(tripleRoomsCount + 1)}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block">Rate (₹)</label>
                  <input
                    type="number"
                    value={tripleRate}
                    onChange={(e) => setTripleRate(Number(e.target.value))}
                    className="w-full h-6 text-[11px] font-bold border border-slate-200 rounded px-1.5 bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Quad Rooms */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-700">
                  <span>QUAD ROOM</span>
                  <span className="text-slate-400">4 Pax</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuadRoomsCount(Math.max(0, quadRoomsCount - 1))}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={quadRoomsCount}
                    onChange={(e) => setQuadRoomsCount(Math.max(0, Number(e.target.value)))}
                    className="w-10 h-7 text-center text-xs font-black border border-slate-200 rounded bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setQuadRoomsCount(quadRoomsCount + 1)}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block">Rate (₹)</label>
                  <input
                    type="number"
                    value={quadRate}
                    onChange={(e) => setQuadRate(Number(e.target.value))}
                    className="w-full h-6 text-[11px] font-bold border border-slate-200 rounded px-1.5 bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Extra Pax / Mattress */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-700">
                  <span>EXTRA MATTRESS</span>
                  <span className="text-slate-400">+1 Pax</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExtraPersonsCount(Math.max(0, extraPersonsCount - 1))}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={extraPersonsCount}
                    onChange={(e) => setExtraPersonsCount(Math.max(0, Number(e.target.value)))}
                    className="w-10 h-7 text-center text-xs font-black border border-slate-200 rounded bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setExtraPersonsCount(extraPersonsCount + 1)}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block">Rate (₹)</label>
                  <input
                    type="number"
                    value={extraBedRate}
                    onChange={(e) => setExtraBedRate(Number(e.target.value))}
                    className="w-full h-6 text-[11px] font-bold border border-slate-200 rounded px-1.5 bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: LIVE COST CALCULATION CARD */}
          <div className="bg-[#FFF7ED] border border-[#F97316]/30 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Total Stay Cost ({nightsCount} {nightsCount === 1 ? "night" : "nights"})</span>
              <span>{formatINR(calculatedCosts.preTax)}</span>
            </div>
            <div className="flex justify-between items-baseline border-t border-[#F97316]/20 pt-2">
              <div>
                <span className="text-sm font-black text-slate-900 block">Grand Total</span>
                <span className="text-[11px] font-extrabold text-emerald-700">
                  {formatINR(calculatedCosts.costPerPaxStay, 2)} per pax for stay
                </span>
              </div>
              <span className="text-xl font-black text-[#F97316]">
                {formatINR(calculatedCosts.grandTotal)}
              </span>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Remarks / Special Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Early check-in requested, MAP meal plan, high floor rooms"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-8 text-xs font-medium border border-slate-200 rounded-lg px-2.5 bg-white text-slate-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving || !selectedHotel}
            onClick={handleSaveStayAssignment}
            className="h-9 px-6 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] disabled:bg-slate-300 text-white rounded-lg shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSaving ? "Saving Stay..." : "Save Stay Assignment"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
