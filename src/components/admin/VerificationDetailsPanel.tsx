import { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Clock, Send, Train, FileText, User, ChevronRight, Plus, Eye, History, AlertTriangle, ArrowRightLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingVerificationService } from "@/services/bookingVerification.service";
import { trainTicketService, type TrainTicket, type TrainTemplate } from "@/services/trainTicket.service";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import TrainTicketsPanel from "./TrainTicketsPanel";

// ── STATUS BADGE COLORS ──
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:                  { bg: "bg-gray-100",   text: "text-gray-600",   label: "Draft" },
  PENDING_VERIFICATION:   { bg: "bg-amber-50",   text: "text-amber-700",  label: "Pending Verification" },
  CHANGES_REQUESTED:      { bg: "bg-orange-50",  text: "text-orange-700", label: "Changes Requested" },
  VERIFIED:               { bg: "bg-emerald-50", text: "text-emerald-700", label: "Verified" },
  APPROVED:               { bg: "bg-emerald-50", text: "text-emerald-700", label: "Approved" },
  REJECTED:               { bg: "bg-red-50",     text: "text-red-600",    label: "Rejected" },
  ISSUED:                 { bg: "bg-blue-50",    text: "text-blue-700",   label: "Issued" },
  PENDING:                { bg: "bg-amber-50",   text: "text-amber-700",  label: "Pending" },
  BOOKED:                 { bg: "bg-emerald-50", text: "text-emerald-700", label: "Booked" },
  WAITLISTED:             { bg: "bg-indigo-50",  text: "text-indigo-700", label: "Waitlisted" },
  CONFIRMED:              { bg: "bg-teal-50",    text: "text-teal-700",   label: "Confirmed" },
  RAC:                    { bg: "bg-pink-50",    text: "text-pink-700",   label: "RAC" },
  SELF_BOOKED:            { bg: "bg-purple-50",  text: "text-purple-700", label: "Self Booked" },
  CANCELLED:              { bg: "bg-red-50",     text: "text-red-700",    label: "Cancelled" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", s.bg, s.text)}>
      {s.label}
    </span>
  );
}

