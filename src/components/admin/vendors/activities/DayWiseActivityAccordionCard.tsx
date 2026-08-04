import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Bus,
  Users,
  DollarSign,
  Star,
  CheckCircle2,
  ShieldAlert,
  Utensils,
  FileText,
  Save,
  Check,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface DepartureActivityItem {
  id: string;
  name: string;
  category?: string;
  dayNumber: number;
  scheduledTime: string;
  endTime?: string;
  status: "DRAFT" | "CONFIRMED" | "READY" | "STARTED" | "COMPLETED" | "RECONCILED";
  vendorId?: string;
  vendorName: string;
  vendorRating?: number;
  guideName?: string;
  vehicleName?: string;
  maxCapacity: number;
  bookedCount: number;
  adultPrice: number;
  childPrice: number;
  vendorCost: number;
  gstPercent?: number;
  mealIncluded?: string;
  notes?: string;
  passengers?: { id: string; name: string; isOpted: boolean }[];
}

interface DayWiseCardProps {
  activity: DepartureActivityItem;
  onUpdateActivity: (id: string, updated: Partial<DepartureActivityItem>) => Promise<void> | void;
  availableVendors?: {
    vendorId: string;
    vendorName: string;
    rating: number;
    netCost: number;
    seasonType: string;
  }[];
}

const SIX_OPERATIONAL_STATUSES = [
  { value: "DRAFT", label: "Draft", bg: "bg-slate-100 text-slate-700 border-slate-300" },
  { value: "CONFIRMED", label: "Confirmed", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "READY", label: "Ready", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "STARTED", label: "Started", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "COMPLETED", label: "Completed", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "RECONCILED", label: "Reconciled", bg: "bg-teal-50 text-teal-800 border-teal-300" },
] as const;

