import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, Plus, Trash2, MapPin, ChevronDown, CheckCircle2,
  Building2, Car, Compass, Coffee, Heart, ArrowRightLeft, FileText,
  Copy, Edit3, Settings, Calendar, RefreshCw, Star, Info, ShieldAlert, Sparkles, X, Save, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const STATE_CITIES: Record<string, string[]> = {
  "Kerala": ["Kochi", "Munnar", "Thekkady", "Alleppey", "Varkala", "Trivandrum"],
  "Himachal Pradesh": ["Manali", "Kasol", "Shimla", "Dharamshala", "Dalhousie", "Spiti"],
  "Goa": ["North Goa", "South Goa", "Panaji", "Calangute", "Palolem"],
  "Ladakh": ["Leh", "Nubra Valley", "Pangong", "Kargil"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer", "Pushkar"],
  "Uttarakhand": ["Rishikesh", "Mussoorie", "Nainital", "Dehradun", "Haridwar"],
  "Kashmir": ["Srinagar", "Gulmarg", "Pahalgam", "Sonmarg"],
};

// Rich Master Inventory mapping to state and destination categories
const MASTER_HOTELS = [
  // Himachal Pradesh stays
  { 
    id: "h5", 
    name: "Snow Valley Resort", 
    state: "Himachal Pradesh", 
    city: "Manali", 
    rating: "4.5", 
    category: "Deluxe",
    rateType: "per-room", // per-room per night
    rates: { double: 3200, triple: 4200, quad: 5200 },
    extraPersonCharge: 1200,
    childCharge: 800,
    mealPlanCost: { EP: 0, CP: 300, MAP: 750, AP: 1200 },
    weekendSurcharge: 400,
    seasonalSurcharge: 600,
    taxPercent: 12,
    maxPeople: 4,
    notes: "Valley view premium rooms with balcony.",
    img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=300&q=80"
  },
  { 
    id: "h6", 
    name: "The Ridge Kasol", 
    state: "Himachal Pradesh", 
    city: "Kasol", 
    rating: "4.2", 
    category: "Standard",
    rateType: "per-person", // per person per night
    rates: { double: 1400, triple: 1200, quad: 1000 },
    extraPersonCharge: 800,
    childCharge: 500,
    mealPlanCost: { EP: 0, CP: 200, MAP: 500, AP: 800 },
    weekendSurcharge: 200,
    seasonalSurcharge: 300,
    taxPercent: 12,
    maxPeople: 4,
    notes: "River side boutique camps.",
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80"
  },
  { 
    id: "h7", 
    name: "Shimla Haveli", 
    state: "Himachal Pradesh", 
    city: "Shimla", 
    rating: "4.3", 
    category: "Standard",
    rateType: "per-room",
    rates: { double: 2900, triple: 3800, quad: 4500 },
    extraPersonCharge: 1000,
    childCharge: 600,
    mealPlanCost: { EP: 0, CP: 250, MAP: 600, AP: 1000 },
    weekendSurcharge: 300,
    seasonalSurcharge: 400,
    taxPercent: 12,
    maxPeople: 3,
    notes: "Located near Mall Road.",
    img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=300&q=80"
  },
  { 
    id: "h7_premium", 
    name: "Shimla President Resort", 
    state: "Himachal Pradesh", 
    city: "Shimla", 
    rating: "4.7", 
    category: "Premium",
    rateType: "per-person",
    rates: { double: 2200, triple: 1800, quad: 1500 },
    extraPersonCharge: 1200,
    childCharge: 800,
    mealPlanCost: { EP: 0, CP: 400, MAP: 900, AP: 1500 },
    weekendSurcharge: 500,
    seasonalSurcharge: 800,
    taxPercent: 18,
    maxPeople: 4,
    notes: "High altitude panoramic stay.",
    img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=300&q=80"
  },
  // Kerala stays
  { 
    id: "h1", 
    name: "Holiday Inn Cochin", 
    state: "Kerala", 
    city: "Kochi", 
    rating: "4.5", 
    category: "Standard",
    rateType: "per-room",
    rates: { double: 3300, triple: 4300, quad: 5000 },
    extraPersonCharge: 1000,
    childCharge: 700,
    mealPlanCost: { EP: 0, CP: 300, MAP: 700, AP: 1100 },
    weekendSurcharge: 300,
    seasonalSurcharge: 500,
    taxPercent: 12,
    maxPeople: 3,
    notes: "City center standard business hotel.",
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80"
  },
  { 
    id: "h2", 
    name: "Blanket Hotel & Spa", 
    state: "Kerala", 
    city: "Munnar", 
    rating: "4.7", 
    category: "Premium",
    rateType: "per-room",
    rates: { double: 4800, triple: 6000, quad: 7200 },
    extraPersonCharge: 1500,
    childCharge: 900,
    mealPlanCost: { EP: 0, CP: 400, MAP: 900, AP: 1400 },
    weekendSurcharge: 500,
    seasonalSurcharge: 800,
    taxPercent: 18,
    maxPeople: 4,
    notes: "Tea plantation views.",
    img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=300&q=80"
  }
];

const MASTER_VEHICLES = [
  { id: "v1", name: "Ertiga (AC)", cap: "6+1 Seater", state: "Kerala", basePrice: 8800, perDay: 2200, img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80" },
  { id: "v4", name: "Innova Crysta (AC)", cap: "6+1 Seater", state: "Himachal Pradesh", basePrice: 13500, perDay: 3500, img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=200&q=80" }
];

const MASTER_ACTIVITIES = [
  { id: "a1", name: "Fort Kochi Sightseeing Tour", state: "Kerala", city: "Kochi", adultRate: 450, childRate: 200, duration: "3 hours" },
  { id: "a5", name: "Solang Valley Paragliding", state: "Himachal Pradesh", city: "Manali", adultRate: 2500, childRate: 2000, duration: "30 min" }
];

interface ItineraryDay {
  day: string;
  dayLabel: string;
  location: string;
  hotel?: string;
  roomType?: string;
  mealPlan?: string;
  transfers?: string;
  activity?: string;
  cost: number;
  notes?: string;

  // Pricing automation fields
  hotelStayRequired: boolean;
  preferredCategory: string;
  roomSharing: "Double" | "Triple" | "Quad";
  selectedHotelId: string;
  
  // Custom manual allocations/overrides
  doubleRoomsCount: number;
  tripleRoomsCount: number;
  quadRoomsCount: number;
  extraPersonsCount: number;
  
  overrideApplied: boolean;
  overrideAmount: number;
  overrideReason: string;
  overrideAuthor: string;
}

export default function PackageBuilderPage() {
  const navigate = useNavigate();
  
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  
  // Main Tab Navigation
  const [activeMainTab, setActiveMainTab] = useState<"itinerary" | "hotels" | "transport" | "activities">("itinerary");

  // Basic Parameters
  const [custName, setCustName] = useState("Neel Mehta");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [packageName, setPackageName] = useState("Himachal Explorer Getaway");
  const [selectedState, setSelectedState] = useState("Himachal Pradesh");
  const [departureCity, setDepartureCity] = useState("Delhi");
  
  const [travelStart, setTravelStart] = useState("2026-07-10");
  const [travelEnd, setTravelEnd] = useState("2026-07-15");
  
  const [numAdults, setNumAdults] = useState(20);
  const [numChildren, setNumChildren] = useState(2);
  const [numCouples, setNumCouples] = useState(4);
  const [mealPlan, setMealPlan] = useState("MAP");

  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<string>("hotels");

  // Dynamic Day List
  const [days, setDays] = useState<ItineraryDay[]>([
    { 
      day: "01", 
      dayLabel: "Day 1", 
      location: "Shimla", 
      hotel: "Shimla Haveli", 
      roomType: "Double", 
      mealPlan: "MAP", 
      transfers: "Scenic transfer stand-by", 
      activity: "Local sightseeing explorer", 
      cost: 3100,
      hotelStayRequired: true,
      preferredCategory: "Standard",
      roomSharing: "Double",
      selectedHotelId: "h7",
      doubleRoomsCount: 10,
      tripleRoomsCount: 0,
      quadRoomsCount: 0,
      extraPersonsCount: 0,
      overrideApplied: false,
      overrideAmount: 0,
      overrideReason: "",
      overrideAuthor: "Super Admin"
    },
    { 
      day: "02", 
      dayLabel: "Day 2", 
      location: "Shimla", 
      hotel: "Shimla Haveli", 
      roomType: "Double", 
      mealPlan: "MAP", 
      transfers: "Scenic transfer stand-by", 
      activity: "Local sightseeing explorer", 
      cost: 3100,
      hotelStayRequired: true,
      preferredCategory: "Standard",
      roomSharing: "Double",
      selectedHotelId: "h7",
      doubleRoomsCount: 10,
      tripleRoomsCount: 0,
      quadRoomsCount: 0,
      extraPersonsCount: 0,
      overrideApplied: false,
      overrideAmount: 0,
      overrideReason: "",
      overrideAuthor: "Super Admin"
    },
    { 
      day: "03", 
      dayLabel: "Day 3", 
      location: "Manali", 
      hotel: "Snow Valley Resort", 
      roomType: "Triple", 
      mealPlan: "MAP", 
      transfers: "Transit tour route", 
      activity: "Hadimba Temple Walkthrough", 
      cost: 3800,
      hotelStayRequired: true,
      preferredCategory: "Deluxe",
      roomSharing: "Triple",
      selectedHotelId: "h5",
      doubleRoomsCount: 0,
      tripleRoomsCount: 7,
      quadRoomsCount: 0,
      extraPersonsCount: 0,
      overrideApplied: false,
      overrideAmount: 0,
      overrideReason: "",
      overrideAuthor: "Super Admin"
    },
    { 
      day: "04", 
      dayLabel: "Day 4", 
      location: "Manali", 
      hotel: "Snow Valley Resort", 
      roomType: "Triple", 
      mealPlan: "MAP", 
      transfers: "Transit tour route", 
      activity: "Hadimba Temple Walkthrough", 
      cost: 3800,
      hotelStayRequired: true,
      preferredCategory: "Deluxe",
      roomSharing: "Triple",
      selectedHotelId: "h5",
      doubleRoomsCount: 0,
      tripleRoomsCount: 7,
      quadRoomsCount: 0,
      extraPersonsCount: 0,
      overrideApplied: false,
      overrideAmount: 0,
      overrideReason: "",
      overrideAuthor: "Super Admin"
    },
    { 
      day: "05", 
      dayLabel: "Day 5", 
      location: "Delhi", 
      hotel: "", 
      roomType: "Double", 
      mealPlan: "CP", 
      transfers: "Airport Drop", 
      activity: "", 
      cost: 0,
      hotelStayRequired: false,
      preferredCategory: "Standard",
      roomSharing: "Double",
      selectedHotelId: "",
      doubleRoomsCount: 0,
      tripleRoomsCount: 0,
      quadRoomsCount: 0,
      extraPersonsCount: 0,
      overrideApplied: false,
      overrideAmount: 0,
      overrideReason: "",
      overrideAuthor: "Super Admin"
    }
  ]);

  const handleSelectDestination = (dest: string) => {
    setSelectedState(dest);
    setSelectedDestination(dest);
    setPackageName(`${dest} Explorer Package`);
    
    const citiesList = STATE_CITIES[dest] || ["Destination"];
    const fallbackCity = citiesList[0];
    const initialDay: ItineraryDay = {
      day: "01",
      dayLabel: "Day 1",
      location: fallbackCity,
      hotel: "Select Stay Hotel",
      roomType: "Standard",
      mealPlan: "CP",
      transfers: "Scenic transfer route stand-by",
      activity: "Local sightseeing explorer",
      cost: 4000,
      hotelStayRequired: true,
      preferredCategory: "Standard",
      roomSharing: "Double",
      selectedHotelId: "",
      doubleRoomsCount: 0,
      tripleRoomsCount: 0,
      quadRoomsCount: 0,
      extraPersonsCount: 0,
      overrideApplied: false,
      overrideAmount: 0,
      overrideReason: "",
      overrideAuthor: "Super Admin"
    };
    setDays([initialDay]);
    toast.success(`Initialized builder for ${dest}!`);
  };

  // Auto Room Calculation
  const autoAllocations = useMemo(() => {
    const totalTravellers = numAdults + numChildren;
    const doubleRooms = Math.ceil(totalTravellers / 2);
    const tripleRooms = Math.ceil(totalTravellers / 3);
    const quadRooms = Math.ceil(totalTravellers / 4);

    return { doubleRooms, tripleRooms, quadRooms, totalTravellers };
  }, [numAdults, numChildren]);

  // Sync rooms allocation default state when activeDayIdx changes
  useEffect(() => {
    const activeDay = days[activeDayIdx];
    if (activeDay && activeDay.hotelStayRequired && activeDay.doubleRoomsCount === 0 && activeDay.tripleRoomsCount === 0 && activeDay.quadRoomsCount === 0) {
      // Set default allocation based on sharing preference
      const pref = activeDay.roomSharing;
      setDays(prev => prev.map((item, idx) => {
        if (idx === activeDayIdx) {
          return {
            ...item,
            doubleRoomsCount: pref === "Double" ? autoAllocations.doubleRooms : 0,
            tripleRoomsCount: pref === "Triple" ? autoAllocations.tripleRooms : 0,
            quadRoomsCount: pref === "Quad" ? autoAllocations.quadRooms : 0
          };
        }
        return item;
      }));
    }
  }, [activeDayIdx, autoAllocations]);

  // STAY GROUPING / DUPLICATION REDUCTION LOGIC
  const stayRequirements = useMemo(() => {
    const requirements: any[] = [];
    let currentReq: any = null;

    days.forEach((d, idx) => {
      if (!d.hotelStayRequired) {
        currentReq = null;
        return;
      }

      // Check if consecutive stay can be combined (same destination, same selectedHotelId)
      const canCombine = currentReq && 
        currentReq.location.toLowerCase() === d.location.toLowerCase() &&
        currentReq.selectedHotelId === d.selectedHotelId;

      if (canCombine) {
        currentReq.daysList.push(d);
        currentReq.nights += 1;
        currentReq.dayIndices.push(idx);
      } else {
        currentReq = {
          id: `req-${idx}`,
          location: d.location,
          daysList: [d],
          nights: 1,
          selectedHotelId: d.selectedHotelId || "",
          roomSharing: d.roomSharing || "Double",
          preferredCategory: d.preferredCategory || "Standard",
          dayIndices: [idx]
        };
        requirements.push(currentReq);
      }
    });

    return requirements;
  }, [days]);

  // HOTEL MATCHING ALGORITHM (Requirement 2)
  const getAvailableHotels = (city: string) => {
    // 1. Exact city match
    let match = MASTER_HOTELS.filter(h => h.city.toLowerCase() === city.toLowerCase());
    if (match.length > 0) return match;

    // 2. State-level fallback
    const stateMatch = MASTER_HOTELS.filter(h => h.state === selectedState);
    if (stateMatch.length > 0) return stateMatch;

    // 3. Complete fallback list
    return MASTER_HOTELS;
  };

  // DYNAMIC COST CALCULATOR MATRIX ENGINE (Requirement 5 & 6)
  const computedStaysCost = useMemo(() => {
    let totalHotelsCost = 0;
    const requirementsCostBreakdown = stayRequirements.map((req) => {
      // Find selected hotel details
      const hotel = MASTER_HOTELS.find(h => h.id === req.selectedHotelId);
      if (!hotel) {
        return {
          reqId: req.id,
          hotelName: "No Hotel Mapped",
          doubleCost: 0,
          tripleCost: 0,
          quadCost: 0,
          totalCost: 0,
          baseCost: 0,
          mealCost: 0,
          extraCharges: 0,
          tax: 0,
          discount: 0,
          isOverride: false
        };
      }

      // Read allocations from the first day in grouped stay (represented in all days)
      const primaryDay = req.daysList[0];
      const doubleCount = primaryDay.doubleRoomsCount;
      const tripleCount = primaryDay.tripleRoomsCount;
      const quadCount = primaryDay.quadRoomsCount;
      const extraCount = primaryDay.extraPersonsCount;

      const rateType = hotel.rateType; // per-room vs per-person
      let doubleCost = 0;
      let tripleCost = 0;
      let quadCost = 0;
      let extraCost = extraCount * hotel.extraPersonCharge * req.nights;

      if (rateType === "per-room") {
        doubleCost = doubleCount * hotel.rates.double * req.nights;
        tripleCost = tripleCount * hotel.rates.triple * req.nights;
        quadCost = quadCount * hotel.rates.quad * req.nights;
      } else {
        // per-person cost
        doubleCost = (doubleCount * 2) * hotel.rates.double * req.nights;
        tripleCost = (tripleCount * 3) * hotel.rates.triple * req.nights;
        quadCost = (quadCount * 4) * hotel.rates.quad * req.nights;
      }

      const baseCost = doubleCost + tripleCost + quadCost + extraCost;

      // Meal cost calculation
      const totalPaxAllocated = (doubleCount * 2) + (tripleCount * 3) + (quadCount * 4) + extraCount;
      const mealRate = hotel.mealPlanCost[primaryDay.mealPlan as keyof typeof hotel.mealPlanCost] || 0;
      const mealCost = totalPaxAllocated * mealRate * req.nights;

      // Surcharges & Taxes
      const weekendCharge = hotel.weekendSurcharge * req.nights;
      const seasonalCharge = hotel.seasonalSurcharge * req.nights;
      const extraCharges = weekendCharge + seasonalCharge;

      const subTotal = baseCost + mealCost + extraCharges;
      const taxAmount = Math.round(subTotal * (hotel.taxPercent / 100));
      const calculatedTotal = subTotal + taxAmount;

      // Check if manual override is applied on any day of this stay group
      const hasOverride = req.daysList.some((d: any) => d.overrideApplied);
      const overrideAmount = req.daysList.reduce((sum: number, d: any) => d.overrideApplied ? sum + d.overrideAmount : sum, 0);

      const finalCost = hasOverride ? overrideAmount : calculatedTotal;
      totalHotelsCost += finalCost;

      return {
        reqId: req.id,
        hotelName: hotel.name,
        doubleCost,
        tripleCost,
        quadCost,
        totalCost: finalCost,
        baseCost,
        mealCost,
        extraCharges,
        tax: taxAmount,
        discount: 0,
        isOverride: hasOverride,
        rateType
      };
    });

    return { totalHotelsCost, requirementsCostBreakdown };
  }, [stayRequirements]);

  // Recalculate package totals including hotels cost
  const packageTotals = useMemo(() => {
    const hotelSum = computedStaysCost.totalHotelsCost;
    
    // Transport vehicle logic
    const activeVehicle = MASTER_VEHICLES.find(v => v.state === selectedState);
    const transferSum = activeVehicle ? activeVehicle.basePrice + (days.length * activeVehicle.perDay) : 8000 + (days.length * 2000);

    // Activities
    const activitySum = MASTER_ACTIVITIES.reduce((sum, act) => sum + (act.adultRate * numAdults), 0) / 4; // Mock average

    const subTotal = hotelSum + transferSum + activitySum;
    const gst = Math.round(subTotal * 0.05);
    const service = 1200;
    const total = subTotal + gst + service;
    const profit = Math.round(total * 0.22);

    return {
      hotels: hotelSum,
      transfers: transferSum,
      activities: activitySum,
      subTotal,
      gst,
      service,
      total,
      profit
    };
  }, [days, numAdults, selectedState, computedStaysCost]);

  // Itinerary Text Summary
  const generatedSummary = useMemo(() => {
    return `Stay Details:\n` + stayRequirements.map((r, i) => {
      const hotelDetails = computedStaysCost.requirementsCostBreakdown[i];
      return `📍 Destination: ${r.location} | Hotel: ${hotelDetails?.hotelName} | Stay: ${r.nights} Night(s) | Amount: ₹${hotelDetails?.totalCost.toLocaleString()}`;
    }).join("\n") + `\n\nTotal Stay Cost: ₹${computedStaysCost.totalHotelsCost.toLocaleString()}\nTotal Package Cost: ₹${packageTotals.total.toLocaleString()}`;
  }, [stayRequirements, computedStaysCost, packageTotals]);

  // Validation rules (Requirement 13)
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (!custName.trim()) errs.push("Customer Name is mandatory.");
    if (!phone.trim()) errs.push("Valid contact phone number is required.");
    if (!packageName.trim()) errs.push("Package name cannot be empty.");
    if (days.length === 0) errs.push("Itinerary must contain at least 1 day.");
    
    // Check if each day has stay and location
    days.forEach((d, idx) => {
      if (d.hotelStayRequired && !d.selectedHotelId) {
        errs.push(`Day ${idx + 1} (${d.location}) requires a hotel, but no hotel is selected.`);
      }
    });

    return errs;
  }, [custName, phone, packageName, days]);

  const handleConvertToQuotation = () => {
    if (validationErrors.length > 0) {
      toast.error("Please resolve validation errors before generating quotation.");
      return;
    }
    toast.success("Converting Day-Wise Itinerary parameters into Quotation System...");
    navigate(`/admin/quotations/new?name=${encodeURIComponent(custName)}&phone=${encodeURIComponent(phone)}&destination=${encodeURIComponent(selectedState)}`);
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear the entire builder?")) {
      setDays([]);
      toast.success("Itinerary builder reset.");
    }
  };

  const handleAddExtraDay = () => {
    const nextIdx = days.length + 1;
    const nextDayNum = String(nextIdx).padStart(2, "0");
    const citiesList = STATE_CITIES[selectedState] || ["Destination"];
    const fallbackCity = citiesList[nextIdx % citiesList.length] || citiesList[0];

    const newDay: ItineraryDay = {
      day: nextDayNum,
      dayLabel: `Day ${nextIdx}`,
      location: fallbackCity,
      hotelStayRequired: true,
      preferredCategory: "Standard",
      roomSharing: "Double",
      selectedHotelId: "",
      doubleRoomsCount: 0,
      tripleRoomsCount: 0,
      quadRoomsCount: 0,
      extraPersonsCount: 0,
      overrideApplied: false,
      overrideAmount: 0,
      overrideReason: "",
      overrideAuthor: "Super Admin",
      cost: 0
    };
    setDays([...days, newDay]);
    toast.success(`Day ${nextIdx} added successfully!`);
  };

  const handleRemoveDay = (idx: number) => {
    const updated = days.filter((_, i) => i !== idx).map((day, i) => ({
      ...day,
      day: String(i + 1).padStart(2, "0"),
      dayLabel: `Day ${i + 1}`
    }));
    setDays(updated);
    toast.success("Day removed from itinerary.");
  };

  const DESTINATIONS = [
    { name: "Kerala", icon: MapPin, borderColor: "border-red-500 hover:border-red-600 bg-white" },
    { name: "Himachal Pradesh", icon: Compass, borderColor: "border-blue-500 hover:border-blue-600 bg-white" },
    { name: "Goa", icon: Coffee, borderColor: "border-amber-400 hover:border-amber-500 bg-white" },
    { name: "Ladakh", icon: Compass, borderColor: "border-teal-500 hover:border-teal-600 bg-white" },
    { name: "Rajasthan", icon: Compass, borderColor: "border-orange-500 hover:border-orange-600 bg-white" },
    { name: "Uttarakhand", icon: Compass, borderColor: "border-emerald-500 hover:border-emerald-600 bg-white" },
    { name: "Kashmir", icon: Compass, borderColor: "border-purple-500 hover:border-purple-600 bg-white" }
  ];

  if (!selectedDestination) {
    return (
      <div className="space-y-6 animate-fade-in p-6 bg-[#F8FAFC] min-h-screen text-slate-700 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 bg-white -mx-6 -mt-6 p-5 border-b border-[#E2E8F0] gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-655" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Select Package Destination</h1>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Choose a destination region to launch the day-wise itinerary builder</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
          {DESTINATIONS.map((dest) => {
            const Icon = dest.icon;
            return (
              <Card 
                key={dest.name} 
                onClick={() => handleSelectDestination(dest.name)}
                className={cn(
                  "flex items-center gap-4 p-4 bg-white rounded-lg border-2 cursor-pointer shadow-sm hover:shadow-md hover:scale-102 transition-all duration-200 select-none",
                  dest.borderColor
                )}
              >
                <div className="w-12 h-12 rounded-lg border border-slate-100 flex items-center justify-center bg-slate-50/50 shrink-0">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 leading-none mb-1">{dest.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium truncate leading-tight">
                    {STATE_CITIES[dest.name]?.slice(0, 4).join(", ")}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F8FAFC] min-h-screen text-slate-700 font-sans">
      
      {/* ─── Top Control Header Action Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 bg-white -mx-6 -mt-6 p-5 border-b border-[#E2E8F0] gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedDestination(null)} 
            className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-650" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Package & Itinerary Planner</h1>
              <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold uppercase tracking-wider">
                {validationErrors.length > 0 ? "Draft" : "Ready for Quote"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Configure client-facing pricing metrics and timeline templates</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/master-database")} className="h-9 rounded-[4px] border-slate-200 text-slate-655 hover:bg-slate-50 font-bold uppercase text-[10px] cursor-pointer">
            Manage Inventory
          </Button>
          <Button variant="outline" onClick={handleClearAll} className="h-9 rounded-[4px] border-red-200 text-red-655 hover:bg-red-50 font-bold uppercase text-[10px] cursor-pointer">
            Clear Plan
          </Button>
          <Button 
            onClick={handleConvertToQuotation}
            disabled={validationErrors.length > 0}
            className={cn(
              "h-9 rounded-[4px] font-bold uppercase text-[10px] shadow-sm flex items-center gap-1.5 cursor-pointer",
              validationErrors.length > 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#E11D48] hover:bg-[#BE123C] text-white"
            )}
          >
            <FileText className="w-4 h-4" /> Convert to Quotation
          </Button>
        </div>
      </div>

      {/* ─── Validation Panel Indicator ─── */}
      {validationErrors.length > 0 && (
        <Card className="rounded-[4px] border-l-4 border-l-red-500 border-slate-200 bg-red-50/50 p-4">
          <div className="flex gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Itinerary Builder Validation Needed</h4>
              <ul className="list-disc pl-4 text-[11px] font-medium text-slate-600 space-y-0.5">
                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Main Tab Navigation Swapper (Itinerary vs Hotels Workspace) */}
      <div className="flex border-b border-slate-200 gap-1 font-semibold text-slate-500">
        <button
          onClick={() => setActiveMainTab("itinerary")}
          className={cn("px-4 py-2.5 text-xs font-bold border-b-2 uppercase tracking-wider cursor-pointer",
            activeMainTab === "itinerary" ? "border-[#E11D48] text-[#E11D48]" : "border-transparent hover:text-slate-800"
          )}
        >
          Itinerary Day Planner
        </button>
        <button
          onClick={() => setActiveMainTab("hotels")}
          className={cn("px-4 py-2.5 text-xs font-bold border-b-2 uppercase tracking-wider cursor-pointer flex items-center gap-1.5",
            activeMainTab === "hotels" ? "border-[#E11D48] text-[#E11D48]" : "border-transparent hover:text-slate-800"
          )}
        >
          <Building2 className="w-4 h-4" />
          Hotels Workspace
          {stayRequirements.length > 0 && (
            <span className="bg-red-100 text-red-750 px-1.5 py-0.2 rounded-full text-[9.5px] font-black">
              {stayRequirements.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── Rebuild Layout Grid ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Main Workspace (72% equivalent) */}
        <div className="xl:col-span-9 space-y-6">
          
          {activeMainTab === "itinerary" && (
            <>
              {/* STEP 1: CUSTOMER & TRIP DETAILS */}
              <Card className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="w-5.5 h-5.5 rounded-full bg-[#E11D48] text-white flex items-center justify-center font-bold text-[11px]">1</span>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Customer & Trip Parameters</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Customer Name</span>
                    <Input value={custName} onChange={e => setCustName(e.target.value)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wide">Contact Phone</span>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Package Title</span>
                    <Input value={packageName} onChange={e => setPackageName(e.target.value)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">State/Region Destination</span>
                    <select 
                      value={selectedState} 
                      onChange={e => setSelectedState(e.target.value)}
                      className="w-full h-9 text-xs font-semibold text-slate-800 rounded-[4px] border border-slate-200 px-2 bg-white focus:outline-none"
                    >
                      <option value="Kerala">Kerala</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Goa">Goa</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Travel Start Date</span>
                    <Input type="date" value={travelStart} onChange={e => setTravelStart(e.target.value)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Travel End Date</span>
                    <Input type="date" value={travelEnd} onChange={e => setTravelEnd(e.target.value)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Adults Count</span>
                    <Input type="number" value={numAdults} onChange={e => setNumAdults(parseInt(e.target.value) || 0)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Children Count</span>
                    <Input type="number" value={numChildren} onChange={e => setNumChildren(parseInt(e.target.value) || 0)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
                  </div>
                </div>
              </Card>

              {/* STEP 2: DAY-WISE ITINERARY TIMELINE */}
              <Card className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="w-5.5 h-5.5 rounded-full bg-[#E11D48] text-white flex items-center justify-center font-bold text-[11px]">2</span>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Itinerary Builder Timeline</h3>
                </div>

                <div className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
                  {days.map((d, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveDayIdx(idx)}
                      className={cn(
                        "flex gap-4 items-start relative pl-1 cursor-pointer transition-all",
                        activeDayIdx === idx ? "scale-[1.01]" : ""
                      )}
                    >
                      {/* Day count bubble */}
                      <div className={cn(
                        "z-10 shrink-0 w-9 h-9 rounded-full border-2 flex flex-col items-center justify-center font-black text-[10px] shadow-xs",
                        activeDayIdx === idx ? "bg-[#E11D48] text-white border-[#E11D48]" : "bg-white text-slate-650 border-slate-200"
                      )}>
                        <span className="text-[7.5px] uppercase tracking-tighter font-bold -mb-0.5">Day</span>
                        <span>{d.day}</span>
                      </div>

                      {/* Day Card */}
                      <div className={cn(
                        "flex-1 bg-white border rounded-[4px] p-4 space-y-3.5 shadow-2xs transition-colors",
                        activeDayIdx === idx ? "border-[#E11D48]" : "border-slate-200 hover:border-slate-300"
                      )}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-2">
                          <div className="flex flex-wrap items-center gap-4">
                            {/* Accommodation Selector */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accommodation:</span>
                              <select
                                value={d.hotelStayRequired ? "stay" : "journey"}
                                onChange={e => {
                                  const isStay = e.target.value === "stay";
                                  const citiesList = STATE_CITIES[selectedState] || ["Destination"];
                                  setDays(prev => prev.map((item, i) => i === idx ? { 
                                    ...item, 
                                    hotelStayRequired: isStay,
                                    location: isStay ? (item.location && item.location !== "—" ? item.location : citiesList[0]) : "—"
                                  } : item));
                                }}
                                className="h-8 text-xs border rounded bg-white font-bold text-slate-800 focus:outline-none"
                              >
                                <option value="stay">Stay Added</option>
                                <option value="journey">Night Journey</option>
                              </select>
                            </div>

                            {/* Location Dropdown when Stay Added is selected */}
                            {d.hotelStayRequired && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-[#E11D48]" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location:</span>
                                <select
                                  value={d.location}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setDays(prev => prev.map((item, i) => i === idx ? { ...item, location: val } : item));
                                  }}
                                  className="h-8 text-xs border rounded bg-white font-bold text-slate-800 focus:outline-none"
                                >
                                  {(STATE_CITIES[selectedState] || []).map(city => (
                                    <option key={city} value={city}>{city}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handleRemoveDay(idx); }} className="h-7 w-7 text-slate-400 hover:bg-slate-50 rounded flex items-center justify-center border border-slate-150 cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {d.hotelStayRequired ? (
                            <div className="p-2.5 border border-dashed border-slate-200 rounded text-center text-slate-450 font-bold text-[10px] bg-slate-50/30 flex items-center justify-center gap-1.5">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span>Hotel stay required for {d.location} (Configure on Hotels page)</span>
                            </div>
                          ) : (
                            <div className="p-2.5 border border-dashed border-slate-200 rounded text-center text-slate-400 font-bold text-[10px] bg-slate-50/20">
                              No Hotel Stay required (Night Journey)
                            </div>
                          )}

                          {d.activity ? (
                            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded border border-slate-150">
                              <Coffee className="w-4.5 h-4.5 text-[#E11D48] shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-700 truncate text-[11px]">{d.activity}</p>
                                <p className="text-[9px] text-slate-455 font-bold uppercase">Sightseeing activity included</p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 border border-dashed border-slate-300 rounded text-center text-slate-400 font-bold text-[10px]">No Activity Selected</div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-[10.5px] font-semibold text-slate-500 bg-slate-50/50 p-2 rounded">
                          <span className="text-slate-400">Transfers:</span>
                          <span>{d.transfers}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleAddExtraDay}
                    className="h-8.5 rounded-[4px] border-slate-200 text-slate-650 hover:bg-slate-50 font-bold uppercase text-[9.5px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Extra Day
                  </Button>
                </div>
              </Card>

              {/* STEP 3: LIVE DESTINATION SERVICE SELECTOR */}
              <Card className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="w-5.5 h-5.5 rounded-full bg-[#E11D48] text-white flex items-center justify-center font-bold text-[11px]">3</span>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Add Day activities & transfers (Active selection: Day {activeDayIdx + 1})
                  </h3>
                </div>

                {/* Sub Tabs */}
                <div className="flex bg-slate-50 rounded-[4px] border border-[#E2E8F0] p-1 font-semibold text-slate-500 max-w-fit">
                  {[
                    { id: "vehicles", label: "Vehicles", icon: Car },
                    { id: "activities", label: "Activities", icon: Compass }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id)}
                      className={cn(
                        "px-4 py-1.5 rounded-[3px] transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer",
                        activeSubTab === tab.id ? "bg-[#E11D48]/10 text-[#E11D48]" : "hover:text-slate-800"
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {activeSubTab === "vehicles" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MASTER_VEHICLES.filter(v => v.state === selectedState).map((item, idx) => (
                      <Card 
                        key={idx} 
                        onClick={() => setRateModalVehicle(item)}
                        className="rounded-[4px] border border-slate-200 p-4 flex gap-4 items-center shadow-xs cursor-pointer hover:border-[#E11D48] transition-all bg-white"
                      >
                        <img src={item.img} className="w-20 h-14 object-cover rounded" alt="" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-[11.5px] truncate">{item.name}</h4>
                          <p className="text-[10px] text-slate-455 font-bold mt-1">₹{item.basePrice.toLocaleString()} Base</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {activeSubTab === "activities" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MASTER_ACTIVITIES.filter(a => a.state === selectedState).map((item, idx) => (
                      <Card 
                        key={idx} 
                        onClick={() => setRateModalActivity(item)}
                        className="rounded-[4px] border border-slate-200 p-3.5 space-y-2 shadow-xs cursor-pointer hover:border-[#E11D48] transition-all bg-white"
                      >
                        <h4 className="font-bold text-slate-800 text-[11.5px] truncate">{item.name}</h4>
                        <p className="text-[10px] text-slate-450 font-semibold">{item.city} • Duration: {item.duration}</p>
                        <div className="pt-2 border-t flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span>Rate:</span>
                          <span className="font-black text-[#E11D48]">₹{item.adultRate}/adult</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {activeMainTab === "hotels" && (
            <div className="space-y-6">
              {/* Top Summary Stays KPI Panel (Requirement 12) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { l: "Total Travellers", v: `${numAdults + numChildren} Pax`, desc: "Active tour count" },
                  { l: "Total Stay Nights", v: `${stayRequirements.reduce((sum, r) => sum + r.nights, 0)} Nights`, desc: "Summed stay duration" },
                  { l: "Total Rooms Required", v: `${stayRequirements.reduce((sum, r) => {
                    const primary = r.daysList[0];
                    return sum + primary.doubleRoomsCount + primary.tripleRoomsCount + primary.quadRoomsCount;
                  }, 0)} Rooms`, desc: "Inventory allocated" },
                  { l: "Total Stays Cost", v: `₹${computedStaysCost.totalHotelsCost.toLocaleString()}`, desc: "Accumulated stays cost" },
                  { l: "Cost per Traveler", v: `₹${Math.round(computedStaysCost.totalHotelsCost / (numAdults + numChildren || 1)).toLocaleString()}`, desc: "Split cost contribution" }
                ].map(k => (
                  <Card key={k.l} className="p-4 bg-white border border-slate-200 rounded-[6px] shadow-xs">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{k.l}</p>
                    <p className="text-xl font-black text-slate-800 mt-1">{k.v}</p>
                    <p className="text-[10px] text-slate-450 mt-1">{k.desc}</p>
                  </Card>
                ))}
              </div>

              {/* Stays Requirements Mapped destination wise */}
              {stayRequirements.length === 0 ? (
                <Card className="p-8 text-center text-slate-450 border-2 border-dashed border-slate-250">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-sm">No Hotel Stays Required on Itinerary Planner</p>
                  <p className="text-xs text-slate-400 mt-1">Go to Itinerary Planner tab and toggle 'Hotel stay required' on itinerary days.</p>
                </Card>
              ) : (
                stayRequirements.map((req, reqIdx) => {
                  const availableHotels = getAvailableHotels(req.location);
                  const selectedHotel = MASTER_HOTELS.find(h => h.id === req.selectedHotelId);
                  const costDetails = computedStaysCost.requirementsCostBreakdown[reqIdx];
                  const primaryDay = req.daysList[0];

                  return (
                    <Card key={req.id} className="p-5 bg-white border border-slate-250 rounded-[6px] space-y-5 shadow-xs">
                      {/* Stay Destination Header (Requirement 9 & 12) */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-850 text-base">{req.location} Stay</h3>
                            <span className="bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-bold px-2 py-0.2 rounded uppercase">
                              {req.nights} Night{req.nights > 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-450 font-bold uppercase mt-0.5">
                            Covering days: {req.daysList.map((d: any) => `Day ${d.day}`).join(", ")}
                          </p>
                        </div>

                        {/* Preferred selection indicators */}
                        <div className="text-right text-[11px] font-semibold text-slate-500">
                          <span>Preferred Category: </span>
                          <span className="font-bold text-slate-800">{req.preferredCategory}</span>
                        </div>
                      </div>

                      {/* Hotel Comparison Matrix Component (Requirement 8) */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Available Stays Comparison</h4>
                        <div className="border border-slate-200 rounded overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-450 uppercase">
                              <tr>
                                <th className="p-2.5">Hotel Name</th>
                                <th className="p-2.5">Category</th>
                                <th className="p-2.5 text-center">Double Sharing</th>
                                <th className="p-2.5 text-center">Triple Sharing</th>
                                <th className="p-2.5 text-center">Quad Sharing</th>
                                <th className="p-2.5 text-center">Tax %</th>
                                <th className="p-2.5 text-right w-24">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {availableHotels.map((h) => {
                                const isSelected = req.selectedHotelId === h.id;
                                const isCheapest = h.rates.double === Math.min(...availableHotels.map(o => o.rates.double));
                                return (
                                  <tr key={h.id} className={cn("hover:bg-slate-50/50", isSelected ? "bg-indigo-50/20" : "")}>
                                    <td className="p-2.5 font-bold text-slate-750">
                                      <div className="flex items-center gap-1.5">
                                        <span>{h.name}</span>
                                        {isCheapest && (
                                          <span className="text-[7.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.1 rounded uppercase tracking-wider">Lowest</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-2.5 font-semibold text-slate-500">{h.category}</td>
                                    <td className="p-2.5 text-center font-bold text-slate-850">₹{h.rates.double}</td>
                                    <td className="p-2.5 text-center font-bold text-slate-850">₹{h.rates.triple}</td>
                                    <td className="p-2.5 text-center font-bold text-slate-850">₹{h.rates.quad}</td>
                                    <td className="p-2.5 text-center font-bold text-slate-550">{h.taxPercent}%</td>
                                    <td className="p-2.5 text-right">
                                      <button
                                        onClick={() => {
                                          setDays(prev => prev.map((item, idx) => {
                                            if (req.dayIndices.includes(idx)) {
                                              return { 
                                                ...item, 
                                                selectedHotelId: h.id,
                                                hotel: h.name,
                                                doubleRoomsCount: item.doubleRoomsCount || (item.roomSharing === "Double" ? autoAllocations.doubleRooms : 0),
                                                tripleRoomsCount: item.tripleRoomsCount || (item.roomSharing === "Triple" ? autoAllocations.tripleRooms : 0),
                                                quadRoomsCount: item.quadRoomsCount || (item.roomSharing === "Quad" ? autoAllocations.quadRooms : 0)
                                              };
                                            }
                                            return item;
                                          }));
                                          toast.success(`Assigned hotel "${h.name}" to ${req.location} stay!`);
                                        }}
                                        className={cn("text-[9px] font-black uppercase px-2.5 py-1 rounded shadow-3xs cursor-pointer border",
                                          isSelected ? "bg-emerald-50 text-emerald-700 border-emerald-250 cursor-default" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                                        )}
                                      >
                                        {isSelected ? "Selected" : "Select"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Selected Hotel Stay Allocation details */}
                      {selectedHotel && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t">
                          {/* Left Column: Room counters (Requirement 4 & 6) */}
                          <div className="space-y-4">
                            <h5 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-widest">Room Allocation</h5>
                            
                            <div className="space-y-3.5">
                              {/* Double sharing box */}
                              <div className="bg-slate-50 border p-3 rounded space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-800">Double Sharing</span>
                                  <span className="text-[9px] text-slate-455 font-bold uppercase">Max 2 / Room</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="inline-flex items-center border border-slate-250 rounded bg-white overflow-hidden h-7">
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setDays(prev => prev.map((item, idx) => req.dayIndices.includes(idx) ? { ...item, doubleRoomsCount: Math.max(0, item.doubleRoomsCount - 1) } : item));
                                      }} 
                                      className="px-2 h-full hover:bg-slate-100 font-bold border-r select-none"
                                    >
                                      -
                                    </button>
                                    <span className="px-3 font-bold text-slate-850 text-xs w-6 text-center">{primaryDay.doubleRoomsCount}</span>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setDays(prev => prev.map((item, idx) => req.dayIndices.includes(idx) ? { ...item, doubleRoomsCount: item.doubleRoomsCount + 1 } : item));
                                      }} 
                                      className="px-2 h-full hover:bg-slate-100 font-bold border-l select-none"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    Rate: ₹{selectedHotel.rates.double} / {selectedHotel.rateType === 'per-room' ? 'room' : 'person'}
                                  </span>
                                </div>
                              </div>

                              {/* Triple sharing box */}
                              <div className="bg-slate-50 border p-3 rounded space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-800">Triple Sharing</span>
                                  <span className="text-[9px] text-slate-455 font-bold uppercase">Max 3 / Room</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="inline-flex items-center border border-slate-250 rounded bg-white overflow-hidden h-7">
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setDays(prev => prev.map((item, idx) => req.dayIndices.includes(idx) ? { ...item, tripleRoomsCount: Math.max(0, item.tripleRoomsCount - 1) } : item));
                                      }} 
                                      className="px-2 h-full hover:bg-slate-100 font-bold border-r select-none"
                                    >
                                      -
                                    </button>
                                    <span className="px-3 font-bold text-slate-855 text-xs w-6 text-center">{primaryDay.tripleRoomsCount}</span>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setDays(prev => prev.map((item, idx) => req.dayIndices.includes(idx) ? { ...item, tripleRoomsCount: item.tripleRoomsCount + 1 } : item));
                                      }} 
                                      className="px-2 h-full hover:bg-slate-100 font-bold border-l select-none"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    Rate: ₹{selectedHotel.rates.triple}
                                  </span>
                                </div>
                              </div>

                              {/* Quad sharing box */}
                              <div className="bg-slate-50 border p-3 rounded space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-800">Quad Sharing</span>
                                  <span className="text-[9px] text-slate-455 font-bold uppercase">Max 4 / Room</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="inline-flex items-center border border-slate-255 rounded bg-white overflow-hidden h-7">
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setDays(prev => prev.map((item, idx) => req.dayIndices.includes(idx) ? { ...item, quadRoomsCount: Math.max(0, item.quadRoomsCount - 1) } : item));
                                      }} 
                                      className="px-2 h-full hover:bg-slate-100 font-bold border-r select-none"
                                    >
                                      -
                                    </button>
                                    <span className="px-3 font-bold text-slate-855 text-xs w-6 text-center">{primaryDay.quadRoomsCount}</span>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setDays(prev => prev.map((item, idx) => req.dayIndices.includes(idx) ? { ...item, quadRoomsCount: item.quadRoomsCount + 1 } : item));
                                      }} 
                                      className="px-2 h-full hover:bg-slate-100 font-bold border-l select-none"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    Rate: ₹{selectedHotel.rates.quad}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Middle Column: Auto Costs Panel (Requirement 5) */}
                          <div className="space-y-4">
                            <h5 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-widest">Automatic Costing breakdown</h5>
                            
                            <div className="space-y-2.5 text-xs font-semibold text-slate-650 bg-slate-50/50 p-3 border rounded">
                              <div className="flex justify-between">
                                <span>Double Share Cost:</span>
                                <span className="font-bold text-slate-800">₹{costDetails?.doubleCost.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Triple Share Cost:</span>
                                <span className="font-bold text-slate-800">₹{costDetails?.tripleCost.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Quad Share Cost:</span>
                                <span className="font-bold text-slate-800">₹{costDetails?.quadCost.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Meal supplement ({primaryDay.mealPlan}):</span>
                                <span className="font-bold text-slate-800">₹{costDetails?.mealCost.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span>Surcharges (Weekend/Season):</span>
                                <span className="font-bold text-slate-800">₹{costDetails?.extraCharges.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-slate-455 font-bold pt-1.5">
                                <span>Estimated Taxes ({selectedHotel.taxPercent}%):</span>
                                <span>₹{costDetails?.tax.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Override Controls (Requirement 7) */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-widest">Manual override</h5>
                              {primaryDay.overrideApplied && (
                                <button
                                  onClick={() => {
                                    setDays(prev => prev.map((item, idx) => req.dayIndices.includes(idx) ? { ...item, overrideApplied: false } : item));
                                    toast.info("Override reset to automatic calculation.");
                                  }}
                                  className="text-[9px] font-black text-red-600 hover:underline uppercase"
                                >
                                  Reset
                                </button>
                              )}
                            </div>

                            {primaryDay.overrideApplied ? (
                              <div className="space-y-3 bg-red-50/40 border border-red-150 p-3 rounded">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">Agreed Total stay Cost (₹)</span>
                                  <input 
                                    type="number"
                                    value={primaryDay.overrideAmount}
                                    onChange={e => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      setDays(prev => prev.map((item, idx) => req.dayIndices.includes(idx) ? { ...item, overrideAmount: val } : item));
                                    }}
                                    className="w-full text-xs px-2.5 h-8 border rounded focus:outline-none bg-white font-bold text-slate-800"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">Reason for Override</span>
                                  <input 
                                    type="text"
                                    value={primaryDay.overrideReason}
                                    placeholder="Enter discount justification..."
                                    onChange={e => {
                                      const val = e.target.value;
                                      setDays(prev => prev.map((item, idx) => req.dayIndices.includes(idx) ? { ...item, overrideReason: val } : item));
                                    }}
                                    className="w-full text-xs px-2.5 h-8 border rounded focus:outline-none bg-white"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 border border-dashed rounded text-center space-y-2">
                                <p className="text-[10px] text-slate-400 italic">No cost override applied.</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDays(prev => prev.map((item, idx) => req.dayIndices.includes(idx) ? { ...item, overrideApplied: true, overrideAmount: costDetails?.totalCost || 0 } : item));
                                  }}
                                  className="text-[10.5px] font-bold text-blue-600 hover:underline"
                                >
                                  + Apply Override Cost
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* Sticky Right Package Summary (28% equivalent) */}
        <div className="xl:col-span-3 space-y-6 sticky top-4">
          
          <Card className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b pb-2">Package Summary</h4>
            
            <div className="space-y-3.5 text-[11.5px] font-semibold text-slate-600">
              <div className="flex justify-between items-center">
                <span>Total Days:</span>
                <span className="font-bold text-slate-800">{days.length} Days / {days.length - 1} Nights</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Travelers:</span>
                <span className="font-bold text-slate-800">{numAdults + numChildren} Pax</span>
              </div>
            </div>
          </Card>

          <Card className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Price Breakdown</h4>
            </div>

            <div className="space-y-3 text-[11.5px] font-semibold text-slate-655">
              <div className="flex justify-between items-center">
                <span>Stays & Hotels</span>
                <span className="font-bold text-slate-850">₹ {packageTotals.hotels.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Vehicles & Transfers</span>
                <span className="font-bold text-slate-850">₹ {packageTotals.transfers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2.5 font-bold text-slate-800">
                <span>Sub Total</span>
                <span>₹ {packageTotals.subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>GST (5%)</span>
                <span>₹ {packageTotals.gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Service Fee</span>
                <span>₹ {packageTotals.service.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center border-t-2 border-slate-800 pt-3 font-black text-slate-900 text-sm">
                <span>Total Package Price</span>
                <span className="text-[#E11D48] text-base">₹ {packageTotals.total.toLocaleString()}</span>
              </div>

              <div className="bg-[#EEF2FF] text-[#4F46E5] p-3 rounded-[4px] flex justify-between items-center text-[10px] font-bold mt-2">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#4F46E5]" /> Estimated Margin</span>
                <span>₹ {packageTotals.profit.toLocaleString()} (22%)</span>
              </div>
            </div>
          </Card>

          {/* STEP 4: ITINERARY TEXT SUMMARY GENERATOR */}
          <Card className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b pb-2">Itinerary Text Summary</h4>
            
            <textarea 
              readOnly
              value={generatedSummary}
              className="w-full h-48 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded p-3 focus:outline-none resize-none font-mono leading-relaxed"
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedSummary);
                  toast.success("Itinerary summary copied to clipboard!");
                }}
                className="flex-1 h-9 rounded-[4px] bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-[9px] cursor-pointer"
              >
                Copy Text
              </Button>
            </div>
          </Card>

        </div>

      </div>

      {/* ─── VEHICLE CONFIGURATION MODAL ─── */}
      {rateModalVehicle && (
        <Dialog open={!!rateModalVehicle} onOpenChange={() => setRateModalVehicle(null)}>
          <DialogContent className="max-w-md rounded-lg p-5 font-sans">
            <DialogHeader>
              <DialogTitle className="font-bold text-slate-850 text-sm uppercase">{rateModalVehicle.name} Configuration</DialogTitle>
              <DialogDescription className="text-[10px] text-slate-400 font-semibold uppercase">{rateModalVehicle.cap}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <img src={rateModalVehicle.img} className="w-full h-36 object-cover rounded" alt="" />
              <p className="text-xs text-slate-500 font-medium">Standard AC transfers and transit route standby.</p>
              
              <div className="p-3 bg-purple-50 rounded-[4px] flex justify-between items-center text-[11px] font-bold text-purple-800">
                <span>Calculated Total Cost:</span>
                <span>₹{(rateModalVehicle.basePrice + (days.length * rateModalVehicle.perDay)).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" onClick={() => setRateModalVehicle(null)} className="h-8 rounded text-[10px] font-bold">Cancel</Button>
              <Button 
                onClick={() => {
                  setDays(prev => prev.map((item, i) => i === activeDayIdx ? { 
                    ...item, 
                    transfers: `Transport: ${rateModalVehicle.name}`
                  } : item));
                  setRateModalVehicle(null);
                  toast.success(`Vehicle applied for Day ${activeDayIdx + 1}!`);
                }}
                className="h-8 rounded bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase text-[9px] cursor-pointer"
              >
                Apply Vehicle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── ACTIVITY SELECTION MODAL ─── */}
      {rateModalActivity && (
        <Dialog open={!!rateModalActivity} onOpenChange={() => setRateModalActivity(null)}>
          <DialogContent className="max-w-md rounded-lg p-5 font-sans">
            <DialogHeader>
              <DialogTitle className="font-bold text-slate-850 text-sm uppercase">{rateModalActivity.name}</DialogTitle>
              <DialogDescription className="text-[10px] text-slate-400 font-semibold uppercase">{rateModalActivity.city}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="space-y-2 text-xs">
                <p className="flex justify-between border-b pb-1">
                  <span>Adult Rate:</span>
                  <span className="font-bold">₹{rateModalActivity.adultRate}</span>
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-[4px] flex justify-between items-center text-[11px] font-bold text-purple-800">
                <span>Total Cost ({numAdults} Adults):</span>
                <span>₹{(rateModalActivity.adultRate * numAdults).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" onClick={() => setRateModalActivity(null)} className="h-8 rounded text-[10px] font-bold">Cancel</Button>
              <Button 
                onClick={() => {
                  setDays(prev => prev.map((item, i) => i === activeDayIdx ? { 
                    ...item, 
                    activity: rateModalActivity.name
                  } : item));
                  setRateModalActivity(null);
                  toast.success(`Activity added for Day ${activeDayIdx + 1}!`);
                }}
                className="h-8 rounded bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase text-[9px] cursor-pointer"
              >
                Apply Activity
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
