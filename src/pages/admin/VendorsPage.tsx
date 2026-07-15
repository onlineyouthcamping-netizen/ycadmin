import { useEffect, useState, useCallback, useMemo } from "react";
import { vendorsService } from "@/services/vendors.service";
import api from "@/services/api";
import VendorImportWizard from "@/components/admin/VendorImportWizard";
import type { Vendor } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Building2, Truck, UserCheck,
  UtensilsCrossed, Wrench, HelpCircle, Phone, Mail, MapPin,
  Search, Copy, FileSpreadsheet, RotateCw, CheckCircle2, XCircle,
  MoreVertical, Filter, Sliders, ShieldCheck, Clock, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

const VENDOR_TYPE_ICONS: Record<string, any> = {
  hotel: Building2,
  transport: Truck,
  guide: UserCheck,
  meals: UtensilsCrossed,
  equipment: Wrench,
  other: HelpCircle,
};

const VENDOR_TYPE_COLORS: Record<string, string> = {
  hotel: "bg-blue-50 text-blue-600 border border-blue-100",
  transport: "bg-amber-50 text-amber-600 border border-amber-100",
  guide: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  meals: "bg-orange-50 text-orange-600 border border-orange-100",
  equipment: "bg-purple-50 text-purple-600 border border-purple-100",
  other: "bg-gray-50 text-gray-600 border border-gray-100",
};

