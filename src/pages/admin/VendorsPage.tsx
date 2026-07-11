import { useEffect, useState, useCallback, useMemo } from "react";
import { vendorsService } from "@/services/vendors.service";
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
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Secondary filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationSearch, setLocationSearch] = useState("");

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
    setModalOpen(true);
  };

  const openEdit = (v: Vendor) => {
    setEditing(v);
    setForm({
      name: v.name,
      type: v.type,
      phone: v.phone || "",
      email: v.email || "",
      location: v.location || "",
      notes: v.notes || "",
      isActive: v.isActive !== false,
    });
    setModalOpen(true);
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
        toast.success("Vendor updated successfully");
      } else {
        await vendorsService.create(form);
        toast.success("Vendor created successfully");
      }
      setModalOpen(false);
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
      const matchesSearch = !searchQuery || 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesStatus && matchesLoc && matchesSearch;
    });
  }, [vendors, filter, statusFilter, locationSearch, searchQuery]);

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
        <Button onClick={openCreate} className="h-8.5 px-4 rounded-[4px] font-bold text-xs bg-[#F97316] hover:bg-[#E05E00] text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
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

            {(statusFilter !== "all" || locationSearch || searchQuery) && (
              <button 
                onClick={() => { setStatusFilter("all"); setLocationSearch(""); setSearchQuery(""); }} 
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
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0 border", VENDOR_TYPE_COLORS[v.type])}>
                                <TypeIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-[#172033] text-xs uppercase tracking-tight leading-tight">{v.name}</p>
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

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[4px] border border-slate-200 p-0 overflow-hidden shadow-luxury bg-white">
          <div className="bg-slate-50 p-5 border-b border-[#E2E8F0]">
            <DialogHeader>
              <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#F97316]" />
                {editing ? "Refine Partner Profile" : "Register New Partner"}
              </DialogTitle>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Configure logistics & service providers</p>
            </DialogHeader>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Partner / Vendor Name *</label>
              <Input
                placeholder="e.g. Mountain View Resorts"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-semibold text-slate-700 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Service Category *</label>
                <Select value={form.type} onValueChange={(v: Vendor["type"]) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs text-slate-700 font-semibold"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="hotel">🏨 Hotel / Stay</SelectItem>
                    <SelectItem value="transport">🚐 Transport Fleet</SelectItem>
                    <SelectItem value="guide">🧑‍🤝‍🧑 Mountain Guide</SelectItem>
                    <SelectItem value="meals">🍽️ Meals / Catering</SelectItem>
                    <SelectItem value="equipment">🔧 Rent Gear / Tools</SelectItem>
                    <SelectItem value="other">📦 Other Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Activation Status</label>
                <Select 
                  value={form.isActive ? "active" : "inactive"} 
                  onValueChange={(v) => setForm({ ...form, isActive: v === "active" })}
                >
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs text-slate-700 font-semibold"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="active">🟢 Active Partner</SelectItem>
                    <SelectItem value="inactive">🔴 Inactive / Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</label>
                <Input
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-semibold text-slate-700 bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <Input
                  placeholder="partner@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-semibold text-slate-700 bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Geographical Location</label>
              <Input
                placeholder="e.g. Leh, Jammu & Kashmir"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-semibold text-slate-700 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Internal Remarks / Agreements</label>
              <textarea
                placeholder="Special commercial terms, contract parameters or notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full min-h-[70px] rounded-[4px] border border-[#E2E8F0] text-xs font-semibold text-slate-700 bg-white p-2.5 outline-none focus:border-[#F97316] transition-all animate-none"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-5 flex justify-end gap-2 border-t border-[#E2E8F0]">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-[4px] text-xs font-bold uppercase tracking-wider h-8.5 px-4 cursor-pointer">Cancel</Button>
            <Button onClick={handleSave} disabled={submitting} className="rounded-[4px] font-bold text-xs uppercase tracking-wider h-8.5 px-5 bg-[#F97316] hover:bg-[#E05E00] text-white cursor-pointer">
              {submitting ? "Saving Profile..." : editing ? "Update Profile" : "Register Partner"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
