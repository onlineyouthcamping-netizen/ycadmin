import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { tripsService } from "@/services/trips.service";
import { knowledgeService, KnowledgeSection, TripNotice } from "@/services/knowledge.service";
import { 
  travelDeskService, 
  Itinerary, 
  ItineraryDay, 
  ItineraryRouteMap, 
  ItineraryInclusion, 
  ItineraryExclusion, 
  ItineraryNote, 
  TicketingSop, 
  TicketingLink, 
  TripSop, 
  TripDocument, 
  TripGallery, 
  TripNote 
} from "@/services/travelDesk.service";
import { Trip } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  BookOpen, Search, Bell, Mail, HelpCircle, Plus, Star, Clock, MapPin, 
  Compass, Users, ExternalLink, Edit2, Settings, ChevronRight, Train, Plane, 
  Bus, RotateCw, FileText, Building, User, AlertTriangle, 
  CreditCard, Utensils, MessageSquare, Copy, Image, Youtube, Link2, 
  Paperclip, Bot, FileSpreadsheet, Trash2, CheckCircle2
} from "lucide-react";

const tabs = [
  "Knowledge Hub",
  "Ticketing",
  "Itinerary",
  "SOPs",
  "Documents",
  "Vendor Directory",
  "Gallery",
  "Notes & Updates"
];

const quickActionsMap: Record<string, { icon: React.ComponentType<any>; label: string }[]> = {
  "Knowledge Hub": [
    { icon: FilePlusIcon, label: "Upload Document" },
    { icon: FilePlusIcon, label: "Add New SOP" },
    { icon: MessageSquare, label: "Create FAQ" },
    { icon: TicketIcon, label: "Add Ticketing SOP" },
    { icon: Bell, label: "Add Update / Notice" }
  ],
  "Ticketing": [
    { icon: TicketIcon, label: "Add Ticketing SOP" },
    { icon: TicketIcon, label: "Add Quick Link" },
    { icon: FilePlusIcon, label: "Upload Ticket Sample" },
    { icon: Bell, label: "Add Update / Notice" }
  ],
  "Itinerary": [
    { icon: FilePlusIcon, label: "Add Day Plan" },
    { icon: FilePlusIcon, label: "Add Route Map" },
    { icon: FilePlusIcon, label: "Add Inclusion" },
    { icon: FilePlusIcon, label: "Add Exclusion" }
  ],
  "SOPs": [
    { icon: FilePlusIcon, label: "Add New SOP" },
    { icon: Bell, label: "Add Update / Notice" }
  ],
  "Notes & Updates": [
    { icon: FileText, label: "Add New Note" },
    { icon: Bell, label: "Add Trip Update" },
    { icon: UploadIcon, label: "Upload Attachment" }
  ]
};

const sectionsMeta = [
  { icon: BookOpen, color: "blue", title: "Trip Overview", desc: "Key highlights, route, best time, difficulty & more" },
  { icon: Bell, color: "orange", title: "Sales Guide", desc: "How to sell, USPs, objections & answers" },
  { icon: HelpCircle, color: "green", title: "Customer FAQs", desc: "All customer questions & answers" },
  { icon: FileText, color: "purple", title: "Inclusions & Exclusions", desc: "What's included / not included" },
  { icon: TicketIcon, color: "pink", title: "Ticketing Info", desc: "Train, flight, bus, cab SOPs & rules" },
  { icon: FileText, color: "teal", title: "Visa & Entry", desc: "Visa process, docs, requirements" },
  { icon: MapPin, color: "yellow", title: "Destination Guide", desc: "Weather, food, culture, local info" },
  { icon: Compass, color: "red", title: "Packing Guide", desc: "What to carry, checklist, tips" },
  { icon: FileText, color: "indigo", title: "SOPs & Processes", desc: "Operational SOPs & workflows" },
  { icon: AlertTriangle, color: "rose", title: "Emergency Center", desc: "What to do in emergencies" },
  { icon: CreditCard, color: "lime", title: "Pricing & Policy", desc: "Price sheet, cancellation, refund" },
  { icon: HelpCircle, color: "cyan", title: "Past Learnings", desc: "Lessons, feedback & improvements" }
];

const colorMap: Record<string, [string, string]> = {
  blue: ["bg-blue-50 text-blue-600 border-blue-100", "text-blue-600"],
  orange: ["bg-orange-50 text-orange-600 border-orange-100", "text-orange-600"],
  green: ["bg-green-50 text-green-600 border-green-100", "text-green-600"],
  purple: ["bg-purple-50 text-purple-600 border-purple-100", "text-purple-600"],
  pink: ["bg-pink-50 text-pink-600 border-pink-100", "text-pink-600"],
  teal: ["bg-teal-50 text-teal-600 border-teal-100", "text-teal-600"],
  yellow: ["bg-yellow-50 text-yellow-755 border-yellow-100", "text-yellow-755"],
  red: ["bg-red-50 text-red-650 border-red-100", "text-red-650"],
  indigo: ["bg-indigo-50 text-indigo-600 border-indigo-100", "text-indigo-600"],
  rose: ["bg-rose-50 text-rose-600 border-rose-100", "text-rose-600"],
  lime: ["bg-lime-50 text-lime-700 border-lime-100", "text-lime-700"],
  cyan: ["bg-cyan-50 text-cyan-600 border-cyan-100", "text-cyan-600"]
};

// Simple Lucide wrapper helpers
function UploadIcon(props: React.SVGProps<SVGSVGElement>) { return <Plus {...props} className={cn("w-3.5 h-3.5 rotate-45", props.className)} />; }
function FilePlusIcon(props: React.SVGProps<SVGSVGElement>) { return <Plus {...props} className={cn("w-3.5 h-3.5", props.className)} />; }
function TicketIcon(props: React.SVGProps<SVGSVGElement>) { return <CreditCard {...props} className={cn("w-3.5 h-3.5", props.className)} />; }

