/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * HotelAssignmentWizardModal — YouthCamping Admin
 *
 * Fast 10-15 Second Operational Room & Per Person Hotel Assignment Screen:
 * - Room & Capacity allocation (Double, Triple, Quad, Extra Bed)
 * - 100% Synced with Database, Room & Tempo Allocation Engine, & Ops Vendor Ledger
 * - Pure Per-Person rate calculation
 * - Instant 1-Click Save
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  Hotel,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { opsService } from "@/services/ops.service";
import { resolveCityForItineraryDay } from "@/utils/accommodationCalculator";
import api from "@/services/api";
import { toast } from "sonner";
import {
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
  dayOffset = 0
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

/** Add N nights to a YYYY-MM-DD string, return YYYY-MM-DD (timezone-safe) */
function addNightsToDate(dateStr: string, nights: number): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + nights));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function extractHotelRates(hotelOrVendor: any, destinationCity?: string) {
  const v = hotelOrVendor?.vendorObj || hotelOrVendor || {};
  const name = (v.name || v.hotelName || hotelOrVendor?.name || "").toLowerCase();
  const city = (destinationCity || v.city || v.location || hotelOrVendor?.city || "").toLowerCase();
  const category = (v.category || v.accommodationType || hotelOrVendor?.category || "").toLowerCase();

  // 0. Extract rates from roomRates, vendorRooms, or rooms list if present
  const roomRatesList = Array.isArray(v.roomRates)
    ? v.roomRates
    : Array.isArray(v.vendorRooms)
      ? v.vendorRooms
      : Array.isArray(v.rooms)
        ? v.rooms
        : [];

  if (roomRatesList.length > 0) {
    let d = 0,
      t = 0,
      q = 0,
      ex = 0;
    for (const r of roomRatesList) {
      let extra: any = {};
      try {
        if (r.notes && typeof r.notes === "string") extra = JSON.parse(r.notes);
        else if (r.notes && typeof r.notes === "object") extra = r.notes;
      } catch {}

      const type = String(r.sharingType || r.roomType || r.category || "").toUpperCase();
      const amt = Number(r.amount || extra.doubleRate || r.doubleRate || r.baseRate || r.base || 0);

      if (type.includes("DOUBLE") || type.includes("TWIN") || type.includes("2")) {
        if (amt > 0 && (!d || amt < d)) d = amt;
      } else if (type.includes("TRIPLE") || type.includes("3")) {
        if (amt > 0 && (!t || amt < t)) t = amt;
      } else if (type.includes("QUAD") || type.includes("4")) {
        if (amt > 0 && (!q || amt < q)) q = amt;
      } else if (type.includes("EXTRA") || type.includes("BED") || type.includes("MATTRESS")) {
        if (amt > 0 && (!ex || amt < ex)) ex = amt;
      }

      const doubleVal = Number(extra.doubleRate ?? r.doubleRate ?? r.baseRate ?? r.base ?? 0);
      const tripleVal = Number(extra.tripleRate ?? r.tripleRate ?? r.extraMattressRate ?? 0);
      const quadVal = Number(extra.quadRate ?? r.quadRate ?? 0);
      const extraBedVal = Number(extra.extraBedRate ?? r.extraMattressRate ?? 0);

      if (doubleVal > 0 && (!d || doubleVal < d)) d = doubleVal;
      if (tripleVal > 0 && (!t || tripleVal < t)) t = tripleVal;
      if (quadVal > 0 && (!q || quadVal < q)) q = quadVal;
      if (extraBedVal > 0 && (!ex || extraBedVal < ex)) ex = extraBedVal;
    }

    if (d > 0 || t > 0 || q > 0) {
      return {
        doubleRate: d > 0 ? d : 1100,
        tripleRate: t > 0 ? t : (q > 0 ? q : Math.round((d || 1100) * 0.8)),
        quadRate: q > 0 ? q : (t > 0 ? t : Math.round((d || 1100) * 0.7)),
        extraBedRate: ex > 0 ? ex : Math.round((d || 1100) * 0.5),
      };
    }
  }

  // 0.5 Extract from seasonalRates array if present
  const seasonalList = Array.isArray(v.seasonalRates)
    ? v.seasonalRates
    : Array.isArray(v.seasons)
      ? v.seasons
      : [];
  if (seasonalList.length > 0) {
    const s = seasonalList[0];
    const twinVal = Number(s.twinRate ?? s.twin ?? 0);
    const tripleVal = Number(s.tripleRate ?? s.triple ?? 0);
    const quadVal = Number(s.quadRate ?? s.quad ?? 0);

    if (twinVal > 0) {
      return {
        doubleRate: twinVal,
        tripleRate: tripleVal > 0 ? tripleVal : Math.round(twinVal * 0.8),
        quadRate: quadVal > 0 ? quadVal : Math.round(twinVal * 0.7),
        extraBedRate: Math.round(twinVal * 0.4),
      };
    }
  }

  // 1. Direct object rate extraction if present
  const dRate = Number(
    v.doubleSharingRate ||
      v.doubleRate ||
      v.double ||
      v.baseRate ||
      v.rate ||
      v.rates?.double ||
      v.pricing?.doubleRate,
  );
  const tRate = Number(
    v.tripleSharingRate ||
      v.tripleRate ||
      v.triple ||
      v.rates?.triple ||
      v.pricing?.tripleRate,
  );
  const qRate = Number(
    v.quadSharingRate ||
      v.quadRate ||
      v.quad ||
      v.rates?.quad ||
      v.pricing?.quadRate,
  );
  const exRate = Number(
    v.extraBedRate ||
      v.extraBed ||
      v.extraPax ||
      v.rates?.extraBed ||
      v.pricing?.extraBedRate,
  );

  if (dRate && !isNaN(dRate) && dRate > 0) {
    return {
      doubleRate: dRate,
      tripleRate:
        tRate && !isNaN(tRate) && tRate > 0 ? tRate : Math.round(dRate * 0.75),
      quadRate:
        qRate && !isNaN(qRate) && qRate > 0 ? qRate : Math.round(dRate * 0.65),
      extraBedRate:
        exRate && !isNaN(exRate) && exRate > 0
          ? exRate
          : Math.round(dRate * 0.4),
    };
  }

  // 2. Hotel Category / Tier based dynamic rates
  if (
    category.includes("5") ||
    category.includes("luxury") ||
    name.includes("resort") ||
    name.includes("palace") ||
    name.includes("grand")
  ) {
    return {
      doubleRate: 2200,
      tripleRate: 1600,
      quadRate: 1400,
      extraBedRate: 800,
    };
  }
  if (
    category.includes("4") ||
    category.includes("deluxe") ||
    name.includes("vista") ||
    name.includes("heights") ||
    name.includes("view")
  ) {
    return {
      doubleRate: 1500,
      tripleRate: 1100,
      quadRate: 950,
      extraBedRate: 600,
    };
  }
  if (
    category.includes("camp") ||
    category.includes("tent") ||
    name.includes("camp") ||
    name.includes("homestay")
  ) {
    return {
      doubleRate: 900,
      tripleRate: 700,
      quadRate: 650,
      extraBedRate: 400,
    };
  }

  // 3. City / Destination dynamic rate presets
  if (city.includes("shimla")) {
    if (name.includes("mountain") || name.includes("vista"))
      return {
        doubleRate: 1400,
        tripleRate: 1000,
        quadRate: 850,
        extraBedRate: 550,
      };
    return {
      doubleRate: 1500,
      tripleRate: 1100,
      quadRate: 950,
      extraBedRate: 600,
    };
  }
  if (city.includes("amritsar")) {
    return {
      doubleRate: 1300,
      tripleRate: 950,
      quadRate: 850,
      extraBedRate: 500,
    };
  }
  if (city.includes("kasol") || city.includes("jibhi")) {
    return {
      doubleRate: 1200,
      tripleRate: 900,
      quadRate: 800,
      extraBedRate: 500,
    };
  }
  if (city.includes("kullu")) {
    return {
      doubleRate: 950,
      tripleRate: 750,
      quadRate: 700,
      extraBedRate: 400,
    };
  }
  if (city.includes("dharamshala") || city.includes("mcleodganj")) {
    return {
      doubleRate: 1350,
      tripleRate: 1000,
      quadRate: 850,
      extraBedRate: 500,
    };
  }
  if (city.includes("chandigarh") || city.includes("delhi")) {
    return {
      doubleRate: 1600,
      tripleRate: 1200,
      quadRate: 1000,
      extraBedRate: 650,
    };
  }
  if (name.includes("barpa")) {
    return {
      doubleRate: 1100,
      tripleRate: 800,
      quadRate: 800,
      extraBedRate: 500,
    };
  }

  // 4. Default fallback
  return {
    doubleRate: 1100,
    tripleRate: 800,
    quadRate: 800,
    extraBedRate: 500,
  };
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
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [selectedHotel, setSelectedHotel] = useState<any | null>(null);
  const [adminHotels, setAdminHotels] = useState<any[]>([]);

  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [nightsCount, setNightsCount] = useState<number>(1);

  // Room counts for physical database & room allocation engine sync
  const [doubleRoomsCount, setDoubleRoomsCount] = useState<number>(0);
  const [tripleRoomsCount, setTripleRoomsCount] = useState<number>(0);
  const [quadRoomsCount, setQuadRoomsCount] = useState<number>(0);
  const [extraPersonsCount, setExtraPersonsCount] = useState<number>(0);

  // Per Person Rates
  const [doubleRate, setDoubleRate] = useState<number>(1100);
  const [tripleRate, setTripleRate] = useState<number>(800);
  const [quadRate, setQuadRate] = useState<number>(800);
  const [extraBedRate, setExtraBedRate] = useState<number>(500);

  const [remarks, setRemarks] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const currentDayNum = useMemo(() => {
    if (initialDayInfo?.dayNum) return initialDayInfo.dayNum;
    if (initialDayInfo?.dayLabel) {
      const parsed = parseInt(initialDayInfo.dayLabel.replace(/\D/g, ""), 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 1;
  }, [initialDayInfo]);

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

  const hotelEligibleDestinations = useMemo(() => {
    if (!isOpen) return [];
    return getHotelEligibleDestinations(computedItinerary, currentDayNum, dbVendors);
  }, [isOpen, computedItinerary, currentDayNum, dbVendors]);

  const currentDayDestination = useMemo<HotelEligibleDestination | null>(() => {
    const match = hotelEligibleDestinations.find((d) => d.isCurrentDay);
    if (match) return match;
    if (initialDayInfo?.destination) {
      const normInit = normalizeDestinationName(initialDayInfo.destination);
      return hotelEligibleDestinations.find((d) => d.normalizedName === normInit) || null;
    }
    return null;
  }, [hotelEligibleDestinations, initialDayInfo]);

  const currentDayItineraryDate = useMemo(() => {
    const match = computedItinerary.find((day: any) => {
      const d = typeof day?.day === "number" ? day.day : parseInt(String(day?.day ?? "").replace(/\D/g, ""), 10) || 0;
      return d === currentDayNum;
    }) || computedItinerary[0];
    return match?.dateStr || match?.date || undefined;
  }, [computedItinerary, currentDayNum]);

  const combinedHotelProperties = useMemo(() => {
    const list: any[] = [];
    const seenNames = new Set<string>();

    dbVendors.forEach((v: any) => {
      const name = v.name || v.hotelName || "";
      const city = v.city || v.location || "";
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

    if (list.length === 0) {
      adminHotels.forEach((h: any) => {
        if (h.name && !seenNames.has(h.name.toLowerCase())) {
          seenNames.add(h.name.toLowerCase());
          list.push({
            id: h.id || `HTL-${list.length + 1}`,
            name: h.name,
            city: h.city || "Manali",
            category: h.category || "Deluxe Hotel",
            rating: typeof h.rating === "number" ? "★".repeat(h.rating) : h.rating || "4.5 ★",
            phone: h.phone || "",
            vendorObj: h,
          });
        }
      });
    }

    return list;
  }, [dbVendors, adminHotels]);

  const destinationCitiesList = useMemo(() => {
    const seenNorm = new Set<string>();
    const cities: string[] = [];

    const addCity = (rawName: string) => {
      if (!rawName) return;
      let clean = rawName.trim();
      if (clean.toLowerCase().endsWith(" camp")) {
        const base = clean.substring(0, clean.length - 5).trim();
        if (base) clean = base;
      }
      const norm = normalizeDestinationName(clean);
      if (norm && !seenNorm.has(norm)) {
        seenNorm.add(norm);
        cities.push(clean);
      }
    };

    hotelEligibleDestinations.forEach((d) => addCity(d.name));

    dbVendors.forEach((v: any) => {
      addCity(v.city);
      addCity(v.location);
    });

    if (selectedDestination) addCity(selectedDestination);

    return cities.sort((a, b) => a.localeCompare(b));
  }, [hotelEligibleDestinations, dbVendors, selectedDestination]);

  const matchingHotels = useMemo(() => {
    if (!selectedDestination) return combinedHotelProperties;
    const normSelected = normalizeDestinationName(selectedDestination);
    const exactMatches = combinedHotelProperties.filter((h) => {
      const normCity = normalizeDestinationName(h.city || "");
      return normCity.includes(normSelected) || normSelected.includes(normCity);
    });
    if (exactMatches.length > 0) {
      return exactMatches;
    }
    return [
      {
        id: `custom-${normSelected}`,
        name: `Hotel / Stay in ${selectedDestination}`,
        city: selectedDestination,
        category: "Standard Property",
      },
    ];
  }, [selectedDestination, combinedHotelProperties]);

  // Auto-sync selectedHotel state whenever matchingHotels or selectedDestination changes
  useEffect(() => {
    if (!isOpen || matchingHotels.length === 0) return;
    const isSelectedInMatching = matchingHotels.some(
      (h) => h.name === selectedHotel?.name || h.id === selectedHotel?.id
    );
    if (!isSelectedInMatching && matchingHotels[0]) {
      handleSelectHotel(matchingHotels[0], selectedDestination);
    }
  }, [matchingHotels, selectedDestination, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const dayOffset = Math.max(0, currentDayNum - 1);
    const existingB = initialDayInfo?.existingBooking;

    let destName = "";
    if (initialDayInfo?.destination && initialDayInfo.destination !== "—") {
      destName = initialDayInfo.destination;
    } else if (currentDayDestination) {
      destName = currentDayDestination.name;
    } else if (hotelEligibleDestinations.length > 0) {
      destName = hotelEligibleDestinations[0].name;
    } else {
      destName = "Manali";
    }
    setSelectedDestination(destName);

    const initCheckIn = formatDateForInput(
      existingB?.checkInDate || existingB?.checkIn || initialDayInfo?.dateStr || currentDayItineraryDate,
      departureDateStr,
      dayOffset
    );
    setCheckInDate(initCheckIn);

    const n = existingB?.nightsCount || 1;
    setNightsCount(n);
    setCheckOutDate(addNightsToDate(initCheckIn, n));

    const normDest = normalizeDestinationName(destName);

    if (existingB && (existingB.hotelName || existingB.vendorName || existingB.hotel)) {
      const hName = existingB.hotelName || existingB.hotel || existingB.vendorName || "";
      const matchedInCity = matchingHotels.find((h) => h.name.toLowerCase() === hName.toLowerCase());
      const matchedAny = combinedHotelProperties.find((h) => h.name.toLowerCase() === hName.toLowerCase());
      const matched = matchedInCity || (matchedAny && normalizeDestinationName(matchedAny.city) === normDest ? matchedAny : null);

      if (matched) {
        setSelectedHotel(matched);
        const rates = extractHotelRates(matched, destName);
        setDoubleRate(existingB.doubleRate || rates.doubleRate);
        setTripleRate(existingB.tripleRate || rates.tripleRate);
        setQuadRate(existingB.quadRate || rates.quadRate);
        setExtraBedRate(existingB.extraBedRate || rates.extraBedRate);
      } else if (matchingHotels[0]) {
        setSelectedHotel(matchingHotels[0]);
        const rates = extractHotelRates(matchingHotels[0], destName);
        setDoubleRate(existingB.doubleRate || rates.doubleRate);
        setTripleRate(existingB.tripleRate || rates.tripleRate);
        setQuadRate(existingB.quadRate || rates.quadRate);
        setExtraBedRate(existingB.extraBedRate || rates.extraBedRate);
      }
    } else {
      const matched = combinedHotelProperties.find((h) => {
        const normCity = normalizeDestinationName(h.city || "");
        return normCity.includes(normDest) || normDest.includes(normCity);
      });

      if (matched) {
        setSelectedHotel(matched);
        const rates = extractHotelRates(matched, destName);
        setDoubleRate(rates.doubleRate);
        setTripleRate(rates.tripleRate);
        setQuadRate(rates.quadRate);
        setExtraBedRate(rates.extraBedRate);
      } else {
        const placeholderHotel = {
          id: `custom-${normDest}`,
          name: `Hotel / Stay in ${destName}`,
          city: destName,
          category: "Standard Property",
        };
        setSelectedHotel(placeholderHotel);
        setDoubleRate(1200);
        setTripleRate(900);
        setQuadRate(750);
        setExtraBedRate(500);
      }
    }

    // Initialize Room Counts for 100% Sync with Room Allocation Engine & Database
    if (existingB) {
      setDoubleRoomsCount(existingB.doubleRoomsCount ?? existingB.doubleRooms ?? 0);
      setTripleRoomsCount(existingB.tripleRoomsCount ?? existingB.tripleRooms ?? 0);
      setQuadRoomsCount(existingB.quadRoomsCount ?? existingB.quadRooms ?? 0);
      setExtraPersonsCount(existingB.extraPersonsCount ?? existingB.extraBeds ?? 0);
      setRemarks(existingB.remarks || "");
    } else {
      // Auto-suggest room allocation for total pax (e.g. 7 pax -> 3 Double Rooms or Quad + Triple)
      if (totalPax > 0) {
        if (totalPax % 4 === 0) {
          setQuadRoomsCount(totalPax / 4);
          setDoubleRoomsCount(0);
        } else if (totalPax % 3 === 0) {
          setTripleRoomsCount(totalPax / 3);
          setDoubleRoomsCount(0);
        } else if (totalPax === 7) {
          setTripleRoomsCount(1);
          setQuadRoomsCount(1);
          setDoubleRoomsCount(0);
        } else {
          setDoubleRoomsCount(Math.floor(totalPax / 2));
          if (totalPax % 2 !== 0) {
            setExtraPersonsCount(1);
          }
        }
      } else {
        setDoubleRoomsCount(1);
      }
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

  const handleSelectHotel = (hotel: any, overrideDest?: string) => {
    setSelectedHotel(hotel);
    const destToUse = overrideDest || selectedDestination || hotel?.city;
    const rates = extractHotelRates(hotel, destToUse);
    setDoubleRate(rates.doubleRate);
    setTripleRate(rates.tripleRate);
    setQuadRate(rates.quadRate);
    setExtraBedRate(rates.extraBedRate);
  };

  const handleNightsChange = (nights: number) => {
    const validNights = Math.max(1, nights);
    setNightsCount(validNights);
    if (checkInDate) {
      setCheckOutDate(addNightsToDate(checkInDate, validNights));
    }
  };

  const handleCheckInChange = (newCheckIn: string) => {
    setCheckInDate(newCheckIn);
    if (newCheckIn) {
      setCheckOutDate(addNightsToDate(newCheckIn, nightsCount));
    }
  };

  const totalPhysicalRooms = doubleRoomsCount + tripleRoomsCount + quadRoomsCount;
  const paxCapacityCovered =
    doubleRoomsCount * 2 + tripleRoomsCount * 3 + quadRoomsCount * 4 + extraPersonsCount;
  const targetPaxCount = totalPax > 0 ? totalPax : paxCapacityCovered || 1;
  const isPaxFullyAllocated = paxCapacityCovered >= targetPaxCount;

  // Pure Per Person Cost calculation based on room capacity x per person rate
  const calculatedCosts = useMemo(() => {
    const doubleTotal = doubleRoomsCount * 2 * doubleRate * nightsCount;
    const tripleTotal = tripleRoomsCount * 3 * tripleRate * nightsCount;
    const quadTotal = quadRoomsCount * 4 * quadRate * nightsCount;
    const extraTotal = extraPersonsCount * extraBedRate * nightsCount;

    const grandTotal = doubleTotal + tripleTotal + quadTotal + extraTotal;
    const effectivePax = paxCapacityCovered > 0 ? paxCapacityCovered : (totalPax > 0 ? totalPax : 1);
    const costPerPaxStay = effectivePax > 0 ? grandTotal / effectivePax : grandTotal;

    return {
      grandTotal,
      costPerPaxStay,
    };
  }, [
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
  ]);

  const handleSaveStayAssignment = async () => {
    if (!selectedHotel) {
      toast.error("Please select a hotel property");
      return;
    }
    if (!checkInDate) {
      toast.error("Please enter a valid Check-In Date");
      return;
    }
    if (!isPaxFullyAllocated) {
      toast.error(`Please allocate rooms for all ${targetPaxCount} persons (${paxCapacityCovered}/${targetPaxCount} allocated)`);
      return;
    }

    setIsSaving(true);
    try {
      const realVendorId =
        selectedHotel?.vendorObj?.id && !String(selectedHotel.vendorObj.id).startsWith("HTL-")
          ? selectedHotel.vendorObj.id
          : null;

      const existingB = initialDayInfo?.existingBooking;

      const payload: any = {
        ...(existingB?.id && !String(existingB.id).startsWith("stay") ? { id: existingB.id } : {}),
        hotelName: selectedHotel.name,
        location: selectedDestination || selectedHotel.city || "Manali",
        roomType: selectedHotel.category || "Standard Room",
        numberOfRooms: totalPhysicalRooms > 0 ? totalPhysicalRooms : 1,
        totalAmount: calculatedCosts.grandTotal,
        advancePaid: 0,
        confirmed: "CONFIRMED",
        pricingMethod: "per-person",
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
      <DialogContent className="max-w-[640px] bg-white p-5 rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col font-sans">
        {/* COMPACT HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900">Hotel Assignment</h3>
            <span className="text-xs font-bold text-slate-500">
              · Day {currentDayNum} · {selectedDestination}
            </span>
          </div>
          <span className="bg-slate-100 text-slate-800 text-xs font-black px-2.5 py-0.5 rounded-md border border-slate-200">
            {targetPaxCount} Pax
          </span>
        </div>

        {/* COMPACT FORM BODY */}
        <div className="py-3 space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          {/* SECTION 1: DESTINATION & HOTEL SELECTOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Destination City
              </label>
              <select
                value={selectedDestination}
                onChange={(e) => {
                  const newDest = e.target.value;
                  setSelectedDestination(newDest);

                  // Auto-snap Check-In Date to destination city itinerary date
                  const matchedDay = computedItinerary.find((day) => {
                    const city = resolveCityForItineraryDay(day);
                    return normalizeDestinationName(city) === normalizeDestinationName(newDest);
                  });
                  if (matchedDay) {
                    const dNum = matchedDay.day
                      ? typeof matchedDay.day === "number"
                        ? matchedDay.day
                        : parseInt(String(matchedDay.day).replace(/\D/g, ""), 10) || 1
                      : 1;
                    const newCheckIn = formatDateForInput(
                      matchedDay.dateStr || matchedDay.date,
                      departureDateStr,
                      dNum - 1
                    );
                    if (newCheckIn) {
                      setCheckInDate(newCheckIn);
                      setCheckOutDate(addNightsToDate(newCheckIn, nightsCount));
                    }
                  }

                  const norm = normalizeDestinationName(newDest);
                  const matched = combinedHotelProperties.find((h) => {
                    const normCity = normalizeDestinationName(h.city || "");
                    return normCity.includes(norm) || norm.includes(normCity);
                  });
                  if (matched) {
                    handleSelectHotel(matched, newDest);
                  } else {
                    const placeholderHotel = {
                      id: `custom-${norm}`,
                      name: `Hotel / Stay in ${newDest}`,
                      city: newDest,
                      category: "Standard Property",
                    };
                    handleSelectHotel(placeholderHotel, newDest);
                  }
                }}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded-lg px-2.5 bg-white text-slate-900 focus:border-[#FF4D00] focus:outline-none"
              >
                {destinationCitiesList.map((city) => (
                  <option key={city} value={city}>
                    📍 {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Hotel Property
              </label>
              <select
                value={selectedHotel?.name || ""}
                onChange={(e) => {
                  const matched = matchingHotels.find((h) => h.name === e.target.value);
                  if (matched) handleSelectHotel(matched);
                }}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded-lg px-2.5 bg-white text-slate-900 focus:border-[#FF4D00] focus:outline-none"
              >
                {matchingHotels.map((h) => (
                  <option key={h.id} value={h.name}>
                    {h.name} ({h.city || selectedDestination}) — {h.category || "Hotel"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 2: STAY DATES & NIGHTS (1 HORIZONTAL ROW) */}
          <div className="grid grid-cols-3 gap-2.5 items-end bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Check-In
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => handleCheckInChange(e.target.value)}
                className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-900 focus:outline-none focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Nights
              </label>
              <select
                value={nightsCount}
                onChange={(e) => handleNightsChange(Number(e.target.value))}
                className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-900 focus:outline-none focus:border-[#FF4D00]"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Night" : "Nights"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Check-Out
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-900 focus:outline-none focus:border-[#FF4D00]"
              />
            </div>
          </div>

          {/* SECTION 3: ROOM & PER PERSON SHARING ALLOCATION TABLE */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div className="bg-slate-50 p-2 border-b border-slate-200 flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-700">
              <span>Per Person Sharing Allocation</span>
              <span className={cn("font-bold px-2 py-0.5 rounded text-[10px]", isPaxFullyAllocated ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                {paxCapacityCovered} / {targetPaxCount} Persons Allocated
              </span>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-500 font-bold bg-slate-50/50">
                  <th className="py-1.5 px-3">Sharing Type</th>
                  <th className="py-1.5 px-3 text-center">Rooms</th>
                  <th className="py-1.5 px-3 text-center">Persons (Pax)</th>
                  <th className="py-1.5 px-3 text-right">Rate / Person (₹)</th>
                  <th className="py-1.5 px-3 text-right">Subtotal (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {/* DOUBLE SHARING */}
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800">
                    Double Sharing
                    <span className="text-[10px] font-medium text-slate-400 block">
                      2 Pax/Room
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDoubleRoomsCount(Math.max(0, doubleRoomsCount - 1))}
                        className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-black font-mono">{doubleRoomsCount}</span>
                      <button
                        type="button"
                        onClick={() => setDoubleRoomsCount(doubleRoomsCount + 1)}
                        className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                    {doubleRoomsCount * 2}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={doubleRate || ""}
                      onChange={(e) => setDoubleRate(e.target.value === "" ? 0 : Number(e.target.value))}
                      className="w-16 h-6 text-right font-mono font-bold border border-slate-200 rounded px-1 text-xs focus:border-[#FF4D00] focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                    ₹{(doubleRoomsCount * 2 * doubleRate * nightsCount).toLocaleString("en-IN")}
                  </td>
                </tr>

                {/* TRIPLE SHARING */}
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800">
                    Triple Sharing
                    <span className="text-[10px] font-medium text-slate-400 block">
                      3 Pax/Room
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTripleRoomsCount(Math.max(0, tripleRoomsCount - 1))}
                        className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-black font-mono">{tripleRoomsCount}</span>
                      <button
                        type="button"
                        onClick={() => setTripleRoomsCount(tripleRoomsCount + 1)}
                        className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                    {tripleRoomsCount * 3}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={tripleRate || ""}
                      onChange={(e) => setTripleRate(e.target.value === "" ? 0 : Number(e.target.value))}
                      className="w-16 h-6 text-right font-mono font-bold border border-slate-200 rounded px-1 text-xs focus:border-[#FF4D00] focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                    ₹{(tripleRoomsCount * 3 * tripleRate * nightsCount).toLocaleString("en-IN")}
                  </td>
                </tr>

                {/* QUAD SHARING */}
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800">
                    Quad Sharing
                    <span className="text-[10px] font-medium text-slate-400 block">
                      4 Pax/Room
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuadRoomsCount(Math.max(0, quadRoomsCount - 1))}
                        className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-black font-mono">{quadRoomsCount}</span>
                      <button
                        type="button"
                        onClick={() => setQuadRoomsCount(quadRoomsCount + 1)}
                        className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                    {quadRoomsCount * 4}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={quadRate || ""}
                      onChange={(e) => setQuadRate(e.target.value === "" ? 0 : Number(e.target.value))}
                      className="w-16 h-6 text-right font-mono font-bold border border-slate-200 rounded px-1 text-xs focus:border-[#FF4D00] focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                    ₹{(quadRoomsCount * 4 * quadRate * nightsCount).toLocaleString("en-IN")}
                  </td>
                </tr>

                {/* EXTRA MATTRESS */}
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-600">
                    Extra Mattress
                    <span className="text-[10px] font-medium text-slate-400 block">
                      1 Bed/Pax
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-400">—</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExtraPersonsCount(Math.max(0, extraPersonsCount - 1))}
                        className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-black font-mono">{extraPersonsCount}</span>
                      <button
                        type="button"
                        onClick={() => setExtraPersonsCount(extraPersonsCount + 1)}
                        className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={extraBedRate || ""}
                      onChange={(e) => setExtraBedRate(e.target.value === "" ? 0 : Number(e.target.value))}
                      className="w-16 h-6 text-right font-mono font-bold border border-slate-200 rounded px-1 text-xs focus:border-[#FF4D00] focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                    ₹{(extraPersonsCount * extraBedRate * nightsCount).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION 4: COST SUMMARY */}
          <div className="flex items-center justify-between bg-orange-50/70 border border-orange-200 p-3 rounded-lg">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-500 block">Total Stay Cost</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-900 font-mono">
                  ₹{calculatedCosts.grandTotal.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({paxCapacityCovered} Persons Allocated)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Calculation Mode</span>
              <span className="text-xs font-black text-[#FF4D00] uppercase tracking-wider">Per Person</span>
            </div>
          </div>

          {/* SECTION 5: REMARKS */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
              Remarks / Special Instructions
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Early check-in requested, MAP meal plan..."
              className="w-full h-8 text-xs border border-slate-200 rounded-lg px-2.5 bg-white text-slate-900 focus:outline-none focus:border-[#FF4D00]"
            />
          </div>
        </div>

        {/* STICKY FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveStayAssignment}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg text-xs font-black bg-[#FF4D00] hover:bg-[#E04400] text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? "Saving Assignment..." : "Save Stay Assignment"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
