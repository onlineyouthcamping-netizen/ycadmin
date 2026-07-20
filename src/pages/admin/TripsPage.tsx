import { useEffect, useState, useCallback } from "react";
import { tripsService } from "@/services/trips.service";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import TripFormEditor from "@/components/admin/TripFormEditor";
import TripSortModal from "@/components/admin/TripSortModal";
import type { Trip, TripFormData } from "@/types";
import { Plus, Pencil, Trash2, Map, CalendarDays, Building2, Shuffle, GripVertical } from "lucide-react";
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

  const filtered = (trips || []).filter((t) => {
    if (!t) return false;
    return statusFilter === "all" || t.status === statusFilter;
  });

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
    } catch (error: any) {
      console.error("❌ SAVE ERROR:", error);
      const msg = error.response?.data?.message || "Failed to save trip";
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id || !confirm("Delete this trip?")) return;
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
      toast.success(`Trip ${newStatus}`);
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
    { key: "title", header: "Trip", render: (t: Trip) => {
      if (!t) return null;
      return (
        <div className="flex items-center gap-3 min-w-[250px]">
          {(t.heroImage || t.images?.[0]) && (
            <img 
              src={t.heroImage || t.images?.[0]} 
              alt="" 
              className="h-10 w-14 rounded-[6px] object-cover" 
            />
          )}
          <div>
            <p className="font-bold text-slate-800">{t.title || "Untitled"}</p>
            {t.location && t.location.toLowerCase() !== "destination" && (
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t.location}</p>
            )}
          </div>
        </div>
      );
    }},
    { key: "tripCode", header: "Trip Code", render: (t: Trip) => {
      if (!t) return null;
      return (
        <span className="font-mono text-xs font-bold text-[#F97316] whitespace-nowrap">
          {t.tripCode || t.id || "N/A"}
        </span>
      );
    }},
    { key: "category", header: "Category", render: (t: Trip) => (
      <span className="text-slate-650 font-semibold capitalize whitespace-nowrap">{t?.category?.replace(/-/g, ' ') || "N/A"}</span>
    )},
    { key: "price", header: "Price", render: (t: Trip) => {
      const price = Number(t?.price);
      return <span className="font-bold text-slate-800 whitespace-nowrap">₹{isNaN(price) ? '0' : price.toLocaleString()}</span>;
    }},
    { key: "order", header: "Order", render: (t: Trip) => (
      <span className="font-bold text-[#F97316]">{t.order || 0}</span>
    )},
    { key: "duration", header: "Duration", render: (t: Trip) => <span className="text-slate-600 font-semibold">{t?.duration || "N/A"}</span> },
    { key: "itinerary", header: "Days", render: (t: Trip) => (
      <span className="flex items-center gap-1 text-slate-500 font-bold">
        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
        {Array.isArray(t?.itinerary) ? t.itinerary.length : "0"}
      </span>
    )},
    { key: "status", header: "Status", render: (t: Trip) => {
      if (!t?.status) return null;
      return (
        <button onClick={() => toggleStatus(t)} className="block">
          <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-[3px] border uppercase tracking-wider block w-fit",
            t.status === "published" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
          )}>{t.status}</span>
        </button>
      );
    }},
    { key: "actions", header: "", render: (t: Trip) => {
      if (!t) return null;
      return (
        <div className="flex gap-1.5 items-center justify-end">
          <Button variant="ghost" size="icon" onClick={() => setVendorTrip(t)} title="Manage Vendors" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded">
            <Building2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded"><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-7 w-7 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></Button>
        </div>
      );
    }},
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
    <div className="space-y-4 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* ─── Page Title ─── */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Map className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Products</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Manage travel itineraries, pricing, and configurations</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setSortModalOpen(true)} 
            className="h-8.5 px-3 rounded-[4px] font-semibold text-xs border border-slate-200 bg-white text-slate-650 flex items-center gap-1.5 shadow-xs"
          >
            <GripVertical className="w-4 h-4 text-slate-455" /> Reorder
          </Button>
          <Button 
            onClick={handleShuffle} 
            className="h-8.5 px-3 rounded-[4px] font-semibold text-xs border border-slate-200 bg-white text-slate-650 flex items-center gap-1.5 shadow-xs"
          >
            <Shuffle className="w-4 h-4 text-slate-455" /> Shuffle
          </Button>
          <Button 
            onClick={openCreate} 
            className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Trip
          </Button>
        </div>
      </div>

      {/* Payment automation banner */}
      <div className="bg-[#FFF8E6] border border-[#FFE0B2] rounded-[6px] px-5 py-4 text-xs text-[#E65100] flex items-start gap-3 shadow-xs font-semibold">
        <span className="bg-[#FF5400] text-white text-[9px] font-black px-2 py-0.5 rounded-[4px] uppercase tracking-wider">Update</span>
        <div>
          <strong className="font-black">Payment automation is active:</strong> Accept partial deposits, set deadlines, auto-request balance payments, and send automatic reminders.
        </div>
      </div>

      <div className="bg-white rounded-[6px] border border-[#E2E8F0] shadow-xs p-4">
        <DataTable
          columns={columns} data={filtered} loading={loading}
          searchKey="title" searchPlaceholder="Search by title, code..."
          emptyMessage="No trips found" 
          emptyIcon={<Map className="h-8 w-8 text-slate-350" />}
          filters={[{ key: "status", label: "Status", options: [{ label: "Published", value: "published" }, { label: "Draft", value: "draft" }] }]}
          onFilterChange={(_, v) => setStatusFilter(v)}
        />
      </div>

      {vendorTrip && (
        <TripVendorsPanel
          tripId={vendorTrip.id}
          tripTitle={vendorTrip.title}
          tripPrice={vendorTrip.price}
          open={!!vendorTrip}
          onOpenChange={(open) => { if (!open) setVendorTrip(null); }}
        />
      )}
      <TripSortModal 
        open={sortModalOpen} 
        onOpenChange={setSortModalOpen} 
        trips={trips} 
        onSaved={load} 
      />
    </div>
  );
}
