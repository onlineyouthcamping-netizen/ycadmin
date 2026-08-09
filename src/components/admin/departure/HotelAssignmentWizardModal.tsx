/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * HotelAssignmentWizardModal — YouthCamping Admin
 *
 * 4-Step Hotel & Stay Assignment Flow:
 *   Step 1: Choose Destination (from current trip's structured stay locations ONLY)
 *   Step 2: Select Hotel Property (filtered strictly to selected destination)
 *   Step 3: Choose Vendor Contract (contracts for selected hotel)
 *   Step 4: Configure Stay, Room Allocation & Pricing
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  MapPin,
  Hotel,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Bed,
  Users,
  X,
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected values
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [hotelSearchQuery, setHotelSearchQuery] = useState<string>("");
  const [selectedHotel, setSelectedHotel] = useState<any | null>(null);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);

  // Additional admin/mock hotels loaded from API
  const [adminHotels, setAdminHotels] = useState<any[]>([]);

  // Stay configuration state
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [nightsCount, setNightsCount] = useState<number>(1);
  const [pricingMethod, setPricingMethod] = useState<"room-wise" | "per-person">("room-wise");

  const [doubleRoomsCount, setDoubleRoomsCount] = useState<number>(0);
  const [tripleRoomsCount, setTripleRoomsCount] = useState<number>(0);
  const [quadRoomsCount, setQuadRoomsCount] = useState<number>(0);
  const [extraPersonsCount, setExtraPersonsCount] = useState<number>(0);

  const [doubleRate, setDoubleRate] = useState<number>(3000);
  const [tripleRate, setTripleRate] = useState<number>(3800);
  const [quadRate, setQuadRate] = useState<number>(4500);
  const [extraBedRate, setExtraBedRate] = useState<number>(800);
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
    return undefined;
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

  // ── 1. AUTHORITATIVE HOTEL-ELIGIBLE STAY DESTINATIONS ──
  const hotelEligibleDestinations = useMemo(() => {
    if (!isOpen) return [];
    return getHotelEligibleDestinations(
      computedItinerary,
      currentDayNum,
      dbVendors
    );
  }, [isOpen, computedItinerary, currentDayNum, dbVendors]);

  // Determine current day destination
  const currentDayDestination = useMemo<HotelEligibleDestination | null>(() => {
    const match = hotelEligibleDestinations.find((d) => d.isCurrentDay);
    if (match) return match;

    if (initialDayInfo?.destination) {
      const normInit = normalizeDestinationName(initialDayInfo.destination);
      return hotelEligibleDestinations.find((d) => d.normalizedName === normInit) || null;
    }

    return null;
  }, [hotelEligibleDestinations, initialDayInfo]);

  // Reset/Initialize state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setHotelSearchQuery("");

    const existingB = initialDayInfo?.existingBooking;
    if (existingB && (existingB.hotelName || existingB.vendorName || existingB.hotel)) {
      const hName = existingB.hotelName || existingB.hotel || existingB.vendorName || "";
      setSelectedHotel({
        id: existingB.id || `hotel-${hName}`,
        name: hName,
        location: existingB.location || initialDayInfo?.destination || "",
        category: existingB.category || "3 Star",
        doubleRate: existingB.doubleRate || 3000,
        tripleRate: existingB.tripleRate || 3800,
        quadRate: existingB.quadRate || 4500,
      });
      setSelectedContract({
        vendorName: existingB.vendorName || existingB.supplierName || "Direct Hotel Vendor",
        doubleRate: existingB.doubleRate || 3000,
        tripleRate: existingB.tripleRate || 3800,
        quadRate: existingB.quadRate || 4500,
        extraBedRate: existingB.extraBedRate || 800,
      });
    } else {
      setSelectedHotel(null);
      setSelectedContract(null);
    }

    // Preselect current day destination or first eligible destination
    if (currentDayDestination) {
      setSelectedDestination(currentDayDestination.name);
    } else if (initialDayInfo?.destination) {
      setSelectedDestination(normalizeDestinationName(initialDayInfo.destination));
    } else if (hotelEligibleDestinations.length > 0) {
      setSelectedDestination(hotelEligibleDestinations[0].name);
    } else {
      setSelectedDestination("");
    }

    // Initial check-in date
    const firstEligibleDate = hotelEligibleDestinations.find((d) => d.dateStr)?.dateStr;
    const initCheckIn = existingB?.checkInDate || existingB?.checkIn || initialDayInfo?.dateStr || currentDayDestination?.dateStr || firstEligibleDate || departureDateStr || "";
    setCheckInDate(initCheckIn);
    setNightsCount(existingB?.nightsCount || 1);

    if (initCheckIn) {
      try {
        const d = new Date(initCheckIn);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + (existingB?.nightsCount || 1));
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const dy = String(d.getDate()).padStart(2, "0");
          setCheckOutDate(`${y}-${m}-${dy}`);
        }
      } catch {
        setCheckOutDate("");
      }
    }

    // Populate room allocation based on existing booking or totalPax fallback
    if (existingB) {
      setDoubleRoomsCount(existingB.doubleRoomsCount ?? existingB.doubleRooms ?? (totalPax > 0 ? Math.ceil(totalPax / 2) : 1));
      setTripleRoomsCount(existingB.tripleRoomsCount ?? existingB.tripleRooms ?? 0);
      setQuadRoomsCount(existingB.quadRoomsCount ?? existingB.quadRooms ?? 0);
      setExtraPersonsCount(existingB.extraPersonsCount ?? existingB.extraBeds ?? 0);
      setDoubleRate(existingB.doubleRate || 3000);
      setTripleRate(existingB.tripleRate || 3800);
      setQuadRate(existingB.quadRate || 4500);
      setExtraBedRate(existingB.extraBedRate || 800);
      setRemarks(existingB.remarks || "");
    } else if (totalPax > 0) {
      const dRooms = Math.ceil(totalPax / 2);
      setDoubleRoomsCount(dRooms);
      setTripleRoomsCount(0);
      setQuadRoomsCount(0);
      setExtraPersonsCount(0);
    } else {
      setDoubleRoomsCount(1);
      setTripleRoomsCount(0);
      setQuadRoomsCount(0);
      setExtraPersonsCount(0);
    }
  }, [isOpen, currentDayDestination, hotelEligibleDestinations, initialDayInfo, departureDateStr, totalPax]);

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
      } catch {
        /* ignore invalid date */
      }
    }
  };

  // Combine directory vendors & admin hotels into unified properties list
  const combinedHotelProperties = useMemo(() => {
    const list: any[] = [];
    const seenNames = new Set<string>();

    // 1. Directory vendors (from DB)
    dbVendors.forEach((v: any) => {
      const name = v.name || v.hotelName || "";
      const city = v.city || v.location || "";
      if (name && !seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        list.push({
          id: v.id,
          name,
          city,
          category: v.accommodationType || "Standard",
          rating: v.rating || "★★★★",
          vendorObj: v,
          contracts: v.contracts || [
            {
              id: `VND-${v.id}`,
              name: v.contactPerson ? `${v.name} (${v.contactPerson})` : `${v.name} Direct`,
              rate: 3200,
              terms: "100% at Check-in",
              default: true,
              outstanding: 0,
            },
          ],
        });
      }
    });

    // 2. Admin hotels (from /admin/hotels endpoint)
    adminHotels.forEach((h: any) => {
      if (h.name && !seenNames.has(h.name.toLowerCase())) {
        seenNames.add(h.name.toLowerCase());
        list.push({
          id: h.id || `HTL-${list.length + 1}`,
          name: h.name,
          city: h.city || "Manali",
          category: h.category || "Deluxe",
          rating: typeof h.rating === "number" ? "★".repeat(h.rating) : h.rating || "★★★★",
          vendorObj: h,
          contracts: [
            {
              id: `VND-${h.id || Date.now()}`,
              name: `${h.name} Direct Contract`,
              rate: 3500,
              terms: "50% Advance, 50% Post-Trip",
              default: true,
              outstanding: 0,
            },
          ],
        });
      }
    });

    return list;
  }, [dbVendors, adminHotels]);

  // ── 2. FILTERED HOTELS FOR STEP 2 ──
  const matchingHotelsForSelectedDest = useMemo(() => {
    if (!selectedDestination) return [];
    const normSelected = normalizeDestinationName(selectedDestination);

    let filtered = combinedHotelProperties.filter((h) => {
      const normCity = normalizeDestinationName(
        h.city || h.vendorObj?.city || h.vendorObj?.location || ""
      );
      return normCity.includes(normSelected) || normSelected.includes(normCity);
    });

    if (hotelSearchQuery.trim()) {
      const q = hotelSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (h) => h.name.toLowerCase().includes(q) || h.category.toLowerCase().includes(q)
      );
    }

    // Development logging as specified in requirement #19
    console.log("[HotelWizard] selected destination:", selectedDestination);
    console.log("[HotelWizard] filtered hotels:", filtered);

    return filtered;
  }, [selectedDestination, combinedHotelProperties, hotelSearchQuery]);

  // Total physical rooms calculation
  const totalPhysicalRooms = doubleRoomsCount + tripleRoomsCount + quadRoomsCount;

  // Effective Pax calculation
  const effectivePax = useMemo(() => {
    if (totalPax > 0) return totalPax;
    return doubleRoomsCount * 2 + tripleRoomsCount * 3 + quadRoomsCount * 4 + extraPersonsCount;
  }, [totalPax, doubleRoomsCount, tripleRoomsCount, quadRoomsCount, extraPersonsCount]);

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
      const targetPax = effectivePax > 0 ? effectivePax : 1;
      preTax = targetPax * doubleRate * nightsCount;
    }

    const taxAmount = (preTax * taxPercent) / 100;
    const grandTotal = preTax + taxAmount;
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
    effectivePax,
    taxPercent,
  ]);

  // Save handler
  const handleSaveStayAssignment = async () => {
    if (!selectedHotel) {
      toast.error("Please select a hotel property");
      return;
    }

    setIsSaving(true);
    try {
      const realVendorId =
        selectedContract?.vendorId ||
        (selectedHotel?.vendorObj?.id && !String(selectedHotel.vendorObj.id).startsWith("HTL-")
          ? selectedHotel.vendorObj.id
          : null);

      const payload = {
        hotelName: selectedHotel.name,
        location: selectedDestination, // AUTHORITATIVE SELECTED DESTINATION
        roomType: selectedHotel.category ? `${selectedHotel.category} Room` : "Standard Room",
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
      toast.success(`Assigned ${selectedHotel.name} in ${selectedDestination}!`);
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
      <DialogContent className="max-w-2xl bg-white p-6 rounded-[12px] shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-800">
              Add Hotel & Stay Assignment
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {initialDayInfo?.dayLabel ? `${initialDayInfo.dayLabel} · ` : ""}
              Step {step} of 4:{" "}
              {step === 1
                ? "Choose Destination"
                : step === 2
                  ? `Select Hotel in ${selectedDestination || "Destination"}`
                  : step === 3
                    ? "Choose Vendor Contract"
                    : "Configure Stay & Pricing"}
            </p>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "w-6 h-1.5 rounded-full transition-all",
                  step === s
                    ? "bg-[#F97316]"
                    : step > s
                      ? "bg-emerald-500"
                      : "bg-slate-200"
                )}
              />
            ))}
          </div>
        </div>

        <div className="py-4">
          {/* ──────────────── STEP 1: CHOOSE DESTINATION ──────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">
                  Select destination for this stay:
                </p>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  From Current Trip Stay Locations
                </span>
              </div>

              {hotelEligibleDestinations.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center space-y-2">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-black text-slate-700">
                    No stay destinations found
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto font-medium">
                    The current trip itinerary does not contain any configured accommodation locations.
                  </p>
                </div>
              ) : (
                <>
                  {/* Recommended for current day */}
                  {currentDayDestination && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                        RECOMMENDED FOR DAY {currentDayNum || initialDayInfo?.dayLabel?.replace(/\D/g, "") || "3"}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDestination(currentDayDestination.name);
                          setStep(2);
                        }}
                        className={cn(
                          "w-full p-4 rounded-[8px] border text-left font-black transition-all flex items-center justify-between",
                          normalizeDestinationName(selectedDestination) === currentDayDestination.normalizedName
                            ? "bg-[#FFF7ED] border-[#F97316] text-[#F97316] shadow-xs"
                            : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black">📍 {currentDayDestination.name}</span>
                            <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200 uppercase">
                              Day {currentDayDestination.sourceDayNumbers.join(", ")} Destination
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">
                            {currentDayDestination.hotelCount} Hotel{currentDayDestination.hotelCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-orange-500 text-white">
                          Selected ✓
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Other trip destinations */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      OTHER TRIP DESTINATIONS
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {hotelEligibleDestinations
                        .filter(
                          (d) => d.normalizedName !== currentDayDestination?.normalizedName
                        )
                        .map((dest) => (
                          <button
                            key={dest.normalizedName}
                            type="button"
                            onClick={() => {
                              setSelectedDestination(dest.name);
                              setStep(2);
                            }}
                            className={cn(
                              "p-3.5 rounded-[8px] border text-left font-black transition-all flex items-center justify-between",
                              normalizeDestinationName(selectedDestination) === dest.normalizedName
                                ? "bg-[#FFF7ED] border-[#F97316] text-[#F97316] shadow-xs"
                                : "bg-white border-slate-200 text-slate-750 hover:bg-slate-50"
                            )}
                          >
                            <div>
                              <span className="text-xs font-black block">📍 {dest.name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {dest.hotelCount} Hotel{dest.hotelCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ──────────────── STEP 2: SELECT HOTEL PROPERTY ──────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Select hotel in{" "}
                    <span className="text-[#F97316] font-black">
                      {selectedDestination}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline mt-0.5"
                  >
                    ← Change Destination
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toast.success("Opening Add Hotel Property form")}
                  className="text-[11px] font-bold text-[#F97316] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New Hotel
                </button>
              </div>

              {/* Search input inside selected destination */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={`Search ${selectedDestination} hotels...`}
                  value={hotelSearchQuery}
                  onChange={(e) => setHotelSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs font-medium border border-slate-200 rounded-md bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              {/* Matching hotels list */}
              {matchingHotelsForSelectedDest.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center space-y-2">
                  <Hotel className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-black text-slate-700">
                    No hotels available in {selectedDestination}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto font-medium">
                    This destination currently has no hotel properties configured for this trip.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      toast.success(`Creating hotel for ${selectedDestination}`)
                    }
                    className="h-8 px-4 bg-[#F97316] hover:bg-[#E05E00] text-white text-xs font-bold rounded shadow-xs mt-2"
                  >
                    + Add Property to {selectedDestination}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {matchingHotelsForSelectedDest.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => {
                        setSelectedHotel(h);
                        setDoubleRate(h.vendorObj?.doubleRate || 3000);
                        setTripleRate(h.vendorObj?.tripleRate || 3800);
                        setQuadRate(h.vendorObj?.quadRate || 4500);
                        setStep(3);
                      }}
                      className={cn(
                        "p-3.5 rounded-[8px] border cursor-pointer transition-all flex items-center justify-between",
                        selectedHotel?.id === h.id
                          ? "bg-[#FFF7ED] border-[#F97316] shadow-xxs"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-800">{h.name}</p>
                          <span className="text-amber-400 text-xs font-normal">
                            {h.rating}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {h.city} • {h.category} Property
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-orange-500 hover:text-white transition-colors">
                        Select →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──────────────── STEP 3: CHOOSE VENDOR CONTRACT ──────────────── */}
          {step === 3 && selectedHotel && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-700">
                  Choose Vendor Contract for{" "}
                  <span className="text-[#F97316] font-black">
                    {selectedHotel.name}
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Select negotiated vendor terms for {selectedDestination}
                </p>
              </div>

              <div className="space-y-2.5">
                {(selectedHotel.contracts || []).map((v: any) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedContract(v);
                      if (v.rate) setDoubleRate(v.rate);
                      setStep(4);
                    }}
                    className={cn(
                      "p-4 rounded-[8px] border cursor-pointer transition-all flex items-center justify-between",
                      selectedContract?.id === v.id
                        ? "bg-[#FFF7ED] border-[#F97316] shadow-xxs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-800">{v.name}</p>
                        {v.default && (
                          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded">
                            Default Vendor
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Payment Terms: {v.terms}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800">
                        {formatINR(v.rate || 3200)}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Negotiated Rate / Night
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──────────────── STEP 4: CONFIGURE STAY & PRICING ──────────────── */}
          {step === 4 && selectedHotel && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Hotel summary header */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-black text-slate-800">{selectedHotel.name}</span>
                  <span className="text-slate-400 font-medium block text-[10px]">
                    {selectedDestination} · {selectedHotel.category} Property
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  {totalPax > 0 ? `${totalPax} Confirmed Pax` : `${effectivePax} Estimated Pax`}
                </span>
              </div>

              {/* Stay Dates */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Check In
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Nights
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={nightsCount}
                    onChange={(e) => handleNightsChange(Number(e.target.value))}
                    className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Check Out
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                  />
                </div>
              </div>

              {/* Physical Room Allocation */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">
                    Physical Room Allocation
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    Total: {totalPhysicalRooms} Room{totalPhysicalRooms !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                      Double Rooms
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={doubleRoomsCount}
                      onChange={(e) => setDoubleRoomsCount(Math.max(0, Number(e.target.value)))}
                      className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                      Triple Rooms
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={tripleRoomsCount}
                      onChange={(e) => setTripleRoomsCount(Math.max(0, Number(e.target.value)))}
                      className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                      Quad Rooms
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={quadRoomsCount}
                      onChange={(e) => setQuadRoomsCount(Math.max(0, Number(e.target.value)))}
                      className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                      Extra Pax
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={extraPersonsCount}
                      onChange={(e) => setExtraPersonsCount(Math.max(0, Number(e.target.value)))}
                      className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Method & Rates */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">
                    Pricing Method & Rates
                  </span>
                  <div className="flex bg-slate-100 p-0.5 rounded text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPricingMethod("room-wise")}
                      className={cn(
                        "px-2.5 py-0.5 rounded transition-colors",
                        pricingMethod === "room-wise"
                          ? "bg-white text-slate-900 shadow-xs font-black"
                          : "text-slate-500"
                      )}
                    >
                      Per Physical Room
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMethod("per-person")}
                      className={cn(
                        "px-2.5 py-0.5 rounded transition-colors",
                        pricingMethod === "per-person"
                          ? "bg-white text-slate-900 shadow-xs font-black"
                          : "text-slate-500"
                      )}
                    >
                      Per Person (Pax)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                      Double Rate (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={doubleRate}
                      onChange={(e) => setDoubleRate(Number(e.target.value))}
                      className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                      Triple Rate (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={tripleRate}
                      onChange={(e) => setTripleRate(Number(e.target.value))}
                      className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                      Quad Rate (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={quadRate}
                      onChange={(e) => setQuadRate(Number(e.target.value))}
                      className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                      GST Tax (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={28}
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Number(e.target.value))}
                      className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Total Summary Box */}
              <div className="bg-[#FFF7ED] border border-[#F97316]/30 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Pre-Tax Total</span>
                  <span>{formatINR(calculatedCosts.preTax)}</span>
                </div>
                {taxPercent > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>GST ({taxPercent}%)</span>
                    <span>{formatINR(calculatedCosts.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline border-t border-[#F97316]/20 pt-1.5 mt-1">
                  <span className="text-xs font-black text-slate-900">Grand Total</span>
                  <span className="text-base font-black text-[#F97316]">
                    {formatINR(calculatedCosts.grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-[11px] font-extrabold text-emerald-700 pt-0.5">
                  <span>Cost / Pax / Stay ({nightsCount} nights)</span>
                  <span>{formatINR(calculatedCosts.costPerPaxStay, 2)}</span>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Remarks / Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Early check-in requested, MAP meal plan"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full h-8 text-xs font-medium border border-slate-200 rounded px-2.5 bg-white text-slate-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="h-8 px-4 text-xs font-bold border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 text-xs font-bold border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            {step < 4 ? (
              <button
                type="button"
                disabled={step === 2 && !selectedHotel}
                onClick={() => {
                  if (step === 1 && !selectedDestination) {
                    toast.error("Please select a destination first");
                    return;
                  }
                  setStep((prev) => (prev + 1) as any);
                }}
                className="h-8 px-4 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] disabled:bg-slate-300 text-white rounded shadow-xs"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveStayAssignment}
                className="h-8 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSaving ? "Saving..." : "Save Stay Assignment"}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
