import React from "react";
import { TrainTemplate } from "@/services/trainTicket.service";
import { Button } from "@/components/ui/button";
import { Train, Plane, Bus, Calendar, MapPin, Trash2, Edit } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface TicketTemplateListProps {
  templates: TrainTemplate[];
  onEdit: (template: TrainTemplate) => void;
  onArchive: (id: string) => void;
  showTripColumn?: boolean;
}

export function TicketTemplateList({ templates, onEdit, onArchive, showTripColumn = true }: TicketTemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-[4px] border border-dashed border-slate-200">
        <div className="w-10 h-10 rounded-[4px] bg-slate-100 flex items-center justify-center mb-3">
          <Train className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-xs font-semibold text-slate-500">No templates found</p>
      </div>
    );
  }

  const getIcon = (mode: string) => {
    switch (mode) {
      case "FLIGHT": return <Plane className="w-3.5 h-3.5" />;
      case "BUS": return <Bus className="w-3.5 h-3.5" />;
      default: return <Train className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="overflow-x-auto border border-[#E2E8F0] rounded-[4px] bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 border-b border-[#E2E8F0]">
            <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Transport Detail</th>
            <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Route</th>
            {showTripColumn && <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Scope & Trip</th>}
            <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Status</th>
            <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => {
            const isFlight = template.transportMode === "FLIGHT";
            const name = isFlight ? template.flightAirline : template.trainName;
            const number = isFlight ? template.flightNumber : template.trainNumber;
            const source = isFlight ? template.flightOrigin : template.source;
            const dest = isFlight ? template.flightDestination : template.destination;

            return (
              <tr key={template.id} className="border-b border-[#E2E8F0] hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                      {getIcon(template.transportMode)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-800">{name || "—"}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">#{number || "—"}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col text-[10px] font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {source || "—"} → {dest || "—"}
                    </span>
                  </div>
                </td>
                {showTripColumn && (
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                          template.scope === "DEPARTURE" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {template.scope}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700">{template.tripTitle || "Global"}</span>
                      </div>
                      {template.departureDate && (
                        <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" /> Dep: {formatDate(template.departureDate)}
                        </span>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider border",
                    template.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"
                  )}>
                    {template.isActive ? "Active" : "Archived"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(template)}
                      className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider border border-slate-100 hover:bg-slate-50 rounded-[4px]"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive(template.id)}
                      className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider border border-slate-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-[4px]"
                      title="Archive Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
