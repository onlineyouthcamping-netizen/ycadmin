import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Train,
  Eye,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  FileText,
  ArrowRightLeft,
  Check,
  X,
  ShieldAlert,
  Inbox,
  MessageSquare,
  HelpCircle,
  Activity,
  Banknote,
  ArrowUpRight,
  Smartphone,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bookingVerificationService } from "@/services/bookingVerification.service";
import { trainTicketService } from "@/services/trainTicket.service";
import { bookingsService } from "@/services/bookings.service";
import { financeControllerService } from "@/services/financeController.service";
import type { IncomingPaymentItem, VendorPaymentRequestItem } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import { cn, safeFormatDate } from "@/lib/utils";
import VerificationDetailsPanel from "@/components/admin/VerificationDetailsPanel";

// ── STATUS CONFIGURATION ──
const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  DRAFT: {
    bg: "bg-slate-50",
    text: "text-slate-655",
    dot: "bg-slate-400",
    label: "Draft",
  },
  PENDING_VERIFICATION: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Pending Review",
  },
  CHANGES_REQUESTED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Changes Requested",
  },
  VERIFIED: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Verified",
  },
  APPROVED: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Verified",
  },
  REJECTED: {
    bg: "bg-red-50",
    text: "text-red-650",
    dot: "bg-red-550",
    label: "Rejected",
  },
  ISSUED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Issued",
  },
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-550",
    label: "Pending",
  },
  // Train Ticket mappings
  SUBMITTED: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Pending Review",
  },
  REOPENED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Changes Requested",
  },
};