// ── TIMELINE ITEM ──
function TimelineItem({ log, isLast }: { log: any; isLast: boolean }) {
  const iconMap: Record<string, React.ReactNode> = {
    SUBMITTED: <Send className="w-3.5 h-3.5 text-blue-500" />,
    VERIFIED: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    APPROVED: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    REJECTED: <XCircle className="w-3.5 h-3.5 text-red-500" />,
    CHANGES_REQUESTED: <AlertCircle className="w-3.5 h-3.5 text-orange-500" />,
    ISSUED: <Train className="w-3.5 h-3.5 text-blue-500" />,
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          {iconMap[log.action] || <Clock className="w-3.5 h-3.5 text-slate-400" />}
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1" />}
      </div>
      <div className="pb-5 min-w-0">
        <p className="text-[11px] font-semibold text-slate-800">{log.action?.replace(/_/g, " ")}</p>
        {log.notes && <p className="text-[10px] text-slate-500 mt-0.5">{log.notes}</p>}
        <p className="text-[9px] text-slate-400 mt-1">
          {log.performedBy && <span className="font-medium text-slate-500">{log.performedBy} · </span>}
          {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
        </p>
      </div>
    </div>
  );
}

interface VerificationDetailsPanelProps {
  bookingId: string;
  booking?: any;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function VerificationDetailsPanel({
  bookingId,
  booking,
  open,
  onClose,
  onRefresh,
}: VerificationDetailsPanelProps) {
  const { admin } = useAuthStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const [verificationData, setVerificationData] = useState<any>(null);
  const [trainTickets, setTrainTickets] = useState<TrainTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TrainTicket | null>(null);
  const [templates, setTemplates] = useState<TrainTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"verification" | "ticket">("verification");

  // Form states for adding/editing ticket
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    travelerName: "",
    passengerReference: "",
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
    ticketStatus: "PENDING" as any,
  });

  // Reopen and Cancel dialog states
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRefund, setCancelRefund] = useState("0");

  const canPerformActions = admin?.role && ["superadmin", "admin", "operations", "BOOKING_VERIFIER"].includes(admin.role);
  const isSales = admin?.role === "sales";

  useEffect(() => {
    if (open && bookingId) {
      loadData();
    }
  }, [open, bookingId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, ticketsRes, templatesRes] = await Promise.allSettled([
        bookingVerificationService.getVerificationStatus(bookingId),
        trainTicketService.getTicketsByBooking(bookingId),
        trainTicketService.getTemplates(),
      ]);

      if (vRes.status === "fulfilled") {
        setVerificationData(vRes.value);
      }
      if (ticketsRes.status === "fulfilled") {
        const list = ticketsRes.value || [];
        setTrainTickets(list);
        if (list.length > 0) {
          // Keep previous selection if still exists
          const currentId = selectedTicket?.id;
          const match = list.find((t) => t.id === currentId);
          setSelectedTicket(match || list[0]);
        } else {
          setSelectedTicket(null);
        }
      }
      if (templatesRes.status === "fulfilled") {
        setTemplates(templatesRes.value || []);
      }
    } catch (err) {
      console.error("Failed to load verification data:", err);
    }
    setLoading(false);
  };

  const handleVerificationAction = async (action: string) => {
    if (!bookingId) return;
    setActionLoading(true);
    try {
      await bookingVerificationService.performVerificationAction(bookingId, {
        action,
        notes: formData.internalNote || undefined,
      });
      toast.success(`Booking verification: ${action.toLowerCase().replace(/_/g, " ")}`);
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action.toLowerCase()}`);
    }
    setActionLoading(false);
  };

  // ── TICKET OPERATION HANDLERS ──

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;
    setActionLoading(true);
    try {
      await trainTicketService.createTicket(bookingId, {
        ...formData,
        ticketAmount: formData.ticketAmount ? parseFloat(formData.ticketAmount) : 0,
      });
      toast.success("Traveler ticket created successfully");
      setShowForm(false);
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create ticket");
    }
    setActionLoading(false);
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await trainTicketService.updateTicket(selectedTicket.id, {
        ...formData,
        ticketAmount: formData.ticketAmount ? parseFloat(formData.ticketAmount) : 0,
      });
      toast.success("Traveler ticket updated successfully");
      setShowForm(false);
      setIsEditing(false);
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update ticket");
    }
    setActionLoading(false);
  };

  const handleTicketSubmit = async (ticketId: string) => {
    setActionLoading(true);
    try {
      await trainTicketService.submitTicket(ticketId);
      toast.success("Ticket submitted for approval");
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit ticket");
    }
    setActionLoading(false);
  };

  const handleTicketApprove = async (ticketId: string) => {
    setActionLoading(true);
    try {
      await trainTicketService.approveTicket(ticketId);
      toast.success("Ticket approved and locked");
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve ticket");
    }
    setActionLoading(false);
  };

  const handleTicketReject = async (ticketId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    setActionLoading(true);
    try {
      await trainTicketService.rejectTicket(ticketId, reason);
      toast.success("Ticket rejected");
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject ticket");
    }
    setActionLoading(false);
  };

  const handleTicketReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reopenReason.trim()) return;
    setActionLoading(true);
    try {
      await trainTicketService.reopenTicket(selectedTicket.id, reopenReason);
      toast.success("Ticket reopened and unlocked");
      setReopenOpen(false);
      setReopenReason("");
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reopen ticket");
    }
    setActionLoading(false);
  };

  const handleTicketCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await trainTicketService.cancelTicket(selectedTicket.id, {
        reason: cancelReason,
        refundAmount: parseFloat(cancelRefund) || 0,
      });
      toast.success("Ticket cancelled successfully");
      setCancelOpen(false);
      setCancelReason("");
      setCancelRefund("0");
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel ticket");
    }
    setActionLoading(false);
  };

  const handleTicketRebook = async (ticketId: string) => {
    if (!confirm("Are you sure you want to rebook this ticket? It will create a new superseding ticket.")) return;
    setActionLoading(true);
    try {
      await trainTicketService.rebookTicket(ticketId);
      toast.success("Rebooking successful. New ticket created.");
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to rebook ticket");
    }
    setActionLoading(false);
  };

  const applyTemplate = (template: TrainTemplate) => {
    setFormData((prev) => ({
      ...prev,
      trainName: template.trainName || prev.trainName,
      trainNumber: template.trainNumber || prev.trainNumber,
      sourceStation: template.source || prev.sourceStation,
      destinationStation: template.destination || prev.destinationStation,
      coach: template.defaultCoach || prev.coach,
      berthType: template.defaultClass || prev.berthType,
      journeyDate: template.journeyDate ? template.journeyDate.slice(0, 10) : prev.journeyDate,
    }));
    toast.success("Template parameters prefilled!");
  };

  const openEditForm = (t: TrainTicket) => {
    setFormData({
      travelerName: t.travelerName || "",
      passengerReference: t.passengerReference || "",
      pnr: t.pnr || "",
      trainName: t.trainName || "",
      trainNumber: t.trainNumber || "",
      journeyDate: t.journeyDate ? t.journeyDate.slice(0, 10) : "",
      sourceStation: t.sourceStation || "",
      destinationStation: t.destinationStation || "",
      coach: t.coach || "",
      seatNumber: t.seatNumber || "",
      berthType: t.berthType || "",
      ticketAmount: t.ticketAmount ? String(t.ticketAmount) : "",
      amountMode: t.amountMode || "PAYMENT_LINK",
      internalNote: t.internalNote || "",
      ticketBookingPerson: t.ticketBookingPerson || "",
      ticketStatus: t.ticketStatus,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const openCreateForm = () => {
    // Prefill name from booking passengers if possible
    let defaultName = "";
    if (booking?.passengers && Array.isArray(booking.passengers)) {
      const existingNames = trainTickets.map(t => t.travelerName);
      const remaining = booking.passengers.find((p: any) => p && p.name && !existingNames.includes(p.name));
      if (remaining) defaultName = remaining.name;
    }
    setFormData({
      travelerName: defaultName,
      passengerReference: "",
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
      ticketStatus: "PENDING",
    });
    setIsEditing(false);
    setShowForm(true);
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div ref={panelRef} className="fixed right-0 top-0 h-full w-full max-w-[540px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Verification & Tickets</h2>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{booking?.bookingId || bookingId}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Booking Summary */}
            <div className="px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/30">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-bold text-slate-800 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {booking?.fullName || booking?.name}</span>
                <span>Trip: <span className="font-semibold text-slate-700">{booking?.tripName}</span></span>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="px-6 pt-3 flex gap-1 border-b border-slate-100 shrink-0">
              <button
                onClick={() => { setActiveTab("verification"); setShowForm(false); }}
                className={cn(
                  "px-4 py-2 border-b-2 text-[10px] font-bold uppercase tracking-wider transition-all",
                  activeTab === "verification" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400"
                )}
              >
                Verification status
              </button>
              <button
                onClick={() => { setActiveTab("ticket"); setShowForm(false); }}
                className={cn(
                  "px-4 py-2 border-b-2 text-[10px] font-bold uppercase tracking-wider transition-all",
                  activeTab === "ticket" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400"
                )}
              >
                Traveler Tickets ({trainTickets.length})
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "verification" && (
                <div className="p-6 space-y-6">
                  {/* Checklist */}
                  {verificationData?.checklist && (
                    <div className="space-y-2">
                      <h3 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Verification Checklist</h3>
                      <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                        {Object.entries(verificationData.checklist).map(([key, val]: any) => (
                          <div key={key} className="flex items-center gap-2.5 text-[11px] text-slate-700">
                            <CheckCircle2 className={cn("w-4 h-4", val ? "text-emerald-500" : "text-slate-200")} />
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verification Actions */}
                  {canPerformActions && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h3 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Perform Verification Action</h3>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleVerificationAction("VERIFY")} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider">
                          Verify & Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleVerificationAction("REQUEST_CHANGES")} className="border-orange-200 text-orange-600 hover:bg-orange-50 text-[10px] font-bold uppercase tracking-wider">
                          Request Changes
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Logs Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Verification Timeline</h3>
                    {verificationData?.logs && verificationData.logs.length > 0 ? (
                      <div className="space-y-3 pl-1">
                        {verificationData.logs.map((log: any, idx: number) => (
                          <TimelineItem key={idx} log={log} isLast={idx === verificationData.logs.length - 1} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No verification history logs.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "ticket" && (
                <div className="p-6">
                  <TrainTicketsPanel bookingId={bookingId} booking={booking} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── HELPER INFO CELL ──
function InfoCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[11px] font-semibold text-slate-700 mt-0.5 truncate">{String(value)}</p>
    </div>
  );
}
