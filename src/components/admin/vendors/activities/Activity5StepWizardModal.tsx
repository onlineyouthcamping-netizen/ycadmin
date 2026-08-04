import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Compass,
  Building2,
  DollarSign,
  Users,
  Check,
  ChevronRight,
  ChevronLeft,
  Star,
  CheckCircle2,
  Plus,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddActivity: (newActivity: any) => Promise<void> | void;
  daysList?: number[];
  activitiesMasterList?: {
    id: string;
    name: string;
    category: string;
    defaultCapacity: number;
    defaultCost: number;
  }[];
  vendorsList?: {
    vendorId: string;
    vendorName: string;
    rating: number;
    netCost: number;
    seasonType: string;
  }[];
  manifestPassengers?: { id: string; name: string }[];
}

const WIZARD_STEPS = [
  { step: 1, label: "Select Day", icon: Calendar },
  { step: 2, label: "Select Activity", icon: Compass },
  { step: 3, label: "Select Vendor", icon: Building2 },
  { step: 4, label: "Pricing", icon: DollarSign },
  { step: 5, label: "Passengers", icon: Users },
];

export default function Activity5StepWizardModal({
  open,
  onOpenChange,
  onAddActivity,
  daysList = [1, 2, 3, 4, 5],
  activitiesMasterList,
  vendorsList,
  manifestPassengers,
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form selections
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState<{
    id: string;
    name: string;
    category: string;
    defaultCapacity: number;
    defaultCost: number;
  } | null>(null);

  const [selectedVendor, setSelectedVendor] = useState<{
    vendorId: string;
    vendorName: string;
    rating: number;
    netCost: number;
  } | null>(null);

  const [adultPrice, setAdultPrice] = useState(1200);
  const [childPrice, setChildPrice] = useState(800);
  const [vendorCost, setVendorCost] = useState(700);
  const [gstPercent, setGstPercent] = useState(5);
  const [isIncluded, setIsIncluded] = useState(true);
  const [scheduledTime, setScheduledTime] = useState("09:30 AM");
  const [endTime, setEndTime] = useState("12:30 PM");

  const [selectedPaxIds, setSelectedPaxIds] = useState<string[]>([
    "pax-1",
    "pax-2",
    "pax-3",
    "pax-4",
  ]);

  // + Create New Activity local state
  const [customActivities, setCustomActivities] = useState<any[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newActName, setNewActName] = useState("");
  const [newActCategory, setNewActCategory] = useState("ADVENTURE");
  const [newActCapacity, setNewActCapacity] = useState(40);
  const [newActCost, setNewActCost] = useState(500);

  const defaultActivities = [
    ...customActivities,
    ...(activitiesMasterList || [
      { id: "ACT-1", name: "River Rafting", category: "ADVENTURE", defaultCapacity: 40, defaultCost: 700 },
      { id: "ACT-2", name: "Paragliding", category: "ADVENTURE", defaultCapacity: 30, defaultCost: 2000 },
      { id: "ACT-3", name: "ATV Ride", category: "ADVENTURE", defaultCapacity: 20, defaultCost: 900 },
      { id: "ACT-4", name: "Solang Valley Visit", category: "SIGHTSEEING", defaultCapacity: 50, defaultCost: 400 },
      { id: "ACT-5", name: "DJ Night & Bonfire", category: "ENTERTAINMENT", defaultCapacity: 60, defaultCost: 500 },
      { id: "ACT-6", name: "Golden Temple Visit", category: "SIGHTSEEING", defaultCapacity: 50, defaultCost: 0 },
      { id: "ACT-7", name: "Wagah Border Excursion", category: "SIGHTSEEING", defaultCapacity: 50, defaultCost: 300 },
      { id: "ACT-8", name: "Manikaran Sahib Visit", category: "SIGHTSEEING", defaultCapacity: 50, defaultCost: 200 },
      { id: "ACT-9", name: "Chalal Trek & Cafe Walk", category: "ADVENTURE", defaultCapacity: 40, defaultCost: 400 },
      { id: "ACT-10", name: "Bijli Mahadev Day Trek", category: "ADVENTURE", defaultCapacity: 40, defaultCost: 600 },
      { id: "ACT-11", name: "Jogini Waterfall Trek", category: "ADVENTURE", defaultCapacity: 40, defaultCost: 350 },
    ]),
  ];

  const defaultVendors = vendorsList || [
    { vendorId: "VND-ABC", vendorName: "ABC Adventures", rating: 4.8, netCost: 700, seasonType: "PEAK" },
    { vendorId: "VND-XYZ", vendorName: "XYZ Adventure", rating: 4.2, netCost: 650, seasonType: "OFF_SEASON" },
    { vendorId: "VND-MTN", vendorName: "Mountain Adventure", rating: 4.5, netCost: 680, seasonType: "REGULAR" },
  ];

  const defaultPax = manifestPassengers || [
    { id: "pax-1", name: "Rahul Sharma" },
    { id: "pax-2", name: "Meet Patel" },
    { id: "pax-3", name: "Krunal Shah" },
    { id: "pax-4", name: "Yash Mehta" },
    { id: "pax-5", name: "Vipul Joshi" },
    { id: "pax-6", name: "Ananya Desai" },
    { id: "pax-7", name: "Rohan Verma" },
    { id: "pax-8", name: "Priya Nair" },
  ];

  const handleSelectActivity = (act: any) => {
    setSelectedActivity(act);
    setVendorCost(act.defaultCost);
  };

  const handleCreateNewActivity = () => {
    if (!newActName.trim()) {
      toast.error("Please enter activity name");
      return;
    }
    const createdAct = {
      id: `ACT-CUST-${Date.now()}`,
      name: newActName.trim(),
      category: newActCategory,
      defaultCapacity: Number(newActCapacity) || 40,
      defaultCost: Number(newActCost) || 0,
    };
    setCustomActivities((prev) => [createdAct, ...prev]);
    setSelectedActivity(createdAct);
    setVendorCost(createdAct.defaultCost);
    setIsCreatingNew(false);
    setNewActName("");
    toast.success(`"${createdAct.name}" created in Activity Master & selected!`);
    setCurrentStep(3);
  };

  const handleSelectVendor = (vnd: any) => {
    setSelectedVendor(vnd);
    setVendorCost(vnd.netCost);
  };

  const handleTogglePax = (id: string) => {
    setSelectedPaxIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (!selectedActivity) {
      toast.error("Please select an activity");
      return;
    }
    setSaving(true);
    try {
      const newAct = {
        id: `DEP-ACT-${Date.now()}`,
        name: selectedActivity.name,
        category: selectedActivity.category,
        dayNumber: selectedDay,
        scheduledTime,
        endTime,
        status: "CONFIRMED",
        vendorId: selectedVendor?.vendorId || "VND-DEFAULT",
        vendorName: selectedVendor?.vendorName || "Direct Supplier",
        vendorRating: selectedVendor?.rating || 4.5,
        maxCapacity: selectedActivity.defaultCapacity,
        bookedCount: selectedPaxIds.length,
        adultPrice: isIncluded ? 0 : adultPrice,
        customerPrice: isIncluded ? 0 : adultPrice,
        isIncluded,
        childPrice,
        vendorCost,
        gstPercent,
        mealIncluded: "Included",
        passengers: defaultPax.map((p) => ({
          id: p.id,
          name: p.name,
          isOpted: selectedPaxIds.includes(p.id),
        })),
      };

      await onAddActivity(newAct);
      toast.success(`Added ${selectedActivity.name} to Day ${selectedDay}`);
      onOpenChange(false);
      setCurrentStep(1);
    } catch (err) {
      toast.error("Failed to add activity");
    } finally {
      setSaving(false);
    }
  };

  const profitPerPax = adultPrice - vendorCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white rounded-2xl">
        {/* WIZARD TOP STEP PROGRESS BAR */}
        <div className="bg-slate-900 text-white p-5">
          <h3 className="font-bold text-lg">Add Activity to Departure</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Step {currentStep} of 5: {WIZARD_STEPS[currentStep - 1].label}
          </p>

          <div className="grid grid-cols-5 gap-2 mt-4">
            {WIZARD_STEPS.map((s) => {
              const Icon = s.icon;
              const isCurrent = s.step === currentStep;
              const isCompleted = s.step < currentStep;

              return (
                <div
                  key={s.step}
                  onClick={() => s.step < currentStep && setCurrentStep(s.step)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer",
                    isCurrent
                      ? "bg-orange-600 border-orange-500 text-white font-bold shadow-md"
                      : isCompleted
                      ? "bg-slate-800 border-slate-700 text-emerald-400 font-medium"
                      : "bg-slate-800/50 border-slate-700/50 text-slate-500 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="text-xs">Step {s.step}</span>
                  </div>
                  <span className="text-[11px] mt-1 line-clamp-1">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* WIZARD STEP CONTENTS */}
        <div className="p-6 min-h-[320px]">
          {/* STEP 1: SELECT DAY */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Which day of the itinerary is this activity scheduled for?
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {daysList.map((day) => (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "p-5 rounded-xl border text-center cursor-pointer transition-all",
                      selectedDay === day
                        ? "bg-orange-50 border-orange-400 ring-2 ring-orange-500/20 text-orange-950 font-bold"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    )}
                  >
                    <span className="text-xs text-slate-400 block">Itinerary</span>
                    <span className="text-2xl font-black">DAY {day}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT ACTIVITY (FROM 0-COUPLED MASTER) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Choose Activity from Canonical Master Directory
                </h4>
                {!isCreatingNew && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsCreatingNew(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs h-8"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    + Create New Activity
                  </Button>
                )}
              </div>

              {isCreatingNew ? (
                <div className="p-4 bg-orange-50/50 border-2 border-orange-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-900 uppercase">
                      Create Custom Activity in Master Directory
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Activity Name
                      </label>
                      <input
                        type="text"
                        value={newActName}
                        onChange={(e) => setNewActName(e.target.value)}
                        placeholder="e.g. ATV Ride, Zipline, Snow Scooter"
                        className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newActCategory}
                        onChange={(e) => setNewActCategory(e.target.value)}
                        className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="ADVENTURE">ADVENTURE</option>
                        <option value="SIGHTSEEING">SIGHTSEEING</option>
                        <option value="TRANSIT">TRANSIT</option>
                        <option value="MEAL">MEAL</option>
                        <option value="ENTERTAINMENT">ENTERTAINMENT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Default Capacity
                      </label>
                      <input
                        type="number"
                        value={newActCapacity}
                        onChange={(e) => setNewActCapacity(Number(e.target.value) || 0)}
                        className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Default Vendor Cost (₹)
                      </label>
                      <input
                        type="number"
                        value={newActCost}
                        onChange={(e) => setNewActCost(Number(e.target.value) || 0)}
                        className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateNewActivity}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-8 px-4"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Create & Select Activity
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {defaultActivities.map((act) => {
                  const isSelected = selectedActivity?.id === act.id;
                  return (
                    <div
                      key={act.id}
                      onClick={() => handleSelectActivity(act)}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                        isSelected
                          ? "bg-orange-50 border-orange-400 ring-2 ring-orange-500/20"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div>
                        <h5 className="font-bold text-slate-900 text-base">
                          {act.name}
                        </h5>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Category: {act.category} • Capacity: {act.defaultCapacity} pax
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Default Cost</span>
                        <div className="font-bold text-slate-800">₹{act.defaultCost}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: SELECT VENDOR (INLINE COMPARISON TABLE) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Select Vendor (One-Click Comparison)
              </h4>
              <div className="space-y-3">
                {defaultVendors.map((vnd) => {
                  const isSelected = selectedVendor?.vendorId === vnd.vendorId;
                  return (
                    <div
                      key={vnd.vendorId}
                      onClick={() => handleSelectVendor(vnd)}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                        isSelected
                          ? "bg-orange-50 border-orange-400 ring-2 ring-orange-500/20"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 rounded-xl">
                          <Building2 className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900">
                              {vnd.vendorName}
                            </h5>
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                              {vnd.seasonType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span className="font-semibold text-slate-700">
                              {vnd.rating}
                            </span>
                            <span>rating</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs text-slate-400">Net Cost</span>
                          <div className="text-lg font-black text-slate-900">
                            ₹{vnd.netCost}/pax
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "h-9 px-4 text-xs font-bold",
                            isSelected && "bg-orange-600 hover:bg-orange-700 text-white"
                          )}
                        >
                          {isSelected ? "Selected" : "Assign"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: PRICING (EDITABLE ADULT, CHILD, VENDOR COST, PROFIT) */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Configure Activity Type & Pricing
                  </h4>
                  <p className="text-xs text-slate-500">
                    Select if company pays (included) or customer pays (optional add-on)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsIncluded(true)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
                      isIncluded
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                        : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                    )}
                  >
                    ● Included in Package
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIncluded(false)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
                      !isIncluded
                        ? "bg-purple-600 text-white border-purple-700 shadow-sm"
                        : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                    )}
                  >
                    ○ Optional Paid Activity
                  </button>
                </div>
              </div>

              {isIncluded ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/70 p-5 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">
                      Vendor Cost / Pax (Company Pays)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-emerald-700 font-bold">₹</span>
                      <input
                        type="number"
                        value={vendorCost}
                        onChange={(e) => setVendorCost(Number(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-1.5 font-bold text-emerald-950 rounded-lg border border-emerald-300 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">
                      Total Payable to Vendor (Auto Calc)
                    </label>
                    <div className="text-xl font-black text-emerald-700 mt-1">
                      ₹{(selectedPaxIds.length * vendorCost).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-emerald-600">
                      Based on {selectedPaxIds.length} manifested passengers
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-purple-50/70 p-4 rounded-xl border border-purple-200">
                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1">
                        Adult Selling Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-purple-600 font-bold">₹</span>
                        <input
                          type="number"
                          value={adultPrice}
                          onChange={(e) => setAdultPrice(Number(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 font-bold text-purple-950 rounded-lg border border-purple-300 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1">
                        Vendor Net Cost
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-500">₹</span>
                        <input
                          type="number"
                          value={vendorCost}
                          onChange={(e) => setVendorCost(Number(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 font-bold text-slate-700 rounded-lg border border-purple-300 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1">
                        Profit / Pax
                      </label>
                      <div className="text-lg font-black text-emerald-600 mt-1">
                        ₹{profitPerPax}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1">
                        Total Revenue
                      </label>
                      <div className="text-lg font-black text-purple-950 mt-1">
                        ₹{(selectedPaxIds.length * adultPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: PASSENGERS ALLOCATION CHECKLIST */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Select Booked Passengers ({selectedPaxIds.length} / {selectedActivity?.defaultCapacity || 40})
                </h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedPaxIds(defaultPax.map((p) => p.id))}
                    className="text-xs h-7"
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedPaxIds([])}
                    className="text-xs h-7"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[240px] overflow-y-auto">
                {defaultPax.map((pax) => {
                  const isChecked = selectedPaxIds.includes(pax.id);
                  return (
                    <div
                      key={pax.id}
                      onClick={() => handleTogglePax(pax.id)}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 select-none",
                        isChecked
                          ? "bg-orange-50 border-orange-300 text-orange-950 font-bold"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      <span className="text-base">{isChecked ? "☑" : "☐"}</span>
                      <span className="text-xs line-clamp-1">{pax.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* WIZARD BOTTOM ACTIONS BAR */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="h-9 text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs text-slate-500"
            >
              Cancel
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={currentStep === 2 && !selectedActivity}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold h-9 px-6 text-xs"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-6 text-xs"
              >
                {saving ? "Adding..." : "Finish & Add to Departure"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
