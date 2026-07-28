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
      header: "Trip", 
      render: (t: Trip) => {
        if (!t) return null;
        const img = t.heroImage || t.images?.[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400";
        return (
          <div className="flex items-center gap-3 min-w-[280px]">
            <img 
              src={img} 
              alt={t.title || ""} 
              className="h-8 w-8 rounded-md object-cover border border-slate-200 shrink-0" 
            />
            <div className="min-w-0">
              <p className="font-medium text-slate-900 text-sm hover:text-[#D4541A] transition-colors cursor-pointer truncate" onClick={() => openEdit(t)}>
                {t.title || "Untitled Expedition"}
              </p>
              {t.location && t.location.toLowerCase() !== "destination" && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {t.location}
                </p>
              )}
            </div>
          </div>
        );
      }
    },
    { 
      key: "tripCode", 
      header: "Code", 
      render: (t: Trip) => (
        <span className="text-xs text-slate-600 font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
          {t?.tripCode || t?.id?.substring(0, 8) || "N/A"}
        </span>
      )
    },
    { 
      key: "category", 
      header: "Category", 
      render: (t: Trip) => (
        <span className="text-xs text-slate-600 capitalize">
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
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-900">
              ₹{isNaN(price) ? '0' : price.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">per traveler</span>
          </div>
        );
      }
    },
    {
      key: "order",
      header: "Order",
      render: (t: Trip) => (
        <span className="text-xs font-black text-[#FF5400]">
          #{t?.order || 0}
        </span>
      )
    },
    { 
      key: "duration", 
      header: "Duration", 
      render: (t: Trip) => (
        <span className="text-xs text-slate-700 font-medium">
          {t?.duration || "N/A"}
        </span>
      )
    },
    {
      key: "itinerary",
      header: "Itinerary",
      render: (t: Trip) => {
        const durationStr = String(t?.duration || "");
        const daysMatch = durationStr.match(/(\d+)\s*(?:Days?|D)/i);
        const daysVal = daysMatch ? daysMatch[1] : "N/A";
        return (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md w-fit">
            <CalendarDays className="w-3.5 h-3.5 text-[#FF5400]" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold text-slate-700">{daysVal}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Days</span>
            </div>
          </div>
        );
      }
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
            className={cn(
              "cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors",
              isPub ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" : "bg-orange-50 text-[#FF5400] border-orange-100 hover:bg-orange-100"
            )}
            title="Click to toggle status"
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", isPub ? "bg-emerald-500" : "bg-[#FF5400]")} />
            {isPub ? "ACTIVE" : "DRAFT"}
          </button>
        );
      }
    },
    { 
      key: "actions", 
      header: "", 
      render: (t: Trip) => {
        if (!t) return null;
        return (
          <div className="flex gap-1 items-center justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setVendorTrip(t)} 
              title="Manage Hotel & Transport Vendors" 
              className="h-7 w-7 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md"
            >
              <Building2 className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => openEdit(t)} 
              title="Edit Itinerary & Pricing" 
              className="h-7 w-7 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDelete(t.id)} 
              title="Delete Trip" 
              className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 className="h-3.5 w-3.5" />
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
    <div className="p-6 bg-[#FAFAFA] min-h-screen font-sans text-slate-900">
      {/* ─── Page Header & Key Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Expeditions</h1>
            <span className="bg-orange-50 text-[#FF5400] text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-wider">Catalog OS</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Manage itineraries, dynamic pricing, variants & distribution.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setSortModalOpen(true)} 
            className="h-8 px-3 rounded-lg text-xs font-semibold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs gap-1.5"
          >
            <GripVertical className="w-3.5 h-3.5 text-slate-400" /> Reorder
          </Button>
          <Button 
            variant="outline"
            onClick={handleShuffle} 
            className="h-8 px-3 rounded-lg text-xs font-semibold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5 text-slate-400" /> Shuffle
          </Button>
          <Button 
            onClick={openCreate} 
            className="h-8 px-3.5 rounded-lg text-xs font-bold bg-[#FF5400] hover:bg-[#e04a00] text-white shadow-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Expedition
          </Button>
        </div>
      </div>

      {/* ─── Compact Metrics Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{metrics.total}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">ALL</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Published</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block">{metrics.published}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">LIVE</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Drafts</span>
            <span className="text-xl font-black text-amber-600 mt-0.5 block">{metrics.draft}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">DEV</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Categories</span>
            <span className="text-xl font-black text-[#FF5400] mt-0.5 block">{metrics.categories}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5400] font-bold text-xs">CAT</div>
        </div>
      </div>

      {/* ─── Compact Controls Bar & Data Table Container ─── */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: "all", label: "All Catalog" },
              { id: "backpacking", label: "Backpacking" },
              { id: "roadtrip", label: "Road Trips" },
              { id: "international", label: "International" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap",
                  categoryTab === tab.id
                    ? "bg-white text-[#FF5400] shadow-2xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters & Status */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter trips..."
                className="h-8 pl-8 pr-3 text-xs bg-white border border-slate-200/80 rounded-md outline-none focus:border-[#FF5400] w-48 transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 text-xs font-semibold bg-white border border-slate-200/80 rounded-md px-2.5 text-slate-700 outline-none cursor-pointer focus:border-[#FF5400]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="p-2">
          <DataTable
            columns={columns} 
            data={filtered} 
            loading={loading}
            searchKey="title" 
            searchPlaceholder="Search trips..."
            emptyMessage="No expeditions found" 
            emptyIcon={<Search className="h-6 w-6 text-slate-300" />}
          />
        </div>
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