export default function DayWiseActivityAccordionCard({
  activity,
  onUpdateActivity,
  availableVendors,
}: DayWiseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable local state
  const [status, setStatus] = useState<DepartureActivityItem["status"]>(activity.status || "CONFIRMED");
  const [guideName, setGuideName] = useState(activity.guideName || "Neel Patel");
  const [vehicleName, setVehicleName] = useState(activity.vehicleName || "Traveller 2");
  const [scheduledTime, setScheduledTime] = useState(activity.scheduledTime || "09:30 AM");
  const [endTime, setEndTime] = useState(activity.endTime || "12:30 PM");
  const [mealIncluded, setMealIncluded] = useState(activity.mealIncluded || "Included");
  const [notes, setNotes] = useState(activity.notes || "");

  // Pricing
  const [adultPrice, setAdultPrice] = useState(activity.adultPrice || 1200);
  const [childPrice, setChildPrice] = useState(activity.childPrice || 800);
  const [vendorCost, setVendorCost] = useState(activity.vendorCost || 700);
  const [gstPercent, setGstPercent] = useState(activity.gstPercent || 5);

  const profitPerPax = adultPrice - vendorCost;
  const remainingSeats = Math.max(0, activity.maxCapacity - activity.bookedCount);
  const capacityPercent = Math.min(100, Math.round((activity.bookedCount / activity.maxCapacity) * 100));

  // Passengers Checkbox List
  const [passengers, setPassengers] = useState(
    activity.passengers || [
      { id: "p1", name: "Rahul Sharma", isOpted: true },
      { id: "p2", name: "Meet Patel", isOpted: true },
      { id: "p3", name: "Krunal Shah", isOpted: true },
      { id: "p4", name: "Yash Mehta", isOpted: true },
      { id: "p5", name: "Vipul Joshi", isOpted: false },
      { id: "p6", name: "Ananya Desai", isOpted: true },
      { id: "p7", name: "Rohan Verma", isOpted: true },
      { id: "p8", name: "Priya Nair", isOpted: true },
    ]
  );

  // Vendor comparison mock defaults if not provided
  const comparisonVendors = availableVendors || [
    { vendorId: "VND-ABC", vendorName: "ABC Adventures", rating: 4.8, netCost: 700, seasonType: "PEAK" },
    { vendorId: "VND-XYZ", vendorName: "XYZ Adventure", rating: 4.2, netCost: 650, seasonType: "OFF_SEASON" },
    { vendorId: "VND-MTN", vendorName: "Mountain Adventure", rating: 4.5, netCost: 680, seasonType: "REGULAR" },
  ];

  const currentStatusObj =
    SIX_OPERATIONAL_STATUSES.find((s) => s.value === status) ||
    SIX_OPERATIONAL_STATUSES[1];

  const handleTogglePassenger = (pId: string) => {
    setPassengers((prev) =>
      prev.map((p) => (p.id === pId ? { ...p, isOpted: !p.isOpted } : p))
    );
  };

  const handleAssignVendor = (vnd: { vendorId: string; vendorName: string; netCost: number }) => {
    setVendorCost(vnd.netCost);
    onUpdateActivity(activity.id, {
      vendorId: vnd.vendorId,
      vendorName: vnd.vendorName,
      vendorCost: vnd.netCost,
    });
    toast.success(`Assigned ${vnd.vendorName} (@ ₹${vnd.netCost}/pax)`);
  };

  const handleSaveInline = async () => {
    setSaving(true);
    try {
      await onUpdateActivity(activity.id, {
        status,
        guideName,
        vehicleName,
        scheduledTime,
        endTime,
        mealIncluded,
        notes,
        adultPrice,
        childPrice,
        vendorCost,
        gstPercent,
        bookedCount: passengers.filter((p) => p.isOpted).length,
      });
      toast.success("Activity details updated successfully");
    } catch (err: any) {
      toast.error("Failed to update activity");
    } finally {
      setSaving(false);
    }
  };

  const optedCount = passengers.filter((p) => p.isOpted).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all overflow-hidden mb-3">
      {/* HEADER BAR — ALWAYS VISIBLE INFORMATION-DENSE ROW */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 select-none hover:bg-slate-50/70 transition-colors"
      >
        {/* Left: Time + Activity Name + Status Badge */}
        <div className="flex items-center gap-3.5 min-w-[240px]">
          <div className="px-2.5 py-1.5 bg-slate-100 rounded-lg text-slate-800 font-bold text-sm font-mono whitespace-nowrap">
            {scheduledTime}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-base">
                {activity.name}
              </h4>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold border",
                  currentStatusObj.bg
                )}
              >
                {currentStatusObj.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vendor: <strong className="text-slate-800">{activity.vendorName}</strong> •{" "}
              {scheduledTime} - {endTime}
            </p>
          </div>
        </div>

        {/* Center: Operational Assignments (Guide & Bus & Capacity) */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Guide:</span>
            <strong className="text-slate-900">{guideName || "Unassigned"}</strong>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
            <Bus className="w-3.5 h-3.5 text-slate-500" />
            <span>Vehicle:</span>
            <strong className="text-slate-900">{vehicleName || "Unassigned"}</strong>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <div className="flex items-center gap-1.5">
              <span>Booked: <strong className="text-slate-900">{optedCount}</strong>/{activity.maxCapacity}</span>
              <span className="text-slate-400">|</span>
              <span>Remaining: <strong className="text-emerald-700">{remainingSeats}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Pricing Summary & Chevron Accordion Toggle */}
        <div className="flex items-center justify-between lg:justify-end gap-5 w-full lg:w-auto">
          <div className="text-right">
            <div className="flex items-center gap-3 text-xs">
              <div>
                <span className="text-slate-400">Adult: </span>
                <strong className="text-slate-900">₹{adultPrice}</strong>
              </div>
              <div>
                <span className="text-slate-400">Cost: </span>
                <strong className="text-slate-700">₹{vendorCost}</strong>
              </div>
              <div>
                <span className="text-slate-400">Profit: </span>
                <strong className="text-emerald-600 font-bold">₹{profitPerPax}/pax</strong>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Meal: <span className="text-slate-700 font-medium">{mealIncluded}</span>
            </div>
          </div>

          <div className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-700" />
            )}
          </div>
        </div>
      </div>

      {/* ACCORDION EXPANDED CONTENT — OPERATIONAL WORKSPACE INLINE */}
      {expanded && (
        <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-6">
          {/* SECTION 1: 6-STATUS WORKFLOW SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Operational Status (6-Stage Workflow)
            </label>
            <div className="flex flex-wrap gap-2">
              {SIX_OPERATIONAL_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    status === s.value
                      ? cn(s.bg, "ring-2 ring-orange-500/30 border-orange-400 shadow-sm font-bold")
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: BASIC INFORMATION & OPERATIONAL ASSIGNMENTS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Assigned Guide
              </label>
              <input
                type="text"
                value={guideName}
                onChange={(e) => setGuideName(e.target.value)}
                placeholder="e.g. Neel Patel"
                className="w-full text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Assigned Vehicle / Bus
              </label>
              <input
                type="text"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                placeholder="e.g. Traveller 2"
                className="w-full text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Timing Window
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-1/2 text-xs font-medium px-2 py-1.5 rounded-lg border border-slate-300 text-center"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-1/2 text-xs font-medium px-2 py-1.5 rounded-lg border border-slate-300 text-center"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Meal Plan Inclusion
              </label>
              <select
                value={mealIncluded}
                onChange={(e) => setMealIncluded(e.target.value)}
                className="w-full text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Included">Included</option>
                <option value="Not Included">Not Included</option>
                <option value="Lunch Only">Lunch Only</option>
                <option value="Snacks Included">Snacks Included</option>
              </select>
            </div>
          </div>

          {/* SECTION 3: PRICING BREAKDOWN (EDITABLE) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Pricing Breakdown (Editable per Departure)
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Adult Selling</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={adultPrice}
                    onChange={(e) => setAdultPrice(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 text-sm font-bold text-slate-900 rounded-lg border border-slate-300 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Child Selling</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={childPrice}
                    onChange={(e) => setChildPrice(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 text-sm font-bold text-slate-900 rounded-lg border border-slate-300 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Vendor Net Cost</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={vendorCost}
                    onChange={(e) => setVendorCost(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 text-sm font-bold text-slate-700 rounded-lg border border-slate-300 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">GST %</label>
                <div className="relative">
                  <input
                    type="number"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-6 py-1.5 text-sm font-bold text-slate-900 rounded-lg border border-slate-300 focus:border-orange-500"
                  />
                  <span className="absolute right-2.5 top-1.5 text-slate-400 text-xs">%</span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex flex-col justify-center">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase">
                  Net Profit / Pax
                </span>
                <span className="text-lg font-bold text-emerald-700">
                  ₹{profitPerPax}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: INLINE VENDOR COMPARISON (ONE-CLICK SELECTION, NO POPUPS) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Inline Vendor Comparison (One-Click Selection)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {comparisonVendors.map((vnd) => {
                const isCurrent = activity.vendorName === vnd.vendorName || vnd.netCost === vendorCost;
                return (
                  <div
                    key={vnd.vendorId}
                    className={cn(
                      "p-3 rounded-xl border transition-all flex items-center justify-between",
                      isCurrent
                        ? "bg-orange-50/70 border-orange-300 ring-1 ring-orange-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">
                          {vnd.vendorName}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-orange-600 text-white font-bold px-1.5 py-0.5 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span className="font-medium">{vnd.rating}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-slate-900">₹{vnd.netCost}</span>
                        <span className="text-slate-500">/pax</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isCurrent ? "default" : "outline"}
                      onClick={() => handleAssignVendor(vnd)}
                      className={cn(
                        "h-8 px-3 text-xs font-semibold",
                        isCurrent && "bg-orange-600 hover:bg-orange-700 text-white"
                      )}
                    >
                      {isCurrent ? "Assigned" : "Assign"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: PASSENGER ALLOCATION CHECKLIST */}
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Booked Passengers ({optedCount}/{activity.maxCapacity})
              </h5>
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Remaining Seats: {remainingSeats}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {passengers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleTogglePassenger(p.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all select-none",
                    p.isOpted
                      ? "bg-orange-50 border-orange-300 text-orange-950 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                  )}
                >
                  <span className="text-sm">
                    {p.isOpted ? "☑" : "☐"}
                  </span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 6: NOTES & INLINE SAVE */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Operational Notes & Instructions
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Life jackets required; VIP guest seating in front raft"
                className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-orange-500"
              />
            </div>

            <Button
              onClick={handleSaveInline}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 h-10 shrink-0 self-end sm:self-center"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
