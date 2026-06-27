/**
 * TrainTicketsPanel.tsx
 * Dedicated Train Tickets tab for the Booking Details page.
 * One row per traveler. Bulk multi-select. Approval workflow. Template prefill.
 * Locked state enforced after approval. Buttons shown only to permitted roles.
 */
import { useState, useEffect } from "react";
import {
  Train, Plus, CheckCircle2, XCircle, AlertTriangle,
  RotateCcw, Ban, RefreshCw, History, ChevronDown, ChevronUp,
  Edit3, Send, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { trainTicketService, type TrainTicket, type TrainTemplate } from "@/services/trainTicket.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-amber-100 text-amber-700",
  BOOKED:      "bg-emerald-100 text-emerald-700",
  WAITLISTED:  "bg-indigo-100 text-indigo-700",
  CONFIRMED:   "bg-teal-100 text-teal-700",
  RAC:         "bg-pink-100 text-pink-700",
  SELF_BOOKED: "bg-purple-100 text-purple-700",
  CANCELLED:   "bg-red-100 text-red-700",
};
const APPROVAL_COLORS: Record<string, string> = {
  DRAFT:     "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED:  "bg-emerald-100 text-emerald-700",
  REJECTED:  "bg-red-100 text-red-700",
  REOPENED:  "bg-orange-100 text-orange-700",
};

function Pill({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider", colorClass)}>
      {label.replace(/_/g, " ")}
    </span>
  );
}

// ── EMPTY FORM ─────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  travelerName: "", passengerReference: "", pnr: "", trainName: "", trainNumber: "",
  journeyDate: "", sourceStation: "", destinationStation: "", coach: "", seatNumber: "",
  berthType: "", ticketAmount: "", amountMode: "PAYMENT_LINK", internalNote: "",
  ticketBookingPerson: "", ticketStatus: "PENDING" as const,
});

