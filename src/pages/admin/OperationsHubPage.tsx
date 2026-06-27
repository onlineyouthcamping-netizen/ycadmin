import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass, Calculator, CalendarCheck, CheckSquare, Sparkles, Plus, RefreshCw,
  TrendingUp, Users, AlertTriangle, Check, X, Copy, Share2, ShieldAlert, CheckCircle2, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/services/api";
import { opsService, type OpsDayItinerary, type OpsTripExpense, type OpsAccountingSummary, type OpsSeatConfig, type AutoAllocationResult } from "@/services/ops.service";

const getTodayString = () => new Date().toISOString().split('T')[0];

export default function OperationsHubPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedDepartureDate, setSelectedDepartureDate] = useState<string>(getTodayString());
  const [availableDepartureDates, setAvailableDepartureDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Excel Grids Data
  const [itinerary, setItinerary] = useState<OpsDayItinerary[]>([]);
  const [expenses, setExpenses] = useState<OpsTripExpense[]>([]);
  const [summary, setSummary] = useState<OpsAccountingSummary | null>(null);
  const [seatConfig, setSeatConfig] = useState<OpsSeatConfig | null>(null);

  // Dialogs
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [itinForm, setItinForm] = useState({ dayTitle: "", paxCount: "19", hotelName: "", vehicleType: "", remarks: "", guideDriverDetails: "" });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expForm, setExpForm] = useState({ activity: "", totalAmount: "", amountPaid: "", remarks: "" });

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

  // Sync available departure dates when trip changes
  useEffect(() => {
    if (!selectedTripId || trips.length === 0) return;
    const trip = trips.find(t => t.id === selectedTripId);
    let extractedDates: string[] = [];
    if (trip && trip.availableDates) {
      try {
        const parsed = typeof trip.availableDates === 'string' ? JSON.parse(trip.availableDates) : trip.availableDates;
        if (Array.isArray(parsed) && parsed.length > 0) {
          extractedDates = parsed.map((d: any) => typeof d === 'string' ? d.split('T')[0] : (d.date || d.startDate || d.departureDate || '')).filter(Boolean);
        }
      } catch (e) {
        // Fallback
      }
    }
    setAvailableDepartureDates(extractedDates);
    if (extractedDates.length > 0) {
      setSelectedDepartureDate(extractedDates[0]);
    } else {
      setSelectedDepartureDate(getTodayString());
    }
  }, [selectedTripId, trips]);

  // 2. Load trip operational data (Departure Isolated)
  const loadTripOps = useCallback(async (tripId: string, depDate?: string) => {
    if (!tripId || !depDate) return;
    setLoading(true);
    try {
      const [itinData, expData, sumData, seatData] = await Promise.all([
        opsService.getDayItinerary(tripId, depDate),
        opsService.getTripExpenses(tripId, depDate),
        opsService.getAccountingSummary(tripId, depDate),
        opsService.getSeatConfig(tripId, depDate)
      ]);
      setItinerary(itinData);
      setExpenses(expData);
      setSummary(sumData);
      setSeatConfig(seatData);
    } catch {
      toast.error("Failed to load operational data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTripId && selectedDepartureDate) {
      loadTripOps(selectedTripId, selectedDepartureDate);
    }
  }, [selectedTripId, selectedDepartureDate, loadTripOps]);

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
      toast.error("Failed to add expense");
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
    try {
      const res = await opsService.executeAutoAllocation(selectedTripId, selectedDepartureDate);
      setAllocModal({ open: true, data: res, confirming: false });
    } catch {
      toast.error("Failed to run auto allocation draft");
    }
  };

  const handleSeatNumberChange = (index: number, newSeatStr: string) => {
    if (!allocModal.data) return;
    const newSeat = parseInt(newSeatStr) || 0;
    const updatedAllocations = [...allocModal.data.vehicleAllocations];
    updatedAllocations[index] = { ...updatedAllocations[index], seatNumber: newSeat };

    let newTempoText = `🚌 *TEMPO & VEHICLE ALLOCATION LIST*\n\n`;
    const fleetMap: Record<string, typeof updatedAllocations> = {};
    updatedAllocations.forEach(va => {
      if (!fleetMap[va.fleetId]) fleetMap[va.fleetId] = [];
      fleetMap[va.fleetId].push(va);
    });

    Object.entries(fleetMap).forEach(([fleetId, allocs], idx) => {
      newTempoText += `*VEHICLE ${idx + 1}* — ${allocs.length} assigned\n`;
      allocs.forEach((t, i) => {
        const sNum = t.seatNumber ? t.seatNumber : (i + 1);
        newTempoText += `${i + 1}. ${t.travelerName} [Seat #${sNum}]\n`;
      });
      newTempoText += `\n`;
    });

    setAllocModal(prev => ({
      ...prev,
      data: prev.data ? {
        ...prev.data,
        vehicleAllocations: updatedAllocations,
        whatsappTempoText: newTempoText.trim()
      } : null
    }));
  };

  const handleConfirmAllocation = async () => {
    if (!allocModal.data?.allocationRunId) return;
    setAllocModal(p => ({ ...p, confirming: true }));
    try {
      await opsService.confirmAllocation(allocModal.data.allocationRunId);
      toast.success("Allocation run confirmed successfully!");
      setAllocModal({ open: false, data: null, confirming: false });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to confirm allocation run");
      setAllocModal(p => ({ ...p, confirming: false }));
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

      {/* ── EXCEL GRID 1: TRIP ITINERARY & VERIFICATION GRID ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider">{selectedTrip?.title || "TRIP ITINERARY & BOOKING VERIFICATION GRID"}</h2>
            <p className="text-[10px] text-emerald-200 font-medium">Daily stay, hotel verification, tempo verification, and check-in statuses.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowAddItinerary(true)} className="h-7 text-[10px] font-bold uppercase text-white hover:bg-emerald-700">
            <Plus className="w-3 h-3 mr-1" /> Add Day Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                <th className="p-2.5 text-left border-r border-slate-200">Date</th>
                <th className="p-2.5 text-left border-r border-slate-200">Stay / Pickup</th>
                <th className="p-2.5 text-center border-r border-slate-200">No. of Pax</th>
                <th className="p-2.5 text-left border-r border-amber-200 bg-amber-50/70 text-amber-900">🏨 Hotel Name</th>
                <th className="p-2.5 text-center border-r border-slate-200 bg-amber-50/70 text-amber-900">Hotel Verify</th>
                <th className="p-2.5 text-left border-r border-blue-200 bg-blue-50/70 text-blue-900">🚌 Tempo / Vehicle</th>
                <th className="p-2.5 text-center border-r border-slate-200 bg-blue-50/70 text-blue-900">Tempo Verify</th>
                <th className="p-2.5 text-left border-r border-slate-200">Remark</th>
                <th className="p-2.5 text-left border-r border-slate-200">Guide / Driver Details</th>
                <th className="p-2.5 text-center border-r border-slate-200">Check-In</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {itinerary.length === 0 ? (
                <tr><td colSpan={11} className="p-8 text-center text-slate-400 font-medium">No day itinerary rows yet for this departure. Click "Add Day Row" to build grid.</td></tr>
              ) : (
                itinerary.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 font-medium">
                    <td className="p-2.5 border-r border-slate-200 font-mono text-slate-600">{row.date ? new Date(row.date).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{row.dayTitle}</td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold">{row.paxCount}</td>
                    <td className="p-2.5 border-r border-amber-100 bg-amber-50/30 text-slate-800 font-semibold">{row.hotelName || "—"}</td>
                    <td className="p-2.5 border-r border-slate-200 bg-amber-50/30 text-center">
                      <button onClick={() => handleItinCheckToggle(row, "hotelVerified")} className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${row.hotelVerified ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                        {row.hotelVerified ? "BOOKED ✓" : "PENDING"}
                      </button>
                    </td>
                    <td className="p-2.5 border-r border-blue-100 bg-blue-50/30 text-slate-800 font-semibold">{row.vehicleType || "—"}</td>
                    <td className="p-2.5 border-r border-slate-200 bg-blue-50/30 text-center">
                      <button onClick={() => handleItinCheckToggle(row, "vehicleVerified")} className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${row.vehicleVerified ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                        {row.vehicleVerified ? "BOOKED ✓" : "PENDING"}
                      </button>
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-500 text-[11px]">{row.remarks || "—"}</td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-700 font-mono text-[11px]">{row.guideDriverDetails || "—"}</td>
                    <td className="p-2.5 border-r border-slate-200 text-center">
                      <input type="checkbox" checked={row.checkInDone} onChange={() => handleItinCheckToggle(row, "checkInDone")} className="w-4 h-4 rounded border-slate-300 accent-emerald-600 cursor-pointer" />
                    </td>
                    <td className="p-2.5 text-center">
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteItineraryRow(row.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Delete Row">
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

      {/* ── EXCEL GRID 2: TRIP PAYMENT DETAILS GRID ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider">TRIP PAYMENT & EXPENSE BREAKDOWN (EXCEL SYNC)</h2>
            <p className="text-[10px] text-slate-300 font-medium">Detailed ops costs, advance paid, due amounts, and calculation formulas.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowAddExpense(true)} className="h-7 text-[10px] font-bold uppercase text-white hover:bg-slate-700">
            <Plus className="w-3 h-3 mr-1" /> Add Expense Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                <th className="p-2.5 text-left border-r border-slate-200">Activity / Service Provided</th>
                <th className="p-2.5 text-left border-r border-slate-200">Payment Date</th>
                <th className="p-2.5 text-right border-r border-slate-200">Total Amount (₹)</th>
                <th className="p-2.5 text-right border-r border-slate-200">Amount Paid (₹)</th>
                <th className="p-2.5 text-right border-r border-slate-200">Due Amount (₹)</th>
                <th className="p-2.5 text-center border-r border-slate-200">Status</th>
                <th className="p-2.5 text-left border-r border-slate-200">Remark / Formula Breakdown</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-medium">No detailed expense records yet for this departure. Click "Add Expense Row" to enter costs.</td></tr>
              ) : (
                expenses.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 font-medium">
                    <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{row.activity}</td>
                    <td className="p-2.5 border-r border-slate-200 font-mono text-slate-600">{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-bold text-slate-900">₹{row.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right text-emerald-700 font-semibold">₹{row.amountPaid.toLocaleString("en-IN")}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right text-red-600 font-semibold">₹{row.dueAmount.toLocaleString("en-IN")}</td>
                    <td className="p-2.5 border-r border-slate-200 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${row.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-600 text-[11px] font-mono">{row.remarks || "—"}</td>
                    <td className="p-2.5 text-center">
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteExpenseRow(row.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Delete Row">
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

              {/* 💺 Feed / Customize Vehicle Seat Numbers */}
              {allocModal.data.vehicleAllocations?.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      💺 Feed / Custom Seat Assignment ({allocModal.data.vehicleAllocations.length} Travelers)
                    </p>
                    <span className="text-[10px] font-bold text-slate-500">Edit seat # below to customize</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                          <th className="p-2 text-left">Traveler Name</th>
                          <th className="p-2 text-left">Booking ID</th>
                          <th className="p-2 text-center w-28">Feed Seat #</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocModal.data.vehicleAllocations.map((va, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2 font-semibold text-slate-800">{va.travelerName}</td>
                            <td className="p-2 font-mono text-slate-500 text-[11px]">{va.bookingId}</td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={va.seatNumber || (idx + 1)}
                                onChange={(e) => handleSeatNumberChange(idx, e.target.value)}
                                className="w-16 h-7 text-center font-mono font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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

              {/* Room List Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">🏨 WhatsApp Room List</span>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] text-indigo-600 font-bold hover:bg-indigo-50"
                    onClick={() => { navigator.clipboard.writeText(allocModal.data!.whatsappRoomText); toast.success("Room list copied!"); }}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Text
                  </Button>
                </div>
                <textarea readOnly value={allocModal.data.whatsappRoomText} className="w-full h-40 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
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
    </div>
  );
}
