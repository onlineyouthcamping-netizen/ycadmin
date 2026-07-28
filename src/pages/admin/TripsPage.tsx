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
          <span className="font-medium text-sm text-slate-900">
            ₹{isNaN(price) ? '0' : price.toLocaleString()}
          </span>
        );
      }
    },
    { 
      key: "duration", 
      header: "Duration", 
      render: (t: Trip) => (
        <span className="text-xs text-slate-600">
          {t?.duration || "N/A"}
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
            className="cursor-pointer group flex items-center gap-1.5"
            title="Click to toggle status"
          >
            <span className={cn("w-2 h-2 rounded-full", isPub ? "bg-emerald-500" : "bg-slate-300")} />
            <span className="text-xs text-slate-600 capitalize group-hover:text-slate-900 transition-colors">
              {t.status}
            </span>
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
    <div className="p-6 sm:p-8 bg-white min-h-screen font-sans">
      {/* ─── Top Header Bar ─── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Trips
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your catalog, itineraries, and pricing.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="outline"
            onClick={() => setSortModalOpen(true)} 
            className="h-8 px-3 rounded-md text-xs border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Reorder
          </Button>
          <Button 
            variant="outline"
            onClick={handleShuffle} 
            className="h-8 px-3 rounded-md text-xs border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Shuffle className="w-3.5 h-3.5 text-slate-400" /> Shuffle
          </Button>
          <Button 
            onClick={openCreate} 
            className="h-8 px-4 rounded-md font-medium text-xs bg-[#D4541A] hover:bg-[#c24813] text-white flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> New Trip
          </Button>
        </div>
      </div>

      {/* ─── Metric Summary Cards Bar ─── */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Total Trips</p>
          <p className="text-xl font-semibold text-slate-900">{metrics.total}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Published</p>
          <p className="text-xl font-semibold text-slate-900">{metrics.published}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Drafts</p>
          <p className="text-xl font-semibold text-slate-900">{metrics.draft}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Categories</p>
          <p className="text-xl font-semibold text-slate-900">{metrics.categories}</p>
        </div>
      </div>

      {/* ─── Automation Notice Banner ─── */}
      <div className="bg-slate-50/80 rounded-md p-3 flex items-start gap-3 mb-8 border border-slate-100">
        <Sparkles className="w-4 h-4 text-[#D4541A] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-900">Automation Active: </span>
          Trip prices, available departure dates, and variants configured here are automatically synchronized with WhatsApp payment links, quotation generators, and customer booking forms.
        </div>
      </div>

      {/* ─── Main Table Container ─── */}
      <div className="space-y-4">
        {/* Category & Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
            {[
              { id: "all", label: "All" },
              { id: "backpacking", label: "Backpacking" },
              { id: "roadtrip", label: "Road Trips" },
              { id: "international", label: "International" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryTab(tab.id)}
                className={cn(
                  "pb-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                  categoryTab === tab.id
                    ? "border-[#D4541A] text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium bg-transparent text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns} 
          data={filtered} 
          loading={loading}
          searchKey="title" 
          searchPlaceholder="Search trips..."
          emptyMessage="No trips found matching criteria" 
          emptyIcon={<Search className="h-8 w-8 text-slate-300" />}
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
