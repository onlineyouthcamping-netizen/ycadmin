import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw, Calendar, Users, ArrowRight } from "lucide-react";

interface UpcomingTripsEditorProps {
  draft: Record<string, any>;
  onChange: (updatedDraft: Record<string, any>) => void;
  onReset: () => void;
}

export function UpcomingTripsEditor({
  draft,
  onChange,
  onReset,
}: UpcomingTripsEditorProps) {
  const updateField = (field: string, value: any) => {
    onChange({ ...draft, [field]: value });
  };

  const sampleDepartures = [
    { title: "Manali Kasol Amritsar", date: "Aug 01, 2026", seats: "8 seats left", price: "₹12,999" },
    { title: "Spiti Valley Road Trip", date: "Aug 05, 2026", seats: "5 seats left", price: "₹19,999" },
    { title: "Leh Ladakh Road Trip", date: "Aug 10, 2026", seats: "3 seats left", price: "₹24,999" },
  ];

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0B1528]">Section Title</Label>
        <Input
          type="text"
          value={draft.title || ""}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="e.g. Next Departures"
          className="h-10 text-xs font-semibold rounded-xl"
        />
      </div>

      {/* Max Departures Displayed */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0B1528]">Max Departures to Show</Label>
        <Select
          value={String(draft.maxItems || "6")}
          onValueChange={(val) => updateField("maxItems", val)}
        >
          <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
            <SelectValue placeholder="Max Items" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="4">4 Departures</SelectItem>
            <SelectItem value="6">6 Departures</SelectItem>
            <SelectItem value="8">8 Departures</SelectItem>
            <SelectItem value="12">12 Departures</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Live Preview Sample Box */}
      <div className="space-y-2 pt-1">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Upcoming Departures Card Preview
        </Label>
        <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/50 space-y-2">
          {sampleDepartures.map((dep, i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <p className="font-bold text-[#0B1528]">{dep.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> {dep.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Users className="w-2.5 h-2.5" /> {dep.seats}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#D4541A]">{dep.price}</span>
                <span className="px-2 py-1 bg-slate-900 text-white rounded-md text-[10px] font-bold">
                  Book Now
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="h-8 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-400" /> Reset to Default
        </Button>
      </div>
    </div>
  );
}
