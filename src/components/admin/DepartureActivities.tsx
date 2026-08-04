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
    // DAY 1: Train Journey
    {
      id: "dep-act-1",
      name: "Ahmedabad Station Check-in",
      dayNumber: 1,
      scheduledTime: "09:00 AM",
      endTime: "10:00 AM",
      status: "CONFIRMED",
      vendorName: "Indian Railways",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Train 19223",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-2",
      name: "Group Briefing",
      dayNumber: 1,
      scheduledTime: "11:30 AM",
      endTime: "12:00 PM",
      status: "CONFIRMED",
      vendorName: "YouthCamping Core",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Train Coach B4",
      mealIncluded: "Included",
    },
    {
      id: "dep-act-3",
      name: "Ice Breaking Session",
      dayNumber: 1,
      scheduledTime: "12:00 PM",
      endTime: "01:30 PM",
      status: "READY",
      vendorName: "YouthCamping Core",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Anand Verma",
      vehicleName: "Train Coach B4",
      mealIncluded: "Included",
    },
    // DAY 2: Amritsar
    {
      id: "dep-act-4",
      name: "Punjabi Breakfast",
      dayNumber: 2,
      scheduledTime: "08:00 AM",
      endTime: "09:00 AM",
      status: "CONFIRMED",
      vendorName: "Kesar Da Dhaba",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 350,
      childPrice: 250,
      vendorCost: 200,
      guideName: "Neel Patel",
      vehicleName: "Traveller 1",
      mealIncluded: "Included",
    },
    {
      id: "dep-act-5",
      name: "Golden Temple Visit",
      dayNumber: 2,
      scheduledTime: "11:00 AM",
      endTime: "01:00 PM",
      status: "CONFIRMED",
      vendorName: "SGPC Heritage",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Traveller 1",
      mealIncluded: "Langar Included",
    },
    {
      id: "dep-act-6",
      name: "Jallianwala Bagh",
      dayNumber: 2,
      scheduledTime: "01:00 PM",
      endTime: "02:30 PM",
      status: "CONFIRMED",
      vendorName: "Heritage Trust",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Traveller 1",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-7",
      name: "Wagah Border Excursion",
      dayNumber: 2,
      scheduledTime: "04:00 PM",
      endTime: "06:30 PM",
      status: "READY",
      vendorName: "Punjab Tourism",
      maxCapacity: 40,
      bookedCount: 38,
      adultPrice: 300,
      childPrice: 200,
      vendorCost: 150,
      guideName: "Anand Verma",
      vehicleName: "Traveller 1",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-8",
      name: "Amritsar Market Walk",
      dayNumber: 2,
      scheduledTime: "07:00 PM",
      endTime: "09:30 PM",
      status: "CONFIRMED",
      vendorName: "Self Guided",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Traveller 1",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-9",
      name: "Departure to Kasol",
      dayNumber: 2,
      scheduledTime: "10:00 PM",
      endTime: "06:00 AM",
      status: "CONFIRMED",
      vendorName: "Himachal Wheels",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Volvo 2+2 Bus",
      mealIncluded: "Not Included",
    },
    // DAY 3: Kasol
    {
      id: "dep-act-10",
      name: "Check-in & Refresh",
      dayNumber: 3,
      scheduledTime: "08:00 AM",
      endTime: "09:30 AM",
      status: "CONFIRMED",
      vendorName: "Parvati Woods Camp",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Kasol Shuttle",
      mealIncluded: "Included",
    },
    {
      id: "dep-act-11",
      name: "Manikaran Sahib Visit",
      dayNumber: 3,
      scheduledTime: "11:00 AM",
      endTime: "01:30 PM",
      status: "CONFIRMED",
      vendorName: "Parvati Valley Tours",
      maxCapacity: 40,
      bookedCount: 36,
      adultPrice: 200,
      childPrice: 150,
      vendorCost: 100,
      guideName: "Neel Patel",
      vehicleName: "Kasol Shuttle",
      mealIncluded: "Langar Included",
    },
    {
      id: "dep-act-12",
      name: "Chalal Trek & Cafe Walk",
      dayNumber: 3,
      scheduledTime: "05:30 PM",
      endTime: "07:30 PM",
      status: "READY",
      vendorName: "Local Mountain Guides",
      maxCapacity: 40,
      bookedCount: 35,
      adultPrice: 400,
      childPrice: 300,
      vendorCost: 200,
      guideName: "Anand Verma",
      vehicleName: "Self Guided",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-13",
      name: "Campfire & Acoustic Music",
      dayNumber: 3,
      scheduledTime: "08:00 PM",
      endTime: "10:30 PM",
      status: "CONFIRMED",
      vendorName: "Parvati Woods Camp",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Camp Ground",
      mealIncluded: "Dinner Included",
    },
    // DAY 4: Bijli Mahadev
    {
      id: "dep-act-14",
      name: "Bijli Mahadev Trek",
      dayNumber: 4,
      scheduledTime: "12:00 PM",
      endTime: "04:30 PM",
      status: "READY",
      vendorName: "Kullu Trekking Co.",
      maxCapacity: 40,
      bookedCount: 32,
      adultPrice: 600,
      childPrice: 450,
      vendorCost: 350,
      guideName: "Anand Verma",
      vehicleName: "Traveller 2",
      mealIncluded: "Packed Lunch",
    },
    // DAY 5: Adventure Day (Manali)
    {
      id: "dep-act-15",
      name: "Paragliding High Fly",
      dayNumber: 5,
      scheduledTime: "10:00 AM",
      endTime: "12:30 PM",
      status: "READY",
      vendorName: "Sky Riders Manali",
      maxCapacity: 35,
      bookedCount: 28,
      adultPrice: 3500,
      childPrice: 2800,
      vendorCost: 2500,
      guideName: "Neel Patel",
      vehicleName: "Traveller 1",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-16",
      name: "River Rafting (Beas River)",
      dayNumber: 5,
      scheduledTime: "01:00 PM",
      endTime: "03:30 PM",
      status: "CONFIRMED",
      vendorName: "ABC Adventures",
      maxCapacity: 40,
      bookedCount: 32,
      adultPrice: 1200,
      childPrice: 900,
      vendorCost: 700,
      guideName: "Neel Patel",
      vehicleName: "Traveller 1",
      mealIncluded: "Included",
    },
    {
      id: "dep-act-17",
      name: "Kullu Shawl Factory Walk",
      dayNumber: 5,
      scheduledTime: "04:00 PM",
      endTime: "06:00 PM",
      status: "CONFIRMED",
      vendorName: "Bhuntar Weavers",
      maxCapacity: 40,
      bookedCount: 35,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Anand Verma",
      vehicleName: "Traveller 1",
      mealIncluded: "Tea & Snacks",
    },
    // DAY 6: Solang
    {
      id: "dep-act-18",
      name: "ATV & Bike Ride",
      dayNumber: 6,
      scheduledTime: "10:00 AM",
      endTime: "11:30 AM",
      status: "CONFIRMED",
      vendorName: "Mountain Trails ATV",
      maxCapacity: 30,
      bookedCount: 24,
      adultPrice: 1500,
      childPrice: 1200,
      vendorCost: 900,
      guideName: "Neel Patel",
      vehicleName: "Traveller 2",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-19",
      name: "Solang Valley Snow Activities",
      dayNumber: 6,
      scheduledTime: "11:30 AM",
      endTime: "01:00 PM",
      status: "CONFIRMED",
      vendorName: "Solang Snow Club",
      maxCapacity: 40,
      bookedCount: 38,
      adultPrice: 800,
      childPrice: 600,
      vendorCost: 500,
      guideName: "Neel Patel",
      vehicleName: "Traveller 2",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-20",
      name: "Atal Tunnel & Sissu Visit",
      dayNumber: 6,
      scheduledTime: "01:00 PM",
      endTime: "05:00 PM",
      status: "READY",
      vendorName: "Lahaul Eco Tourism",
      maxCapacity: 40,
      bookedCount: 36,
      adultPrice: 1000,
      childPrice: 750,
      vendorCost: 650,
      guideName: "Anand Verma",
      vehicleName: "4x4 Tempo Traveller",
      mealIncluded: "Not Included",
    },
    // DAY 7: Manali
    {
      id: "dep-act-21",
      name: "Jogini Waterfall Trek",
      dayNumber: 7,
      scheduledTime: "08:00 AM",
      endTime: "11:30 AM",
      status: "CONFIRMED",
      vendorName: "Vashisht Trekking",
      maxCapacity: 40,
      bookedCount: 30,
      adultPrice: 350,
      childPrice: 250,
      vendorCost: 200,
      guideName: "Neel Patel",
      vehicleName: "Self Guided",
      mealIncluded: "Breakfast Included",
    },
    {
      id: "dep-act-22",
      name: "Hadimba Temple & Club House",
      dayNumber: 7,
      scheduledTime: "01:00 PM",
      endTime: "04:30 PM",
      status: "CONFIRMED",
      vendorName: "Manali Cultural Trust",
      maxCapacity: 40,
      bookedCount: 38,
      adultPrice: 200,
      childPrice: 150,
      vendorCost: 100,
      guideName: "Neel Patel",
      vehicleName: "Manali Shuttle",
      mealIncluded: "Not Included",
    },
    {
      id: "dep-act-23",
      name: "Mall Road Shopping & Cafe Hop",
      dayNumber: 7,
      scheduledTime: "05:00 PM",
      endTime: "09:00 PM",
      status: "CONFIRMED",
      vendorName: "Self Guided",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Anand Verma",
      vehicleName: "Self Guided",
      mealIncluded: "Not Included",
    },
    // DAY 8: Return Journey
    {
      id: "dep-act-24",
      name: "Train Boarding — Return Journey",
      dayNumber: 8,
      scheduledTime: "09:00 AM",
      endTime: "10:00 AM",
      status: "CONFIRMED",
      vendorName: "Indian Railways",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Train 19224",
      mealIncluded: "Included",
    },
    // DAY 9: Arrival
    {
      id: "dep-act-25",
      name: "Arrival & Trip Conclusion",
      dayNumber: 9,
      scheduledTime: "08:00 AM",
      endTime: "09:00 AM",
      status: "CONFIRMED",
      vendorName: "YouthCamping Core",
      maxCapacity: 40,
      bookedCount: 40,
      adultPrice: 0,
      childPrice: 0,
      vendorCost: 0,
      guideName: "Neel Patel",
      vehicleName: "Train 19224",
      mealIncluded: "Not Included",
    },
  ];

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
        maxCapacity: Number(a.maxParticipants) || 40,
        bookedCount:
          a.bookedCount !== undefined ? Number(a.bookedCount) : 40,
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
        childPrice:
          a.childPrice !== undefined
            ? Number(a.childPrice)
            : 0,
        vendorCost:
          a.vendorCost !== undefined
            ? Number(a.vendorCost)
            : a.estimatedCost !== undefined
            ? Number(a.estimatedCost)
            : 0,
        guideName: a.responsibleGuide || "Neel Patel",
        vehicleName: a.vehicleName || "Traveller 2",
        mealIncluded: "Included",
        notes: a.remarks || a.sub || "",
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
    // Ensure all 9 days of a 9-day trip are always shown in chronological order when All Days is selected
    if (actDayFilter === "All Days") {
      for (let d = 1; d <= 9; d++) {
        groups[d] = [];
      }
    }
    computedActivities.forEach((a) => {
      const day = a.dayNumber || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(a);
    });
    return groups;
  }, [computedActivities, actDayFilter]);

  const daysAvailable = useMemo(() => {
    const s = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]);
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

  const DAY_TITLES: Record<number, string> = {
    1: "Train Journey — Ahmedabad Station Check-in, Group Briefing & Ice Breaking",
    2: "Amritsar — Golden Temple, Jallianwala Bagh, Wagah Border & Kasol Transit",
    3: "Kasol — Check-in, Manikaran Sahib, Chalal Trek & Campfire",
    4: "Bijli Mahadev — Trek & Reach Manali",
    5: "Adventure Day — Paragliding, River Rafting & Shawl Factory",
    6: "Solang — ATV Ride, Solang Valley, Atal Tunnel & Sissu",
    7: "Manali — Jogini Trek, Hadimba Temple & Mall Road",
    8: "Return Journey — Train Boarding",
    9: "Arrival — Trip Conclusion",
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
                    {DAY_TITLES[day] || `Day ${day} Scheduled Activities`}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-slate-400">
                    {dayItems.length} {dayItems.length === 1 ? "Activity" : "Activities"}
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
