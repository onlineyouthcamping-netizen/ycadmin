import React, { useState, useEffect, useMemo } from "react";
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
  Utensils,
  MapPin,
  Phone,
  Search,
  Sparkles,
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
  { step: 3, label: "Select Vendor / Partner", icon: Building2 },
  { step: 4, label: "Pricing", icon: DollarSign },
  { step: 5, label: "Passengers", icon: Users },
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

  const [actCategoryTab, setActCategoryTab] = useState<string>("ALL");
  const [actSearch, setActSearch] = useState<string>("");
  const [vendorCategoryTab, setVendorCategoryTab] = useState<string>("ALL");
  const [vendorSearch, setVendorSearch] = useState<string>("");

  useEffect(() => {
    if (open) {
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

  const [customVendors, setCustomVendors] = useState<VendorOption[]>([]);
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorLocation, setNewVendorLocation] = useState("");
  const [newVendorCategory, setNewVendorCategory] = useState("restaurants");
  const [newVendorCost, setNewVendorCost] = useState("");

  const defaultVendors = useMemo(() => {
    const list = [...customVendors];
    if (vendorsList && vendorsList.length > 0) {
      list.push(...vendorsList);
    }
    return list;
  }, [customVendors, vendorsList]);

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

    // 2. Direct feed from vendorsList (Trip Vendors Directory)
    if (vendorsList && vendorsList.length > 0) {
      vendorsList.forEach((vnd) => {
        const isRest =
          (vnd.category || "").toLowerCase().includes("restaurant") ||
          (vnd.category || "").toLowerCase().includes("food") ||
          (vnd.category || "").toUpperCase() === "MEAL" ||
          vnd.vendorName.toLowerCase().includes("dhaba") ||
          vnd.vendorName.toLowerCase().includes("restaurant") ||
          vnd.vendorName.toLowerCase().includes("cottage") ||
          vnd.vendorName.toLowerCase().includes("cafe");

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

  const handleCreateNewVendor = () => {
    if (!newVendorName.trim()) {
      toast.error("Please enter vendor or restaurant name");
      return;
    }
    const newVnd: VendorOption = {
      vendorId: `VND-CUSTOM-${Date.now()}`,
      vendorName: newVendorName.trim(),
      category: newVendorCategory,
      location: newVendorLocation.trim() || "Local",
      rating: 5.0,
      netCost: Number(newVendorCost) || 0,
      seasonType: "CUSTOM",
    };
    setCustomVendors((prev) => [newVnd, ...prev]);
    setSelectedVendor(newVnd);
    setVendorCost(newVnd.netCost || 0);
    setNewVendorName("");
    setNewVendorLocation("");
    setNewVendorCost("");
    setIsCreatingVendor(false);
    toast.success(`Selected partner/cost: ${newVnd.vendorName}`);
  };

  const defaultPax = manifestPassengers || [];

  const handleSelectActivity = (act: any) => {
    setSelectedActivity(act);
    setVendorCost(act.defaultCost || 0);

    // Auto-select the matching vendor from Vendor Directory
    if (act.vendor) {
      setSelectedVendor(act.vendor);
    } else if (act.vendorId) {
      const match = defaultVendors.find((v) => v.vendorId === act.vendorId);
      if (match) setSelectedVendor(match);
    }

    if (act.category === "MEAL" || act.category === "RESTAURANT") {
      setVendorCategoryTab("RESTAURANTS");
    } else {
      setVendorCategoryTab("ACTIVITIES");
    }
  };

  const handleCreateNewActivity = () => {
    if (!newActName.trim()) {
      toast.error("Please enter activity / meal name");
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
    if (createdAct.category === "MEAL" || createdAct.category === "RESTAURANT") {
      setVendorCategoryTab("RESTAURANTS");
    }
    setIsCreatingNew(false);
    setNewActName("");
    toast.success(
      `"${createdAct.name}" created & selected!`,
    );
    setCurrentStep(3);
  };

  const handleSelectVendor = (vnd: VendorOption) => {
    setSelectedVendor(vnd);
    setVendorCost(vnd.netCost || 0);
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
        location: selectedVendor?.location || "",
        status: "CONFIRMED",
        vendorId: selectedVendor?.vendorId || "VND-DEFAULT",
        vendorName: selectedVendor?.vendorName || "Direct Supplier",
        vendorRating: selectedVendor?.rating || 4.5,
        maxCapacity: selectedActivity.defaultCapacity,
        maxParticipants: selectedActivity.defaultCapacity,
        bookedCount: selectedPaxIds.length,
        adultPrice: isIncluded ? 0 : adultPrice,
        customerPrice: isIncluded ? 0 : adultPrice,
        isIncluded,
        childPrice,
        vendorCost,
        estimatedCost: vendorCost,
        gstPercent,
        mealIncluded: selectedActivity.category === "MEAL" ? "Included Meal" : "Included",
        remarks: selectedActivity.category === "MEAL" ? `Partner Meal at ${selectedVendor?.vendorName || "Restaurant"}` : "",
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

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return defaultActivities.filter((act) => {
      if (actCategoryTab === "MEAL" && act.category !== "MEAL" && act.category !== "RESTAURANT") return false;
      if (actCategoryTab === "ADVENTURE" && act.category !== "ADVENTURE") return false;
      if (actCategoryTab === "SIGHTSEEING" && act.category !== "SIGHTSEEING") return false;
      if (actCategoryTab === "OTHER" && (act.category === "MEAL" || act.category === "RESTAURANT" || act.category === "ADVENTURE" || act.category === "SIGHTSEEING")) return false;
      if (actSearch.trim()) {
        const q = actSearch.toLowerCase();
        return act.name.toLowerCase().includes(q) || act.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [defaultActivities, actCategoryTab, actSearch]);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return defaultVendors.filter((vnd) => {
      const isRest =
        (vnd.category || "").toLowerCase().includes("restaurant") ||
        (vnd.category || "").toLowerCase().includes("food") ||
        vnd.category === "MEAL" ||
        (vnd.vendorName && (
          vnd.vendorName.toLowerCase().includes("dhaba") ||
          vnd.vendorName.toLowerCase().includes("restaurant") ||
          vnd.vendorName.toLowerCase().includes("cottage") ||
          vnd.vendorName.toLowerCase().includes("cafe") ||
          vnd.vendorName.toLowerCase().includes("bhojnalaya")
        ));

      if (vendorCategoryTab === "RESTAURANTS" && !isRest) return false;
      if (vendorCategoryTab === "ACTIVITIES" && isRest) return false;

      if (vendorSearch.trim()) {
        const q = vendorSearch.toLowerCase();
        return (
          vnd.vendorName.toLowerCase().includes(q) ||
          (vnd.location && vnd.location.toLowerCase().includes(q)) ||
          (vnd.contactPerson && vnd.contactPerson.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [defaultVendors, vendorCategoryTab, vendorSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white rounded-2xl">
        {/* WIZARD TOP STEP PROGRESS BAR */}
        <div className="bg-slate-900 text-white p-5">
          <h3 className="font-bold text-lg">Add Activity / Meal to Departure</h3>
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

          {/* STEP 2: SELECT ACTIVITY OR MEAL */}
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

              {/* Category Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: "ALL", label: "All Items" },
                    { id: "MEAL", label: "🍽️ Restaurant Meals" },
                    { id: "ADVENTURE", label: "🏔️ Adventure" },
                    { id: "SIGHTSEEING", label: "🏛️ Sightseeing" },
                    { id: "OTHER", label: "🎉 Others" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActCategoryTab(tab.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border",
                        actCategoryTab === tab.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative shrink-0 sm:w-44">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={actSearch}
                    onChange={(e) => setActSearch(e.target.value)}
                    placeholder="Search meals / acts..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {isCreatingNew ? (
                <div className="p-4 bg-orange-50/50 border-2 border-orange-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-900 uppercase">
                      Create Custom Activity / Meal in Master Directory
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
                        Activity / Meal Name
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
                        <option value="ADVENTURE">🏔️ ADVENTURE</option>
                        <option value="SIGHTSEEING">🏛️ SIGHTSEEING</option>
                        <option value="ENTERTAINMENT">🎉 ENTERTAINMENT</option>
                        <option value="TRANSIT">🚌 TRANSIT</option>
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
                        Default Vendor / Meal Cost (₹)
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
                        <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", isMeal ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700")}>
                          {isMeal ? <Utensils className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 text-[13px] line-clamp-1">
                            {act.name}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                              isMeal ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700",
                            )}>
                              {act.category}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {act.defaultCapacity} pax
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="text-[10px] text-slate-400 block">
                          Cost
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
                    <p className="text-xs text-slate-500">No items found matching filter</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: SELECT VENDOR (FILTER RESTAURANTS VS ACTIVITIES) */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Select Partner / Vendor
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Feeded directly from this trip's Vendor Directory
                  </p>
                </div>

                {/* Vendor Category Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: "RESTAURANTS", label: "🍽️ Restaurants & Food Partners" },
                    { id: "ACTIVITIES", label: "🎯 Activity Providers" },
                    { id: "ALL", label: "All Vendors" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setVendorCategoryTab(tab.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border",
                        vendorCategoryTab === tab.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendor Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search restaurant or vendor partner by name, location, contact..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {filteredVendors.map((vnd) => {
                  const isSelected = selectedVendor?.vendorId === vnd.vendorId;
                  const isRest =
                    (vnd.category || "").toLowerCase().includes("restaurant") ||
                    (vnd.category || "").toLowerCase().includes("food");

                  return (
                    <div
                      key={vnd.vendorId}
                      onClick={() => handleSelectVendor(vnd)}
                      className={cn(
                        "p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                        isSelected
                          ? "bg-orange-50 border-orange-400 ring-2 ring-orange-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "p-2.5 rounded-xl shrink-0",
                          isRest ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700",
                        )}>
                          {isRest ? <Utensils className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-slate-900 text-sm">
                              {vnd.vendorName}
                            </h5>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded",
                              isRest ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700",
                            )}>
                              {isRest ? "Restaurant" : vnd.seasonType || "Partner"}
                            </span>
                            {vnd.location && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                {vnd.location}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            {vnd.contactPerson && (
                              <span className="text-slate-600 font-medium truncate max-w-[150px]">
                                {vnd.contactPerson}
                              </span>
                            )}
                            {vnd.contactPhone && (
                              <span className="text-slate-400 tabular-nums flex items-center gap-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                {vnd.contactPhone}
                              </span>
                            )}
                            <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{vnd.rating || 4.8}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 pl-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">
                            Net Rate
                          </span>
                          <div className="text-sm font-black text-slate-900">
                            ₹{vnd.netCost || 0}/pax
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "h-8 px-3 text-xs font-bold",
                            isSelected &&
                              "bg-orange-600 hover:bg-orange-700 text-white",
                          )}
                        >
                          {isSelected ? "Selected" : "Assign"}
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {filteredVendors.length === 0 && (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">
                      No {vendorCategoryTab === "RESTAURANTS" ? "restaurants" : "vendors"} found in this category.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Add from the Trip Vendors Directory or create a custom partner below.
                    </p>
                  </div>
                )}

                {/* + ADD NEW OR MISCELLANEOUS VENDOR / COST */}
                {!isCreatingVendor ? (
                  <button
                    type="button"
                    onClick={() => setIsCreatingVendor(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/30 text-xs font-bold text-slate-700 hover:text-orange-600 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />+ Add Custom Restaurant / Vendor Partner
                  </button>
                ) : (
                  <div className="p-4 rounded-xl border border-orange-300 bg-orange-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                        Add Custom Partner & Net Cost
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingVendor(false)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Partner / Restaurant Name
                        </label>
                        <input
                          type="text"
                          value={newVendorName}
                          onChange={(e) => setNewVendorName(e.target.value)}
                          placeholder="e.g. Bal Gopal, Musafir Dhaba"
                          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Location / City
                        </label>
                        <input
                          type="text"
                          value={newVendorLocation}
                          onChange={(e) => setNewVendorLocation(e.target.value)}
                          placeholder="e.g. Kasol, Kullu, Manali"
                          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Net Meal / Cost (₹/pax)
                        </label>
                        <input
                          type="number"
                          value={newVendorCost}
                          onChange={(e) => setNewVendorCost(e.target.value)}
                          placeholder="250"
                          className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateNewVendor}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4"
                      >
                        Save & Select Partner
                      </Button>
                    </div>
                  </div>
                )}
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
                    Select if company pays (included) or customer pays (optional
                    add-on)
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

          {/* STEP 5: PASSENGERS ALLOCATION CHECKLIST */}
          {currentStep === 5 && (
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
