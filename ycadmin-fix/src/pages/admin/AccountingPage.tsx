import { useState, useEffect, useCallback } from "react";
import {
  IndianRupee, Filter, Search, Loader2, CheckCircle2, XCircle, Clock,
  Plus, RefreshCw, TrendingUp, Users, AlertTriangle, BarChart3, History,
  ChevronLeft, ChevronRight, Building2, Truck, UserCheck, UtensilsCrossed, Wrench, HelpCircle, Save, Undo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { accountingService, type AccountingEntry } from "@/services/accounting.service";
import { tripsService } from "@/services/trips.service";
import { vendorsService } from "@/services/vendors.service";
import type { Vendor } from "@/types";
import { cn } from "@/lib/utils";

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

const VENDOR_TYPE_ICONS: Record<string, any> = {
  hotel: Building2,
  transport: Truck,
  guide: UserCheck,
  meals: UtensilsCrossed,
  equipment: Wrench,
  other: HelpCircle,
};

const VENDOR_TYPE_COLORS: Record<string, string> = {
  hotel: "bg-blue-100 text-blue-700",
  transport: "bg-amber-100 text-amber-700",
  guide: "bg-emerald-100 text-emerald-700",
  meals: "bg-orange-100 text-orange-700",
  equipment: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-700",
};

type TabId = "customer_ledger" | "customer_reports" | "vendor_accounting";

export default function AccountingPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("customer_ledger");

  // Customer Accounting State
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("ALL");
  const [fMode, setFMode] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [ledgerTotals, setLedgerTotals] = useState({ APPROVED: 0, PENDING: 0, REJECTED: 0 });

  // Create payment dialog
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

  // Reports State
  const [reports, setReports] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Vendor Accounting State
  const [vendorAssignments, setVendorAssignments] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [updatingVendorId, setUpdatingVendorId] = useState<string | null>(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorTypeFilter, setVendorTypeFilter] = useState("ALL");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("ALL");

  // ── Load entries ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await accountingService.getEntries({
        page: String(page),
        limit: String(pageSize),
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(fStatus !== "ALL" ? { status: fStatus } : {}),
        ...(fMode !== "ALL" ? { paymentMode: fMode } : {}),
      });
      setEntries(result.data);
      setLedgerTotals(result.summary);
      setTotalCount(result.pagination.totalCount);
      setTotalPages(result.pagination.totalPages);
    } catch {
      toast.error("Failed to load accounting entries");
    } finally {
      setLoading(false);
    }
  }, [fMode, fStatus, page, pageSize, search]);

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

  const loadVendorAssignments = async () => {
    setLoadingVendors(true);
    try {
      const trips = await tripsService.getAll();
      const allAssignments: any[] = [];
      await Promise.all(
        trips.map(async (trip: any) => {
          try {
            const { assignments } = await vendorsService.getForTrip(trip.id || trip._id);
            if (assignments && assignments.length > 0) {
              assignments.forEach((a: any) => {
                allAssignments.push({
                  ...a,
                  tripName: trip.title,
                  tripCode: trip.tripCode,
                  tripId: trip.id || trip._id
                });
              });
            }
          } catch (e) {
            // Safe fail
          }
        })
      );
      setVendorAssignments(allAssignments);
    } catch (e) {
      toast.error("Failed to load vendor assignments");
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (activeTab === "customer_reports") loadReports();
    if (activeTab === "vendor_accounting") loadVendorAssignments();
  }, [activeTab, loadReports]);

  useEffect(() => { setPage(1); }, [search, fStatus, fMode, pageSize]);

  // ── Filter ──
  const filtered = entries;

  // ── Stats ──
  const totalApproved = ledgerTotals.APPROVED;
  const totalPending = ledgerTotals.PENDING;
  const totalRejected = ledgerTotals.REJECTED;

  const openHistory = async (entry: AccountingEntry) => {
    setHistoryDialog({ open: true, entry: { ...entry, history: undefined } });
    try {
      const history = await accountingService.getEntryHistory(entry.id);
      setHistoryDialog((current) => current.entry?.id === entry.id
        ? { open: true, entry: { ...entry, history } }
        : current);
    } catch {
      toast.error("Failed to load payment history");
    }
  };

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

  // ── Update Vendor Assignment Payment ──
  const handleUpdateVendorPayment = async (assignmentId: string, status: string, paidAmount: number) => {
    setUpdatingVendorId(assignmentId);
    try {
      await vendorsService.updateAssignment(assignmentId, { paymentStatus: status as any, paidAmount });
      toast.success("Vendor payment updated successfully");
      loadVendorAssignments();
    } catch {
      toast.error("Failed to update vendor payment");
    } finally {
      setUpdatingVendorId(null);
    }
  };

  const canApprove = user?.role && ["superadmin", "admin", "finance"].includes(user.role);

  // Filtered Vendor Assignments
  const filteredVendors = vendorAssignments.filter(a => {
    const vendor = typeof a.vendorId === 'object' ? a.vendorId as Vendor : null;
    if (!vendor) return false;
    
    const matchesSearch = vendor.name.toLowerCase().includes(vendorSearch.toLowerCase()) || 
                          a.tripName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                          a.tripCode.toLowerCase().includes(vendorSearch.toLowerCase());
                          
    const matchesType = vendorTypeFilter === "ALL" || vendor.type === vendorTypeFilter;
    const matchesStatus = vendorStatusFilter === "ALL" || a.paymentStatus === vendorStatusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const menuItems = [
    { id: "customer_ledger", label: "Customer Ledger", icon: IndianRupee },
    { id: "customer_reports", label: "Customer Reports", icon: BarChart3 },
    { id: "vendor_accounting", label: "Vendor Accounting", icon: Building2 }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-100">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Accounting & <span className="text-primary">Collections</span></h1>
          <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">Manage customer payments, vendor invoices, reports, and ledger entry allocations</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "customer_ledger" && (
            <>
              <Button size="sm" variant="outline" onClick={load} className="h-9.5 text-xs font-bold uppercase tracking-wider rounded-xl">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)} className="h-9.5 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Entry
              </Button>
            </>
          )}
          {activeTab === "vendor_accounting" && (
            <Button size="sm" variant="outline" onClick={loadVendorAssignments} className="h-9.5 text-xs font-bold uppercase tracking-wider rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reload Assignments
            </Button>
          )}
        </div>
      </div>

      {/* Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Secondary Vertical Menu */}
        <div className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar pb-3 lg:pb-0 gap-1 bg-slate-50/50 p-2 rounded-2xl border border-slate-100 lg:sticky lg:top-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabId)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-white text-primary border-l-[3.5px] border-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary animate-pulse" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Main Content Panel */}
        <div className="lg:col-span-9 animate-fade-in">
          
          {/* CUSTOMER LEDGER TAB */}
          {activeTab === "customer_ledger" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-emerald-55/40 border border-emerald-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Approved Collection</p>
                  <p className="text-3xl font-black text-emerald-800 mt-1">₹{totalApproved.toLocaleString("en-IN")}</p>
                </Card>
                <Card className="bg-amber-55/40 border border-amber-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending Approvals</p>
                  <p className="text-3xl font-black text-amber-800 mt-1">₹{totalPending.toLocaleString("en-IN")}</p>
                </Card>
                <Card className="bg-red-55/40 border border-red-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Rejected Entries</p>
                  <p className="text-3xl font-black text-red-800 mt-1">₹{totalRejected.toLocaleString("en-IN")}</p>
                </Card>
              </div>

              {/* Filters */}
              <div className="bg-white border rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
                <Filter className="w-4 h-4 text-slate-450" />
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search booking / customer / trip…"
                    className="h-10 text-xs pl-10 rounded-xl" 
                  />
                </div>
                <Select value={fStatus} onValueChange={setFStatus}>
                  <SelectTrigger className="h-10 text-xs w-40 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={fMode} onValueChange={setFMode}>
                  <SelectTrigger className="h-10 text-xs w-44 rounded-xl"><SelectValue placeholder="Payment Mode" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ALL">All Modes</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-4 bg-white rounded-3xl border">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Loading ledger collections...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border">
                  <IndianRupee className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">No collections match your filters.</p>
                </div>
              ) : (
                <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                          <th className="text-left p-4">Booking ID / Client</th>
                          <th className="text-left p-4">Trip Details</th>
                          <th className="text-left p-4">Amount</th>
                          <th className="text-left p-4">Mode</th>
                          <th className="text-left p-4">Reference</th>
                          <th className="text-left p-4">Salesperson</th>
                          <th className="text-center p-4">Status</th>
                          <th className="text-right p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filtered.map((entry) => {
                          const status = STATUS_STYLES[entry.status] || STATUS_STYLES.PENDING;
                          const StatusIcon = status.icon;
                          return (
                            <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-800">{entry.booking?.bookingId || entry.bookingId}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{entry.booking?.fullName || entry.booking?.name || "N/A"}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-800 truncate max-w-[150px]">{entry.booking?.tripName || "N/A"}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{new Date(entry.createdAt).toLocaleDateString()}</div>
                              </td>
                              <td className="p-4 font-bold text-slate-900">₹{entry.amount.toLocaleString("en-IN")}</td>
                              <td className="p-4">{MODE_LABELS[entry.paymentMode] || entry.paymentMode}</td>
                              <td className="p-4 font-mono text-[10px]">{entry.referenceNumber || "N/A"}</td>
                              <td className="p-4 text-[10px]">{entry.salesperson?.name || "System"}</td>
                              <td className="p-4 text-center">
                                <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border", status.bg, status.text)}>
                                  <StatusIcon className="w-3 h-3" /> {entry.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-450 hover:text-slate-800" onClick={() => openHistory(entry)} title="View Logs">
                                    <History className="w-4 h-4" />
                                  </Button>
                                  {entry.status === "PENDING" && canApprove && (
                                    <>
                                      <Button size="sm" variant="ghost" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold uppercase" onClick={() => handleApprove(entry.id)}>
                                        Approve
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] font-bold uppercase" onClick={() => setRejectDialog({ open: true, entryId: entry.id })}>
                                        Reject
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Page {page} of {totalPages} ({totalCount} entries)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CUSTOMER REPORTS TAB */}
          {activeTab === "customer_reports" && (
            <div className="space-y-6">
              {reportsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4 bg-white rounded-3xl border">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-wider">Compiling Reports...</p>
                </div>
              ) : !reports ? (
                <div className="text-center py-16 bg-white rounded-3xl border">
                  <BarChart3 className="w-12 h-12 text-slate-350 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">Failed to compile reports. Reload page to retry.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  {/* Collections by salesperson */}
                  <Card className="rounded-3xl border border-slate-200 p-6 bg-white">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> Collection by Representative</h4>
                    <div className="space-y-4">
                      {reports.salespersonCollection?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                          <span className="truncate max-w-[150px]">{item.salespersonName || "Internal"}</span>
                          <span className="font-bold text-slate-900">₹{item.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      {(!reports.salespersonCollection || reports.salespersonCollection.length === 0) && (
                        <div className="text-center py-8 text-slate-400 text-xs">No collections logged.</div>
                      )}
                    </div>
                  </Card>

                  {/* Revenue per trip */}
                  <Card className="rounded-3xl border border-slate-200 p-6 bg-white">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" /> Collection per Tour package</h4>
                    <div className="space-y-4">
                      {reports.revenuePerTrip?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                          <span className="truncate max-w-[150px]">{item.tripName || "Tour"}</span>
                          <span className="font-bold text-slate-900">₹{item.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      {(!reports.revenuePerTrip || reports.revenuePerTrip.length === 0) && (
                        <div className="text-center py-8 text-slate-400 text-xs">No collections logged.</div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* VENDOR ACCOUNTING TAB */}
          {activeTab === "vendor_accounting" && (
            <div className="space-y-6">
              {/* Vendor Filters */}
              <div className="bg-white border rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
                <Filter className="w-4 h-4 text-slate-450" />
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input 
                    value={vendorSearch} 
                    onChange={(e) => setVendorSearch(e.target.value)}
                    placeholder="Search vendor name, trip name or trip code…"
                    className="h-10 text-xs pl-10 rounded-xl" 
                  />
                </div>
                <Select value={vendorTypeFilter} onValueChange={setVendorTypeFilter}>
                  <SelectTrigger className="h-10 text-xs w-40 rounded-xl"><SelectValue placeholder="Vendor Type" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="hotel">🏨 Hotel</SelectItem>
                    <SelectItem value="transport">🚌 Transport</SelectItem>
                    <SelectItem value="guide">👤 Guide</SelectItem>
                    <SelectItem value="meals">🍽️ Meals</SelectItem>
                    <SelectItem value="equipment">🔧 Equipment</SelectItem>
                    <SelectItem value="other">❓ Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={vendorStatusFilter} onValueChange={setVendorStatusFilter}>
                  <SelectTrigger className="h-10 text-xs w-40 rounded-xl"><SelectValue placeholder="Payment Status" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="partial">🟡 Partial</SelectItem>
                    <SelectItem value="paid">✅ Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              {loadingVendors ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-4 bg-white rounded-3xl border">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Loading vendor payables...</p>
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border">
                  <Building2 className="w-12 h-12 text-slate-350 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">No vendor assignments match your filters.</p>
                </div>
              ) : (
                <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                          <th className="text-left p-4">Vendor</th>
                          <th className="text-left p-4">Trip Details</th>
                          <th className="text-left p-4">Agreed Cost</th>
                          <th className="text-left p-4">Paid Amount</th>
                          <th className="text-left p-4">Balance</th>
                          <th className="text-center p-4">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredVendors.map((a) => {
                          const vendor = typeof a.vendorId === 'object' ? a.vendorId as Vendor : null;
                          if (!vendor) return null;
                          const TypeIcon = VENDOR_TYPE_ICONS[vendor.type] || HelpCircle;
                          const isUpdating = updatingVendorId === a.id;
                          const balance = (a.agreedCost || 0) - (a.paidAmount || 0);

                          return (
                            <tr key={a.id || a._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", VENDOR_TYPE_COLORS[vendor.type])}>
                                    <TypeIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800">{vendor.name}</div>
                                    <div className="text-[10px] text-slate-450 mt-0.5 capitalize">{vendor.type}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-800">{a.tripName}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{a.tripCode}</div>
                              </td>
                              <td className="p-4 font-bold text-slate-900">₹{a.agreedCost.toLocaleString()}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Paid amount"
                                    defaultValue={a.paidAmount || 0}
                                    disabled={isUpdating}
                                    className="h-8 w-24 rounded-lg text-xs"
                                    onBlur={(e) => {
                                      const val = Number(e.target.value);
                                      if (val !== a.paidAmount) {
                                        const status = val >= a.agreedCost ? 'paid' : val > 0 ? 'partial' : 'pending';
                                        handleUpdateVendorPayment(a.id || a._id!, status, val);
                                      }
                                    }}
                                  />
                                  {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                                </div>
                              </td>
                              <td className={`p-4 font-bold ${balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                ₹{balance.toLocaleString()}
                              </td>
                              <td className="p-4 text-center">
                                <Select
                                  value={a.paymentStatus}
                                  disabled={isUpdating}
                                  onValueChange={(v) => handleUpdateVendorPayment(a.id || a._id!, v, a.paidAmount)}
                                >
                                  <SelectTrigger className="h-8 w-28 rounded-lg text-[10px] font-bold uppercase mx-auto">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">⏳ Pending</SelectItem>
                                    <SelectItem value="partial">🟡 Partial</SelectItem>
                                    <SelectItem value="paid">✅ Paid</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="rounded-3xl border p-0 max-w-md">
          <div className="px-6 py-5 border-b bg-muted/10">
            <DialogHeader>
              <DialogTitle className="text-base font-black uppercase tracking-tight">Create Manual Payment Roster</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">Record client collection cash/UPI receipts.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Booking Reference ID *</label>
              <Input value={form.bookingId} onChange={(e) => setForm({...form, bookingId: e.target.value})} placeholder="e.g. YC-2026-1002" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount Collected (₹) *</label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment Mode *</label>
              <Select value={form.paymentMode} onValueChange={(v) => setForm({...form, paymentMode: v})}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="CASH">💵 Cash Collection</SelectItem>
                  <SelectItem value="UPI">📱 UPI Payment</SelectItem>
                  <SelectItem value="BANK_TRANSFER">🏦 Bank Wire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Transaction ID / Reference</label>
              <Input value={form.referenceNumber} onChange={(e) => setForm({...form, referenceNumber: e.target.value})} placeholder="Reference details" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Internal Audit Notes</label>
              <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Additional details..." className="rounded-xl min-h-[60px]" />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex gap-2 rounded-b-3xl">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl h-9">Cancel</Button>
            <Button onClick={handleCreate} disabled={creating} className="rounded-xl h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-widest">
              {creating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => !o && setRejectDialog({ open: false, entryId: "" })}>
        <DialogContent className="rounded-3xl border p-0 max-w-sm">
          <div className="px-6 py-5 border-b bg-muted/10">
            <DialogHeader>
              <DialogTitle className="text-base font-black uppercase tracking-tight text-red-650">Decline Ledger Payment</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium font-sans">Provide auditing reasons to reject this collection claim.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Reason for Rejection *</label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="State audit mismatches or missing receipt details..." className="rounded-xl min-h-[80px]" />
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex gap-2 rounded-b-3xl">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, entryId: "" })} className="rounded-xl h-9">Cancel</Button>
            <Button onClick={handleReject} disabled={rejecting} className="rounded-xl h-9 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-widest">
              {rejecting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null} Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HISTORY LOG DIALOG */}
      <Dialog open={historyDialog.open} onOpenChange={(o) => !o && setHistoryDialog({ open: false, entry: null })}>
        <DialogContent className="rounded-3xl border p-0 max-w-md">
          <div className="px-6 py-5 border-b bg-muted/10">
            <DialogHeader>
              <DialogTitle className="text-base font-black uppercase tracking-tight">Ledger Allocation Audit Trail</DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 py-5 space-y-4 max-h-[300px] overflow-y-auto">
            {historyDialog.entry?.history?.map((log) => (
              <div key={log.id} className="text-xs border-l-2 border-slate-200 pl-3 py-1 space-y-1">
                <div className="font-bold text-slate-800">{log.action}</div>
                {log.notes && <div className="text-slate-500 text-[11px] leading-relaxed">{log.notes}</div>}
                <div className="text-[9px] text-slate-450 uppercase font-bold mt-0.5">
                  By {log.actor?.name || "System"} on {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
            {(!historyDialog.entry?.history || historyDialog.entry.history.length === 0) && (
              <div className="text-center py-8 text-slate-450 gap-2 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading logs...
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex justify-end rounded-b-3xl">
            <Button onClick={() => setHistoryDialog({ open: false, entry: null })} className="rounded-xl h-9">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
