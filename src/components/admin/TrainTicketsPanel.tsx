/**
 * TrainTicketsPanel.tsx
 * Comprehensive Two-Way Train Ticketing Module (Departure + Return Journeys)
 * Includes Group Ticket Summary, Independent Journey Sections, and Passenger Matrix.
 */
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
  DollarSign,
  Receipt,
  Undo2,
  Split,
  Eye,
} from "lucide-react";
import { normalizePassenger } from "@/utils/passengerUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import api from "@/services/api";
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

function ApprovalPill({ status }: { status?: string }) {
  const s = (status || "DRAFT").toUpperCase();
  if (s === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
        Approved
      </span>
    );
  }
  if (s === "SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
        Pending Approval
      </span>
    );
  }
  if (s === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-2.5 h-2.5 text-rose-600" />
        Rejected
      </span>
    );
  }
  if (s === "REOPENED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
        <RefreshCw className="w-2.5 h-2.5 text-orange-600" />
        Reopened
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
      <Edit3 className="w-2.5 h-2.5 text-slate-500" />
      Draft
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
  paidBy: "COMPANY" as "COMPANY" | "CUSTOMER",
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

  // Approval & Rejection Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [ticketToReject, setTicketToReject] = useState<TrainTicket | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState<TrainTicket | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRailwayCharge, setCancelRailwayCharge] = useState("0");
  const [cancelYcCharge, setCancelYcCharge] = useState("0");
  const [cancelNotes, setCancelNotes] = useState("");

  // Reticketing Modal
  const [reticketModalOpen, setReticketModalOpen] = useState(false);
  const [ticketToReticket, setTicketToReticket] = useState<TrainTicket | null>(null);
  const [reticketReason, setReticketReason] = useState("");
  const [reticketTrainName, setReticketTrainName] = useState("");
  const [reticketTrainNumber, setReticketTrainNumber] = useState("");
  const [reticketDate, setReticketDate] = useState("");
  const [reticketSource, setReticketSource] = useState("");
  const [reticketDest, setReticketDest] = useState("");
  const [reticketCoach, setReticketCoach] = useState("");
  const [reticketSeat, setReticketSeat] = useState("");
  const [reticketClass, setReticketClass] = useState("");
  const [reticketNewCost, setReticketNewCost] = useState("");
  const [reticketRailwayCharge, setReticketRailwayCharge] = useState("0");
  const [reticketYcCharge, setReticketYcCharge] = useState("0");
  const [reticketNotes, setReticketNotes] = useState("");

  // Record Refund Modal
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [ticketForRefund, setTicketForRefund] = useState<TrainTicket | null>(null);
  const [refundStatus, setRefundStatus] = useState("COMPLETED");
  const [refundTxRef, setRefundTxRef] = useState("");
  const [refundCustomAmount, setRefundCustomAmount] = useState("0");
  const [refundNotes, setRefundNotes] = useState("");

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Email Drawer
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Trip Train Ticket Template state
  const [tripTemplate, setTripTemplate] = useState<any>(null);

  useEffect(() => {
    const tripId = booking?.tripId || booking?.tripRef?.id;
    if (tripId) {
      api
        .get(`/trips/${tripId}/train-template`)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setTripTemplate(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [booking?.tripId, booking?.tripRef?.id]);

  const getMatchingLegTemplate = (
    journeyType: "DEPARTURE" | "RETURN",
    targetClass?: string,
  ) => {
    if (!tripTemplate) return null;
    let selectedTier = tripTemplate;
    const cls = (
      targetClass ||
      booking?.packageType ||
      booking?.travelClass ||
      ""
    ).toUpperCase();

    if (Array.isArray(tripTemplate.tiers) && tripTemplate.tiers.length > 0) {
      if (cls) {
        selectedTier =
          tripTemplate.tiers.find(
            (t: any) =>
              t.classCode?.toUpperCase() === cls ||
              (cls.includes("SLEEP") && t.classCode === "SL") ||
              (cls.includes("3A") && t.classCode === "3A") ||
              (cls.includes("2A") && t.classCode === "2A") ||
              (cls.includes("3E") && t.classCode === "3E") ||
              t.name?.toUpperCase().includes(cls),
          ) || tripTemplate.tiers[0];
      } else {
        selectedTier = tripTemplate.tiers[0];
      }
    }

    return journeyType === "RETURN"
      ? selectedTier?.returnJourney
      : selectedTier?.departureJourney;
  };

  const handleFillFromTemplate = (
    journeyType?: "DEPARTURE" | "RETURN",
    targetClass?: string,
  ) => {
    const legType =
      journeyType ||
      (form.passengerReference as "DEPARTURE" | "RETURN") ||
      "DEPARTURE";
    const tmpl = getMatchingLegTemplate(legType, targetClass || form.coach);
    if (!tmpl) {
      toast.error("No template found for this trip");
      return;
    }

    setForm((prev) => ({
      ...prev,
      sourceStation: tmpl.boardingStation || prev.sourceStation,
      destinationStation: tmpl.destination || prev.destinationStation,
      trainName: tmpl.trainName || prev.trainName,
      trainNumber: tmpl.trainNumber || prev.trainNumber,
      coach: tmpl.class || prev.coach,
      berthType: tmpl.quota || prev.berthType,
      ticketAmount: tmpl.expectedCost
        ? String(tmpl.expectedCost)
        : prev.ticketAmount,
      journeyDate:
        prev.journeyDate ||
        (legType === "RETURN"
          ? booking?.returnDate
            ? new Date(booking.returnDate).toISOString().split("T")[0]
            : ""
          : booking?.departureDate
            ? new Date(booking.departureDate).toISOString().split("T")[0]
            : ""),
    }));
    toast.success(`Filled details from Trip ${legType} Template!`);
  };

  const handleSyncTemplate = async () => {
    setActionBusy(true);
    try {
      const res = await trainTicketService.syncTicketsWithTemplate(bookingId);
      toast.success(res.message || "Tickets synced with Trip Template!");
      loadTickets();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to sync tickets with template",
      );
    } finally {
      setActionBusy(false);
    }
  };

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

  // Approval Handlers
  const handleApproveTicket = async (t: TrainTicket) => {
    try {
      await trainTicketService.approveTicket(t.id);
      toast.success(`Ticket for ${t.travelerName} approved! ✓`);
      loadTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve ticket");
    }
  };

  const handleSubmitTicket = async (t: TrainTicket) => {
    try {
      await trainTicketService.submitTicket(t.id);
      toast.success(`Ticket for ${t.travelerName} submitted for approval`);
      loadTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit ticket");
    }
  };

  const handleOpenReject = (t: TrainTicket) => {
    setTicketToReject(t);
    setRejectionNotes("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!ticketToReject) return;
    setIsRejecting(true);
    try {
      await trainTicketService.rejectTicket(ticketToReject.id, rejectionNotes);
      toast.success(`Ticket for ${ticketToReject.travelerName} rejected`);
      setRejectModalOpen(false);
      setTicketToReject(null);
      loadTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject ticket");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleReopenTicket = async (t: TrainTicket) => {
    try {
      await trainTicketService.reopenTicket(t.id, "Reopened for updates");
      toast.success(`Ticket for ${t.travelerName} reopened to draft status`);
      loadTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reopen ticket");
    }
  };

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

  const handleOpenAddDeparture = () => {
    setEditingId(null);
    const tmpl = getMatchingLegTemplate("DEPARTURE");
    const init = emptyForm("DEPARTURE");
    if (tmpl) {
      init.sourceStation = tmpl.boardingStation || "";
      init.destinationStation = tmpl.destination || "";
      init.trainName = tmpl.trainName || "";
      init.trainNumber = tmpl.trainNumber || "";
      init.coach = tmpl.class || "";
      init.berthType = tmpl.quota || "";
      init.ticketAmount = tmpl.expectedCost ? String(tmpl.expectedCost) : "";
    }
    if (booking?.departureDate) {
      init.journeyDate = new Date(booking.departureDate)
        .toISOString()
        .split("T")[0];
    }
    if (passengers && passengers.length > 0) {
      const p = normalizePassenger(booking, passengers[0], 0);
      init.travelerName = p.name || booking?.fullName || "";
    } else {
      init.travelerName = booking?.fullName || booking?.name || "";
    }
    setForm(init);
    setShowForm(true);
  };

  const handleOpenAddReturn = () => {
    setEditingId(null);
    const tmpl = getMatchingLegTemplate("RETURN");
    const init = emptyForm("RETURN");
    if (tmpl) {
      init.sourceStation = tmpl.boardingStation || "";
      init.destinationStation = tmpl.destination || "";
      init.trainName = tmpl.trainName || "";
      init.trainNumber = tmpl.trainNumber || "";
      init.coach = tmpl.class || "";
      init.berthType = tmpl.quota || "";
      init.ticketAmount = tmpl.expectedCost ? String(tmpl.expectedCost) : "";
    }
    if (booking?.returnDate) {
      init.journeyDate = new Date(booking.returnDate)
        .toISOString()
        .split("T")[0];
    }
    if (passengers && passengers.length > 0) {
      const p = normalizePassenger(booking, passengers[0], 0);
      init.travelerName = p.name || booking?.fullName || "";
    } else {
      init.travelerName = booking?.fullName || booking?.name || "";
    }
    setForm(init);
    setShowForm(true);
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
      paidBy: (ticket.paidBy as "COMPANY" | "CUSTOMER") || "COMPANY",
      amountMode: ticket.amountMode || "PAYMENT_LINK",
      internalNote: ticket.internalNote || "",
      ticketBookingPerson: ticket.ticketBookingPerson || "",
      ticketStatus: (ticket.ticketStatus as any) || "PENDING",
    });
    setShowForm(true);
  };

  const handleOpenCancel = (ticket: TrainTicket) => {
    setTicketToCancel(ticket);
    setCancelReason("");
    setCancelRailwayCharge(String(ticket.railwayCancellationCharge || 0));
    setCancelYcCharge(String(ticket.ycCancellationCharge || 0));
    setCancelNotes("");
    setCancelModalOpen(true);
  };

  const handleSubmitCancel = async () => {
    if (!ticketToCancel) return;
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }
    setActionBusy(true);
    try {
      const rCharge = parseFloat(cancelRailwayCharge) || 0;
      const yCharge = parseFloat(cancelYcCharge) || 0;
      const origCost = Number(ticketToCancel.ticketAmount || 0);
      const calculatedRefund = Math.max(0, origCost - rCharge - yCharge);

      await trainTicketService.cancelTicket(ticketToCancel.id, {
        reason: cancelReason,
        railwayCancellationCharge: rCharge,
        ycCancellationCharge: yCharge,
        refundAmount: calculatedRefund,
        notes: cancelNotes,
      });
      toast.success("Ticket cancelled and refund recorded");
      setCancelModalOpen(false);
      setTicketToCancel(null);
      loadTickets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel ticket");
    } finally {
      setActionBusy(false);
    }
  };

  const handleOpenReticket = (ticket: TrainTicket) => {
    setTicketToReticket(ticket);
    setReticketReason("Reticketing / Schedule Change");
    setReticketTrainName(ticket.trainName || "");
    setReticketTrainNumber(ticket.trainNumber || "");
    setReticketDate(
      ticket.journeyDate
        ? new Date(ticket.journeyDate).toISOString().split("T")[0]
        : ""
    );
    setReticketSource(ticket.sourceStation || "");
    setReticketDest(ticket.destinationStation || "");
    setReticketCoach(ticket.coach || "");
    setReticketSeat("");
    setReticketClass(ticket.berthType || "");
    setReticketNewCost(ticket.ticketAmount ? String(ticket.ticketAmount) : "");
    setReticketRailwayCharge("0");
    setReticketYcCharge("0");
    setReticketNotes("");
    setReticketModalOpen(true);
  };

  const handleSubmitReticket = async () => {
    if (!ticketToReticket) return;
    setActionBusy(true);
    try {
      await trainTicketService.rebookTicket(ticketToReticket.id, {
        reason: reticketReason,
        newTrainName: reticketTrainName,
        newTrainNumber: reticketTrainNumber,
        newJourneyDate: reticketDate,
        newSource: reticketSource,
        newDestination: reticketDest,
        newCoach: reticketCoach,
        newSeat: reticketSeat,
        newClass: reticketClass,
        newTicketAmount: parseFloat(reticketNewCost) || 0,
        railwayCancellationCharge: parseFloat(reticketRailwayCharge) || 0,
        ycCancellationCharge: parseFloat(reticketYcCharge) || 0,
        notes: reticketNotes,
      });
      toast.success("Ticket reticketed successfully");
      setReticketModalOpen(false);
      setTicketToReticket(null);
      loadTickets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reticket");
    } finally {
      setActionBusy(false);
    }
  };

  const handleOpenRefund = (ticket: TrainTicket) => {
    setTicketForRefund(ticket);
    setRefundStatus("COMPLETED");
    setRefundTxRef(ticket.refundTransactionRef || "");
    setRefundCustomAmount(String(ticket.refundAmount || 0));
    setRefundNotes("");
    setRefundModalOpen(true);
  };

  const handleSubmitRefund = async () => {
    if (!ticketForRefund) return;
    setActionBusy(true);
    try {
      await trainTicketService.recordRefund(ticketForRefund.id, {
        refundStatus,
        transactionRef: refundTxRef,
        amount: parseFloat(refundCustomAmount) || 0,
        notes: refundNotes,
      });
      toast.success("Refund status updated in Finance");
      setRefundModalOpen(false);
      setTicketForRefund(null);
      loadTickets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record refund");
    } finally {
      setActionBusy(false);
    }
  };

  const handleViewHistory = async (ticketId: string) => {
    setHistoryLoading(true);
    setHistoryModalOpen(true);
    try {
      const hist = await trainTicketService.getTicketHistory(ticketId);
      setTicketHistory(hist || []);
    } catch (err) {
      toast.error("Failed to load ticket history");
      setTicketHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (ticketId: string, travelerName: string) => {
    if (!confirm(`Cancel/Delete ticket for ${travelerName}?`)) return;
    setActionBusy(true);
    try {
      await trainTicketService.cancelTicket(ticketId, {
        reason: "Deleted by user",
      });
      toast.success("Ticket cancelled");
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
                  onClick={handleSyncTemplate}
                  disabled={actionBusy}
                  className="h-7 text-[10px] font-bold bg-orange-600 hover:bg-orange-500 text-white gap-1 shadow-xs cursor-pointer"
                >
                  {actionBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Sync Trip Template
                </Button>
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusPill status={depT.ticketStatus} />
                            <ApprovalPill status={depT.approvalStatus} />
                            <span className="font-mono font-bold text-slate-200">
                              {depT.pnr ? `PNR: ${depT.pnr}` : "No PNR"}
                            </span>
                            {depT.trainName && (
                              <span className="text-slate-400 text-[10px] truncate max-w-[140px]" title={depT.trainName}>
                                • {depT.trainName}
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusPill status={retT.ticketStatus} />
                            <ApprovalPill status={retT.approvalStatus} />
                            <span className="font-mono font-bold text-slate-200">
                              {retT.pnr ? `PNR: ${retT.pnr}` : "No PNR"}
                            </span>
                            {retT.trainName && (
                              <span className="text-slate-400 text-[10px] truncate max-w-[140px]" title={retT.trainName}>
                                • {retT.trainName}
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
          <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
            <h4 className="font-bold text-slate-800 text-xs">
              {editingId ? "Edit Train Ticket" : "Create New Train Ticket"}
            </h4>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFillFromTemplate()}
                className="h-6 text-[10px] font-bold text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 gap-1 cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Fill from Trip Template
              </Button>
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
                Paid By *
              </label>
              <Select
                value={form.paidBy}
                onValueChange={(val: any) =>
                  setForm({ ...form, paidBy: val })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPANY">Company Paid (Included in Package)</SelectItem>
                  <SelectItem value="CUSTOMER">Customer Paid (Addon / Direct)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Internal Ticket Cost (₹)
              </label>
              <Input
                type="number"
                value={form.ticketAmount}
                onChange={(e) => setForm({ ...form, ticketAmount: e.target.value })}
                placeholder="e.g. 1850"
                className="h-8 text-xs font-bold text-emerald-600"
              />
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

      {/* ─── TWO-WAY JOURNEY SECTIONS ─── */}
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
              onClick={handleOpenAddDeparture}
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
                    <th className="px-4 py-2">Status & Lifecycle</th>
                    <th className="px-4 py-2 font-mono">PNR</th>
                    <th className="px-4 py-2">Train Name & Route</th>
                    <th className="px-4 py-2">Internal Cost</th>
                    <th className="px-4 py-2">Approval & Actions</th>
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
                      <td className="px-4 py-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusPill status={t.ticketStatus} />
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                              t.paidBy === "CUSTOMER"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-slate-100 text-slate-700 border-slate-200",
                            )}
                          >
                            {t.paidBy === "CUSTOMER" ? "Customer Paid" : "Company Paid"}
                          </span>
                        </div>
                        {t.ticketStatus === "CANCELLED" && (
                          <div className="text-[10px] text-rose-600 font-semibold space-y-0.5">
                            <div>Cancelled: {t.cancellationReason || "No reason"}</div>
                            {Number(t.railwayCancellationCharge || 0) > 0 && (
                              <div className="text-[9px] text-slate-500 font-normal">
                                Railway Deduction: ₹{Number(t.railwayCancellationCharge)}
                              </div>
                            )}
                            {Number(t.refundAmount || 0) > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-bold text-emerald-700">
                                  Refund: ₹{Number(t.refundAmount)}
                                </span>
                                <span
                                  className={cn(
                                    "px-1 py-0.2 rounded text-[8px] font-bold uppercase",
                                    t.refundStatus === "COMPLETED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800",
                                  )}
                                >
                                  {t.refundStatus || "PENDING"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {t.supersedesTicketId && (
                          <div className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                            ↳ Reticketed from #{t.supersedesTicketId.slice(-6)}
                          </div>
                        )}
                        {t.supersededByTicketId && (
                          <div className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                            ↳ Replaced by #{t.supersededByTicketId.slice(-6)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-800 font-black">
                        {t.pnr ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-mono">
                            {t.pnr}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No PNR</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 font-medium">
                        <div className="font-bold text-slate-900">
                          {t.trainName || "—"} {t.trainNumber ? `(${t.trainNumber})` : ""}
                        </div>
                        {t.sourceStation && (
                          <span className="block text-[10px] text-slate-400">
                            {t.sourceStation} &rarr; {t.destinationStation}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">
                        ₹{Number(t.ticketAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ApprovalPill status={t.approvalStatus} />
                          {canApprove && t.approvalStatus === "SUBMITTED" && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleApproveTicket(t)}
                                className="h-6 text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0 gap-1 rounded shadow-xs"
                                title="Approve Ticket"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReject(t)}
                                className="h-6 text-[9px] text-rose-600 border-rose-200 hover:bg-rose-50 font-bold px-2 py-0 gap-1 rounded"
                                title="Reject Ticket"
                              >
                                <Ban className="w-3 h-3" /> Reject
                              </Button>
                            </div>
                          )}
                          {canManage && (t.approvalStatus === "DRAFT" || !t.approvalStatus) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSubmitTicket(t)}
                              className="h-6 text-[9px] text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100 font-bold px-2 py-0 gap-1 rounded"
                              title="Submit for Manager Approval"
                            >
                              <Send className="w-2.5 h-2.5" /> Submit
                            </Button>
                          )}
                          {canManage && t.approvalStatus === "REJECTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReopenTicket(t)}
                              className="h-6 text-[9px] text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold px-2 py-0 gap-1 rounded"
                              title="Reopen Ticket to Draft"
                            >
                              <RotateCcw className="w-2.5 h-2.5" /> Reopen
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-1.5 whitespace-nowrap">
                        {canManage && (
                          <>
                            {t.ticketStatus !== "CANCELLED" && (
                              <>
                                <button
                                  onClick={() => handleEdit(t)}
                                  className="text-blue-600 hover:underline font-bold text-[10px] px-1 py-0.5"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleOpenReticket(t)}
                                  className="text-indigo-600 hover:underline font-bold text-[10px] px-1 py-0.5"
                                  title="Reticket to different date/train"
                                >
                                  Reticket
                                </button>
                                <button
                                  onClick={() => handleOpenCancel(t)}
                                  className="text-rose-600 hover:underline font-bold text-[10px] px-1 py-0.5"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {t.ticketStatus === "CANCELLED" && Number(t.refundAmount || 0) > 0 && t.refundStatus !== "COMPLETED" && (
                              <button
                                onClick={() => handleOpenRefund(t)}
                                className="text-emerald-700 hover:underline font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                              >
                                Record Refund
                              </button>
                            )}
                            <button
                              onClick={() => handleViewHistory(t.id)}
                              className="text-slate-500 hover:text-slate-800 font-bold text-[10px] px-1 py-0.5"
                              title="Audit History"
                            >
                              History
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
              onClick={handleOpenAddReturn}
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
                    <th className="px-4 py-2">Status & Lifecycle</th>
                    <th className="px-4 py-2 font-mono">PNR</th>
                    <th className="px-4 py-2">Train Name & Route</th>
                    <th className="px-4 py-2">Internal Cost</th>
                    <th className="px-4 py-2">Approval & Actions</th>
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
                      <td className="px-4 py-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusPill status={t.ticketStatus} />
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                              t.paidBy === "CUSTOMER"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-slate-100 text-slate-700 border-slate-200",
                            )}
                          >
                            {t.paidBy === "CUSTOMER" ? "Customer Paid" : "Company Paid"}
                          </span>
                        </div>
                        {t.ticketStatus === "CANCELLED" && (
                          <div className="text-[10px] text-rose-600 font-semibold space-y-0.5">
                            <div>Cancelled: {t.cancellationReason || "No reason"}</div>
                            {Number(t.railwayCancellationCharge || 0) > 0 && (
                              <div className="text-[9px] text-slate-500 font-normal">
                                Railway Deduction: ₹{Number(t.railwayCancellationCharge)}
                              </div>
                            )}
                            {Number(t.refundAmount || 0) > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-bold text-emerald-700">
                                  Refund: ₹{Number(t.refundAmount)}
                                </span>
                                <span
                                  className={cn(
                                    "px-1 py-0.2 rounded text-[8px] font-bold uppercase",
                                    t.refundStatus === "COMPLETED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800",
                                  )}
                                >
                                  {t.refundStatus || "PENDING"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {t.supersedesTicketId && (
                          <div className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                            ↳ Reticketed from #{t.supersedesTicketId.slice(-6)}
                          </div>
                        )}
                        {t.supersededByTicketId && (
                          <div className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                            ↳ Replaced by #{t.supersededByTicketId.slice(-6)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-800 font-black">
                        {t.pnr ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-mono">
                            {t.pnr}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No PNR</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 font-medium">
                        <div className="font-bold text-slate-900">
                          {t.trainName || "—"} {t.trainNumber ? `(${t.trainNumber})` : ""}
                        </div>
                        {t.sourceStation && (
                          <span className="block text-[10px] text-slate-400">
                            {t.sourceStation} &rarr; {t.destinationStation}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">
                        ₹{Number(t.ticketAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ApprovalPill status={t.approvalStatus} />
                          {canApprove && t.approvalStatus === "SUBMITTED" && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleApproveTicket(t)}
                                className="h-6 text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0 gap-1 rounded shadow-xs"
                                title="Approve Ticket"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReject(t)}
                                className="h-6 text-[9px] text-rose-600 border-rose-200 hover:bg-rose-50 font-bold px-2 py-0 gap-1 rounded"
                                title="Reject Ticket"
                              >
                                <Ban className="w-3 h-3" /> Reject
                              </Button>
                            </div>
                          )}
                          {canManage && (t.approvalStatus === "DRAFT" || !t.approvalStatus) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSubmitTicket(t)}
                              className="h-6 text-[9px] text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100 font-bold px-2 py-0 gap-1 rounded"
                              title="Submit for Manager Approval"
                            >
                              <Send className="w-2.5 h-2.5" /> Submit
                            </Button>
                          )}
                          {canManage && t.approvalStatus === "REJECTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReopenTicket(t)}
                              className="h-6 text-[9px] text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold px-2 py-0 gap-1 rounded"
                              title="Reopen Ticket to Draft"
                            >
                              <RotateCcw className="w-2.5 h-2.5" /> Reopen
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-1.5 whitespace-nowrap">
                        {canManage && (
                          <>
                            {t.ticketStatus !== "CANCELLED" && (
                              <>
                                <button
                                  onClick={() => handleEdit(t)}
                                  className="text-blue-600 hover:underline font-bold text-[10px] px-1 py-0.5"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleOpenReticket(t)}
                                  className="text-indigo-600 hover:underline font-bold text-[10px] px-1 py-0.5"
                                  title="Reticket to different date/train"
                                >
                                  Reticket
                                </button>
                                <button
                                  onClick={() => handleOpenCancel(t)}
                                  className="text-rose-600 hover:underline font-bold text-[10px] px-1 py-0.5"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {t.ticketStatus === "CANCELLED" && Number(t.refundAmount || 0) > 0 && t.refundStatus !== "COMPLETED" && (
                              <button
                                onClick={() => handleOpenRefund(t)}
                                className="text-emerald-700 hover:underline font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                              >
                                Record Refund
                              </button>
                            )}
                            <button
                              onClick={() => handleViewHistory(t.id)}
                              className="text-slate-500 hover:text-slate-800 font-bold text-[10px] px-1 py-0.5"
                              title="Audit History"
                            >
                              History
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

      {/* ─── CANCELLATION DIALOG ─── */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" /> Cancel Train Ticket
            </DialogTitle>
          </DialogHeader>
          {ticketToCancel && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{ticketToCancel.travelerName}</span>
                  <span className="font-mono">PNR: {ticketToCancel.pnr || "N/A"}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {ticketToCancel.trainName} ({ticketToCancel.trainNumber}) • Coach {ticketToCancel.coach || "-"}-{ticketToCancel.seatNumber || "-"}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 pt-1 border-t border-slate-200 mt-1 flex justify-between">
                  <span>Current Ticket Internal Cost:</span>
                  <span>₹{Number(ticketToCancel.ticketAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">
                    Railway Cancellation Fee (₹)
                  </label>
                  <Input
                    type="number"
                    value={cancelRailwayCharge}
                    onChange={(e) => setCancelRailwayCharge(e.target.value)}
                    placeholder="e.g. 500"
                    className="h-8 text-xs font-mono font-bold text-rose-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">
                    YC Cancellation Fee (₹)
                  </label>
                  <Input
                    type="number"
                    value={cancelYcCharge}
                    onChange={(e) => setCancelYcCharge(e.target.value)}
                    placeholder="e.g. 100"
                    className="h-8 text-xs font-mono font-bold text-slate-700"
                  />
                </div>
              </div>

              {/* Real-time refund due calculation */}
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded flex justify-between items-center">
                <span className="font-bold text-emerald-800 text-[11px]">Net Refund Due / Credit:</span>
                <span className="font-extrabold text-sm text-emerald-700 font-mono">
                  ₹{Math.max(
                    0,
                    Number(ticketToCancel.ticketAmount || 0) -
                      (parseFloat(cancelRailwayCharge) || 0) -
                      (parseFloat(cancelYcCharge) || 0),
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">
                  Cancellation Reason *
                </label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer requested date change / IRCTC confirmed WL cancellation"
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">
                  Internal Notes
                </label>
                <Textarea
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="Optional notes for finance and operations logs"
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              className="h-8 text-xs"
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={actionBusy || !cancelReason.trim()}
              onClick={handleSubmitCancel}
              size="sm"
              className="h-8 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {actionBusy ? "Processing..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── RETICKETING DIALOG ─── */}
      <Dialog open={reticketModalOpen} onOpenChange={setReticketModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-indigo-600" /> Reticket Passenger
            </DialogTitle>
          </DialogHeader>
          {ticketToReticket && (
            <div className="space-y-3 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{ticketToReticket.travelerName}</span>
                  <span>Old Cost: ₹{Number(ticketToReticket.ticketAmount || 0)}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Old: {ticketToReticket.trainName} ({ticketToReticket.trainNumber}) • PNR {ticketToReticket.pnr || "N/A"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">
                    Old Railway Deduction (₹)
                  </label>
                  <Input
                    type="number"
                    value={reticketRailwayCharge}
                    onChange={(e) => setReticketRailwayCharge(e.target.value)}
                    placeholder="0"
                    className="h-8 text-xs font-mono font-bold text-rose-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">
                    New Ticket Fare / Cost (₹) *
                  </label>
                  <Input
                    type="number"
                    value={reticketNewCost}
                    onChange={(e) => setReticketNewCost(e.target.value)}
                    placeholder="e.g. 2100"
                    className="h-8 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Net financial difference preview */}
              {(() => {
                const oldCost = Number(ticketToReticket.ticketAmount || 0);
                const rCharge = parseFloat(reticketRailwayCharge) || 0;
                const oldRefund = Math.max(0, oldCost - rCharge);
                const newCost = parseFloat(reticketNewCost) || 0;
                const netDiff = newCost - oldRefund;
                return (
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded flex justify-between items-center">
                    <div>
                      <div className="font-bold text-indigo-900 text-[11px]">Net Financial Adjustment:</div>
                      <div className="text-[9px] text-indigo-700">
                        New Fare (₹{newCost}) - Old Refund Due (₹{oldRefund})
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-indigo-900 font-mono">
                      {netDiff >= 0 ? `+₹${netDiff.toLocaleString("en-IN")}` : `-₹${Math.abs(netDiff).toLocaleString("en-IN")}`}
                    </span>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">
                    New Train Name
                  </label>
                  <Input
                    value={reticketTrainName}
                    onChange={(e) => setReticketTrainName(e.target.value)}
                    placeholder="Train Name"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">
                    New Train Number
                  </label>
                  <Input
                    value={reticketTrainNumber}
                    onChange={(e) => setReticketTrainNumber(e.target.value)}
                    placeholder="Train Number"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">
                    New Journey Date
                  </label>
                  <Input
                    type="date"
                    value={reticketDate}
                    onChange={(e) => setReticketDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">
                    Coach & Seat
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    <Input
                      value={reticketCoach}
                      onChange={(e) => setReticketCoach(e.target.value)}
                      placeholder="Coach"
                      className="h-8 text-xs"
                    />
                    <Input
                      value={reticketSeat}
                      onChange={(e) => setReticketSeat(e.target.value)}
                      placeholder="Seat"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">
                  Reason for Reticketing
                </label>
                <Input
                  value={reticketReason}
                  onChange={(e) => setReticketReason(e.target.value)}
                  placeholder="e.g. Flight delay, preferred early departure"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReticketModalOpen(false)}
              className="h-8 text-xs"
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={actionBusy}
              onClick={handleSubmitReticket}
              size="sm"
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              {actionBusy ? "Rebooking..." : "Create Rebooked Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── RECORD REFUND DIALOG ─── */}
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> Record Refund in Finance
            </DialogTitle>
          </DialogHeader>
          {ticketForRefund && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">{ticketForRefund.travelerName}</div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Refund Due:</span>
                  <span>₹{Number(ticketForRefund.refundAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">
                  Refund Status *
                </label>
                <Select value={refundStatus} onValueChange={setRefundStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="INITIATED">INITIATED</SelectItem>
                    <SelectItem value="FAILED">FAILED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">
                  Transaction / UTR Reference
                </label>
                <Input
                  value={refundTxRef}
                  onChange={(e) => setRefundTxRef(e.target.value)}
                  placeholder="e.g. UTR194829482 or IRCTC-REF-992"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">
                  Confirmed Refund Amount (₹)
                </label>
                <Input
                  type="number"
                  value={refundCustomAmount}
                  onChange={(e) => setRefundCustomAmount(e.target.value)}
                  className="h-8 text-xs font-mono font-bold text-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">
                  Internal Notes
                </label>
                <Textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Bank details or credit notes reference"
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRefundModalOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={actionBusy}
              onClick={handleSubmitRefund}
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {actionBusy ? "Saving..." : "Save Refund Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── AUDIT HISTORY DIALOG ─── */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" /> Ticket Audit History
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 max-h-[60vh] overflow-y-auto space-y-2 text-xs">
            {historyLoading ? (
              <div className="py-8 text-center text-slate-400">Loading audit history...</div>
            ) : ticketHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic">No history logged yet.</div>
            ) : (
              ticketHistory.map((item, i) => (
                <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                      {item.action}
                    </span>
                    <span className="text-slate-400">
                      {new Date(item.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {item.notes && <div className="text-[11px] text-slate-700">{item.notes}</div>}
                  {item.changedByAdmin?.name && (
                    <div className="text-[9px] text-slate-400">
                      By: {item.changedByAdmin.name} ({item.changedByAdmin.email})
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHistoryModalOpen(false)}
              className="h-8 text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ─── REJECTION DIALOG ─── */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" /> Reject Train Ticket
            </DialogTitle>
          </DialogHeader>
          {ticketToReject && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded text-rose-900 space-y-0.5">
                <div className="font-bold">
                  {ticketToReject.travelerName} • PNR: {ticketToReject.pnr || "—"}
                </div>
                <div className="text-[11px] text-rose-700">
                  {ticketToReject.trainName} ({ticketToReject.trainNumber || "N/A"})
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">
                  Reason for Rejection *
                </label>
                <Textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Incorrect train route, PNR mismatch, or wrong journey date..."
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isRejecting || !rejectionNotes.trim()}
              onClick={handleConfirmReject}
              size="sm"
              className="h-8 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {isRejecting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
