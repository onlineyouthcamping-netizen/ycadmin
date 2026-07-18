import { useState, useEffect, useCallback } from "react";
import {
  Search, Filter, Clock, CheckCircle2, XCircle, Eye, Train, Plane, Bus,
  Loader2, ChevronLeft, ChevronRight, User, CalendarDays, Ticket, FileText,
  AlertTriangle, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ticketApprovalService, type TicketApproval, type TicketApprovalStats } from "@/services/ticketApproval.service";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import { cn, safeFormatDate, safeFormatDateTime } from "@/lib/utils";

const TICKET_TYPE_ICONS: Record<string, any> = {
  train: Train,
  flight: Plane,
  bus: Bus,
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Pending" },
  approved: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Approved" },
  rejected: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "Rejected" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] || { bg: "bg-slate-50 border-slate-200", text: "text-slate-600", label: status };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", status === "pending" ? "bg-amber-500" : status === "approved" ? "bg-emerald-500" : "bg-red-500")} />
      {s.label}
    </span>
  );
}

export default function TicketApprovalsPage() {
  const { admin } = useAuthStore();
  const canApprove = admin ? hasPermission(admin.permissions, 'tickets.approve', admin.role) : false;

  const [approvals, setApprovals] = useState<TicketApproval[]>([]);
  const [stats, setStats] = useState<TicketApprovalStats>({ pendingCount: 0, approvedToday: 0, rejectedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  const [fStatus, setFStatus] = useState("pending");
  const [fTicketType, setFTicketType] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedApproval, setSelectedApproval] = useState<TicketApproval | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [approvalsRes, statsData] = await Promise.all([
        ticketApprovalService.getApprovals({
          status: fStatus,
          ticketType: fTicketType !== "all" ? fTicketType : undefined,
          search: search.trim() || undefined,
          page,
          limit: pageSize,
        }),
        ticketApprovalService.getStats(),
      ]);
      setApprovals(approvalsRes.data);
      setTotalCount(approvalsRes.pagination.totalCount);
      setTotalPages(approvalsRes.pagination.totalPages);
      setStats(statsData);
    } catch {
      toast.error("Failed to load ticket approvals");
    } finally {
      setLoading(false);
    }
  }, [fStatus, fTicketType, search, page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => { setPage(1); }, [fStatus, fTicketType, search]);

  const handleApprove = async (id: string) => {
    setActionBusy(true);
    try {
      await ticketApprovalService.approve(id);
      toast.success("Ticket approved successfully");
      setDetailOpen(false);
      setSelectedApproval(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve");
    } finally {
      setActionBusy(false);
      setConfirmAction(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionNote.trim()) {
      toast.error("Rejection note is required");
      return;
    }
    setActionBusy(true);
    try {
      await ticketApprovalService.reject(id, rejectionNote);
      toast.success("Ticket rejected");
      setDetailOpen(false);
      setSelectedApproval(null);
      setRejectionNote("");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject");
    } finally {
      setActionBusy(false);
      setConfirmAction(null);
    }
  };

  const openDetail = async (approval: TicketApproval) => {
    try {
      const detail = await ticketApprovalService.getDetail(approval.id);
      setSelectedApproval(detail);
      setDetailOpen(true);
      setRejectionNote("");
      setConfirmAction(null);
    } catch {
      toast.error("Failed to load detail");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6 font-sans">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Ticket className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Ticket Approval Center</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Review generated tickets before they are issued to customers
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="h-8.5 px-4 rounded-[4px] text-xs font-semibold uppercase">
          Refresh
        </Button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm relative">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
          <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{loading ? "..." : stats.pendingCount}</h3>
          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Awaiting approval</p>
          <div className="absolute right-4 top-4 w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm relative">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approved Today</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{loading ? "..." : stats.approvedToday}</h3>
          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Successfully issued</p>
          <div className="absolute right-4 top-4 w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm relative">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rejected Today</p>
          <h3 className="text-2xl font-extrabold text-red-600 mt-1">{loading ? "..." : stats.rejectedToday}</h3>
          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Declined with reason</p>
          <div className="absolute right-4 top-4 w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-wrap gap-3 items-center shadow-sm">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer / trip / PNR..."
            className="h-8 text-xs pl-7 w-52"
          />
        </div>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fTicketType} onValueChange={setFTicketType}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Ticket Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="train">Train</SelectItem>
            <SelectItem value="flight">Flight</SelectItem>
            <SelectItem value="bus">Bus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-md border border-slate-200 shadow-sm">
          <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">No ticket approvals match your filters.</p>
          <p className="text-[10px] text-slate-400 mt-1">All ticket requests have been processed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Trip Code</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Requested At</th>
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((a) => {
                  const TypeIcon = TICKET_TYPE_ICONS[a.ticketType] || Ticket;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors text-[12px]">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{a.booking?.fullName || a.booking?.name || "—"}</div>
                        {a.booking?.phone && <div className="text-[10px] text-slate-400">{a.booking.phone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] font-bold text-[#F97316]">{a.booking?.bookingId || "—"}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{a.booking?.tripName || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <TypeIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[10px] font-semibold capitalize text-slate-600">{a.ticketType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px]">{a.requestedByAdmin?.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3 h-3 text-slate-400" />
                          {safeFormatDateTime(a.createdAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {a.ticketNumber ? (
                          <span className="font-mono text-[11px] font-bold text-slate-700">{a.ticketNumber}</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => openDetail(a)}
                            className="h-7 px-2 text-[10px] font-bold"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                          {canApprove && a.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => { setSelectedApproval(a); setConfirmAction("approve"); }}
                                className="h-7 px-2 text-[10px] font-bold bg-emerald-600 text-white"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                onClick={() => { setSelectedApproval(a); setConfirmAction("reject"); setRejectionNote(""); }}
                                className="h-7 px-2 text-[10px] font-bold border-red-200 text-red-600"
                              >
                                <X className="w-3.5 h-3.5 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Showing {approvals.length} of {totalCount}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailOpen && selectedApproval && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#F97316]" />
                <h3 className="text-sm font-bold text-slate-800">Ticket Approval Detail</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { setDetailOpen(false); setSelectedApproval(null); }} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Customer</p>
                  <p className="font-semibold text-slate-800">{selectedApproval.booking?.fullName || selectedApproval.booking?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Booking ID</p>
                  <p className="font-mono font-bold text-[#F97316]">{selectedApproval.booking?.bookingId || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Trip</p>
                  <p className="font-semibold text-slate-800">{selectedApproval.booking?.tripName || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Ticket Type</p>
                  <p className="font-semibold text-slate-800 capitalize">{selectedApproval.ticketType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Ticket Number</p>
                  <p className="font-mono font-bold text-slate-700">{selectedApproval.ticketNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Status</p>
                  <StatusBadge status={selectedApproval.status} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Requested By</p>
                  <p className="font-semibold text-slate-800">{selectedApproval.requestedByAdmin?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Requested At</p>
                  <p className="text-slate-600">{safeFormatDateTime(selectedApproval.createdAt)}</p>
                </div>
                {selectedApproval.reviewedByAdmin && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Reviewed By</p>
                      <p className="font-semibold text-slate-800">{selectedApproval.reviewedByAdmin.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Reviewed At</p>
                      <p className="text-slate-600">{safeFormatDateTime(selectedApproval.reviewedAt)}</p>
                    </div>
                  </>
                )}
              </div>

              {selectedApproval.rejectionNote && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-[10px] font-bold text-red-700 uppercase">Rejection Note</p>
                  <p className="text-[12px] text-red-800 mt-1">{selectedApproval.rejectionNote}</p>
                </div>
              )}

              {selectedApproval.ticketFileUrl && (
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Ticket File</p>
                  <a href={selectedApproval.ticketFileUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[12px] text-blue-600 hover:underline font-semibold mt-1 inline-block">
                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                    View uploaded ticket
                  </a>
                </div>
              )}
            </div>

            {canApprove && selectedApproval.status === "pending" && (
              <div className="border-t border-slate-200 pt-3 flex gap-2 justify-end">
                <Button
                  size="sm"
                  onClick={() => setConfirmAction("approve")}
                  className="h-8 px-3 text-[11px] font-bold bg-emerald-600 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
                <Button
                  size="sm" variant="outline"
                  onClick={() => setConfirmAction("reject")}
                  className="h-8 px-3 text-[11px] font-bold border-red-200 text-red-600"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmAction && selectedApproval && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2">
              {confirmAction === "approve" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <h3 className="text-sm font-bold text-slate-800">
                {confirmAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </h3>
            </div>

            <p className="text-[12px] text-slate-600">
              {confirmAction === "approve"
                ? "This will mark the ticket as approved and issue it to the customer. This action cannot be undone."
                : "This will reject the ticket request. Provide a reason below."}
            </p>

            {confirmAction === "reject" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Rejection Note *</label>
                <Textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  rows={3}
                  required
                  className="text-xs"
                  placeholder="Explain why this ticket is being rejected..."
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => { setConfirmAction(null); setRejectionNote(""); }}
                className="h-8 text-[10px] font-bold uppercase"
                disabled={actionBusy}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (confirmAction === "approve") {
                    handleApprove(selectedApproval.id);
                  } else {
                    handleReject(selectedApproval.id);
                  }
                }}
                disabled={actionBusy || (confirmAction === "reject" && !rejectionNote.trim())}
                className={cn(
                  "h-8 text-[10px] font-bold uppercase text-white",
                  confirmAction === "approve" ? "bg-emerald-600" : "bg-red-600"
                )}
              >
                {actionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                {confirmAction === "approve" ? "Confirm Approve" : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
