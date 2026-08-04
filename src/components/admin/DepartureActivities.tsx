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

interface DepartureActivitiesProps {
  tripId: string;
  departureDateStr: string;
  tripDetails: any;
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

  // Default sample activities if none exist yet for rich preview
  const defaultSampleActivities: DepartureActivityItem[] = [
    {
      id: "dep-act-1",
      name: "Breakfast",
      dayNumber: 1,
      scheduledTime: "08:00 AM",
      endTime: "09:00 AM",
      status: "CONFIRMED",
      vendorName: "Hotel Restaurant",
      maxCapacity: 40,
      bookedCount: 32,
      adultPrice: 400,
      childPrice: 250,
      vendorCost: 200,
      guideName: "Neel Patel",
      vehicleName: "Traveller 2",
      mealIncluded: "Included",
    },
    {
      id: "dep-act-2",
      name: "River Rafting",
      dayNumber: 1,
      scheduledTime: "09:30 AM",
      endTime: "12:30 PM",
      status: "CONFIRMED",
      vendorName: "ABC Adventures",
      maxCapacity: 40,
      bookedCount: 32,
      adultPrice: 1200,
      childPrice: 800,
      vendorCost: 700,
      guideName: "Neel Patel",
      vehicleName: "Traveller 2",
      mealIncluded: "Included",
    },
    {
      id: "dep-act-3",
      name: "Solang Valley Visit",
      dayNumber: 1,
      scheduledTime: "03:00 PM",
      endTime: "06:00 PM",
      status: "READY",
      vendorName: "Valley Tourism",
      maxCapacity: 40,
      bookedCount: 32,
      adultPrice: 600,
      childPrice: 400,
      vendorCost: 350,
      guideName: "Neel Patel",
      vehicleName: "Traveller 2",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-4",
      name: "Bonfire & DJ Night",
      dayNumber: 1,
      scheduledTime: "07:30 PM",
      endTime: "10:00 PM",
      status: "CONFIRMED",
      vendorName: "Campfire Resorts",
      maxCapacity: 40,
      bookedCount: 32,
      adultPrice: 500,
      childPrice: 300,
      vendorCost: 250,
      guideName: "Neel Patel",
      vehicleName: "Traveller 2",
      mealIncluded: "Snacks Included",
    },
    {
      id: "dep-act-5",
      name: "Paragliding High Fly",
      dayNumber: 2,
      scheduledTime: "09:00 AM",
      endTime: "12:00 PM",
      status: "READY",
      vendorName: "Sky Riders Manali",
      maxCapacity: 30,
      bookedCount: 24,
      adultPrice: 3500,
      childPrice: 2800,
      vendorCost: 2500,
      guideName: "Anand Verma",
      vehicleName: "Traveller 1",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-6",
      name: "ATV Jungle Trail Ride",
      dayNumber: 2,
      scheduledTime: "12:30 PM",
      endTime: "03:00 PM",
      status: "CONFIRMED",
      vendorName: "Mountain Trails ATV",
      maxCapacity: 25,
      bookedCount: 20,
      adultPrice: 1500,
      childPrice: 1200,
      vendorCost: 900,
      guideName: "Anand Verma",
      vehicleName: "Traveller 1",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-7",
      name: "Mall Road Shopping & Cafe Hop",
      dayNumber: 2,
      scheduledTime: "04:30 PM",
      endTime: "08:00 PM",
      status: "CONFIRMED",
      vendorName: "Self Guided",
      maxCapacity: 40,
      bookedCount: 32,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Traveller 2",
      mealIncluded: "Not Included",
    },
  ];

  const currentActivities: DepartureActivityItem[] = useMemo(() => {
    if (activitiesList && activitiesList.length > 0) {
      return activitiesList.map((a, idx) => ({
        id: a.id || `act-${idx}`,
        name: a.name || "Activity",
        category: a.type || a.category || "ADVENTURE",
        dayNumber: Number(a.dayNumber) || 1,
        scheduledTime: a.startTime || a.scheduledTime || "10:00 AM",
        endTime: a.endTime || "01:00 PM",
        status: (a.status?.toUpperCase() as any) || "CONFIRMED",
        vendorName: a.vendorName || "Contracted Supplier",
        maxCapacity: Number(a.maxParticipants) || 40,
        bookedCount: Number(a.bookedCount) || 32,
        adultPrice: Number(a.sellingPrice) || 1200,
        childPrice: Math.round((Number(a.sellingPrice) || 1200) * 0.7),
        vendorCost: Number(a.estimatedCost) || Number(a.vendorCost) || 700,
        guideName: a.responsibleGuide || "Neel Patel",
        vehicleName: a.vehicleName || "Traveller 2",
        mealIncluded: "Included",
        notes: a.remarks || "",
      }));
    }
    return defaultSampleActivities;
  }, [activitiesList]);

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
    computedActivities.forEach((a) => {
      const day = a.dayNumber || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(a);
    });
    return groups;
  }, [computedActivities]);

  const daysAvailable = useMemo(() => {
    const s = new Set<number>();
    currentActivities.forEach((a) => s.add(a.dayNumber));
    return Array.from(s).sort((a, b) => a - b);
  }, [currentActivities]);

  const handleUpdateActivityItem = async (
    id: string,
    updated: Partial<DepartureActivityItem>
  ) => {
    const nextList = currentActivities.map((item) =>
      item.id === id ? { ...item, ...updated } : item
    );
    setActivitiesList(nextList);
    try {
      await api.put(`/ops/activities/${tripId}/${id}`, updated);
    } catch (e) {
      // Offline fallback still updates UI
    }
  };

  const handleAddActivityFromWizard = async (newActivity: any) => {
    const nextList = [...currentActivities, newActivity];
    setActivitiesList(nextList);
    try {
      await api.post(
        `/ops/activities/${tripId}?departureDate=${departureDateStr}`,
        newActivity
      );
    } catch (e) {
      // Offline fallback still updates UI
    }
  };

  return (
    <div className="space-y-6">
      {/* ENTERPRISE KPI DASHBOARD HEADER */}
      <ActivityKPIHeader />

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
                    {day === 1
                      ? "Arrival, Hotel Check-in, Mall Road Walk, Bonfire"
                      : day === 2
                      ? "Breakfast, River Rafting, Cafe Hop, DJ Night"
                      : day === 3
                      ? "Solang Valley, ATV Ride, Paragliding, Shopping"
                      : `Day ${day} Scheduled Activities`}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-slate-400">
                    {dayItems.length} {dayItems.length === 1 ? "Activity" : "Activities"}
                  </span>
                </div>

                {/* ACCORDION CARDS FOR THIS DAY */}
                <div className="space-y-3">
                  {dayItems.map((activity) => (
                    <DayWiseActivityAccordionCard
                      key={activity.id}
                      activity={activity}
                      onUpdateActivity={handleUpdateActivityItem}
                    />
                  ))}
                </div>
              </div>
            ))}

        {Object.keys(groupedByDay).length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Sparkles className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-base">
              No activities match your filters
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your day or status filters, or click "+ Add Activity" to schedule a new experience for this departure.
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
