import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ReportsConsole from "@/components/admin/ReportsConsole";
import { useNavigate } from "react-router-dom";
import {
  Compass, Calculator, CalendarCheck, CheckSquare, Sparkles, Plus, RefreshCw,
  TrendingUp, Users, AlertTriangle, Check, X, Copy, Share2, ShieldAlert, CheckCircle2, Trash2, ArrowUpDown, GripVertical,
  ArrowLeft, Phone, Mail, MapPin, Clock, Star, ChevronRight, FileText, Bus, Hotel, MessageSquare, Stethoscope, TicketCheck, Filter, MoreVertical,
  LayoutGrid, Rows3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/services/api";
import { bookingsService } from "@/services/bookings.service";
import { opsService, type OpsDayItinerary, type OpsTripExpense, type OpsAccountingSummary, type OpsSeatConfig, type OpsWorkspaceSummary, type AutoAllocationResult, type OpsTransportFleet, type OpsRoomInventory } from "@/services/ops.service";
import { cn, safeFormatDate, safeFormatDateTime } from "@/lib/utils";

const getTodayString = () => new Date().toISOString().split('T')[0];

export default function OperationsHubPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedDepartureDate, setSelectedDepartureDate] = useState<string>(getTodayString());
  const [availableDepartureDates, setAvailableDepartureDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "hotels_transport" | "allocation" | "checklist" | "sop" | "leader" | "incidents" | "accounting" | "reports">("overview");

  // ─── Upcoming Trips / Departure Detail View ───
  const [opsView, setOpsView] = useState<"trips_list" | "departure_detail">("trips_list");
  const [layoutMode, setLayoutMode] = useState<"stacked" | "side_by_side">("stacked");
  const [quickNotes, setQuickNotes] = useState("High altitude participants: Rajesh Kumar, Priya Sharma. Monitor carefully.");
  const [readinessChecklist, setReadinessChecklist] = useState([
    { id: "hotels", label: "Hotels", done: true },
    { id: "transport", label: "Transport", done: true },
    { id: "guide", label: "Guide", done: true },
    { id: "room_allocation", label: "Room Allocation", done: false },
    { id: "communication", label: "Communication", done: true },
    { id: "documents", label: "Documents", done: false },
    { id: "medical", label: "Medical", done: true },
    { id: "train_tickets", label: "Train Tickets", done: true }
  ]);

  const computedDepartures = useMemo(() => {
    const list: any[] = [];
    trips.forEach(trip => {
      let datesArr: any[] = [];
      if (Array.isArray(trip.availableDates)) {
        datesArr = trip.availableDates;
      } else if (typeof trip.availableDates === 'string') {
        try {
          datesArr = JSON.parse(trip.availableDates);
        } catch (e) {}
      }

      datesArr.forEach(d => {
        if (!d || !d.date) return;
        const depDate = new Date(d.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        depDate.setHours(0,0,0,0);
        
        const diffTime = depDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Parse the duration of the trip to extend visibility for currently active trips
        const durationDays = parseInt(trip.duration) || 8;
        
        // Show future departures and departures currently in progress (within duration)
        if (diffDays < -durationDays) return;

        // DYNAMIC LINKING TO BOOKINGS
        const targetDateStr = d.date; // YYYY-MM-DD
        const depBookings = bookings.filter(b => {
          if (b.tripId !== trip.id || b.status === "cancelled") return false;
          if (!b.departureDate) return false;
          const bDateStr = new Date(b.departureDate).toISOString().split('T')[0];
          return bDateStr === targetDateStr;
        });

        const booked = depBookings.reduce((sum, b) => sum + (b.numberOfTravelers || 1), 0);
        const cap = d.capacity || 30;

        const totalOutstanding = depBookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);
        const balanceFormatted = `₹ ${totalOutstanding.toLocaleString('en-IN')}`;
        const pendingCount = depBookings.filter(b => b.paymentStatus !== "paid" && b.paymentStatus !== "Paid").length;
        const balanceSub = pendingCount > 0 ? `${pendingCount} pending` : "All collected";
        const balanceColor = totalOutstanding > 0 ? "text-[#EF4444]" : "text-emerald-605";

        const isLive = diffDays <= 0;

        let daysLeftStr = "";
        let daysColor = "text-slate-500";
        if (diffDays < 0) {
          daysLeftStr = `Live (Day ${Math.abs(diffDays) + 1})`;
          daysColor = "text-[#F97316] font-bold";
        } else if (diffDays === 0) {
          daysLeftStr = "Starts Today";
          daysColor = "text-[#F97316] font-bold";
        } else if (diffDays === 1) {
          daysLeftStr = "Tomorrow";
          daysColor = "text-red-500 font-bold";
        } else {
          daysLeftStr = `${diffDays} Days`;
          if (diffDays <= 7) daysColor = "text-amber-500 font-semibold";
          else daysColor = "text-emerald-500";
        }

        const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        const formattedDate = depDate.toLocaleDateString('en-IN', dateOptions);
        const weekday = depDate.toLocaleDateString('en-IN', { weekday: 'short' });

        const tripCode = trip.id || "TRIP";
        const cleanCode = tripCode.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
        const mm = String(depDate.getMonth() + 1).padStart(2, '0');
        const dd = String(depDate.getDate()).padStart(2, '0');
        const code = `${cleanCode}-${mm}${dd}`;
        
        const readiness = cap > 0 ? Math.min(100, Math.round((booked / cap) * 100)) : 0;
        let status = "PLANNING";
        let statusColor = "bg-amber-50 text-amber-700 border-amber-100";
        let readinessColor = "#F59E0B";
        let reason = "Planning stages";

        if (readiness >= 90) {
          status = "READY";
          statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
          readinessColor = "#10B981";
          reason = "Ready to depart";
        } else if (diffDays <= 3) {
          status = "IN PROGRESS";
          statusColor = "bg-blue-50 text-blue-750 border-blue-100";
          readinessColor = "#3B82F6";
          reason = "Departure imminent";
        } else if (readiness > 50) {
          reason = "Min group size reached";
        }

        list.push({
          code,
          trip: trip.title,
          date: formattedDate,
          day: weekday,
          daysLeft: daysLeftStr,
          daysColor,
          pax: `${booked} / ${cap}`,
          balance: balanceFormatted,
          balanceSub,
          balanceColor,
          readiness,
          readinessColor,
          reason,
          status,
          statusColor,
          tripId: trip.id,
          departureDateStr: d.date,
          isLive
        });
      });
    });

    return list.sort((a, b) => new Date(a.departureDateStr).getTime() - new Date(b.departureDateStr).getTime());
  }, [trips, bookings]);

  const liveDepartures = useMemo(() => computedDepartures.filter(d => d.isLive), [computedDepartures]);
  const upcomingDepartures = useMemo(() => computedDepartures.filter(d => !d.isLive), [computedDepartures]);

  const renderDeparturesTable = (departuresList: any[], emptyMessage: string) => {
    if (departuresList.length === 0) {
      return (
        <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-8 text-center text-slate-400 font-medium text-xs">
          {emptyMessage}
        </div>
      );
    }

    const isSide = layoutMode === "side_by_side";

    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-3 w-[15%]">Departure</th>
              <th className="px-4 py-3 w-[25%]">Trip</th>
              <th className="px-4 py-3 w-[20%] whitespace-nowrap">Date</th>
              <th className="px-4 py-3 w-[15%] whitespace-nowrap">Days Left</th>
              <th className="px-4 py-3 w-[10%]">Pax</th>
              {!isSide && <th className="px-5 py-3 w-[15%]">Outstanding Balance</th>}
              <th className="px-4 py-3 w-[10%] text-center">Readiness</th>
              {!isSide && <th className="px-5 py-3 w-[18%]">Readiness Reason</th>}
              {!isSide && <th className="px-5 py-3 w-[12%]">Status</th>}
              <th className="px-4 py-3 w-[5%] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departuresList.map((row, idx) => {
              const radius = 12;
              const strokeWidth = 2.5;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (row.readiness / 100) * circumference;

              return (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => {
                  navigate(`/admin/departure-workspace?departureId=${row.tripId}_${row.departureDateStr}&tab=overview`);
                }}>
                  <td className="px-4 py-3">
                    <span className="font-bold text-[#F97316] text-[11px] block whitespace-nowrap">{row.code}</span>
                    <span className="inline-block px-1 py-0.5 rounded-[2px] bg-slate-100 text-slate-500 font-bold text-[8px] mt-0.5 whitespace-nowrap">CONFIRMED</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 text-[11px] block max-w-[130px] sm:max-w-[200px] truncate" title={row.trip}>{row.trip}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <span className="text-[11px]">{row.date}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({row.day})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={cn("font-bold text-[11px]", row.daysColor)}>{row.daysLeft}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-700">{row.pax.split(" / ")[0]}</span>
                    <span className="text-slate-400 text-[10px]">/{row.pax.split(" / ")[1]}</span>
                  </td>
                  {!isSide && (
                    <td className="px-5 py-3.5">
                      <span className={cn("font-bold text-[11px] block", row.balanceColor)}>{row.balance}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{row.balanceSub}</span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center items-center">
                      {row.readiness === 100 ? (
                        <div className="w-[28px] h-[28px] rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-50/50 text-emerald-600 font-bold text-[9px]">
                          ✓
                        </div>
                      ) : (
                        <div className="relative flex items-center justify-center w-8 h-8">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="16" cy="16" r={radius} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="transparent" />
                            <circle cx="16" cy="16" r={radius} stroke={row.readinessColor} strokeWidth={strokeWidth} fill="transparent"
                              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-[8px] font-bold text-slate-700">{row.readiness}%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  {!isSide && (
                    <td className="px-5 py-3.5">
                      <span className="text-slate-600 font-medium text-[11px]">{row.reason}</span>
                    </td>
                  )}
                  {!isSide && (
                    <td className="px-5 py-3.5">
                      <span className={cn("px-2 py-0.5 rounded-[2px] border text-[9px] font-black uppercase tracking-wider", row.statusColor)}>
                        {row.status}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-750">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const [selectedDeparture, setSelectedDeparture] = useState<any>(null);

  const handleOpenDeparture = (dep: any) => {
    setSelectedDeparture(dep);
    setSelectedTripId(dep.id);
    setSelectedDepartureDate(dep.departureDate);
    setOpsView("departure_detail");
    setActiveTab("overview");
  };
  const loadedWorkspaceTabs = useRef(new Set<string>());
  const opsRequestId = useRef(0);
  const departureAbortRef = useRef<AbortController | null>(null);
  const opsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      if (config.url && config.url.includes("/ops/") && opsAbortRef.current) {
        config.signal = opsAbortRef.current.signal;
      }
      return config;
    });
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);

  // Excel Grids Data
  const [itinerary, setItinerary] = useState<OpsDayItinerary[]>([]);
  const [expenses, setExpenses] = useState<OpsTripExpense[]>([]);
  const [fleet, setFleet] = useState<OpsTransportFleet[]>([]);
  const [roomInventory, setRoomInventory] = useState<OpsRoomInventory[]>([]);
  const [confirmedAllocs, setConfirmedAllocs] = useState<{ rooms: any[]; vehicles: any[] } | null>(null);
  const [summary, setSummary] = useState<OpsAccountingSummary | null>(null);
  const [seatConfig, setSeatConfig] = useState<OpsSeatConfig | null>(null);
  const [workspaceSummary, setWorkspaceSummary] = useState<OpsWorkspaceSummary | null>(null);

  // SOP, Checklist, Incident, Leader states
  const [checklist, setChecklist] = useState<any[]>([]);
  const [sops, setSops] = useState<any[]>([]);
  const [leader, setLeader] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);

  // Filter & Toggle action states
  const [sopFilterDestination, setSopFilterDestination] = useState("");
  const [includeArchivedSops, setIncludeArchivedSops] = useState(false);
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState("ALL");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("ALL");

  const [reopenChecklistItemId, setReopenChecklistItemId] = useState<string | null>(null);
  const [reopenChecklistReason, setReopenChecklistReason] = useState("");
  const [reopenIncidentId, setReopenIncidentId] = useState<string | null>(null);
  const [reopenIncidentReason, setReopenIncidentReason] = useState("");
  const [resolveIncidentId, setResolveIncidentId] = useState<string | null>(null);
  const [resolveIncidentNotes, setResolveIncidentNotes] = useState("");

  const [showAddSop, setShowAddSop] = useState(false);
  const [selectedSop, setSelectedSop] = useState<any | null>(null);
  const [sopForm, setSopForm] = useState({ destination: "", title: "", content: "" });
  const [editingSopId, setEditingSopId] = useState<string | null>(null);

  const [showAssignLeader, setShowAssignLeader] = useState(false);
  const [leaderForm, setLeaderForm] = useState({ leaderName: "", leaderPhone: "", leaderType: "INTERNAL", isPrimary: false, notes: "" });

  const [showAddIncident, setShowAddIncident] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: "", severity: "MEDIUM", description: "", incidentType: "OTHER" });

  // Dialogs
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [itinForm, setItinForm] = useState({ dayTitle: "", paxCount: "19", hotelName: "", vehicleType: "", remarks: "", guideDriverDetails: "" });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expForm, setExpForm] = useState({ activity: "", totalAmount: "", amountPaid: "", remarks: "" });
  const [showAddFleet, setShowAddFleet] = useState(false);
  const [fleetForm, setFleetForm] = useState({ vehicleType: "", capacity: "13", driverName: "", driverPhone: "", totalAmount: "", advancePaid: "", notes: "" });
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomRows, setRoomRows] = useState<Array<{
    roomLabel: string;
    roomType: string;
    genderGroup: string;
    capacity: string;
    hotelName: string;
    notes: string;
    quantity: string;
  }>>([{ roomLabel: "", roomType: "TWIN", genderGroup: "BOYS", capacity: "2", hotelName: "", notes: "", quantity: "1" }]);

  // Auto-Allocation Modal
  const [allocModal, setAllocModal] = useState<{ open: boolean; data: AutoAllocationResult | null; confirming: boolean }>({ open: false, data: null, confirming: false });

  // 1. Load trips and bookings
  useEffect(() => {
    bookingsService.getTrips().then(list => {
      setTrips(list);
      if (list.length > 0) setSelectedTripId(list[0].id);
    }).catch(() => toast.error("Failed to load trips"));

    bookingsService.getAll({ limit: 1000 }).then(res => {
      setBookings(res.data || []);
    }).catch(() => {});
  }, []);

  // 2. Fetch available departures for a selected trip
  useEffect(() => {
    if (!selectedTripId) return;

    if (departureAbortRef.current) {
      departureAbortRef.current.abort();
    }
    const controller = new AbortController();
    departureAbortRef.current = controller;

    api.get(`/trips/${selectedTripId}/departures`, { signal: controller.signal })
      .then(res => {
        const dates = res.data?.data || [];
        setAvailableDepartureDates(dates);
        if (dates.length > 0) {
          setSelectedDepartureDate(dates[0]);
        } else {
          setSelectedDepartureDate('');
        }
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          return;
        }
        setAvailableDepartureDates([]);
        setSelectedDepartureDate('');
      });

    return () => {
      controller.abort();
    };
  }, [selectedTripId]);

  // Load only the active tab. Hidden operational modules remain idle.
  const loadTripOps = useCallback(async (
    tripId: string,
    depDate?: string,
    tab = activeTab,
    force = true,
  ) => {
    if (!tripId || !depDate) return;

    if (opsAbortRef.current) {
      opsAbortRef.current.abort();
    }
    opsAbortRef.current = new AbortController();
    const filterKey = tab === "sop" ? `${sopFilterDestination}|${includeArchivedSops}` : "";
    const cacheKey = `${tripId}|${depDate}|${tab}|${filterKey}`;
    if (!force && loadedWorkspaceTabs.current.has(cacheKey)) return;

    const requestId = ++opsRequestId.current;
    setLoading(true);
    try {
      if (tab === "overview") {
        const overview = await opsService.getWorkspaceSummary(tripId, depDate);
        if (requestId !== opsRequestId.current) return;
        setWorkspaceSummary(overview);
        setSeatConfig(overview.seatAvailability);
      } else if (tab === "hotels_transport") {
        const [itineraryResult, fleetResult] = await Promise.allSettled([
          opsService.getDayItinerary(tripId, depDate),
          opsService.getTransportFleet(tripId, depDate),
        ]);
        if (requestId !== opsRequestId.current) return;
        if (itineraryResult.status === "fulfilled") setItinerary(itineraryResult.value);
        if (fleetResult.status === "fulfilled") setFleet(fleetResult.value);
      } else if (tab === "allocation") {
        const [fleetResult, roomsResult, confirmedResult] = await Promise.allSettled([
          opsService.getTransportFleet(tripId, depDate),
          opsService.getRoomInventory(tripId, depDate),
          opsService.getConfirmedAllocations(tripId, depDate)
        ]);
        if (requestId !== opsRequestId.current) return;
        if (fleetResult.status === "fulfilled") setFleet(fleetResult.value);
        if (roomsResult.status === "fulfilled") setRoomInventory(roomsResult.value);
        if (confirmedResult.status === "fulfilled") setConfirmedAllocs(confirmedResult.value);
      } else if (tab === "checklist") {
        setChecklist(await opsService.getChecklist(tripId, depDate));
      } else if (tab === "sop") {
        setSops(await opsService.getSops(sopFilterDestination || undefined, includeArchivedSops));
      } else if (tab === "leader") {
        setLeader(await opsService.getTripLeader(tripId, depDate));
      } else if (tab === "incidents") {
        setIncidents(await opsService.getIncidents(tripId, depDate));
      } else if (tab === "accounting") {
        const [expensesResult, summaryResult] = await Promise.allSettled([
          opsService.getTripExpenses(tripId, depDate),
          opsService.getAccountingSummary(tripId, depDate),
        ]);
        if (requestId !== opsRequestId.current) return;
        if (expensesResult.status === "fulfilled") setExpenses(expensesResult.value);
        if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
      }

      if (requestId === opsRequestId.current) loadedWorkspaceTabs.current.add(cacheKey);
    } catch {
      // Preserve the tab's existing empty-state fallback.
    } finally {
      if (requestId === opsRequestId.current) setLoading(false);
    }
  }, [activeTab, includeArchivedSops, sopFilterDestination]);

  useEffect(() => {
    if (selectedTripId && selectedDepartureDate) {
      loadTripOps(selectedTripId, selectedDepartureDate, activeTab, false);
    }
  }, [selectedTripId, selectedDepartureDate, activeTab, loadTripOps]);

  // Handle Itinerary Checkbox Updates
  const handleItinCheckToggle = async (row: OpsDayItinerary, field: "hotelVerified" | "vehicleVerified" | "guideVerified" | "checkInDone") => {
    try {
      const updated = await opsService.upsertDayItinerary(selectedTripId, { ...row, [field]: !row[field] }, selectedDepartureDate);
      setItinerary(prev => prev.map(item => item.id === updated.id ? updated : item));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSaveItineraryRow = async () => {
    if (!itinForm.dayTitle) { toast.error("Day/Stay title is required"); return; }
    try {
      await opsService.upsertDayItinerary(selectedTripId, {
        dayTitle: itinForm.dayTitle,
        paxCount: parseInt(itinForm.paxCount || "19"),
        hotelName: itinForm.hotelName || undefined,
        vehicleType: itinForm.vehicleType || undefined,
        remarks: itinForm.remarks || undefined,
        guideDriverDetails: itinForm.guideDriverDetails || undefined
      }, selectedDepartureDate);
      toast.success("Itinerary row added");
      setShowAddItinerary(false);
      setItinForm({ dayTitle: "", paxCount: "19", hotelName: "", vehicleType: "", remarks: "", guideDriverDetails: "" });
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch {
      toast.error("Failed to add row");
    }
  };

  const handleSaveExpenseRow = async () => {
    if (!expForm.activity || !expForm.totalAmount) { toast.error("Activity and total amount are required"); return; }
    try {
      await opsService.upsertTripExpense(selectedTripId, {
        activity: expForm.activity,
        totalAmount: parseFloat(expForm.totalAmount),
        amountPaid: parseFloat(expForm.amountPaid || "0"),
        remarks: expForm.remarks || undefined
      }, selectedDepartureDate);
      toast.success("Expense row added");
      setShowAddExpense(false);
      setExpForm({ activity: "", totalAmount: "", amountPaid: "", remarks: "" });
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch {
      toast.error("Failed to add expense row");
    }
  };

  const handleSaveFleetRow = async () => {
    if (!fleetForm.vehicleType || !fleetForm.capacity) { toast.error("Vehicle type and capacity are required"); return; }
    try {
      await opsService.createTransportFleet(selectedTripId, {
        vehicleType: fleetForm.vehicleType,
        capacity: parseInt(fleetForm.capacity),
        driverName: fleetForm.driverName || undefined,
        driverPhone: fleetForm.driverPhone || undefined,
        totalAmount: fleetForm.totalAmount ? parseFloat(fleetForm.totalAmount) : 0,
        advancePaid: fleetForm.advancePaid ? parseFloat(fleetForm.advancePaid) : 0,
        notes: fleetForm.notes || undefined
      }, selectedDepartureDate);
      toast.success("Vehicle / Tempo added to fleet");
      setShowAddFleet(false);
      setFleetForm({ vehicleType: "", capacity: "13", driverName: "", driverPhone: "", totalAmount: "", advancePaid: "", notes: "" });
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch {
      toast.error("Failed to add vehicle to fleet");
    }
  };

  const handleDeleteFleetRow = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this vehicle from the fleet?")) return;
    try {
      await opsService.deleteTransportFleet(id);
      toast.success("Vehicle deleted from fleet");
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch {
      toast.error("Failed to delete vehicle");
    }
  };

  const handleRoomRowValueChange = (index: number, field: string, val: string) => {
    const updated = [...roomRows];
    updated[index] = { ...updated[index], [field]: val };
    setRoomRows(updated);
  };

  const addRoomRow = () => {
    setRoomRows(prev => [...prev, { roomLabel: "", roomType: "TWIN", genderGroup: "BOYS", capacity: "2", hotelName: "", notes: "", quantity: "1" }]);
  };

  const removeRoomRow = (index: number) => {
    setRoomRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveRoomRow = async () => {
    const invalid = roomRows.some(r => !r.roomLabel || !r.capacity);
    if (invalid) { toast.error("Starting Room Label and Capacity are required for all rows"); return; }
    try {
      const payload = roomRows.map(r => ({
        roomLabel: r.roomLabel,
        roomType: r.roomType,
        genderGroup: r.genderGroup,
        capacity: parseInt(r.capacity) || 2,
        hotelName: r.hotelName || undefined,
        notes: r.notes || undefined,
        quantity: parseInt(r.quantity) || 1
      }));
      await opsService.createRoomInventory(selectedTripId, { rooms: payload } as any, selectedDepartureDate);
      toast.success("All room(s) added successfully!");
      setShowAddRoom(false);
      setRoomRows([{ roomLabel: "", roomType: "TWIN", genderGroup: "BOYS", capacity: "2", hotelName: "", notes: "", quantity: "1" }]);
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch {
      toast.error("Failed to add room(s)");
    }
  };

  const handleDeleteRoomRow = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this room from inventory?")) return;
    try {
      await opsService.deleteRoomInventory(id);
      toast.success("Room deleted from inventory");
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch {
      toast.error("Failed to delete room");
    }
  };

  const handleDeleteItineraryRow = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this itinerary verification row?")) return;
    try {
      await opsService.deleteDayItinerary(id);
      toast.success("Itinerary row deleted");
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch {
      toast.error("Failed to delete itinerary row");
    }
  };

  const handleDeleteExpenseRow = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this expense row?")) return;
    try {
      await opsService.deleteTripExpense(id);
      toast.success("Expense row deleted");
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch {
      toast.error("Failed to delete expense row");
    }
  };

  const handleTriggerAutoAllocate = async () => {
    if (!selectedTripId) { toast.error("Please select a trip first"); return; }
    try {
      const res = await opsService.executeAutoAllocation(selectedTripId, selectedDepartureDate);
      setAllocModal({ open: true, data: res, confirming: false });
    } catch {
      toast.error("Failed to run auto allocation draft");
    }
  };

  const handleConfirmAllocation = async () => {
    if (!allocModal.data?.allocationRunId) {
      toast.error("No allocation run ID found");
      return;
    }
    setAllocModal(prev => ({ ...prev, confirming: true }));
    try {
      await opsService.confirmAllocation(
        allocModal.data.allocationRunId,
        allocModal.data.roomAllocations,
        allocModal.data.vehicleAllocations
      );
      toast.success("Allocation locked and confirmed!");
      setAllocModal({ open: false, data: null, confirming: false });
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to confirm allocation");
      setAllocModal(prev => ({ ...prev, confirming: false }));
    }
  };

  // ── WHATSAPP TEXT REBUILD HELPERS ──
  const rebuildTempoText = (vehicleAllocs: AutoAllocationResult['vehicleAllocations']) => {
    let txt = `🚌 *TEMPO & VEHICLE ALLOCATION LIST*\n\n`;
    const fleetMap: Record<string, typeof vehicleAllocs> = {};
    vehicleAllocs.forEach(va => {
      if (!fleetMap[va.fleetId]) fleetMap[va.fleetId] = [];
      fleetMap[va.fleetId].push(va);
    });
    // Use fleet data for richer labels
    const fleetLookup: Record<string, OpsTransportFleet> = {};
    fleet.forEach(f => { if (f.id) fleetLookup[f.id] = f; });
    Object.entries(fleetMap).forEach(([fId, allocs], idx) => {
      const fInfo = fleetLookup[fId];
      if (fInfo) {
        txt += `*${(fInfo.vehicleType || 'VEHICLE').toUpperCase()} ${idx + 1} (${fInfo.capacity} Seater)* — ${allocs.length}/${fInfo.capacity} filled\n`;
      } else {
        txt += `*VEHICLE ${idx + 1}* — ${allocs.length} assigned\n`;
      }
      allocs.forEach((t, i) => {
        const sNum = t.seatNumber || (i + 1);
        txt += `${i + 1}. ${t.travelerName} [Seat #${sNum}]\n`;
      });
      txt += `\n`;
    });
    return txt.trim();
  };

  const rebuildRoomText = (roomAllocs: AutoAllocationResult['roomAllocations']) => {
    let txt = `🏨 *HOTEL ROOM ALLOCATION LIST*\n\n`;
    const roomMap: Record<string, { type: string; gender: string; members: string[] }> = {};
    roomAllocs.forEach(r => {
      if (!roomMap[r.roomNumber]) roomMap[r.roomNumber] = { type: r.roomType, gender: r.genderGroup, members: [] };
      roomMap[r.roomNumber].members.push(r.travelerName);
    });
    Object.entries(roomMap).forEach(([roomNum, details]) => {
      txt += `*${roomNum} (${details.type} - ${details.gender})*\n`;
      details.members.forEach(m => { txt += `• ${m}\n`; });
      txt += `\n`;
    });
    return txt.trim();
  };

  // ── VEHICLE SHUFFLE HANDLER ──
  const handleVehicleChange = (index: number, field: 'fleetId' | 'seatNumber', value: string) => {
    if (!allocModal.data) return;
    const updated = [...allocModal.data.vehicleAllocations];
    if (field === 'seatNumber') {
      updated[index] = { ...updated[index], seatNumber: parseInt(value) || 0 };
    } else {
      updated[index] = { ...updated[index], fleetId: value };
    }
    setAllocModal(prev => ({
      ...prev,
      data: prev.data ? {
        ...prev.data,
        vehicleAllocations: updated,
        whatsappTempoText: rebuildTempoText(updated)
      } : null
    }));
  };

  // ── ROOM SHUFFLE HANDLER ──
  const handleRoomChange = (index: number, field: 'roomNumber' | 'roomType' | 'genderGroup', value: string) => {
    if (!allocModal.data) return;
    const updated = [...allocModal.data.roomAllocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocModal(prev => ({
      ...prev,
      data: prev.data ? {
        ...prev.data,
        roomAllocations: updated,
        whatsappRoomText: rebuildRoomText(updated)
      } : null
    }));
  };

  // ── SOP Library Helpers ──
  const handleSaveSop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sopForm.destination || !sopForm.title || !sopForm.content) {
      toast.error("All fields are required");
      return;
    }
    try {
      if (editingSopId) {
        await opsService.updateSop(editingSopId, sopForm);
        toast.success("Sop updated successfully");
      } else {
        await opsService.createSop(sopForm);
        toast.success("Sop created successfully");
      }
      setShowAddSop(false);
      setEditingSopId(null);
      setSopForm({ destination: "", title: "", content: "" });
      const updatedSops = await opsService.getSops(sopFilterDestination || undefined, includeArchivedSops);
      setSops(updatedSops);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save SOP");
    }
  };

  const handleStartEditSop = (item: any) => {
    setEditingSopId(item.id);
    setSopForm({ destination: item.destination, title: item.title, content: item.content });
    setShowAddSop(true);
  };

  const handleArchiveSop = async (id: string) => {
    try {
      await opsService.archiveSop(id);
      toast.success("Sop archived");
      const updatedSops = await opsService.getSops(sopFilterDestination || undefined, includeArchivedSops);
      setSops(updatedSops);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to archive SOP");
    }
  };

  const handleRestoreSop = async (id: string) => {
    try {
      await opsService.restoreSop(id);
      toast.success("Sop restored");
      const updatedSops = await opsService.getSops(sopFilterDestination || undefined, includeArchivedSops);
      setSops(updatedSops);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to restore SOP");
    }
  };

  // ── Leader Assignment Helpers ──
  const handleSaveLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderForm.leaderName || !leaderForm.leaderPhone) {
      toast.error("Name and Phone are required");
      return;
    }
    try {
      await opsService.assignTripLeader(selectedTripId, leaderForm, selectedDepartureDate);
      setShowAssignLeader(false);
      toast.success("Trip leader assigned successfully");
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to assign leader");
    }
  };

  const handleArchiveLeader = async () => {
    if (!selectedTripId || !selectedDepartureDate) return;
    try {
      await opsService.archiveTripLeader(selectedTripId, selectedDepartureDate);
      toast.success("Leader assignment archived");
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to archive leader");
    }
  };

  // ── Incident Log Helpers ──
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentForm.title || !incidentForm.description) {
      toast.error("Title and Description are required");
      return;
    }
    try {
      await opsService.createIncident(selectedTripId, incidentForm, selectedDepartureDate);
      toast.success("Incident logged successfully");
      const role = (admin?.role || '').toLowerCase();
      if (['operations', 'operations manager'].includes(role) && ['HIGH', 'CRITICAL'].includes(incidentForm.severity)) {
        toast.info("Escalation Trigger: High/Critical operational issue has been auto-escalated to Suresh Chaudhary and Hemal Patel.");
      }
      setShowAddIncident(false);
      setIncidentForm({ title: "", severity: "MEDIUM", description: "", incidentType: "OTHER" });
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to log incident");
    }
  };

  const handleResolveIncident = async () => {
    if (!resolveIncidentId) return;
    try {
      await opsService.resolveIncident(resolveIncidentId, resolveIncidentNotes.trim());
      toast.success("Incident marked resolved");
      setResolveIncidentId(null);
      setResolveIncidentNotes("");
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resolve incident");
    }
  };

  const handleReopenIncident = async () => {
    if (!reopenIncidentId || !reopenIncidentReason.trim()) {
      toast.error("Reopen reason is required");
      return;
    }
    try {
      await opsService.reopenIncident(reopenIncidentId, reopenIncidentReason.trim());
      toast.success("Incident reopened");
      setReopenIncidentId(null);
      setReopenIncidentReason("");
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reopen incident");
    }
  };

  // ── Checklist Helpers ──
  const handleToggleChecklistItem = async (id: string, currentlyCompleted: boolean) => {
    if (currentlyCompleted) {
      setReopenChecklistItemId(id);
      setReopenChecklistReason("");
    } else {
      try {
        await opsService.completeChecklistItem(id);
        toast.success("Task marked completed");
        loadTripOps(selectedTripId, selectedDepartureDate);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to update task");
      }
    }
  };

  const handleConfirmReopenChecklist = async () => {
    if (!reopenChecklistItemId || !reopenChecklistReason.trim()) {
      toast.error("Reason is required to reopen checklist item");
      return;
    }
    try {
      await opsService.reopenChecklistItem(reopenChecklistItemId, reopenChecklistReason.trim());
      toast.success("Task reopened");
      setReopenChecklistItemId(null);
      setReopenChecklistReason("");
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reopen task");
    }
  };

  const handleInitializeChecklist = async () => {
    if (!selectedTripId || !selectedDepartureDate) return;
    try {
      await opsService.initializeChecklist(selectedTripId, selectedDepartureDate);
      toast.success("Milestone checklist initialized!");
      loadTripOps(selectedTripId, selectedDepartureDate);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to initialize checklist");
    }
  };

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  return (
    <div className="space-y-6 pb-20 p-6 bg-[#F4F7FB] min-h-screen -mx-6 -mt-6">

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* UPCOMING TRIPS LIST VIEW                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {opsView === "trips_list" && (
        <div className="space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Departures Hub
              </h1>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                Track upcoming departures, readiness status and key operations at a glance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Refreshing...")}
                className="h-8.5 text-xs font-semibold rounded-[4px] border-slate-200 bg-white text-slate-650 flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-once" /> Refresh
              </Button>
              <Button
                onClick={() => navigate("/admin/bookings")}
                className="h-8.5 text-xs font-semibold rounded-[4px] bg-[#F97316] text-white hover:bg-[#F97316]/90 px-4 shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> New Booking
              </Button>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-[4px]">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">UPCOMING DEPARTURES</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{computedDepartures.length}</p>
                <p className="text-[10px] text-slate-500">Next 30 days</p>
              </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-[4px]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">READY</p>
                <p className="text-2xl font-black text-emerald-650 mt-0.5">{computedDepartures.filter(d => d.status === "READY").length}</p>
                <p className="text-[10px] text-slate-500">Ready to depart (95-100%)</p>
              </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-[4px]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">NEEDS ATTENTION</p>
                <p className="text-2xl font-black text-amber-650 mt-0.5">{computedDepartures.filter(d => d.readiness >= 50 && d.readiness < 90).length}</p>
                <p className="text-[10px] text-slate-500">Departures (70-94%)</p>
              </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-[4px]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">CRITICAL</p>
                <p className="text-2xl font-black text-rose-650 mt-0.5">{computedDepartures.filter(d => d.readiness < 50).length}</p>
                <p className="text-[10px] text-slate-500">Departures (&lt;70%)</p>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 bg-white border border-[#E2E8F0] p-4 rounded-[4px] shadow-sm mt-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Date Range</span>
              <Select defaultValue="july2027">
                <SelectTrigger className="w-[180px] h-8.5 rounded-[4px] border-slate-200 text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="july2027">01 Jul 2027 - 31 Jul 2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px] h-8.5 rounded-[4px] border-slate-200 text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">All Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Trip</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px] h-8.5 rounded-[4px] border-slate-200 text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="Trip" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">All Trips</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Guide</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px] h-8.5 rounded-[4px] border-slate-200 text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="Guide" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">All Guides</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto mt-auto flex items-center gap-2">
              <div className="flex items-center border border-[#E2E8F0] rounded-[4px] p-0.5 bg-white shadow-xs h-8.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLayoutMode("stacked")} 
                  className={cn("h-7.5 rounded-[3px] text-[10px] font-bold px-2.5 flex items-center gap-1", layoutMode === "stacked" ? "bg-slate-100 text-slate-850" : "text-slate-450 hover:text-slate-700")}
                >
                  <Rows3 className="w-3 h-3" /> Stacked
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLayoutMode("side_by_side")} 
                  className={cn("h-7.5 rounded-[3px] text-[10px] font-bold px-2.5 flex items-center gap-1", layoutMode === "side_by_side" ? "bg-slate-100 text-slate-850" : "text-slate-450 hover:text-slate-700")}
                >
                  <LayoutGrid className="w-3 h-3" /> Side-by-Side
                </Button>
              </div>
              <Button variant="outline" className="h-8.5 rounded-[4px] border-slate-200 font-bold text-xs flex items-center gap-1.5 text-slate-700 bg-white shadow-xs">
                <Filter className="w-3.5 h-3.5 text-slate-450" /> Filters
              </Button>
            </div>
          </div>

          {/* Departures List Container (Stacked vs Side-by-Side) */}
          <div className={cn(
            layoutMode === "side_by_side" 
              ? "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" 
              : "space-y-6 mt-6"
          )}>
            {/* Live Departures Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#E65100] tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF5400] animate-pulse" />
                Live Trips <span className="text-slate-400 font-semibold text-xs">({liveDepartures.length})</span>
              </h3>
              {renderDeparturesTable(liveDepartures, "No live trips currently running.")}
            </div>

            {/* Upcoming Departures Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1">
                Upcoming Trips <span className="text-slate-400 font-semibold text-xs">({upcomingDepartures.length})</span>
              </h3>
              {renderDeparturesTable(upcomingDepartures, "No upcoming trips scheduled.")}
            </div>
          </div>
            
          <div className="flex items-center gap-2 text-[#E65100] text-xs font-semibold bg-[#FFF8E6] border border-[#FFE0B2] p-4 rounded-md shadow-xs mt-6">
            <CalendarCheck className="w-4 h-4 text-[#FF5400] flex-shrink-0" />
            <span>Click on Readiness % or View to see detailed checklist, payments, documents and more for each departure.</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DEPARTURE DETAIL VIEW                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {opsView === "departure_detail" && selectedDeparture && (
        <div className="space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#F97316]" /> Trip Operations <span className="text-slate-400 font-medium text-sm">/ {selectedDeparture.tripName} ({selectedDeparture.code})</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                Manage upcoming departures, track readiness, and coordinate operations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setOpsView("trips_list"); setSelectedDeparture(null); }}
                className="h-8.5 text-xs font-semibold rounded-[4px] border-slate-200 bg-white text-slate-650 flex items-center gap-1.5 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Departures
              </Button>
            </div>
          </div>

          {/* ── Top Metadata Bar ── */}
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] flex flex-col md:flex-row md:items-center justify-between shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center flex-1 divide-x divide-slate-200">
              <div className="px-4 py-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Departure</span>
                <span className="font-mono font-bold text-slate-800 text-xs">{selectedDeparture.code}</span>
              </div>
              <div className="px-4 py-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Trip</span>
                <span className="font-bold text-slate-800 text-xs">{selectedDeparture.tripName}</span>
              </div>
              <div className="px-4 py-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date</span>
                <span className="font-semibold text-slate-700 text-xs">
                  {new Date(selectedDeparture.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="px-4 py-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Guide</span>
                <span className="font-semibold text-slate-700 text-xs">{selectedDeparture.guide.name}</span>
              </div>
              <div className="px-4 py-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Operations</span>
                <span className="font-semibold text-slate-700 text-xs">{selectedDeparture.opsExec.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 md:bg-transparent border-t md:border-t-0 border-slate-100">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#F97316] mr-2">
                <span className="w-2 h-2 bg-[#F97316] rounded-full animate-pulse" />
                {selectedDeparture.status}
              </span>
              <button className="text-[11px] font-semibold text-slate-650 hover:text-slate-800 px-3 py-1.5 bg-white border border-slate-200 rounded-[4px] transition-colors shadow-xs"
                onClick={() => toast.info("Assign Guide feature coming soon")}
              >
                Assign Guide
              </button>
              <button className="text-[11px] font-semibold text-slate-650 hover:text-slate-800 px-3 py-1.5 bg-white border border-slate-200 rounded-[4px] transition-colors shadow-xs"
                onClick={() => toast.info("Send Update feature coming soon")}
              >
                Send Update
              </button>
              <button className="text-[11px] font-semibold text-slate-650 hover:text-slate-800 px-3 py-1.5 bg-white border border-slate-200 rounded-[4px] transition-colors shadow-xs"
                onClick={() => toast.info("PDF generation coming soon")}
              >
                Generate PDF
              </button>
            </div>
          </div>

          {/* ── KPI Row ── */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200 rounded p-3 shadow-sm text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Readiness</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{selectedDeparture.readiness}%</p>
            </div>
            <div className="bg-white border border-slate-200 rounded p-3 shadow-sm text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Participants</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{selectedDeparture.participants}</p>
            </div>
            <div className="bg-white border border-amber-200 rounded p-3 shadow-sm text-center">
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Tasks Pending</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{selectedDeparture.tasksPending}</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded p-3 shadow-sm text-center">
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Hotels Confirmed</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{selectedDeparture.hotelsConfirmed}</p>
            </div>
            <div className="bg-white border border-blue-200 rounded p-3 shadow-sm text-center">
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Transport</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{selectedDeparture.transportReady}</p>
            </div>
            <div className="bg-white border border-rose-200 rounded p-3 shadow-sm text-center">
              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Critical Alerts</p>
              <p className="text-xl font-bold text-rose-600 mt-1">{selectedDeparture.criticalAlerts}</p>
            </div>
          </div>

          {/* ── Sub-tabs ── */}
          <div className="flex border-b border-[#E2E8F0] overflow-x-auto gap-2 no-scrollbar bg-white -mx-6 px-6 -mt-4 mb-6 shadow-2xs">
            {[
              { id: "overview", label: "Overview" },
              { id: "hotels_transport", label: "Hotels & Transport Verification" },
              { id: "allocation", label: "Room & Tempo Allocation" },
              { id: "checklist", label: "Departure Checklist" },
              { id: "sop", label: "Communication" },
              { id: "leader", label: "Tasks" },
              { id: "incidents", label: "Incidents" },
              { id: "accounting", label: "More" },
              { id: "reports", label: "Reports" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={cn(
                  "py-3.5 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap",
                  activeTab === t.id
                    ? "border-[#F97316] text-[#F97316]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab: Departure Summary + Readiness + Sidebar ── */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Departure Summary */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-5">Departure Summary</h3>
                  <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Trip Name</p>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{selectedDeparture.tripName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Departure Date</p>
                      <p className="text-xs font-bold text-[#FF6B00] mt-1">
                        {new Date(selectedDeparture.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Return Date</p>
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        {new Date(selectedDeparture.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                      <p className="text-xs font-bold text-[#FF6B00] mt-1">{selectedDeparture.duration}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Participants</p>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{selectedDeparture.participants}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Guide Assigned</p>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{selectedDeparture.guide.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Operations Executive</p>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{selectedDeparture.opsExec.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lead Driver</p>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{selectedDeparture.leadDriver.name}</p>
                    </div>
                  </div>
                </div>

                {/* Departure Readiness */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-5">Departure Readiness</h3>
                  {/* Overall Progress */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-700">Overall Progress</p>
                    <p className={`text-xs font-bold ${selectedDeparture.readiness >= 90 ? 'text-emerald-600' : selectedDeparture.readiness >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {selectedDeparture.readiness}%
                    </p>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${selectedDeparture.readiness >= 90 ? 'bg-[#FF6B00]' : selectedDeparture.readiness >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${selectedDeparture.readiness}%` }}
                    />
                  </div>

                  {/* Checklist Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {readinessChecklist.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setReadinessChecklist(prev =>
                            prev.map(c => c.id === item.id ? { ...c, done: !c.done } : c)
                          );
                          toast.success(`${item.label} ${!item.done ? 'completed' : 'reopened'}`);
                        }}
                        className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors text-left group"
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                          {item.done ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`text-xs font-semibold ${item.done ? 'text-slate-700' : 'text-slate-800'}`}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Critical Alerts */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Critical Alerts</h3>
                  {selectedDeparture.criticalAlerts === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
                      <p className="text-xs font-bold text-emerald-700">All clear - No critical alerts</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-rose-800">Room allocation pending for 4 participants</p>
                          <p className="text-[10px] text-rose-600 mt-0.5">Complete room allocation before departure date</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-800">Documents pending from 3 participants</p>
                          <p className="text-[10px] text-amber-600 mt-0.5">ID proof and medical certificates required</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-4">
                {/* Guide Details */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-3">Guide Details</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Name</p>
                      <p className="text-xs font-bold text-[#FF6B00] mt-0.5">{selectedDeparture.guide.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Phone</p>
                      <p className="text-xs font-bold text-[#FF6B00] mt-0.5">{selectedDeparture.guide.phone}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Experience</p>
                      <p className="text-xs font-bold text-[#FF6B00] mt-0.5">{selectedDeparture.guide.experience}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Rating</p>
                      <p className="text-xs font-bold text-[#FF6B00] mt-0.5">{selectedDeparture.guide.rating}</p>
                    </div>
                  </div>
                </div>

                {/* Operations Executive */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-3">Operations Executive</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Name</p>
                      <p className="text-xs font-bold text-[#FF6B00] mt-0.5">{selectedDeparture.opsExec.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Phone</p>
                      <p className="text-xs font-bold text-[#FF6B00] mt-0.5">{selectedDeparture.opsExec.phone}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Email</p>
                      <p className="text-xs font-bold text-[#FF6B00] mt-0.5">{selectedDeparture.opsExec.email}</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-3">Emergency Contacts</h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Guide</span>
                      <span className="font-bold text-[#FF6B00]">{selectedDeparture.guide.phone}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Operations</span>
                      <span className="font-bold text-[#FF6B00]">{selectedDeparture.opsExec.phone}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Lead Driver</span>
                      <span className="font-bold text-[#FF6B00]">{selectedDeparture.leadDriver.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Notes */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-3">Quick Notes</h4>
                  <textarea
                    value={quickNotes}
                    onChange={e => setQuickNotes(e.target.value)}
                    className="w-full h-20 text-xs text-slate-700 bg-amber-50/50 border border-slate-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-1 focus:ring-[#FF6B00] leading-relaxed"
                  />
                </div>

                {/* Trip Statistics */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-3">Trip Statistics</h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Participants</span>
                      <span className="font-bold text-[#FF6B00]">{selectedDeparture.participants}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Hotels</span>
                      <span className="font-bold text-[#FF6B00]">{selectedDeparture.hotelsConfirmed}/{selectedDeparture.hotelsTotal}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Transport</span>
                      <span className="font-bold text-[#FF6B00]">{selectedDeparture.transportReady}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Alerts</span>
                      <span className={`font-bold ${selectedDeparture.criticalAlerts > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {selectedDeparture.criticalAlerts}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Non-overview tabs: show existing workspace content ── */}
          {activeTab !== "overview" && (
            <div className="space-y-6">

      {/* Seat Occupancy Warning Banner */}
      {seatConfig && seatConfig.seatsSold >= seatConfig.alertThreshold && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">Seat Capacity Threshold Exceeded!</p>
              <p className="text-[11px] text-amber-700">
                {seatConfig.seatsSold} seats sold out of {seatConfig.totalSeatsCap} cap. Please verify accommodation and hotel room bookings immediately.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg text-[10px] font-black uppercase">
              {seatConfig.seatsAvailable} Seats Left
            </span>
          </div>
        </div>
      )}

      {/* Existing workspace tabs content (accessible via departure detail sub-tabs) */}
      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {seatConfig && seatConfig.seatsSold >= seatConfig.alertThreshold && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900">Seat Capacity Warning!</p>
                  <p className="text-[11px] text-amber-700">
                    {seatConfig.seatsSold} seats sold out of {seatConfig.totalSeatsCap} capacity. Please reconfirm room allotments.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg text-[10px] font-black uppercase">
                  {seatConfig.seatsAvailable} Seats Left
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Departure Checklist Summary</h3>
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div>
                    <p className="text-2xl font-black text-slate-800">
                      {workspaceSummary?.checklistCompletion.completed || 0} / {workspaceSummary?.checklistCompletion.total || 0} Completed
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">Standard checklist tasks completed.</p>
                  </div>
                  {(workspaceSummary?.checklistCompletion.total || 0) === 0 ? (
                    <Button size="sm" onClick={handleInitializeChecklist} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-8">
                      Initialize checklist
                    </Button>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase">
                      Initialized
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Active Incident Status</h3>
                {(workspaceSummary?.openIncidentCount || 0) === 0 ? (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-4 text-xs font-bold text-center">
                    ✓ All clear. No open incidents reported on this departure date.
                  </div>
                ) : (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-900">
                    {workspaceSummary?.openIncidentCount || 0} open incident{workspaceSummary?.openIncidentCount === 1 ? "" : "s"}. Open the Incidents tab for details.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Departure Leader</h3>
              {(workspaceSummary?.leaders.length || 0) > 0 ? (
                <div className="space-y-3">
                  {workspaceSummary?.leaders.map((ld: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        Leader Name {ld.isPrimary && <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-black ml-1.5">Primary</span>}
                      </p>
                      <p className="text-xs font-black text-slate-800 mt-1">{ld.leaderName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-3">Phone Details</p>
                      <p className="text-xs font-black text-slate-800 mt-1 flex items-center gap-2">
                        {ld.leaderPhone}
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700" onClick={() => { navigator.clipboard.writeText(ld.leaderPhone); toast.success("Copied!"); }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 font-medium">
                  No Leader assigned yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. HOTELS & TRANSPORT TAB */}
      {activeTab === "hotels_transport" && (
        <div className="space-y-6">
          {/* Grid 1: tripItineraryStay */}
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xs font-black text-slate-750 uppercase tracking-wider">{selectedTrip?.title || "ITINERARY & HOTEL VERIFICATION"}</h2>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider">Isolated verification checklist per day.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddItinerary(true)} className="h-8 text-xs font-semibold text-[#F97316] border-[#F97316]/30 hover:bg-[#F97316]/5 bg-white rounded-[4px]">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Day Row
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase border-b border-[#E2E8F0]">
                    <th className="p-3 text-left border-r border-slate-100">Date</th>
                    <th className="p-3 text-left border-r border-slate-100">Stay Location</th>
                    <th className="p-3 text-center border-r border-slate-100">Pax</th>
                    <th className="p-3 text-left border-r bg-amber-50/30 text-amber-900 border-amber-100/50">Hotel Name</th>
                    <th className="p-3 text-center border-r bg-amber-50/30 text-amber-900 border-amber-100/50">Hotel status</th>
                    <th className="p-3 text-left border-r bg-blue-50/30 text-blue-900 border-blue-100/50">Tempo / Vehicle</th>
                    <th className="p-3 text-center border-r bg-blue-50/30 text-blue-900 border-blue-100/50">Tempo Status</th>
                    <th className="p-3 text-left border-r border-slate-100">Remarks</th>
                    <th className="p-3 text-left border-r border-slate-100">Guide/Driver Details</th>
                    <th className="p-3 text-center border-r border-slate-100">Check-In</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {itinerary.length === 0 ? (
                    <tr><td colSpan={11} className="p-8 text-center text-slate-400 font-medium">No day itinerary rows. Click "Add Day Row".</td></tr>
                  ) : (
                    itinerary.map(row => (
                      <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                        <td className="p-3 border-r border-slate-100 font-mono text-slate-500">{row.date ? new Date(row.date).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="p-3 border-r border-slate-100 font-bold text-slate-700">{row.dayTitle}</td>
                        <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-650">{row.paxCount}</td>
                        <td className="p-3 border-r bg-amber-50/10 text-slate-700 font-semibold">{row.hotelName || "—"}</td>
                        <td className="p-3 border-r border-slate-100 text-center">
                          <button onClick={() => handleItinCheckToggle(row, "hotelVerified")} className={cn("px-2 py-0.5 rounded-[2px] text-[9px] font-black uppercase tracking-wider border", row.hotelVerified ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-250")}>
                            {row.hotelVerified ? "VERIFIED" : "PENDING"}
                          </button>
                        </td>
                        <td className="p-3 border-r bg-blue-50/10 text-slate-700 font-semibold">{row.vehicleType || "—"}</td>
                        <td className="p-3 border-r border-slate-100 text-center">
                          <button onClick={() => handleItinCheckToggle(row, "vehicleVerified")} className={cn("px-2 py-0.5 rounded-[2px] text-[9px] font-black uppercase tracking-wider border", row.vehicleVerified ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-250")}>
                            {row.vehicleVerified ? "VERIFIED" : "PENDING"}
                          </button>
                        </td>
                        <td className="p-3 border-r border-slate-100 text-slate-500 font-medium">{row.remarks || "—"}</td>
                        <td className="p-3 border-r border-slate-100 text-slate-700 font-medium">{row.guideDriverDetails || "—"}</td>
                        <td className="p-3 border-r border-slate-100 text-center">
                          <input type="checkbox" checked={row.checkInDone} onChange={() => handleItinCheckToggle(row, "checkInDone")} className="w-4 h-4 rounded border-slate-300 accent-emerald-600" />
                        </td>
                        <td className="p-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteItineraryRow(row.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grid 3: Transport fleet */}
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xs font-black text-slate-750 uppercase tracking-wider">🚌 DEPARTURE TRANSPORT FLEET</h2>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider">Tempos and vehicle configs assigned.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddFleet(true)} className="h-8 text-xs font-semibold text-[#F97316] border-[#F97316]/30 hover:bg-[#F97316]/5 bg-white rounded-[4px]">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Vehicle
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase border-b border-[#E2E8F0]">
                    <th className="p-3 text-left border-r border-slate-100">Vehicle Type</th>
                    <th className="p-3 text-center border-r border-slate-100">Seat Capacity</th>
                    <th className="p-3 text-left border-r border-slate-100">Driver Contact</th>
                    <th className="p-3 text-right border-r border-slate-100">Total Cost</th>
                    <th className="p-3 text-right border-r border-slate-100">Advance Paid</th>
                    <th className="p-3 text-left border-r border-slate-100">Notes / Pickup</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fleet.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-medium">No vehicles added yet.</td></tr>
                  ) : (
                    fleet.map(row => (
                      <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                        <td className="p-3 border-r border-slate-100 font-bold text-slate-700">{row.vehicleType}</td>
                        <td className="p-3 border-r border-slate-100 text-center font-mono font-bold text-slate-650">{row.capacity} Seats</td>
                        <td className="p-3 border-r border-slate-100 text-slate-700 font-semibold">{row.driverName ? `${row.driverName} (${row.driverPhone})` : "—"}</td>
                        <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-800">₹{(row.totalAmount || 0).toLocaleString("en-IN")}</td>
                        <td className="p-3 border-r border-slate-100 text-right text-emerald-700 font-black">₹{(row.advancePaid || 0).toLocaleString("en-IN")}</td>
                        <td className="p-3 border-r border-slate-100 text-slate-500 font-medium">{row.notes || "—"}</td>
                        <td className="p-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteFleetRow(row.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. ROOM & TEMPO ALLOCATION TAB */}
      {activeTab === "allocation" && (
        <div className="space-y-6">
          {/* Confirmed Allotment Display */}
          {confirmedAllocs && (confirmedAllocs.rooms.length > 0 || confirmedAllocs.vehicles.length > 0) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" /> Locked & Confirmed Allotment Run
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Currently active assignments for this departure date.</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-[10px] font-bold h-7 uppercase text-emerald-600 hover:bg-emerald-50"
                    onClick={() => {
                      const txt = rebuildRoomText(confirmedAllocs.rooms);
                      navigator.clipboard.writeText(txt);
                      toast.success("Room list copied!");
                    }}>
                    <Copy className="w-3 h-3 mr-1" /> Copy Room List
                  </Button>
                  <Button size="sm" variant="outline" className="text-[10px] font-bold h-7 uppercase text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      const txt = rebuildTempoText(confirmedAllocs.vehicles);
                      navigator.clipboard.writeText(txt);
                      toast.success("Vehicle list copied!");
                    }}>
                    <Copy className="w-3 h-3 mr-1" /> Copy Vehicle List
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rooms List */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    🏨 Hotel Room Assignments
                  </h4>
                  {confirmedAllocs.rooms.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium">No room assignments confirmed.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                      {Object.entries(
                        confirmedAllocs.rooms.reduce((acc: Record<string, any>, r) => {
                          if (!acc[r.roomNumber]) acc[r.roomNumber] = { type: r.roomType, gender: r.genderGroup, members: [] };
                          acc[r.roomNumber].members.push(r.travelerName);
                          return acc;
                        }, {})
                      ).map(([roomNum, rData]: any) => (
                        <div key={roomNum} className="border border-slate-100 rounded-lg p-2.5 bg-slate-50 hover:border-emerald-200 transition-colors">
                          <p className="text-[10px] font-bold text-slate-800 flex items-center justify-between">
                            <span>Room {roomNum}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                              rData.gender === 'BOYS' ? 'bg-blue-100 text-blue-800' :
                              rData.gender === 'GIRLS' ? 'bg-pink-100 text-pink-800' :
                              rData.gender === 'COUPLE' ? 'bg-purple-100 text-purple-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>{rData.type} - {rData.gender}</span>
                          </p>
                          <ul className="mt-1.5 space-y-1">
                            {rData.members.map((m: string, i: number) => (
                              <li key={i} className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
                                <span className="h-1 w-1 bg-emerald-500 rounded-full shrink-0" />
                                {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vehicles List */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    🚌 Transport Assignments
                  </h4>
                  {confirmedAllocs.vehicles.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium">No vehicle assignments confirmed.</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {Object.entries(
                        confirmedAllocs.vehicles.reduce((acc: Record<string, any>, v) => {
                          if (!acc[v.fleetId]) acc[v.fleetId] = [];
                          acc[v.fleetId].push(v);
                          return acc;
                        }, {})
                      ).map(([fleetId, travelers]: any) => {
                        const fleetItem = fleet.find(f => f.id === fleetId);
                        return (
                          <div key={fleetId} className="border border-slate-100 rounded-lg p-2.5 bg-slate-50 hover:border-blue-200 transition-colors">
                            <p className="text-[10px] font-bold text-slate-800 flex items-center justify-between">
                              <span>{fleetItem?.vehicleType || "Vehicle"}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase font-mono">{travelers.length} / {fleetItem?.capacity || 17} Filled</span>
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                              {travelers.map((t: any, i: number) => (
                                <p key={i} className="text-[10px] font-medium text-slate-600 truncate flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold font-mono text-blue-500 bg-blue-50 px-1 py-0.2 rounded shrink-0">#{t.seatNumber || i + 1}</span>
                                  {t.travelerName}
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-5 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-750 uppercase tracking-wider">Auto-Allocation Engine Proposals</h3>
              <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider">Generate seat shuffle and room groups matching traveler genders.</p>
            </div>
            <Button size="sm" onClick={handleTriggerAutoAllocate} className="h-9 text-xs font-semibold bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-[4px] shadow-sm">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Run Auto-Allocation
            </Button>
          </div>

          {/* Grid 4: Hotel room inventory */}
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xs font-black text-slate-755 uppercase tracking-wider">🏨 HOTEL ROOM ALLOCATION INVENTORY</h2>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider">Add room blocks for auto segregation rules.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddRoom(true)} className="h-8 text-xs font-semibold text-[#F97316] border-[#F97316]/30 hover:bg-[#F97316]/5 bg-white rounded-[4px]">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Multiple Rooms
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase border-b border-[#E2E8F0]">
                    <th className="p-3 text-left border-r border-slate-100">Room Label</th>
                    <th className="p-3 text-center border-r border-slate-100">Capacity</th>
                    <th className="p-3 text-center border-r border-slate-100">Room Type</th>
                    <th className="p-3 text-center border-r border-slate-100">Gender Allocation</th>
                    <th className="p-3 text-left border-r border-slate-100">Hotel Name</th>
                    <th className="p-3 text-left border-r border-slate-100">Notes / Remarks</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roomInventory.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-medium">No rooms configured. Click "Add Multiple Rooms".</td></tr>
                  ) : (
                    roomInventory.map(row => (
                      <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                        <td className="p-3 border-r border-slate-100 font-bold text-slate-700">{row.roomLabel}</td>
                        <td className="p-3 border-r border-slate-100 text-center font-mono font-bold bg-emerald-50/10 text-slate-655">{row.capacity} Beds</td>
                        <td className="p-3 border-r border-slate-100 text-center font-semibold text-slate-700">{row.roomType}</td>
                        <td className="p-3 border-r border-slate-100 text-center">
                          <span className={`px-2 py-0.5 rounded-[2px] border text-[9px] font-black uppercase ${
                            row.genderGroup === 'BOYS' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                            row.genderGroup === 'GIRLS' ? 'bg-pink-50 text-pink-800 border-pink-100' :
                            row.genderGroup === 'COUPLE' ? 'bg-purple-50 text-purple-800 border-purple-100' :
                            'bg-amber-50 text-amber-800 border-amber-100'
                          }`}>
                            {row.genderGroup}
                          </span>
                        </td>
                        <td className="p-3 border-r border-slate-100 text-slate-700">{row.hotelName || "—"}</td>
                        <td className="p-3 border-r border-slate-100 text-slate-500 font-medium">{row.notes || "—"}</td>
                        <td className="p-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteRoomRow(row.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TRIP CHECKLIST TAB */}
      {activeTab === "checklist" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Milestone Checklist Logs</h3>
              <p className="text-[10px] text-slate-400 font-medium">Verify standard operating tasks before departure.</p>
            </div>
            <Button size="sm" onClick={handleInitializeChecklist} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9">
              Initialize Checklist
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 space-y-6">
              {['PRE_TRIP_30D', 'PRE_TRIP_7D', 'PRE_TRIP_1D', 'DEPARTURE_DAY', 'DURING_TRIP', 'POST_TRIP'].map(stage => {
                const items = checklist.filter(c => c.stage === stage);
                const stageLabels: Record<string, string> = {
                  PRE_TRIP_30D: "Pre-trip (30 days before)",
                  PRE_TRIP_7D: "Pre-trip (7 days before)",
                  PRE_TRIP_1D: "Pre-trip (1 day before)",
                  DEPARTURE_DAY: "Day of departure",
                  DURING_TRIP: "During trip logs",
                  POST_TRIP: "Post-trip review"
                };
                return (
                  <div key={stage} className="space-y-2 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <p className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">{stageLabels[stage]}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                      {items.map(item => (
                        <div key={item.id} className="flex flex-col gap-1 p-3 rounded-lg hover:bg-slate-50 border border-slate-200/50 bg-white">
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={() => handleToggleChecklistItem(item.id, item.isCompleted)}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                            />
                            <div className="flex-1">
                              <p className={`text-xs font-bold text-slate-800 ${item.isCompleted ? "line-through text-slate-400" : ""}`}>{item.taskName}</p>
                              {item.isCompleted && item.completedBy && (
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  Done {new Date(item.completedAt!).toLocaleDateString("en-IN")} by {item.completedBy.name}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-[10px] text-amber-700 italic mt-1 bg-amber-50 p-1.5 rounded border border-amber-100">
                                  Remark: {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          {item.activities && item.activities.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Activity Log:</p>
                              {item.activities.slice(0, 3).map((act: any) => (
                                <p key={act.id} className="text-[9px] text-slate-500 font-mono leading-tight">
                                  {act.action} by {act.actor?.name || "agent"} at {new Date(act.createdAt).toLocaleString("en-IN")}
                                  {act.notes && ` (Reason: ${act.notes})`}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. SOP LIBRARY TAB */}
      {activeTab === "sop" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Destination SOP Library</h3>
              <p className="text-[10px] text-slate-400 font-medium">Standard instruction libraries for Kedarnath, Spiti, etc.</p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Filter destination..."
                value={sopFilterDestination}
                onChange={e => setSopFilterDestination(e.target.value)}
                className="w-48 h-9 text-xs rounded-lg"
              />
              <button
                onClick={() => setIncludeArchivedSops(!includeArchivedSops)}
                className={`px-3 h-9 text-xs font-bold rounded-lg border transition-all ${
                  includeArchivedSops ? "bg-amber-100 border-amber-200 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                Include Archived
              </button>
              <Button size="sm" onClick={() => { setEditingSopId(null); setSopForm({ destination: "", title: "", content: "" }); setShowAddSop(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9">
                + Create SOP
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                      <th className="p-3 text-left">Destination</th>
                      <th className="p-3 text-left">Sop Title</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sops.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium">No SOP items found.</td></tr>
                    ) : (
                      sops.map(item => (
                        <tr key={item.id} className={`border-b border-slate-200 hover:bg-slate-50 cursor-pointer ${selectedSop?.id === item.id ? "bg-indigo-50/30" : ""}`} onClick={() => setSelectedSop(item)}>
                          <td className="p-3 font-bold text-slate-900">{item.destination}</td>
                          <td className="p-3 font-semibold">{item.title}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                              {item.isActive ? "ACTIVE" : "ARCHIVED"}
                            </span>
                          </td>
                          <td className="p-3 text-center flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="ghost" onClick={() => handleStartEditSop(item)} className="h-7 text-indigo-600 font-bold hover:bg-indigo-50">Edit</Button>
                            {item.isActive ? (
                              <Button size="sm" variant="ghost" onClick={() => handleArchiveSop(item.id)} className="h-7 text-amber-600 font-bold hover:bg-amber-50">Archive</Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => handleRestoreSop(item.id)} className="h-7 text-emerald-600 font-bold hover:bg-emerald-50">Restore</Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">SOP Viewer Pane</h3>
              {selectedSop ? (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h4 className="text-sm font-black text-indigo-800">{selectedSop.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{selectedSop.destination}</p>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {selectedSop.content}
                  </p>
                  {selectedSop.createdBy && (
                    <p className="text-[9px] text-slate-400 font-mono">
                      Author: {selectedSop.createdBy.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  Select an SOP from the table to view instructions.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. LEADER ASSIGNMENT TAB */}
      {activeTab === "leader" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">👨‍✈️ Assigned Leader Contact Info</h3>
                <p className="text-[10px] text-slate-400 font-medium">Assignment isolates leader details for this specific trip + departureDate.</p>
              </div>
              <Button size="sm" onClick={() => {
                setLeaderForm({ leaderName: "", leaderPhone: "", leaderType: "INTERNAL", isPrimary: false, notes: "" });
                setShowAssignLeader(true);
              }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-8">
                Assign Trip Leader
              </Button>
            </div>

            {leader.length > 0 ? (
              <div className="space-y-4">
                {leader.map((ld: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{ld.leaderName}</span>
                        {ld.isPrimary && <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-black">Primary</span>}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${ld.leaderType === 'INTERNAL' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                          {ld.leaderType}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {!ld.isPrimary && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={async () => {
                            await opsService.patchTripLeader(selectedTripId, { id: ld.id, isPrimary: true }, selectedDepartureDate);
                            loadTripOps(selectedTripId, selectedDepartureDate);
                          }}>
                            Make Primary
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => {
                          setLeaderForm({ leaderName: ld.leaderName, leaderPhone: ld.leaderPhone, leaderType: ld.leaderType, isPrimary: ld.isPrimary || false, notes: ld.notes || "" });
                          setShowAssignLeader(true);
                        }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-600 hover:bg-red-50" onClick={async () => {
                          await opsService.archiveTripLeader(selectedTripId, selectedDepartureDate, ld.id);
                          loadTripOps(selectedTripId, selectedDepartureDate);
                        }}>
                          Archive
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-bold text-slate-500">Phone:</span> <span className="font-mono">{ld.leaderPhone}</span>
                        <Button size="sm" variant="ghost" className="h-5 px-1 ml-2 text-indigo-600 text-[10px]" onClick={() => { navigator.clipboard.writeText(ld.leaderPhone); toast.success("Copied!"); }}>Copy</Button>
                      </div>
                      {ld.notes && (
                        <div>
                          <span className="font-bold text-slate-500">Notes:</span> <span>{ld.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs font-medium bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                No trip leader assigned to this departure yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. INCIDENTS TAB */}
      {activeTab === "incidents" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-black text-slate-750 uppercase tracking-wider">🚨 Field Incident Logs</h3>
              <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider">Record medical emergencies, lost baggage, or logistical errors.</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={incidentSeverityFilter} onValueChange={setIncidentSeverityFilter}>
                <SelectTrigger className="w-32 h-9 text-xs rounded-[4px] border-[#E2E8F0] bg-white text-slate-700"><SelectValue placeholder="Severity Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Severities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={incidentStatusFilter} onValueChange={setIncidentStatusFilter}>
                <SelectTrigger className="w-32 h-9 text-xs rounded-[4px] border-[#E2E8F0] bg-white text-slate-700"><SelectValue placeholder="Status Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setShowAddIncident(true)} className="h-9 text-xs font-semibold bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-[4px] shadow-sm">
                + Log Incident
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents
              .filter(inc => incidentSeverityFilter === "ALL" || inc.severity === incidentSeverityFilter)
              .filter(inc => incidentStatusFilter === "ALL" || inc.status === incidentStatusFilter)
              .map(inc => (
                <div key={inc.id} className="bg-white border border-[#E2E8F0] rounded-[4px] p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-start pb-2.5 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">{inc.title}</h4>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Reported by {inc.reportedBy?.name || "agent"}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        inc.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        inc.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                        inc.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {inc.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {inc.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">{inc.description}</p>

                  {inc.resolution ? (
                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs text-emerald-800 font-mono">
                      <strong>Resolution:</strong> {inc.resolution}
                      {inc.resolvedBy && <p className="text-[9px] text-slate-400 mt-1">Resolved by {inc.resolvedBy.name}</p>}
                    </div>
                  ) : (
                    <p className="text-[10px] text-rose-500 font-bold">⚠️ Action Required: Pending Resolution Notes</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    {inc.status === "OPEN" ? (
                      <Button size="sm" variant="outline" onClick={() => { setResolveIncidentId(inc.id); setResolveIncidentNotes(""); }} className="h-8 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                        Mark Resolved
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setReopenIncidentId(inc.id); setReopenIncidentReason(""); }} className="h-8 text-xs font-bold text-slate-600 hover:bg-slate-50">
                        Reopen Issue
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 8. OPERATIONS ACCOUNTING TAB */}
      {activeTab === "accounting" && (
        <div className="space-y-6">
          {/* Grid 2: expenses */}
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xs font-black text-slate-750 uppercase tracking-wider">💰 OPERATIONS DISBURSEMENT & FIELD COSTS</h2>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider">Syncs actual operational payments.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddExpense(true)} className="h-8 text-xs font-semibold text-[#F97316] border-[#F97316]/30 hover:bg-[#F97316]/5 bg-white rounded-[4px]">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Expense
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-455 uppercase border-b border-[#E2E8F0]">
                    <th className="p-3 text-left border-r border-slate-100">Activity Service Name</th>
                    <th className="p-3 text-left border-r border-slate-100">Payment Date</th>
                    <th className="p-3 text-right border-r border-slate-100">Total Amount</th>
                    <th className="p-3 text-right border-r border-slate-100">Amount Paid</th>
                    <th className="p-3 text-right border-r border-slate-100">Due Amount</th>
                    <th className="p-3 text-center border-r border-slate-100">Status</th>
                    <th className="p-3 text-left border-r border-slate-100">Remarks</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-medium">No expenses. Click "Add Expense".</td></tr>
                  ) : (
                    expenses.map(row => (
                      <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                        <td className="p-3 border-r border-slate-100 font-bold text-slate-700">{row.activity}</td>
                        <td className="p-3 border-r border-slate-100 font-mono text-slate-500">{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-800">₹{row.totalAmount.toLocaleString("en-IN")}</td>
                        <td className="p-3 border-r border-slate-100 text-right text-emerald-750 font-black">₹{row.amountPaid.toLocaleString("en-IN")}</td>
                        <td className="p-3 border-r border-slate-100 text-right text-red-600 font-black">₹{row.dueAmount.toLocaleString("en-IN")}</td>
                        <td className="p-3 border-r border-slate-100 text-center">
                          <span className={`px-2 py-0.5 rounded-[2px] border text-[9px] font-black uppercase tracking-wider ${row.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                            {row.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 border-r border-slate-100 text-slate-500 font-medium">{row.remarks || "—"}</td>
                        <td className="p-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteExpenseRow(row.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Reports Tab ── */}
      {activeTab === "reports" && selectedDeparture && (
        <ReportsConsole
          tripId={selectedDeparture.code}
          departureDateStr={selectedDeparture.departureDate}
        />
      )}

      {/* ── AUTO ALLOCATION PREVIEW / CONFIRMATION MODAL ── */}
      <Dialog open={allocModal.open} onOpenChange={o => setAllocModal({ open: o, data: allocModal.data, confirming: false })}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-7 bg-white rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-slate-900 flex items-center justify-between pr-8">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Allocation Proposal (Version {allocModal.data?.version || 1} — DRAFT)
              </span>
              <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Draft Proposal</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Review suggested allocations and warning flags. Confirming locks this version with an audit timestamp.
            </DialogDescription>
          </DialogHeader>

          {allocModal.data && (
            <div className="space-y-4 py-3">
              {/* Review Flags */}
              {allocModal.data.flags?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Review Warnings
                  </p>
                  {allocModal.data.flags.map((f, i) => (
                    <p key={i} className="text-[11px] text-amber-700 leading-relaxed">{f}</p>
                  ))}
                </div>
              )}

              {/* ── 🚌 VEHICLE SHUFFLE TABLE ── */}
              {allocModal.data.vehicleAllocations?.length > 0 && (
                <div className="border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/30 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" /> Shuffle Vehicle Assignment ({allocModal.data.vehicleAllocations.length} Travelers)
                    </p>
                    <span className="text-[10px] font-bold text-indigo-500">Change vehicle or seat # to shuffle</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200 sticky top-0 z-10">
                          <th className="p-2 text-left w-6"></th>
                          <th className="p-2 text-left">Traveler</th>
                          <th className="p-2 text-left">Assigned Vehicle</th>
                          <th className="p-2 text-center w-20">Seat #</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocModal.data.vehicleAllocations.map((va, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-indigo-50/40 transition-colors">
                            <td className="p-2 text-center"><GripVertical className="w-3 h-3 text-slate-300" /></td>
                            <td className="p-2 font-semibold text-slate-800">{va.travelerName}</td>
                            <td className="p-2">
                              <select
                                value={va.fleetId}
                                onChange={(e) => handleVehicleChange(idx, 'fleetId', e.target.value)}
                                className="w-full h-7 text-xs font-semibold text-indigo-800 bg-white border border-indigo-200 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                              >
                                {fleet.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.vehicleType} ({f.capacity} Seater)
                                  </option>
                                ))}
                                {/* Keep current fleetId as option if fleet is empty or not found */}
                                {fleet.length === 0 && <option value={va.fleetId}>{va.fleetId}</option>}
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number" min={1} max={50}
                                value={va.seatNumber || (idx + 1)}
                                onChange={(e) => handleVehicleChange(idx, 'seatNumber', e.target.value)}
                                className="w-14 h-7 text-center font-mono font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tempo List Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">🚌 WhatsApp Tempo List</span>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] text-indigo-600 font-bold hover:bg-indigo-50"
                    onClick={() => { navigator.clipboard.writeText(allocModal.data!.whatsappTempoText); toast.success("Tempo list copied!"); }}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Text
                  </Button>
                </div>
                <textarea readOnly value={allocModal.data.whatsappTempoText} className="w-full h-40 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>

              {/* ── 🏨 ROOM SHUFFLE TABLE ── */}
              {allocModal.data.roomAllocations?.length > 0 && (
                <div className="border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/30 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" /> Shuffle Room Assignment ({allocModal.data.roomAllocations.length} Travelers)
                    </p>
                    <span className="text-[10px] font-bold text-emerald-500">Edit room number to shuffle traveler</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200 sticky top-0 z-10">
                          <th className="p-2 text-left w-6"></th>
                          <th className="p-2 text-left">Traveler</th>
                          <th className="p-2 text-left w-32">Room Number</th>
                          <th className="p-2 text-left w-28">Room Type</th>
                          <th className="p-2 text-left w-24">Gender Grp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocModal.data.roomAllocations.map((ra, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-emerald-50/40 transition-colors">
                            <td className="p-2 text-center"><GripVertical className="w-3 h-3 text-slate-300" /></td>
                            <td className="p-2 font-semibold text-slate-800">{ra.travelerName}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={ra.roomNumber}
                                onChange={(e) => handleRoomChange(idx, 'roomNumber', e.target.value)}
                                className="w-full h-7 text-xs font-bold text-emerald-800 bg-emerald-50/50 border border-emerald-200 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                placeholder="Room 101"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={ra.roomType}
                                onChange={(e) => handleRoomChange(idx, 'roomType', e.target.value)}
                                className="w-full h-7 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md px-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                              >
                                <option value="TWIN">TWIN</option>
                                <option value="TRIPLE">TRIPLE</option>
                                <option value="QUAD">QUAD</option>
                                <option value="SINGLE">SINGLE</option>
                                <option value="DORM">DORM</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={ra.genderGroup}
                                onChange={(e) => handleRoomChange(idx, 'genderGroup', e.target.value)}
                                className="w-full h-7 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md px-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                              >
                                <option value="BOYS">BOYS</option>
                                <option value="GIRLS">GIRLS</option>
                                <option value="GROUP">GROUP</option>
                                <option value="COUPLE">COUPLE</option>
                                <option value="FAMILY">FAMILY</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Room List Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">🏨 WhatsApp Room List</span>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] text-emerald-600 font-bold hover:bg-emerald-50"
                    onClick={() => { navigator.clipboard.writeText(allocModal.data!.whatsappRoomText); toast.success("Room list copied!"); }}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Text
                  </Button>
                </div>
                <textarea readOnly value={allocModal.data.whatsappRoomText} className="w-full h-40 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>
          )}
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
            <Button size="sm" variant="outline" onClick={() => setAllocModal({ open: false, data: null, confirming: false })} className="text-xs font-semibold">Close Draft</Button>
            <Button size="sm" onClick={handleConfirmAllocation} disabled={allocModal.confirming} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 h-9 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {allocModal.confirming ? "Confirming..." : "Confirm & Lock Allocation Run"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Itinerary Modal */}
      <Dialog open={showAddItinerary} onOpenChange={setShowAddItinerary}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-slate-900 pr-8">Add Itinerary Day Row</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">Enter daily stay, vehicle, and hotel details for this trip departure.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-3">
            <div><label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Stay / Location Title *</label><Input value={itinForm.dayTitle} onChange={e => setItinForm(p => ({ ...p, dayTitle: e.target.value }))} placeholder="e.g. MANALI (06 Rooms)" className="h-9 text-xs rounded-lg border-slate-200" /></div>
            <div><label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Hotel Name</label><Input value={itinForm.hotelName} onChange={e => setItinForm(p => ({ ...p, hotelName: e.target.value }))} placeholder="e.g. BARPA COTTAGE" className="h-9 text-xs rounded-lg border-slate-200" /></div>
            <div><label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Vehicle Type</label><Input value={itinForm.vehicleType} onChange={e => setItinForm(p => ({ ...p, vehicleType: e.target.value }))} placeholder="e.g. 13 Seater Tempo" className="h-9 text-xs rounded-lg border-slate-200" /></div>
            <div><label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Guide / Driver Details</label><Input value={itinForm.guideDriverDetails} onChange={e => setItinForm(p => ({ ...p, guideDriverDetails: e.target.value }))} placeholder="e.g. Sachin Sir 70189 25148" className="h-9 text-xs rounded-lg border-slate-200" /></div>
          </div>
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddItinerary(false)} className="text-xs font-semibold">Cancel</Button>
            <Button size="sm" onClick={handleSaveItineraryRow} className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 h-9">Save Row</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-slate-900 pr-8">Add Trip Expense Row</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">Record operational costs and payment tracking for this departure.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-3">
            <div><label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Activity / Service Provided *</label><Input value={expForm.activity} onChange={e => setExpForm(p => ({ ...p, activity: e.target.value }))} placeholder="e.g. Barpa Cottage" className="h-9 text-xs rounded-lg border-slate-200" /></div>
            <div><label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Total Amount (₹) *</label><Input type="number" value={expForm.totalAmount} onChange={e => setExpForm(p => ({ ...p, totalAmount: e.target.value }))} placeholder="e.g. 31600" className="h-9 text-xs rounded-lg border-slate-200" /></div>
            <div><label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Amount Paid (₹)</label><Input type="number" value={expForm.amountPaid} onChange={e => setExpForm(p => ({ ...p, amountPaid: e.target.value }))} placeholder="e.g. 31600" className="h-9 text-xs rounded-lg border-slate-200" /></div>
            <div><label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Remark / Formula Breakdown</label><Input value={expForm.remarks} onChange={e => setExpForm(p => ({ ...p, remarks: e.target.value }))} placeholder="e.g. (17 x 800) cash deposit" className="h-9 text-xs rounded-lg border-slate-200" /></div>
          </div>
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddExpense(false)} className="text-xs font-semibold">Cancel</Button>
            <Button size="sm" onClick={handleSaveExpenseRow} className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 h-9">Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vehicle / Tempo Modal */}
      <Dialog open={showAddFleet} onOpenChange={setShowAddFleet}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-slate-900 pr-8">Add Vehicle / Tempo to Fleet</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">Configure available vehicle capacity for auto-allocation rules on this departure.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Vehicle Name / Type *</label>
              <Input value={fleetForm.vehicleType} onChange={e => setFleetForm(p => ({ ...p, vehicleType: e.target.value }))} placeholder="e.g. Tempo 1 (13 Seater)" className="h-9 text-xs rounded-lg border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Seat Capacity *</label>
                <Input type="number" value={fleetForm.capacity} onChange={e => setFleetForm(p => ({ ...p, capacity: e.target.value }))} placeholder="13, 17, 26" className="h-9 text-xs rounded-lg border-slate-200 font-mono font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Total Cost (₹)</label>
                <Input type="number" value={fleetForm.totalAmount} onChange={e => setFleetForm(p => ({ ...p, totalAmount: e.target.value }))} placeholder="e.g. 45000" className="h-9 text-xs rounded-lg border-slate-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Driver Name</label>
                <Input value={fleetForm.driverName} onChange={e => setFleetForm(p => ({ ...p, driverName: e.target.value }))} placeholder="e.g. Ramesh" className="h-9 text-xs rounded-lg border-slate-200" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Driver Phone</label>
                <Input value={fleetForm.driverPhone} onChange={e => setFleetForm(p => ({ ...p, driverPhone: e.target.value }))} placeholder="e.g. 98160 12345" className="h-9 text-xs rounded-lg border-slate-200" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Notes</label>
              <Input value={fleetForm.notes} onChange={e => setFleetForm(p => ({ ...p, notes: e.target.value }))} className="h-9 text-xs rounded-lg border-slate-200" />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddFleet(false)} className="text-xs font-semibold">Cancel</Button>
            <Button size="sm" onClick={handleSaveFleetRow} className="text-xs bg-blue-900 hover:bg-blue-800 text-white font-bold px-4 h-9">Save Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Room Modal */}
      <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-6 bg-white rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-slate-900 pr-8">Add Multiple Rooms to Inventory</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">Configure hotel room types, quantities, and properties to add in one batch.</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <th className="p-2 text-left">Starting Label *</th>
                    <th className="p-2 text-center w-20">Qty *</th>
                    <th className="p-2 text-left w-36">Room Type</th>
                    <th className="p-2 text-left w-36">Gender Group</th>
                    <th className="p-2 text-center w-20">Capacity</th>
                    <th className="p-2 text-left">Hotel Name</th>
                    <th className="p-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {roomRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-2">
                        <Input
                          value={row.roomLabel}
                          onChange={e => handleRoomRowValueChange(idx, "roomLabel", e.target.value)}
                          placeholder="e.g. Room 101"
                          className="h-8 text-xs rounded border-slate-200"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={row.quantity}
                          onChange={e => handleRoomRowValueChange(idx, "quantity", e.target.value)}
                          className="h-8 text-xs text-center font-mono font-bold rounded border-slate-200"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={row.roomType}
                          onChange={e => handleRoomRowValueChange(idx, "roomType", e.target.value)}
                          className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                        >
                          <option value="TWIN">TWIN (2 share)</option>
                          <option value="TRIPLE">TRIPLE (3 share)</option>
                          <option value="QUAD">QUAD (4 share)</option>
                          <option value="SINGLE">SINGLE</option>
                          <option value="DORM">DORM</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={row.genderGroup}
                          onChange={e => handleRoomRowValueChange(idx, "genderGroup", e.target.value)}
                          className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                        >
                          <option value="BOYS">BOYS</option>
                          <option value="GIRLS">GIRLS</option>
                          <option value="COUPLE">COUPLE</option>
                          <option value="GROUP">GROUP</option>
                          <option value="FAMILY">FAMILY</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={row.capacity}
                          onChange={e => handleRoomRowValueChange(idx, "capacity", e.target.value)}
                          className="h-8 text-xs text-center font-mono rounded border-slate-200"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.hotelName}
                          onChange={e => handleRoomRowValueChange(idx, "hotelName", e.target.value)}
                          placeholder="e.g. Barpa Cottage"
                          className="h-8 text-xs rounded border-slate-200"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Button size="sm" variant="ghost" onClick={() => removeRoomRow(idx)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button size="sm" variant="outline" onClick={addRoomRow} className="text-xs font-bold w-full border-dashed h-8 mt-4">
              <Plus className="w-3 h-3 mr-1" /> Add Another Room Row
            </Button>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddRoom(false)} className="text-xs font-semibold">Cancel</Button>
            <Button size="sm" onClick={handleSaveRoomRow} className="text-xs bg-emerald-950 hover:bg-emerald-900 text-white font-bold px-4 h-9">Save Rooms</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ASSIGN TRIP LEADER DIALOG ── */}
      <Dialog open={showAssignLeader} onOpenChange={setShowAssignLeader}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-slate-900">Assign Trip Leader / Guide</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">Assign an on-field representative for this departure.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">Leader / Guide Name *</label>
              <Input value={leaderForm.leaderName} onChange={e => setLeaderForm({ ...leaderForm, leaderName: e.target.value })} placeholder="e.g. Ramesh Negi" className="h-9 text-xs rounded border-slate-200 mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">Contact Phone Number *</label>
              <Input value={leaderForm.leaderPhone} onChange={e => setLeaderForm({ ...leaderForm, leaderPhone: e.target.value })} placeholder="e.g. +91 9876543210" className="h-9 text-xs rounded border-slate-200 mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">Leader Status</label>
              <select value={leaderForm.leaderType} onChange={e => setLeaderForm({ ...leaderForm, leaderType: e.target.value })} className="w-full h-9 text-xs bg-white border border-slate-200 rounded px-2 mt-1 focus:outline-none focus:ring-1 focus:ring-slate-400">
                <option value="INTERNAL">INTERNAL (Team Member)</option>
                <option value="FREELANCE">FREELANCE (Local Guide)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">Special Instructions / Remarks</label>
              <Input value={leaderForm.notes} onChange={e => setLeaderForm({ ...leaderForm, notes: e.target.value })} placeholder="e.g. Speaks Hindi & Kumaoni" className="h-9 text-xs rounded border-slate-200 mt-1" />
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isPrimary"
                checked={leaderForm.isPrimary}
                onChange={e => setLeaderForm({ ...leaderForm, isPrimary: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isPrimary" className="text-[11px] font-black text-slate-500 uppercase cursor-pointer">Set as Primary Leader</label>
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAssignLeader(false)} className="text-xs font-semibold">Cancel</Button>
            <Button size="sm" onClick={handleSaveLeader} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 h-9">Assign Leader</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── LOG INCIDENT DIALOG ── */}
      <Dialog open={showAddIncident} onOpenChange={setShowAddIncident}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-slate-900">Log Field Incident / Issue</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">Record issues occurring on the trip to prevent recurrence and track resolution.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">Issue Summary / Title *</label>
              <Input value={incidentForm.title} onChange={e => setIncidentForm({ ...incidentForm, title: e.target.value })} placeholder="e.g. Medical emergency at Kedarnath" className="h-9 text-xs rounded border-slate-200 mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">Severity</label>
              <select value={incidentForm.severity} onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value })} className="w-full h-9 text-xs bg-white border border-slate-200 rounded px-2 mt-1 focus:outline-none focus:ring-1 focus:ring-slate-400">
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">Detailed Description *</label>
              <textarea value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} placeholder="Explain what happened, including names or locations if applicable..." className="w-full h-24 text-xs rounded border border-slate-200 mt-1 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">Resolution Notes</label>
              <textarea value={incidentForm.resolution} onChange={e => setIncidentForm({ ...incidentForm, resolution: e.target.value })} placeholder="How was it resolved? (Leave blank if still ongoing)" className="w-full h-20 text-xs rounded border border-slate-200 mt-1 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddIncident(false)} className="text-xs font-semibold">Cancel</Button>
            <Button size="sm" onClick={handleCreateIncident} className="text-xs bg-rose-700 hover:bg-rose-800 text-white font-bold px-4 h-9">Log Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADD SOP DIALOG ── */}
      <Dialog open={showAddSop} onOpenChange={setShowAddSop}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-slate-900">Add Destination SOP Template</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">Define standard instructions for a specific travel destination library.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">Destination Name *</label>
              <Input value={sopForm.destination} onChange={e => setSopForm({ ...sopForm, destination: e.target.value.toUpperCase() })} placeholder="e.g. KEDARNATH" className="h-9 text-xs rounded border-slate-200 mt-1 font-bold tracking-wider" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">SOP Title *</label>
              <Input value={sopForm.title} onChange={e => setSopForm({ ...sopForm, title: e.target.value })} placeholder="e.g. Medical and Oxygen Support SOP" className="h-9 text-xs rounded border-slate-200 mt-1 font-semibold" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase">Instructions Content *</label>
              <textarea value={sopForm.content} onChange={e => setSopForm({ ...sopForm, content: e.target.value })} placeholder="Detail step-by-step guidelines for this destination..." className="w-full h-32 text-xs rounded border border-slate-200 mt-1 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddSop(false)} className="text-xs font-semibold">Cancel</Button>
            <Button size="sm" onClick={handleSaveSop} className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 h-9">Save SOP Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
