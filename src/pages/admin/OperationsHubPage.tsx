import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass, Calculator, CalendarCheck, CheckSquare, Sparkles, Plus, RefreshCw,
  TrendingUp, Users, AlertTriangle, Check, X, Copy, Share2, ShieldAlert, CheckCircle2, Trash2, ArrowUpDown, GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/services/api";
import { opsService, type OpsDayItinerary, type OpsTripExpense, type OpsAccountingSummary, type OpsSeatConfig, type AutoAllocationResult, type OpsTransportFleet, type OpsRoomInventory } from "@/services/ops.service";

const getTodayString = () => new Date().toISOString().split('T')[0];

export default function OperationsHubPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedDepartureDate, setSelectedDepartureDate] = useState<string>(getTodayString());
  const [availableDepartureDates, setAvailableDepartureDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "hotels_transport" | "allocation" | "checklist" | "sop" | "leader" | "incidents" | "accounting">("overview");

  // Excel Grids Data
  const [itinerary, setItinerary] = useState<OpsDayItinerary[]>([]);
  const [expenses, setExpenses] = useState<OpsTripExpense[]>([]);
  const [fleet, setFleet] = useState<OpsTransportFleet[]>([]);
  const [roomInventory, setRoomInventory] = useState<OpsRoomInventory[]>([]);
  const [summary, setSummary] = useState<OpsAccountingSummary | null>(null);
  const [seatConfig, setSeatConfig] = useState<OpsSeatConfig | null>(null);

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

  // 1. Load trips
  useEffect(() => {
    api.get("/trips").then(res => {
      const list = res.data?.data || [];
      setTrips(list);
      if (list.length > 0) setSelectedTripId(list[0].id);
    }).catch(() => toast.error("Failed to load trips"));
  }, []);

  // 2. Fetch available departures for a selected trip
  useEffect(() => {
    if (!selectedTripId) return;
    api.get(`/trips/${selectedTripId}/departures`).then(res => {
      const dates = res.data?.data || [];
      setAvailableDepartureDates(dates);
      if (dates.length > 0) {
        setSelectedDepartureDate(dates[0]);
      } else {
        setSelectedDepartureDate(getTodayString());
      }
    }).catch(() => {
      setAvailableDepartureDates([]);
      setSelectedDepartureDate(getTodayString());
    });
  }, [selectedTripId]);

  // 2. Load trip operational data (Departure Isolated with resilient fetching)
  const loadTripOps = useCallback(async (tripId: string, depDate?: string) => {
    if (!tripId || !depDate) return;
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        opsService.getDayItinerary(tripId, depDate),
        opsService.getTripExpenses(tripId, depDate),
        opsService.getAccountingSummary(tripId, depDate),
        opsService.getSeatConfig(tripId, depDate),
        opsService.getTransportFleet(tripId, depDate),
        opsService.getRoomInventory(tripId, depDate),
        opsService.getChecklist(tripId, depDate),
        opsService.getTripLeader(tripId, depDate),
        opsService.getIncidents(tripId, depDate)
      ]);

      if (results[0].status === "fulfilled") setItinerary(results[0].value);
      if (results[1].status === "fulfilled") setExpenses(results[1].value);
      if (results[2].status === "fulfilled") setSummary(results[2].value);
      if (results[3].status === "fulfilled") setSeatConfig(results[3].value);
      if (results[4].status === "fulfilled") setFleet(results[4].value);
      if (results[5].status === "fulfilled") setRoomInventory(results[5].value);
      if (results[6].status === "fulfilled") setChecklist(results[6].value);
      if (results[7].status === "fulfilled") setLeader(results[7].value);
      if (results[8].status === "fulfilled") setIncidents(results[8].value);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTripId && selectedDepartureDate) {
      loadTripOps(selectedTripId, selectedDepartureDate);
    }
  }, [selectedTripId, selectedDepartureDate, loadTripOps]);

  // SOP Library query hooks
  useEffect(() => {
    opsService.getSops(sopFilterDestination || undefined, includeArchivedSops)
      .then(setSops)
      .catch(() => {});
  }, [sopFilterDestination, includeArchivedSops]);

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
      await opsService.confirmAllocation(allocModal.data.allocationRunId);
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" /> Operations Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Strict departure-isolated management for hotel verification, expenses, seat caps, and allocation runs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedTripId} onValueChange={setSelectedTripId}>
            <SelectTrigger className="w-56 h-9 text-xs font-semibold"><SelectValue placeholder="Select Departure Trip" /></SelectTrigger>
            <SelectContent>
              {trips.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title || t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input type="date" value={selectedDepartureDate} onChange={e => setSelectedDepartureDate(e.target.value)}
            className="w-36 h-9 text-xs font-mono" placeholder="Departure Date" />

          <Button size="sm" onClick={handleTriggerAutoAllocate} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate Allocation Draft
          </Button>
        </div>
      </div>

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

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Approved Revenue</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">₹{(summary?.totalRevenueCollected || 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Ops Cost</p>
          <p className="text-2xl font-black text-slate-800 mt-1">₹{(summary?.totalOpsCost || 0).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Per-person: ₹{Math.round(summary?.perPersonOpsCost || 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Net Profit</p>
          <p className={`text-2xl font-black mt-1 ${(summary?.profitPerTrip || 0) >= 0 ? "text-indigo-600" : "text-red-600"}`}>
            ₹{(summary?.profitPerTrip || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Departure Seats</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{seatConfig?.seatsSold || 0} / {seatConfig?.totalSeatsCap || 30}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Waitlist: {seatConfig?.waitingList || 0}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-4 sm:gap-6 no-scrollbar">
        {[
          { id: "overview", label: "📊 Overview" },
          { id: "hotels_transport", label: "🏨 Hotels & Transport" },
          { id: "allocation", label: "👥 Allocation" },
          { id: "checklist", label: "📋 Trip Checklist" },
          { id: "sop", label: "📚 SOP Library" },
          { id: "leader", label: "👨‍✈️ Leader Assignment" },
          { id: "incidents", label: "🚨 Incidents" },
          { id: "accounting", label: "💰 Operations Accounting" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === t.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
                      {checklist.filter(c => c.isCompleted).length} / {checklist.length} Completed
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">Standard checklist tasks completed.</p>
                  </div>
                  {checklist.length === 0 ? (
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
                {incidents.filter(i => i.status === "OPEN").length === 0 ? (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-4 text-xs font-bold text-center">
                    ✓ All clear. No open incidents reported on this departure date.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidents.filter(i => i.status === "OPEN").map(inc => (
                      <div key={inc.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-rose-950">{inc.title}</p>
                          <p className="text-[10px] text-rose-800 mt-0.5">{inc.description}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-200 text-rose-800">
                          {inc.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Departure Leader</h3>
              {leader.length > 0 ? (
                <div className="space-y-3">
                  {leader.map((ld: any, idx: number) => (
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
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider">{selectedTrip?.title || "ITINERARY & HOTEL VERIFICATION"}</h2>
                <p className="text-[10px] text-emerald-200 font-medium font-mono">Isolated verification checklist per day.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowAddItinerary(true)} className="h-7 text-[10px] font-bold uppercase text-white hover:bg-emerald-700">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Day Row
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                    <th className="p-2.5 text-left border-r border-slate-200">Date</th>
                    <th className="p-2.5 text-left border-r border-slate-200">Stay Location</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Pax</th>
                    <th className="p-2.5 text-left border-r bg-amber-50/50 text-amber-900">Hotel Name</th>
                    <th className="p-2.5 text-center border-r bg-amber-50/50 text-amber-900">Hotel status</th>
                    <th className="p-2.5 text-left border-r bg-blue-50/50 text-blue-900">Tempo / Vehicle</th>
                    <th className="p-2.5 text-center border-r bg-blue-50/50 text-blue-900">Tempo Status</th>
                    <th className="p-2.5 text-left border-r border-slate-200">Remarks</th>
                    <th className="p-2.5 text-left border-r border-slate-200">Guide/Driver Details</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Check-In</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {itinerary.length === 0 ? (
                    <tr><td colSpan={11} className="p-8 text-center text-slate-400 font-medium">No day itinerary rows. Click "Add Day Row".</td></tr>
                  ) : (
                    itinerary.map(row => (
                      <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-2.5 border-r border-slate-200 font-mono text-slate-600">{row.date ? new Date(row.date).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="p-2.5 border-r border-slate-200 font-bold">{row.dayTitle}</td>
                        <td className="p-2.5 border-r border-slate-200 text-center">{row.paxCount}</td>
                        <td className="p-2.5 border-r bg-amber-50/20">{row.hotelName || "—"}</td>
                        <td className="p-2.5 border-r text-center">
                          <button onClick={() => handleItinCheckToggle(row, "hotelVerified")} className={`px-2 py-0.5 rounded text-[9px] font-black ${row.hotelVerified ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                            {row.hotelVerified ? "VERIFIED" : "PENDING"}
                          </button>
                        </td>
                        <td className="p-2.5 border-r bg-blue-50/20">{row.vehicleType || "—"}</td>
                        <td className="p-2.5 border-r text-center">
                          <button onClick={() => handleItinCheckToggle(row, "vehicleVerified")} className={`px-2 py-0.5 rounded text-[9px] font-black ${row.vehicleVerified ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                            {row.vehicleVerified ? "VERIFIED" : "PENDING"}
                          </button>
                        </td>
                        <td className="p-2.5 border-r border-slate-200 text-slate-500">{row.remarks || "—"}</td>
                        <td className="p-2.5 border-r border-slate-200 text-slate-700">{row.guideDriverDetails || "—"}</td>
                        <td className="p-2.5 border-r border-slate-200 text-center">
                          <input type="checkbox" checked={row.checkInDone} onChange={() => handleItinCheckToggle(row, "checkInDone")} className="w-4 h-4 rounded border-slate-300 accent-emerald-600" />
                        </td>
                        <td className="p-2.5 text-center">
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
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider">🚌 DEPARTURE TRANSPORT FLEET</h2>
                <p className="text-[10px] text-blue-200 font-medium">Tempos and vehicle configs assigned.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowAddFleet(true)} className="h-7 text-[10px] font-bold uppercase text-white hover:bg-blue-800">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Vehicle
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                    <th className="p-2.5 text-left border-r border-slate-200">Vehicle Type</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Seat Capacity</th>
                    <th className="p-2.5 text-left border-r border-slate-200">Driver Contact</th>
                    <th className="p-2.5 text-right border-r border-slate-200">Total Cost</th>
                    <th className="p-2.5 text-right border-r border-slate-200">Advance Paid</th>
                    <th className="p-2.5 text-left border-r border-slate-200">Notes / Pickup</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fleet.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-medium">No vehicles added yet.</td></tr>
                  ) : (
                    fleet.map(row => (
                      <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-2.5 border-r border-slate-200 font-bold">{row.vehicleType}</td>
                        <td className="p-2.5 border-r border-slate-200 text-center font-mono font-bold">{row.capacity} Seats</td>
                        <td className="p-2.5 border-r border-slate-200">{row.driverName ? `${row.driverName} (${row.driverPhone})` : "—"}</td>
                        <td className="p-2.5 border-r border-slate-200 text-right">₹{(row.totalAmount || 0).toLocaleString("en-IN")}</td>
                        <td className="p-2.5 border-r border-slate-200 text-right text-emerald-700">₹{(row.advancePaid || 0).toLocaleString("en-IN")}</td>
                        <td className="p-2.5 border-r border-slate-200 text-slate-500">{row.notes || "—"}</td>
                        <td className="p-2.5 text-center">
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Auto-Allocation Engine Proposals</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Generate seat shuffle and room groups matching traveler genders.</p>
            </div>
            <Button size="sm" onClick={handleExecuteAutoAllocation} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Run Auto-Allocation
            </Button>
          </div>

          {/* Grid 4: Hotel room inventory */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-emerald-950 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider">🏨 HOTEL ROOM ALLOCATION INVENTORY</h2>
                <p className="text-[10px] text-emerald-200 font-medium">Add room blocks for auto segregation rules.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowAddRoom(true)} className="h-7 text-[10px] font-bold uppercase text-white hover:bg-emerald-800">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Multiple Rooms
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                    <th className="p-2.5 text-left border-r border-slate-200">Room Label</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Capacity</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Room Type</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Gender Allocation</th>
                    <th className="p-2.5 text-left border-r border-slate-200">Hotel Name</th>
                    <th className="p-2.5 text-left border-r border-slate-200">Notes / Remarks</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roomInventory.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-medium">No rooms configured. Click "Add Multiple Rooms".</td></tr>
                  ) : (
                    roomInventory.map(row => (
                      <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-2.5 border-r border-slate-200 font-bold">{row.roomLabel}</td>
                        <td className="p-2.5 border-r border-slate-200 text-center font-mono font-bold bg-emerald-50/30">{row.capacity} Beds</td>
                        <td className="p-2.5 border-r border-slate-200 text-center font-semibold">{row.roomType}</td>
                        <td className="p-2.5 border-r border-slate-200 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            row.genderGroup === 'BOYS' ? 'bg-blue-100 text-blue-800' :
                            row.genderGroup === 'GIRLS' ? 'bg-pink-100 text-pink-800' :
                            row.genderGroup === 'COUPLE' ? 'bg-purple-100 text-purple-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {row.genderGroup}
                          </span>
                        </td>
                        <td className="p-2.5 border-r border-slate-200">{row.hotelName || "—"}</td>
                        <td className="p-2.5 border-r border-slate-200 text-slate-500">{row.notes || "—"}</td>
                        <td className="p-2.5 text-center">
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">🚨 Field Incident Logs</h3>
              <p className="text-[10px] text-slate-400 font-medium">Record medical emergencies, lost baggage, or logistical errors.</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={incidentSeverityFilter} onValueChange={setIncidentSeverityFilter}>
                <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Severity Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Severities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={incidentStatusFilter} onValueChange={setIncidentStatusFilter}>
                <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Status Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setShowAddIncident(true)} className="bg-rose-950 hover:bg-rose-900 text-white text-xs font-bold h-9">
                + Log Incident
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents
              .filter(inc => incidentSeverityFilter === "ALL" || inc.severity === incidentSeverityFilter)
              .filter(inc => incidentStatusFilter === "ALL" || inc.status === incidentStatusFilter)
              .map(inc => (
                <div key={inc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
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
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider">💰 OPERATIONS DISBURSEMENT & FIELD COSTS</h2>
                <p className="text-[10px] text-slate-300 font-medium">Syncs actual operational payments.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowAddExpense(true)} className="h-7 text-[10px] font-bold uppercase text-white hover:bg-slate-700">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Expense
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                    <th className="p-2.5 text-left border-r border-slate-200">Activity Service Name</th>
                    <th className="p-2.5 text-left border-r border-slate-200">Payment Date</th>
                    <th className="p-2.5 text-right border-r border-slate-200">Total Amount</th>
                    <th className="p-2.5 text-right border-r border-slate-200">Amount Paid</th>
                    <th className="p-2.5 text-right border-r border-slate-200">Due Amount</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Status</th>
                    <th className="p-2.5 text-left border-r border-slate-200">Remarks</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-medium">No expenses. Click "Add Expense".</td></tr>
                  ) : (
                    expenses.map(row => (
                      <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-2.5 border-r border-slate-200 font-bold">{row.activity}</td>
                        <td className="p-2.5 border-r border-slate-200 font-mono text-slate-600">{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="p-2.5 border-r border-slate-200 text-right">₹{row.totalAmount.toLocaleString("en-IN")}</td>
                        <td className="p-2.5 border-r border-slate-200 text-right text-emerald-700">₹{row.amountPaid.toLocaleString("en-IN")}</td>
                        <td className="p-2.5 border-r border-slate-200 text-right text-red-600">₹{row.dueAmount.toLocaleString("en-IN")}</td>
                        <td className="p-2.5 border-r border-slate-200 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${row.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                            {row.paymentStatus}
                          </span>
                        </td>
                        <td className="p-2.5 border-r border-slate-200 text-slate-500">{row.remarks || "—"}</td>
                        <td className="p-2.5 text-center">
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
            <Button size="sm" onClick={handleSaveIncident} className="text-xs bg-rose-700 hover:bg-rose-800 text-white font-bold px-4 h-9">Log Incident</Button>
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
  );
}
