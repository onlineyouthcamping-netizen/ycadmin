import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Search, Plus, Pencil, Trash2, MapPin, Building2, Car, Compass, Coffee, Users, ChevronDown, 
  Filter, RotateCw, X, Save, Eye, ChevronRight, ArrowRightLeft, UtensilsCrossed, UserCheck, Copy,
  MoreVertical, FileText, ShieldAlert
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type CategoryId = "destinations" | "hotels" | "vehicles" | "activities" | "transfers" | "meals" | "vendors";

interface MasterRecord {
  id: string;
  category: CategoryId;
  name: string;
  status: "Active" | "Inactive";
  state: string;
  city: string;
  lastUpdated: string;
  updatedBy: string;
  // Hotel fields
  hotelCategory?: string;
  roomType?: string;
  maxPeople?: number;
  mealPlan?: string;
  basePrice?: number;
  weekendPrice?: number;
  peakPrice?: number;
  extraMattress?: number;
  extraAdult?: number;
  childWithBed?: number;
  childWithoutBed?: number;
  vendorName?: string;
  // Vehicle fields
  vehicleType?: string;
  seatingCapacity?: number;
  acType?: string;
  priceType?: string;
  pricePerDay?: number;
  pricePerKm?: number;
  fixedRoutePrice?: number;
  minKmPerDay?: number;
  driverAllowance?: number;
  fuelIncluded?: boolean;
  tollIncluded?: boolean;
  // Activity fields
  adultRate?: number;
  childRate?: number;
  duration?: string;
  activityType?: string;
  // Transfer fields
  fromCity?: string;
  toCity?: string;
  distanceKm?: number;
  travelTime?: string;
  transferRate?: number;
  perKmRate?: number;
  // Meal fields
  mealType?: string;
  mealCost?: number;
  // Vendor fields
  contactPerson?: string;
  contactPhone?: string;
  vendorType?: string;
  // Destination fields
  cities?: string;
  region?: string;
}

/* ═══════════════════════════════════════════════════════════════
   SEED DATA
   ═══════════════════════════════════════════════════════════════ */
const STATES = [
  "Himachal Pradesh", "Kerala", "Maharashtra", "Goa", "Ladakh", 
  "Rajasthan", "Uttarakhand", "Kashmir", "Karnataka", "Tamil Nadu"
];

