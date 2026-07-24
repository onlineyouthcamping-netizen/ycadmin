import React, { useState } from "react";
import { X, Plus, Compass, MapPin, Calendar, Users, DollarSign, Image, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { tripsService } from "@/services/trips.service";
import { travelDeskService } from "@/services/travelDesk.service";
import { toast } from "sonner";

interface TravelDeskCreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: (tripId: string) => void;
}

const PRESET_HERO_IMAGES = [
  { name: "Himalayas / Mountain", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80" },
  { name: "Beach / Coastal", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" },
  { name: "Desert / Dunes", url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80" },
  { name: "Forest / Nature", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80" },
  { name: "International / City", url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80" }
];

export const TravelDeskCreateTripModal: React.FC<TravelDeskCreateTripModalProps> = ({
  isOpen,
  onClose,
  onTripCreated
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("Domestic");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("6 Days / 5 Nights");
  const [price, setPrice] = useState("14999");
  const [difficulty, setDifficulty] = useState("Easy to Moderate");
  const [maxGroupSize, setMaxGroupSize] = useState("30");
  const [startEnd, setStartEnd] = useState("Mar - Oct");
  const [heroImage, setHeroImage] = useState(PRESET_HERO_IMAGES[0].url);
  const [overview, setOverview] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      toast.error("Trip title and destination location are required");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Trip Master Record
      const newTrip = await tripsService.create({
        title: title.trim(),
        shortName: code.trim() || title.slice(0, 4).toUpperCase() + "-1",
        category,
        tripType: category.toLowerCase().includes("international") ? "international" : "domestic",
        location: location.trim(),
        duration: duration.trim(),
        price: parseFloat(price) || 14999,
        difficulty,
        maxGroupSize: parseInt(maxGroupSize) || 30,
        startEnd,
        heroImage,
        overview: overview.trim() || `${title} expedition exploring ${location}.`,
        status: "ACTIVE",
        features: ["Certified Guide", "Meals Included", "Transport", "Stay Accommodations"]
      } as any);

      toast.success(`Destination "${title}" created successfully!`);

      // 2. Initialize Travel Desk Workspace
      const tripId = newTrip.id;
      await travelDeskService.feedWorkspaces([tripId]);
      toast.success("Travel Desk workspace initialized!");

      // 3. Callback to parent & close modal
      onTripCreated(tripId);
      onClose();
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to create destination trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCode("");
    setLocation("");
    setOverview("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 bg-white rounded-xl overflow-hidden border border-[#E2E8F0] shadow-xl font-sans">
        
        {/* Header */}
        <div className="bg-[#0A192F] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#F97316] text-white rounded-lg">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white leading-tight">
                Add New Destination Trip
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Manually register a destination & initialize its Travel Desk workspace
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Title & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-[#0A192F]">Trip / Destination Title *</label>
              <Input
                required
                placeholder="e.g. Spiti Valley Circuit"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-9 text-xs border-[#E2E8F0] text-[#0A192F] placeholder:text-[#64748B]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0A192F]">Trip Code</label>
              <Input
                placeholder="e.g. SPT-1"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="h-9 text-xs border-[#E2E8F0] font-mono text-[#0A192F] placeholder:text-[#64748B]"
              />
            </div>
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0A192F]">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-9 bg-white border border-[#E2E8F0] rounded-md px-3 text-xs font-medium text-[#0A192F] outline-none focus:ring-1 focus:ring-[#F97316]"
              >
                <option value="Domestic">Domestic</option>
                <option value="International">International</option>
                <option value="Trekking">Trekking & Expeditions</option>
                <option value="Weekend Getaway">Weekend Getaway</option>
                <option value="Backpacking">Backpacking Trip</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0A192F]">Destination Location / Region *</label>
              <Input
                required
                placeholder="e.g. Himachal Pradesh & Ladakh"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="h-9 text-xs border-[#E2E8F0] text-[#0A192F] placeholder:text-[#64748B]"
              />
            </div>
          </div>

          {/* Duration, Price & Group Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0A192F]">Duration</label>
              <Input
                placeholder="e.g. 7 Days / 6 Nights"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="h-9 text-xs border-[#E2E8F0] text-[#0A192F]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0A192F]">Starting Price (₹)</label>
              <Input
                type="number"
                placeholder="14999"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="h-9 text-xs border-[#E2E8F0] font-mono text-[#0A192F]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0A192F]">Max Group Size</label>
              <Input
                placeholder="30 Pax"
                value={maxGroupSize}
                onChange={e => setMaxGroupSize(e.target.value)}
                className="h-9 text-xs border-[#E2E8F0] text-[#0A192F]"
              />
            </div>
          </div>

          {/* Difficulty & Season */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0A192F]">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="w-full h-9 bg-white border border-[#E2E8F0] rounded-md px-3 text-xs font-medium text-[#0A192F] outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Easy to Moderate">Easy to Moderate</option>
                <option value="Moderate">Moderate</option>
                <option value="Challenging">Challenging / High Altitude</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0A192F]">Best Season</label>
              <Input
                placeholder="e.g. May - October"
                value={startEnd}
                onChange={e => setStartEnd(e.target.value)}
                className="h-9 text-xs border-[#E2E8F0] text-[#0A192F]"
              />
            </div>
          </div>

          {/* Banner Image URL & Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0A192F]">Hero Banner Image URL</label>
            <Input
              placeholder="https://images.unsplash.com/..."
              value={heroImage}
              onChange={e => setHeroImage(e.target.value)}
              className="h-9 text-xs border-[#E2E8F0] text-[#0A192F] font-mono"
            />

            {/* Presets */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              <span className="text-[10px] font-semibold text-[#64748B] shrink-0">Presets:</span>
              {PRESET_HERO_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setHeroImage(preset.url)}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all shrink-0 ${
                    heroImage === preset.url
                      ? "bg-[#0A192F] text-white border-[#0A192F]"
                      : "bg-[#F8FAFC] text-[#0A192F] border-[#E2E8F0] hover:border-[#0A192F]"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Brief Overview */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#0A192F]">Destination Overview & Highlights</label>
            <Textarea
              rows={3}
              placeholder="Enter brief description to initialize the Knowledge Hub overview..."
              value={overview}
              onChange={e => setOverview(e.target.value)}
              className="text-xs border-[#E2E8F0] text-[#0A192F] placeholder:text-[#64748B]"
            />
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 text-xs font-bold border-[#E2E8F0] text-[#0A192F]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 bg-[#0A192F] hover:bg-[#112240] text-white text-xs font-bold px-5 rounded-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
              {isSubmitting ? "Creating & Initializing..." : "Create & Open Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
