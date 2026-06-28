/**
 * TicketApprovalsPage.tsx
 * Approval queue for train tickets.
 * Filters: trip / departure date / ticket status / approval status / salesperson / urgent-10d.
 * Actions: Approve, Reject, Request Correction, Reopen (with mandatory notes).
 * One dedicated page; no duplication with VerificationQueuePage.
 */
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, RotateCcw, MessageSquare,
  AlertTriangle, Train, Filter, Loader2, Search, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { trainTicketService, type TrainTicket } from "@/services/trainTicket.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function TicketApprovalsPage() {
  const { admin } = useAuthStore();
  const [tickets, setTickets]     = useState<TrainTicket[]>([]);
  const [loading, setLoading]     = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Filters
  const [search, setSearch]       = useState("");
  const [fStatus, setFStatus]     = useState("ALL");
  const [fApproval, setFApproval] = useState("SUBMITTED");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dialogs
  const [noteTarget, setNoteTarget] = useState<{ id: string; action: "reject" | "reopen" | "correction" } | null>(null);
  const [noteText, setNoteText]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await trainTicketService.getApprovalsQueue({
        page: String(page),
        limit: String(pageSize),
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(fStatus !== "ALL" ? { ticketStatus: fStatus } : {}),
        approvalStatus: fApproval,
        ...(urgentOnly ? { urgent: "true" } : {}),
      });
      setTickets(result.data);
      setTotalCount(result.pagination.totalCount);
      setTotalPages(result.pagination.totalPages);
    } catch { toast.error("Failed to load approvals"); }
    finally { setLoading(false); }
  }, [fApproval, fStatus, page, pageSize, search, urgentOnly]);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => { setPage(1); }, [search, fStatus, fApproval, urgentOnly, pageSize]);

  const filtered = tickets;

  async function doApprove(id: string, submittedById?: string) {
    if (submittedById === admin?.id) {
      toast.error("You submitted this ticket. Another approver must approve it.");
      return;
    }
    setActionBusy(true);
    try {
      await trainTicketService.approveTicket(id);
      toast.success("Ticket approved and locked");
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Approve failed"); }
    finally { setActionBusy(false); }
  }

  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTarget) return;
    setActionBusy(true);
    try {
      const { id, action } = noteTarget;
      if (action === "reject") {
        await trainTicketService.rejectTicket(id, noteText);
        toast.success("Ticket rejected");
      } else if (action === "reopen") {
        await trainTicketService.reopenTicket(id, noteText);
        toast.success("Ticket reopened");
      } else if (action === "correction") {
        // Request Correction: same as reject but with specific note pattern
        await trainTicketService.rejectTicket(id, `[CORRECTION REQUESTED] ${noteText}`);
        toast.success("Correction requested");
      }
      setNoteTarget(null); setNoteText("");
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Action failed"); }
    finally { setActionBusy(false); }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Train className="w-5 h-5 text-slate-500" /> Ticket Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and action submitted train tickets. Submitter cannot approve their own ticket.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="h-8 text-[10px] font-bold uppercase">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap gap-3 items-center">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search traveler / trip / booking…"
            className="h-8 text-xs pl-7 w-52" />
        </div>
        <Select value={fApproval} onValueChange={setFApproval}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Approval Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Approval</SelectItem>
            {["DRAFT","SUBMITTED","APPROVED","REJECTED","REOPENED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Ticket Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {["PENDING","BOOKED","WAITLISTED","CONFIRMED","RAC","SELF_BOOKED","CANCELLED"].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer">
          <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300" />
          <AlertTriangle className="w-3 h-3 text-red-500" /> Urgent only (&lt;10d)
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 bg-slate-50 rounded-xl border border-slate-100">
          <Train className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">No tickets match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const urgent = isUrgent(t);
            const selfSubmit = t.submittedByAdminId === admin?.id;
            return (
              <div key={t.id}
                className={cn("border rounded-xl bg-white shadow-sm p-4 space-y-2",
                  urgent ? "border-red-200" : "border-slate-200"
                )}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{t.travelerName}</span>
                      {urgent && (
                        <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> URGENT
                        </span>
                      )}
                      <Pill label={t.ticketStatus} colorClass={STATUS_COLORS[t.ticketStatus] ?? "bg-slate-100 text-slate-600"} />
                      <Pill label={t.approvalStatus} colorClass={APPROVAL_COLORS[t.approvalStatus] ?? "bg-slate-100 text-slate-600"} />
                    </div>
                    <div className="text-[10px] text-slate-500 flex flex-wrap gap-3">
                      {t.booking?.tripName && <span className="font-medium">{t.booking.tripName}</span>}
                      {t.booking?.bookingId && <span>Booking: {t.booking.bookingId}</span>}
                      {t.trainName && <span>{t.trainName} {t.trainNumber ? `(${t.trainNumber})` : ""}</span>}
                      {t.journeyDate && <span>Journey: {new Date(t.journeyDate).toDateString()}</span>}
                      {t.sourceStation && t.destinationStation && <span>{t.sourceStation} → {t.destinationStation}</span>}
                      {t.submittedBy?.name && <span>Submitted by: {t.submittedBy.name}</span>}
                    </div>
                    {selfSubmit && (
                      <p className="text-[9px] text-amber-700 bg-amber-50 rounded px-2 py-0.5 inline-block">
                        You submitted this ticket — another approver must approve/reject.
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1.5 flex-wrap shrink-0">
                    {t.approvalStatus === "SUBMITTED" && !selfSubmit && (
                      <>
                        <Button size="sm" onClick={() => doApprove(t.id, t.submittedByAdminId)} disabled={actionBusy}
                          className="h-7 px-2.5 text-[9px] font-bold uppercase bg-emerald-600 text-white">
                          <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setNoteTarget({ id: t.id, action: "reject" }); setNoteText(""); }} disabled={actionBusy}
                          className="h-7 px-2.5 text-[9px] font-bold uppercase border-red-200 text-red-600">
                          <XCircle className="w-3 h-3 mr-1" />Reject
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setNoteTarget({ id: t.id, action: "correction" }); setNoteText(""); }} disabled={actionBusy}
                          className="h-7 px-2.5 text-[9px] font-bold uppercase border-orange-200 text-orange-600">
                          <MessageSquare className="w-3 h-3 mr-1" />Request Correction
                        </Button>
                      </>
                    )}
                    {(t.approvalStatus === "APPROVED" || t.approvalStatus === "REJECTED") && (
                      <Button size="sm" variant="outline" onClick={() => { setNoteTarget({ id: t.id, action: "reopen" }); setNoteText(""); }} disabled={actionBusy}
                        className="h-7 px-2.5 text-[9px] font-bold uppercase">
                        <RotateCcw className="w-3 h-3 mr-1" />Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Count */}
      {!loading && (
        <div className="flex items-center justify-end gap-2 text-[10px] text-slate-500">
          <span>Showing {filtered.length} of {totalCount} tickets</span>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="h-7 rounded border border-slate-200 bg-white px-2">
            <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
          </select>
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <span>Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      {/* Note dialog (reject / reopen / correction) */}
      {noteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={submitNote}
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 capitalize">
              {noteTarget.action === "correction" ? "Request Correction" : noteTarget.action} — Mandatory Note
            </h3>
            <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
              rows={4} required className="text-xs"
              placeholder={noteTarget.action === "reopen" ? "Why is this ticket being reopened?" : "Provide the reason / corrections needed…"} />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setNoteTarget(null)}
                className="h-8 text-[10px] font-bold uppercase">Cancel</Button>
              <Button type="submit" size="sm" disabled={!noteText.trim() || actionBusy}
                className={cn("h-8 text-[10px] font-bold uppercase text-white",
                  noteTarget.action === "reopen" ? "bg-orange-600" : "bg-red-600"
                )}>
                {noteTarget.action === "reopen" ? "Reopen" : noteTarget.action === "correction" ? "Send Request" : "Confirm Reject"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