const STATE_CITIES: Record<string, string[]> = {
  "Himachal Pradesh": ["Manali", "Kasol", "Shimla", "Dharamshala", "Dalhousie", "Spiti"],
  "Kerala": ["Kochi", "Munnar", "Thekkady", "Alleppey", "Varkala", "Trivandrum"],
  "Maharashtra": ["Mumbai", "Lonavala", "Mahabaleshwar", "Alibaug", "Pune"],
  "Goa": ["North Goa", "South Goa", "Panaji", "Calangute", "Palolem"],
  "Ladakh": ["Leh", "Nubra Valley", "Pangong", "Kargil"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer", "Pushkar"],
  "Uttarakhand": ["Rishikesh", "Mussoorie", "Nainital", "Dehradun", "Haridwar"],
  "Kashmir": ["Srinagar", "Gulmarg", "Pahalgam", "Sonmarg"],
  "Karnataka": ["Bangalore", "Coorg", "Mysore", "Hampi", "Gokarna"],
  "Tamil Nadu": ["Chennai", "Ooty", "Kodaikanal", "Pondicherry", "Madurai"],
};

const HOTEL_CATEGORIES = ["Budget", "Standard", "Deluxe", "Premium", "Luxury"];
const ROOM_TYPES = ["Standard", "Deluxe", "Super Deluxe", "Premium", "Suite"];
const MEAL_PLANS = ["EP", "CP", "MAP", "AP"];
const VEHICLE_TYPES = ["Ertiga", "Innova", "Crysta", "Tempo Traveller", "Bus", "Volvo", "Sedan"];
const AC_TYPES = ["AC", "Non-AC"];
const PRICE_TYPES = ["Per Day", "Per KM", "Fixed Route", "Airport Pickup/Drop", "Railway Pickup/Drop"];

let _idCounter = 100;
const genId = () => `MR-${++_idCounter}`;

const INITIAL_RECORDS: MasterRecord[] = [
  // Destinations
  { id: "MR-1", category: "destinations", name: "Himachal Pradesh", status: "Active", state: "Himachal Pradesh", city: "", region: "North India", cities: "Manali, Kasol, Shimla, Dharamshala, Dalhousie, Spiti", lastUpdated: "07 Jul 2025 11:30 AM", updatedBy: "Admin" },
  { id: "MR-2", category: "destinations", name: "Kerala", status: "Active", state: "Kerala", city: "", region: "South India", cities: "Kochi, Munnar, Thekkady, Alleppey, Varkala, Trivandrum", lastUpdated: "07 Jul 2025 10:45 AM", updatedBy: "Admin" },
  { id: "MR-3", category: "destinations", name: "Goa", status: "Active", state: "Goa", city: "", region: "West India", cities: "North Goa, South Goa, Panaji, Calangute, Palolem", lastUpdated: "07 Jul 2025 09:00 AM", updatedBy: "Admin" },
  { id: "MR-4", category: "destinations", name: "Rajasthan", status: "Active", state: "Rajasthan", city: "", region: "West India", cities: "Jaipur, Udaipur, Jodhpur, Jaisalmer, Pushkar", lastUpdated: "06 Jul 2025 04:15 PM", updatedBy: "Admin" },
  { id: "MR-5", category: "destinations", name: "Uttarakhand", status: "Active", state: "Uttarakhand", city: "", region: "North India", cities: "Rishikesh, Mussoorie, Nainital, Dehradun, Haridwar", lastUpdated: "06 Jul 2025 03:20 PM", updatedBy: "Admin" },
  // Hotels
  { id: "MR-10", category: "hotels", name: "Blanket Hotel & Spa", status: "Active", state: "Kerala", city: "Munnar", hotelCategory: "Premium", roomType: "Deluxe", maxPeople: 3, mealPlan: "MAP", basePrice: 4500, weekendPrice: 5200, peakPrice: 6800, extraMattress: 1000, extraAdult: 1200, childWithBed: 800, childWithoutBed: 0, vendorName: "Blanket Hospitality Pvt Ltd", lastUpdated: "07 Jul 2025 09:15 AM", updatedBy: "Hemal" },
  { id: "MR-11", category: "hotels", name: "Holiday Inn Cochin", status: "Active", state: "Kerala", city: "Kochi", hotelCategory: "Standard", roomType: "Standard", maxPeople: 3, mealPlan: "CP", basePrice: 3300, weekendPrice: 3800, peakPrice: 4500, extraMattress: 800, extraAdult: 900, childWithBed: 600, childWithoutBed: 0, vendorName: "IHG Hotels Kerala", lastUpdated: "07 Jul 2025 08:45 AM", updatedBy: "Hetvi" },
  { id: "MR-12", category: "hotels", name: "The Leela Palace", status: "Active", state: "Goa", city: "South Goa", hotelCategory: "Luxury", roomType: "Suite", maxPeople: 2, mealPlan: "AP", basePrice: 12000, weekendPrice: 15000, peakPrice: 18000, extraMattress: 2000, extraAdult: 3000, childWithBed: 1500, childWithoutBed: 500, vendorName: "Leela Hotels Group", lastUpdated: "06 Jul 2025 05:30 PM", updatedBy: "Hemal" },
  { id: "MR-13", category: "hotels", name: "Snow Valley Resort", status: "Active", state: "Himachal Pradesh", city: "Manali", hotelCategory: "Deluxe", roomType: "Deluxe", maxPeople: 3, mealPlan: "MAP", basePrice: 3800, weekendPrice: 4500, peakPrice: 5500, extraMattress: 900, extraAdult: 1000, childWithBed: 700, childWithoutBed: 0, vendorName: "Snow Valley Hospitality", lastUpdated: "06 Jul 2025 02:00 PM", updatedBy: "Parth" },
  { id: "MR-14", category: "hotels", name: "Zostel Kasol", status: "Active", state: "Himachal Pradesh", city: "Kasol", hotelCategory: "Budget", roomType: "Standard", maxPeople: 4, mealPlan: "EP", basePrice: 1200, weekendPrice: 1500, peakPrice: 2000, extraMattress: 400, extraAdult: 500, childWithBed: 300, childWithoutBed: 0, vendorName: "Zostel Hostels", lastUpdated: "05 Jul 2025 11:00 AM", updatedBy: "Hetvi" },
  // Vehicles
  { id: "MR-20", category: "vehicles", name: "Innova Crysta (AC)", status: "Active", state: "Kerala", city: "Kochi", vehicleType: "Crysta", seatingCapacity: 7, acType: "AC", priceType: "Per Day", pricePerDay: 3000, pricePerKm: 14, minKmPerDay: 250, driverAllowance: 400, fuelIncluded: true, tollIncluded: false, vendorName: "Kerala Cabs Pvt Ltd", lastUpdated: "07 Jul 2025 08:00 AM", updatedBy: "Parth" },
  { id: "MR-21", category: "vehicles", name: "Ertiga (AC)", status: "Active", state: "Kerala", city: "Kochi", vehicleType: "Ertiga", seatingCapacity: 7, acType: "AC", priceType: "Per Day", pricePerDay: 2200, pricePerKm: 12, minKmPerDay: 200, driverAllowance: 300, fuelIncluded: true, tollIncluded: false, vendorName: "Kerala Cabs Pvt Ltd", lastUpdated: "07 Jul 2025 07:45 AM", updatedBy: "Parth" },
  { id: "MR-22", category: "vehicles", name: "Tempo Traveller 12-Seater (AC)", status: "Active", state: "Himachal Pradesh", city: "Manali", vehicleType: "Tempo Traveller", seatingCapacity: 12, acType: "AC", priceType: "Per Day", pricePerDay: 4500, pricePerKm: 18, minKmPerDay: 200, driverAllowance: 500, fuelIncluded: true, tollIncluded: true, vendorName: "Himalayan Transport", lastUpdated: "06 Jul 2025 06:00 PM", updatedBy: "Hemal" },
  // Activities
  { id: "MR-30", category: "activities", name: "Mattupetty Dam Boating", status: "Active", state: "Kerala", city: "Munnar", adultRate: 350, childRate: 200, duration: "1 hour", activityType: "Shared", lastUpdated: "07 Jul 2025 10:00 AM", updatedBy: "Hetvi" },
  { id: "MR-31", category: "activities", name: "Solang Valley Paragliding", status: "Active", state: "Himachal Pradesh", city: "Manali", adultRate: 2500, childRate: 0, duration: "30 min", activityType: "Private", lastUpdated: "06 Jul 2025 03:00 PM", updatedBy: "Parth" },
  { id: "MR-32", category: "activities", name: "Alleppey Houseboat Cruise", status: "Active", state: "Kerala", city: "Alleppey", adultRate: 4500, childRate: 2000, duration: "Full Day", activityType: "Private", lastUpdated: "07 Jul 2025 09:30 AM", updatedBy: "Hemal" },
  { id: "MR-33", category: "activities", name: "Dudhsagar Falls Trek", status: "Active", state: "Goa", city: "South Goa", adultRate: 1800, childRate: 900, duration: "4 hours", activityType: "Shared", lastUpdated: "06 Jul 2025 01:00 PM", updatedBy: "Hetvi" },
  // Transfers
  { id: "MR-40", category: "transfers", name: "Kochi → Munnar", status: "Active", state: "Kerala", city: "Kochi", fromCity: "Kochi", toCity: "Munnar", distanceKm: 130, travelTime: "4 hrs", transferRate: 3500, perKmRate: 14, lastUpdated: "07 Jul 2025 07:30 AM", updatedBy: "Parth" },
  { id: "MR-41", category: "transfers", name: "Munnar → Thekkady", status: "Active", state: "Kerala", city: "Munnar", fromCity: "Munnar", toCity: "Thekkady", distanceKm: 110, travelTime: "3.5 hrs", transferRate: 3000, perKmRate: 14, lastUpdated: "07 Jul 2025 07:20 AM", updatedBy: "Parth" },
  { id: "MR-42", category: "transfers", name: "Thekkady → Alleppey", status: "Active", state: "Kerala", city: "Thekkady", fromCity: "Thekkady", toCity: "Alleppey", distanceKm: 140, travelTime: "4 hrs", transferRate: 3800, perKmRate: 14, lastUpdated: "07 Jul 2025 07:10 AM", updatedBy: "Parth" },
  { id: "MR-43", category: "transfers", name: "Manali → Rohtang Pass", status: "Active", state: "Himachal Pradesh", city: "Manali", fromCity: "Manali", toCity: "Rohtang Pass", distanceKm: 51, travelTime: "2 hrs", transferRate: 2500, perKmRate: 18, lastUpdated: "06 Jul 2025 05:00 PM", updatedBy: "Hemal" },
  // Meals
  { id: "MR-50", category: "meals", name: "Breakfast (Buffet)", status: "Active", state: "Kerala", city: "All", mealType: "Breakfast", mealCost: 350, lastUpdated: "07 Jul 2025 06:00 AM", updatedBy: "Admin" },
  { id: "MR-51", category: "meals", name: "Lunch (Thali)", status: "Active", state: "Kerala", city: "All", mealType: "Lunch", mealCost: 500, lastUpdated: "07 Jul 2025 06:00 AM", updatedBy: "Admin" },
  { id: "MR-52", category: "meals", name: "Dinner (Set Menu)", status: "Active", state: "Kerala", city: "All", mealType: "Dinner", mealCost: 600, lastUpdated: "07 Jul 2025 06:00 AM", updatedBy: "Admin" },
  // Vendors
  { id: "MR-60", category: "vendors", name: "Kerala Cabs Pvt Ltd", status: "Active", state: "Kerala", city: "Kochi", vendorType: "Transport", contactPerson: "Rajesh Kumar", contactPhone: "+91 98765 43210", lastUpdated: "07 Jul 2025 08:00 AM", updatedBy: "Admin" },
  { id: "MR-61", category: "vendors", name: "Blanket Hospitality Pvt Ltd", status: "Active", state: "Kerala", city: "Munnar", vendorType: "Hotel", contactPerson: "Suresh Menon", contactPhone: "+91 87654 32100", lastUpdated: "06 Jul 2025 04:00 PM", updatedBy: "Admin" },
  { id: "MR-62", category: "vendors", name: "Himalayan Transport", status: "Active", state: "Himachal Pradesh", city: "Manali", vendorType: "Transport", contactPerson: "Vikram Singh", contactPhone: "+91 76543 21098", lastUpdated: "06 Jul 2025 03:30 PM", updatedBy: "Admin" },
];

const CATEGORY_META: { id: CategoryId; label: string; icon: any; color: string }[] = [
  { id: "destinations", label: "Destinations", icon: MapPin, color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "hotels", label: "Hotels", icon: Building2, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "vehicles", label: "Vehicles", icon: Car, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "activities", label: "Activities", icon: Compass, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "transfers", label: "Transfers", icon: ArrowRightLeft, color: "bg-pink-50 text-pink-700 border-pink-200" },
  { id: "meals", label: "Meals & Add-ons", icon: UtensilsCrossed, color: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "vendors", label: "Vendors", icon: UserCheck, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

const blankRecord = (cat: CategoryId): Partial<MasterRecord> => ({
  category: cat, name: "", status: "Active", state: "", city: "",
  ...(cat === "destinations" ? { region: "", cities: "" } : {}),
  ...(cat === "hotels" ? { hotelCategory: "Standard", roomType: "Standard", maxPeople: 3, mealPlan: "CP", basePrice: 0, weekendPrice: 0, peakPrice: 0, extraMattress: 0, extraAdult: 0, childWithBed: 0, childWithoutBed: 0, vendorName: "" } : {}),
  ...(cat === "vehicles" ? { vehicleType: "Ertiga", seatingCapacity: 7, acType: "AC", priceType: "Per Day", pricePerDay: 0, pricePerKm: 0, minKmPerDay: 200, driverAllowance: 0, fuelIncluded: true, tollIncluded: false, vendorName: "" } : {}),
  ...(cat === "activities" ? { adultRate: 0, childRate: 0, duration: "", activityType: "Shared" } : {}),
  ...(cat === "transfers" ? { fromCity: "", toCity: "", distanceKm: 0, travelTime: "", transferRate: 0, perKmRate: 0 } : {}),
  ...(cat === "meals" ? { mealType: "Breakfast", mealCost: 0 } : {}),
  ...(cat === "vendors" ? { vendorType: "Hotel", contactPerson: "", contactPhone: "" } : {}),
});

export default function MasterDatabasePage() {
  const [records, setRecords] = useState<MasterRecord[]>(INITIAL_RECORDS);
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MasterRecord>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewRecord, setViewRecord] = useState<MasterRecord | null>(null);

  /* ─── Derived ─── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORY_META.forEach(c => { counts[c.id] = records.filter(r => r.category === c.id).length; });
    return counts;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (activeCategory !== "all" && r.category !== activeCategory) return false;
      if (stateFilter && r.state !== stateFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(s);
        const matchesCity = (r.city || "").toLowerCase().includes(s);
        const matchesState = (r.state || "").toLowerCase().includes(s);
        const matchesVendor = (r.vendorName || r.contactPerson || "").toLowerCase().includes(s);
        if (!matchesName && !matchesCity && !matchesState && !matchesVendor) return false;
      }
      return true;
    });
  }, [records, activeCategory, stateFilter, statusFilter, search]);

  const availableCities = formData.state ? (STATE_CITIES[formData.state] || []) : [];

  /* ─── Handlers ─── */
  const openAdd = (cat?: CategoryId) => {
    const targetCat = cat || (activeCategory !== "all" ? activeCategory : "hotels") as CategoryId;
    setEditId(null);
    setFormData(blankRecord(targetCat));
    setShowForm(true);
  };

  const openEdit = (record: MasterRecord) => {
    setEditId(record.id);
    setFormData({ ...record });
    setShowForm(true);
  };

  const handleDuplicate = (record: MasterRecord) => {
    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
    const duplicated: MasterRecord = {
      ...record,
      id: genId(),
      name: `${record.name} (Copy)`,
      lastUpdated: now,
      updatedBy: "Admin"
    };
    setRecords(prev => [duplicated, ...prev]);
    toast.success(`Duplicated "${record.name}" successfully!`);
  };

  const handleSave = () => {
    if (!formData.name?.trim()) { toast.error("Name is required"); return; }

    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });

    if (editId) {
      setRecords(prev => prev.map(r => r.id === editId ? { ...r, ...formData, lastUpdated: now, updatedBy: "Admin" } as MasterRecord : r));
      toast.success(`${formData.name} updated successfully`);
    } else {
      const newRecord: MasterRecord = { ...formData, id: genId(), lastUpdated: now, updatedBy: "Admin" } as MasterRecord;
      setRecords(prev => [newRecord, ...prev]);
      toast.success(`${formData.name} added to inventory`);
    }
    setShowForm(false);
    setFormData({});
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    const rec = records.find(r => r.id === id);
    setRecords(prev => prev.filter(r => r.id !== id));
    toast.success(`${rec?.name || "Record"} removed from database`);
    setDeleteConfirm(null);
  };

  const toggleStatus = (id: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" } : r));
  };

  const updateField = (key: keyof MasterRecord, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (key === "state") setFormData(prev => ({ ...prev, state: value, city: "" }));
  };

  const clearFilters = () => {
    setSearch("");
    setStateFilter("");
    setStatusFilter("all");
    setActiveCategory("all");
  };

  /* ─── Field Helper ─── */
  const Field = ({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) => (
    <div className={cn("space-y-1", span === 2 && "md:col-span-2")}>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );

  const inputCls = "h-9 rounded-lg border-slate-300 text-xs font-semibold text-[#17233C] placeholder:text-slate-400 w-full px-3 focus-visible:ring-1 focus-visible:ring-[#F97316]";
  const selectCls = "h-9 rounded-lg border border-slate-300 text-xs font-semibold text-[#17233C] w-full px-3 bg-white focus:outline-none focus:ring-1 focus:ring-[#F97316] cursor-pointer";

  /* ─── Extra Columns Details ─── */
  const getExtraColumns = (r: MasterRecord): string => {
    switch (r.category) {
      case "destinations": return r.cities || r.region || "All Cities";
      case "hotels": return `${r.hotelCategory} • ${r.roomType} • ${r.mealPlan} • ₹${(r.basePrice || 0).toLocaleString()}/night`;
      case "vehicles": return `${r.vehicleType} • ${r.seatingCapacity} Seats • ${r.acType} • ₹${(r.pricePerDay || 0).toLocaleString()}/day`;
      case "activities": return `${r.activityType} • ₹${(r.adultRate || 0).toLocaleString()}/adult • ${r.duration}`;
      case "transfers": return `${r.fromCity} → ${r.toCity} • ${r.distanceKm} km • ₹${(r.transferRate || 0).toLocaleString()}`;
      case "meals": return `${r.mealType} • ₹${(r.mealCost || 0).toLocaleString()}`;
      case "vendors": return `${r.vendorType} • ${r.contactPerson} • ${r.contactPhone}`;
      default: return "";
    }
  };

  const categoryLabel = CATEGORY_META.find(c => c.id === formData.category)?.label || "Record";

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb & Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
            <span>Admin</span>
            <span>/</span>
            <span>Business</span>
            <span>/</span>
            <span className="text-slate-700 font-bold">Master Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233C] tracking-tight">
            Master Database
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Manage destinations, hotels, vehicles, activities, transfers, meals, and vendors.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <Button 
            variant="outline" 
            onClick={clearFilters} 
            className="h-9 px-3 text-xs font-semibold text-slate-600 border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" /> Reset Filters
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg h-9 px-4 text-xs font-semibold shadow-xs flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Inventory <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
              {CATEGORY_META.map(cat => (
                <DropdownMenuItem key={cat.id} onClick={() => openAdd(cat.id)} className="text-xs font-semibold py-2 cursor-pointer">
                  <cat.icon className="w-4 h-4 mr-2 text-[#F97316]" /> Add {cat.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── Summary KPI Cards (Responsive Grid: 7 wide, 4 medium, 2 mobile) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {CATEGORY_META.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <Card
              key={cat.id}
              onClick={() => setActiveCategory(prev => prev === cat.id ? "all" : cat.id)}
              className={cn(
                "rounded-[16px] border bg-white p-3.5 shadow-xs cursor-pointer transition-all text-left flex flex-col justify-between space-y-2",
                isActive ? "border-[#F97316] ring-2 ring-[#F97316]/20 bg-orange-50/30" : "border-slate-200/80 hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{cat.label}</span>
                <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center shrink-0", cat.color)}>
                  <cat.icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-[#17233C]">{categoryCounts[cat.id] || 0}</p>
            </Card>
          );
        })}
      </div>

      {/* ─── Inventory Toolbar & Filter Tabs ─── */}
      <Card className="bg-white rounded-[16px] border border-slate-200/80 p-4 shadow-xs space-y-4">
        {/* Search + Filters Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, state, or vendor..."
              className="h-9 pl-9 text-xs border-slate-200 rounded-lg text-[#17233C] placeholder:text-slate-400 focus-visible:ring-[#F97316]"
            />
          </div>

          {/* Filters & Total Count */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-[#F97316] cursor-pointer"
            >
              <option value="">All States</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-[#F97316] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 pl-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> {filteredRecords.length} records
            </span>
          </div>
        </div>

        {/* Category Tabs (Horizontally scrollable on mobile without wrapping) */}
        <div className="flex items-center flex-nowrap overflow-x-auto no-scrollbar gap-1.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 border",
              activeCategory === "all"
                ? "bg-orange-50/70 text-[#F97316] border-orange-200"
                : "bg-white text-slate-600 border-transparent hover:bg-slate-50"
            )}
          >
            All
            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-md text-[10px] font-bold">
              {records.length}
            </span>
          </button>

          {CATEGORY_META.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(prev => prev === cat.id ? "all" : cat.id)}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 border",
                  isActive
                    ? "bg-orange-50/70 text-[#F97316] border-orange-200"
                    : "bg-white text-slate-600 border-transparent hover:bg-slate-50"
                )}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
                <span className="bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-md text-[10px] font-bold">
                  {categoryCounts[cat.id] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── DESKTOP DATA TABLE (`hidden md:block`) ─── */}
        <div className="hidden md:block overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3 w-16">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">State / City</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated By</th>
                <th className="px-4 py-3">Updated At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-semibold">
                    No master database records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const catMeta = CATEGORY_META.find(c => c.id === r.category);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-[10px] text-slate-400 font-mono">{r.id}</td>
                      <td className="px-4 py-3 font-extrabold text-[#17233C] max-w-[200px] truncate">{r.name}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-md border font-bold text-[9px] uppercase", catMeta?.color || "bg-slate-100 text-slate-500")}>
                          {catMeta?.label || r.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">
                        {r.state}{r.city ? ` • ${r.city}` : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[260px] truncate" title={getExtraColumns(r)}>
                        {getExtraColumns(r)}
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => toggleStatus(r.id)} className="cursor-pointer">
                          {r.status === "Active" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[9px] uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block" /> Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{r.updatedBy}</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">{r.lastUpdated}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewRecord(r)} className="h-7 w-7 text-slate-400 hover:text-slate-800 rounded-lg">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicate(r)} className="h-7 w-7 text-slate-400 hover:text-slate-800 rounded-lg">
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)} className="h-7 w-7 text-slate-400 hover:text-slate-800 rounded-lg">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(r.id)} className="h-7 w-7 text-rose-500 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── MOBILE STACKED CARDS (`block md:hidden`) ─── */}
        <div className="block md:hidden space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl border border-slate-200">
              No inventory records found matching your filters.
            </div>
          ) : (
            filteredRecords.map((r) => {
              const catMeta = CATEGORY_META.find(c => c.id === r.category);
              return (
                <div key={r.id} className="bg-white rounded-[16px] border border-slate-200/80 p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{r.id}</span>
                        <span className={cn("px-2 py-0.2 rounded-md border font-bold text-[8px] uppercase", catMeta?.color)}>
                          {catMeta?.label || r.category}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-[#17233C] mt-1">{r.name}</h3>
                      <p className="text-xs text-slate-500 font-semibold">{r.state}{r.city ? ` • ${r.city}` : ""}</p>
                    </div>

                    <button type="button" onClick={() => toggleStatus(r.id)}>
                      {r.status === "Active" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] uppercase">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[9px] uppercase">
                          Inactive
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 font-medium">
                    {getExtraColumns(r)}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">Updated: {r.lastUpdated} ({r.updatedBy})</span>

                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(r)} className="h-7 px-2.5 text-xs font-semibold text-slate-700 border-slate-200 rounded-lg">
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(r.id)} className="h-7 px-2.5 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* ─── ADD / EDIT DIALOG ─── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white rounded-2xl border border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#17233C]">
              {editId ? `Edit ${categoryLabel}` : `Add New ${categoryLabel}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure inventory details, rates, and operational attributes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {!editId && (
              <Field label="Inventory Category *">
                <select
                  value={formData.category || "hotels"}
                  onChange={e => setFormData(blankRecord(e.target.value as CategoryId))}
                  className={selectCls}
                >
                  {CATEGORY_META.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </Field>
            )}

            {formData.category !== "destinations" && (
              <Field label={`${categoryLabel} Name *`}>
                <Input 
                  value={formData.name || ""} 
                  onChange={e => updateField("name", e.target.value)} 
                  placeholder={`Enter ${categoryLabel.toLowerCase()} name`} 
                  className={inputCls} 
                />
              </Field>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Category-Specific Dynamic Form Fields */}
              {formData.category === "destinations" && (
                <>
                  <Field label="State / Region Name *">
                    <select value={formData.state || ""} onChange={e => { updateField("state", e.target.value); updateField("name", e.target.value); }} className={selectCls}>
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Region">
                    <Input value={formData.region || ""} onChange={e => updateField("region", e.target.value)} placeholder="e.g. North India" className={inputCls} />
                  </Field>
                  <Field label="Cities / Areas (comma separated)" span={2}>
                    <Input value={formData.cities || ""} onChange={e => updateField("cities", e.target.value)} placeholder="e.g. Manali, Kasol, Shimla" className={inputCls} />
                  </Field>
                </>
              )}

              {formData.category === "hotels" && (
                <>
                  <Field label="State / Region *">
                    <select value={formData.state || ""} onChange={e => updateField("state", e.target.value)} className={selectCls}>
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="City">
                    <select value={formData.city || ""} onChange={e => updateField("city", e.target.value)} className={selectCls}>
                      <option value="">Select City</option>
                      {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Hotel Category">
                    <select value={formData.hotelCategory || "Standard"} onChange={e => updateField("hotelCategory", e.target.value)} className={selectCls}>
                      {HOTEL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Room Type">
                    <select value={formData.roomType || "Standard"} onChange={e => updateField("roomType", e.target.value)} className={selectCls}>
                      {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field label="Base Price / Night (₹)">
                    <Input type="number" value={formData.basePrice || ""} onChange={e => updateField("basePrice", parseInt(e.target.value) || 0)} className={inputCls} />
                  </Field>
                  <Field label="Meal Plan">
                    <select value={formData.mealPlan || "EP"} onChange={e => updateField("mealPlan", e.target.value)} className={selectCls}>
                      {MEAL_PLANS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  <Field label="Vendor / Supplier" span={2}>
                    <Input value={formData.vendorName || ""} onChange={e => updateField("vendorName", e.target.value)} placeholder="Vendor name" className={inputCls} />
                  </Field>
                </>
              )}

              {formData.category === "vehicles" && (
                <>
                  <Field label="State">
                    <select value={formData.state || ""} onChange={e => updateField("state", e.target.value)} className={selectCls}>
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="City">
                    <select value={formData.city || ""} onChange={e => updateField("city", e.target.value)} className={selectCls}>
                      <option value="">Select City</option>
                      {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Vehicle Type">
                    <select value={formData.vehicleType || "Ertiga"} onChange={e => updateField("vehicleType", e.target.value)} className={selectCls}>
                      {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="Seating Capacity">
                    <Input type="number" value={formData.seatingCapacity || ""} onChange={e => updateField("seatingCapacity", parseInt(e.target.value) || 0)} className={inputCls} />
                  </Field>
                  <Field label="Price Per Day (₹)">
                    <Input type="number" value={formData.pricePerDay || ""} onChange={e => updateField("pricePerDay", parseInt(e.target.value) || 0)} className={inputCls} />
                  </Field>
                  <Field label="Price Per KM (₹)">
                    <Input type="number" value={formData.pricePerKm || ""} onChange={e => updateField("pricePerKm", parseInt(e.target.value) || 0)} className={inputCls} />
                  </Field>
                </>
              )}

              {formData.category === "activities" && (
                <>
                  <Field label="State">
                    <select value={formData.state || ""} onChange={e => updateField("state", e.target.value)} className={selectCls}>
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="City">
                    <select value={formData.city || ""} onChange={e => updateField("city", e.target.value)} className={selectCls}>
                      <option value="">Select City</option>
                      {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Adult Rate (₹)">
                    <Input type="number" value={formData.adultRate || ""} onChange={e => updateField("adultRate", parseInt(e.target.value) || 0)} className={inputCls} />
                  </Field>
                  <Field label="Duration">
                    <Input value={formData.duration || ""} onChange={e => updateField("duration", e.target.value)} placeholder="e.g. 2 hrs" className={inputCls} />
                  </Field>
                </>
              )}

              {formData.category === "transfers" && (
                <>
                  <Field label="From City">
                    <Input value={formData.fromCity || ""} onChange={e => updateField("fromCity", e.target.value)} placeholder="Origin city" className={inputCls} />
                  </Field>
                  <Field label="To City">
                    <Input value={formData.toCity || ""} onChange={e => updateField("toCity", e.target.value)} placeholder="Destination city" className={inputCls} />
                  </Field>
                  <Field label="Distance (KM)">
                    <Input type="number" value={formData.distanceKm || ""} onChange={e => updateField("distanceKm", parseInt(e.target.value) || 0)} className={inputCls} />
                  </Field>
                  <Field label="Fixed Rate (₹)">
                    <Input type="number" value={formData.transferRate || ""} onChange={e => updateField("transferRate", parseInt(e.target.value) || 0)} className={inputCls} />
                  </Field>
                </>
              )}

              {formData.category === "meals" && (
                <>
                  <Field label="Meal Type">
                    <Input value={formData.mealType || ""} onChange={e => updateField("mealType", e.target.value)} placeholder="e.g. Breakfast" className={inputCls} />
                  </Field>
                  <Field label="Cost (₹)">
                    <Input type="number" value={formData.mealCost || ""} onChange={e => updateField("mealCost", parseInt(e.target.value) || 0)} className={inputCls} />
                  </Field>
                </>
              )}

              {formData.category === "vendors" && (
                <>
                  <Field label="Vendor Type">
                    <Input value={formData.vendorType || ""} onChange={e => updateField("vendorType", e.target.value)} placeholder="e.g. Hotel / Transport" className={inputCls} />
                  </Field>
                  <Field label="Contact Person">
                    <Input value={formData.contactPerson || ""} onChange={e => updateField("contactPerson", e.target.value)} placeholder="Full name" className={inputCls} />
                  </Field>
                  <Field label="Contact Phone" span={2}>
                    <Input value={formData.contactPhone || ""} onChange={e => updateField("contactPhone", e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                  </Field>
                </>
              )}
            </div>

            <Field label="Status">
              <select value={formData.status || "Active"} onChange={e => updateField("status", e.target.value)} className={selectCls}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>

            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-8 text-xs font-semibold rounded-lg">
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} className="h-8 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1">
                <Save className="w-3.5 h-3.5" /> {editId ? "Update" : "Save"} {categoryLabel}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── VIEW DETAILS DIALOG ─── */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#17233C]">{viewRecord?.name}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Inventory record specs and details.
            </DialogDescription>
          </DialogHeader>

          {viewRecord && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400 font-bold">Category:</span>
                <span className="font-bold text-slate-800 uppercase">{viewRecord.category}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400 font-bold">Location:</span>
                <span className="font-semibold text-slate-800">{viewRecord.state} {viewRecord.city ? `• ${viewRecord.city}` : ""}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400 font-bold">Details:</span>
                <span className="font-semibold text-slate-800">{getExtraColumns(viewRecord)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400 font-bold">Status:</span>
                <span className={`font-bold uppercase ${viewRecord.status === "Active" ? "text-emerald-600" : "text-rose-600"}`}>{viewRecord.status}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 font-bold">Last Updated:</span>
                <span className="text-slate-600">{viewRecord.lastUpdated} ({viewRecord.updatedBy})</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setViewRecord(null)} className="h-8 text-xs font-semibold rounded-lg">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRM DIALOG ─── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm p-6 bg-white rounded-2xl border border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-rose-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Confirm Permanent Deletion
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 font-medium pt-2">
            Are you sure you want to delete <strong className="text-slate-900">{records.find(r => r.id === deleteConfirm)?.name}</strong>? This inventory item will be permanently removed.
          </p>
          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)} className="h-8 text-xs font-semibold rounded-lg">
              Cancel
            </Button>
            <Button type="button" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="h-8 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs">
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
