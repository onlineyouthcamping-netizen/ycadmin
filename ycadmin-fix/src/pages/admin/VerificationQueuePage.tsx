import { useState, useEffect, useCallback } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight, RotateCw, CheckCircle2,
  XCircle, AlertCircle, Clock, Train, Eye, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bookingVerificationService } from "@/services/bookingVerification.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import VerificationDetailsPanel from "@/components/admin/VerificationDetailsPanel";

// ── STATUS CONFIGURATION ──
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  DRAFT:                { bg: "bg-gray-50",    text: "text-gray-600",    dot: "bg-gray-400",    label: "Draft" },
  PENDING_VERIFICATION: { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   label: "Pending" },
  CHANGES_REQUESTED:    { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400",  label: "Changes Requested" },
  VERIFIED:             { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Verified" },
  APPROVED:             { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Approved" },
  REJECTED:             { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400",     label: "Rejected" },
  ISSUED:               { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400",    label: "Issued" },
  PENDING:              { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   label: "Pending" },
};

const TABS = [
  { key: "",                     label: "All" },
  { key: "PENDING_VERIFICATION", label: "Pending" },
  { key: "CHANGES_REQUESTED",    label: "Changes Requested" },
  { key: "VERIFIED",             label: "Verified" },
  { key: "REJECTED",             label: "Rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export default function VerificationQueuePage() {
  const { admin } = useAuthStore();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 15;

  // Panel state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const canVerify = admin?.role && ["superadmin", "admin", "BOOKING_VERIFIER"].includes(admin.role);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingVerificationService.getVerificationQueue({
        page,
        limit: LIMIT,
        status: activeTab || undefined,
      });

      const data = res.data || res;
      setItems(Array.isArray(data) ? data : data.items || data.verifications || []);
      const pg = data.pagination || data;
      setTotalPages(pg.totalPages || Math.ceil((pg.total || 0) / LIMIT) || 1);
      setTotalCount(pg.total || pg.totalCount || 0);
    } catch (err: any) {
      console.error("Failed to load verification queue:", err);
      toast.error("Failed to load verification queue");
      setItems([]);
    }
    setLoading(false);
  }, [page, activeTab]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const filteredItems = search
    ? items.filter(
        (item) =>
          (item.bookingId || item.booking?.bookingId || "").toLowerCase().includes(search.toLowerCase()) ||
          (item.customerName || item.booking?.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
          (item.tripName || item.booking?.tripName || "").toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const handleRowClick = (item: any) => {
    const bId = item.bookingId || item.booking?.id || item.id;
    setSelectedBookingId(bId);
    setSelectedBooking(item.booking || item);
  };

  const handleQuickAction = async (e: React.MouseEvent, bookingId: string, action: string) => {
    e.stopPropagation();
    try {
      await bookingVerificationService.performVerificationAction(bookingId, { action });
      toast.success(`${action.replace(/_/g, " ")} completed`);
      loadQueue();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Verification Queue
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Review and verify bookings before confirmation · {totalCount} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search by ID, name, trip..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 pl-9 text-[11px] rounded-lg border-slate-200"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadQueue}
            className="h-9 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[12px] font-semibold text-slate-500">No verifications found</p>
            <p className="text-[10px] text-slate-400 mt-1">
              {activeTab ? "Try a different filter" : "All caught up!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Booking ID
                  </th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Trip
                  </th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Submitted
                  </th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Verification
                  </th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Ticket
                  </th>
                  <th className="text-right px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const b = item.booking || item;
                  const bookingId = item.bookingId || b.bookingId || b.id;
                  const vStatus = item.verificationStatus || item.status || "PENDING_VERIFICATION";
                  const tStatus = item.trainTicketStatus || item.ticketStatus || null;

                  return (
                    <tr
                      key={bookingId || idx}
                      onClick={() => handleRowClick(item)}
                      className="border-b border-slate-50 hover:bg-blue-50/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold text-primary tracking-tight">
                          {b.bookingId || bookingId?.slice(-8) || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold text-slate-800">
                          {b.fullName || b.name || item.customerName || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-slate-600 font-medium">
                          {b.tripName || item.tripName || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-slate-500 font-medium">
                          {item.submittedAt || item.createdAt
                            ? new Date(item.submittedAt || item.createdAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={vStatus} />
                      </td>
                      <td className="px-4 py-3">
                        {tStatus ? (
                          <StatusBadge status={tStatus} />
                        ) : (
                          <span className="text-[9px] text-slate-300 font-medium uppercase">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                            className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          {canVerify && vStatus === "PENDING_VERIFICATION" && (
                            <>
                              <button
                                onClick={(e) => handleQuickAction(e, bookingId, "VERIFY")}
                                className="w-7 h-7 rounded-md bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                                title="Verify"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                              <button
                                onClick={(e) => handleQuickAction(e, bookingId, "REJECT")}
                                className="w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                              </button>
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] text-slate-500 font-medium">
              Page {page} of {totalPages} · {totalCount} items
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pageNum = start + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg text-[10px] font-bold",
                      page === pageNum && "bg-primary text-white"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Details Panel */}
      <VerificationDetailsPanel
        bookingId={selectedBookingId || ""}
        booking={selectedBooking}
        open={!!selectedBookingId}
        onClose={() => {
          setSelectedBookingId(null);
          setSelectedBooking(null);
        }}
        onRefresh={loadQueue}
      />
    </div>
  );
}
