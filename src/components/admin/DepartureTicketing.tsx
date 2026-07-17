import React, { useEffect, useState } from 'react';
import { Trip } from '@/types';
import { trainTicketService, TrainTemplate } from '@/services/trainTicket.service';
import { Ticket } from 'lucide-react';
import { TicketTemplateList } from '../ticket-templates/TicketTemplateList';
import { TicketTemplateForm } from '../ticket-templates/TicketTemplateForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DepartureTicketingProps {
  tripId: string;
  departureDateStr: string;
  tripDetails: any;
}

export default function DepartureTicketing({ tripId, departureDateStr, tripDetails }: DepartureTicketingProps) {
  const [templates, setTemplates] = useState<TrainTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<TrainTemplate | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch resolved effective templates for this trip + date
      const result = await trainTicketService.getEffectiveTemplates(tripId, departureDateStr);
      // result is [{ effectiveTemplate, source, tripDefault }]
      const mappedTemplates = result.map(r => r.effectiveTemplate);
      setTemplates(mappedTemplates);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load ticket templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId && departureDateStr) {
      loadData();
    }
  }, [tripId, departureDateStr]);

  const handleSave = async (data: any) => {
    try {
      if (editTemplate) {
        await trainTicketService.updateTemplate(editTemplate.id, data);
        toast.success("Template updated successfully");
      } else {
        await trainTicketService.createTemplate(data);
        toast.success("Template created successfully");
      }
      setIsModalOpen(false);
      setEditTemplate(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save template");
    }
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-slate-300 animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium">Loading Ticketing...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Ticket className="w-4 h-4 text-purple-600" /> Applicable Ticketing Templates
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Global (TRIP) and Override (DEPARTURE) templates active for this specific date.
          </p>
        </div>
        <TicketTemplateList 
          templates={templates} 
          onEdit={(t) => { setEditTemplate(t); setIsModalOpen(true); }}
          onArchive={handleArchive}
          showTripColumn={true}
        />
      </div>

      {/* Since Departure Hub controls open the modal differently, we expose a way or just use the same modal here. */}
      {/* If CTA "+ Add Template" is clicked from outside, we can listen to an event or expose a ref, 
          but for simplicity, we have it in the list header or rely on the parent. 
          Actually, we will handle the "Add Template" inside this component using an imperative handle if needed,
          or we can render a button here if the user scrolls down, but the parent has the CTA button. */}
      
      {/* For now, just render the modal when isModalOpen is true. We'll add a local button if the list is empty. */}
      {templates.length === 0 && (
        <div className="flex justify-center mt-4">
           <button 
             onClick={() => { setEditTemplate(null); setIsModalOpen(true); }}
             className="px-4 py-2 bg-purple-600 text-white rounded-[4px] text-xs font-bold hover:bg-purple-700 shadow-sm"
           >
             + Add Departure Override Template
           </button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-sm font-bold uppercase tracking-tight text-slate-800 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-purple-600" />
              {editTemplate ? "Edit Ticket Template" : "Add Departure Override"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-semibold mt-1">
              Configure ticketing rules specifically for this departure date.
            </DialogDescription>
          </DialogHeader>

          <TicketTemplateForm
            initialData={editTemplate}
            tripId={tripId}
            tripTitle={tripDetails?.title}
            scope="DEPARTURE"
            departureDate={departureDateStr}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
