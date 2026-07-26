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
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, MapPin } from "lucide-react";

interface TripItem {
  id: string;
  title: string;
  location?: string;
  price?: number;
}

interface FeaturedTripsEditorProps {
  draft: Record<string, any>;
  trips?: TripItem[];
  onChange: (updatedDraft: Record<string, any>) => void;
  onReset: () => void;
}

const DEFAULT_TRIPS_LIST: TripItem[] = [
  { id: "mka-1", title: "Manali Kasol Amritsar Backpacking Trip", location: "Himachal Pradesh & Punjab", price: 12999 },
  { id: "ladakh-1", title: "Leh Ladakh Road Trip", location: "Ladakh", price: 24999 },
  { id: "spiti-1", title: "Spiti Valley Road Trip", location: "Spiti Valley", price: 19999 },
  { id: "kk-1", title: "Kedarkantha Winter Trek", location: "Uttarakhand", price: 6499 },
  { id: "kerala-1", title: "Kerala Backwaters Trip", location: "Kerala", price: 19999 },
  { id: "wspiti-1", title: "Winter Spiti Expedition", location: "Spiti Valley", price: 19999 },
];

export function FeaturedTripsEditor({
  draft,
  trips = DEFAULT_TRIPS_LIST,
  onChange,
  onReset,
}: FeaturedTripsEditorProps) {
  const selectedTripIds: string[] = draft.selectedTripIds || ["mka-1", "ladakh-1", "spiti-1"];

  const updateField = (field: string, value: any) => {
    onChange({ ...draft, [field]: value });
  };

  const toggleTrip = (tripId: string) => {
    let updated: string[];
    if (selectedTripIds.includes(tripId)) {
      updated = selectedTripIds.filter((id) => id !== tripId);
    } else {
      updated = [...selectedTripIds, tripId];
    }
    updateField("selectedTripIds", updated);
  };

  const availableTrips = trips.length > 0 ? trips : DEFAULT_TRIPS_LIST;

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0B1528]">Section Title</Label>
        <Input
          type="text"
          value={draft.title || ""}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="e.g. Featured Adventures"
          className="h-10 text-xs font-semibold rounded-xl"
        />
      </div>

      {/* Grid Columns & Card Style Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">Grid Columns</Label>
          <Select
            value={String(draft.columns || "3")}
            onValueChange={(val) => updateField("columns", val)}
          >
            <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
              <SelectValue placeholder="Columns" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
              <SelectItem value="4">4 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">Trip Card Style</Label>
          <Select
            value={draft.cardStyle || "card"}
            onValueChange={(val) => updateField("cardStyle", val)}
          >
            <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="card">Card (Image + Info)</SelectItem>
              <SelectItem value="compact">Compact (Image Only)</SelectItem>
              <SelectItem value="detailed">Detailed (Extended Info)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Select Trips to Feature */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-[#0B1528]">
            Select Trips to Feature ({selectedTripIds.length} Selected)
          </Label>
        </div>

        <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/50 max-h-[220px] overflow-y-auto space-y-2 no-scrollbar">
          {availableTrips.map((t) => {
            const isChecked = selectedTripIds.includes(t.id);
            return (
              <label
                key={t.id}
                onClick={() => toggleTrip(t.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isChecked
                    ? "bg-white border-[#D4541A] shadow-2xs"
                    : "bg-white/60 border-slate-200 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Checkbox checked={isChecked} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0B1528] truncate">{t.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {t.location || "India"}
                    </p>
                  </div>
                </div>
                {t.price && (
                  <span className="text-xs font-bold text-[#D4541A] shrink-0">
                    ₹{t.price.toLocaleString("en-IN")}
                  </span>
                )}
              </label>
            );
          })}
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