// ── PROPS ─────────────────────────────────────────────────────────────────────
interface TrainTicketsPanelProps {
  bookingId: string;
  booking?: any;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function TrainTicketsPanel({ bookingId, booking }: TrainTicketsPanelProps) {
  const { admin } = useAuthStore();
  const role = admin?.role ?? "";

  const canApprove   = ["superadmin", "admin", "operations", "BOOKING_VERIFIER"].includes(role);
  const canReopen    = canApprove;
  const canManage    = ["superadmin", "admin", "operations", "BOOKING_VERIFIER", "sales"].includes(role);

  const [tickets, setTickets]       = useState<TrainTicket[]>([]);
  const [templates, setTemplates]   = useState<TrainTemplate[]>([]);
  const [loading, setLoading]       = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Form state
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState(emptyForm());

  // Expanded history
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Bulk selection
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [showBulk, setShowBulk]     = useState(false);
  const [bulkForm, setBulkForm]     = useState({
    status: "", trainNumber: "", journeyDate: "", pnr: "", coach: "",
    sourceStation: "", destinationStation: "",
    seatNumber: "", berthType: "", // only sent if explicitly filled
    notes: "",
  });

  // Dialog states
  const [reopenTarget, setReopenTarget]   = useState<string | null>(null);
  const [reopenReason, setReopenReason]   = useState("");
  const [cancelTarget, setCancelTarget]   = useState<string | null>(null);
  const [cancelReason, setCancelReason]   = useState("");
  const [cancelRefund, setCancelRefund]   = useState("0");

  useEffect(() => {
    if (bookingId) load();
  }, [bookingId]);

  async function load() {
    setLoading(true);
    try {
      const [t, tmpl] = await Promise.all([
        trainTicketService.getTicketsByBooking(bookingId),
        trainTicketService.getTemplates(),
      ]);
      setTickets(t ?? []);
      setTemplates((tmpl ?? []).filter((x) => x.isActive));
    } catch { toast.error("Failed to load tickets"); }
    finally { setLoading(false); }
  }

  function openCreate() {
    let defaultName = "";
    if (booking?.passengers && Array.isArray(booking.passengers)) {
      const taken = new Set(tickets.map((t) => t.travelerName));
      const free  = booking.passengers.find((p: any) => p?.name && !taken.has(p.name));
      if (free) defaultName = free.name;
    }
    setForm({ ...emptyForm(), travelerName: defaultName });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(t: TrainTicket) {
    setForm({
      travelerName: t.travelerName ?? "",
      passengerReference: t.passengerReference ?? "",
      pnr: t.pnr ?? "",
      trainName: t.trainName ?? "",
      trainNumber: t.trainNumber ?? "",
      journeyDate: t.journeyDate ? t.journeyDate.slice(0, 10) : "",
      sourceStation: t.sourceStation ?? "",
      destinationStation: t.destinationStation ?? "",
      coach: t.coach ?? "",
      seatNumber: t.seatNumber ?? "",
      berthType: t.berthType ?? "",
      ticketAmount: t.ticketAmount != null ? String(t.ticketAmount) : "",
      amountMode: t.amountMode ?? "PAYMENT_LINK",
      internalNote: t.internalNote ?? "",
      ticketBookingPerson: t.ticketBookingPerson ?? "",
      ticketStatus: t.ticketStatus,
    });
    setEditingId(t.id);
    setShowForm(true);
  }

  function applyTemplate(tmpl: TrainTemplate) {
    setForm((prev) => ({
      ...prev,
      trainName:         prev.trainName         || tmpl.trainName         || "",
      trainNumber:       prev.trainNumber       || tmpl.trainNumber       || "",
      sourceStation:     prev.sourceStation     || tmpl.source            || "",
      destinationStation:prev.destinationStation|| tmpl.destination       || "",
      coach:             prev.coach             || tmpl.defaultCoach      || "",
      berthType:         prev.berthType         || tmpl.defaultClass      || "",
      journeyDate:       prev.journeyDate       || (tmpl.journeyDate ? tmpl.journeyDate.slice(0, 10) : "") ,
    }));
    toast.success(`Prefilled from template: ${tmpl.trainName || tmpl.trainNumber}`);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setActionBusy(true);
    try {
      const payload = { ...form, ticketAmount: parseFloat(form.ticketAmount) || 0 };
      if (editingId) {
        await trainTicketService.updateTicket(editingId, payload);
        toast.success("Ticket updated");
      } else {
        await trainTicketService.createTicket(bookingId, payload);
        toast.success("Ticket created");
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Save failed");
    } finally { setActionBusy(false); }
  }

  async function doSubmitApproval(id: string) {
    setActionBusy(true);
    try {
      await trainTicketService.submitTicket(id);
      toast.success("Submitted for approval");
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Submit failed"); }
    finally { setActionBusy(false); }
  }

  async function doApprove(id: string) {
    setActionBusy(true);
    try {
      await trainTicketService.approveTicket(id);
      toast.success("Ticket approved and locked");
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Approve failed"); }
    finally { setActionBusy(false); }
  }

  async function doReject(id: string) {
    const reason = prompt("Enter rejection reason (mandatory):");
    if (reason === null) return;
    setActionBusy(true);
    try {
      await trainTicketService.rejectTicket(id, reason);
      toast.success("Ticket rejected");
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Reject failed"); }
    finally { setActionBusy(false); }
  }

  async function doReopen(e: React.FormEvent) {
    e.preventDefault();
    if (!reopenTarget || !reopenReason.trim()) return;
    setActionBusy(true);
    try {
      await trainTicketService.reopenTicket(reopenTarget, reopenReason);
      toast.success("Ticket reopened");
      setReopenTarget(null); setReopenReason("");
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Reopen failed"); }
    finally { setActionBusy(false); }
  }

  async function doCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelTarget || !cancelReason.trim()) return;
    setActionBusy(true);
    try {
      await trainTicketService.cancelTicket(cancelTarget, { reason: cancelReason, refundAmount: parseFloat(cancelRefund) || 0 });
      toast.success("Ticket cancelled");
      setCancelTarget(null); setCancelReason(""); setCancelRefund("0");
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Cancel failed"); }
    finally { setActionBusy(false); }
  }

  async function doRebook(id: string) {
    if (!confirm("Rebook this cancelled ticket? A new ticket will be created linked to this one.")) return;
    setActionBusy(true);
    try {
      await trainTicketService.rebookTicket(id);
      toast.success("Rebooking created");
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Rebook failed"); }
    finally { setActionBusy(false); }
  }

  async function doBulkUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) return;
    const payload: any = { ticketIds: [...selected], notes: bulkForm.notes };
    if (bulkForm.status)            payload.status            = bulkForm.status;
    if (bulkForm.trainNumber)       payload.trainNumber       = bulkForm.trainNumber;
    if (bulkForm.journeyDate)       payload.journeyDate       = bulkForm.journeyDate;
    if (bulkForm.pnr)               payload.pnr               = bulkForm.pnr;
    if (bulkForm.coach)             payload.coach             = bulkForm.coach;
    if (bulkForm.sourceStation)     payload.sourceStation     = bulkForm.sourceStation;
    if (bulkForm.destinationStation)payload.destinationStation = bulkForm.destinationStation;
    // seat/berth only if explicitly entered
    if (bulkForm.seatNumber.trim()) payload.seatNumber        = bulkForm.seatNumber;
    if (bulkForm.berthType.trim())  payload.berthType         = bulkForm.berthType;

    setActionBusy(true);
    try {
      const res = await trainTicketService.bulkUpdateTickets(payload);
      toast.success(`${res.updatedCount} ticket(s) updated`);
      setSelected(new Set()); setShowBulk(false);
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Bulk update failed"); }
    finally { setActionBusy(false); }
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading tickets…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Train className="w-4 h-4 text-slate-500" />
          Train Tickets
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {tickets.length}
          </span>
          {tickets.some((t) => {
            const d = t.journeyDate ? new Date(t.journeyDate) : null;
            const urgent = d && (d.getTime() - Date.now()) < 10 * 86400000 && d > new Date() &&
              ["PENDING","WAITLISTED","RAC"].includes(t.ticketStatus);
            return urgent;
          }) && (
            <span className="bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Urgent
            </span>
          )}
          {tickets.some((t) => {
            const old2d = (Date.now() - new Date(t.createdAt).getTime()) > 2 * 86400000;
            return old2d && t.ticketStatus === "PENDING";
          }) && (
            <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
              ⚠ Pending &gt;2d
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button size="sm" variant="outline" onClick={() => setShowBulk(true)}
              className="h-8 text-[10px] font-bold uppercase tracking-wider border-blue-200 text-blue-700">
              Bulk Update ({selected.size})
            </Button>
          )}
          {canManage && (
            <Button size="sm" onClick={openCreate}
              className="h-8 text-[10px] font-bold uppercase tracking-wider bg-primary text-white flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Template prefill strip (shown only when form is open) */}
      {showForm && templates.length > 0 && (
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
            Prefill from template (blank fields only)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((t) => (
              <button key={t.id} type="button" onClick={() => applyTemplate(t)}
                className="px-2 py-1 bg-white hover:bg-blue-50 border border-blue-200 rounded text-[10px] font-medium text-blue-700">
                {t.trainName || t.trainNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <form onSubmit={submitForm}
          className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
            {editingId ? "Edit Ticket" : "New Traveler Ticket"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">Traveler Name *</label>
              <Input value={form.travelerName} onChange={(e) => setForm({ ...form, travelerName: e.target.value })}
                required className="h-8 text-xs" />
            </div>
            {(["pnr","trainName","trainNumber","journeyDate","sourceStation","destinationStation","coach","seatNumber","berthType","ticketAmount","passengerReference","ticketBookingPerson"] as const).map((key) => (
              <div key={key} className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </label>
                <Input
                  type={key === "journeyDate" ? "date" : key === "ticketAmount" ? "number" : "text"}
                  step={key === "ticketAmount" ? "0.01" : undefined}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">Amount Mode</label>
              <Select value={form.amountMode} onValueChange={(v) => setForm({ ...form, amountMode: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PAYMENT_LINK","CASH","IMPS_NEFT","UPI"].map((m) => (
                    <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">Ticket Status</label>
              <Select value={form.ticketStatus} onValueChange={(v: any) => setForm({ ...form, ticketStatus: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PENDING","BOOKED","WAITLISTED","CONFIRMED","RAC","SELF_BOOKED"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">Internal Note</label>
              <Textarea value={form.internalNote} onChange={(e) => setForm({ ...form, internalNote: e.target.value })}
                rows={2} className="text-xs" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}
              className="h-8 text-[10px] font-bold uppercase">Cancel</Button>
            <Button type="submit" size="sm" disabled={actionBusy}
              className="h-8 text-[10px] font-bold uppercase bg-primary text-white">
              {actionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Save
            </Button>
          </div>
        </form>
      )}

      {/* Tickets Table */}
      {tickets.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
          <Train className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">No tickets added yet.</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Click "Add Ticket" to create the first traveler ticket.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const isSelected = selected.has(t.id);
            const expanded   = expandedId === t.id;
            const isUrgent   = t.journeyDate
              ? (new Date(t.journeyDate).getTime() - Date.now()) < 10 * 86400000 &&
                new Date(t.journeyDate) > new Date() &&
                ["PENDING","WAITLISTED","RAC"].includes(t.ticketStatus)
              : false;
            const isPending2D = (Date.now() - new Date(t.createdAt).getTime()) > 2 * 86400000 &&
              t.ticketStatus === "PENDING";

            return (
              <div key={t.id}
                className={cn("border rounded-xl bg-white shadow-sm transition-all",
                  isSelected ? "border-blue-400 ring-1 ring-blue-200" : "border-slate-200",
                  t.ticketStatus === "CANCELLED" && "opacity-60"
                )}>
                {/* Row header */}
                <div className="p-3 flex items-center gap-3 flex-wrap">
                  {/* Checkbox */}
                  {canManage && !t.isLocked && t.ticketStatus !== "CANCELLED" && (
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(t.id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-primary" />
                  )}

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 truncate">{t.travelerName}</span>
                      {isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      {isPending2D && <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded">⚠ &gt;2d</span>}
                      <Pill label={t.ticketStatus} colorClass={STATUS_COLORS[t.ticketStatus] ?? "bg-slate-100 text-slate-600"} />
                      <Pill label={t.approvalStatus} colorClass={APPROVAL_COLORS[t.approvalStatus] ?? "bg-slate-100 text-slate-600"} />
                      {t.isLocked && <span className="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">LOCKED</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500 flex-wrap">
                      {t.trainName && <span>{t.trainName} {t.trainNumber ? `(${t.trainNumber})` : ""}</span>}
                      {t.journeyDate && <span>{new Date(t.journeyDate).toDateString()}</span>}
                      {t.sourceStation && t.destinationStation && <span>{t.sourceStation} → {t.destinationStation}</span>}
                      {t.coach && <span>Coach {t.coach}</span>}
                      {t.seatNumber && <span>Seat {t.seatNumber}</span>}
                      {t.berthType && <span>{t.berthType}</span>}
                      {t.ticketAmount != null && Number(t.ticketAmount) > 0 && (
                        <span className="font-semibold text-slate-700">₹{Number(t.ticketAmount).toFixed(2)}</span>
                      )}
                      {t.ticketStatus === "CANCELLED" && t.refundAmount != null && (
                        <span className="text-red-600 font-semibold">Refund: ₹{Number(t.refundAmount).toFixed(2)}</span>
                      )}
                      {/* PNR shown to staff, masked for sales on other's tickets */}
                      {t.pnr && (canApprove || t.submittedByAdminId === admin?.id) && (
                        <span className="font-mono text-[9px] bg-slate-100 px-1 rounded">PNR:{t.pnr}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Edit (unlocked only) */}
                    {canManage && !t.isLocked && t.ticketStatus !== "CANCELLED" && (
                      <Button size="sm" variant="outline" onClick={() => openEdit(t)}
                        className="h-7 px-2 text-[9px] font-bold uppercase">
                        <Edit3 className="w-3 h-3 mr-1" />Edit
                      </Button>
                    )}
                    {/* Submit */}
                    {t.approvalStatus === "DRAFT" && canManage && !t.isLocked && t.ticketStatus !== "CANCELLED" && (
                      <Button size="sm" onClick={() => doSubmitApproval(t.id)} disabled={actionBusy}
                        className="h-7 px-2 text-[9px] font-bold uppercase bg-blue-600 text-white">
                        <Send className="w-3 h-3 mr-1" />Submit
                      </Button>
                    )}
                    {/* Approve / Reject */}
                    {t.approvalStatus === "SUBMITTED" && canApprove && (
                      <>
                        <Button size="sm" onClick={() => doApprove(t.id)} disabled={actionBusy || t.submittedByAdminId === admin?.id}
                          title={t.submittedByAdminId === admin?.id ? "You submitted this ticket" : "Approve"}
                          className="h-7 px-2 text-[9px] font-bold uppercase bg-emerald-600 text-white">
                          <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => doReject(t.id)} disabled={actionBusy || t.submittedByAdminId === admin?.id}
                          title={t.submittedByAdminId === admin?.id ? "You submitted this ticket" : "Reject"}
                          className="h-7 px-2 text-[9px] font-bold uppercase border-red-200 text-red-600">
                          <XCircle className="w-3 h-3 mr-1" />Reject
                        </Button>
                      </>
                    )}
                    {/* Reopen */}
                    {(t.approvalStatus === "APPROVED" || t.approvalStatus === "REJECTED") && canReopen && (
                      <Button size="sm" variant="outline" onClick={() => { setReopenTarget(t.id); setReopenReason(""); }}
                        className="h-7 px-2 text-[9px] font-bold uppercase">
                        <RotateCcw className="w-3 h-3 mr-1" />Reopen
                      </Button>
                    )}
                    {/* Cancel */}
                    {t.ticketStatus !== "CANCELLED" && canManage && (
                      <Button size="sm" variant="outline" onClick={() => { setCancelTarget(t.id); setCancelReason(""); setCancelRefund("0"); }}
                        className="h-7 px-2 text-[9px] font-bold uppercase border-red-200 text-red-600">
                        <Ban className="w-3 h-3 mr-1" />Cancel
                      </Button>
                    )}
                    {/* Rebook */}
                    {t.ticketStatus === "CANCELLED" && canManage && (
                      <Button size="sm" onClick={() => doRebook(t.id)} disabled={actionBusy}
                        className="h-7 px-2 text-[9px] font-bold uppercase bg-indigo-600 text-white">
                        <RefreshCw className="w-3 h-3 mr-1" />Rebook
                      </Button>
                    )}
                    {/* History toggle */}
                    {t.history && t.history.length > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => setExpandedId(expanded ? null : t.id)}
                        className="h-7 px-2 text-[9px] font-bold uppercase text-slate-500">
                        <History className="w-3 h-3 mr-1" />
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Extra info: cancellation, reopen reason, link info */}
                {(t.cancellationReason || t.reopenReason || t.supersedesTicketId || t.internalNote) && (
                  <div className="px-3 pb-2 space-y-1">
                    {t.cancellationReason && (
                      <p className="text-[10px] text-red-600 bg-red-50 rounded px-2 py-1">
                        Cancelled: {t.cancellationReason}
                      </p>
                    )}
                    {t.reopenReason && (
                      <p className="text-[10px] text-orange-700 bg-orange-50 rounded px-2 py-1">
                        Reopen reason: {t.reopenReason}
                      </p>
                    )}
                    {t.supersedesTicketId && (
                      <p className="text-[9px] text-slate-500 bg-slate-50 rounded px-2 py-1 font-mono">
                        Supersedes ticket: …{t.supersedesTicketId.slice(-8)}
                      </p>
                    )}
                    {t.internalNote && canApprove && (
                      <p className="text-[9px] text-slate-500 italic">{t.internalNote}</p>
                    )}
                  </div>
                )}

                {/* History log */}
                {expanded && t.history && t.history.length > 0 && (
                  <div className="border-t border-slate-100 px-3 py-2 space-y-1.5 max-h-48 overflow-y-auto bg-slate-50/50">
                    <p className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">History</p>
                    {[...t.history].reverse().map((h: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] text-slate-600">
                        <span className="shrink-0 w-16 text-[8px] text-slate-400 font-medium pt-0.5">
                          {new Date(h.createdAt).toLocaleString()}
                        </span>
                        <div>
                          <span className="font-bold text-slate-700">{h.action}</span>
                          {h.notes && <span className="text-slate-500 ml-1">— {h.notes}</span>}
                          {h.performedBy && (
                            <span className="text-slate-400 ml-1 text-[9px]">by {h.performedBy.name}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Bulk Update Modal ─────────────────────────────────────────────── */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={doBulkUpdate}
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Bulk Update {selected.size} Ticket(s)
            </h3>
            <p className="text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1 border border-amber-100">
              Seat and berth are only updated if explicitly entered below. Shared fields apply to all selected tickets.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["status", "Ticket Status", "select"],
                ["trainNumber", "Train Number", "text"],
                ["journeyDate", "Journey Date", "date"],
                ["pnr", "PNR", "text"],
                ["coach", "Coach", "text"],
                ["sourceStation", "Source Station", "text"],
                ["destinationStation", "Destination Station", "text"],
                ["seatNumber", "Seat Number (optional)", "text"],
                ["berthType", "Berth Type (optional)", "text"],
              ].map(([key, label, type]) => (
                <div key={key} className={cn("space-y-1", key === "sourceStation" || key === "destinationStation" ? "col-span-2" : "")}>
                  <label className="text-[9px] font-bold uppercase text-slate-500">{label}</label>
                  {type === "select" ? (
                    <Select value={(bulkForm as any)[key]} onValueChange={(v) => setBulkForm({ ...bulkForm, [key]: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="(unchanged)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">– unchanged –</SelectItem>
                        {["PENDING","BOOKED","WAITLISTED","CONFIRMED","RAC","SELF_BOOKED"].map((s) => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input type={type} value={(bulkForm as any)[key]}
                      onChange={(e) => setBulkForm({ ...bulkForm, [key]: e.target.value })}
                      className="h-8 text-xs" placeholder="(unchanged)" />
                  )}
                </div>
              ))}
              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">History Note</label>
                <Input value={bulkForm.notes} onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })}
                  className="h-8 text-xs" placeholder="Reason for bulk update" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowBulk(false)}
                className="h-8 text-[10px] font-bold uppercase">Cancel</Button>
              <Button type="submit" size="sm" disabled={actionBusy}
                className="h-8 text-[10px] font-bold uppercase bg-primary text-white">
                Confirm Update
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Reopen Dialog ──────────────────────────────────────────────────── */}
      {reopenTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={doReopen}
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-orange-500" /> Reopen Ticket
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">Mandatory Reason</label>
              <Textarea value={reopenReason} onChange={(e) => setReopenReason(e.target.value)}
                rows={3} required className="text-xs" placeholder="Why is this ticket being reopened?" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setReopenTarget(null)}
                className="h-8 text-[10px] font-bold uppercase">Cancel</Button>
              <Button type="submit" size="sm" disabled={!reopenReason.trim() || actionBusy}
                className="h-8 text-[10px] font-bold uppercase bg-primary text-white">Reopen</Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Cancel Dialog ──────────────────────────────────────────────────── */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={doCancel}
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Ban className="w-4 h-4 text-red-500" /> Cancel Ticket
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Cancellation Reason *</label>
                <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                  rows={2} required className="text-xs" placeholder="Mandatory reason" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Refund Amount (₹)</label>
                <Input type="number" step="0.01" value={cancelRefund}
                  onChange={(e) => setCancelRefund(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setCancelTarget(null)}
                className="h-8 text-[10px] font-bold uppercase">Close</Button>
              <Button type="submit" size="sm" disabled={!cancelReason.trim() || actionBusy}
                className="h-8 text-[10px] font-bold uppercase bg-red-600 text-white">Confirm Cancel</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
