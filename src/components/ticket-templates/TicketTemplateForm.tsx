import React, { useState, useEffect } from "react";
import { TrainTemplate } from "@/services/trainTicket.service";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Train, Plane, Bus } from "lucide-react";

interface TicketTemplateFormProps {
  initialData?: TrainTemplate | null;
  tripId?: string; // Pre-filled and locked if provided
  tripTitle?: string;
  scope?: "TRIP" | "DEPARTURE";
  departureDate?: string;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  trips?: { id: string; title: string }[];
}

export function TicketTemplateForm({
  initialData,
  tripId: lockedTripId,
  tripTitle: lockedTripTitle,
  scope: defaultScope,
  departureDate: defaultDepartureDate,
  onSave,
  onCancel,
  trips = [],
}: TicketTemplateFormProps) {
  const [formData, setFormData] = useState({
    tripId: initialData?.tripId || lockedTripId || "",
    tripTitle: initialData?.tripTitle || lockedTripTitle || "",
    scope: initialData?.scope || defaultScope || "TRIP",
    transportMode: initialData?.transportMode || "TRAIN",
    departureDate: initialData?.departureDate ? initialData.departureDate.slice(0, 10) : defaultDepartureDate || "",
    
    // Train/Bus
    trainName: initialData?.trainName || "",
    trainNumber: initialData?.trainNumber || "",
    source: initialData?.source || "",
    destination: initialData?.destination || "",
    defaultClass: initialData?.defaultClass || "",
    defaultCoach: initialData?.defaultCoach || "",
    boardingPoint: initialData?.boardingPoint || "",
    droppingPoint: initialData?.droppingPoint || "",
    
    // Flight
    flightAirline: initialData?.flightAirline || "",
    flightNumber: initialData?.flightNumber || "",
    flightOrigin: initialData?.flightOrigin || "",
    flightDestination: initialData?.flightDestination || "",
    flightTerminal: initialData?.flightTerminal || "",
    baggageGuidance: initialData?.baggageGuidance || "",

    // Common
    journeyDate: initialData?.journeyDate ? initialData.journeyDate.slice(0, 10) : "",
    reportingTime: initialData?.reportingTime ? new Date(initialData.reportingTime).toISOString().slice(0, 16) : "",
    arrivalTime: initialData?.arrivalTime ? new Date(initialData.arrivalTime).toISOString().slice(0, 16) : "",
    waitlistDisclaimer: initialData?.waitlistDisclaimer || "",
    isActive: initialData ? initialData.isActive : true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Lock trip if provided
    if (lockedTripId && !formData.tripId) {
      setFormData((prev) => ({ ...prev, tripId: lockedTripId, tripTitle: lockedTripTitle || "" }));
    }
  }, [lockedTripId, lockedTripTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFlight = formData.transportMode === "FLIGHT";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        
        <div className="space-y-1.5 col-span-2 md:col-span-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Transport Mode</label>
          <Select 
            value={formData.transportMode} 
            onValueChange={(val: any) => setFormData({ ...formData, transportMode: val })}
          >
            <SelectTrigger className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRAIN"><div className="flex items-center gap-2"><Train className="w-3 h-3"/> Train</div></SelectItem>
              <SelectItem value="FLIGHT"><div className="flex items-center gap-2"><Plane className="w-3 h-3"/> Flight</div></SelectItem>
              <SelectItem value="BUS"><div className="flex items-center gap-2"><Bus className="w-3 h-3"/> Bus</div></SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 col-span-2 md:col-span-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Scope</label>
          <Select 
            value={formData.scope} 
            onValueChange={(val: any) => setFormData({ ...formData, scope: val })}
            disabled={!!defaultScope && !!lockedTripId}
          >
            <SelectTrigger className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRIP">Trip Default</SelectItem>
              <SelectItem value="DEPARTURE">Departure Override</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trip Selection */}
        {!lockedTripId && (
          <div className="space-y-1.5 col-span-2">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Trip (Optional)</label>
            <Select 
              value={formData.tripId} 
              onValueChange={(val) => {
                const trip = trips.find(t => t.id === val);
                setFormData({ ...formData, tripId: val === "All" ? "" : val, tripTitle: trip ? trip.title : "" });
              }}
            >
              <SelectTrigger className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]">
                <SelectValue placeholder="Choose trip context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Trips (Global Template)</SelectItem>
                {trips.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.scope === "DEPARTURE" && (
          <div className="space-y-1.5 col-span-2">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Departure Date (Required for Overrides)</label>
            <Input
              type="date"
              required
              value={formData.departureDate}
              onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
              className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
            />
          </div>
        )}

        {/* Flight specific */}
        {isFlight ? (
          <>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Airline</label>
              <Input
                placeholder="e.g. IndiGo"
                value={formData.flightAirline}
                onChange={(e) => setFormData({ ...formData, flightAirline: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Flight Number</label>
              <Input
                placeholder="e.g. 6E 123"
                value={formData.flightNumber}
                onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Origin Airport</label>
              <Input
                placeholder="e.g. DEL"
                value={formData.flightOrigin}
                onChange={(e) => setFormData({ ...formData, flightOrigin: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Destination Airport</label>
              <Input
                placeholder="e.g. BOM"
                value={formData.flightDestination}
                onChange={(e) => setFormData({ ...formData, flightDestination: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Terminal Info</label>
              <Input
                placeholder="e.g. T3"
                value={formData.flightTerminal}
                onChange={(e) => setFormData({ ...formData, flightTerminal: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Baggage Guidance</label>
              <Input
                placeholder="e.g. 15kg check-in, 7kg cabin"
                value={formData.baggageGuidance}
                onChange={(e) => setFormData({ ...formData, baggageGuidance: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Operator Name</label>
              <Input
                placeholder="e.g. Rajdhani Express"
                value={formData.trainName}
                onChange={(e) => setFormData({ ...formData, trainName: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Vehicle Number</label>
              <Input
                placeholder="e.g. 12951"
                value={formData.trainNumber}
                onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Source Station</label>
              <Input
                placeholder="e.g. NDLS"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Destination Station</label>
              <Input
                placeholder="e.g. BCT"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Default Class</label>
              <Input
                placeholder="e.g. 3AC"
                value={formData.defaultClass}
                onChange={(e) => setFormData({ ...formData, defaultClass: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Default Coach</label>
              <Input
                placeholder="e.g. B1"
                value={formData.defaultCoach}
                onChange={(e) => setFormData({ ...formData, defaultCoach: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Boarding Point</label>
              <Input
                placeholder="e.g. NDLS Platform 1"
                value={formData.boardingPoint}
                onChange={(e) => setFormData({ ...formData, boardingPoint: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Dropping Point</label>
              <Input
                placeholder="e.g. BCT"
                value={formData.droppingPoint}
                onChange={(e) => setFormData({ ...formData, droppingPoint: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
          </>
        )}

        <div className="space-y-1.5 col-span-2">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Waitlist Disclaimer</label>
          <Textarea
            placeholder="e.g. This ticket is waitlisted. Availability is subject to confirmation."
            value={formData.waitlistDisclaimer}
            onChange={(e) => setFormData({ ...formData, waitlistDisclaimer: e.target.value })}
            className="text-xs rounded-[4px] border-[#E2E8F0]"
            rows={2}
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between col-span-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px]">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-800">Template Active</p>
            <p className="text-[10px] text-slate-500">Active templates will be applied automatically to departures.</p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-2 mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-8.5 px-4 rounded-[4px] font-semibold text-xs border border-slate-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white"
        >
          {isSubmitting ? "Saving..." : "Save Template"}
        </Button>
      </div>
    </form>
  );
}
