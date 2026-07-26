import { useEffect, useState, useCallback, useMemo } from "react";
import { tripsService } from "@/services/trips.service";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import TripFormEditor from "@/components/admin/TripFormEditor";
import TripSortModal from "@/components/admin/TripSortModal";
import type { Trip, TripFormData } from "@/types";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Map, 
  CalendarDays, 
  Building2, 
  Shuffle, 
  GripVertical,
  Compass,
  CheckCircle2,
  FileEdit,
  Globe,
  Sparkles,
  ArrowUpDown,
  Search,
  Filter,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import TripVendorsPanel from "@/components/admin/TripVendorsPanel";
import { cn } from "@/lib/utils";

let cachedTripsList: Trip[] | null = null;

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>(cachedTripsList || []);
  const [loading, setLoading] = useState(!cachedTripsList);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryTab, setCategoryTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vendorTrip, setVendorTrip] = useState<Trip | null>(null);
  const [sortModalOpen, setSortModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!cachedTripsList) setLoading(true);
    try {
      const data = await tripsService.getAll();
      const arr = Array.isArray(data) ? data : [];
      cachedTripsList = arr;
      setTrips(arr);
    } catch (err) {
      console.error(err);
      if (!cachedTripsList) setTrips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Quick Metrics Stats
  const metrics = useMemo(() => {
    const total = trips.length;
    const published = trips.filter(t => t.status === "published").length;
    const draft = trips.filter(t => t.status !== "published").length;
    const categories = new Set(trips.map(t => t.category).filter(Boolean)).size;
    return { total, published, draft, categories };
  }, [trips]);

  // Filtered trips
  const filtered = useMemo(() => {
    return (trips || []).filter((t) => {
      if (!t) return false;
      
      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      
      // Category Tab filter
      if (categoryTab !== "all") {
        const cat = (t.category || "").toLowerCase();
        if (categoryTab === "backpacking" && !cat.includes("backpack")) return false;
        if (categoryTab === "roadtrip" && !cat.includes("road")) return false;
        if (categoryTab === "international" && !cat.includes("inter")) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (t.title || "").toLowerCase().includes(q);
        const matchCode = (t.tripCode || t.id || "").toLowerCase().includes(q);
        const matchLoc = (t.location || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchLoc) return false;
      }

      return true;
    });
  }, [trips, statusFilter, categoryTab, searchQuery]);

  const openCreate = () => { setEditing(null); setIsEditingMode(true); };
  const openEdit = (t: Trip) => { 
    if (!t?.id) return;
    setEditing(t);
    setIsEditingMode(true); 
    tripsService.getById(t.id).then(fullTrip => {
      if (fullTrip) setEditing(fullTrip);
    }).catch(() => {});
  };

  const handleSave = async (data: TripFormData, editingId?: string) => {
    const payload = {
      ...data,
      title: data.title || "Untitled Trip",
      location: data.location || "TBD",
      price: data.price || 0,
      duration: data.duration || "TBD",
      description: data.description || "No description provided.",
      status: data.status || "draft",
    };

    try {
      if (editingId) {
        await tripsService.update(editingId, payload);
        toast.success("Trip updated successfully");
      } else {
        await tripsService.create(payload);
        toast.success("New trip created");
      }
      load();
      setIsEditingMode(false);
      setEditing(null);
    } catch (error: any) {
      console.error("❌ SAVE ERROR:", error);
      const msg = error.response?.data?.message || "Failed to save trip";
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id || !confirm("Are you sure you want to delete this trip itinerary?")) return;
    try {
      await tripsService.remove(id);
      toast.success("Trip deleted");
      load();
    } catch (error: any) {
      console.error("❌ DELETE ERROR:", error);
      const msg = error.response?.data?.message || "Failed to delete trip";
      toast.error(msg);
    }
  };

  const toggleStatus = async (t: Trip) => {
    if (!t?.id) return;
    try {
      const newStatus = t.status === "published" ? "draft" : "published";
      await tripsService.update(t.id, { status: newStatus });
      toast.success(`Trip status changed to ${newStatus}`);
      load();
    } catch (error: any) {
      console.error("❌ STATUS ERROR:", error);
      toast.error("Failed to update status");
    }
  };

  const handleShuffle = async () => {
    try {
      await tripsService.shuffle();
      toast.success("Trips shuffled successfully!");
      load();
    } catch (error) {
      toast.error("Failed to shuffle trips");
    }
  };

  const columns = [
    { 
      key: "title", 
      header: "Trip / Itinerary", 
      render: (t: Trip) => {
        if (!t) return null;
        const img = t.heroImage || t.images?.[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400";
        return (
          <div className="flex items-center gap-3.5 min-w-[280px]">
            <img 
              src={img} 
              alt={t.title || ""} 
              className="h-11 w-16 rounded-xl object-cover shadow-xs border border-slate-200/80 shrink-0" 
            />
            <div className="min-w-0">
              <p className="font-extrabold text-[#0B1528] text-xs leading-tight hover:text-[#D4541A] transition-colors cursor-pointer truncate" onClick={() => openEdit(t)}>
                {t.title || "Untitled Expedition"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {t.location && t.location.toLowerCase() !== "destination" && (
                  <span className="text-[10.5px] text-slate-500 font-medium truncate flex items-center gap-1">
                    <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                    {t.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    { 
      key: "tripCode", 
      header: "Trip Code", 
      render: (t: Trip) => {
        if (!t) return null;
        return (
          <span className="font-mono text-xs font-bold text-[#D4541A] bg-orange-50/80 border border-orange-200/60 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap">
            {t.tripCode || t.id || "N/A"}
          </span>
        );
      }
    },
    { 
      key: "category", 
      header: "Category", 
      render: (t: Trip) => (
        <span className="text-xs font-bold text-slate-700 bg-slate-100/80 border border-slate-200/60 px-2.5 py-1 rounded-lg inline-block capitalize whitespace-nowrap">
          {t?.category?.replace(/-/g, ' ') || "Expedition"}
        </span>
      )
    },
    { 
      key: "price", 
      header: "Price", 
      render: (t: Trip) => {
        const price = Number(t?.price);
        return (
          <div className="whitespace-nowrap">
            <span className="font-extrabold text-xs text-[#0B1528]">
              ₹{isNaN(price) ? '0' : price.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">per traveler</span>
          </div>
        );
      }
    },
    { 
      key: "order", 
      header: "Order", 
      render: (t: Trip) => (
        <span className="font-extrabold text-xs text-[#D4541A] bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
          #{t.order || 0}
        </span>
      )
    },
    { 
      key: "duration", 
      header: "Duration", 
      render: (t: Trip) => (
        <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
          {t?.duration || "N/A"}
        </span>
      )
    },
    { 
      key: "itinerary", 
      header: "Itinerary", 
      render: (t: Trip) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/70 px-2 py-1 rounded-md">
          <CalendarDays className="h-3.5 w-3.5 text-[#D4541A]" />
          {Array.isArray(t?.itinerary) ? `${t.itinerary.length} Days` : "0 Days"}
        </span>
      )
    },
    { 
      key: "status", 
      header: "Status", 
      render: (t: Trip) => {
        if (!t?.status) return null;
        const isPub = t.status === "published";
        return (
          <button 
            type="button" 
            onClick={() => toggleStatus(t)} 
            className="cursor-pointer group"
            title="Click to toggle status"
          >
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold border uppercase tracking-wider transition-all",
              isPub 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100" 
                : "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-slate-200"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", isPub ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
              {t.status}
            </span>
          </button>
        );
      }
    },
    { 
      key: "actions", 
      header: "Actions", 
      render: (t: Trip) => {
        if (!t) return null;
        return (
          <div className="flex gap-1 items-center justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setVendorTrip(t)} 
              title="Manage Hotel & Transport Vendors" 
              className="h-8 w-8 text-slate-500 hover:text-[#D4541A] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            >
              <Building2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => openEdit(t)} 
              title="Edit Itinerary & Pricing" 
              className="h-8 w-8 text-slate-500 hover:text-[#D4541A] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDelete(t.id)} 
              title="Delete Trip" 
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    },
  ];

  if (isEditingMode) {
    return (
      <TripFormEditor
        editing={editing}
        onSave={handleSave}
        onCancel={() => {
          setIsEditingMode(false);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-6 sm:p-8 bg-slate-50/50 min-h-screen font-sans">
      {/* ─── Top Header Bar ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-[#D4541A] flex items-center justify-center font-bold shrink-0">
              <Compass className="w-5 h-5 text-[#D4541A]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0B1528] tracking-tight">
                Trip Expeditions & Catalog
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Manage itineraries, prices, variants, vendor allocations, and public website displays
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button 
            variant="outline"
            onClick={() => setSortModalOpen(true)} 
            className="h-10 px-3.5 rounded-xl font-bold text-xs border-slate-200 hover:border-[#D4541A] hover:bg-orange-50/50 text-slate-700 flex items-center gap-2 cursor-pointer transition-all shadow-2xs"
          >
            <GripVertical className="w-4 h-4 text-[#D4541A]" /> Reorder Catalog
          </Button>
          <Button 
            variant="outline"
            onClick={handleShuffle} 
            className="h-10 px-3.5 rounded-xl font-bold text-xs border-slate-200 hover:border-[#D4541A] hover:bg-orange-50/50 text-slate-700 flex items-center gap-2 cursor-pointer transition-all shadow-2xs"
          >
            <Shuffle className="w-4 h-4 text-slate-500" /> Shuffle Display
          </Button>
          <Button 
            onClick={openCreate} 
            className="h-10 px-5 rounded-xl font-extrabold text-xs bg-[#D4541A] hover:bg-[#c24813] text-white flex items-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Trip
          </Button>
        </div>
      </div>

      {/* ─── Metric Summary Cards Bar ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Expeditions</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#0B1528]">{metrics.total}</span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Catalog</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Published</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{metrics.published}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Draft & Hidden</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{metrics.draft}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              Unpublished
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categories</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#D4541A]">{metrics.categories}</span>
            <span className="text-xs font-bold text-[#D4541A] bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md">
              Diverse
            </span>
          </div>
        </div>
      </div>

      {/* ─── Automation Notice Banner ─── */}
      <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-[#D4541A] text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs text-slate-700">
          <p className="font-extrabold text-[#0B1528]">Automatic Payment & Booking Link Engine Active</p>
          <p className="font-medium text-slate-600">
            Trip prices, available departure dates, and variants configured here are automatically synchronized with WhatsApp payment links, quotation generators, and customer booking forms.
          </p>
        </div>
      </div>

      {/* ─── Main Table Container ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        {/* Category & Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Trips" },
              { id: "backpacking", label: "Backpacking" },
              { id: "roadtrip", label: "Road Trips" },
              { id: "international", label: "International" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryTab(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap",
                  categoryTab === tab.id
                    ? "bg-[#D4541A] text-white shadow-xs"
                    : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/80"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200/90 px-3 outline-none focus:border-[#D4541A] text-slate-700 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns} 
          data={filtered} 
          loading={loading}
          searchKey="title" 
          searchPlaceholder="Search trip by title, location, or trip code..."
          emptyMessage="No trip expeditions found matching criteria" 
          emptyIcon={<Compass className="h-10 w-10 text-slate-300" />}
        />
      </div>

      {/* Vendor Allocation Drawer Modal */}
      {vendorTrip && (
        <TripVendorsPanel
          tripId={vendorTrip.id}
          tripTitle={vendorTrip.title}
          tripPrice={vendorTrip.price}
          open={!!vendorTrip}
          onOpenChange={(open) => { if (!open) setVendorTrip(null); }}
        />
      )}

      {/* Sort Reorder Modal */}
      <TripSortModal 
        open={sortModalOpen} 
        onOpenChange={setSortModalOpen} 
        trips={trips} 
        onSaved={load} 
      />
    </div>
  );
}
