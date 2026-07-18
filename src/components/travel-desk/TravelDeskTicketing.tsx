import React, { useEffect, useState } from 'react';
import { Trip } from '@/types';
import { trainTicketService, TrainTemplate } from '@/services/trainTicket.service';
import { Ticket } from 'lucide-react';
import { TravelDeskLoadingState } from './TravelDeskStateComponents';
import { TicketTemplateList } from '../ticket-templates/TicketTemplateList';
import { TicketTemplateForm } from '../ticket-templates/TicketTemplateForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TravelDeskTicketingProps {
  trip: Trip;
}

export const TravelDeskTicketing: React.FC<TravelDeskTicketingProps> = ({ trip }) => {
  const [templates, setTemplates] = useState<TrainTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<TrainTemplate | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await trainTicketService.getTemplates({ tripId: trip.id });
      setTemplates(result);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load ticket templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [trip.id]);

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

  if (loading) return <TravelDeskLoadingState message="Loading Ticketing..." />;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Trip Ticketing Templates</h2>
          <p className="text-xs text-slate-550 mt-0.5 font-bold">Manage global ticketing guidelines for this trip.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setEditTemplate(null); setIsModalOpen(true); }}
            className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-xs font-bold hover:bg-[#E66000] shadow-sm"
          >
            + Add Trip Template
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <TicketTemplateList 
          templates={templates} 
          onEdit={(t) => { setEditTemplate(t); setIsModalOpen(true); }}
          onArchive={handleArchive}
          showTripColumn={false}
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-sm font-bold uppercase tracking-tight text-slate-800 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary-orange" />
              {editTemplate ? "Edit Ticket Template" : "Add Ticket Template"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-semibold mt-1">
              Configure default ticketing rules specifically for this trip.
            </DialogDescription>
          </DialogHeader>

          <TicketTemplateForm
            initialData={editTemplate}
            tripId={trip.id}
            tripTitle={trip.title}
            scope="TRIP"
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
