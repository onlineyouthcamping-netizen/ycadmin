import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Compass,
  DollarSign,
  Users,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Utensils,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface VendorOption {
  vendorId: string;
  vendorName: string;
  category?: string;
  location?: string;
  contactPerson?: string;
  contactPhone?: string;
  rating?: number;
  netCost?: number;
  seasonType?: string;
}

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddActivity: (newActivity: any) => Promise<void> | void;
  daysList?: number[];
  initialDay?: number;
  activitiesMasterList?: {
    id: string;
    name: string;
    category: string;
    defaultCapacity: number;
    defaultCost: number;
  }[];
  vendorsList?: VendorOption[];
  manifestPassengers?: { id: string; name: string }[];
}

const WIZARD_STEPS = [
  { step: 1, label: "Select Day", icon: Calendar },
  { step: 2, label: "Select Activity / Meal", icon: Compass },
  { step: 3, label: "Pricing & Commercials", icon: DollarSign },
  { step: 4, label: "Passengers", icon: Users },
];

export default function Activity5StepWizardModal({
  open,
  onOpenChange,
  onAddActivity,
  daysList = [1, 2, 3, 4, 5],
  initialDay = 1,
  activitiesMasterList,
  vendorsList,
  manifestPassengers,
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [selectedActivity, setSelectedActivity] = useState<{
    id: string;
    name: string;
    category: string;
    defaultCapacity: number;
    defaultCost: number;
    vendorId?: string;
    vendor?: VendorOption;
  } | null>(null);

  const [selectedVendor, setSelectedVendor] = useState<VendorOption | null>(null);

  const [adultPrice, setAdultPrice] = useState(0);
  const [childPrice, setChildPrice] = useState(0);
  const [vendorCost, setVendorCost] = useState(0);
  const [gstPercent, setGstPercent] = useState(5);
  const [isIncluded, setIsIncluded] = useState(true);
  const [scheduledTime, setScheduledTime] = useState("09:30 AM");
  const [endTime, setEndTime] = useState("12:30 PM");

  const [selectedPaxIds, setSelectedPaxIds] = useState<string[]>([]);

  const [actCategoryTab, setActCategoryTab] = useState<string>("MEAL");
  const [actSearch, setActSearch] = useState<string>("");

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      if (initialDay && daysList.includes(initialDay)) {
        setSelectedDay(initialDay);
      }
      if (manifestPassengers && manifestPassengers.length > 0) {
        setSelectedPaxIds(manifestPassengers.map((p) => p.id));
      } else {
        setSelectedPaxIds([]);
      }
    }
  }, [open, initialDay, daysList, manifestPassengers]);

  const [customActivities, setCustomActivities] = useState<any[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newActName, setNewActName] = useState("");
  const [newActCategory, setNewActCategory] = useState("MEAL");
  const [newActCapacity, setNewActCapacity] = useState(40);
  const [newActCost, setNewActCost] = useState(0);

  // Step 2 Activities & Meals: 100% feeded from Trip Vendors Directory & Master Database
  const defaultActivities = useMemo(() => {
    const list: any[] = [...customActivities];
    const seen = new Set<string>();

    // 1. Items from activitiesMasterList (which includes trip vendor meals & master directory acts)
    if (activitiesMasterList && activitiesMasterList.length > 0) {
      activitiesMasterList.forEach((act) => {
        if (!seen.has(act.name.toLowerCase())) {
          seen.add(act.name.toLowerCase());
          list.push(act);
        }
      });
    }

    // 2. Direct feed from vendorsList (Trip Vendors Directory) — Strictly Restaurants & Activities only
    if (vendorsList && vendorsList.length > 0) {
      vendorsList.forEach((vnd) => {
        const rawCat = (vnd.category || "").toLowerCase();
        const nameLower = (vnd.vendorName || "").toLowerCase();

        // Strict Exclusion: Skip Accommodation, Transport, and Guides
        const isAccommodation =
          rawCat.includes("hotel") ||
          rawCat.includes("resort") ||
          rawCat.includes("homestay") ||
          rawCat.includes("stay") ||
          rawCat.includes("lodge") ||
          rawCat.includes("camp") ||
          nameLower.includes("hotel") ||
          nameLower.includes("resort") ||
          nameLower.includes("homestay") ||
          nameLower.includes("camp") ||
          (nameLower.includes("cottage") && !nameLower.includes("restaurant"));

        const isTransport =
          rawCat.includes("transport") ||
          rawCat.includes("cab") ||
          rawCat.includes("taxi") ||
          rawCat.includes("vehicle") ||
          nameLower.includes("cab") ||
          nameLower.includes("taxi") ||
          nameLower.includes("travels") ||
          nameLower.includes("transport");

        const isGuide =
          rawCat.includes("guide") ||
          rawCat.includes("leader") ||
          nameLower.includes("guide") ||
          nameLower.includes(" sir");

        if (isAccommodation || isTransport || isGuide) return;

        const isRest =
          rawCat.includes("restaurant") ||
          rawCat.includes("food") ||
          rawCat.includes("meal") ||
          nameLower.includes("dhaba") ||
          nameLower.includes("restaurant") ||
          nameLower.includes("bhojnalaya") ||
          nameLower.includes("cafe") ||
          nameLower.includes("canteen");

        const actName = `${vnd.vendorName}${vnd.location ? ` (${vnd.location})` : ""}`;
        if (!seen.has(actName.toLowerCase())) {
          seen.add(actName.toLowerCase());
          list.push({
            id: `VND-ITEM-${vnd.vendorId}`,
            name: actName,
            category: isRest ? "MEAL" : "ADVENTURE",
            defaultCapacity: 40,
            defaultCost: vnd.netCost || 0,
            vendorId: vnd.vendorId,
            vendor: vnd,
          });
        }
      });
    }

    return list;
  }, [customActivities, activitiesMasterList, vendorsList]);

  const defaultPax = manifestPassengers || [];

  const handleSelectActivity = (act: any) => {
    setSelectedActivity(act);
    setVendorCost(act.defaultCost || 0);

    // Auto-select the matching vendor from Vendor Directory
    if (act.vendor) {
      setSelectedVendor(act.vendor);
    } else if (act.vendorId) {
      const match = vendorsList?.find((v) => v.vendorId === act.vendorId);
      if (match) setSelectedVendor(match);
    }
  };

  const handleCreateNewActivity = () => {
    if (!newActName.trim()) {
      toast.error("Please enter name");
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
    toast.success(`"${createdAct.name}" created & selected!`);
    setCurrentStep(3); // Advance directly to Pricing step
  };

  const handleTogglePax = (id: string) => {
    setSelectedPaxIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleFinish = async () => {
    if (!selectedActivity) {
      toast.error("Please select an activity or meal");
      return;
    }
    setSaving(true);
    try {
      const newAct = {
        id: `DEP-ACT-${Date.now()}`,
        name: selectedActivity.name,
        type: selectedActivity.category,
        category: selectedActivity.category,
        dayNumber: selectedDay,
        scheduledTime,
        endTime,
        status: "CONFIRMED",
        vendorId: selectedVendor?.vendorId || selectedActivity?.vendorId || undefined,
        vendorName: selectedVendor?.vendorName || (selectedActivity?.category === "MEAL" ? "Restaurant Partner" : "Direct Supplier"),
        adultPrice: isIncluded ? 0 : adultPrice,
        childPrice: isIncluded ? 0 : childPrice,
        vendorCost,
        gstPercent,
        isIncluded,
        passengers: selectedPaxIds.map((pId) => ({
          passengerId: pId,
          name: manifestPassengers?.find((p) => p.id === pId)?.name || "Pax",
          status: "CONFIRMED",
        })),
      };

      if (onAddActivity) {
        await onAddActivity(newAct);
      }
      toast.success(
        `Added "${selectedActivity.name}" to Day ${selectedDay}`,
      );
      onOpenChange(false);
      setCurrentStep(1);
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule item");
    } finally {
      setSaving(false);
    }
  };

  const profitPerPax = adultPrice - vendorCost;

  // Filtered Activities: ONLY 2 TABS (MEAL vs ACTIVITY)
  const filteredActivities = useMemo(() => {
    return defaultActivities.filter((act) => {
      const isMeal = act.category === "MEAL" || act.category === "RESTAURANT";
      if (actCategoryTab === "MEAL" && !isMeal) return false;
      if (actCategoryTab === "ACTIVITY" && isMeal) return false;
      if (actSearch.trim()) {
        const q = actSearch.toLowerCase();
        return (
          act.name.toLowerCase().includes(q) ||
          act.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [defaultActivities, actCategoryTab, actSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white rounded-2xl">
        {/* WIZARD TOP STEP PROGRESS BAR */}
        <div className="bg-slate-900 text-white p-5">
          <h3 className="font-bold text-lg">Add Activity / Meal to Departure</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Step {currentStep} of 4: {WIZARD_STEPS[currentStep - 1]?.label}
          </p>

          <div className="grid grid-cols-4 gap-2 mt-4">
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
                        : "bg-slate-800/50 border-slate-700/50 text-slate-500 opacity-60",
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
                  <span className="text-[11px] mt-1 line-clamp-1">
                    {s.label}
                  </span>
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
                Which day of the itinerary is this activity or meal scheduled for?
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
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700",
                    )}
                  >
                    <span className="text-xs text-slate-400 block">
                      Itinerary
                    </span>
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

          {/* STEP 2: SELECT ACTIVITY OR MEAL (WITH AUTO PARTNER MAPPING) */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Choose Activity or Restaurant Meal
                </h4>
                {!isCreatingNew && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsCreatingNew(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs h-8"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />+ Create Custom Item
                  </Button>
                )}
              </div>

              {/* Category Tabs & Search Bar — ONLY 2 TABS: RESTAURANT MEALS & ACTIVITIES */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: "MEAL", label: "🍽️ Restaurant Meals" },
                    { id: "ACTIVITY", label: "🎯 Activities" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActCategoryTab(tab.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border",
                        actCategoryTab === tab.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative shrink-0 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={actSearch}
                    onChange={(e) => setActSearch(e.target.value)}
                    placeholder="Search restaurant meals / activities..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {isCreatingNew ? (
                <div className="p-4 bg-orange-50/50 border-2 border-orange-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-900 uppercase">
                      Create Custom Meal / Activity
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
                        Name
                      </label>
                      <input
                        type="text"
                        value={newActName}
                        onChange={(e) => setNewActName(e.target.value)}
                        placeholder="e.g. Traditional Lunch at Dhaba, ATV Ride"
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
                        <option value="MEAL">🍽️ RESTAURANT MEAL</option>
                        <option value="ACTIVITY">🎯 ACTIVITY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Default Capacity
                      </label>
                      <input
                        type="number"
                        value={newActCapacity}
                        onChange={(e) =>
                          setNewActCapacity(Number(e.target.value) || 0)
                        }
                        className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Default Net Cost (₹)
                      </label>
                      <input
                        type="number"
                        value={newActCost}
                        onChange={(e) =>
                          setNewActCost(Number(e.target.value) || 0)
                        }
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
                      Create & Select Item
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                {filteredActivities.map((act) => {
                  const isSelected = selectedActivity?.id === act.id;
                  const isMeal = act.category === "MEAL" || act.category === "RESTAURANT";
                  return (
                    <div
                      key={act.id}
                      onClick={() => handleSelectActivity(act)}
                      className={cn(
                        "p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                        isSelected
                          ? "bg-orange-50 border-orange-400 ring-2 ring-orange-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs",
                      )}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", isMeal ? "bg-amber-50 text-amber-700" : "bg-orange-50 text-orange-700")}>
                          {isMeal ? <Utensils className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 text-[13px] line-clamp-1">
                            {act.name}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                              isMeal ? "bg-amber-100 text-amber-800" : "bg-orange-100 text-orange-800",
                            )}>
                              {isMeal ? "Restaurant Meal" : "Activity"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {act.defaultCapacity} pax
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="text-[10px] text-slate-400 block">
                          Net Rate
                        </span>
                        <div className="font-black text-slate-900 text-sm">
                          ₹{act.defaultCost}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredActivities.length === 0 && (
                  <div className="col-span-2 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">
                      No {actCategoryTab === "MEAL" ? "restaurants/meals" : "activities"} configured in the Trip Vendor Directory.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Use the "+ Create Custom Item" button above to add one.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PRICING & COMMERCIALS */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Configure Activity Type & Pricing
                  </h4>
                  <p className="text-xs text-slate-500">
                    Select if company pays (included in trip) or customer pays (optional add-on)
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
                        : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200",
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
                        ? "bg-orange-600 text-white border-orange-700 shadow-sm"
                        : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200",
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
                      <span className="absolute left-3 top-2 text-emerald-700 font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={vendorCost}
                        onChange={(e) =>
                          setVendorCost(Number(e.target.value) || 0)
                        }
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-orange-50/70 p-4 rounded-xl border border-orange-200">
                    <div>
                      <label className="block text-xs font-bold text-orange-900 mb-1">
                        Adult Selling Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-orange-600 font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={adultPrice}
                          onChange={(e) =>
                            setAdultPrice(Number(e.target.value) || 0)
                          }
                          className="w-full pl-6 pr-2 py-1.5 font-bold text-orange-950 rounded-lg border border-orange-300 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-orange-900 mb-1">
                        Vendor Net Cost
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-500">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={vendorCost}
                          onChange={(e) =>
                            setVendorCost(Number(e.target.value) || 0)
                          }
                          className="w-full pl-6 pr-2 py-1.5 font-bold text-slate-700 rounded-lg border border-orange-300 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-orange-900 mb-1">
                        Profit / Pax
                      </label>
                      <div className="text-lg font-black text-emerald-600 mt-1">
                        ₹{profitPerPax}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-orange-900 mb-1">
                        Total Revenue
                      </label>
                      <div className="text-lg font-black text-orange-950 mt-1">
                        ₹{(selectedPaxIds.length * adultPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: PASSENGERS ALLOCATION CHECKLIST */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Select Booked Passengers ({selectedPaxIds.length} /{" "}
                  {selectedActivity?.defaultCapacity || 40})
                </h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSelectedPaxIds(defaultPax.map((p) => p.id))
                    }
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
                {defaultPax.length > 0 ? (
                  defaultPax.map((pax) => {
                    const isChecked = selectedPaxIds.includes(pax.id);
                    return (
                      <div
                        key={pax.id}
                        onClick={() => handleTogglePax(pax.id)}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 select-none",
                          isChecked
                            ? "bg-orange-50 border-orange-300 text-orange-950 font-bold"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300",
                        )}
                      >
                        <span className="text-base">{isChecked ? "☑" : "☐"}</span>
                        <span className="text-xs line-clamp-1">{pax.name}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 sm:col-span-4 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs font-semibold text-slate-700">No passengers booked on this departure yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All passengers who book this departure will automatically be included in this activity.</p>
                  </div>
                )}
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

            {currentStep < 4 ? (
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
