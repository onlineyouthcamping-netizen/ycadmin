import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Sliders,
  Calendar,
  Filter,
  RefreshCw,
  Copy,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ActivityKPIHeader from "./vendors/activities/ActivityKPIHeader";
import DayWiseActivityAccordionCard, {
  DepartureActivityItem,
} from "./vendors/activities/DayWiseActivityAccordionCard";
import Activity5StepWizardModal from "./vendors/activities/Activity5StepWizardModal";
import { saveActivityToBackend } from "@/utils/departure/activityMapper";

interface DepartureActivitiesProps {
  tripId: string;
  departureDateStr: string;
  tripDetails: any;
  computedItinerary?: any[];
  allPassengers?: any[];
  tripVendors: any[];
  activitiesList: any[];
  fetchPageData: () => void;
  setActivitiesList: (val: any[]) => void;
  api: any;
}

export default function DepartureActivities({
  tripId,
  departureDateStr,
  tripDetails,
  computedItinerary = [],
  allPassengers = [],
  tripVendors,
  activitiesList,
  fetchPageData,
  setActivitiesList,
  api,
}: DepartureActivitiesProps) {
  // Filter States
  const [actDayFilter, setActDayFilter] = useState("All Days");
  const [actStatusFilter, setActStatusFilter] = useState("All Status");
  const [actSearch, setActSearch] = useState("");

  // Modals
  const [wizardOpen, setWizardOpen] = useState(false);

  const totalPaxCount = allPassengers.length > 0 ? allPassengers.length : 5;

  const currentActivities: DepartureActivityItem[] = useMemo(() => {
    if (activitiesList && activitiesList.length > 0) {
      return activitiesList.map((a, idx) => ({
        id: a.id || `act-${idx}`,
        name: a.name || a.act || "Activity",
        category: a.type || a.category || "ADVENTURE",
        dayNumber:
          Number(a.dayNumber) ||
          Number(String(a.day || "").replace(/\D/g, "")) ||
          1,
        scheduledTime: a.startTime || a.scheduledTime || a.time || "10:00 AM",
        endTime: a.endTime || "01:00 PM",
        status: (a.status?.toUpperCase() as any) || "CONFIRMED",
        vendorName: a.vendorName || "Contracted Supplier",
        maxCapacity: Number(a.maxParticipants) || totalPaxCount,
        bookedCount: a.bookedCount !== undefined ? Number(a.bookedCount) : totalPaxCount,
        isIncluded:
          a.isIncluded !== undefined
            ? a.isIncluded
            : a.inc !== undefined
              ? a.inc
              : true,
        adultPrice:
          a.adultPrice !== undefined
            ? Number(a.adultPrice)
            : a.sellingPrice !== undefined
              ? Number(a.sellingPrice)
              : 0,
        childPrice: a.childPrice !== undefined ? Number(a.childPrice) : 0,
        vendorCost:
          a.vendorCost !== undefined
            ? Number(a.vendorCost)
            : a.estimatedCost !== undefined
              ? Number(a.estimatedCost)
              : 0,
        guideName: a.responsibleGuide || "Lead Guide",
        vehicleName: a.vehicleName || "Tempo 1",
        mealIncluded: "Included",
        notes: a.remarks || a.sub || "",
      }));
    }

    // Dynamic fallback derived from real trip computedItinerary
    if (computedItinerary && computedItinerary.length > 0) {
      return computedItinerary.map((item, idx) => {
        const dayNum =
          typeof item.day === "number"
            ? item.day
            : parseInt(String(item.day || "").replace(/\D/g, ""), 10) || idx + 1;

        const name = item.plan
          ? item.plan.split("/")[0].split("-")[0].trim()
          : item.title || `Day ${dayNum} Activity`;

        return {
          id: `itin-act-${dayNum}`,
          name,
          category: "SIGHTSEEING",
          dayNumber: dayNum,
          scheduledTime: "09:00 AM",
          endTime: "05:00 PM",
          status: "CONFIRMED",
          vendorName: "Contracted Supplier",
          maxCapacity: totalPaxCount,
          bookedCount: totalPaxCount,
          isIncluded: true,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Lead Guide",
          vehicleName: "Tempo 1",
          mealIncluded: "Included",
          notes: item.activities || item.sub || item.description || "",
        };
      });
    }

    return [];
  }, [activitiesList, computedItinerary, totalPaxCount]);

  const computedActivities = useMemo(() => {
    return currentActivities
      .filter((a) => {
        const matchDay =
          actDayFilter === "All Days" || String(a.dayNumber) === actDayFilter;
        const matchStatus =
          actStatusFilter === "All Status" ||
          a.status.toLowerCase() === actStatusFilter.toLowerCase();
        const matchSearch =
          actSearch === "" ||
          a.name.toLowerCase().includes(actSearch.toLowerCase()) ||
          a.vendorName.toLowerCase().includes(actSearch.toLowerCase());
        return matchDay && matchStatus && matchSearch;
      })
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }, [currentActivities, actDayFilter, actStatusFilter, actSearch]);

  const groupedByDay = useMemo(() => {
    const groups: Record<number, DepartureActivityItem[]> = {};
    const totalDays = computedItinerary.length > 0 ? computedItinerary.length : 9;
    if (actDayFilter === "All Days") {
      for (let d = 1; d <= totalDays; d++) {
        groups[d] = [];
      }
    }
    computedActivities.forEach((a) => {
      const day = a.dayNumber || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(a);
    });
    return groups;
  }, [computedActivities, actDayFilter, computedItinerary]);

  const daysAvailable = useMemo(() => {
    const totalDays = computedItinerary.length > 0 ? computedItinerary.length : 9;
    const s = new Set<number>();
    for (let d = 1; d <= totalDays; d++) s.add(d);
    currentActivities.forEach((a) => s.add(a.dayNumber));
    return Array.from(s).sort((a, b) => a - b);
  }, [currentActivities, computedItinerary]);

  const handleUpdateActivityItem = async (
    id: string,
    updated: Partial<DepartureActivityItem>,
  ) => {
    const nextList = currentActivities.map((item) =>
      item.id === id ? { ...item, ...updated } : item,
    );
    setActivitiesList(nextList);
    try {
      await api.put(`/ops/activities/${tripId}/${id}`, updated);
    } catch (e) {
      // Offline fallback still updates UI
    }
  };

  const handleDeleteActivityItem = async (id: string) => {
    const nextList = currentActivities.filter((item) => item.id !== id);
    setActivitiesList(nextList);
    toast.success("Activity removed from departure");
    try {
      await api.delete(`/ops/activities/${tripId}/${id}`);
    } catch (e) {
      // Offline fallback still updates UI
    }
  };

  const handleAddActivityFromWizard = async (newActivity: any) => {
    try {
      const persisted = await saveActivityToBackend(api, tripId, departureDateStr, newActivity);
      setActivitiesList([...currentActivities, persisted]);
    } catch (e) {
      // API error toast is shown by saveActivityToBackend; UI state is not mutated on failure
    }
  };

  const dynamicDayTitles = useMemo(() => {
    const map: Record<number, string> = {};
    computedItinerary.forEach((item, idx) => {
      const dNum =
        typeof item.day === "number"
          ? item.day
          : parseInt(String(item.day || "").replace(/\D/g, ""), 10) || idx + 1;
      map[dNum] = item.plan || item.title || item.description || `Day ${dNum} Plan`;
    });
    return map;
  }, [computedItinerary]);

  const kpiStats = useMemo(() => {
    const totalActivities = currentActivities.length;
    const pendingVendorConfirmations = currentActivities.filter(
      (a) =>
        a.status === "DRAFT" ||
        a.status === "READY" ||
        !a.status,
    ).length;
    const passengersBooked = Math.max(
      40,
      ...currentActivities.map((a) => a.maxCapacity || a.bookedCount || 0),
    );
    const totalRevenue = currentActivities.reduce(
      (acc, a) =>
        acc +
        (a.isIncluded
          ? 0
          : (a.adultPrice || a.sellingPrice || 0) * (a.bookedCount || 0)),
      0,
    );
    const totalVendorCost = currentActivities.reduce(
      (acc, a) =>
        acc + (a.vendorCost || 0) * (a.bookedCount || (a.isIncluded ? 40 : 0)),
      0,
    );
    const grossProfit = currentActivities.reduce(
      (acc, a) =>
        acc +
        (a.isIncluded
          ? 0
          : Math.max(
              0,
              (a.adultPrice || a.sellingPrice || 0) - (a.vendorCost || 0),
            ) * (a.bookedCount || 0)),
      0,
    );

    return {
      todayActivities: totalActivities,
      pendingVendorConfirmations,
      passengersBooked,
      totalRevenue,
      totalVendorCost,
      grossProfit,
    };
  }, [currentActivities]);

  return (
    <div className="space-y-6">
      {/* TOOLBAR: FILTER BAR & ADD ACTIVITY ACTION */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Day Filter */}
          <select
            value={actDayFilter}
            onChange={(e) => setActDayFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-orange-500"
          >
            <option value="All Days">All Days</option>
            {daysAvailable.map((d) => (
              <option key={d} value={String(d)}>
                Day {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={actStatusFilter}
            onChange={(e) => setActStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-orange-500"
          >
            <option value="All Status">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="READY">Ready</option>
            <option value="STARTED">Started</option>
            <option value="COMPLETED">Completed</option>
            <option value="RECONCILED">Reconciled</option>
          </select>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search activity or vendor..."
              value={actSearch}
              onChange={(e) => setActSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 w-full sm:w-64 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setWizardOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-9 px-4 text-xs shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Activity
          </Button>
        </div>
      </div>

      {/* DAY-WISE ITINERARY CARDS GROUPED CHRONOLOGICALLY */}
      <div className="space-y-8">
        {Object.keys(groupedByDay)
          .map(Number)
          .sort((a, b) => a - b)
          .map((day) => {
            const dayItems = groupedByDay[day];
            return (
              <div key={day} className="space-y-4">
                {/* DAY TITLE HEADER BANNER */}
                <div className="flex items-center gap-3 py-2 border-b-2 border-orange-500/20">
                  <div className="px-3 py-1 bg-orange-600 text-white rounded-lg font-black text-sm tracking-wider">
                    DAY {day}
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    {dynamicDayTitles[day] || `Day ${day} Scheduled Activities`}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-slate-400">
                    {dayItems.length}{" "}
                    {dayItems.length === 1 ? "Activity" : "Activities"}
                  </span>
                </div>

                {/* ACCORDION CARDS FOR THIS DAY */}
                <div className="space-y-3">
                  {dayItems.length > 0 ? (
                    dayItems.map((activity) => (
                      <DayWiseActivityAccordionCard
                        key={activity.id}
                        activity={activity}
                        onUpdateActivity={handleUpdateActivityItem}
                        onDeleteActivity={handleDeleteActivityItem}
                      />
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50/70 border border-dashed border-slate-300 rounded-xl flex items-center justify-between text-xs text-slate-500">
                      <span>No activities scheduled for Day {day} yet.</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setWizardOpen(true)}
                        className="h-7 px-3 text-xs bg-white hover:bg-orange-50 hover:text-orange-600 border-slate-300 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Activity to Day {day}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        {Object.keys(groupedByDay).length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Sparkles className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-base">
              No activities match your filters
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your day or status filters, or click "+ Add
              Activity" to schedule a new experience for this departure.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActDayFilter("All Days");
                setActStatusFilter("All Status");
                setActSearch("");
              }}
              className="mt-4 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* 5-STEP ADD ACTIVITY WIZARD MODAL */}
      <Activity5StepWizardModal
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onAddActivity={handleAddActivityFromWizard}
        daysList={daysAvailable.length > 0 ? daysAvailable : [1, 2, 3, 4, 5]}
      />
    </div>
  );
}
