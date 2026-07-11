import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, Plus, Pencil, Trash2, MapPin, Building2, Car, Compass, Coffee, Users, ChevronDown, 
  Filter, RotateCw, X, Save, Eye, EyeOff, ChevronRight, ArrowRightLeft, UtensilsCrossed, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
   SEED DATA - Comprehensive initial inventory
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
  { id: "destinations", label: "Destinations", icon: MapPin, color: "bg-purple-50 text-purple-600 border-purple-100" },
  { id: "hotels", label: "Hotels", icon: Building2, color: "bg-blue-50 text-blue-600 border-blue-100" },
  { id: "vehicles", label: "Vehicles", icon: Car, color: "bg-amber-50 text-amber-600 border-amber-100" },
  { id: "activities", label: "Activities", icon: Compass, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { id: "transfers", label: "Transfers", icon: ArrowRightLeft, color: "bg-pink-50 text-pink-600 border-pink-100" },
  { id: "meals", label: "Meals & Add-ons", icon: UtensilsCrossed, color: "bg-orange-50 text-orange-600 border-orange-100" },
  { id: "vendors", label: "Vendors", icon: UserCheck, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
];

/* ═══════════════════════════════════════════════════════════════
   BLANK FORM TEMPLATES
   ═══════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
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
      if (search) {
        const s = search.toLowerCase();
        return r.name.toLowerCase().includes(s) || r.city.toLowerCase().includes(s) || r.state.toLowerCase().includes(s);
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

  const handleSave = () => {
    if (!formData.name?.trim()) { toast.error("Name is required"); return; }
    if (!formData.state?.trim() && formData.category !== "destinations") { toast.error("State is required"); return; }

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
    // Auto-clear city when state changes
    if (key === "state") setFormData(prev => ({ ...prev, state: value, city: "" }));
  };

  /* ─── Field helper ─── */
  const Field = ({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) => (
    <div className={cn("space-y-1", span === 2 && "md:col-span-2")}>
      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );

  const inputCls = "h-8 rounded border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 w-full px-2.5";
  const selectCls = "h-8 rounded border border-slate-200 text-xs font-semibold text-slate-800 w-full px-2 bg-white focus:outline-none";

  /* ─── Category-specific form fields ─── */
  const renderCategoryFields = () => {
    const cat = formData.category;
    if (!cat) return null;

    const commonLocationFields = cat !== "destinations" ? (
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
      </>
    ) : null;

    switch (cat) {
      case "destinations":
        return (
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
        );

      case "hotels":
        return (
          <>
            {commonLocationFields}
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
            <Field label="Max People / Room">
              <Input type="number" value={formData.maxPeople || ""} onChange={e => updateField("maxPeople", parseInt(e.target.value) || 0)} className={inputCls} />
            </Field>
            <Field label="Meal Plan">
              <select value={formData.mealPlan || "EP"} onChange={e => updateField("mealPlan", e.target.value)} className={selectCls}>
                {MEAL_PLANS.map(m => <option key={m} value={m}>{m} {m === "EP" ? "(Room Only)" : m === "CP" ? "(Breakfast)" : m === "MAP" ? "(B+D)" : "(All Meals)"}</option>)}
              </select>
            </Field>
            <Field label="Base Price / Night (₹)">
              <Input type="number" value={formData.basePrice || ""} onChange={e => updateField("basePrice", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Weekend Price (₹)">
              <Input type="number" value={formData.weekendPrice || ""} onChange={e => updateField("weekendPrice", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Peak Season Price (₹)">
              <Input type="number" value={formData.peakPrice || ""} onChange={e => updateField("peakPrice", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Extra Mattress (₹)">
              <Input type="number" value={formData.extraMattress || ""} onChange={e => updateField("extraMattress", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Extra Adult (₹)">
              <Input type="number" value={formData.extraAdult || ""} onChange={e => updateField("extraAdult", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Child with Bed (₹)">
              <Input type="number" value={formData.childWithBed || ""} onChange={e => updateField("childWithBed", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Child without Bed (₹)">
              <Input type="number" value={formData.childWithoutBed || ""} onChange={e => updateField("childWithoutBed", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Vendor / Contact" span={2}>
              <Input value={formData.vendorName || ""} onChange={e => updateField("vendorName", e.target.value)} placeholder="e.g. Blanket Hospitality Pvt Ltd" className={inputCls} />
            </Field>
          </>
        );

      case "vehicles":
        return (
          <>
            {commonLocationFields}
            <Field label="Vehicle Type">
              <select value={formData.vehicleType || "Ertiga"} onChange={e => updateField("vehicleType", e.target.value)} className={selectCls}>
                {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Seating Capacity">
              <Input type="number" value={formData.seatingCapacity || ""} onChange={e => updateField("seatingCapacity", parseInt(e.target.value) || 0)} className={inputCls} />
            </Field>
            <Field label="AC Type">
              <select value={formData.acType || "AC"} onChange={e => updateField("acType", e.target.value)} className={selectCls}>
                {AC_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Price Type">
              <select value={formData.priceType || "Per Day"} onChange={e => updateField("priceType", e.target.value)} className={selectCls}>
                {PRICE_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Price Per Day (₹)">
              <Input type="number" value={formData.pricePerDay || ""} onChange={e => updateField("pricePerDay", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Price Per KM (₹)">
              <Input type="number" value={formData.pricePerKm || ""} onChange={e => updateField("pricePerKm", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Min KM / Day">
              <Input type="number" value={formData.minKmPerDay || ""} onChange={e => updateField("minKmPerDay", parseInt(e.target.value) || 0)} className={inputCls} />
            </Field>
            <Field label="Driver Allowance (₹)">
              <Input type="number" value={formData.driverAllowance || ""} onChange={e => updateField("driverAllowance", parseInt(e.target.value) || 0)} className={inputCls} />
            </Field>
            <Field label="Fuel Included">
              <select value={formData.fuelIncluded ? "Yes" : "No"} onChange={e => updateField("fuelIncluded", e.target.value === "Yes")} className={selectCls}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Toll & Parking Included">
              <select value={formData.tollIncluded ? "Yes" : "No"} onChange={e => updateField("tollIncluded", e.target.value === "Yes")} className={selectCls}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Vendor" span={2}>
              <Input value={formData.vendorName || ""} onChange={e => updateField("vendorName", e.target.value)} placeholder="Vendor name" className={inputCls} />
            </Field>
          </>
        );

      case "activities":
        return (
          <>
            {commonLocationFields}
            <Field label="Activity Type">
              <select value={formData.activityType || "Shared"} onChange={e => updateField("activityType", e.target.value)} className={selectCls}>
                <option value="Shared">Shared</option>
                <option value="Private">Private</option>
              </select>
            </Field>
            <Field label="Duration">
              <Input value={formData.duration || ""} onChange={e => updateField("duration", e.target.value)} placeholder="e.g. 2 hours" className={inputCls} />
            </Field>
            <Field label="Adult Rate (₹)">
              <Input type="number" value={formData.adultRate || ""} onChange={e => updateField("adultRate", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Child Rate (₹)">
              <Input type="number" value={formData.childRate || ""} onChange={e => updateField("childRate", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
          </>
        );

      case "transfers":
        return (
          <>
            <Field label="State">
              <select value={formData.state || ""} onChange={e => updateField("state", e.target.value)} className={selectCls}>
                <option value="">Select State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="From City">
              <select value={formData.fromCity || ""} onChange={e => { updateField("fromCity", e.target.value); updateField("city", e.target.value); }} className={selectCls}>
                <option value="">Select</option>
                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="To City">
              <select value={formData.toCity || ""} onChange={e => updateField("toCity", e.target.value)} className={selectCls}>
                <option value="">Select</option>
                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Distance (KM)">
              <Input type="number" value={formData.distanceKm || ""} onChange={e => updateField("distanceKm", parseInt(e.target.value) || 0)} className={inputCls} />
            </Field>
            <Field label="Travel Time">
              <Input value={formData.travelTime || ""} onChange={e => updateField("travelTime", e.target.value)} placeholder="e.g. 4 hrs" className={inputCls} />
            </Field>
            <Field label="Fixed Transfer Rate (₹)">
              <Input type="number" value={formData.transferRate || ""} onChange={e => updateField("transferRate", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Per KM Rate (₹)">
              <Input type="number" value={formData.perKmRate || ""} onChange={e => updateField("perKmRate", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
          </>
        );

      case "meals":
        return (
          <>
            <Field label="State">
              <select value={formData.state || ""} onChange={e => updateField("state", e.target.value)} className={selectCls}>
                <option value="">Select State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="City">
              <Input value={formData.city || ""} onChange={e => updateField("city", e.target.value)} placeholder="e.g. All or Munnar" className={inputCls} />
            </Field>
            <Field label="Meal Type">
              <select value={formData.mealType || "Breakfast"} onChange={e => updateField("mealType", e.target.value)} className={selectCls}>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Guide Fee">Local Guide Fee</option>
                <option value="Entry Ticket">Entry Ticket</option>
                <option value="Permit">Permit Fee</option>
                <option value="Custom">Custom Charge</option>
              </select>
            </Field>
            <Field label="Cost (₹)">
              <Input type="number" value={formData.mealCost || ""} onChange={e => updateField("mealCost", parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </Field>
          </>
        );

      case "vendors":
        return (
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
            <Field label="Vendor Type">
              <select value={formData.vendorType || "Hotel"} onChange={e => updateField("vendorType", e.target.value)} className={selectCls}>
                <option value="Hotel">Hotel Partner</option>
                <option value="Transport">Transport Partner</option>
                <option value="Activity">Activity Operator</option>
                <option value="Meals">Meal Supplier</option>
                <option value="Guide">Guide Service</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Contact Person">
              <Input value={formData.contactPerson || ""} onChange={e => updateField("contactPerson", e.target.value)} placeholder="Full name" className={inputCls} />
            </Field>
            <Field label="Contact Phone" span={2}>
              <Input value={formData.contactPhone || ""} onChange={e => updateField("contactPhone", e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
            </Field>
          </>
        );

      default: return null;
    }
  };

  /* ─── Category-specific column data for table ─── */
  const getExtraColumns = (r: MasterRecord): string => {
    switch (r.category) {
      case "destinations": return r.cities || "";
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

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4 animate-fade-in p-6 bg-[#F5F7FA] min-h-screen -mx-6 -my-6 text-xs text-slate-700 font-sans">
      
      {/* ─── Top Header Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 bg-white -mx-6 -mt-6 p-5 border-b border-[#E2E8F0] gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-8.5 w-1 bg-[#E11D48] rounded-r-md"></div>
          <div>
            <h1 className="text-base font-bold text-[#1E293B] tracking-tight">Master Database</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Manage all destination inventory, rates & vendor data</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={() => { setSearch(""); setStateFilter(""); setStatusFilter("all"); setActiveCategory("all"); }} className="h-8 rounded border-slate-200 text-slate-650 hover:bg-slate-50 font-bold uppercase text-[9.5px] flex items-center gap-1.5 cursor-pointer">
            <RotateCw className="w-3.5 h-3.5" /> Reset Filters
          </Button>
          <Button onClick={() => openAdd()} className="h-8 rounded bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase text-[9.5px] shadow-sm flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add Inventory <ChevronDown className="w-3 h-3 opacity-80" />
          </Button>
        </div>
      </div>

      {/* ─── KPI Category Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {CATEGORY_META.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(prev => prev === cat.id ? "all" : cat.id)}
            className={cn(
              "rounded border bg-white p-3.5 flex items-center gap-3 shadow-2xs cursor-pointer transition-all text-left",
              activeCategory === cat.id ? "border-[#E11D48] ring-1 ring-[#E11D48]/20" : "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className={cn("w-8 h-8 rounded border flex items-center justify-center shrink-0", cat.color)}>
              <cat.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">{cat.label}</p>
              <p className="text-base font-black text-slate-800 leading-tight">{categoryCounts[cat.id] || 0}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ─── Quick Add Buttons Row ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_META.map(cat => (
          <Button key={cat.id} variant="outline" onClick={() => openAdd(cat.id)} className="h-7 rounded border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[9px] flex items-center gap-1 cursor-pointer shrink-0">
            <Plus className="w-3 h-3" /> Add {cat.label.replace("& Add-ons", "")}
          </Button>
        ))}
      </div>

      {/* ─── Filters + Table ─── */}
      <Card className="rounded border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
        
        {/* Search + Filters Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, city, state..."
              className="h-8 rounded border-slate-200 pl-8 text-xs font-semibold text-slate-800 placeholder:text-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="h-8 rounded border border-slate-200 text-[10px] font-bold text-slate-600 px-2 bg-white focus:outline-none cursor-pointer">
              <option value="">All States</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="h-8 rounded border border-slate-200 text-[10px] font-bold text-slate-600 px-2 bg-white focus:outline-none cursor-pointer">
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> {filteredRecords.length} records
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 border-b pb-3 border-slate-100">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn("px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all",
              activeCategory === "all" ? "bg-[#E11D48]/10 text-[#E11D48] font-black" : "hover:bg-slate-50 text-slate-600"
            )}
          >All <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-bold">{records.length}</span></button>
          {CATEGORY_META.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(prev => prev === cat.id ? "all" : cat.id)}
              className={cn("px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all",
                activeCategory === cat.id ? "bg-[#E11D48]/10 text-[#E11D48] font-black" : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-bold">{categoryCounts[cat.id] || 0}</span>
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-150 rounded">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[#475569] border-b border-slate-150 font-bold uppercase text-[9px] tracking-wider">
                <th className="px-4 py-2.5 w-10">ID</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">State / City</th>
                <th className="px-4 py-2.5">Details</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Updated</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-600 bg-white">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-bold">No records found. Try adjusting your filters or add new inventory.</td></tr>
              ) : filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2.5 text-[10px] text-slate-400 font-mono">{r.id}</td>
                  <td className="px-4 py-2.5 font-bold text-[#1E293B] max-w-[200px] truncate">{r.name}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("px-2 py-0.5 rounded border font-bold text-[8px] uppercase", CATEGORY_META.find(c => c.id === r.category)?.color || "bg-slate-100 text-slate-500")}>
                      {CATEGORY_META.find(c => c.id === r.category)?.label || r.category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 font-semibold">{r.state}{r.city ? ` • ${r.city}` : ""}</td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-[280px] truncate" title={getExtraColumns(r)}>{getExtraColumns(r)}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggleStatus(r.id)} className="cursor-pointer">
                      {r.status === "Active" ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[8px] uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-500 border border-red-100 font-bold text-[8px] uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 block" /> Inactive
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-[10px]">{r.updatedBy}<br />{r.lastUpdated}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)} className="h-7 w-7 text-slate-400 hover:text-slate-700 cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(r.id)} className="h-7 w-7 text-red-500 hover:bg-red-50 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
         ADD / EDIT MODAL
         ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              {editId ? `Edit ${categoryLabel}` : `Add New ${categoryLabel}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Category selector (only for new) */}
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

            {/* Name field */}
            {formData.category !== "destinations" && (
              <Field label={`${categoryLabel} Name *`}>
                <Input value={formData.name || ""} onChange={e => updateField("name", e.target.value)} placeholder={`Enter ${categoryLabel.toLowerCase()} name`} className={inputCls} />
              </Field>
            )}

            {/* Category specific fields in grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderCategoryFields()}
            </div>

            {/* Status */}
            <Field label="Status">
              <select value={formData.status || "Active"} onChange={e => updateField("status", e.target.value)} className={selectCls}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)} className="h-8 rounded text-xs font-bold uppercase cursor-pointer">Cancel</Button>
              <Button onClick={handleSave} className="h-8 rounded bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> {editId ? "Update" : "Save"} {categoryLabel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
         DELETE CONFIRM DIALOG
         ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 font-medium">Are you sure you want to permanently delete <strong>{records.find(r => r.id === deleteConfirm)?.name}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="h-8 text-xs font-bold uppercase cursor-pointer">Cancel</Button>
            <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="h-8 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase cursor-pointer">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
