import { useState, useEffect, useCallback } from "react";
import {
  IndianRupee, Filter, Search, Loader2, CheckCircle2, XCircle, Clock,
  Plus, RefreshCw, TrendingUp, Users, AlertTriangle, BarChart3, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { accountingService, type AccountingEntry } from "@/services/accounting.service";

// ── Status Styles ──
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING:  { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock },
  APPROVED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
  REJECTED: { bg: "bg-red-50 border-red-200", text: "text-red-600", icon: XCircle },
};

const MODE_LABELS: Record<string, string> = {
  CASH: "💵 Cash",
  UPI: "📱 UPI",
  BANK_TRANSFER: "🏦 Bank Transfer",
};

export default function AccountingPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ledger" | "reports">("ledger");

  // Filters
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("ALL");
  const [fMode, setFMode] = useState("ALL");

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    bookingId: "", amount: "", paymentMode: "CASH", referenceNumber: "", notes: ""
  });

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; entryId: string }>({ open: false, entryId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // History dialog
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; entry: AccountingEntry | null }>({ open: false, entry: null });

  // Reports
  const [reports, setReports] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // ── Load entries ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountingService.getEntries();
      setEntries(data);
    } catch {
      toast.error("Failed to load accounting entries");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const data = await accountingService.getReports();
      setReports(data);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "reports") loadReports(); }, [tab, loadReports]);

  // ── Filter ──
  const filtered = entries.filter((e) => {
    const matchSearch = !search ||
      [e.booking?.name, e.booking?.fullName, e.booking?.bookingId, e.booking?.tripName, e.referenceNumber]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = fStatus === "ALL" || e.status === fStatus;
    const matchMode = fMode === "ALL" || e.paymentMode === fMode;
    return matchSearch && matchStatus && matchMode;
  });

  // ── Stats ──
  const totalApproved = entries.filter(e => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0);
  const totalPending = entries.filter(e => e.status === "PENDING").reduce((s, e) => s + e.amount, 0);
  const totalRejected = entries.filter(e => e.status === "REJECTED").reduce((s, e) => s + e.amount, 0);

  // ── Create ──
  const handleCreate = async () => {
    if (!form.bookingId || !form.amount || !form.paymentMode) {
      toast.error("Booking ID, amount, and payment mode are required");
      return;
    }
    setCreating(true);
    try {
      await accountingService.createEntry({
        bookingId: form.bookingId,
        amount: parseFloat(form.amount),
        paymentMode: form.paymentMode,
        referenceNumber: form.referenceNumber || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Payment entry submitted for approval");
      setShowCreate(false);
      setForm({ bookingId: "", amount: "", paymentMode: "CASH", referenceNumber: "", notes: "" });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create entry");
    } finally {
      setCreating(false);
    }
  };

  // ── Approve ──
  const handleApprove = async (id: string) => {
    try {
      await accountingService.approveEntry(id);
      toast.success("Payment approved");
      load();
    } catch {
      toast.error("Failed to approve");
    }
  };

  // ── Reject ──
  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error("Rejection reason is required"); return; }
    setRejecting(true);
    try {
      await accountingService.rejectEntry(rejectDialog.entryId, rejectReason);
      toast.success("Payment rejected");
      setRejectDialog({ open: false, entryId: "" });
      setRejectReason("");
      load();
    } catch {
      toast.error("Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  const canApprove = user?.role && ["superadmin", "admin", "finance"].includes(user.role);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-600" /> Accounting & Collections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Track manual payments, approvals, and financial performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} className="h-8 text-[10px] font-bold uppercase">
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="h-8 text-[10px] font-bold uppercase bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-3 h-3 mr-1" /> New Payment
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 w-fit">
        <button onClick={() => setTab("ledger")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${tab === "ledger" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          📋 Ledger
        </button>
        <button onClick={() => setTab("reports")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${tab === "reports" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          📊 Reports
        </button>
      </div>

      {tab === "ledger" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">₹{totalApproved.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Approval</p>
              <p className="text-2xl font-black text-amber-800 mt-1">₹{totalPending.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Rejected</p>
              <p className="text-2xl font-black text-red-800 mt-1">₹{totalRejected.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap gap-3 items-center">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search booking / customer / trip…"
                className="h-8 text-xs pl-7 w-52" />
            </div>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fMode} onValueChange={setFMode}>
              <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Payment Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Modes</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 bg-slate-50 rounded-xl border border-slate-100">
              <IndianRupee className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No entries match your filters.</p>
              <p className="text-[10px] text-slate-400 mt-1">Showing {filtered.length} of {entries.length} entries</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="text-left p-3">Booking</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Trip</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-center p-3">Mode</th>
                    <th className="text-center p-3">Status</th>
                    <th className="text-left p-3">Salesperson</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => {
                    const st = STATUS_STYLES[e.status] || STATUS_STYLES.PENDING;
                    const Icon = st.icon;
                    return (
                      <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-700">{e.booking?.bookingId || e.bookingId}</td>
                        <td className="p-3 text-slate-700">{e.booking?.fullName || e.booking?.name || "—"}</td>
                        <td className="p-3 text-slate-600">{e.booking?.tripName || "—"}</td>
                        <td className="p-3 text-right font-bold text-slate-800">₹{e.amount.toLocaleString("en-IN")}</td>
                        <td className="p-3 text-center">{MODE_LABELS[e.paymentMode] || e.paymentMode}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.bg} ${st.text}`}>
                            <Icon className="w-3 h-3" /> {e.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{e.salesperson?.name || "—"}</td>
                        <td className="p-3 text-slate-500">{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {canApprove && e.status === "PENDING" && (
                              <>
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => handleApprove(e.id)}>
                                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> Approve
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-red-600 hover:bg-red-50"
                                  onClick={() => setRejectDialog({ open: true, entryId: e.id })}>
                                  <XCircle className="w-3 h-3 mr-0.5" /> Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-slate-500 hover:bg-slate-100"
                              onClick={() => setHistoryDialog({ open: true, entry: e })}>
                              <History className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="bg-slate-50 px-3 py-2 text-[10px] text-slate-400 font-medium border-t border-slate-100">
                Showing {filtered.length} of {entries.length} entries
              </div>
            </div>
          )}
        </>
      )}

      {/* Reports Tab */}
      {tab === "reports" && (
        <div className="space-y-5">
          {reportsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading reports…
            </div>
          ) : !reports ? (
            <div className="text-center py-14 text-slate-400">No report data available.</div>
          ) : (
            <>
              {/* Pending Total Card */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Total Pending Collections</p>
                </div>
                <p className="text-3xl font-black text-amber-800">₹{(reports.pendingTotal || 0).toLocaleString("en-IN")}</p>
              </div>

              {/* Revenue per Trip */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-blue-500" /> Revenue per Trip
                </h3>
                {reports.revenuePerTrip?.length > 0 ? (
                  <div className="space-y-2">
                    {reports.revenuePerTrip.map((r: any) => (
                      <div key={r.tripName} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                        <span className="text-xs font-semibold text-slate-700">{r.tripName}</span>
                        <span className="text-xs font-black text-emerald-700">₹{r.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400">No approved revenue yet.</p>}
              </div>

              {/* Salesperson Performance */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-indigo-500" /> Salesperson Collection Performance
                </h3>
                {reports.salespersonCollection?.length > 0 ? (
                  <div className="space-y-2">
                    {reports.salespersonCollection.map((s: any, i: number) => (
                      <div key={s.salespersonName} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                        <span className="text-xs font-semibold text-slate-700">
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black mr-2">{i + 1}</span>
                          {s.salespersonName}
                        </span>
                        <span className="text-xs font-black text-indigo-700">₹{s.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400">No salesperson data yet.</p>}
              </div>

              {/* Monthly Revenue Trend */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Monthly Revenue Trend
                </h3>
                {reports.monthlyRevenue?.length > 0 ? (
                  <div className="space-y-2">
                    {reports.monthlyRevenue.map((m: any) => (
                      <div key={m.month} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                        <span className="text-xs font-semibold text-slate-700">{m.month}</span>
                        <span className="text-xs font-black text-emerald-700">₹{m.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400">No monthly data yet.</p>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Create Payment Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Submit Manual Payment</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Enter the payment details received from the customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Booking ID *</label>
              <Input value={form.bookingId} onChange={e => setForm(p => ({ ...p, bookingId: e.target.value }))}
                placeholder="e.g. BK-ABCDEF1234" className="h-8 text-xs mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Amount (₹) *</label>
              <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="e.g. 3000" className="h-8 text-xs mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Payment Mode *</label>
              <Select value={form.paymentMode} onValueChange={v => setForm(p => ({ ...p, paymentMode: v }))}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">💵 Cash</SelectItem>
                  <SelectItem value="UPI">📱 UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">🏦 Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Reference / Transaction ID</label>
              <Input value={form.referenceNumber} onChange={e => setForm(p => ({ ...p, referenceNumber: e.target.value }))}
                placeholder="Optional" className="h-8 text-xs mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Notes</label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes" className="text-xs mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={creating} className="text-xs bg-emerald-600 hover:bg-emerald-700">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectDialog.open} onOpenChange={o => { if (!o) setRejectDialog({ open: false, entryId: "" }); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-red-700">Reject Payment Entry</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Please provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Rejection reason…" className="text-xs" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectDialog({ open: false, entryId: "" })} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleReject} disabled={rejecting} className="text-xs bg-red-600 hover:bg-red-700">
              {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── History Dialog ── */}
      <Dialog open={historyDialog.open} onOpenChange={o => { if (!o) setHistoryDialog({ open: false, entry: null }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Payment History</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {historyDialog.entry?.booking?.bookingId} — ₹{historyDialog.entry?.amount?.toLocaleString("en-IN")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
            {historyDialog.entry?.history?.length ? (
              historyDialog.entry.history.map((log) => (
                <div key={log.id} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700">{log.action}</span>
                    <span className="text-[9px] text-slate-400">{new Date(log.createdAt).toLocaleString("en-IN")}</span>
                  </div>
                  {log.notes && <p className="text-[10px] text-slate-500 mt-0.5">{log.notes}</p>}
                  <p className="text-[9px] text-slate-400 mt-0.5">by {log.actor?.name || "System"}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No history available.</p>
            )}
            {historyDialog.entry?.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-[10px] font-bold text-red-700">Rejection Reason</p>
                <p className="text-[10px] text-red-600">{historyDialog.entry.rejectionReason}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
