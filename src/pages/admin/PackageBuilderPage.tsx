import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, Plus, Trash2, MapPin, ChevronDown, CheckCircle2,
  Building2, Car, Compass, Coffee, Heart, ArrowRightLeft, FileText,
  Copy, Edit3, Settings, Calendar, RefreshCw, Star, Info, ShieldAlert, Sparkles, X, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// We import the mock data pattern or custom rate calculators to make this a flawless functional package-building workflow
// Let's implement real state management for destination-wise inventory hotels/vehicles/activities rate selection drawers.

const STATE_CITIES: Record<string, string[]> = {
  "Kerala": ["Kochi", "Munnar", "Thekkady", "Alleppey", "Varkala", "Trivandrum"],
  "Himachal Pradesh": ["Manali", "Kasol", "Shimla", "Dharamshala", "Dalhousie", "Spiti"],
  "Goa": ["North Goa", "South Goa", "Panaji", "Calangute", "Palolem"],
  "Ladakh": ["Leh", "Nubra Valley", "Pangong", "Kargil"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer", "Pushkar"],
  "Uttarakhand": ["Rishikesh", "Mussoorie", "Nainital", "Dehradun", "Haridwar"],
  "Kashmir": ["Srinagar", "Gulmarg", "Pahalgam", "Sonmarg"],
};

// Comprehensive Master Inventory
const MASTER_HOTELS = [
  { id: "h1", name: "Holiday Inn Cochin", state: "Kerala", city: "Kochi", rating: "4.5", price: 3300, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80", category: "Standard", extraBed: 1000, maxPeople: 3 },
  { id: "h2", name: "Blanket Hotel & Spa", state: "Kerala", city: "Munnar", rating: "4.7", price: 4800, img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=300&q=80", category: "Premium", extraBed: 1500, maxPeople: 3 },
  { id: "h3", name: "Lake Palace Resort", state: "Kerala", city: "Alleppey", rating: "4.6", price: 6500, img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=300&q=80", category: "Luxury", extraBed: 2000, maxPeople: 3 },
  { id: "h4", name: "Fragrant Nature Resort", state: "Kerala", city: "Varkala", rating: "4.4", price: 4200, img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=300&q=80", category: "Deluxe", extraBed: 1200, maxPeople: 3 },
  
  { id: "h5", name: "Snow Valley Resort", state: "Himachal Pradesh", city: "Manali", rating: "4.5", price: 3800, img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=300&q=80", category: "Deluxe", extraBed: 1100, maxPeople: 3 },
  { id: "h6", name: "The Ridge Kasol", state: "Himachal Pradesh", city: "Kasol", rating: "4.2", price: 2900, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80", category: "Standard", extraBed: 900, maxPeople: 3 },
  { id: "h7", name: "Shimla Haveli", state: "Himachal Pradesh", city: "Shimla", rating: "4.3", price: 3100, img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=300&q=80", category: "Standard", extraBed: 1000, maxPeople: 3 },

  { id: "h8", name: "Taj Exotica Calangute", state: "Goa", city: "Calangute", rating: "4.9", price: 9500, img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=300&q=80", category: "Luxury", extraBed: 2500, maxPeople: 3 },
  { id: "h9", name: "Ocean Palms Resort", state: "Goa", city: "Calangute", rating: "4.4", price: 3500, img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=300&q=80", category: "Standard", extraBed: 1000, maxPeople: 3 }
];

const MASTER_VEHICLES = [
  { id: "v1", name: "Ertiga (AC)", cap: "6+1 Seater", state: "Kerala", basePrice: 8800, perDay: 2200, img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80", description: "Best for standard family road trip" },
  { id: "v2", name: "Innova Crysta (AC)", cap: "6+1 Seater", state: "Kerala", basePrice: 11500, perDay: 3000, img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=200&q=80", description: "Premium executive seating comfort" },
  { id: "v3", name: "Tempo Traveller (AC)", cap: "12 Seater", state: "Kerala", basePrice: 15000, perDay: 4500, img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=200&q=80", description: "Spacious group travel format vehicle" },

  { id: "v4", name: "Innova Crysta (AC)", cap: "6+1 Seater", state: "Himachal Pradesh", basePrice: 13500, perDay: 3500, img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=200&q=80", description: "Mountain drive safety Crysta" },
  { id: "v5", name: "Tempo Traveller (AC)", cap: "12 Seater", state: "Himachal Pradesh", basePrice: 18000, perDay: 5000, img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=200&q=80", description: "Shimla-Manali standard group explorer" }
];

const MASTER_ACTIVITIES = [
  { id: "a1", name: "Fort Kochi Sightseeing Tour", state: "Kerala", city: "Kochi", adultRate: 450, childRate: 200, duration: "3 hours", isShared: true },
  { id: "a2", name: "Mattupetty Dam Speedboat Ride", state: "Kerala", city: "Munnar", adultRate: 350, childRate: 200, duration: "1 hour", isShared: true },
  { id: "a3", name: "Eravikulam National Park Safari", state: "Kerala", city: "Munnar", adultRate: 600, childRate: 400, duration: "3 hours", isShared: true },
  { id: "a4", name: "Alleppey Sunset Houseboat Cruise", state: "Kerala", city: "Alleppey", adultRate: 1500, childRate: 800, duration: "4 hours", isShared: false },

  { id: "a5", name: "Solang Valley Paragliding", state: "Himachal Pradesh", city: "Manali", adultRate: 2500, childRate: 2000, duration: "30 min", isShared: false },
  { id: "a6", name: "Hadimba Temple Walkthrough", state: "Himachal Pradesh", city: "Manali", adultRate: 100, childRate: 50, duration: "2 hours", isShared: true },
  
  { id: "a7", name: "Baga Beach Watersports Combo", state: "Goa", city: "Calangute", adultRate: 1800, childRate: 1500, duration: "3 hours", isShared: true }
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
}

export default function PackageBuilderPage() {
  const navigate = useNavigate();
  
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);



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
      cost: 4000
    };
    setDays([initialDay]);
    toast.success(`Initialized builder for ${dest}!`);
  };

  // Basic Info
  const [custName, setCustName] = useState("Neel Mehta");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [packageName, setPackageName] = useState("Munnar Romantic Getaway");
  const [selectedState, setSelectedState] = useState("Kerala");
  const [departureCity, setDepartureCity] = useState("Mumbai");
  
  const [travelStart, setTravelStart] = useState("2026-07-10");
  const [travelEnd, setTravelEnd] = useState("2026-07-16");
  
  const [numAdults, setNumAdults] = useState(4);
  const [numChildren, setNumChildren] = useState(1);
  const [numCouples, setNumCouples] = useState(1);
  const [numRooms, setNumRooms] = useState(3);
  const [specialNotes, setSpecialNotes] = useState("");

  const [extraAdultWithMattress, setExtraAdultWithMattress] = useState(0);
  const [extraChildWithoutMattress, setExtraChildWithoutMattress] = useState(0);
  const [extraChildWithMattress, setExtraChildWithMattress] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState("None");
  const [pickupFrom, setPickupFrom] = useState("No");
  const [dropTo, setDropTo] = useState("No");
  const [southGoaTour, setSouthGoaTour] = useState("No");
  const [northGoaTour, setNorthGoaTour] = useState("No");
  const [activity1, setActivity1] = useState("None");
  const [activity2, setActivity2] = useState("None");
  const [activity3, setActivity3] = useState("None");
  const [mealPlan, setMealPlan] = useState("MAP");

  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<string>("hotels");

  // Dynamic Day List
  const [days, setDays] = useState<ItineraryDay[]>([
    { day: "01", dayLabel: "Day 1", location: "Kochi", hotel: "Holiday Inn Cochin", roomType: "Standard", mealPlan: "CP", transfers: "Airport Pickup to Cochin Hotel stay", activity: "Fort Kochi Sightseeing Tour", cost: 3300 },
    { day: "02", dayLabel: "Day 2", location: "Munnar", hotel: "Blanket Hotel & Spa", roomType: "Deluxe", mealPlan: "MAP", transfers: "Scenic highway transfer (130 KM)", activity: "Mattupetty Dam Speedboat Ride", cost: 4800 },
    { day: "03", dayLabel: "Day 3", location: "Munnar", hotel: "Blanket Hotel & Spa", roomType: "Deluxe", mealPlan: "MAP", transfers: "Local sightseeing route coverage", activity: "Eravikulam National Park Safari", cost: 4800 },
    { day: "04", dayLabel: "Day 4", location: "Alleppey", hotel: "Lake Palace Resort", roomType: "Premium", mealPlan: "AP", transfers: "Transfer to Houseboat jetty", activity: "Alleppey Sunset Houseboat Cruise", cost: 6500 },
  ]);

  // Calculations for room allocator display
  const calculatedRooms = useMemo(() => {
    // Couple rule: 1 room per couple, remaining adults in triple sharing
    const remainingAdults = Math.max(0, numAdults - (numCouples * 2));
    const tripleSharingRooms = Math.ceil(remainingAdults / 3);
    const childRooms = numChildren > 0 && remainingAdults === 0 ? 1 : 0;
    return numCouples + tripleSharingRooms + childRooms;
  }, [numAdults, numCouples, numChildren]);

  useEffect(() => {
    setNumRooms(calculatedRooms);
  }, [calculatedRooms]);

  // Rate-on-click Modals
  const [rateModalHotel, setRateModalHotel] = useState<any>(null);
  const [rateModalVehicle, setRateModalVehicle] = useState<any>(null);
  const [rateModalActivity, setRateModalActivity] = useState<any>(null);

  // Rate select config values
  const [selRoomType, setSelRoomType] = useState("Standard");
  const [selMealPlan, setSelMealPlan] = useState("CP");
  const [extraMattressCount, setExtraMattressCount] = useState(0);

  const [selQty, setSelQty] = useState(1);

  // Filter lists based on selected destination state
  const stateHotels = useMemo(() => MASTER_HOTELS.filter(h => h.state === selectedState), [selectedState]);
  const stateVehicles = useMemo(() => MASTER_VEHICLES.filter(v => v.state === selectedState), [selectedState]);
  const stateActivities = useMemo(() => MASTER_ACTIVITIES.filter(a => a.state === selectedState), [selectedState]);

  // Recalculate package totals
  const packageTotals = useMemo(() => {
    let hotelSum = 0;
    let transferSum = 0;
    let activitySum = 0;
    let mealSum = 0;

    days.forEach(d => {
      // Find hotel base rate
      const hotelObj = stateHotels.find(h => h.name === d.hotel);
      if (hotelObj) {
        hotelSum += (hotelObj.price * numRooms) + (extraMattressCount * hotelObj.extraBed);
      } else if (d.hotel) {
        hotelSum += 3000 * numRooms; // Fallback rate
      }

      if (d.activity) {
        const actObj = stateActivities.find(a => a.name === d.activity);
        if (actObj) {
          activitySum += (actObj.adultRate * numAdults) + (actObj.childRate * numChildren);
        } else {
          activitySum += 500; // Fallback activity cost
        }
      }
    });

    // Transport vehicle logic
    const activeVehicle = stateVehicles[0];
    if (activeVehicle) {
      transferSum += activeVehicle.basePrice + (days.length * activeVehicle.perDay);
    } else {
      transferSum += 8000 + (days.length * 2000);
    }

    const subTotal = hotelSum + transferSum + activitySum + mealSum;
    const gst = Math.round(subTotal * 0.05);
    const service = 1200;
    const total = subTotal + gst + service;
    const profit = Math.round(total * 0.22);

    return {
      hotels: hotelSum,
      transfers: transferSum,
      activities: activitySum,
      meals: mealSum,
      subTotal,
      gst,
      service,
      total,
      profit
    };
  }, [days, numRooms, numAdults, numChildren, selectedState, stateHotels, stateVehicles, stateActivities]);

  const generatedSummary = useMemo(() => {
    // Parse Dates
    const start = new Date(travelStart);
    const end = new Date(travelEnd);
    const timeDiff = end.getTime() - start.getTime();
    const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    };

    const formattedStart = formatDate(travelStart);
    const formattedEnd = formatDate(travelEnd);

    // Build Inclusions
    const incl: string[] = [];
    incl.push(`👉 ${nights} Nights in AC room`);
    
    if (mealPlan === "CP") {
      incl.push(`👉 ${nights} Breakfast`);
    } else if (mealPlan === "MAP") {
      incl.push(`👉 ${nights} Breakfast  ${nights} Dinner`);
    } else if (mealPlan === "AP") {
      incl.push(`👉 ${nights} Breakfast  ${nights} Lunch  ${nights} Dinner`);
    }

    const vehName = selectedVehicle === "None" ? "Standard Vehicle" : selectedVehicle;

    if (pickupFrom && pickupFrom !== "No") {
      incl.push(`👉 Pickup from ${pickupFrom} (${vehName})`);
    }
    if (dropTo && dropTo !== "No") {
      incl.push(`👉 Drop to ${dropTo} (${vehName})`);
    }
    if (southGoaTour && southGoaTour !== "No") {
      incl.push(`👉 South Goa tour PVT (${vehName})`);
    }
    if (northGoaTour && northGoaTour !== "No") {
      incl.push(`👉 North Goa tour PVT (${vehName})`);
    }
    if (activity1 && activity1 !== "None") {
      incl.push(`👉 ${activity1}`);
    }
    if (activity2 && activity2 !== "None") {
      incl.push(`👉 ${activity2}`);
    }
    if (activity3 && activity3 !== "None") {
      incl.push(`👉 ${activity3}`);
    }

    // Build Hotel Options Section
    const hotelOptions: string[] = [];
    const uniqueHotelNames = Array.from(new Set(days.map(d => d.hotel).filter(h => h && h !== "Select Stay Hotel")));
    
    uniqueHotelNames.forEach((hotelName, index) => {
      const hotelObj = stateHotels.find(h => h.name === hotelName);
      const roomType = "Deluxe Room"; // Fallback
      const maxPeople = hotelObj?.maxPeople || 3;
      const ratePerCouple = Math.round(packageTotals.total / (numCouples || 1));
      
      hotelOptions.push(`${index + 1}️⃣ *${hotelName} (${roomType} - Max ${maxPeople} Pax)*
Photos: ${hotelObj?.img || "https://bit.ly/4gLk0BP"}

${ratePerCouple}/- per couple
*Total Price ${packageTotals.total}/-*`);
    });

    const hotelSection = hotelOptions.length > 0 
      ? `\nHotel Options:\n\n${hotelOptions.join("\n\n")}`
      : "";

    const today = new Date();
    const formattedToday = today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    return `As per your requirements, find the rates below.

Check in: ${formattedStart || "TBD"}
Check out: ${formattedEnd || "TBD"}
Meal plan: ${mealPlan}
No. of rooms: ${numRooms} room
No. of pax: ${numAdults + numChildren} (${numCouples} couple)

Inclusions:
${incl.join("\n")}
${hotelSection}

Note:
👉 Given Photos are mix category of rooms as per hotel website
👉 According to Goa Govt. new guideline, there is no carrier on any vehicle
👉 Rooms will be subject to availability at the time of booking
👉 Please note wherever parking charge is applicable during Sightseeing are to be paid by the Guest.
👉 Please note that We have calculate above 6 yrs person in activity, If you have below 6 yrs child than check activity policy for charge
👉 Rates are valid for Baga, Calangute & Candolim locations Only.

Quotation Date: ${formattedToday}
hemal patel-+91 88666 99409`;
  }, [travelStart, travelEnd, mealPlan, numRooms, numAdults, numChildren, numCouples, selectedVehicle, pickupFrom, dropTo, southGoaTour, northGoaTour, activity1, activity2, activity3, days, stateHotels, packageTotals]);

  // Validation rules
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (!custName.trim()) errs.push("Customer Name is mandatory.");
    if (!phone.trim()) errs.push("Valid contact phone number is required.");
    if (!packageName.trim()) errs.push("Package name cannot be empty.");
    if (days.length === 0) errs.push("Itinerary must contain at least 1 day.");
    
    // Check if each day has stay and location
    days.forEach((d, idx) => {
      if (!d.location.trim()) errs.push(`Day ${idx + 1} city location is missing.`);
      if (!d.hotel) errs.push(`Day ${idx + 1} stay hotel is not assigned.`);
    });

    return errs;
  }, [custName, phone, packageName, days]);

  const handleConvertToQuotation = () => {
    if (validationErrors.length > 0) {
      toast.error("Please resolve validation errors before generating quotation.");
      return;
    }
    toast.success("Converting Day-Wise Itinerary parameters into Quotation System...");
    const serializedDays = encodeURIComponent(JSON.stringify(days));
    navigate(`/admin/quotations/new?name=${encodeURIComponent(custName)}&phone=${encodeURIComponent(phone)}&destination=${encodeURIComponent(selectedState)}&days=${serializedDays}`);
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
      hotel: stateHotels[0]?.name || "Select Stay Hotel",
      roomType: "Standard",
      mealPlan: "CP",
      transfers: "Scenic transfer route stand-by",
      activity: stateActivities[0]?.name || "Local sightseeing explorer",
      cost: 4000
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
        {/* ─── Top Control Header Action Bar ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 bg-white -mx-6 -mt-6 p-5 border-b border-[#E2E8F0] gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-650" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Select Package Destination</h1>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Choose a destination region to launch the day-wise itinerary builder</p>
            </div>
          </div>
        </div>

        {/* DESTINATIONS GRID Choices */}
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
          <Button variant="outline" onClick={() => navigate("/admin/master-database")} className="h-9 rounded-[4px] border-slate-200 text-slate-650 hover:bg-slate-50 font-bold uppercase text-[10px] cursor-pointer">
            Manage Inventory
          </Button>
          <Button variant="outline" onClick={handleClearAll} className="h-9 rounded-[4px] border-red-200 text-red-650 hover:bg-red-50 font-bold uppercase text-[10px] cursor-pointer">
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

      {/* ─── Rebuild Layout Grid ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Main Workspace (72% equivalent) */}
        <div className="xl:col-span-9 space-y-6">
          
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
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Couples Count</span>
                <Input type="number" value={numCouples} onChange={e => setNumCouples(parseInt(e.target.value) || 0)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Extra adult with mattress</span>
                <Input type="number" value={extraAdultWithMattress} onChange={e => setExtraAdultWithMattress(parseInt(e.target.value) || 0)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Extra child without mattress</span>
                <Input type="number" value={extraChildWithoutMattress} onChange={e => setExtraChildWithoutMattress(parseInt(e.target.value) || 0)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Extra child with mattress</span>
                <Input type="number" value={extraChildWithMattress} onChange={e => setExtraChildWithMattress(parseInt(e.target.value) || 0)} className="h-9 text-xs font-semibold text-slate-800 rounded-[4px] border-slate-200" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Meal Plan</span>
                <select 
                  value={mealPlan} 
                  onChange={e => setMealPlan(e.target.value)}
                  className="w-full h-9 text-xs font-semibold text-slate-800 rounded-[4px] border border-slate-200 px-2 bg-white focus:outline-none"
                >
                  <option value="EP">EP</option>
                  <option value="CP">CP</option>
                  <option value="MAP">MAP</option>
                  <option value="AP">AP</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Vehicle</span>
                <select 
                  value={selectedVehicle} 
                  onChange={e => setSelectedVehicle(e.target.value)}
                  className="w-full h-9 text-xs font-semibold text-slate-800 rounded-[4px] border border-slate-200 px-2 bg-white focus:outline-none"
                >
                  <option value="None">Select Vehicle</option>
                  <option value="Ertiga">Ertiga (AC)</option>
                  <option value="Innova">Innova Crysta (AC)</option>
                  <option value="Tempo">Tempo Traveller (AC)</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Pickup From</span>
                <select 
                  value={pickupFrom} 
                  onChange={e => setPickupFrom(e.target.value)}
                  className="w-full h-9 text-xs font-semibold text-slate-800 rounded-[4px] border border-slate-200 px-2 bg-white focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Airport">Airport</option>
                  <option value="Railway Station">Railway Station</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Drop to</span>
                <select 
                  value={dropTo} 
                  onChange={e => setDropTo(e.target.value)}
                  className="w-full h-9 text-xs font-semibold text-slate-800 rounded-[4px] border border-slate-200 px-2 bg-white focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Airport">Airport</option>
                  <option value="Railway Station">Railway Station</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">South Goa tour</span>
                <select 
                  value={southGoaTour} 
                  onChange={e => setSouthGoaTour(e.target.value)}
                  className="w-full h-9 text-xs font-semibold text-slate-800 rounded-[4px] border border-slate-200 px-2 bg-white focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">South/North Goa tour</span>
                <select 
                  value={northGoaTour} 
                  onChange={e => setNorthGoaTour(e.target.value)}
                  className="w-full h-9 text-xs font-semibold text-slate-800 rounded-[4px] border border-slate-200 px-2 bg-white focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Activity 1</span>
                <select 
                  value={activity1} 
                  onChange={e => setActivity1(e.target.value)}
                  className="w-full h-9 text-xs font-semibold text-slate-800 rounded-[4px] border border-slate-200 px-2 bg-white focus:outline-none"
                >
                  <option value="None">Select Activity</option>
                  <option value="Sightseeing">Local sightseeing explorer</option>
                  <option value="Speedboat">Mattupetty Dam Speedboat Ride</option>
                  <option value="Safari">Eravikulam National Park Safari</option>
                  <option value="Cruise">Alleppey Sunset Houseboat Cruise</option>
                  <option value="Paragliding">Solang Valley Paragliding</option>
                  <option value="Watersports">Baga Beach Watersports Combo</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Activity 2</span>
                <select 
                  value={activity2} 
                  onChange={e => setActivity2(e.target.value)}
                  className="w-full h-9 text-xs font-semibold text-slate-800 rounded-[4px] border border-slate-200 px-2 bg-white focus:outline-none"
                >
                  <option value="None">Select Activity</option>
                  <option value="Sightseeing">Local sightseeing explorer</option>
                  <option value="Speedboat">Mattupetty Dam Speedboat Ride</option>
                  <option value="Safari">Eravikulam National Park Safari</option>
                  <option value="Cruise">Alleppey Sunset Houseboat Cruise</option>
                  <option value="Paragliding">Solang Valley Paragliding</option>
                  <option value="Watersports">Baga Beach Watersports Combo</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Activity 3</span>
                <select 
                  value={activity3} 
                  onChange={e => setActivity3(e.target.value)}
                  className="w-full h-9 text-xs font-semibold text-slate-800 rounded-[4px] border border-slate-200 px-2 bg-white focus:outline-none"
                >
                  <option value="None">Select Activity</option>
                  <option value="Sightseeing">Local sightseeing explorer</option>
                  <option value="Speedboat">Mattupetty Dam Speedboat Ride</option>
                  <option value="Safari">Eravikulam National Park Safari</option>
                  <option value="Cruise">Alleppey Sunset Houseboat Cruise</option>
                  <option value="Paragliding">Solang Valley Paragliding</option>
                  <option value="Watersports">Baga Beach Watersports Combo</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-purple-50 text-purple-700 border border-purple-100 rounded-[4px] flex flex-col md:flex-row md:items-center justify-between text-xs font-bold gap-2">
              <span className="flex items-center gap-1.5"><Info className="w-4.5 h-4.5 text-purple-500" /> Auto Room Rules: 1 private room per couple + remaining in triple sharing rooms.</span>
              <span className="bg-purple-100 px-3 py-1 rounded text-purple-800 text-[11px]">Calculated Target: {numRooms} Rooms</span>
            </div>
          </Card>

          {/* STEP 2: DAY-WISE ITINERARY BUILDER FIRST */}
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

                  {/* Day Editable Card */}
                  <div className={cn(
                    "flex-1 bg-white border rounded-[4px] p-4 space-y-3.5 shadow-2xs transition-colors",
                    activeDayIdx === idx ? "border-[#E11D48]" : "border-slate-200 hover:border-slate-300"
                  )}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#E11D48]" />
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide shrink-0">Stay City:</span>
                        <input 
                          value={d.location} 
                          onChange={e => {
                            const val = e.target.value;
                            setDays(prev => prev.map((item, i) => i === idx ? { ...item, location: val } : item));
                          }}
                          className="font-bold text-slate-800 text-xs focus:outline-none border-b border-dashed border-slate-350 focus:border-[#E11D48] bg-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveDay(idx); }} className="h-7 w-7 text-slate-400 hover:bg-slate-50 rounded flex items-center justify-center border border-slate-150 cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {d.hotel ? (
                        <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded border border-slate-150">
                          <Building2 className="w-4.5 h-4.5 text-[#E11D48] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-700 truncate text-[11px]">{d.hotel}</p>
                            <p className="text-[9px] text-slate-455 font-bold uppercase">{d.roomType} • {d.mealPlan}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 border border-dashed border-slate-300 rounded text-center text-slate-400 font-bold text-[10px]">No Stay Hotel Selected</div>
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
                Add Services to Selected Day (Active selection: Day {activeDayIdx + 1})
              </h3>
            </div>

            {/* Sub Tabs */}
            <div className="flex bg-slate-50 rounded-[4px] border border-[#E2E8F0] p-1 font-semibold text-slate-500 max-w-fit">
              {[
                { id: "hotels", label: "Hotels", icon: Building2 },
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

            {/* Grid List with Filters */}
            {activeSubTab === "hotels" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stateHotels.map((item, idx) => (
                  <Card 
                    key={idx} 
                    onClick={() => setRateModalHotel(item)}
                    className="rounded-[4px] border border-slate-200 overflow-hidden shadow-xs cursor-pointer hover:border-[#E11D48] transition-all relative group bg-white"
                  >
                    <img src={item.img} className="w-full h-36 object-cover" alt="" />
                    <div className="p-3.5 space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 truncate text-[11.5px]">{item.name}</h4>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] bg-slate-100 border text-slate-500 uppercase">{item.category}</span>
                      </div>
                      <p className="text-[10px] text-slate-450 font-semibold">{item.city} • ⭐ {item.rating}</p>
                      <div className="pt-2 border-t flex justify-between items-center text-[10px] text-slate-400 font-bold">
                        <span>Base Rate:</span>
                        <span className="font-black text-slate-800 text-[11px]">₹{item.price} / night</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeSubTab === "vehicles" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stateVehicles.map((item, idx) => (
                  <Card 
                    key={idx} 
                    onClick={() => setRateModalVehicle(item)}
                    className="rounded-[4px] border border-slate-200 p-4 flex gap-4 items-center shadow-xs cursor-pointer hover:border-[#E11D48] transition-all bg-white"
                  >
                    <img src={item.img} className="w-20 h-14 object-cover rounded" alt="" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-[11.5px] truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate-450 font-semibold mt-0.5">{item.cap} • AC System</p>
                      <p className="font-black text-[#E11D48] mt-1">₹{item.basePrice.toLocaleString()} Base</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeSubTab === "activities" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stateActivities.map((item, idx) => (
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
                <span>Rooms allocated:</span>
                <span className="font-bold text-slate-800">{numRooms} Rooms</span>
              </div>
            </div>
          </Card>

          <Card className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Price Breakdown</h4>
            </div>

            <div className="space-y-3 text-[11.5px] font-semibold text-slate-650">
              <div className="flex justify-between items-center">
                <span>Stays ({numRooms} Rooms)</span>
                <span className="font-bold text-slate-800">₹ {packageTotals.hotels.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Vehicles & Transfers</span>
                <span className="font-bold text-slate-800">₹ {packageTotals.transfers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Activities</span>
                <span className="font-bold text-slate-800">₹ {packageTotals.activities.toLocaleString()}</span>
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
              className="w-full h-64 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded p-3 focus:outline-none resize-none font-mono leading-relaxed"
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
              <Button 
                onClick={handleConvertToQuotation}
                disabled={validationErrors.length > 0}
                className={cn(
                  "flex-1 h-9 rounded-[4px] font-bold uppercase text-[9px] cursor-pointer shadow-sm",
                  validationErrors.length > 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#E11D48] hover:bg-[#BE123C] text-white"
                )}
              >
                Convert to Quotation
              </Button>
            </div>
          </Card>

        </div>

      </div>

      {/* ─── HOTEL RATE SELECTION DRAWER/MODAL ─── */}
      {rateModalHotel && (
        <Dialog open={!!rateModalHotel} onOpenChange={() => setRateModalHotel(null)}>
          <DialogContent className="max-w-md rounded-lg p-5 font-sans">
            <DialogHeader>
              <DialogTitle className="font-bold text-slate-850 text-sm uppercase">{rateModalHotel.name} Rate Details</DialogTitle>
              <DialogDescription className="text-[10px] text-slate-400 font-semibold uppercase">{rateModalHotel.city} • Category: {rateModalHotel.category}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <img src={rateModalHotel.img} className="w-full h-36 object-cover rounded" alt="" />
              
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Select Room Type</span>
                  <select 
                    value={selRoomType} 
                    onChange={(e) => setSelRoomType(e.target.value)}
                    className="w-full h-8 border rounded px-2 bg-white focus:outline-none"
                  >
                    <option value="Standard">Standard Room</option>
                    <option value="Deluxe">Deluxe Room</option>
                    <option value="Premium">Premium Suite</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Meal Plan</span>
                  <select 
                    value={selMealPlan} 
                    onChange={(e) => setSelMealPlan(e.target.value)}
                    className="w-full h-8 border rounded px-2 bg-white focus:outline-none"
                  >
                    <option value="EP">EP (Room Only)</option>
                    <option value="CP">CP (Breakfast)</option>
                    <option value="MAP">MAP (B+D)</option>
                    <option value="AP">AP (All Meals)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-[4px] flex justify-between items-center text-[11px] font-bold text-purple-800">
                <span>Stay Price per room/night:</span>
                <span>₹{rateModalHotel.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" onClick={() => setRateModalHotel(null)} className="h-8 rounded text-[10px] font-bold">Cancel</Button>
              <Button 
                onClick={() => {
                  setDays(prev => prev.map((item, i) => i === activeDayIdx ? { 
                    ...item, 
                    hotel: rateModalHotel.name, 
                    roomType: selRoomType,
                    mealPlan: selMealPlan
                  } : item));
                  setRateModalHotel(null);
                  toast.success(`Hotel updated for Day ${activeDayIdx + 1}!`);
                }}
                className="h-8 rounded bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase text-[9px] cursor-pointer"
              >
                Apply Stay
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── VEHICLE RATE SELECTION DRAWER/MODAL ─── */}
      {rateModalVehicle && (
        <Dialog open={!!rateModalVehicle} onOpenChange={() => setRateModalVehicle(null)}>
          <DialogContent className="max-w-md rounded-lg p-5 font-sans">
            <DialogHeader>
              <DialogTitle className="font-bold text-slate-850 text-sm uppercase">{rateModalVehicle.name} Configuration</DialogTitle>
              <DialogDescription className="text-[10px] text-slate-400 font-semibold uppercase">{rateModalVehicle.cap}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <img src={rateModalVehicle.img} className="w-full h-36 object-cover rounded" alt="" />
              <p className="text-xs text-slate-500 font-medium">{rateModalVehicle.description}</p>
              
              <div className="p-3 bg-purple-50 rounded-[4px] flex justify-between items-center text-[11px] font-bold text-purple-800">
                <span>Calculated Total Transport Cost:</span>
                <span>₹{(rateModalVehicle.basePrice + (days.length * rateModalVehicle.perDay)).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" onClick={() => setRateModalVehicle(null)} className="h-8 rounded text-[10px] font-bold">Cancel</Button>
              <Button 
                onClick={() => {
                  setDays(prev => prev.map((item, i) => i === activeDayIdx ? { 
                    ...item, 
                    transfers: `Transport standby: ${rateModalVehicle.name} (${rateModalVehicle.cap})`
                  } : item));
                  setRateModalVehicle(null);
                  toast.success(`Vehicle route updated for Day ${activeDayIdx + 1}!`);
                }}
                className="h-8 rounded bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase text-[9px] cursor-pointer"
              >
                Apply Vehicle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── ACTIVITY RATE SELECTION DRAWER/MODAL ─── */}
      {rateModalActivity && (
        <Dialog open={!!rateModalActivity} onOpenChange={() => setRateModalActivity(null)}>
          <DialogContent className="max-w-md rounded-lg p-5 font-sans">
            <DialogHeader>
              <DialogTitle className="font-bold text-slate-850 text-sm uppercase">{rateModalActivity.name}</DialogTitle>
              <DialogDescription className="text-[10px] text-slate-400 font-semibold uppercase">{rateModalActivity.city} • {rateModalActivity.duration}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="space-y-2 text-xs">
                <p className="flex justify-between border-b pb-1">
                  <span>Adult Rate:</span>
                  <span className="font-bold">₹{rateModalActivity.adultRate}</span>
                </p>
                <p className="flex justify-between">
                  <span>Child Rate:</span>
                  <span className="font-bold">₹{rateModalActivity.childRate}</span>
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-[4px] flex justify-between items-center text-[11px] font-bold text-purple-800">
                <span>Total Cost ({numAdults} Adults + {numChildren} Kids):</span>
                <span>₹{((rateModalActivity.adultRate * numAdults) + (rateModalActivity.childRate * numChildren)).toLocaleString()}</span>
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