const TABS = [
  { key: "", label: "All" },
  { key: "PENDING_VERIFICATION", label: "Pending" },
  { key: "CHANGES_REQUESTED", label: "Changes Requested" },
  { key: "VERIFIED", label: "Verified" },
  { key: "REJECTED", label: "Rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || {
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: status,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border font-sans",
        s.bg === "bg-slate-50"
          ? "border-slate-200"
          : s.bg === "bg-amber-50"
            ? "border-amber-200"
            : s.bg === "bg-blue-50"
              ? "border-blue-200"
              : s.bg === "bg-green-50"
                ? "border-green-200"
                : "border-red-200",
        s.text,
      )}
    >
      <span className={cn("w-1 h-1 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

interface VerificationQueuePageProps {
  defaultQueue?: "booking" | "train";
  hideHeader?: boolean;
  hideSideNav?: boolean;
}

export default function VerificationQueuePage({
  defaultQueue = "booking",
  hideHeader = false,
  hideSideNav = false,
}: VerificationQueuePageProps) {
  const { admin } = useAuthStore();

  // Train ticketing module removed — booking verification only
  const [activeQueue, setActiveQueue] = useState<"booking" | "train">("booking");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 15;

  const [bookingPendingCount, setBookingPendingCount] = useState(0);
  const [trainPendingCount, setTrainPendingCount] = useState(0);

  // Quick-filter view mode
  type ViewMode = "booking" | "station" | "outgoing";
  const [viewMode, setViewMode] = useState<ViewMode>("booking");
  const [stationItems, setStationItems] = useState<IncomingPaymentItem[]>([]);
  const [outgoingItems, setOutgoingItems] = useState<VendorPaymentRequestItem[]>([]);
  const [stationPendingCount, setStationPendingCount] = useState(0);
  const [outgoingPendingCount, setOutgoingPendingCount] = useState(0);
  const [subLoading, setSubLoading] = useState(false);
  const [stationStatusFilter, setStationStatusFilter] = useState("");
  const [outgoingStatusFilter, setOutgoingStatusFilter] = useState("");

  // Panel state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const canVerify = hasPermission(
    (admin as any)?.permissions || (admin as any)?.customPermissions,
    "bookings.verify",
    admin?.role,
  );

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      // Load pending counts for sidebar badges
      const [verifRes, trainRes, bookingsRes] = await Promise.all([
        bookingVerificationService
          .getVerificationQueue({
            page: 1,
            limit: 100,
            status: "PENDING_VERIFICATION",
          })
          .catch(() => ({ data: [] })),
        trainTicketService.getApprovalsQueue().catch(() => ({ data: [] })),
        bookingsService
          .getAll({ status: "confirmed", limit: 200 })
          .catch(() => ({ data: [] })),
      ]);
      const vItems: any = verifRes.data || verifRes;
      const tItems: any[] = trainRes.data || [];
      const bRes = bookingsRes.data || bookingsRes;
      const bookingsList = Array.isArray(bRes)
        ? bRes
        : Array.isArray(bRes.data)
          ? bRes.data
          : bRes.bookings || [];

      // Find bookings with 0 tickets
      const ticketedBookingIds = new Set(tItems.map((t: any) => t.bookingId));
      const ungeneratedBookings = bookingsList.filter((b: any) => {
        const bId = b.id || b.bookingId;
        return !ticketedBookingIds.has(bId);
      });

      // Map ungenerated bookings to pseudo tickets
      const pseudoTickets = ungeneratedBookings.map((b: any) => ({
        id: `pseudo-${b.id || b.bookingId}`,
        bookingId: b.id || b.bookingId,
        travelerName: b.fullName || b.name || "TBD",
        pnr: "NOT GENERATED",
        trainName: "—",
        trainNumber: "—",
        approvalStatus: "DRAFT",
        ticketStatus: "PENDING",
        createdAt: b.createdAt || new Date().toISOString(),
        booking: b,
        isPseudo: true,
      }));

      setBookingPendingCount(
        Array.isArray(vItems)
          ? vItems.length
          : (vItems.items || vItems.verifications || []).length,
      );

      const pendingT = tItems.filter(
        (x: any) => x.approvalStatus === "SUBMITTED",
      );
      setTrainPendingCount(pendingT.length + pseudoTickets.length);

      if (activeQueue === "train") {
        let tList = [...tItems, ...pseudoTickets];
        if (activeTab === "PENDING_VERIFICATION") {
          tList = tList.filter(
            (x: any) => x.approvalStatus === "SUBMITTED" || x.isPseudo,
          );
        } else if (activeTab === "CHANGES_REQUESTED") {
          tList = tList.filter(
            (x: any) => x.approvalStatus === "REOPENED" && !x.isPseudo,
          );
        } else if (activeTab === "VERIFIED") {
          tList = tList.filter(
            (x: any) => x.approvalStatus === "APPROVED" && !x.isPseudo,
          );
        } else if (activeTab === "REJECTED") {
          tList = tList.filter(
            (x: any) => x.approvalStatus === "REJECTED" && !x.isPseudo,
          );
        }
        setItems(tList);
        setTotalPages(1);
        setTotalCount(tList.length);
      } else {
        const res = await bookingVerificationService.getVerificationQueue({
          page,
          limit: LIMIT,
          status: activeTab || undefined,
        });

        const data = res.data || res;
        setItems(
          Array.isArray(data) ? data : data.items || data.verifications || [],
        );
        const pg = data.pagination || data;
        setTotalPages(pg.totalPages || Math.ceil((pg.total || 0) / LIMIT) || 1);
        setTotalCount(pg.total || pg.totalCount || 0);
      }
    } catch (err: any) {
      console.error("Failed to load queue:", err);
      toast.error("Failed to load queue");
      setItems([]);
    }
    setLoading(false);
  }, [page, activeTab, activeQueue]);

  const loadSubQueues = useCallback(async () => {
    try {
      const [inRes, outRes] = await Promise.all([
        financeControllerService.getIncomingQueue({ limit: 200 }).catch(() => ({ data: [], pagination: {} })),
        financeControllerService.getVendorQueue({ limit: 200 }).catch(() => ({ data: [], pagination: {} })),
      ]);
      const incoming: IncomingPaymentItem[] = inRes.data || [];
      const vendor: VendorPaymentRequestItem[] = outRes.data || [];
      setStationItems(incoming);
      setOutgoingItems(vendor);
      setStationPendingCount(incoming.filter((i) => i.status === "PENDING" || i.status === "PENDING_VERIFICATION").length);
      setOutgoingPendingCount(vendor.filter((v) => v.paymentStatus === "pending").length);
    } catch {
      // silent — sub-queue errors don't break main queue
    }
  }, []);

  useEffect(() => {
    loadQueue();
    loadSubQueues();
  }, [loadQueue, loadSubQueues]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, activeQueue]);

  // Derived KPI Counts
  const pendingCount = useMemo(() => {
    if (activeQueue === "train") {
      return items.filter((i) => (i.approvalStatus || i.status) === "SUBMITTED")
        .length;
    }
    return items.filter(
      (i) => (i.verificationStatus || i.status) === "PENDING_VERIFICATION",
    ).length;
  }, [items, activeQueue]);

  const changesCount = useMemo(() => {
    if (activeQueue === "train") {
      return items.filter((i) => (i.approvalStatus || i.status) === "REOPENED")
        .length;
    }
    return items.filter(
      (i) => (i.verificationStatus || i.status) === "CHANGES_REQUESTED",
    ).length;
  }, [items, activeQueue]);

  const verifiedCount = useMemo(() => {
    if (activeQueue === "train") {
      return items.filter((i) => (i.approvalStatus || i.status) === "APPROVED")
        .length;
    }
    return items.filter((i) =>
      ["VERIFIED", "APPROVED", "ISSUED"].includes(
        i.verificationStatus || i.status,
      ),
    ).length;
  }, [items, activeQueue]);

  const rejectedCount = useMemo(() => {
    if (activeQueue === "train") {
      return items.filter((i) => (i.approvalStatus || i.status) === "REJECTED")
        .length;
    }
    return items.filter(
      (i) => (i.verificationStatus || i.status) === "REJECTED",
    ).length;
  }, [items, activeQueue]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          (item.bookingId || item.booking?.bookingId || "")
            .toLowerCase()
            .includes(q) ||
          (item.customerName || item.booking?.fullName || "")
            .toLowerCase()
            .includes(q) ||
          (item.travelerName || "").toLowerCase().includes(q) ||
          (item.tripName || item.booking?.tripName || "")
            .toLowerCase()
            .includes(q),
      );
    }
    return result;
  }, [items, search]);

  const handleRowClick = (item: any) => {
    const bId = item.bookingId || item.booking?.id || item.booking?.bookingId || item.id;
    setSelectedBookingId(bId);

    const parentBooking = item.booking || {};
    const merged = {
      ...parentBooking,
      ...item,
      bookingId: parentBooking.bookingId || item.bookingId || item.id,
      id: parentBooking.id || item.bookingId || item.id,
      travelerName: item.travelerName || parentBooking.fullName || parentBooking.name || "—",
      tripName: parentBooking.tripName || item.tripName || item.destinationStation || "—",
      departureDate: parentBooking.departureDate || item.journeyDate || null,
      pnr: (item.pnr && item.pnr !== "PENDING" && item.pnr !== "NOT GENERATED") ? item.pnr : (parentBooking.pnr || null),
      trainName: item.trainName || parentBooking.trainName || null,
      trainNumber: item.trainNumber || parentBooking.trainNumber || null,
      coach: item.coach || parentBooking.coach || null,
      seatNumber: item.seatNumber || parentBooking.seatNumber || null,
      berthType: item.berthType || parentBooking.berthType || null,
      ticketAmount: item.ticketAmount || parentBooking.ticketAmount || null,
      amountMode: item.amountMode || parentBooking.amountMode || null,
      submittedBy: typeof item.submittedBy === "object" ? (item.submittedBy?.name || item.submittedBy?.email) : (item.ticketBookingPerson || item.createdBy || "System"),
      submittedAt: item.createdAt || item.submittedAt || new Date().toISOString(),
    };

    setSelectedBooking(merged);
  };

  const handleQuickAction = async (
    e: React.MouseEvent,
    bookingId: string,
    action: string,
  ) => {
    e.stopPropagation();
    // Synthetic IDs (pseudo-* entries) are display-only — they have no real ticket record
    if (bookingId.startsWith("pseudo-")) {
      toast.error("This booking has no generated train ticket yet. Please create a ticket first.");
      return;
    }
    try {
      if (activeQueue === "train") {
        if (action === "VERIFY") {
          const confirmed = window.confirm(
            "Are you sure you want to verify and approve this train ticket?",
          );
          if (!confirmed) return;
          await trainTicketService.approveTicket(bookingId);
          toast.success("Ticket approved and locked");
        } else if (action === "REJECT") {
          const reason = prompt("Enter rejection reason (mandatory):");
          if (!reason || !reason.trim()) {
            toast.error("Rejection reason is required.");
            return;
          }
          await trainTicketService.rejectTicket(bookingId, reason);
          toast.success("Ticket rejected");
        } else if (action === "REQUEST_CHANGES") {
          const comment = prompt(
            "Enter changes requested comment (mandatory):",
          );
          if (!comment || !comment.trim()) {
            toast.error("Comments detailing requested changes are required.");
            return;
          }
          await trainTicketService.reopenTicket(bookingId, comment);
          toast.success("Changes requested / Reopened");
        }
      } else {
        let note = "";
        if (action === "VERIFY") {
          const confirmed = window.confirm(
            "Are you sure you want to verify and approve this booking?",
          );
          if (!confirmed) return;
        } else if (action === "REJECT") {
          const reason = prompt("Enter rejection reason (mandatory):");
          if (!reason || !reason.trim()) {
            toast.error("Rejection reason is required.");
            return;
          }
          note = reason;
        } else if (action === "REQUEST_CHANGES") {
          const comment = prompt(
            "Enter changes requested comment (mandatory):",
          );
          if (!comment || !comment.trim()) {
            toast.error("Comments detailing requested changes are required.");
            return;
          }
          note = comment;
        }
        await bookingVerificationService.performVerificationAction(bookingId, {
          action,
          notes: note || undefined,
        });
        toast.success(`${action.replace(/_/g, " ")} completed`);
      }
      loadQueue();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };

  const handleStationAction = async (id: string, action: "VERIFY" | "REJECT") => {
    try {
      const reason = action === "REJECT" ? prompt("Enter rejection reason (mandatory):") : undefined;
      if (action === "REJECT" && (!reason || !reason.trim())) {
        toast.error("Rejection reason is required");
        return;
      }
      await financeControllerService.performIncomingAction(id, {
        action,
        reason: reason || undefined,
      });
      toast.success(action === "VERIFY" ? "Payment verified" : "Payment rejected");
      loadSubQueues();
    } catch {
      toast.error("Action failed");
    }
  };

  const handleOutgoingAction = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      const reason = action === "REJECT" ? prompt("Enter rejection reason (mandatory):") : undefined;
      if (action === "REJECT" && (!reason || !reason.trim())) {
        toast.error("Rejection reason is required");
        return;
      }
      await financeControllerService.performVendorAction(id, {
        action,
        reason: reason || undefined,
      });
      toast.success(action === "APPROVE" ? "Payout approved" : "Payout rejected");
      loadSubQueues();
    } catch {
      toast.error("Action failed");
    }
  };

  // Filtered station & outgoing items
  const filteredStationItems = useMemo(() => {
    let list = stationItems;
    if (stationStatusFilter) list = list.filter((i) => i.status === stationStatusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.bookingId?.toLowerCase().includes(q) ||
          i.customerName?.toLowerCase().includes(q) ||
          i.referenceNumber?.toLowerCase().includes(q) ||
          i.tripName?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [stationItems, stationStatusFilter, search]);

  const filteredOutgoingItems = useMemo(() => {
    let list = outgoingItems;
    if (outgoingStatusFilter) list = list.filter((i) => i.paymentStatus === outgoingStatusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.vendorName?.toLowerCase().includes(q) ||
          i.tripTitle?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [outgoingItems, outgoingStatusFilter, search]);

  return (
    <div
      className={cn(
        "space-y-4 font-sans select-none antialiased text-[#162B45]",
        !hideHeader && "px-4 py-4 bg-[#F4F7FB] min-h-0",
      )}
    >
      {/* 1. COMPACT PAGE HEADER (if not embedded) */}
      {!hideHeader ? (
        <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2] bg-transparent">
          <div className="space-y-0.5">
            <h1 className="text-[22px] font-[600] text-[#162B45] tracking-tight leading-none font-montserrat">
              Verification & Approvals
            </h1>
            <p className="text-[#74839A] text-[12px] font-[500] leading-none">
              Review booking and train-ticket requests before final confirmation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
              <Input
                placeholder="Search booking ID, customer, trip, PNR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8.5 w-64 pl-8 text-[11px] rounded bg-white border-[#E3EAF2] placeholder-[#74839A]/60 focus:border-[#FF4D00] outline-none"
              />
            </div>
            <Button
              onClick={loadQueue}
              className="h-8.5 bg-white hover:bg-slate-50 border border-[#E3EAF2] rounded px-3 text-[#162B45] text-[11px] font-[600] flex items-center gap-1 shadow-sm transition-all"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#74839A]" /> Refresh
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/70">
              <button
                onClick={() => setActiveQueue("booking")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                  activeQueue === "booking"
                    ? "bg-white text-[#FF4D00] shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Bookings
                {bookingPendingCount > 0 && (
                  <span className="ml-1 text-[9px] bg-[#FF4D00]/10 text-[#FF4D00] px-1.5 py-0.2 rounded font-black">
                    {bookingPendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
              <Input
                placeholder="Search booking ID, customer, trip, PNR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8.5 w-64 pl-8 text-[11px] rounded bg-white border-[#E3EAF2] placeholder-[#74839A]/60 focus:border-[#FF4D00] outline-none"
              />
            </div>
            <Button
              onClick={loadQueue}
              className="h-8.5 bg-white hover:bg-slate-50 border border-[#E3EAF2] rounded px-3 text-[#162B45] text-[11px] font-[600] flex items-center gap-1 shadow-sm transition-all"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#74839A]" /> Refresh
            </Button>
          </div>
        </div>
      )}

      {/* QUICK FILTER TOGGLE BAR */}
      <div className="flex items-center gap-2 flex-wrap">
        {(
          [
            {
              key: "booking" as ViewMode,
              label: "Booking Verification",
              icon: <ShieldCheck className="w-3.5 h-3.5" />,
              count: bookingPendingCount,
              countColor: "bg-[#FF4D00]/10 text-[#FF4D00]",
              activeColor: "bg-white border-[#FF4D00] text-[#FF4D00] shadow-sm",
              inactiveColor: "text-[#74839A] hover:text-[#162B45] hover:bg-white/70",
            },
            {
              key: "station" as ViewMode,
              label: "Station Payments",
              icon: <Banknote className="w-3.5 h-3.5" />,
              count: stationPendingCount,
              countColor: "bg-amber-100 text-amber-700",
              activeColor: "bg-white border-amber-400 text-amber-700 shadow-sm",
              inactiveColor: "text-[#74839A] hover:text-[#162B45] hover:bg-white/70",
            },
            {
              key: "outgoing" as ViewMode,
              label: "Outgoing Payments",
              icon: <ArrowUpRight className="w-3.5 h-3.5" />,
              count: outgoingPendingCount,
              countColor: "bg-violet-100 text-violet-700",
              activeColor: "bg-white border-violet-500 text-violet-700 shadow-sm",
              inactiveColor: "text-[#74839A] hover:text-[#162B45] hover:bg-white/70",
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-[6px] border text-[11px] font-bold transition-all",
              viewMode === tab.key
                ? tab.activeColor + " border"
                : "border-[#E3EAF2] bg-white/50 " + tab.inactiveColor,
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded", tab.countColor)}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 2. APPROVAL SUMMARY KPI ROW */}
      <div className="grid grid-cols-4 gap-4">
        {/* KPI 1: Pending Review */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Pending Review
            </p>
            <h3 className="text-[20px] font-extrabold text-[#D97706] leading-none mt-1">
              {loading ? "..." : pendingCount}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Awaiting action
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-amber-50 flex items-center justify-center text-[#D97706] border border-amber-100 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 2: Changes Requested */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Changes Requested
            </p>
            <h3 className="text-[20px] font-extrabold text-blue-600 leading-none mt-1">
              {loading ? "..." : changesCount}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Requires agent edit
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 3: Verified Today */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Verified Today
            </p>
            <h3 className="text-[20px] font-extrabold text-[#16A34A] leading-none mt-1">
              {loading ? "..." : verifiedCount}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Completed successfully
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-100 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 4: Rejected Today */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Rejected Today
            </p>
            <h3 className="text-[20px] font-extrabold text-red-600 leading-none mt-1">
              {loading ? "..." : rejectedCount}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Declined with reason
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shrink-0">
            <XCircle className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* ── STATION PAYMENTS TABLE ── */}
      {viewMode === "station" && (
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] shadow-[0_1px_2px_rgba(15,23,42,0.02)] overflow-hidden">
          <div className="p-3.5 border-b border-[#E3EAF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-[#162B45] uppercase tracking-wide font-montserrat">
                  Station Payment Verification
                </h2>
                <p className="text-[10.5px] text-[#74839A] font-semibold mt-0.5">
                  UPI & cash collections pending Finance Controller review
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded">
                {[
                  { key: "", label: "All" },
                  { key: "PENDING", label: "Pending" },
                  { key: "PENDING_VERIFICATION", label: "FC Review" },
                  { key: "APPROVED", label: "Approved" },
                  { key: "REJECTED", label: "Rejected" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setStationStatusFilter(t.key)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[9.5px] font-extrabold uppercase tracking-wider transition-all",
                      stationStatusFilter === t.key
                        ? "bg-white text-[#162B45] shadow-xs"
                        : "text-[#74839A] hover:text-[#162B45]",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredStationItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 h-[180px]">
                <Banknote className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No station payments found</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-[#E3EAF2] text-[9.5px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
                    <th className="px-3.5 py-2.5">Booking / Customer</th>
                    <th className="px-3.5 py-2.5">Trip</th>
                    <th className="px-3.5 py-2.5">Amount</th>
                    <th className="px-3.5 py-2.5">Mode / Account</th>
                    <th className="px-3.5 py-2.5">Ref / UTR</th>
                    <th className="px-3.5 py-2.5">Approval Status</th>
                    <th className="px-3.5 py-2.5">Submitted</th>
                    <th className="px-3.5 py-2.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EAF2]">
                  {filteredStationItems.map((item) => {
                    const isPending = item.status === "PENDING" || item.status === "PENDING_VERIFICATION";
                    const isApproved = item.status === "APPROVED" || item.status === "VERIFIED";
                    const isUpi = item.paymentMode === "UPI";
                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFD] transition-colors text-[11px] font-semibold text-[#162B45] group h-[46px]">
                        <td className="px-3.5 py-2">
                          <div className="font-bold text-[#FF4D00] font-mono text-[10px]">{item.bookingId}</div>
                          <div className="text-[11px] font-semibold text-[#162B45] truncate max-w-[130px]">{item.customerName}</div>
                          {item.customerPhone && (
                            <div className="text-[9px] text-[#74839A]">{item.customerPhone}</div>
                          )}
                        </td>
                        <td className="px-3.5 py-2 truncate max-w-[120px] text-[11px]">{item.tripName}</td>
                        <td className="px-3.5 py-2 font-black text-[#162B45]">
                          ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3.5 py-2">
                          <div className="flex items-center gap-1">
                            {isUpi ? (
                              <Smartphone className="w-3 h-3 text-green-600 shrink-0" />
                            ) : (
                              <Banknote className="w-3 h-3 text-green-600 shrink-0" />
                            )}
                            <span className="text-[10px] font-bold uppercase">{item.paymentMode}</span>
                          </div>
                          <div className="text-[9px] text-[#74839A] mt-0.5 truncate max-w-[110px]">
                            {item.collectionAccountName || item.bankName || "—"}
                          </div>
                        </td>
                        <td className="px-3.5 py-2 font-mono text-[10px] text-[#74839A]">
                          {item.referenceNumber || "—"}
                        </td>
                        <td className="px-3.5 py-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border",
                            isApproved
                              ? "bg-green-50 border-green-200 text-green-700"
                              : item.status === "REJECTED"
                                ? "bg-red-50 border-red-200 text-red-600"
                                : "bg-amber-50 border-amber-200 text-amber-700",
                          )}>
                            <span className={cn("w-1 h-1 rounded-full", isApproved ? "bg-green-500" : item.status === "REJECTED" ? "bg-red-500" : "bg-amber-500")} />
                            {isApproved ? "Verified" : item.status === "REJECTED" ? "Rejected" : "Pending FC Review"}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 text-[9px] text-[#74839A] font-mono">
                          {safeFormatDate(item.createdAt, { day: "2-digit", month: "short" })}
                          <div className="text-[8px]">{item.submittedBy}</div>
                        </td>
                        <td className="px-3.5 py-2 text-right pr-4">
                          {isPending && canVerify && (
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleStationAction(item.id, "VERIFY")}
                                className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 rounded text-[9px] font-bold transition-colors"
                              >
                                <Check className="w-3 h-3" /> Verify
                              </button>
                              <button
                                onClick={() => handleStationAction(item.id, "REJECT")}
                                className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded text-[9px] font-bold transition-colors"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── OUTGOING PAYMENTS TABLE ── */}
      {viewMode === "outgoing" && (
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] shadow-[0_1px_2px_rgba(15,23,42,0.02)] overflow-hidden">
          <div className="p-3.5 border-b border-[#E3EAF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-[#162B45] uppercase tracking-wide font-montserrat">
                  Outgoing Payments
                </h2>
                <p className="text-[10.5px] text-[#74839A] font-semibold mt-0.5">
                  Vendor & partner payouts pending Finance Controller approval
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded">
                {[
                  { key: "", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "partial", label: "Partial" },
                  { key: "verified", label: "Approved" },
                  { key: "paid", label: "Paid" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setOutgoingStatusFilter(t.key)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[9.5px] font-extrabold uppercase tracking-wider transition-all",
                      outgoingStatusFilter === t.key
                        ? "bg-white text-[#162B45] shadow-xs"
                        : "text-[#74839A] hover:text-[#162B45]",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredOutgoingItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 h-[180px]">
                <ArrowUpRight className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No outgoing payments found</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-[#E3EAF2] text-[9.5px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
                    <th className="px-3.5 py-2.5">Vendor</th>
                    <th className="px-3.5 py-2.5">Trip</th>
                    <th className="px-3.5 py-2.5">Agreed</th>
                    <th className="px-3.5 py-2.5">Paid</th>
                    <th className="px-3.5 py-2.5">Outstanding</th>
                    <th className="px-3.5 py-2.5">Mode</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EAF2]">
                  {filteredOutgoingItems.map((item) => {
                    const isPending = item.paymentStatus === "pending";
                    const isApproved = item.paymentStatus === "verified" || item.paymentStatus === "paid";
                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFD] transition-colors text-[11px] font-semibold text-[#162B45] group h-[46px]">
                        <td className="px-3.5 py-2">
                          <div className="font-bold text-[#162B45]">{item.vendorName}</div>
                          <div className="text-[9px] text-[#74839A]">{item.vendorType}{item.vendorPhone ? ` · ${item.vendorPhone}` : ""}</div>
                        </td>
                        <td className="px-3.5 py-2 truncate max-w-[130px]">
                          <div className="text-[11px] font-semibold truncate">{item.tripTitle}</div>
                          <div className="text-[9px] text-[#74839A]">{item.tripLocation}</div>
                        </td>
                        <td className="px-3.5 py-2 font-bold text-[#162B45]">
                          ₹{Number(item.agreedTariff || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3.5 py-2 text-green-600 font-semibold">
                          ₹{Number(item.paidAmount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3.5 py-2">
                          <span className={cn("font-black", item.outstandingAmount > 0 ? text-red-600" : "text-green-600")}>
                            ₹{Number(item.outstandingAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 text-[10px] text-[#74839A]">
                          {item.outgoingPaymentMode || "—"}
                        </td>
                        <td className="px-3.5 py-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border",
                            isApproved
                              ? "bg-green-50 border-green-200 text-green-700"
                              : item.paymentStatus === "partial"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-violet-50 border-violet-200 text-violet-700",
                          )}>
                            <span className={cn("w-1 h-1 rounded-full", isApproved ? "bg-green-500" : item.paymentStatus === "partial" ? "bg-amber-500" : "bg-violet-500")} />
                            {isApproved ? "Approved" : item.paymentStatus === "partial" ? "Partial" : "Pending Approval"}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 text-right pr-4">
                          {isPending && canVerify && (
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOutgoingAction(item.id, "APPROVE")}
                                className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 rounded text-[9px] font-bold transition-colors"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleOutgoingAction(item.id, "REJECT")}
                                className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded text-[9px] font-bold transition-colors"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 3. APPROVAL WORKSPACE */}
      {viewMode === "booking" && (
      <div className="flex items-start gap-4">
        {/* LEFT PANEL: Approval Type Navigation (if sideNav not hidden) */}
        {!hideSideNav && (
          <div className="w-[230px] bg-white border border-[#E3EAF2] rounded-[8px] p-2 space-y-2 shrink-0 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <p className="text-[8.5px] font-bold text-[#74839A] uppercase tracking-wider px-2.5 py-1.5 font-montserrat">
              Approval Types
            </p>

            <div className="space-y-1">
              {/* Booking Verification */}
              <button
                onClick={() => setActiveQueue("booking")}
                className={cn(
                  "w-full h-10 px-2.5 rounded text-left flex items-center justify-between text-[11.5px] font-[600] transition-all",
                  activeQueue === "booking"
                    ? "bg-slate-50 text-[#162B45] border-l-[3px] border-[#FF4D00] font-bold shadow-xs"
                    : "text-[#74839A] hover:bg-slate-50/70 hover:text-[#162B45]",
                )}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className={cn(
                      "w-4 h-4",
                      activeQueue === "booking"
                        ? "text-[#FF4D00]"
                        : "text-[#74839A]",
                    )}
                  />
                  <span>Booking Verification</span>
                </div>
                {bookingPendingCount > 0 && (
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.2 rounded font-black",
                      activeQueue === "booking"
                        ? "bg-[#FF4D00] text-white"
                        : "bg-[#E3EAF2] text-[#162B45]",
                    )}
                  >
                    {bookingPendingCount}
                  </span>
                )}
              </button>

            </div>
          </div>
        )}

        {/* RIGHT PANEL: Selected Approval Queue */}
        <div className="flex-1 w-full bg-white border border-[#E3EAF2] rounded-[8px] shadow-[0_1px_2px_rgba(15,23,42,0.02)] overflow-hidden flex flex-col">
          {/* 4. REDESIGN THE QUEUE HEADER */}
          <div className="p-3.5 border-b border-[#E3EAF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded bg-[#FF4D00]/5 border border-[#FF4D00]/20 flex items-center justify-center text-[#FF4D00] shrink-0 mt-0.5">
                {activeQueue === "booking" ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <Train className="w-4 h-4" />
                )}
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-[#162B45] uppercase tracking-wide font-montserrat">
                  {activeQueue === "booking"
                    ? "Booking Verification"
                    : "Train Ticket Approvals"}
                </h2>
                <p className="text-[10.5px] text-[#74839A] font-semibold leading-none mt-1">
                  {activeQueue === "booking"
                    ? "Review and verify bookings before confirmation"
                    : "Approve and verify train ticket details"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-[#74839A] font-bold uppercase tracking-wider mr-1 font-montserrat">
                Showing {filteredItems.length}{" "}
                {activeQueue === "train"
                  ? "ticket records"
                  : "pending verification requests"}
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[9.5px] font-extrabold uppercase tracking-wider transition-all",
                      activeTab === tab.key
                        ? "bg-white text-[#162B45] shadow-xs"
                        : "text-[#74839A] hover:text-[#162B45]",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clean table area (Natural Content Height / Compact Empty State) */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              /* 8. COMPACT EMPTY STATE (180px - 220px height) */
              <div className="flex flex-col items-center justify-center py-12 text-center h-[200px]">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border border-slate-150 mb-2 text-slate-350 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="text-[11.5px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">
                  No Pending Approvals
                </h4>
                <p className="text-[10px] text-[#74839A] mt-1 max-w-[280px]">
                  All verification requests for this category are fully up to
                  date.
                </p>
                <button
                  onClick={() => setActiveTab("")}
                  className="text-[10px] font-bold text-[#FF4D00] hover:underline mt-2 uppercase tracking-wider"
                >
                  View Verified Requests
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-[#E3EAF2] text-[9.5px] font-bold text-[#74839A] uppercase tracking-wider sticky top-0 z-10 font-montserrat">
                      <th className="px-3.5 py-2.5 w-[40px]">Priority</th>
                      <th className="px-3.5 py-2.5 w-[100px] sticky left-0 bg-slate-50 z-20">
                        Booking ID
                      </th>

                      {activeQueue === "booking" ? (
                        <>
                          <th className="px-3.5 py-2.5">Customer</th>
                          <th className="px-3.5 py-2.5">Trip / Departure</th>
                          <th className="px-3.5 py-2.5 w-[100px]">Payment</th>
                          <th className="px-3.5 py-2.5 w-[100px]">Documents</th>
                          <th className="px-3.5 py-2.5 w-[100px]">Ticketing</th>
                          <th className="px-3.5 py-2.5">Submitted By</th>
                          <th className="px-3.5 py-2.5 w-[110px]">
                            Submitted At
                          </th>
                          <th className="px-3.5 py-2.5 w-[100px]">Status</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3.5 py-2.5">Passenger / Group</th>
                          <th className="px-3.5 py-2.5">Trip + Departure</th>
                          <th className="px-3.5 py-2.5 w-[150px]">
                            PNR / Ticket State
                          </th>
                          <th className="px-3.5 py-2.5 w-[150px]">
                            Train Name
                          </th>
                          <th className="px-3.5 py-2.5 w-[120px]">Submitted</th>
                          <th className="px-3.5 py-2.5 w-[110px]">
                            Approval Status
                          </th>
                        </>
                      )}

                      <th className="px-3.5 py-2.5 text-right pr-4 w-[120px] sticky right-0 bg-slate-50 z-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3EAF2]">
                    {filteredItems.map((item, idx) => {
                      const b = item.booking || item;
                      const bookingId = item.bookingId || b.bookingId || b.id;
                      const vStatus =
                        item.verificationStatus ||
                        item.status ||
                        "PENDING_VERIFICATION";
                      const tStatus =
                        item.trainTicketStatus || item.ticketStatus || null;
                      const isHighPriority = vStatus === "PENDING_VERIFICATION";

                      const isTicketIncomplete =
                        activeQueue === "train" &&
                        (!item.travelerName ||
                          item.travelerName === "TBD" ||
                          item.travelerName === "Missing" ||
                          !b.tripName ||
                          b.tripName === "Missing" ||
                          !b.departureDate ||
                          b.departureDate === "Missing");

                      // Document Checklist calculation
                      const totalDocs = item.checklist
                        ? Object.keys(item.checklist).length
                        : 5;
                      const completedDocs = item.checklist
                        ? Object.values(item.checklist).filter(Boolean).length
                        : 4;

                      let priorityColor = "bg-slate-300"; // gray default
                      if (activeQueue === "train") {
                        const isUrgent = item.journeyDate
                          ? new Date(item.journeyDate).getTime() - Date.now() <
                              10 * 86400000 &&
                            new Date(item.journeyDate) > new Date() &&
                            [
                              "PENDING",
                              "WAITLISTED",
                              "RAC",
                              "SUBMITTED",
                            ].includes(item.ticketStatus || item.approvalStatus)
                          : false;

                        if (isTicketIncomplete) {
                          priorityColor = "bg-red-600 animate-pulse"; // Red = blocked / incomplete
                        } else if (
                          isUrgent ||
                          item.approvalStatus === "SUBMITTED"
                        ) {
                          priorityColor = "bg-amber-500 animate-pulse"; // Amber = needs action
                        } else if (item.approvalStatus === "REOPENED") {
                          priorityColor = "bg-blue-500"; // Blue = in progress
                        } else if (item.approvalStatus === "APPROVED") {
                          priorityColor = "bg-green-500"; // Green = ready / verified
                        } else if (item.ticketStatus === "CANCELLED") {
                          priorityColor = "bg-slate-400"; // Gray = normal
                        }
                      } else {
                        priorityColor = isHighPriority
                          ? "bg-red-600 animate-pulse"
                          : "bg-slate-300";
                      }

                      return (
                        <tr
                          key={item.id || bookingId || idx}
                          onClick={() => handleRowClick(item)}
                          className="hover:bg-[#F8FAFD] cursor-pointer transition-colors text-[11px] font-semibold text-[#162B45] group h-[44px]"
                        >
                          {/* Priority Dot */}
                          <td className="px-3.5 py-2">
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full inline-block",
                                priorityColor,
                              )}
                            />
                          </td>

                          {/* Booking ID (clickable orange text, sticky) */}
                          <td
                            className="px-3.5 py-2 font-bold font-mono text-[#FF4D00] hover:underline sticky left-0 bg-white group-hover:bg-[#F8FAFD] z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(item);
                            }}
                          >
                            {b.bookingId || bookingId?.slice(-8) || "—"}
                          </td>

                          {activeQueue === "booking" ? (
                            <>
                              {/* Customer (bold dark navy) */}
                              <td
                                className="px-3.5 py-2 font-bold text-[#162B45] truncate max-w-[120px]"
                                title={b.fullName || b.name || "—"}
                              >
                                {b.fullName ||
                                  b.name ||
                                  item.customerName ||
                                  "—"}
                              </td>
                              {/* Trip / Departure Name (two-line layout) */}
                              <td className="px-3.5 py-2 truncate max-w-[140px]">
                                <div className="text-[11px] font-semibold text-[#162B45] truncate">
                                  {b.tripName || item.tripName || "—"}
                                </div>
                                <div className="text-[9px] text-[#74839A] font-medium mt-0.5">
                                  {safeFormatDate(
                                    b.departureDate || item.departureDate,
                                  )}
                                </div>
                              </td>
                              {/* Payment status (Paid / Partial / Balance Due) */}
                              <td className="px-3.5 py-2 font-mono">
                                <span
                                  className={cn(
                                    "text-[9px] font-bold uppercase",
                                    b.paymentStatus === "Paid"
                                      ? "text-[#16A34A]"
                                      : "text-amber-600",
                                  )}
                                >
                                  {b.paymentStatus || "Balance Due"}
                                </span>
                              </td>
                              {/* Documents checklist summary */}
                              <td className="px-3.5 py-2 font-medium">
                                {Array.isArray(b.documents) && b.documents.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[#16A34A] bg-green-50 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    {b.documents.length} doc{b.documents.length !== 1 ? "s" : ""} uploaded
                                  </span>
                                ) : item.checklist ? (
                                  <span className="text-[#74839A]">{completedDocs}/{totalDocs} complete</span>
                                ) : (
                                  <span className="text-amber-600 text-[10px] font-semibold">0 uploaded</span>
                                )}
                              </td>
                              {/* Ticketing Status */}
                              <td className="px-3.5 py-2">
                                {tStatus ? (
                                  <StatusBadge status={tStatus} />
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    —
                                  </span>
                                )}
                              </td>
                              {/* Submitted By */}
                              <td className="px-3.5 py-2 text-[#74839A] font-medium">
                                {item.submittedBy?.name || "System"}
                              </td>
                              {/* Submitted At */}
                              <td className="px-3.5 py-2 text-[#74839A] font-mono font-medium">
                                {safeFormatDate(
                                  item.submittedAt || item.createdAt,
                                  { day: "2-digit", month: "short" },
                                )}
                              </td>
                              {/* Status Badge */}
                              <td className="px-3.5 py-2">
                                <StatusBadge status={vStatus} />
                              </td>
                            </>
                          ) : (
                            <>
                              {/* Passenger / Group */}
                              <td className="px-3.5 py-2">
                                <div className="font-bold text-[#162B45] truncate max-w-[130px]">
                                  {item.travelerName || "—"}
                                </div>
                                {b.numberOfTravelers && (
                                  <div className="text-[9.5px] text-[#74839A] font-medium mt-0.5">
                                    {b.numberOfTravelers} travelers
                                  </div>
                                )}
                              </td>
                              {/* Trip + Departure */}
                              <td className="px-3.5 py-2 truncate max-w-[140px]">
                                <div className="text-[11px] font-semibold text-[#162B45] truncate">
                                  {b.tripName || "—"}
                                </div>
                                <div className="text-[9px] text-[#74839A] font-medium mt-0.5">
                                  {safeFormatDate(b.departureDate)}
                                </div>
                              </td>
                              {/* PNR / Ticket State */}
                              <td className="px-3.5 py-2">
                                {isTicketIncomplete ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border border-red-200 bg-red-50 text-red-650">
                                    Incomplete Ticket Details
                                  </span>
                                ) : item.isPseudo ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border border-red-200 bg-red-50 text-red-650">
                                    PNR Not Generated
                                  </span>
                                ) : !item.pnr || item.pnr === "PENDING" ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border border-amber-250 bg-amber-50 text-amber-700">
                                    Ticket Details Pending
                                  </span>
                                ) : (
                                  <span className="font-mono font-bold text-slate-700">
                                    {item.pnr}
                                  </span>
                                )}
                              </td>
                              {/* Train Name */}
                              <td className="px-3.5 py-2 font-mono">
                                <div className="text-[11px] font-semibold text-[#162B45] truncate max-w-[130px]">
                                  {item.trainName || "—"} {item.trainNumber ? `(${item.trainNumber})` : ""}
                                </div>
                              </td>
                              {/* Submitted (Submitted By + Submitted At two lines) */}
                              <td className="px-3.5 py-2">
                                <div className="text-[11px] font-semibold text-[#162B45]">
                                  {item.submittedBy?.name || "System"}
                                </div>
                                <div className="text-[9px] text-[#74839A] font-medium font-mono mt-0.5">
                                  {safeFormatDate(
                                    item.submittedAt || item.createdAt,
                                    { day: "2-digit", month: "short" },
                                  )}
                                </div>
                              </td>
                              {/* Approval Status */}
                              <td className="px-3.5 py-2">
                                <StatusBadge
                                  status={item.approvalStatus || "DRAFT"}
                                />
                              </td>
                            </>
                          )}

                          {/* 6. ONE-CLICK ROW ACTIONS */}
                          <td
                            className="px-3.5 py-2 text-right pr-4 sticky right-0 bg-white group-hover:bg-[#F8FAFD] z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Review / Open Booking (neutral slate eye icon) */}
                              <button
                                onClick={() => handleRowClick(item)}
                                className="w-6.5 h-6.5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
                                title="Review Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#74839A]" />
                              </button>

                              {/* Verify, Request Changes, Reject (Only for Authorized role permissions) */}
                              {canVerify &&
                                (activeQueue === "train"
                                  ? item.approvalStatus === "SUBMITTED" ||
                                    item.isPseudo
                                  : vStatus === "PENDING_VERIFICATION") && (
                                  <>
                                    {/* Verify (green check) */}
                                    <button
                                      onClick={(e) =>
                                        handleQuickAction(
                                          e,
                                          activeQueue === "train"
                                            ? item.id
                                            : bookingId,
                                          "VERIFY",
                                        )
                                      }
                                      className="w-6.5 h-6.5 rounded bg-green-50 border border-green-200 hover:bg-green-100 flex items-center justify-center transition-colors shrink-0"
                                      title="Verify Ticket"
                                    >
                                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                                    </button>
                                    {/* Request Changes (blue message/edit icon) */}
                                    <button
                                      onClick={(e) =>
                                        handleQuickAction(
                                          e,
                                          activeQueue === "train"
                                            ? item.id
                                            : bookingId,
                                          "REQUEST_CHANGES",
                                        )
                                      }
                                      className="w-6.5 h-6.5 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0"
                                      title="Request Changes"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                                    </button>
                                    {/* Reject (red cross) */}
                                    <button
                                      onClick={(e) =>
                                        handleQuickAction(
                                          e,
                                          activeQueue === "train"
                                            ? item.id
                                            : bookingId,
                                          "REJECT",
                                        )
                                      }
                                      className="w-6.5 h-6.5 rounded bg-red-50 border border-red-200 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0"
                                      title="Reject"
                                    >
                                      <X className="w-3.5 h-3.5 text-red-600" />
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
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-[#E3EAF2] bg-slate-50/50 shrink-0">
              <p className="text-[10px] text-[#74839A] font-bold uppercase tracking-wider">
                Page {page} of {totalPages} · {totalCount} items
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-7 w-7 p-0 rounded border-[#E3EAF2]"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#74839A]" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-7 w-7 p-0 rounded border-[#E3EAF2]"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#74839A]" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      )} {/* end viewMode === "booking" */}

      {/* 8. SUPPORTING DETAILS CARDS (Balanced spacing, 130px - 150px height) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card A: Recent Activity Feed */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[140px] flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex items-center gap-2 border-b border-[#E3EAF2] pb-1.5">
            <Activity className="w-4 h-4 text-[#FF4D00]" />
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">
              Recent Activity
            </span>
          </div>
          <div className="flex-1 space-y-2 mt-2 text-[11px] overflow-y-auto no-scrollbar font-semibold">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0" />
              <div>
                Suresh verified BK-MKA-115{" "}
                <span className="text-[#74839A] font-medium">· 12 min ago</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
              <div>
                Zeel submitted train ticket verification{" "}
                <span className="text-[#74839A] font-medium">· 45 min ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Guidance Rules Panel */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[140px] flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex items-center gap-2 border-b border-[#E3EAF2] pb-1.5">
            <HelpCircle className="w-4 h-4 text-[#FF4D00]" />
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">
              Approval Guidance
            </span>
          </div>
          <div className="flex-1 space-y-1.5 mt-2 text-[10.5px] font-semibold text-slate-600">
            <div className="flex items-start gap-2">
              <span className="text-[#FF4D00] shrink-0">▪</span>
              <div>
                Pending requests must be reviewed before final booking
                confirmation.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#FF4D00] shrink-0">▪</span>
              <div>
                Rejections and Changes Requested require entering a mandatory
                reason message in the review drawer.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. APPROVAL REVIEW DRAWER */}
      <VerificationDetailsPanel
        bookingId={selectedBookingId || ""}
        booking={selectedBooking}
        queueType={activeQueue}
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


