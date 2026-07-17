import { useCallback, useEffect, useState } from "react";
import { trainTicketService, type TrainTemplate } from "@/services/trainTicket.service";
import { tripsService } from "@/services/trips.service";
import type { Trip } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Train } from "lucide-react";
import { TicketTemplateList } from "@/components/ticket-templates/TicketTemplateList";
import { TicketTemplateForm } from "@/components/ticket-templates/TicketTemplateForm";

export default function TrainTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TrainTemplate[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<TrainTemplate | null>(null);

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

  const handleSave = async (data: any) => {
    try {
      if (editTemplate) {
        await trainTicketService.updateTemplate(editTemplate.id, data);
        toast.success("Template updated successfully");
      } else {
        await trainTicketService.createTemplate(data);
        toast.success("Template created successfully");
      }

      setCreateOpen(false);
      setEditTemplate(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save template");
    }
  };

  const handleEditClick = (template: TrainTemplate) => {
    setEditTemplate(template);
    setCreateOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this template?")) return;
    try {
      await trainTicketService.deleteTemplate(id);
      toast.success("Template archived successfully");
      loadData();
    } catch {
      toast.error("Failed to archive template");
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const s = search.toLowerCase();
    return (
      (t.trainName || "").toLowerCase().includes(s) ||
      (t.trainNumber || "").toLowerCase().includes(s) ||
      (t.flightAirline || "").toLowerCase().includes(s) ||
      (t.flightNumber || "").toLowerCase().includes(s) ||
      (t.tripTitle || "").toLowerCase().includes(s) ||
      (t.source || "").toLowerCase().includes(s) ||
      (t.destination || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Train className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Ticketing Templates Management</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Configure default ticketing profiles to prefill traveler ticket details</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditTemplate(null);
            setCreateOpen(true);
          }}
          className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Template
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-[4px] border border-[#E2E8F0] shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search templates by transport, trip, source, or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 pl-8 text-xs rounded-[4px] border-[#E2E8F0] font-medium placeholder:text-slate-400"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-[4px] shadow-none">
        {loading ? (
          <div className="flex items-center justify-center py-20 border border-[#E2E8F0] rounded-[4px]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <TicketTemplateList
            templates={filteredTemplates}
            onEdit={handleEditClick}
            onArchive={handleArchive}
          />
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-sm font-bold uppercase tracking-tight text-slate-800 flex items-center gap-2">
              <Train className="w-4 h-4 text-primary-orange" />
              {editTemplate ? "Edit Ticket Template" : "Add Ticket Template"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-semibold mt-1">
              Fill in transport defaults which will prefill traveler-level ticket profiles.
            </DialogDescription>
          </DialogHeader>

          <TicketTemplateForm
            initialData={editTemplate}
            onSave={handleSave}
            onCancel={() => setCreateOpen(false)}
            trips={trips}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