const emptyForm = {
  name: "",
  type: "hotel" as Vendor["type"],
  phone: "",
  email: "",
  location: "",
  notes: "",
  isActive: true,
  roomRates: [] as any[],
  transportRates: [] as any[],
  miscCharges: [] as any[],
  tripId: "",
  isPrimary: true as boolean,
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"list" | "edit">("list");
  const [showImporter, setShowImporter] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Secondary filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationSearch, setLocationSearch] = useState("");
  const [tripFilter, setTripFilter] = useState("all");
  
  // Trip Assignment selections
  const [selectedTripId, setSelectedTripId] = useState("");
  const [trips, setTrips] = useState<any[]>([]);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await api.get("/trips");
      const data = res.data?.data || res.data || [];
      setTrips(Array.isArray(data) ? data : []);
    } catch {
      setTrips([
        { id: "spiti", slug: "spiti", title: "Spiti Valley Expedition" },
        { id: "mka", slug: "mka", title: "Msar Kareri Lake Trek" },
        { id: "smdd", slug: "smdd", title: "Shimla Manali Dharamshala Dalhousie" },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vendorsService.getAll();
      setVendors(data || []);
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setActiveView("edit");
  };

  const openEdit = async (v: Vendor) => {
    try {
      const full = await vendorsService.getById(v.id);
      setEditing(v);
      setForm({
        name: full.name,
        type: full.type,
        phone: full.phone || "",
        email: full.email || "",
        location: full.location || "",
        notes: full.notes || "",
        isActive: full.isActive !== false,
        roomRates: (full as any).roomRates || [],
        transportRates: (full as any).transportRates || [],
        miscCharges: (full as any).miscCharges || [],
        tripId: (full as any).tripId || "",
        isPrimary: (full as any).tripMappings?.[0]?.isPrimary !== false,
      });
      setActiveView("edit");
    } catch {
      toast.error("Failed to load vendor details");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await vendorsService.update(editing.id, form);

        if (form.type === "transport" && Array.isArray(form.transportRates)) {
          await api.post(`/vendors/directory/${editing.id}/transport-rates`, { rates: form.transportRates });
        }
        if (["hotel", "homestay", "camp"].includes(form.type) && Array.isArray(form.roomRates)) {
          await api.post(`/vendors/directory/${editing.id}/room-rates`, { rates: form.roomRates });
        }
        if (!["transport", "hotel", "homestay", "camp"].includes(form.type) && Array.isArray(form.miscCharges)) {
          await api.post(`/vendors/directory/${editing.id}/misc-charges`, { charges: form.miscCharges });
        }

        toast.success("Vendor updated successfully");
      } else {
        const created = await vendorsService.create(form);
        const newId = created.id;

        if (form.type === "transport" && Array.isArray(form.transportRates)) {
          await api.post(`/vendors/directory/${newId}/transport-rates`, { rates: form.transportRates });
        }
        if (["hotel", "homestay", "camp"].includes(form.type) && Array.isArray(form.roomRates)) {
          await api.post(`/vendors/directory/${newId}/room-rates`, { rates: form.roomRates });
        }
        if (!["transport", "hotel", "homestay", "camp"].includes(form.type) && Array.isArray(form.miscCharges)) {
          await api.post(`/vendors/directory/${newId}/misc-charges`, { charges: form.miscCharges });
        }

        toast.success("Vendor created successfully");
      }
      setActiveView("list");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save vendor");
    } finally {
      setSubmitting(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vendor and all trip assignments?")) return;
    try {
      await vendorsService.remove(id);
      toast.success("Vendor removed");
      load();
    } catch {
      toast.error("Failed to delete vendor");
    }
  };

  const handleToggleStatus = async (v: Vendor) => {
    try {
      const currentStatus = v.isActive !== false;
      const updated = await vendorsService.update(v.id, { isActive: !currentStatus });
      toast.success(`Vendor status set to ${updated.isActive ? 'Active' : 'Inactive'}`);
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleExportCSV = () => {
    const headers = ["Partner Name", "Category", "Phone", "Email", "Location", "Status", "Remarks"];
    const rows = filtered.map(v => [
      v.name,
      v.type.toUpperCase(),
      v.phone || "",
      v.email || "",
      v.location || "",
      v.isActive !== false ? "Active" : "Inactive",
      v.notes || ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vendor_directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file exported successfully");
  };

  // Filter & Search Logic
  const filtered = useMemo(() => {
    return vendors.filter(v => {
      const matchesFilter = filter === "all" || v.type === filter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && v.isActive !== false) ||
        (statusFilter === "inactive" && v.isActive === false);
      const matchesLoc = !locationSearch || (v.location || "").toLowerCase().includes(locationSearch.toLowerCase());
      const matchesTrip = tripFilter === "all" || 
        (Array.isArray((v as any).tripMappings) && (v as any).tripMappings.some((m: any) => m.tripId === tripFilter));
      const matchesSearch = !searchQuery || 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesStatus && matchesLoc && matchesTrip && matchesSearch;
    });
  }, [vendors, filter, statusFilter, locationSearch, searchQuery, tripFilter]);

  const stats = useMemo(() => {
    const total = vendors.length;
    const hotel = vendors.filter(v => v.type === "hotel").length;
    const transport = vendors.filter(v => v.type === "transport").length;
    const guide = vendors.filter(v => v.type === "guide").length;
    const meals = vendors.filter(v => v.type === "meals").length;
    const equipment = vendors.filter(v => v.type === "equipment").length;
    const other = vendors.filter(v => v.type === "other").length;
    const active = vendors.filter(v => v.isActive !== false).length;
    
    return { total, hotel, transport, guide, meals, equipment, other, active };
  }, [vendors]);

  if (activeView === "edit") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans p-6 md:p-8 -mx-6 -my-6">
        {/* Main Centered Container */}
        <div className="max-w-[1440px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[8px] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveView("list")} 
                className="h-9 px-3 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight font-serif uppercase">
                  {editing ? `Modify: ${form.name || "Vendor"}` : "Register New Partner"}
                </h1>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  Configure logistics, stay parameters, and vendor contract details
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setActiveView("list")} className="h-[42px] px-4 rounded-[8px] font-bold text-xs uppercase cursor-pointer">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={submitting} className="h-[42px] px-6 bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[8px] font-bold text-xs uppercase cursor-pointer">
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* 2-Column Responsive Desktop Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[24px]">
            
            {/* Left Content Column */}
            <div className="space-y-[16px] min-w-0">
              
              {/* 1. BASIC DETAILS */}
              <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2 font-serif text-sm">
                  1. BASIC DETAILS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Vendor / Partner Name *</label>
                    <Input
                      placeholder="e.g. Hotel Ameera"
                      value={form.name ?? ""}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="h-[42px] rounded-[8px] border-[#E2E8F0] text-xs font-semibold text-slate-700 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Service Category *</label>
                    <Select value={form.type ?? "hotel"} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="h-[42px] rounded-[8px] border-[#E2E8F0] text-xs text-slate-700 font-semibold bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="hotel">🏨 Hotel / Stay</SelectItem>
                        <SelectItem value="transport">🚐 Transport Fleet</SelectItem>
                        <SelectItem value="guide">🧑‍🤝‍🧑 Mountain Guide</SelectItem>
                        <SelectItem value="meals">🍽️ Meals / Catering</SelectItem>
                        <SelectItem value="equipment">🔧 Rent Gear / Tools</SelectItem>
                        <SelectItem value="other">📦 Other Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Status *</label>
                    <Select 
                      value={form.isActive ? "active" : "inactive"} 
                      onValueChange={(v) => setForm({ ...form, isActive: v === "active" })}
                    >
                      <SelectTrigger className="h-[42px] rounded-[8px] border-[#E2E8F0] text-xs text-slate-700 font-semibold bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="active">🟢 Active</SelectItem>
                        <SelectItem value="inactive">🔴 Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 2. CONTACT DETAILS */}
              <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2 font-serif text-sm">
                  2. CONTACT DETAILS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Primary Phone *</label>
                    <Input
                      placeholder="e.g. +91 97362 06263"
                      value={form.phone ?? ""}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="h-[42px] rounded-[8px] border-[#E2E8F0] text-xs font-semibold text-slate-700 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Email Address *</label>
                    <Input
                      placeholder="partner@example.com"
                      value={form.email ?? ""}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="h-[42px] rounded-[8px] border-[#E2E8F0] text-xs font-semibold text-slate-700 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. LOCATION DETAILS */}
              <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2 font-serif text-sm">
                  3. LOCATION DETAILS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">State *</label>
                    <Select defaultValue="Himachal Pradesh">
                      <SelectTrigger className="h-[42px] rounded-[8px] border-[#E2E8F0] text-xs text-slate-700 font-semibold bg-white"><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                        <SelectItem value="Jammu & Kashmir">Jammu & Kashmir</SelectItem>
                        <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                        <SelectItem value="Punjab">Punjab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">City / Geographical Location *</label>
                    <Input
                      placeholder="e.g. Shimla"
                      value={form.location ?? ""}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="h-[42px] rounded-[8px] border-[#E2E8F0] text-xs font-semibold text-slate-700 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. TRIP ASSIGNMENT */}
              <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2 font-serif text-sm">
                  4. TRIP ASSIGNMENT
                </h3>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Assign to Trip</label>
                  <Select 
                    value={form.tripId} 
                    onValueChange={(v) => setForm({ ...form, tripId: v })}
                  >
                    <SelectTrigger className="h-[42px] rounded-[8px] border-[#E2E8F0] text-xs text-slate-700 font-semibold bg-white"><SelectValue placeholder="Select trip..." /></SelectTrigger>
                    <SelectContent className="text-xs bg-white font-semibold">
                      {trips.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.tripId && ["hotel", "homestay", "camp"].includes(form.type) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Hotel Priority for Auto-Allocation</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, isPrimary: true })}
                        className={`flex-1 h-[42px] rounded-[8px] border text-xs font-bold transition-all ${(form as any).isPrimary !== false ? 'bg-[#F97316] text-white border-[#F97316]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#F97316]'}`}
                      >
                        🥇 Primary Hotel
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, isPrimary: false })}
                        className={`flex-1 h-[42px] rounded-[8px] border text-xs font-bold transition-all ${(form as any).isPrimary === false ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                      >
                        🥈 Backup Hotel
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Primary hotel rooms are filled first. When full, auto-allocation overflows to backup hotels.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Rates & Remarks */}
            <div className="space-y-[16px] min-w-[360px]">
              
              {/* 5. RATE & PRICING DETAILS */}
              <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-855 uppercase tracking-wider border-b border-slate-100 pb-2 font-serif text-sm">
                  5. RATE & PRICING DETAILS
                </h3>

                {/* IF Service Category = "Transport Fleet" */}
                {form.type === "transport" && (
                  <div className="space-y-6">
                    {form.transportRates?.map((row: any, idx: number) => {
                      const amt = parseFloat(row.amount || "0");
                      const cap = parseInt(row.seatCapacity || "0");
                      const perPerson = amt > 0 && cap > 0 ? (amt / cap).toFixed(2) : "0.00";
                      return (
                        <div key={idx} className="border border-slate-200 rounded-[8px] p-5 bg-slate-50/50 space-y-4 relative">
                          <button 
                            type="button"
                            onClick={() => {
                              const updated = form.transportRates.filter((_, i) => i !== idx);
                              setForm({ ...form, transportRates: updated });
                            }}
                            className="absolute top-4 right-4 p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Row 1: Vehicle Type | Seat Capacity | Rate Basis */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Vehicle Type</label>
                              <Select 
                                value={row.vehicleType || "17 Seater"} 
                                onValueChange={(v) => {
                                  const updated = [...form.transportRates];
                                  updated[idx].vehicleType = v;
                                  setForm({ ...form, transportRates: updated });
                                }}
                              >
                                <SelectTrigger className="h-[42px] text-xs bg-white border-slate-200 rounded-[8px]"><SelectValue /></SelectTrigger>
                                <SelectContent className="text-xs bg-white">
                                  {["20 Seater", "17 Seater", "14 Seater", "13 Seater", "Innova", "Innova Crysta", "Ertiga", "Dezire", "Thar", "Jimny", "Other"].map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Seat Cap</label>
                              <Input
                                type="number"
                                min="1"
                                value={row.seatCapacity ?? ""}
                                onChange={(e) => {
                                  const updated = [...form.transportRates];
                                  updated[idx].seatCapacity = e.target.value;
                                  setForm({ ...form, transportRates: updated });
                                }}
                                className="h-[42px] text-xs bg-white border-slate-200 rounded-[8px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Rate Basis</label>
                              <Select defaultValue="PER_VEHICLE">
                                <SelectTrigger className="h-[42px] text-xs bg-white border-slate-200 rounded-[8px]"><SelectValue placeholder="Basis" /></SelectTrigger>
                                <SelectContent className="text-xs bg-white font-semibold">
                                  <SelectItem value="PER_VEHICLE">PER VEHICLE</SelectItem>
                                  <SelectItem value="PER_DAY">PER DAY</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Row 2: Route spanning full width */}
                          <div className="space-y-2">
                            <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Route Relevance</label>
                            <Input
                              placeholder="e.g. Chandigarh-Spiti-Chandigarh"
                              value={row.routeName ?? ""}
                              onChange={(e) => {
                                const updated = [...form.transportRates];
                                updated[idx].routeName = e.target.value;
                                setForm({ ...form, transportRates: updated });
                              }}
                              className="h-[42px] text-xs bg-white border-slate-200 rounded-[8px] w-full"
                            />
                          </div>

                          {/* Row 3: Total Amount | Extra Charge | Per-Person Preview */}
                          <div className="grid grid-cols-3 gap-3 items-end">
                            <div className="space-y-2">
                              <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Total ₹</label>
                              <Input
                                type="number"
                                value={row.amount ?? ""}
                                onChange={(e) => {
                                  const updated = [...form.transportRates];
                                  updated[idx].amount = e.target.value;
                                  setForm({ ...form, transportRates: updated });
                                }}
                                className="h-[42px] text-xs bg-white border-slate-200 rounded-[8px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Extra ₹</label>
                              <Input
                                type="number"
                                value={row.extraCharge ?? ""}
                                onChange={(e) => {
                                  const updated = [...form.transportRates];
                                  updated[idx].extraCharge = e.target.value;
                                  setForm({ ...form, transportRates: updated });
                                }}
                                className="h-[42px] text-xs bg-white border-slate-200 rounded-[8px]"
                              />
                            </div>
                            <div className="flex flex-col bg-[#FFF0E6]/30 border border-[#FFF0E6] p-2 rounded-[6px] text-center h-[42px] justify-center">
                              <span className="text-[8px] font-black text-slate-400 uppercase">Per Person</span>
                              <span className="text-xs font-black text-[#C9A84C]">₹{perPerson}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(form.transportRates) ? form.transportRates : [];
                        setForm({
                          ...form,
                          transportRates: [...current, { vehicleType: "17 Seater", seatCapacity: "17", amount: "", routeName: "", extraCharge: "0" }]
                        });
                      }}
                      className="w-full h-10 border border-dashed border-[#F97316] text-[#F97316] hover:bg-orange-50/20 bg-white font-bold uppercase rounded-[8px] cursor-pointer text-xs"
                    >
                      + Add Vehicle Rate
                    </Button>
                  </div>
                )}

                {/* IF Service Category = "Hotel" | "Homestay" | "Camp" */}
                {["hotel", "homestay", "camp"].includes(form.type) && (
                  <div className="space-y-4">
                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_80px_80px_80px_64px] gap-2 items-end">
                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Room Category</div>
                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">2-Sharing<br/>₹/room</div>
                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">3-Sharing<br/>₹/room</div>
                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">4-Sharing<br/>₹/room</div>
                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Rooms</div>
                    </div>

                    {/* Group roomRates by roomCategory, show one row per category */}
                    {(() => {
                      // Build grouped structure: { [cat]: { double, triple, quad, rooms, mealPlan, season } }
                      const grouped: Record<string, any> = {};
                      (form.roomRates || []).forEach((r: any) => {
                        const cat = r.roomCategory || "Standard";
                        if (!grouped[cat]) grouped[cat] = { roomCategory: cat, double: "", triple: "", quad: "", availableRooms: r.availableRooms || "", mealPlan: r.mealPlan || "EP", season: r.season || "ALL" };
                        if (r.sharingType === "DOUBLE") grouped[cat].double = r.amount ?? "";
                        if (r.sharingType === "TRIPLE") grouped[cat].triple = r.amount ?? "";
                        if (r.sharingType === "QUAD") grouped[cat].quad = r.amount ?? "";
                        if (r.availableRooms) grouped[cat].availableRooms = r.availableRooms;
                      });

                      // If no roomRates yet, show one default row
                      if (Object.keys(grouped).length === 0) {
                        grouped["Standard"] = { roomCategory: "Standard", double: "", triple: "", quad: "", availableRooms: "", mealPlan: "EP", season: "ALL" };
                      }

                      const updateGrouped = (newGrouped: Record<string, any>) => {
                        // Expand grouped back into flat roomRates array (3 rows per category)
                        const flat: any[] = [];
                        Object.values(newGrouped).forEach((g: any) => {
                          if (g.double !== "") flat.push({ roomCategory: g.roomCategory, sharingType: "DOUBLE", rateBasis: "PER_ROOM_PER_NIGHT", amount: g.double, availableRooms: g.availableRooms, mealPlan: g.mealPlan, season: g.season });
                          if (g.triple !== "") flat.push({ roomCategory: g.roomCategory, sharingType: "TRIPLE", rateBasis: "PER_ROOM_PER_NIGHT", amount: g.triple, availableRooms: g.availableRooms, mealPlan: g.mealPlan, season: g.season });
                          if (g.quad !== "") flat.push({ roomCategory: g.roomCategory, sharingType: "QUAD", rateBasis: "PER_ROOM_PER_NIGHT", amount: g.quad, availableRooms: g.availableRooms, mealPlan: g.mealPlan, season: g.season });
                          // If all rates blank still keep a placeholder row
                          if (g.double === "" && g.triple === "" && g.quad === "") {
                            flat.push({ roomCategory: g.roomCategory, sharingType: "DOUBLE", rateBasis: "PER_ROOM_PER_NIGHT", amount: "", availableRooms: g.availableRooms, mealPlan: g.mealPlan, season: g.season });
                          }
                        });
                        setForm({ ...form, roomRates: flat });
                      };

                      return Object.entries(grouped).map(([cat, g]: [string, any], idx) => (
                        <div key={cat} className="border border-slate-200 rounded-[8px] bg-slate-50/30 p-3 space-y-3 relative">
                          <button
                            type="button"
                            onClick={() => {
                              const ng = { ...grouped };
                              delete ng[cat];
                              updateGrouped(ng);
                            }}
                            className="absolute top-3 right-3 p-1 text-rose-400 hover:bg-rose-50 rounded"
                          ><Trash2 className="w-3.5 h-3.5" /></button>

                          {/* Row 1: Name + rates + rooms count */}
                          <div className="grid grid-cols-[1fr_80px_80px_80px_64px] gap-2 items-center pr-8">
                            <input
                              type="text"
                              value={g.roomCategory}
                              onChange={(e) => {
                                const ng = { ...grouped };
                                const old = ng[cat];
                                delete ng[cat];
                                ng[e.target.value] = { ...old, roomCategory: e.target.value };
                                updateGrouped(ng);
                              }}
                              placeholder="e.g. Deluxe, Standard"
                              className="h-[36px] px-3 text-xs font-semibold border border-slate-200 rounded-[6px] bg-white focus:outline-none focus:ring-1 focus:ring-[#F97316]/30"
                            />
                            <input
                              type="number"
                              value={g.double}
                              onChange={(e) => { const ng = { ...grouped }; ng[cat].double = e.target.value; updateGrouped(ng); }}
                              placeholder="—"
                              className="h-[36px] px-2 text-xs font-semibold border border-slate-200 rounded-[6px] bg-white text-center focus:outline-none focus:ring-1 focus:ring-[#F97316]/30"
                            />
                            <input
                              type="number"
                              value={g.triple}
                              onChange={(e) => { const ng = { ...grouped }; ng[cat].triple = e.target.value; updateGrouped(ng); }}
                              placeholder="—"
                              className="h-[36px] px-2 text-xs font-semibold border border-slate-200 rounded-[6px] bg-white text-center focus:outline-none focus:ring-1 focus:ring-[#F97316]/30"
                            />
                            <input
                              type="number"
                              value={g.quad}
                              onChange={(e) => { const ng = { ...grouped }; ng[cat].quad = e.target.value; updateGrouped(ng); }}
                              placeholder="—"
                              className="h-[36px] px-2 text-xs font-semibold border border-slate-200 rounded-[6px] bg-white text-center focus:outline-none focus:ring-1 focus:ring-[#F97316]/30"
                            />
                            <input
                              type="number"
                              value={g.availableRooms}
                              onChange={(e) => { const ng = { ...grouped }; ng[cat].availableRooms = e.target.value; updateGrouped(ng); }}
                              placeholder="5"
                              className="h-[36px] px-2 text-xs font-semibold border border-slate-200 rounded-[6px] bg-white text-center focus:outline-none focus:ring-1 focus:ring-[#F97316]/30"
                            />
                          </div>

                          {/* Row 2: Per-person previews */}
                          <div className="grid grid-cols-[1fr_80px_80px_80px_64px] gap-2 px-1 pr-8">
                            <div className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
                              <Select value={g.mealPlan} onValueChange={(v) => { const ng = { ...grouped }; ng[cat].mealPlan = v; updateGrouped(ng); }}>
                                <SelectTrigger className="h-[28px] text-[9px] border-slate-100 bg-white rounded-[4px] w-20"><SelectValue /></SelectTrigger>
                                <SelectContent className="text-xs bg-white">
                                  {["EP", "CP", "MAP", "AP"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            {[g.double, g.triple, g.quad].map((rate, i) => {
                              const occ = i + 2;
                              const pp = rate ? (parseFloat(rate) / occ).toFixed(0) : "—";
                              return (
                                <div key={i} className="text-center">
                                  <div className="text-[8px] text-slate-400">₹{pp}/pp</div>
                                </div>
                              );
                            })}
                            <div />
                          </div>
                        </div>
                      ));
                    })()}

                    <Button
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(form.roomRates) ? form.roomRates : [];
                        setForm({
                          ...form,
                          roomRates: [...current, { roomCategory: "Standard", sharingType: "DOUBLE", rateBasis: "PER_ROOM_PER_NIGHT", amount: "", availableRooms: "", mealPlan: "EP", season: "ALL" }]
                        });
                      }}
                      className="w-full h-10 border border-dashed border-[#F97316] text-[#F97316] hover:bg-orange-50/20 bg-white font-bold uppercase rounded-[8px] cursor-pointer text-xs"
                    >
                      + Add Room Category
                    </Button>
                  </div>
                )}

                {/* IF Service Category = "Guide" | "Misc" */}
                {!["transport", "hotel", "homestay", "camp"].includes(form.type) && (
                  <div className="space-y-6">
                    {form.miscCharges?.map((row: any, idx: number) => (
                      <div key={idx} className="border border-slate-200 rounded-[8px] p-5 bg-slate-50/50 space-y-4 relative">
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = form.miscCharges.filter((_, i) => i !== idx);
                            setForm({ ...form, miscCharges: updated });
                          }}
                          className="absolute top-4 right-4 p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Charge Name</label>
                            <Input
                              value={row.chargeName || ""}
                              onChange={(e) => {
                                const updated = [...form.miscCharges];
                                updated[idx].chargeName = e.target.value;
                                setForm({ ...form, miscCharges: updated });
                              }}
                              className="h-[42px] text-xs bg-white border-slate-200 rounded-[8px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Charge Type</label>
                            <Input
                              value={row.chargeType || ""}
                              onChange={(e) => {
                                const updated = [...form.miscCharges];
                                updated[idx].chargeType = e.target.value;
                                setForm({ ...form, miscCharges: updated });
                              }}
                              className="h-[42px] text-xs bg-white border-slate-200 rounded-[8px]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Amount ₹</label>
                            <Input
                              type="number"
                              value={row.amount ?? ""}
                              onChange={(e) => {
                                const updated = [...form.miscCharges];
                                updated[idx].amount = e.target.value;
                                setForm({ ...form, miscCharges: updated });
                              }}
                              className="h-[42px] text-xs bg-white border-slate-200 rounded-[8px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Unit</label>
                            <Select
                              value={row.unit || "FLAT"}
                              onValueChange={(v) => {
                                const updated = [...form.miscCharges];
                                updated[idx].unit = v;
                                setForm({ ...form, miscCharges: updated });
                              }}
                            >
                              <SelectTrigger className="h-[42px] text-xs bg-white border-slate-200 rounded-[8px]"><SelectValue /></SelectTrigger>
                              <SelectContent className="text-xs bg-white font-semibold">
                                {["PER_DAY", "PER_PERSON", "PER_ROOM", "FLAT"].map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(form.miscCharges) ? form.miscCharges : [];
                        setForm({
                          ...form,
                          miscCharges: [...current, { chargeName: "", chargeType: "", amount: "", unit: "FLAT" }]
                        });
                      }}
                      className="w-full h-10 border border-dashed border-[#F97316] text-[#F97316] hover:bg-orange-50/20 bg-white font-bold uppercase rounded-[8px] cursor-pointer text-xs"
                    >
                      + Add Charge
                    </Button>
                  </div>
                )}
              </div>

              {/* 6. REMARKS & NOTES */}
              <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm p-6 space-y-4 w-full">
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2 font-serif text-sm">
                  6. REMARKS & NOTES
                </h3>
                <textarea
                  placeholder="Add special commercial terms, contract parameters or notes..."
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full min-h-[140px] rounded-[8px] border border-[#E2E8F0] text-xs font-semibold text-slate-700 bg-white p-3 outline-none focus:border-[#F97316] transition-all"
                />
              </div>

            </div>

          </div>
        </div>

        {/* Floating Save Footer */}
        <div className="bg-white border-t border-[#E2E8F0] p-4 flex justify-end gap-2 -mx-6 -mb-6 shadow-md mt-6">
          <Button variant="outline" onClick={() => setActiveView("list")} className="rounded-[4px] text-xs font-bold uppercase tracking-wider h-9 px-4 cursor-pointer">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting} className="rounded-[4px] font-bold text-xs uppercase tracking-wider h-9 px-6 bg-[#F97316] hover:bg-[#E05E00] text-white cursor-pointer">
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    );
  }

  if (showImporter) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans p-6 md:p-8 -mx-6 -my-6">
        <div className="max-w-[1440px] mx-auto space-y-6">
          <div className="flex items-center gap-3 bg-white p-6 rounded-[8px] border border-slate-200 shadow-sm">
            <button 
              onClick={() => setShowImporter(false)} 
              className="h-9 px-3 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              ← Back to Directory
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-serif uppercase">
                Vendor Excel Importer
              </h1>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                Batch import vendors, hotels, and transport rates from Excel workbook templates
              </p>
            </div>
          </div>
          
          <VendorImportWizard onComplete={() => { setShowImporter(false); load(); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[4px] bg-[#FFF0E6] flex items-center justify-center text-[#F97316]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Vendor Directory</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Central Hub for Operations & Partner Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowImporter(true)} className="h-8.5 px-4 rounded-[4px] font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Upload Excel Sheet
          </Button>
          <Button onClick={openCreate} className="h-8.5 px-4 rounded-[4px] font-bold text-xs bg-[#F97316] hover:bg-[#E05E00] text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
            <Plus className="h-4 w-4" /> Add Vendor
          </Button>
        </div>
      </div>

      {/* Zoho Style KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[
          { label: "Total Partners", value: stats.total, desc: "All active services", icon: <Building2 className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50/50" },
          { label: "Hotels & Stays", value: stats.hotel, desc: `${stats.hotel} Accommodations`, icon: <Building2 className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50/50" },
          { label: "Transport Providers", value: stats.transport, desc: `${stats.transport} Fleets & drivers`, icon: <Truck className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50/50" },
          { label: "Mountain Guides", value: stats.guide, desc: `${stats.guide} Expedition leaders`, icon: <UserCheck className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50/50" },
          { label: "Partner Coverage", value: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%", desc: `${stats.active} Active partners`, icon: <ShieldCheck className="w-5 h-5 text-[#F97316]" />, bg: "bg-[#FFF0E6]/50" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-[6px] border border-slate-200 shadow-xs p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0", s.bg)}>
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">{s.label}</p>
              <p className="text-xl font-black text-slate-800 mt-1.5 leading-none">{s.value}</p>
              <p className="text-[9.5px] text-slate-450 mt-1.5 leading-none font-medium">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 items-start">
        {/* Left Side: Directory Table & Filters */}
        <div className="space-y-4">
          
          {/* Categories Pill Tabs */}
          <div className="flex flex-wrap gap-1 bg-white border border-[#E2E8F0] p-1.5 rounded-[6px] shadow-3xs w-fit">
            {["all", "hotel", "transport", "guide", "meals", "equipment", "other"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-3 py-1.5 rounded-[4px] text-[10.5px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                  filter === t 
                    ? "bg-[#F97316]/10 text-[#F97316] font-extrabold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                {t === "all" ? "All categories" : t}
              </button>
            ))}
          </div>

          {/* Zoho Secondary Toolbar Filters */}
          <div className="bg-white rounded-[6px] border border-slate-200 shadow-xs p-3 flex flex-wrap gap-2.5 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={tripFilter}
              onChange={(e) => setTripFilter(e.target.value)}
              className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
            >
              <option value="all">All Trips</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>

            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                placeholder="Filter Location..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="pl-8 pr-2.5 h-8 w-40 text-[11px] font-medium border border-slate-200 rounded-[4px] bg-white text-slate-700 outline-none hover:bg-slate-50"
              />
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                placeholder="Search partner, contact..." 
                className="w-full pl-8.5 pr-4 h-8 bg-slate-50 rounded-[4px] border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {(statusFilter !== "all" || locationSearch || searchQuery || tripFilter !== "all") && (
              <button 
                onClick={() => { setStatusFilter("all"); setLocationSearch(""); setSearchQuery(""); setTripFilter("all"); }} 
                className="text-[11px] font-bold text-red-500 hover:underline ml-1"
              >
                Clear
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button onClick={handleExportCSV} className="w-8 h-8 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-650 cursor-pointer" title="Export CSV">
                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={load} className="w-8 h-8 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-650 cursor-pointer" title="Refresh">
                <RotateCw className={cn("w-4 h-4 text-slate-400", loading && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-[6px] border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-10 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-slate-50 animate-pulse rounded border border-slate-100" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-250" />
                <p className="text-sm font-black text-slate-800">No partner listings found</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">Try refining search parameters or register a new vendor partner</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[9.5px] font-bold uppercase tracking-wider text-slate-450">
                      <th className="px-4 py-3.5 border-r border-slate-100 w-10 text-center"><input type="checkbox" className="rounded-[2px] border-slate-300" /></th>
                      <th className="px-4 py-3.5 border-r border-slate-100">Partner Details</th>
                      <th className="px-4 py-3.5 border-r border-slate-100">Contact Details</th>
                      <th className="px-4 py-3.5 border-r border-slate-100">Location</th>
                      <th className="px-4 py-3.5 border-r border-slate-100">Status</th>
                      <th className="px-4 py-3.5 border-r border-slate-100">Remarks / Agreements</th>
                      <th className="px-4 py-3.5 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {filtered.map((v) => {
                      const TypeIcon = VENDOR_TYPE_ICONS[v.type] || HelpCircle;
                      const isActive = v.isActive !== false;
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 py-3.5 border-r border-slate-100 text-center"><input type="checkbox" className="rounded-[2px] border-slate-300" /></td>
                          
                          {/* Name & Type Avatar */}
                          <td className="px-4 py-3 border-r border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0 border", VENDOR_TYPE_COLORS[v.type])}>
                                <TypeIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p 
                                  onClick={() => openEdit(v)}
                                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-xs uppercase tracking-tight leading-tight cursor-pointer"
                                >
                                  {v.name}
                                </p>
                                <span className={cn("text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded-[2px] mt-1.5 inline-block border", VENDOR_TYPE_COLORS[v.type])}>
                                  {v.type}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="px-4 py-3 border-r border-slate-100">
                            <div className="space-y-0.5 text-[11px] text-slate-650 font-semibold font-mono">
                              {v.phone ? (
                                <div className="flex items-center gap-1">
                                  <Phone size={11} className="text-slate-400 shrink-0" />
                                  <span>{v.phone}</span>
                                  <button onClick={() => handleCopyText(v.phone!, "Phone")} className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy size={9} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-350 italic text-[10px]">No Phone</span>
                              )}
                              {v.email ? (
                                <div className="flex items-center gap-1">
                                  <Mail size={11} className="text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[140px]">{v.email}</span>
                                  <button onClick={() => handleCopyText(v.email!, "Email")} className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy size={9} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-350 italic text-[10px]">No Email</span>
                              )}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-4 py-3 border-r border-slate-100">
                            {v.location ? (
                              <div className="flex items-center gap-1 text-[11.5px] text-[#172033] font-bold uppercase tracking-tight">
                                <MapPin size={11.5} className="text-[#F97316] shrink-0" />
                                <span>{v.location}</span>
                              </div>
                            ) : (
                              <span className="text-slate-350 italic text-[11px]">Unspecified</span>
                            )}
                          </td>

                          {/* Status Toggle */}
                          <td className="px-4 py-3 border-r border-slate-100">
                            <button 
                              onClick={() => handleToggleStatus(v)}
                              className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[8.5px] font-black uppercase tracking-wider border cursor-pointer",
                                isActive 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" 
                                  : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                              )}
                            >
                              {isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                              {isActive ? "Active" : "Inactive"}
                            </button>
                          </td>

                          {/* Remarks / Notes */}
                          <td className="px-4 py-3 border-r border-slate-100">
                            {v.notes ? (
                              <p className="text-[11px] text-slate-500 italic max-w-[200px] truncate" title={v.notes}>
                                "{v.notes}"
                              </p>
                            ) : (
                              <span className="text-slate-300 italic text-[10.5px]">No special terms</span>
                            )}
                          </td>

                          {/* Dropdown Actions */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center items-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded cursor-pointer">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 bg-white border border-slate-200 shadow-lg rounded-[4px] p-1 text-[11px] font-bold text-slate-750 z-[100]">
                                  <DropdownMenuItem className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 cursor-pointer rounded-[3px]" onClick={() => openEdit(v)}>
                                    <Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="flex items-center gap-2 px-2.5 py-2 hover:bg-rose-50 hover:text-rose-600 cursor-pointer rounded-[3px]" onClick={() => handleDelete(v.id)}>
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Partner
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Zoho Pagination */}
            <div className="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-500 font-bold bg-slate-50/50">
              <span>Showing 1 to {filtered.length} of {stats.total} partners</span>
              <div className="flex items-center gap-1.5">
                <button disabled className="px-2.5 py-1 bg-white border border-slate-200 rounded-[3px] text-slate-400 cursor-not-allowed">&lt;</button>
                <button className="px-2.5 py-1 bg-[#F97316] border border-[#F97316] text-white rounded-[3px]">1</button>
                <button className="px-2.5 py-1 bg-white border border-slate-200 rounded-[3px] text-slate-650 hover:bg-slate-50">2</button>
                <button className="px-2.5 py-1 bg-white border border-slate-200 rounded-[3px] text-slate-650 hover:bg-slate-50">&gt;</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Storage / Coverage & Distribution Sidebar */}
        <div className="space-y-4 shrink-0">
          
          {/* Distribution card */}
          <div className="bg-white rounded-[6px] border border-slate-200 shadow-xs p-4 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Partner Categories</h3>
            <div className="space-y-2.5">
              {[
                { l: "GST Registered", c: stats.active, percent: stats.total > 0 ? Math.round((stats.active/stats.total)*100) : 0, color: "bg-emerald-500" },
                { l: "Hotels & Stays", c: stats.hotel, percent: stats.total > 0 ? Math.round((stats.hotel/stats.total)*100) : 0, color: "bg-blue-500" },
                { l: "Transport Fleets", c: stats.transport, percent: stats.total > 0 ? Math.round((stats.transport/stats.total)*100) : 0, color: "bg-amber-500" },
                { l: "Guides & Experts", c: stats.guide, percent: stats.total > 0 ? Math.round((stats.guide/stats.total)*100) : 0, color: "bg-purple-500" },
              ].map(cat => (
                <div key={cat.l} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600">{cat.l}</span>
                    <span className="text-slate-400 font-mono">{cat.c} ({cat.percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", cat.color)} style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed card */}
          <div className="bg-white rounded-[6px] border border-slate-200 shadow-xs p-4 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Activity</h3>
            <div className="space-y-3.5">
              {[
                { time: "Today, 10:15 AM", user: "Suresh Kumar", action: "Registered Himalayan Stays", icon: <Building2 className="w-3.5 h-3.5 text-blue-600" />, bg: "bg-blue-50" },
                { time: "Yesterday", user: "Parth Rathod", action: "Updated Himalayan Vehicles", icon: <Truck className="w-3.5 h-3.5 text-amber-600" />, bg: "bg-amber-50" },
                { time: "05 Jul 2026", user: "Neeki Patel", action: "Deactivated Guide Dinesh", icon: <UserCheck className="w-3.5 h-3.5 text-red-650" />, bg: "bg-rose-50" },
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[11px]">
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", act.bg)}>{act.icon}</div>
                  <div>
                    <p className="font-bold text-slate-800 leading-snug">{act.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-none">By {act.user} · {act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
