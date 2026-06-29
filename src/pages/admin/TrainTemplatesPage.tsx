import { useCallback, useEffect, useState } from "react";
import { trainTicketService, type TrainTemplate } from "@/services/trainTicket.service";
import { tripsService } from "@/services/trips.service";
import type { Trip } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Train, Calendar, ToggleLeft, ToggleRight, MapPin, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "Any Date";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

export default function TrainTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TrainTemplate[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<TrainTemplate | null>(null);

  const [formData, setFormData] = useState({
    tripId: "",
    tripTitle: "",
    departureDate: "",
    trainName: "",
    trainNumber: "",
    source: "",
    destination: "",
    defaultClass: "",
    defaultCoach: "",
    journeyDate: "",
    boardingPoint: "",
    droppingPoint: "",
    waitlistDisclaimer: "",
    isActive: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesData, tripsData] = await Promise.all([
        trainTicketService.getTemplates(),
        tripsService.getAll(),
      ]);
      setTemplates(templatesData || []);
      setTrips(tripsData || []);
    } catch (err) {
      console.error("Failed to load train templates", err);
      toast.error("Failed to load data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTripChange = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    setFormData((prev) => ({
      ...prev,
      tripId,
      tripTitle: trip ? trip.title : "",
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tripId: formData.tripId || null,
        tripTitle: formData.tripTitle || null,
        departureDate: formData.departureDate || null,
        journeyDate: formData.journeyDate || null,
      };

      if (editTemplate) {
        await trainTicketService.updateTemplate(editTemplate.id, payload);
        toast.success("Template updated successfully");
      } else {
        await trainTicketService.createTemplate(payload);
        toast.success("Template created successfully");
      }

      setCreateOpen(false);
      setEditTemplate(null);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save template");
    }
  };

  const handleEditClick = (template: TrainTemplate) => {
    setEditTemplate(template);
    setFormData({
      tripId: template.tripId || "",
      tripTitle: template.tripTitle || "",
      departureDate: template.departureDate ? template.departureDate.slice(0, 10) : "",
      trainName: template.trainName || "",
      trainNumber: template.trainNumber || "",
      source: template.source || "",
      destination: template.destination || "",
      defaultClass: template.defaultClass || "",
      defaultCoach: template.defaultCoach || "",
      journeyDate: template.journeyDate ? template.journeyDate.slice(0, 10) : "",
      boardingPoint: template.boardingPoint || "",
      droppingPoint: template.droppingPoint || "",
      waitlistDisclaimer: template.waitlistDisclaimer || "",
      isActive: template.isActive,
    });
    setCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await trainTicketService.deleteTemplate(id);
      toast.success("Template deleted successfully");
      loadData();
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const resetForm = () => {
    setFormData({
      tripId: "",
      tripTitle: "",
      departureDate: "",
      trainName: "",
      trainNumber: "",
      source: "",
      destination: "",
      defaultClass: "",
      defaultCoach: "",
      journeyDate: "",
      boardingPoint: "",
      droppingPoint: "",
      waitlistDisclaimer: "",
      isActive: true,
    });
  };

  const filteredTemplates = templates.filter(
    (t) =>
      (t.trainName || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.trainNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.tripTitle || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.source || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.destination || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Train className="w-5 h-5 text-primary" />
            Train Templates Management
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Configure default train ticket profiles to prefill traveler ticket details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setEditTemplate(null);
              resetForm();
              setCreateOpen(true);
            }}
            className="h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search templates by train, trip, source, or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-[11px] rounded-lg border-slate-200"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Train className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[12px] font-semibold text-slate-500">No templates found</p>
            <p className="text-[10px] text-slate-400 mt-1">Get started by creating a new template.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Train Detail</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Route</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Trip & Dates</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Defaults</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="text-right px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-800">{template.trainName || "—"}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">#{template.trainNumber || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col text-[10px] font-medium text-slate-600">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {template.source || "—"} → {template.destination || "—"}</span>
                        {template.boardingPoint && <span className="text-[9px] text-slate-400 mt-0.5">Boarding: {template.boardingPoint}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-primary">{template.tripTitle || "All Trips"}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> Dep: {formatDate(template.departureDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col text-[10px] text-slate-500 font-medium">
                        <span>Class: {template.defaultClass || "—"}</span>
                        <span>Coach: {template.defaultCoach || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                        template.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(template)}
                          className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Train className="w-5 h-5 text-primary" />
              {editTemplate ? "Edit Train Template" : "Add Train Template"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill in train defaults which will prefill traveler-level ticket profiles.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Trip Reference */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trip (Optional)</label>
                <Select value={formData.tripId} onValueChange={handleTripChange}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose trip context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Trips (Global Template)</SelectItem>
                    {trips.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Train Name and Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Train Name</label>
                <Input
                  placeholder="e.g. Rajdhani Express"
                  value={formData.trainName}
                  onChange={(e) => setFormData({ ...formData, trainName: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Train Number</label>
                <Input
                  placeholder="e.g. 12951"
                  value={formData.trainNumber}
                  onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              {/* Source & Destination */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Source Station</label>
                <Input
                  placeholder="e.g. NDLS"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Destination Station</label>
                <Input
                  placeholder="e.g. BCT"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              {/* Journey Date and Departure Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Departure Date (Matching Booking)</label>
                <Input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Journey Date</label>
                <Input
                  type="date"
                  value={formData.journeyDate}
                  onChange={(e) => setFormData({ ...formData, journeyDate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              {/* Default Class and Coach */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Default Class</label>
                <Input
                  placeholder="e.g. 3AC"
                  value={formData.defaultClass}
                  onChange={(e) => setFormData({ ...formData, defaultClass: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Default Coach</label>
                <Input
                  placeholder="e.g. B1"
                  value={formData.defaultCoach}
                  onChange={(e) => setFormData({ ...formData, defaultCoach: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              {/* Boarding and Dropping Points */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Boarding Point</label>
                <Input
                  placeholder="e.g. NDLS"
                  value={formData.boardingPoint}
                  onChange={(e) => setFormData({ ...formData, boardingPoint: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dropping Point</label>
                <Input
                  placeholder="e.g. BCT"
                  value={formData.droppingPoint}
                  onChange={(e) => setFormData({ ...formData, droppingPoint: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              {/* Disclaimer */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Waitlist Disclaimer</label>
                <Textarea
                  placeholder="e.g. This ticket is waitlisted. Availability is subject to confirmation."
                  value={formData.waitlistDisclaimer}
                  onChange={(e) => setFormData({ ...formData, waitlistDisclaimer: e.target.value })}
                  className="text-xs"
                  rows={2}
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between col-span-2 p-3 bg-slate-50 rounded-lg">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">Template Active</p>
                  <p className="text-[10px] text-slate-500">Active templates will be scanned and prefilled during ticket updates.</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 text-xs bg-primary text-white hover:bg-primary/90"
              >
                Save Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
