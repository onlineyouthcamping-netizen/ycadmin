/**
 * TrainTicketsPanel.tsx
 * Comprehensive Two-Way Train Ticketing Module (Departure + Return Journeys)
 * Includes Group Ticket Summary, Independent Journey Sections, and Passenger Matrix.
 */
import React, { useState, useEffect } from "react";
import {
  Train,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Ban,
  RefreshCw,
  History,
  ChevronDown,
  ChevronUp,
  Edit3,
  Send,
  Loader2,
  Mail,
  Users,
  ArrowRightLeft,
  ArrowRight,
  Check,
  Wand2,
  Phone,
} from "lucide-react";
import { normalizePassenger } from "@/utils/passengerUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  trainTicketService,
  type TrainTicket,
  type TrainTemplate,
} from "@/services/trainTicket.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import {
  cn,
  TRAIN_TICKET_STATUS_COLORS,
  TRAIN_TICKET_APPROVAL_COLORS,
} from "@/lib/utils";
import EmailComposerDrawer from "./EmailComposerDrawer";

const STATUS_COLORS = TRAIN_TICKET_STATUS_COLORS;

function StatusPill({ status }: { status: string }) {
  const s = (status || "PENDING").toUpperCase();
  const colorClass = STATUS_COLORS[s] || "bg-slate-100 text-slate-700";
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-transparent",
        colorClass,
      )}
    >
      {s.replace(/_/g, " ")}
    </span>
  );
}

const emptyForm = (defaultType: "DEPARTURE" | "RETURN" = "DEPARTURE") => ({
  travelerName: "",
  passengerReference: defaultType,
  pnr: "",
  trainName: "",
  trainNumber: "",
  journeyDate: "",
  sourceStation: "",
  destinationStation: "",
  coach: "",
  seatNumber: "",
  berthType: "",
  ticketAmount: "",
  amountMode: "PAYMENT_LINK",
  internalNote: "",
  ticketBookingPerson: "",
  ticketStatus: "PENDING" as const,
});

interface TrainTicketsPanelProps {
  bookingId: string;
  booking?: any;
  passengers?: any[];
  onCountChange?: (count: number) => void;
}

