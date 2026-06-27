import { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Clock, Send, Train, FileText, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bookingVerificationService } from "@/services/bookingVerification.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [trainTicket, setTrainTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [pnrInput, setPnrInput] = useState("");
  const [ticketDetailsInput, setTicketDetailsInput] = useState("");
  const [activeTab, setActiveTab] = useState<"verification" | "ticket">("verification");

  const canPerformActions = admin?.role && ["superadmin", "admin", "BOOKING_VERIFIER"].includes(admin.role);

  useEffect(() => {
    if (open && bookingId) {
      loadData();
    }
  }, [open, bookingId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vData, tData] = await Promise.allSettled([
        bookingVerificationService.getVerificationStatus(bookingId),
        bookingVerificationService.getTrainTicket(bookingId),
      ]);
      if (vData.status === "fulfilled") setVerificationData(vData.value);
      if (tData.status === "fulfilled") setTrainTicket(tData.value);
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
        notes: notes || undefined,
      });
      toast.success(`Booking ${action.toLowerCase().replace(/_/g, " ")} successfully`);
      setNotes("");
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action.toLowerCase()}`);
    }
    setActionLoading(false);
  };

  const handleTicketAction = async (action: string) => {
    if (!bookingId) return;
    setActionLoading(true);
    try {
      await bookingVerificationService.performTicketAction(bookingId, {
        action,
        notes: notes || undefined,
        pnr: pnrInput || undefined,
        ticketDetails: ticketDetailsInput || undefined,
      });
      toast.success(`Ticket ${action.toLowerCase().replace(/_/g, " ")} successfully`);
      setNotes("");
      setPnrInput("");
      setTicketDetailsInput("");
      await loadData();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action.toLowerCase()}`);
    }
    setActionLoading(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-[520px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "slideInRight 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Verification Details</h2>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {booking?.bookingId || bookingId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Booking Summary Card */}
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-[12px] font-bold text-slate-800">
                      {booking?.fullName || booking?.name || "—"}
                    </span>
                  </div>
                  <StatusBadge status={verificationData?.verificationStatus || "DRAFT"} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <InfoCell label="Trip" value={booking?.tripName || "—"} />
                  <InfoCell label="Amount" value={`₹${(booking?.totalAmount || 0).toLocaleString()}`} />
                  <InfoCell label="Travelers" value={booking?.numberOfTravelers || booking?.passengers?.persons?.length || booking?.passengers?.length || "—"} />
                  <InfoCell label="Departure" value={booking?.departureDate ? new Date(booking.departureDate).toLocaleDateString() : "—"} />
                  <InfoCell label="Train Class" value={booking?.trainClass || booking?.passengers?.details?.trainClass || "—"} />
                  <InfoCell label="Payment" value={booking?.paymentStatus || "—"} />
                </div>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="px-6 pt-4 flex gap-1">
              <button
                onClick={() => setActiveTab("verification")}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  activeTab === "verification"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                Verification
              </button>
              <button
                onClick={() => setActiveTab("ticket")}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  activeTab === "ticket"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                <Train className="w-3 h-3 inline mr-1" />
                Train Ticket
              </button>
            </div>

            {activeTab === "verification" && (
              <div className="px-6 py-4 space-y-5">
                {/* Checklist */}
                {verificationData?.checklist && verificationData.checklist.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Verification Checklist
                    </h3>
                    <div className="space-y-2">
                      {verificationData.checklist.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50">
                          <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center shrink-0",
                            item.checked ? "bg-emerald-100" : "bg-slate-200"
                          )}>
                            {item.checked ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
                            )}
                          </div>
                          <span className={cn(
                            "text-[11px] font-medium",
                            item.checked ? "text-slate-700" : "text-slate-400"
                          )}>
                            {item.label || item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline / Logs */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Activity Timeline
                  </h3>
                  {verificationData?.logs && verificationData.logs.length > 0 ? (
                    <div>
                      {verificationData.logs.map((log: any, idx: number) => (
                        <TimelineItem
                          key={idx}
                          log={log}
                          isLast={idx === verificationData.logs.length - 1}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No activity logs yet</p>
                  )}
                </div>

                {/* Notes Input */}
                {canPerformActions && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Notes
                    </h3>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes for this action..."
                      className="w-full h-20 rounded-lg border border-slate-200 p-3 text-[11px] text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {canPerformActions && verificationData?.verificationStatus !== "VERIFIED" && verificationData?.verificationStatus !== "REJECTED" && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleVerificationAction("VERIFY")}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider h-9 px-4 rounded-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerificationAction("REQUEST_CHANGES")}
                      disabled={actionLoading}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50 text-[10px] font-bold uppercase tracking-wider h-9 px-4 rounded-lg"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                      Request Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerificationAction("REJECT")}
                      disabled={actionLoading}
                      className="border-red-300 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider h-9 px-4 rounded-lg"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ticket" && (
              <div className="px-6 py-4 space-y-5">
                {trainTicket ? (
                  <>
                    {/* Ticket Details */}
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Ticket Information
                      </h3>
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-700">
                            <Train className="w-3.5 h-3.5 inline mr-1.5 text-blue-500" />
                            {trainTicket.trainName || trainTicket.trainNo || "Train Ticket"}
                          </span>
                          <StatusBadge status={trainTicket.status || "PENDING"} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <InfoCell label="PNR" value={trainTicket.pnr || "—"} />
                          <InfoCell label="Train No" value={trainTicket.trainNo || "—"} />
                          <InfoCell label="From" value={trainTicket.from || "—"} />
                          <InfoCell label="To" value={trainTicket.to || "—"} />
                          <InfoCell label="Coach" value={trainTicket.coach || "—"} />
                          <InfoCell label="Seat" value={trainTicket.seat || "—"} />
                          <InfoCell label="Departure" value={trainTicket.departureDate ? new Date(trainTicket.departureDate).toLocaleDateString() : "—"} />
                          <InfoCell label="Status" value={trainTicket.status || "—"} />
                        </div>
                      </div>
                    </div>

                    {/* Traveller List */}
                    {trainTicket.travellers && trainTicket.travellers.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                          Travellers on Ticket
                        </h3>
                        <div className="space-y-1.5">
                          {trainTicket.travellers.map((t: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-[11px]">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">
                                {idx + 1}
                              </div>
                              <span className="font-medium text-slate-700">{t.name}</span>
                              {t.age && <span className="text-slate-400">· {t.age}y</span>}
                              {t.seat && <span className="text-slate-400 ml-auto">Seat: {t.seat}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ticket Actions */}
                    {canPerformActions && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                            PNR Number
                          </label>
                          <Input
                            value={pnrInput}
                            onChange={(e) => setPnrInput(e.target.value)}
                            placeholder="Enter PNR..."
                            className="h-9 text-[11px] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Notes
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ticket notes..."
                            className="w-full h-16 rounded-lg border border-slate-200 p-3 text-[11px] text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => handleTicketAction("APPROVE")}
                            disabled={actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider h-9 px-4 rounded-lg"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTicketAction("REQUEST_CHANGES")}
                            disabled={actionLoading}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50 text-[10px] font-bold uppercase tracking-wider h-9 px-4 rounded-lg"
                          >
                            Request Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTicketAction("REJECT")}
                            disabled={actionLoading}
                            className="border-red-300 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider h-9 px-4 rounded-lg"
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleTicketAction("MARK_ISSUED")}
                            disabled={actionLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider h-9 px-4 rounded-lg"
                          >
                            <Train className="w-3.5 h-3.5 mr-1.5" />
                            Mark Issued
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <Train className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-[12px] font-semibold text-slate-500">No train ticket required</p>
                    <p className="text-[10px] text-slate-400 mt-1">This booking does not have an associated train ticket</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ── HELPER COMPONENT ──
function InfoCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{String(value)}</p>
    </div>
  );
}