export default function TravelDeskPage() {
  const navigate = useNavigate();
  const { admin } = useAuthStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState<string>("Knowledge Hub");
  const [tripTypeFilter, setTripTypeFilter] = useState<"domestic" | "international">("domestic");
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [tripSearch, setTripSearch] = useState("");
  const [sections, setSections] = useState<KnowledgeSection[]>([]);
  const [notices, setNotices] = useState<TripNotice[]>([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<{
    trips: any[];
    sections: KnowledgeSection[];
    notices: TripNotice[];
    vendors: any[];
  } | null>(null);

  // Tab 2: Ticketing state
  const [ticketingSops, setTicketingSops] = useState<TicketingSop[]>([]);
  const [ticketingLinks, setTicketingLinks] = useState<TicketingLink[]>([]);
  const [showAddTicketingSop, setShowAddTicketingSop] = useState(false);
  const [showAddTicketingLink, setShowAddTicketingLink] = useState(false);

  // Tab 3: Itinerary variants state
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [activeItinerary, setActiveItinerary] = useState<Itinerary | null>(null);
  const [itinerarySubTab, setItinerarySubTab] = useState<"days" | "routeMap" | "inclusions" | "exclusions" | "notes">("days");
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [newItineraryName, setNewItineraryName] = useState("");

  // Tab 4: SOPs state
  const [tripSops, setTripSops] = useState<TripSop[]>([]);
  const [sopFilter, setSopFilter] = useState("All SOPs");
  const [showAddTripSop, setShowAddTripSop] = useState(false);

  // Tab 5: Documents state
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [docsSummary, setDocsSummary] = useState<Record<string, number>>({});
  const [showAddDoc, setShowAddDoc] = useState(false);

  // Tab 7: Gallery state
  const [gallery, setGallery] = useState<TripGallery[]>([]);
  const [showAddGallery, setShowAddGallery] = useState(false);

  // Tab 8: Notes & Updates state
  const [tripNotes, setTripNotes] = useState<TripNote[]>([]);
  const [tripNotesSummary, setTripNotesSummary] = useState<Record<string, number>>({});
  const [showAddTripNote, setShowAddTripNote] = useState(false);

  // Loading States
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [isLoadingTabs, setIsLoadingTabs] = useState(false);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const allTrips = await tripsService.getAll();
        setTrips(allTrips || []);
        const matching = (allTrips || []).find(t => {
          const type = t.tripType?.toLowerCase() || t.category?.toLowerCase() || "";
          return tripTypeFilter === "international" 
            ? (type === "international" || t.location.toLowerCase().includes("vietnam"))
            : (type === "domestic" || (!type && !t.location.toLowerCase().includes("vietnam")));
        });
        if (matching) {
          setActiveTrip(matching);
        } else if (allTrips && allTrips.length > 0) {
          setActiveTrip(allTrips[0]);
        }
      } catch (err) {
        console.error("Failed to load trips:", err);
      }
    };
    loadTrips();
  }, []);

  useEffect(() => {
    if (trips.length > 0) {
      const matching = trips.find(t => {
        const type = t.tripType?.toLowerCase() || t.category?.toLowerCase() || "";
        if (tripTypeFilter === "international") {
          return type === "international" || t.location.toLowerCase().includes("vietnam");
        }
        return type === "domestic" || (!type && !t.location.toLowerCase().includes("vietnam"));
      });
      if (matching) {
        setActiveTrip(matching);
      }
    }
  }, [tripTypeFilter, trips]);

  // Load resources based on active tab and trip
  useEffect(() => {
    if (!activeTrip) return;

    const loadData = async () => {
      setIsLoadingTabs(true);
      try {
        if (activeTab === "Knowledge Hub") {
          setIsLoadingSections(true);
          const [secData, noticeData] = await Promise.all([
            knowledgeService.getSections(activeTrip.id),
            knowledgeService.getNotices(activeTrip.id)
          ]);
          setSections(secData);
          setNotices(noticeData);
          setIsLoadingSections(false);
        } else if (activeTab === "Ticketing") {
          const res = await travelDeskService.getTicketing(activeTrip.id);
          setTicketingSops(res.sops || []);
          setTicketingLinks(res.links || []);
        } else if (activeTab === "Itinerary") {
          const res = await travelDeskService.getItineraries(activeTrip.id);
          setItineraries(res || []);
          if (res && res.length > 0) {
            const def = res.find(i => i.isDefault) || res[0];
            setActiveItinerary(def);
          } else {
            setActiveItinerary(null);
          }
        } else if (activeTab === "SOPs") {
          const res = await travelDeskService.getSops(activeTrip.id);
          setTripSops(res || []);
        } else if (activeTab === "Documents") {
          const res = await travelDeskService.getDocuments(activeTrip.id);
          setDocuments(res.data || []);
          setDocsSummary(res.summary || {});
        } else if (activeTab === "Gallery") {
          const res = await travelDeskService.getGallery(activeTrip.id);
          setGallery(res || []);
        } else if (activeTab === "Notes & Updates") {
          const res = await travelDeskService.getNotes(activeTrip.id);
          setTripNotes(res.data || []);
          setTripNotesSummary(res.summary || {});
        }
      } catch (err) {
        console.error(`Failed to load ${activeTab} data:`, err);
      } finally {
        setIsLoadingTabs(false);
      }
    };
    loadData();
  }, [activeTrip, activeTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (globalSearch.trim().length > 1) {
        const results = await knowledgeService.search(globalSearch);
        setGlobalSearchResults(results);
      } else {
        setGlobalSearchResults(null);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [globalSearch]);

  const filteredTrips = trips.filter(t => {
    const type = t.tripType?.toLowerCase() || t.category?.toLowerCase() || "";
    const isMatchedType = tripTypeFilter === "international"
      ? (type === "international" || t.location.toLowerCase().includes("vietnam"))
      : (type === "domestic" || (!type && !t.location.toLowerCase().includes("vietnam")));
    
    const isMatchedSearch = t.title.toLowerCase().includes(tripSearch.toLowerCase()) || 
                            t.location.toLowerCase().includes(tripSearch.toLowerCase()) ||
                            (t.shortName && t.shortName.toLowerCase().includes(tripSearch.toLowerCase()));
    return isMatchedType && isMatchedSearch;
  });

  // Edit Section State (Knowledge Hub)
  const [isEditSectionOpen, setIsEditSectionOpen] = useState(false);
  const [selectedTabKey, setSelectedTabKey] = useState("");
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDesc, setSectionDesc] = useState("");
  const [sectionItemCount, setSectionItemCount] = useState(0);

  // Add Notice State
  const [isAddNoticeOpen, setIsAddNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");

  const tabKeyMap: Record<string, string> = {
    "Trip Overview": "Overview",
    "Sales Guide": "Sales Guide",
    "Customer FAQs": "Customer FAQs",
    "Inclusions & Exclusions": "Inclusions & Exclusions",
    "Ticketing Info": "Ticketing SOPs",
    "Visa & Entry": "Visa & Entry",
    "Destination Guide": "Destination Guide",
    "Packing Guide": "Packing Guide",
    "SOPs & Processes": "Operational SOPs",
    "Emergency Center": "Emergency Center",
    "Pricing & Policy": "Pricing & Policies",
    "Past Learnings": "Past Learnings"
  };

  const getMatchedCount = (title: string): number => {
    const targetTabKey = tabKeyMap[title] || title;
    const match = sections.find(s => s.tabKey.toLowerCase().replace(/\s/g, "") === targetTabKey.toLowerCase().replace(/\s/g, ""));
    return match ? match.itemCount : 0;
  };

  const handleCardClick = (metaTitle: string) => {
    const targetTabKey = tabKeyMap[metaTitle] || metaTitle;
    const match = sections.find(s => s.tabKey.toLowerCase().replace(/\s/g, "") === targetTabKey.toLowerCase().replace(/\s/g, ""));
    
    setSelectedTabKey(targetTabKey);
    if (match) {
      setSectionTitle(match.title);
      setSectionDesc(match.description);
      setSectionItemCount(match.itemCount);
    } else {
      setSectionTitle(metaTitle);
      setSectionDesc("");
      setSectionItemCount(0);
    }
    setIsEditSectionOpen(true);
  };

  const reloadTripData = async () => {
    if (activeTrip) {
      setIsLoadingSections(true);
      try {
        const [secData, noticeData] = await Promise.all([
          knowledgeService.getSections(activeTrip.id),
          knowledgeService.getNotices(activeTrip.id)
        ]);
        setSections(secData);
        setNotices(noticeData);
      } catch (e) {
        console.error("Failed to reload trip data:", e);
      } finally {
        setIsLoadingSections(false);
      }
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    try {
      const res = await knowledgeService.upsertSection({
        tripId: activeTrip.id,
        tabKey: selectedTabKey,
        title: sectionTitle,
        description: sectionDesc,
        itemCount: sectionItemCount
      });
      if (res) {
        toast.success("Section updated successfully!");
        setIsEditSectionOpen(false);
        reloadTripData();
      } else {
        toast.error("Failed to save section details.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving section.");
    }
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    try {
      const res = await knowledgeService.createNotice({
        tripId: activeTrip.id,
        title: noticeTitle,
        body: noticeBody
      });
      if (res) {
        toast.success("Notice published successfully!");
        setIsAddNoticeOpen(false);
        setNoticeTitle("");
        setNoticeBody("");
        reloadTripData();
      } else {
        toast.error("Failed to publish notice.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while publishing notice.");
    }
  };

  // ── ITINERARY ACTIONS ──
  const handleCreateItinerary = async () => {
    if (!activeTrip || !newItineraryName.trim()) return;
    try {
      const res = await travelDeskService.createItinerary({
        tripId: activeTrip.id,
        name: newItineraryName.trim(),
        isDefault: itineraries.length === 0,
        version: 1
      });
      setItineraries([...itineraries, res]);
      setActiveItinerary(res);
      setShowAddItinerary(false);
      setNewItineraryName("");
      toast.success("Itinerary variant created!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create itinerary");
    }
  };

  const handleDuplicateItinerary = async () => {
    if (!activeItinerary) return;
    try {
      const res = await travelDeskService.duplicateItinerary(activeItinerary.id);
      setItineraries([...itineraries, res]);
      setActiveItinerary(res);
      toast.success("Itinerary variant duplicated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate itinerary");
    }
  };

  const handleSetDefaultItinerary = async () => {
    if (!activeItinerary) return;
    try {
      const res = await travelDeskService.setDefaultItinerary(activeItinerary.id);
      const updated = itineraries.map(i => i.id === res.id ? { ...i, isDefault: true } : { ...i, isDefault: false });
      setItineraries(updated);
      setActiveItinerary(res);
      toast.success("Set default itinerary variant!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to set default itinerary");
    }
  };

  const handleDeleteItinerary = async () => {
    if (!activeItinerary) return;
    if (confirm("Are you sure you want to delete this itinerary variant?")) {
      try {
        await travelDeskService.deleteItinerary(activeItinerary.id);
        const filtered = itineraries.filter(i => i.id !== activeItinerary.id);
        setItineraries(filtered);
        setActiveItinerary(filtered.length > 0 ? filtered[0] : null);
        toast.success("Itinerary variant deleted");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete itinerary variant");
      }
    }
  };

  // Add Item States
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayNum, setNewDayNum] = useState("");
  const [newDayDate, setNewDayDate] = useState("");
  const [newDayPlan, setNewDayPlan] = useState("");
  const [newDayStay, setNewDayStay] = useState("");
  const [newDayMeals, setNewDayMeals] = useState("");
  const [newDayTrans, setNewDayTrans] = useState("");
  const [newDayDist, setNewDayDist] = useState("");

  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItinerary) return;
    try {
      const updatedDays = [...activeItinerary.days, {
        dayNumber: newDayNum,
        dayDate: newDayDate,
        plan: newDayPlan,
        stay: newDayStay,
        meals: newDayMeals,
        transport: newDayTrans,
        distance: newDayDist
      } as any];
      
      const res = await travelDeskService.updateItinerary(activeItinerary.id, {
        days: updatedDays
      });
      setActiveItinerary(res);
      setItineraries(itineraries.map(i => i.id === res.id ? res : i));
      setShowAddDay(false);
      setNewDayNum("");
      setNewDayDate("");
      setNewDayPlan("");
      setNewDayStay("");
      setNewDayMeals("");
      setNewDayTrans("");
      setNewDayDist("");
      toast.success("Day added to itinerary!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add itinerary day");
    }
  };

  // ── SOPs Category Color Mapping lookup map (Frontend derived, not stored) ──
  const sopColorMap: Record<string, string> = {
    "Pre-Trip Planning": "orange",
    "On Trip Operations": "green",
    "Vendor Management": "blue",
    "Emergency": "red",
    "Post Trip": "purple",
    "Finance": "yellow",
    "Food & Meal": "teal",
    "Customer Handling": "indigo"
  };

  const getSopColor = (category: string): string => {
    return sopColorMap[category] || "blue";
  };

  const currentQuickActions = quickActionsMap[activeTab] || quickActionsMap["Knowledge Hub"];

  return (
    <div className="flex flex-col h-screen bg-[#F7F8FA]">
      {/* HEADER SECTION */}
      <div className="bg-[#0B1220] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-[#FF6B00] p-2 rounded-lg text-white">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              YouthCamping OS <span className="text-[10px] bg-slate-800 text-[#FF6B00] px-2 py-0.5 rounded-[4px] font-bold border border-slate-700 tracking-wider">TRAVEL DESK</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Centralizing Departures, Itineraries, SOPs and Trip Documents</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-450 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Global Search Knowledge, SOPs or Links..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B00] transition-all"
            />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-xs font-bold text-[#FF6B00]">
            {admin?.name?.substring(0,2).toUpperCase() || "OP"}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT TRIP SELECTOR BAR */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="flex gap-1.5 p-0.5 bg-slate-50 border border-slate-200 rounded-lg">
              <button
                onClick={() => setTripTypeFilter("domestic")}
                className={cn(
                  "flex-1 text-center py-1.5 text-[10px] font-black rounded-md uppercase tracking-wider transition-all cursor-pointer",
                  tripTypeFilter === "domestic" ? "bg-white text-slate-800 shadow-xxs border" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Domestic
              </button>
              <button
                onClick={() => setTripTypeFilter("international")}
                className={cn(
                  "flex-1 text-center py-1.5 text-[10px] font-black rounded-md uppercase tracking-wider transition-all cursor-pointer",
                  tripTypeFilter === "international" ? "bg-white text-slate-800 shadow-xxs border" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Int'l
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Search trip..."
                value={tripSearch}
                onChange={e => setTripSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-[6px] pl-8 pr-3 py-1.5 text-xs placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTrips.map((trip) => {
              const isActive = activeTrip?.id === trip.id;
              return (
                <div
                  key={trip.id}
                  onClick={() => setActiveTrip(trip)}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all border",
                    isActive 
                      ? "bg-[#FF6B00]/5 border-[#FF6B00]/30 text-slate-900 shadow-xxs" 
                      : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <MapPin className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[#FF6B00]" : "text-slate-400")} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{trip.title}</p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">{trip.duration || "N/A"} &middot; {trip.location}</p>
                  </div>
                </div>
              );
            })}
            {filteredTrips.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8 italic">No trips matching filters</p>
            )}
          </div>
        </div>

        {/* CENTER DETAIL WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {globalSearchResults ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Search Results for "{globalSearch}"</h2>
                <button className="text-xs font-bold text-slate-500 hover:text-slate-800" onClick={() => setGlobalSearch("")}>Clear Search</button>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
                {globalSearchResults.sections.map(sec => (
                  <div key={sec.id} className="pb-3 border-b border-slate-100 last:border-0 cursor-pointer" onClick={() => { setGlobalSearch(""); setActiveTab("Knowledge Hub"); }}>
                    <p className="text-xs font-bold text-slate-800">{sec.title}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{sec.tabKey}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{sec.description}</p>
                  </div>
                ))}
                {globalSearchResults.sections.length === 0 && (
                  <p className="text-xs text-slate-450 italic">No search results found</p>
                )}
              </div>
            </div>
          ) : !activeTrip ? (
            <div className="bg-white border border-slate-250 rounded-xl p-16 text-center max-w-lg mx-auto mt-16 shadow-sm">
              <Compass className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-bounce" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Select a Trip</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Please pick a trip from the left sidebar to view its details, itineraries and operating procedures.</p>
            </div>
          ) : (
            <>
              {/* TRIP SUMMARY HEADER CARD */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xxs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#FF6B00] flex items-center justify-center border border-orange-100">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">{activeTrip.title}</h2>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{activeTrip.location} &middot; {activeTrip.duration || "N/A"} &middot; {activeTrip.tripType || "Domestic"}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-bold">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Difficulty</p>
                    <p className="text-slate-700 mt-0.5">{activeTrip.difficulty || "Moderate"}</p>
                  </div>
                  <div className="border-l border-slate-200 pl-4 text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Max Altitude</p>
                    <p className="text-slate-700 mt-0.5">{activeTrip.maxAltitude || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* HORIZONTAL SUB TAB BAR */}
              <div className="flex gap-6 border-b border-[#E2E8F0] text-xs overflow-x-auto select-none bg-white py-1 px-3 rounded-lg border shadow-xxs">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const iconsMap: Record<string, React.ComponentType<any>> = {
                    "Knowledge Hub": BookOpen,
                    "Ticketing": TicketIcon,
                    "Itinerary": MapPin,
                    "SOPs": FileText,
                    "Documents": FileText,
                    "Vendor Directory": Building,
                    "Gallery": Image,
                    "Notes & Updates": Bell
                  };
                  const IconComponent = iconsMap[tab] || BookOpen;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "pb-2.5 pt-1 whitespace-nowrap flex items-center gap-1.5 transition-all border-b-2 text-xs font-bold cursor-pointer",
                        isActive ? "border-[#FF6B00] text-[#FF6B00]" : "border-transparent text-slate-500 hover:text-slate-900"
                      )}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* SUB TAB VIEWPORT SWITCHER */}
              {isLoadingTabs ? (
                <div className="bg-white border border-slate-200 rounded-lg p-16 text-center shadow-xxs animate-pulse">
                  <RotateCw className="w-6 h-6 text-slate-350 mx-auto mb-2 animate-spin" />
                  <p className="text-xs text-slate-500 font-semibold">Loading data...</p>
                </div>
              ) : (
                <>
                  {/* 1. KNOWLEDGE HUB */}
                  {activeTab === "Knowledge Hub" && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Knowledge Hub</h3>
                          <p className="text-[11px] text-slate-500 font-semibold">Everything you need to know about this trip</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="h-8 px-3 border border-slate-250 hover:bg-slate-50 bg-white rounded-[6px] text-xs text-slate-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer" onClick={() => handleCardClick("Trip Overview")}>
                            <Edit2 className="w-3.5 h-3.5" />Edit Trip Content
                          </button>
                        </div>
                      </div>

                      {isLoadingSections ? (
                        <div className="grid grid-cols-4 gap-4">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200/60 rounded-lg p-4 animate-pulse h-36">
                              <div className="w-9 h-9 rounded-lg bg-slate-200 mb-3 border"></div>
                              <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                              <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                            </div>
                          ))}
                        </div>
                      ) : sections.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center shadow-xxs">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-755">No knowledge sections found</p>
                          <p className="text-[11px] text-slate-500 font-semibold mt-1">Add details to get started.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-4">
                          {sectionsMeta.map((meta) => {
                            const count = getMatchedCount(meta.title);
                            const colorConfig = colorMap[meta.color] || colorMap.blue;
                            const [bgStyle, textStyle] = colorConfig;
                            const IconComponent = meta.icon;

                            return (
                              <div
                                key={meta.title}
                                onClick={() => handleCardClick(meta.title)}
                                className="bg-white border border-slate-200/60 rounded-lg p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between"
                              >
                                <div>
                                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3 border", bgStyle)}>
                                    <IconComponent className={cn("w-4 h-4", textStyle)} />
                                  </div>
                                  <p className="text-xs font-bold mb-1 text-slate-900">{meta.title}</p>
                                  <p className="text-[11px] text-slate-500 leading-normal font-medium mb-3">{meta.desc}</p>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                                  <span className="text-[10px] text-slate-400 font-bold">{count} items</span>
                                  <ChevronRight className="text-slate-400 w-3.5 h-3.5" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* 2. TICKETING */}
                  {activeTab === "Ticketing" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Ticketing Information</h3>
                          <p className="text-[11px] text-slate-500 font-semibold">All ticketing related SOPs, guides, rules and templates for this trip</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        {ticketingSops.map((sop) => {
                          const iconColor = sop.category === "train" ? "blue" : sop.category === "flight" ? "purple" : sop.category === "bus" ? "sky" : "red";
                          const colorConfig = colorMap[iconColor] || colorMap.blue;
                          const [bgStyle, textStyle] = colorConfig;
                          const IconComp = sop.category === "train" ? Train : sop.category === "flight" ? Plane : sop.category === "bus" ? Bus : CreditCard;

                          return (
                            <div key={sop.id} className="bg-white border border-slate-200/60 rounded-lg p-4 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all">
                              <div>
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", bgStyle)}>
                                  <IconComp className={cn("w-4 h-4", textStyle)} />
                                </div>
                                <p className="text-xs font-bold text-slate-900">{sop.title}</p>
                                <p className="text-[11px] text-slate-500 leading-normal font-semibold mt-1">{sop.description}</p>
                              </div>
                              <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-3 text-[10px] text-slate-450 font-bold">
                                <span>{sop._count?.items || sop.items.length || 0} items</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            </div>
                          );
                        })}
                        {ticketingSops.length === 0 && (
                          <div className="col-span-4 bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-450 italic">
                            No Ticketing SOPs found.
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-slate-200/60 rounded-lg p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider text-[10px]">Quick Access &amp; Links</p>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-xs">
                          {ticketingLinks.map((item) => {
                            const LinkIcon = item.icon === "train" ? Train : item.icon === "plane" ? Plane : item.icon === "bus" ? Bus : FileText;
                            return (
                              <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                                <span className="flex items-center gap-2 text-slate-700 font-semibold">
                                  <LinkIcon className="text-slate-400 w-3.5 h-3.5" /> {item.label}
                                </span>
                                <span className="font-bold text-[#FF6B00] flex items-center gap-0.5 cursor-pointer hover:underline" onClick={() => item.linkUrl && window.open(item.linkUrl, "_blank")}>
                                  {item.val} <ChevronRight className="w-3 h-3 inline" />
                                </span>
                              </div>
                            );
                          })}
                          {ticketingLinks.length === 0 && (
                            <p className="col-span-2 text-xs text-slate-400 italic">No links added.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. ITINERARY */}
                  {activeTab === "Itinerary" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Itinerary</h3>
                          <p className="text-[11px] text-slate-500 font-semibold text-medium">Manage day by day plan, stays, meals, distances and activities</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {itineraries.length > 0 && (
                            <div className="flex items-center gap-1 bg-slate-150 border border-slate-200 rounded-[6px] p-0.5">
                              <select 
                                value={activeItinerary?.id || ""} 
                                onChange={e => {
                                  const found = itineraries.find(i => i.id === e.target.value);
                                  if (found) setActiveItinerary(found);
                                }}
                                className="text-xs bg-white text-slate-800 font-bold px-2 py-1 rounded shadow-xxs border border-slate-200 outline-none"
                              >
                                {itineraries.map(it => (
                                  <option key={it.id} value={it.id}>
                                    {it.name} {it.isDefault ? "(Default)" : ""} (v{it.version})
                                  </option>
                                ))}
                              </select>
                              <button className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 cursor-pointer transition-colors" onClick={handleDuplicateItinerary}>
                                Duplicate
                              </button>
                              <button className="text-xs font-bold text-[#FF6B00] hover:text-[#e05e00] px-2 py-1 cursor-pointer transition-colors" onClick={handleSetDefaultItinerary}>
                                Make Default
                              </button>
                              <button className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1 cursor-pointer transition-colors" onClick={handleDeleteItinerary}>
                                Delete
                              </button>
                            </div>
                          )}
                          <button className="h-8 px-3 border border-slate-250 hover:bg-slate-50 bg-[#FF6B00] text-white rounded-[6px] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer" onClick={() => setShowAddItinerary(true)}>
                            + New Itinerary
                          </button>
                        </div>
                      </div>

                      {activeItinerary ? (
                        <div className="space-y-4">
                          {/* Sub-tabs bar for Route Maps, Inclusions, Exclusions, Notes */}
                          <div className="flex gap-4 border-b border-[#E2E8F0] text-xs py-1">
                            {[
                              { key: "days", label: "Days Plan", icon: Clock },
                              { key: "routeMap", label: "Route Map", icon: MapPin },
                              { key: "inclusions", label: "Inclusions", icon: CheckCircle2 },
                              { key: "exclusions", label: "Exclusions", icon: AlertTriangle },
                              { key: "notes", label: "Important Notes", icon: FileText }
                            ].map(sub => {
                              const isSubActive = itinerarySubTab === sub.key;
                              const SubIcon = sub.icon;
                              return (
                                <button
                                  key={sub.key}
                                  onClick={() => setItinerarySubTab(sub.key as any)}
                                  className={cn(
                                    "pb-2 pt-1 font-bold flex items-center gap-1 cursor-pointer border-b-2 transition-colors",
                                    isSubActive ? "border-[#FF6B00] text-[#FF6B00]" : "border-transparent text-slate-500"
                                  )}
                                >
                                  <SubIcon className="w-3.5 h-3.5" />
                                  {sub.label}
                                </button>
                              );
                            })}
                          </div>

                          {itinerarySubTab === "days" && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700">Detailed Day Plans</span>
                                <button className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold" onClick={() => setShowAddDay(true)}>+ Add Day</button>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xxs">
                                <table className="w-full text-xs text-left border-collapse">
                                  <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200">
                                    <tr>
                                      <th className="p-3 font-bold uppercase tracking-wider text-[9px] w-12 text-center">Day</th>
                                      <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Date / Timing</th>
                                      <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Destination / Plan &amp; Activities</th>
                                      <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Stay</th>
                                      <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Meals</th>
                                      <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Transport</th>
                                      <th className="p-3 font-bold uppercase tracking-wider text-[9px] text-right">Drive Time / Distance</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(activeItinerary.days || []).map((row, idx) => (
                                      <tr key={row.id || idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3 text-center"><span className="w-5 h-5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center font-bold text-[10px]">{row.dayNumber}</span></td>
                                        <td className="p-3 font-semibold text-slate-800">{row.dayDate}</td>
                                        <td className="p-3"><p className="font-bold text-slate-800">{row.plan}</p></td>
                                        <td className="p-3 font-medium text-slate-500">{row.stay}</td>
                                        <td className="p-3 font-mono font-bold text-slate-500">{row.meals}</td>
                                        <td className="p-3 text-slate-655 font-semibold">{row.transport}</td>
                                        <td className="p-3 font-bold text-slate-500 text-right">{row.distance}</td>
                                      </tr>
                                    ))}
                                    {(!activeItinerary.days || activeItinerary.days.length === 0) && (
                                      <tr>
                                        <td colSpan={7} className="p-4 text-center text-xs text-slate-400 italic">No days added. Click "+ Add Day" to populate.</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {itinerarySubTab === "routeMap" && (
                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                              <h4 className="text-xs font-bold text-slate-900 uppercase">Route Maps</h4>
                              {(activeItinerary.routeMaps || []).map(rm => (
                                <div key={rm.id} className="flex items-start gap-4 p-3 border rounded-lg bg-slate-50">
                                  {rm.mapUrl && <Image className="w-16 h-16 object-cover rounded bg-white border" />}
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{rm.description || "No description provided"}</p>
                                    <p className="text-[10px] text-blue-600 truncate mt-1 hover:underline cursor-pointer" onClick={() => rm.mapUrl && window.open(rm.mapUrl, "_blank")}>{rm.mapUrl}</p>
                                  </div>
                                </div>
                              ))}
                              {(!activeItinerary.routeMaps || activeItinerary.routeMaps.length === 0) && (
                                <p className="text-xs text-slate-450 italic text-center py-4">No route maps configured for this variant.</p>
                              )}
                            </div>
                          )}

                          {itinerarySubTab === "inclusions" && (
                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                              <h4 className="text-xs font-bold text-slate-900 uppercase">Inclusions ({activeItinerary.inclusions?.length || 0})</h4>
                              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                                {(activeItinerary.inclusions || []).map(inc => (
                                  <li key={inc.id}>{inc.text}</li>
                                ))}
                              </ul>
                              {(!activeItinerary.inclusions || activeItinerary.inclusions.length === 0) && (
                                <p className="text-xs text-slate-450 italic text-center py-4">No inclusions specified.</p>
                              )}
                            </div>
                          )}

                          {itinerarySubTab === "exclusions" && (
                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                              <h4 className="text-xs font-bold text-slate-900 uppercase">Exclusions ({activeItinerary.exclusions?.length || 0})</h4>
                              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                                {(activeItinerary.exclusions || []).map(exc => (
                                  <li key={exc.id}>{exc.text}</li>
                                ))}
                              </ul>
                              {(!activeItinerary.exclusions || activeItinerary.exclusions.length === 0) && (
                                <p className="text-xs text-slate-450 italic text-center py-4">No exclusions specified.</p>
                              )}
                            </div>
                          )}

                          {itinerarySubTab === "notes" && (
                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                              <h4 className="text-xs font-bold text-slate-900 uppercase">Important Notes</h4>
                              {(activeItinerary.notes || []).map(n => (
                                <div key={n.id} className="p-3 border rounded-lg bg-orange-50/20 border-orange-100">
                                  <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-[#FF6B00]" /> {n.title}
                                  </p>
                                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                                </div>
                              ))}
                              {(!activeItinerary.notes || activeItinerary.notes.length === 0) && (
                                <p className="text-xs text-slate-450 italic text-center py-4">No important notes provided.</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-lg p-16 text-center">
                          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-755">No itinerary variants configured</p>
                          <p className="text-[11px] text-slate-500 font-semibold mt-1">Create a new variant (like Backpacker, Deluxe, Budget) to start planning.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. SOPS */}
                  {activeTab === "SOPs" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Standard Operating Procedures (SOPs)</h3>
                          <p className="text-[11px] text-slate-500 font-semibold">Step-by-step process guides and operational procedures for this trip</p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {["All SOPs", "Pre-Trip Planning", "On Trip Operations", "Vendor Management", "Emergency", "Post Trip", "Finance"].map(sop => (
                          <button
                            key={sop}
                            onClick={() => setSopFilter(sop)}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-[6px] border font-bold transition-all cursor-pointer",
                              sopFilter === sop ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            {sop}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        {tripSops.filter(s => sopFilter === "All SOPs" || s.category === sopFilter).map((sop) => {
                          const col = getSopColor(sop.category);
                          const IconComp = sop.icon === "building" ? Building : sop.icon === "bus" ? Bus : sop.icon === "user" ? User : sop.icon === "alert" ? AlertTriangle : sop.icon === "card" ? CreditCard : FileText;

                          return (
                            <div key={sop.id} className="bg-white border border-slate-200/65 rounded-lg p-4 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all">
                              <div>
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", colorMap[col][0])}>
                                  <IconComp className={cn("w-4 h-4", colorMap[col][1])} />
                                </div>
                                <p className="text-xs font-bold text-slate-800">{sop.title}</p>
                                <p className="text-[11px] text-slate-500 font-semibold leading-normal mt-1">{sop.description}</p>
                              </div>
                              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-3 text-[10px] text-slate-400 font-bold">
                                <span>{sop._count?.items || sop.items.length || 0} items</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            </div>
                          );
                        })}
                        {tripSops.length === 0 && (
                          <div className="col-span-4 bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-450 italic">
                            No operational SOPs found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. DOCUMENTS */}
                  {activeTab === "Documents" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Documents &amp; Templates</h3>
                          <p className="text-[11px] text-slate-500 font-semibold">Access and download all documents for this departure</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-6 gap-3">
                        {[
                          { title: "Trip Documents", category: "Trip Documents", color: "blue", icon: FileText },
                          { title: "SOPs & Processes", category: "SOPs & Processes", color: "green", icon: FileSpreadsheet },
                          { title: "Vendor Documents", category: "Vendor Documents", color: "indigo", icon: FileText },
                          { title: "Customer Documents", category: "Customer Documents", color: "pink", icon: User },
                          { title: "Marketing Materials", category: "Marketing Materials", color: "purple", icon: Bell },
                          { title: "Competitor Docs", category: "Competitor Docs", color: "orange", icon: Copy }
                        ].map((docItem, idx) => {
                          const DocIcon = docItem.icon;
                          const fileCount = docsSummary[docItem.category] || 0;
                          return (
                            <div key={idx} className="bg-white border border-slate-200 rounded-[8px] p-3 flex flex-col justify-between cursor-pointer hover:shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border", colorMap[docItem.color][0])}>
                                  <DocIcon className={cn("w-3 h-3", colorMap[docItem.color][1])} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-800 truncate">{docItem.title}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold block mt-2">{fileCount} files</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xxs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Document Name</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Category</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Type</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">File Size</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Added By</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Date Added</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px] text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map((row, idx) => (
                              <tr key={row.id || idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-bold text-slate-800 flex items-center gap-1.5"><FileText className="text-[#FF6B00] w-3.5 h-3.5" />{row.name}</td>
                                <td className="p-3"><span className="bg-slate-50 text-slate-655 px-2 py-0.5 rounded font-bold border border-slate-100 text-[10px]">{row.category}</span></td>
                                <td className="p-3 font-mono font-bold text-slate-450">{row.fileType}</td>
                                <td className="p-3 font-bold text-slate-600">{row.size || "Unknown"}</td>
                                <td className="p-3 font-semibold text-slate-700">{row.addedBy}</td>
                                <td className="p-3 text-slate-500 font-semibold">{new Date(row.dateAdded).toLocaleDateString("en-IN")}</td>
                                <td className="p-3 text-right text-slate-400 font-bold cursor-pointer hover:text-slate-900">&middot;&middot;&middot;</td>
                              </tr>
                            ))}
                            {documents.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-4 text-center text-xs text-slate-400 italic">No files uploaded.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 6. VENDOR DIRECTORY */}
                  {activeTab === "Vendor Directory" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Vendor Directory</h3>
                          <p className="text-[11px] text-slate-500 font-semibold">All trusted vendors, partners and service providers for this trip</p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xxs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Vendor Name</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Category</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Location</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Contact Details</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Rating</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px]">Status</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-[9px] text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { name: "Himalayan Stay Hotels", cat: "Hotel / Stays", loc: "Manali", contact: "Rohit Thakur / +91 98165 43210", rating: "4.8", status: "Active" },
                              { name: "Manali Volvo Travels", cat: "Transport", loc: "Manali", contact: "Deepak Sharma / +91 98160 77890", rating: "4.6", status: "Active" },
                              { name: "Kasol Camps & Cafe", cat: "Camping", loc: "Kasol", contact: "Amit Negi / +91 98057 22011", rating: "4.5", status: "Active" }
                            ].map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-bold text-slate-800">{row.name}</td>
                                <td className="p-3"><span className="bg-[#FF6B00]/10 text-[#FF6B00] px-2 py-0.5 rounded font-bold border border-[#FF6B00]/25 text-[10px]">{row.cat}</span></td>
                                <td className="p-3 font-semibold text-slate-500">{row.loc}</td>
                                <td className="p-3 font-semibold text-slate-655">{row.contact}</td>
                                <td className="p-3">
                                  <span className="flex items-center gap-1 font-bold text-slate-700">
                                    {row.rating} <Star className="w-3 h-3 text-[#FF6B00] fill-[#FF6B00]" />
                                  </span>
                                </td>
                                <td className="p-3"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-emerald-200">{row.status}</span></td>
                                <td className="p-3 text-right text-slate-400 font-bold cursor-pointer hover:text-slate-900">&middot;&middot;&middot;</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 7. GALLERY */}
                  {activeTab === "Gallery" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Trip Gallery</h3>
                        <p className="text-[11px] text-slate-500 font-semibold">Visual assets, marketing pictures, and past group photographs</p>
                      </div>
                      <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-slate-200/60">
                        {gallery.map(img => (
                          <div key={img.id} className="aspect-video bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center relative group border border-slate-200">
                            {img.imageUrl ? (
                              <img src={img.imageUrl} alt={img.title} className="object-cover w-full h-full" />
                            ) : (
                              <Image className="text-slate-355 w-6 h-6 group-hover:scale-110 transition-all duration-200" />
                            )}
                            <span className="absolute bottom-2 left-2 text-[10px] bg-slate-900/60 text-white font-bold px-1.5 py-0.5 rounded-[4px]">{img.title}</span>
                          </div>
                        ))}
                        {gallery.length === 0 && (
                          <div className="col-span-4 text-center py-8 text-xs text-slate-450 italic">No gallery items uploaded.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 8. NOTES & UPDATES */}
                  {activeTab === "Notes & Updates" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Notes &amp; Updates</h3>
                        <p className="text-[11px] text-slate-500 font-semibold">Important notes, updates, links and references for this trip</p>
                      </div>

                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { label: "Total Notes", count: tripNotes.length, icon: FileText, color: "blue" },
                          { label: "YouTube Videos", count: tripNotesSummary["YouTube"] || 0, icon: Youtube, color: "red" },
                          { label: "Important Links", count: tripNotesSummary["Link"] || 0, icon: Link2, color: "green" },
                          { label: "Trip Updates", count: tripNotesSummary["Update"] || 0, icon: Bell, color: "orange" },
                          { label: "Attachments", count: tripNotesSummary["Attachment"] || 0, icon: Paperclip, color: "purple" }
                        ].map((stat, idx) => {
                          const StatIcon = stat.icon;
                          return (
                            <div key={idx} className="bg-white border border-slate-250 rounded-lg p-3 flex flex-col justify-between shadow-xxs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 font-bold">{stat.label}</span>
                                <StatIcon className={cn("w-3.5 h-3.5", colorMap[stat.color][1])} />
                              </div>
                              <p className="text-xl font-extrabold text-slate-900 mt-2">{stat.count}</p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider text-[10px]">Recent Notes &amp; Updates History</p>
                        <div className="space-y-3">
                          {tripNotes.map((notice, nIdx) => (
                            <div key={notice.id || nIdx} className="flex items-start justify-between py-2 border-b border-slate-100">
                              <div className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] mt-1.5 flex-shrink-0"></span>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{notice.title}</p>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Category: {notice.category} &middot; {new Date(notice.createdAt).toLocaleDateString("en-IN")}</p>
                                  {notice.content && <p className="text-[11px] text-slate-600 mt-1">{notice.content}</p>}
                                </div>
                              </div>
                              <span className="text-[10px] bg-[#FF6B00]/10 text-[#FF6B00] px-2 py-0.5 rounded font-bold border border-[#FF6B00]/25 capitalize cursor-pointer hover:underline" onClick={() => notice.linkUrl && window.open(notice.linkUrl, "_blank")}>
                                View Link
                              </span>
                            </div>
                          ))}
                          {tripNotes.length === 0 && (
                            <p className="text-xs text-slate-450 italic text-center py-4">No notes or updates created yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* RIGHT QUICK ACTIONS & UPDATES PANEL */}
        <div className="w-[300px] flex-shrink-0 bg-white border-l border-slate-200 p-4 overflow-y-auto space-y-4">
          {/* QUICK ACTIONS CARD */}
          <div className="border border-slate-200 rounded-lg p-4 shadow-xxs bg-white">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-3 uppercase">QUICK ACTIONS</p>
            <div className="space-y-1">
              {currentQuickActions.map((act) => {
                const ActIcon = act.icon;
                return (
                  <div
                    key={act.label}
                    onClick={() => {
                      if (act.label.toLowerCase().includes("notice") || act.label.toLowerCase().includes("update")) {
                        setIsAddNoticeOpen(true);
                      } else {
                        toast.success(`${act.label} Action Executed Successfully`);
                      }
                    }}
                    className="flex items-center gap-2 text-xs text-slate-755 py-2 px-2.5 rounded-[6px] hover:bg-slate-50 cursor-pointer transition-all hover:text-[#FF6B00] font-bold"
                  >
                    <ActIcon className="text-slate-400 w-3.5 h-3.5" />
                    <span>{act.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECENT UPDATES PANEL */}
          <div className="border border-slate-200 rounded-lg p-4 shadow-xxs bg-white">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Trip Updates (Latest)</p>
              <span className="text-[10px] text-[#FF6B00] font-bold cursor-pointer hover:underline" onClick={() => toast.info("Navigating to all updates list")}>View all</span>
            </div>
            <div className="space-y-3">
              {(notices || []).slice(0, 5).map((notice, nIdx) => {
                const isNew = nIdx < 2;
                const dot = isNew ? "bg-[#FF6B00]" : "bg-slate-300";

                return (
                  <div key={notice.id || nIdx} className="flex items-start gap-2.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", dot)}></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <p className="text-[11px] font-bold text-slate-800 leading-snug">{notice.title}</p>
                        {isNew && <span className="text-[8px] bg-rose-50 text-rose-600 px-1 py-0.2 rounded-[4px] font-bold border border-rose-100 flex-shrink-0">NEW</span>}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 font-semibold">{new Date(notice.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                );
              })}
              {(!notices || notices.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-2 italic">No recent updates available</p>
              )}
            </div>
          </div>

          {/* CONVERSATION AI BOX */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-xxs">
            <p className="text-xs font-bold mb-1 text-slate-800">Need help?</p>
            <p className="text-[11px] text-slate-500 font-medium mb-3">Search something or ask Travel AI...</p>
            <button className="w-full bg-[#0F172A] hover:bg-slate-800 text-white text-xs rounded-[6px] py-2 flex items-center justify-center gap-1.5 transition-all font-bold shadow-sm cursor-pointer"
              onClick={() => toast.info("Ask Travel AI instance ready.")}
            >
              <Bot className="w-3.5 h-3.5" /> Ask Travel AI
            </button>
          </div>
        </div>
      </div>

      {/* EDIT SECTION MODAL */}
      {isEditSectionOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xxs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Edit Section - {selectedTabKey}</h3>
              <button 
                onClick={() => setIsEditSectionOpen(false)}
                className="text-slate-400 hover:text-slate-655 transition-colors text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveSection} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  value={sectionTitle}
                  onChange={e => setSectionTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                  placeholder="e.g. Safety protocols & health advice"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={sectionDesc}
                  onChange={e => setSectionDesc(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-700 leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#FF6B00] resize-none"
                  placeholder="Provide deep details, process instructions or reference links..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Count</label>
                <input
                  type="number"
                  min="0"
                  value={sectionItemCount}
                  onChange={e => setSectionItemCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditSectionOpen(false)}
                  className="px-3 h-8 text-xs font-bold border border-slate-200 rounded-[6px] hover:bg-slate-50 text-slate-650 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 h-8 text-xs font-bold bg-[#0F172A] text-white rounded-[6px] hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NOTICE MODAL */}
      {isAddNoticeOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xxs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Add Update / Notice</h3>
              <button 
                onClick={() => setIsAddNoticeOpen(false)}
                className="text-slate-400 hover:text-slate-655 transition-colors text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveNotice} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notice Title</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={e => setNoticeTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                  placeholder="e.g. Flight Cancellation Policy Update"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Details / Body</label>
                <textarea
                  required
                  value={noticeBody}
                  onChange={e => setNoticeBody(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-700 leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#FF6B00] resize-none"
                  placeholder="Describe the update or notice in detail..."
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddNoticeOpen(false)}
                  className="px-3 h-8 text-xs font-bold border border-slate-200 rounded-[6px] hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 h-8 text-xs font-bold bg-[#0F172A] text-white rounded-[6px] hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW ITINERARY VARIANT MODAL */}
      {showAddItinerary && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xxs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">New Itinerary Variant</h3>
              <button onClick={() => setShowAddItinerary(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variant Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Backpacker Variant, Budget, Deluxe"
                  value={newItineraryName}
                  onChange={e => setNewItineraryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button onClick={() => setShowAddItinerary(false)} className="px-3 h-8 text-xs font-bold border border-slate-200 rounded-[6px] hover:bg-slate-50 text-slate-600">Cancel</button>
                <button onClick={handleCreateItinerary} className="px-4.5 h-8 text-xs font-bold bg-[#FF6B00] text-white rounded-[6px] hover:bg-orange-600">Create Variant</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD DAY PLAN MODAL */}
      {showAddDay && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xxs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Add Day Plan</h3>
              <button onClick={() => setShowAddDay(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddDay} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Day Number</label>
                  <input type="text" placeholder="e.g. 01, 02" required value={newDayNum} onChange={e => setNewDayNum(e.target.value)} className="w-full bg-slate-50 border border-slate-205 rounded-[6px] px-3 py-1.5 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date / Timing</label>
                  <input type="text" placeholder="e.g. 05 Jul Sat" required value={newDayDate} onChange={e => setNewDayDate(e.target.value)} className="w-full bg-slate-50 border border-slate-205 rounded-[6px] px-3 py-1.5 text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Plan / Description</label>
                <textarea placeholder="Activities and plans..." required value={newDayPlan} onChange={e => setNewDayPlan(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-205 rounded-[6px] px-3 py-1.5 text-xs resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Stay Place</label>
                  <input type="text" placeholder="Hotel Regency, etc." value={newDayStay} onChange={e => setNewDayStay(e.target.value)} className="w-full bg-slate-50 border border-slate-205 rounded-[6px] px-3 py-1.5 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Meals</label>
                  <input type="text" placeholder="B, L, D" value={newDayMeals} onChange={e => setNewDayMeals(e.target.value)} className="w-full bg-slate-50 border border-slate-205 rounded-[6px] px-3 py-1.5 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Transport Mode</label>
                  <input type="text" placeholder="Tempo Traveller" value={newDayTrans} onChange={e => setNewDayTrans(e.target.value)} className="w-full bg-slate-50 border border-slate-205 rounded-[6px] px-3 py-1.5 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Distance / Duration</label>
                  <input type="text" placeholder="50 km / 2 hrs" value={newDayDist} onChange={e => setNewDayDist(e.target.value)} className="w-full bg-slate-50 border border-slate-205 rounded-[6px] px-3 py-1.5 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-3">
                <button type="button" onClick={() => setShowAddDay(false)} className="px-3 h-8 text-xs font-bold border border-slate-200 rounded-[6px]">Cancel</button>
                <button type="submit" className="px-4 bg-[#FF6B00] text-white rounded-[6px] h-8 text-xs font-bold">Add Day</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