export default function TrainTicketsPanel({
  bookingId,
  booking,
  passengers = [],
  onCountChange,
}: TrainTicketsPanelProps) {
  const { admin } = useAuthStore();
  const role = admin?.role ?? "";

  const canApprove = [
    "superadmin",
    "admin",
    "operations",
    "BOOKING_VERIFIER",
  ].includes(role);
  const canManage = [
    "superadmin",
    "admin",
    "operations",
    "BOOKING_VERIFIER",
    "sales",
  ].includes(role);

  const [tickets, setTickets] = useState<TrainTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm("DEPARTURE"));
  const [activeJourneyTab, setActiveJourneyTab] = useState<
    "ALL" | "DEPARTURE" | "RETURN"
  >("ALL");
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // Email Drawer
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await trainTicketService.getTicketsByBooking(bookingId);
      setTickets(data || []);
      if (onCountChange) onCountChange(data.length);
    } catch (err: any) {
      console.error("Failed to load tickets", err);
      toast.error("Failed to load train tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) loadTickets();
  }, [bookingId]);

  // Separate Departure and Return tickets
  const departureTickets = tickets.filter(
    (t) => t.passengerReference !== "RETURN",
  );
  const returnTickets = tickets.filter(
    (t) => t.passengerReference === "RETURN",
  );

  // Summary Metrics helper
  const getSummaryCounts = (ticketList: TrainTicket[]) => {
    const counts = {
      CONFIRMED: 0,
      WAITLISTED: 0,
      RAC: 0,
      PENDING: 0,
      CANCELLED: 0,
      SELF_BOOKED: 0,
      BOOKED: 0,
    };

    ticketList.forEach((t) => {
      const st = (t.ticketStatus || "PENDING").toUpperCase();
      if (st in counts) counts[st as keyof typeof counts]++;
      else counts.PENDING++;
    });

    return counts;
  };

  const getTravelerPhone = (travelerName: string) => {
    if (!passengers || passengers.length === 0) {
      if (
        booking?.fullName &&
        travelerName.toLowerCase().includes(booking.fullName.toLowerCase())
      ) {
        return booking?.mobile || booking?.phone || "";
      }
      return booking?.mobile || booking?.phone || "";
    }
    const match = passengers.find((p: any, idx: number) => {
      const normP = normalizePassenger(booking, p, idx);
      return (
        normP.name.toLowerCase().includes(travelerName.toLowerCase()) ||
        travelerName.toLowerCase().includes(normP.name.toLowerCase())
      );
    });
    if (match) {
      const normP = normalizePassenger(booking, match);
      return normP.phone || "";
    }
    return booking?.mobile || booking?.phone || "";
  };

  const groupSize = Math.max(
    passengers.length || 0,
    booking?.numberOfTravelers || 1,
    tickets.length || 1,
  );
  const depCounts = getSummaryCounts(departureTickets);
  const retCounts = getSummaryCounts(returnTickets);
  const totalCounts = getSummaryCounts(tickets);

  const handleAutoGenerate = async () => {
    setActionBusy(true);
    try {
      const res = await trainTicketService.autoGenerateTickets(bookingId);
      toast.success(res.message || "Tickets auto-generated successfully");
      loadTickets();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to auto-generate tickets",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.travelerName.trim()) {
      toast.error("Traveler name is required");
      return;
    }

    setActionBusy(true);
    try {
      if (editingId) {
        await trainTicketService.updateTicket(editingId, {
          ...form,
          ticketAmount: parseFloat(form.ticketAmount) || 0,
        });
        toast.success("Ticket updated successfully");
      } else {
        await trainTicketService.createTicket(bookingId, {
          ...form,
          ticketAmount: parseFloat(form.ticketAmount) || 0,
        });
        toast.success("Ticket created successfully");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm("DEPARTURE"));
      loadTickets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save ticket");
    } finally {
      setActionBusy(false);
    }
  };

  const handleEdit = (ticket: TrainTicket) => {
    setEditingId(ticket.id);
    setForm({
      travelerName: ticket.travelerName || "",
      passengerReference:
        (ticket.passengerReference as "DEPARTURE" | "RETURN") || "DEPARTURE",
      pnr: ticket.pnr || "",
      trainName: ticket.trainName || "",
      trainNumber: ticket.trainNumber || "",
      journeyDate: ticket.journeyDate
        ? new Date(ticket.journeyDate).toISOString().split("T")[0]
        : "",
      sourceStation: ticket.sourceStation || "",
      destinationStation: ticket.destinationStation || "",
      coach: ticket.coach || "",
      seatNumber: ticket.seatNumber || "",
      berthType: ticket.berthType || "",
      ticketAmount: ticket.ticketAmount ? String(ticket.ticketAmount) : "",
      amountMode: ticket.amountMode || "PAYMENT_LINK",
      internalNote: ticket.internalNote || "",
      ticketBookingPerson: ticket.ticketBookingPerson || "",
      ticketStatus: (ticket.ticketStatus as any) || "PENDING",
    });
    setShowForm(true);
  };

  const handleDelete = async (ticketId: string, travelerName: string) => {
    if (!confirm(`Delete ticket for ${travelerName}?`)) return;
    setActionBusy(true);
    try {
      await trainTicketService.cancelTicket(ticketId, {
        reason: "Deleted by user",
      });
      toast.success("Ticket deleted/cancelled");
      loadTickets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete ticket");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      {/* ─── GROUP TICKET SUMMARY CARD (REQUIREMENT 4) ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <Train className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Group Ticketing Summary</h3>
              <p className="text-[10px] text-slate-300">
                Group Size:{" "}
                <span className="font-bold text-white">
                  {groupSize} Travelers
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="h-7 text-[10px] text-slate-300 hover:text-white hover:bg-slate-800 gap-1"
            >
              {isSummaryExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              {isSummaryExpanded
                ? "Collapse Matrix"
                : "Expand Passenger Matrix"}
            </Button>

            {canManage && (
              <>
                <Button
                  size="sm"
                  onClick={handleAutoGenerate}
                  disabled={actionBusy}
                  className="h-7 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white gap-1"
                >
                  {actionBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  Auto-Generate
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm("DEPARTURE"));
                    setShowForm(true);
                  }}
                  className="h-7 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Ticket
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Departure & Return Quick Status Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-200">
          {/* Departure Summary */}
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              <span>Departure Journey</span>
              <span>{departureTickets.length} Tickets</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                {depCounts.CONFIRMED} Confirmed
              </span>
              <span className="bg-amber-950/80 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                {depCounts.WAITLISTED} Waitlisted
              </span>
              <span className="bg-blue-950/80 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                {depCounts.RAC} RAC
              </span>
              <span className="bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                {depCounts.PENDING} Pending
              </span>
            </div>
          </div>

          {/* Return Summary */}
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-blue-400">
              <span>Return Journey</span>
              <span>{returnTickets.length} Tickets</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                {retCounts.CONFIRMED} Confirmed
              </span>
              <span className="bg-amber-950/80 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                {retCounts.WAITLISTED} Waitlisted
              </span>
              <span className="bg-blue-950/80 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                {retCounts.RAC} RAC
              </span>
              <span className="bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                {retCounts.PENDING} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Expandable Passenger Matrix */}
        {isSummaryExpanded && (
          <div className="pt-2 border-t border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-slate-400 uppercase border-b border-slate-800 text-[9px] font-bold">
                  <th className="py-1.5 px-2">Passenger</th>
                  <th className="py-1.5 px-2">Departure Ticket</th>
                  <th className="py-1.5 px-2">Return Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {(passengers.length > 0
                  ? passengers
                  : [{ name: booking?.fullName || "Lead Passenger" }]
                ).map((p: any, idx: number) => {
                  const pName = p.name || `Passenger ${idx + 1}`;
                  const depT = departureTickets.find(
                    (t) =>
                      t.travelerName
                        .toLowerCase()
                        .includes(pName.toLowerCase()) ||
                      pName
                        .toLowerCase()
                        .includes(t.travelerName.toLowerCase()),
                  );
                  const retT = returnTickets.find(
                    (t) =>
                      t.travelerName
                        .toLowerCase()
                        .includes(pName.toLowerCase()) ||
                      pName
                        .toLowerCase()
                        .includes(t.travelerName.toLowerCase()),
                  );

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-2 font-bold">
                        <div>{pName}</div>
                        {(() => {
                          const phone = getTravelerPhone(pName);
                          if (!phone || phone === "N/A") return null;
                          return (
                            <span className="block text-[9.5px] font-normal font-mono text-slate-400">
                              📞 {phone}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-2 px-2">
                        {depT ? (
                          <div className="flex items-center gap-1.5">
                            <StatusPill status={depT.ticketStatus} />
                            <span className="font-mono text-slate-300">
                              {depT.coach || "-"}-{depT.seatNumber || "-"}
                            </span>
                            {depT.pnr && (
                              <span className="font-mono text-slate-400 text-[9.5px]">
                                PNR: {depT.pnr}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">
                            Not issued
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {retT ? (
                          <div className="flex items-center gap-1.5">
                            <StatusPill status={retT.ticketStatus} />
                            <span className="font-mono text-slate-300">
                              {retT.coach || "-"}-{retT.seatNumber || "-"}
                            </span>
                            {retT.pnr && (
                              <span className="font-mono text-slate-400 text-[9.5px]">
                                PNR: {retT.pnr}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">
                            Not issued
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ADD/EDIT TICKET FORM ─── */}
      {showForm && (
        <form
          onSubmit={handleSaveTicket}
          className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
        >
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-bold text-slate-800 text-xs">
              {editingId ? "Edit Train Ticket" : "Create New Train Ticket"}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="h-6 text-[10px]"
            >
              Cancel
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Traveler Name *
              </label>
              <Input
                required
                value={form.travelerName}
                onChange={(e) =>
                  setForm({ ...form, travelerName: e.target.value })
                }
                placeholder="Full name"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Journey Type *
              </label>
              <Select
                value={form.passengerReference}
                onValueChange={(val: any) =>
                  setForm({ ...form, passengerReference: val })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEPARTURE">Departure Journey</SelectItem>
                  <SelectItem value="RETURN">Return Journey</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Ticket Status *
              </label>
              <Select
                value={form.ticketStatus}
                onValueChange={(val: any) =>
                  setForm({ ...form, ticketStatus: val })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                  <SelectItem value="WAITLISTED">WAITLISTED</SelectItem>
                  <SelectItem value="RAC">RAC</SelectItem>
                  <SelectItem value="BOOKED">BOOKED</SelectItem>
                  <SelectItem value="SELF_BOOKED">SELF BOOKED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                PNR Number
              </label>
              <Input
                value={form.pnr}
                onChange={(e) => setForm({ ...form, pnr: e.target.value })}
                placeholder="10-digit PNR"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Train Name / No.
              </label>
              <Input
                value={form.trainName}
                onChange={(e) =>
                  setForm({ ...form, trainName: e.target.value })
                }
                placeholder="e.g. Rajdhani Exp (12951)"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Journey Date
              </label>
              <Input
                type="date"
                value={form.journeyDate}
                onChange={(e) =>
                  setForm({ ...form, journeyDate: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Coach / Seat
              </label>
              <div className="grid grid-cols-2 gap-1">
                <Input
                  value={form.coach}
                  onChange={(e) => setForm({ ...form, coach: e.target.value })}
                  placeholder="Coach (e.g. B2)"
                  className="h-8 text-xs font-mono"
                />
                <Input
                  value={form.seatNumber}
                  onChange={(e) =>
                    setForm({ ...form, seatNumber: e.target.value })
                  }
                  placeholder="Seat (e.g. 36)"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Source Station
              </label>
              <Input
                value={form.sourceStation}
                onChange={(e) =>
                  setForm({ ...form, sourceStation: e.target.value })
                }
                placeholder="e.g. ADI"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Destination Station
              </label>
              <Input
                value={form.destinationStation}
                onChange={(e) =>
                  setForm({ ...form, destinationStation: e.target.value })
                }
                placeholder="e.g. NDLS"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={actionBusy}
              size="sm"
              className="h-8 text-xs bg-slate-900 text-white font-bold"
            >
              {actionBusy
                ? "Saving..."
                : editingId
                  ? "Update Ticket"
                  : "Save Ticket"}
            </Button>
          </div>
        </form>
      )}

      {/* ─── TWO-WAY JOURNEY SECTIONS (REQUIREMENT 3) ─── */}
      <div className="space-y-6">
        {/* Departure Journey Section */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
          <div className="px-4 py-3 bg-emerald-50/60 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Departure Journey ({departureTickets.length} Tickets)
              </h4>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm("DEPARTURE"));
                setShowForm(true);
              }}
              className="h-7 text-[10px] font-bold border-emerald-200 text-emerald-800 bg-white hover:bg-emerald-100 gap-1"
            >
              + Add Departure Ticket
            </Button>
          </div>

          {departureTickets.length === 0 ? (
            <div className="p-5 text-center text-slate-400 italic">
              No departure tickets created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-2">Traveler</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 font-mono">PNR</th>
                    <th className="px-4 py-2">Train / Route</th>
                    <th className="px-4 py-2">Coach & Seat</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departureTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-800">
                        <div>{t.travelerName}</div>
                        {(() => {
                          const phone = getTravelerPhone(t.travelerName);
                          if (!phone || phone === "N/A") return null;
                          return (
                            <a
                              href={`tel:${phone}`}
                              className="text-[10px] font-normal font-mono text-slate-500 hover:text-orange-600 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-3 h-3 text-slate-400 shrink-0 inline" />
                              <span>{phone}</span>
                            </a>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill status={t.ticketStatus} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-600 font-bold">
                        {t.pnr || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {t.trainName
                          ? `${t.trainName} (${t.trainNumber || ""})`
                          : "—"}
                        {t.sourceStation && (
                          <span className="block text-[10px] text-slate-400">
                            {t.sourceStation} &rarr; {t.destinationStation}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-700">
                        {t.coach ? `${t.coach}-${t.seatNumber || ""}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-1">
                        {canManage && (
                          <>
                            <button
                              onClick={() => handleEdit(t)}
                              className="text-blue-600 hover:underline font-bold text-[10px] px-1.5 py-0.5"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(t.id, t.travelerName)}
                              className="text-rose-600 hover:underline font-bold text-[10px] px-1.5 py-0.5"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Return Journey Section */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
          <div className="px-4 py-3 bg-blue-50/60 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Return Journey ({returnTickets.length} Tickets)
              </h4>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm("RETURN"));
                setShowForm(true);
              }}
              className="h-7 text-[10px] font-bold border-blue-200 text-blue-800 bg-white hover:bg-blue-100 gap-1"
            >
              + Add Return Ticket
            </Button>
          </div>

          {returnTickets.length === 0 ? (
            <div className="p-5 text-center text-slate-400 italic">
              No return tickets created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-2">Traveler</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 font-mono">PNR</th>
                    <th className="px-4 py-2">Train / Route</th>
                    <th className="px-4 py-2">Coach & Seat</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-800">
                        <div>{t.travelerName}</div>
                        {(() => {
                          const phone = getTravelerPhone(t.travelerName);
                          if (!phone || phone === "N/A") return null;
                          return (
                            <a
                              href={`tel:${phone}`}
                              className="text-[10px] font-normal font-mono text-slate-500 hover:text-orange-600 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-3 h-3 text-slate-400 shrink-0 inline" />
                              <span>{phone}</span>
                            </a>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill status={t.ticketStatus} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-600 font-bold">
                        {t.pnr || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {t.trainName
                          ? `${t.trainName} (${t.trainNumber || ""})`
                          : "—"}
                        {t.sourceStation && (
                          <span className="block text-[10px] text-slate-400">
                            {t.sourceStation} &rarr; {t.destinationStation}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-700">
                        {t.coach ? `${t.coach}-${t.seatNumber || ""}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-1">
                        {canManage && (
                          <>
                            <button
                              onClick={() => handleEdit(t)}
                              className="text-blue-600 hover:underline font-bold text-[10px] px-1.5 py-0.5"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(t.id, t.travelerName)}
                              className="text-rose-600 hover:underline font-bold text-[10px] px-1.5 py-0.5"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
