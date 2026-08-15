import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  IndianRupee,
  Filter,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  AlertTriangle,
  BarChart3,
  History,
  ChevronLeft,
  ChevronRight,
  Building2,
  Truck,
  UserCheck,
  UtensilsCrossed,
  Wrench,
  HelpCircle,
  Save,
  Undo,
  Compass,
  Banknote,
  ClipboardCheck,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  CreditCard,
  Download,
  Trash2,
  Edit3,
  FileText,
  Eye,
  MoreVertical,
  Sparkles,
  Globe,
  MessageSquare,
  Sliders,
  MoreHorizontal,
  Wallet,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission } from "@/lib/permissions";
import {
  accountingService,
  type AccountingEntry,
} from "@/services/accounting.service";
import {
  collectionAccountsService,
  type CollectionAccount,
} from "@/services/collectionAccounts.service";
import { tripsService } from "@/services/trips.service";
import { bookingsService } from "@/services/bookings.service";
import api from "@/services/api";
import { opsService } from "@/services/ops.service";
import { vendorsService } from "@/services/vendors.service";
import type { Vendor } from "@/types";
import { cn } from "@/lib/utils";
import FinanceControlCenterPage from "./FinanceControlCenterPage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

// ── Status Styles ──
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    icon: Clock,
  },
  APPROVED: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    icon: CheckCircle2,
  },
  REJECTED: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-650",
    icon: XCircle,
  },
};

const MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
};

type TabId =
  | "control_center"
  | "overview"
  | "transactions"
  | "cash_book"
  | "bank_accounts"
  | "vendor_payments"
  | "office_expenses"
  | "payments"
  | "profit_loss"
  | "trip_profitability"
  | "reports";

export default function AccountingPage() {
  const { admin: user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const normalizeMainTab = (raw: string | null): TabId => {
    if (!raw) return "overview";
    const t = raw.toLowerCase().trim();
    if (["control_center", "control", "verification", "queue", "queues"].includes(t)) return "control_center";
    if (["overview", "summary", "dashboard"].includes(t)) return "overview";
    if (["transactions", "ledger", "all_transactions"].includes(t)) return "transactions";
    if (["cash_book", "cash", "cashbook"].includes(t)) return "cash_book";
    if (["bank_accounts", "bank", "banks", "collection_accounts", "accounts"].includes(t)) return "bank_accounts";
    if (["vendor_payments", "vendor", "vendors", "disbursements"].includes(t)) return "vendor_payments";
    if (["office_expenses", "expenses", "expense", "office"].includes(t)) return "office_expenses";
    if (["payments", "incoming", "collections"].includes(t)) return "transactions";
    if (["profit_loss", "pnl", "profit", "loss"].includes(t)) return "profit_loss";
    if (["trip_profitability", "trips", "trip"].includes(t)) return "trip_profitability";
    if (["reports", "report"].includes(t)) return "reports";
    return "overview";
  };

  const rawTabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabId>(() => normalizeMainTab(rawTabParam));

  useEffect(() => {
    const nextTab = normalizeMainTab(searchParams.get("tab"));
    setActiveTab((prev) => (prev !== nextTab ? nextTab : prev));
  }, [searchParams]);

  const handleMainTabChange = (tabId: TabId) => {
    const normalized = normalizeMainTab(tabId);
    setActiveTab(normalized);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", normalized);
    if (normalized !== "control_center") {
      nextParams.delete("queue");
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Keep the active tab visible inside the scrollable mobile tab strip.
  const tabStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabStripRef.current
      ?.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [activeTab]);

  const [selectedPreset, setSelectedPreset] = useState("This Month");

  // Compute month start and end as default
  const nowForInit = new Date();
  const initMonthStart = new Date(nowForInit.getFullYear(), nowForInit.getMonth(), 1, 0, 0, 0);
  const initMonthEnd = new Date(nowForInit.getFullYear(), nowForInit.getMonth() + 1, 0, 23, 59, 59);

  const [activeDateStart, setActiveDateStart] = useState<Date>(initMonthStart);
  const [activeDateEnd, setActiveDateEnd] = useState<Date>(initMonthEnd);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const [dateRange, setDateRange] = useState(`${fmt(initMonthStart)} - ${fmt(initMonthEnd)}`);

  const applyDatePreset = (preset: string) => {
    setSelectedPreset(preset);
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    let end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (preset === "Today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (preset === "Yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
    } else if (preset === "This Week") {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diffToMonday, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), diffToMonday + 6, 23, 59, 59);
    } else if (preset === "This Month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (preset === "Last Month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (preset === "This Financial Year") {
      const curYear = now.getFullYear();
      const curMonth = now.getMonth();
      const fyStartYear = curMonth >= 3 ? curYear : curYear - 1;
      start = new Date(fyStartYear, 3, 1, 0, 0, 0);
      end = new Date(fyStartYear + 1, 2, 31, 23, 59, 59);
    } else if (preset === "All Time") {
      start = new Date(2020, 0, 1, 0, 0, 0);
      end = new Date(2030, 11, 31, 23, 59, 59);
    } else {
      // Custom Range — don't override active dates
      return;
    }

    setActiveDateStart(start);
    setActiveDateEnd(end);
    setDateRange(`${fmt(start)} - ${fmt(end)}`);
  };

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
  const [ledgerTotals, setLedgerTotals] = useState({
    APPROVED: 0,
    PENDING: 0,
    REJECTED: 0,
  });

  // Create payment dialog
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    bookingId: "",
    amount: "",
    paymentMode: "CASH",
    referenceNumber: "",
    notes: "",
  });

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    entryId: string;
  }>({ open: false, entryId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // History dialog
  const [historyDialog, setHistoryDialog] = useState<{
    open: boolean;
    entry: AccountingEntry | null;
  }>({ open: false, entry: null });

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

  // Outgoing Vendor Payment Modal State
  const [vendorPayDialog, setVendorPayDialog] = useState<{
    open: boolean;
    assignment: any | null;
  }>({ open: false, assignment: null });

  const [outgoingForm, setOutgoingForm] = useState({
    paidAmount: 0,
    paymentStatus: "pending",
    outgoingPaymentMode: "CASH",
    onlinePersonAccount: "",
    cashDepositorName: "",
    depositAccountName: "",
    notes: "",
  });

  const [officeExpenses, setOfficeExpenses] = useState<any[]>([]);
  const [selectedBankIdx, setSelectedBankIdx] = useState(0);
  const [bankOverrides, setBankOverrides] = useState<Record<string, any>>({});
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [editingBankIdx, setEditingBankIdx] = useState<number | null>(null);
  const [bankDetailsForm, setBankDetailsForm] = useState({
    name: "",
    nick: "",
    num: "",
    holder: "YouthCamping Travel Pvt. Ltd.",
    type: "Current Account",
    branch: "",
    ifsc: "",
    openBal: 0,
  });

  // Personal Collections / Employee Collections State
  const [personalCollections, setPersonalCollections] = useState<any[]>([]);
  const [personalCollectionsSummary, setPersonalCollectionsSummary] = useState({
    totalCollected: 0,
    totalSubmitted: 0,
    totalPending: 0,
  });
  const [loadingPersonalCollections, setLoadingPersonalCollections] = useState(false);
  const [personalSearch, setPersonalSearch] = useState("");
  const [personalStatusFilter, setPersonalStatusFilter] = useState("ALL");

  // Person Detail View Modal State
  const [selectedPersonForDetail, setSelectedPersonForDetail] = useState<any | null>(null);
  const [personDetailData, setPersonDetailData] = useState<any | null>(null);
  const [loadingPersonDetail, setLoadingPersonDetail] = useState(false);
  const [showPersonDetailModal, setShowPersonDetailModal] = useState(false);

  // Record Submission Modal State
  const [showRecordSubmissionModal, setShowRecordSubmissionModal] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    employeeAdminId: "",
    amount: "",
    paymentMode: "CASH",
    referenceNumber: "",
    notes: "",
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Collection Account Creation State
  const [showAddCollectionAccountModal, setShowAddCollectionAccountModal] = useState(false);
  const [newAccForm, setNewAccForm] = useState({
    accountName: "",
    accountHolderName: "",
    accountType: "COMPANY",
    paymentMethods: ["UPI", "BANK_TRANSFER"],
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
    description: "",
  });
  const [savingAccount, setSavingAccount] = useState(false);

  const handleCreateCollectionAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccForm.accountName.trim()) {
      toast.error("Please enter account name");
      return;
    }
    setSavingAccount(true);
    try {
      await collectionAccountsService.createAccount({
        accountName: newAccForm.accountName.trim(),
        accountHolderName: newAccForm.accountHolderName.trim() || newAccForm.accountName.trim(),
        accountType: newAccForm.accountType,
        paymentMethods: newAccForm.paymentMethods,
        bankName: newAccForm.bankName.trim() || undefined,
        accountNumber: newAccForm.accountNumber.trim() || undefined,
        ifsc: newAccForm.ifsc.trim() || undefined,
        upiId: newAccForm.upiId.trim() || undefined,
        description: newAccForm.description.trim() || undefined,
        isActive: true,
      });
      toast.success(`Collection account "${newAccForm.accountName}" created successfully!`);
      setShowAddCollectionAccountModal(false);
      setNewAccForm({
        accountName: "",
        accountHolderName: "",
        accountType: "COMPANY",
        paymentMethods: ["UPI", "BANK_TRANSFER"],
        bankName: "",
        accountNumber: "",
        ifsc: "",
        upiId: "",
        description: "",
      });
      loadPersonalCollections();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create collection account");
    } finally {
      setSavingAccount(false);
    }
  };

  // Delete Collection Account State
  const [accountToDelete, setAccountToDelete] = useState<any | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    setDeletingAccount(true);
    try {
      await collectionAccountsService.deleteAccount(accountToDelete.id);
      toast.success(`Collection account "${accountToDelete.accountName || accountToDelete.name}" deleted successfully`);
      setAccountToDelete(null);
      loadPersonalCollections();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete collection account");
    } finally {
      setDeletingAccount(false);
    }
  };

  const loadPersonalCollections = async (start?: Date, end?: Date) => {
    setLoadingPersonalCollections(true);
    try {
      const s = (start || activeDateStart).toISOString().split("T")[0];
      const e = (end || activeDateEnd).toISOString().split("T")[0];
      const res = await accountingService.getPersonalCollections(s, e);
      if (res?.data) {
        setPersonalCollections(res.data);
        if (res.summary) setPersonalCollectionsSummary(res.summary);
      }
    } catch (err) {
      console.error("Failed to load personal collections", err);
    } finally {
      setLoadingPersonalCollections(false);
    }
  };

  const handleOpenPersonDetail = async (person: any) => {
    setSelectedPersonForDetail(person);
    setShowPersonDetailModal(true);
    setLoadingPersonDetail(true);
    try {
      const res = await accountingService.getPersonCollectionDetails(person.id);
      if (res?.data) {
        setPersonDetailData(res.data);
      }
    } catch (err) {
      toast.error("Failed to load details for " + person.name);
    } finally {
      setLoadingPersonDetail(false);
    }
  };

  const handleOpenRecordSubmission = (personId?: string) => {
    setSubmissionForm({
      employeeAdminId: personId || (selectedPersonForDetail?.employee?.id || selectedPersonForDetail?.id || ""),
      amount: "",
      paymentMode: "CASH",
      referenceNumber: "",
      notes: "",
    });
    setShowRecordSubmissionModal(true);
  };

  const handleSubmitEmployeePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionForm.employeeAdminId || !submissionForm.amount) {
      toast.error("Please select an employee and enter an amount");
      return;
    }
    const amt = Number(submissionForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await accountingService.recordEmployeeSubmission({
        employeeAdminId: submissionForm.employeeAdminId,
        amount: amt,
        paymentMode: submissionForm.paymentMode,
        referenceNumber: submissionForm.referenceNumber || undefined,
        notes: submissionForm.notes || undefined,
      });
      toast.success(res?.message || "Submission recorded successfully!");
      setShowRecordSubmissionModal(false);
      loadPersonalCollections();
      if (selectedPersonForDetail?.employee?.id === submissionForm.employeeAdminId || selectedPersonForDetail?.id === submissionForm.employeeAdminId) {
        handleOpenPersonDetail({ id: submissionForm.employeeAdminId, name: selectedPersonForDetail?.name || selectedPersonForDetail?.employee?.name });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record submission");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const [bookings, setBookings] = useState<any[]>([]);
  const [reportModal, setReportModal] = useState<{
    open: boolean;
    name: string;
    desc: string;
    fmt: string;
  }>({ open: false, name: "", desc: "", fmt: "PDF" });

  const handleViewReport = (name: string, desc: string, fmt: string) => {
    setReportModal({ open: true, name, desc, fmt });
  };

  const handleDownloadReport = (name: string, fmt: string) => {
    if (fmt === "Excel" || fmt === "CSV") {
      let headers: string[] = [];
      let rows: (string | number)[][] = [];

      if (name.includes("Profit & Loss")) {
        headers = ["Category", "Particulars", "Amount (INR)"];
        rows = [
          ["Income", "Booking Revenue", plRevenue],
          ["Direct Cost", "Hotels Accommodation", plHotelCost],
          ["Direct Cost", "Transport Fleets", plTransportCost],
          ["Direct Cost", "Guide Charges", plGuideCost],
          ["Direct Cost", "Trip Activities", plActivityCost],
          ["Operating Cost", "Office Rent", plRentCost],
          ["Operating Cost", "Utilities & Internet", plUtilitiesCost],
          ["Operating Cost", "Software & Cloud", plMiscOperatingCost],
          ["Summary", "Gross Profit", plGrossProfit],
          ["Summary", "Net Profit", plNetProfit],
        ];
      } else if (name.includes("Cash")) {
        headers = ["Date", "Type", "Particulars", "Cash In (INR)", "Cash Out (INR)", "Balance (INR)"];
        rows = rawTransactions
          .filter((t) => t.account === "Cash" || t.mode === "Cash")
          .map((t) => [t.date, t.type, t.particulars, t.inflow, t.outflow, 185000]);
      } else if (name.includes("Vendor")) {
        headers = ["Vendor Name", "Category", "Trip Code", "Agreed Total (INR)", "Paid Amount (INR)", "Balance Due (INR)", "Status"];
        rows = vendorAssignments.map((v) => {
          const vName = typeof v.vendorId === "object" ? v.vendorId?.name : v.vendorName || "Vendor";
          const vType = typeof v.vendorId === "object" ? v.vendorId?.type : v.category || "HOTEL";
          const bal = v.totalAmount - (v.paidAmount || 0);
          return [vName, vType, v.tripCode || "SPT-1", v.totalAmount, v.paidAmount || 0, bal, v.paymentStatus || "pending"];
        });
      } else {
        headers = ["Date", "Type", "Particulars", "Trip / Reference", "Amount (INR)", "Payment Mode", "Status"];
        rows = rawTransactions.map((t) => [t.date, t.type, t.particulars, t.reference, t.inflow || t.outflow, t.mode, "APPROVED"]);
      }

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.map((x) => `"${x}"`).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${name} downloaded as ${fmt}`);
    } else {
      window.print();
      toast.success(`Opening printable document for ${name}`);
    }
  };

  // ── Load entries ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, bookingsRes] = await Promise.all([
        accountingService.getEntries({
          page: String(page),
          limit: String(pageSize),
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(fStatus !== "ALL" ? { status: fStatus } : {}),
          ...(fMode !== "ALL" ? { paymentMode: fMode } : {}),
        }),
        bookingsService.getAll({ limit: 1000 }).catch(() => null),
      ]);
      if (result) {
        setEntries(result.data);
        setLedgerTotals(result.summary);
        setTotalCount(result.pagination.totalCount);
        setTotalPages(result.pagination.totalPages);
      }
      if (bookingsRes) {
        const rawList = Array.isArray(bookingsRes)
          ? bookingsRes
          : bookingsRes.data || bookingsRes.bookings || [];
        setBookings(rawList);
      }
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
      const liveQueueRes = await api.get("/payments/vendor-payables-queue").catch(() => null);
      if (liveQueueRes?.data?.data && Array.isArray(liveQueueRes.data.data) && liveQueueRes.data.data.length > 0) {
        setVendorAssignments(liveQueueRes.data.data);
        return;
      }

      const [tripsList, directoryVendors] = await Promise.all([
        tripsService.getAll().catch(() => []),
        vendorsService.getAll().catch(() => []),
      ]);

      const tripIds = tripsList.map((t: any) => t.id || t._id).filter(Boolean);
      const byTripMap = await vendorsService
        .getBulkForTrips(tripIds)
        .catch(() => ({}));

      const allAssignments: any[] = [];

      // 1. Map bulk vendor assignments
      tripsList.forEach((trip: any) => {
        const tId = trip.id || trip._id;
        const assignments = byTripMap[tId] || [];
        assignments.forEach((a: any) => {
          const agreed = a.totalAmount || a.agreedCost || 0;
          const paid = a.paidAmount || a.advancePaid || 0;
          allAssignments.push({
            ...a,
            vendorId:
              typeof a.vendorId === "object"
                ? a.vendorId
                : {
                    name: a.vendorName || a.name || String(a.vendorId || "Vendor"),
                    type: (a.category || a.vendorType || "HOTEL").toUpperCase(),
                  },
            vendorName: a.vendorName || a.name || (typeof a.vendorId === "object" ? a.vendorId?.name : String(a.vendorId || "Vendor")),
            tripName: trip.title || trip.name || "Spiti Valley Road Trip",
            tripCode: trip.tripCode || "SPT-1",
            tripId: tId,
            totalAmount: agreed,
            paidAmount: paid,
            paymentStatus:
              paid >= agreed && agreed > 0
                ? "paid"
                : paid > 0
                  ? "partial"
                  : "pending",
          });
        });
      });

      // 2. Map directory vendors into assignments list
      (directoryVendors || []).forEach((v: any) => {
        const vName = v.name || "Vendor";
        const vType = (v.type || "HOTEL").toUpperCase();
        const exists = allAssignments.some(
          (a) =>
            (a.vendorName && a.vendorName.toLowerCase() === vName.toLowerCase()) ||
            (typeof a.vendorId === "object" && a.vendorId?.name?.toLowerCase() === vName.toLowerCase()),
        );

        if (!exists) {
          const agreed = Number(v.agreedAmount || v.rate || v.cost || 0);
          const paid = Number(v.paidAmount || v.advancePaid || 0);
          allAssignments.push({
            id: `vnd-dir-${v.id || vName.replace(/\s+/g, "-")}`,
            vendorId: { name: vName, type: vType },
            vendorName: vName,
            tripName: v.location ? `${v.location} Trip` : "General Operations",
            tripCode: "OPS-1",
            totalAmount: agreed,
            paidAmount: paid,
            paymentStatus:
              paid >= agreed && agreed > 0
                ? "paid"
                : paid > 0
                  ? "partial"
                  : "pending",
          });
        }
      });

      // 2. Fetch departure hub vendors for each trip
      for (const trip of tripsList.slice(0, 10)) {
        const tId = trip.id || trip._id;
        const depDate = trip.nextDepartureDate || trip.startDate || "2026-08-18";
        try {
          // Fetch resolved departure hub state & vendor payments
          const [resDep, opsVnd] = await Promise.all([
            api.get(`/departures/resolve?tripId=${tId}&date=${encodeURIComponent(depDate)}`).catch(() => null),
            opsService.getVendorPayments(tId, depDate).catch(() => []),
          ]);

          const depData = resDep?.data?.data?.departure || {};
          const depVendors: any[] = [];

          // Extract hotels
          (depData.hotels || depData.hotelAllocations || []).forEach((h: any) => {
            const hName = h.hotelName || h.name || (typeof h.vendorId === "object" ? h.vendorId?.name : h.vendorId);
            if (hName) {
              depVendors.push({
                name: hName,
                type: "HOTEL",
                cost: h.agreedCost || h.totalCost || h.rate || 9000,
                paid: h.paidAmount || h.advancePaid || 0,
              });
            }
          });

          // Extract transport
          (depData.transportFleet || depData.vehicles || []).forEach((t: any) => {
            const tName = t.vendorName || t.vehicleName || t.name || (typeof t.vendorId === "object" ? t.vendorId?.name : "Transport Vendor");
            if (tName) {
              depVendors.push({
                name: tName,
                type: "TRANSPORT",
                cost: t.totalCost || t.agreedCost || t.rate || 18000,
                paid: t.paidAmount || t.advancePaid || 0,
              });
            }
          });

          // Extract guides
          (depData.guides || []).forEach((g: any) => {
            const gName = g.name || g.guideName || "Lead Guide";
            if (gName) {
              depVendors.push({
                name: gName,
                type: "GUIDE",
                cost: g.agreedCost || g.totalCost || g.fee || 100000,
                paid: g.paidAmount || g.advancePaid || 0,
              });
            }
          });

          // Extract ops vendor payments
          (opsVnd || []).forEach((v: any) => {
            const vName = v.vendorName || v.name;
            if (vName) {
              depVendors.push({
                name: vName,
                type: (v.category || "HOTEL").toUpperCase(),
                cost: v.agreedAmount || v.agreedCost || 0,
                paid: v.advancePaid || v.paidAmount || 0,
              });
            }
          });

          // Merge extracted departure vendors into allAssignments
          depVendors.forEach((v) => {
            const exists = allAssignments.find(
              (a) =>
                (a.vendorName && a.vendorName.toLowerCase() === v.name.toLowerCase()) ||
                (typeof a.vendorId === "object" && a.vendorId?.name?.toLowerCase() === v.name.toLowerCase()),
            );
            if (!exists) {
              allAssignments.push({
                id: `dep-${v.name.replace(/\s+/g, "-")}`,
                vendorId: { name: v.name, type: v.type },
                vendorName: v.name,
                tripName: trip.title || trip.name || "Spiti Valley Road Trip",
                tripCode: trip.tripCode || "SPT-1",
                tripId: tId,
                totalAmount: v.cost,
                paidAmount: v.paid,
                dueDate: depDate,
                paymentStatus: v.paid >= v.cost && v.cost > 0 ? "paid" : v.paid > 0 ? "partial" : "pending",
              });
            }
          });
        } catch {}
      }

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
    loadReports();
    loadVendorAssignments();
    loadPersonalCollections();
  }, [loadReports]);

  // Re-fetch personal collections whenever the active date window changes
  useEffect(() => {
    loadPersonalCollections(activeDateStart, activeDateEnd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDateStart, activeDateEnd]);

  useEffect(() => {
    setPage(1);
  }, [search, fStatus, fMode, pageSize]);

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
      setForm({
        bookingId: "",
        amount: "",
        paymentMode: "CASH",
        referenceNumber: "",
        notes: "",
      });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create entry");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenAddBank = () => {
    setEditingBankIdx(-1);
    setBankDetailsForm({
      name: "",
      nick: "",
      num: "",
      holder: "YouthCamping Travel Pvt. Ltd.",
      type: "Current Account",
      branch: "",
      ifsc: "",
      openBal: 0,
    });
    setShowEditBankModal(true);
  };

  const handleEditBank = (idx: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingBankIdx(idx);
    const bank = customBankAccounts[idx];
    if (!bank) return;
    setBankDetailsForm({
      name: bank.name || "",
      nick: bank.nick || "",
      num: bank.num || "",
      holder: bank.holder || "YouthCamping Travel Pvt. Ltd.",
      type: bank.type || "Current Account",
      branch: bank.branch || "",
      ifsc: bank.ifsc || "",
      openBal: Number(bank.openBal || bank.bal || 0),
    });
    setShowEditBankModal(true);
  };

  const handleDeleteBank = (idx: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated = customBankAccounts.filter((_, i) => i !== idx);
    saveCustomBankAccounts(updated);
    if (selectedBankIdx >= updated.length) {
      setSelectedBankIdx(Math.max(0, updated.length - 1));
    }
    toast.success("Bank account removed");
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBankIdx === -1) {
      const newAccount = {
        code: bankDetailsForm.name.substring(0, 5).toUpperCase() || "BANK",
        name: bankDetailsForm.name,
        nick: bankDetailsForm.nick || "Operational Account",
        num: bankDetailsForm.num || "****0000",
        holder: bankDetailsForm.holder || "YouthCamping Travel Pvt. Ltd.",
        type: bankDetailsForm.type || "Current Account",
        branch: bankDetailsForm.branch || "Main Branch",
        ifsc: bankDetailsForm.ifsc || "BANK0001234",
        bal: Number(bankDetailsForm.openBal || 0),
        openBal: Number(bankDetailsForm.openBal || 0),
        rec: "Today",
        status: "Active",
      };
      const updated = [...customBankAccounts, newAccount];
      saveCustomBankAccounts(updated);
      setSelectedBankIdx(updated.length - 1);
      toast.success("Bank account added successfully!");
    } else if (editingBankIdx >= 0) {
      const updated = customBankAccounts.map((b, i) => {
        if (i === editingBankIdx) {
          return {
            ...b,
            ...bankDetailsForm,
            bal: Number(bankDetailsForm.openBal || 0),
            openBal: Number(bankDetailsForm.openBal || 0),
          };
        }
        return b;
      });
      saveCustomBankAccounts(updated);
      toast.success("Bank details updated successfully!");
    }
    setShowEditBankModal(false);
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
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
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

  const handleRecordVendorPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorPayDialog.assignment) return;
    const assignmentId =
      vendorPayDialog.assignment.id || vendorPayDialog.assignment._id;
    setUpdatingVendorId(assignmentId);
    try {
      await vendorsService.updateAssignment(assignmentId, {
        paidAmount: Number(outgoingForm.paidAmount),
        paymentStatus: outgoingForm.paymentStatus as any,
        notes: outgoingForm.notes || undefined,
        outgoingPaymentMode: outgoingForm.outgoingPaymentMode,
        onlinePersonAccount:
          outgoingForm.outgoingPaymentMode === "ONLINE"
            ? outgoingForm.onlinePersonAccount
            : null,
        cashDepositorName:
          outgoingForm.outgoingPaymentMode === "CASH"
            ? outgoingForm.cashDepositorName
            : null,
        depositAccountName:
          outgoingForm.outgoingPaymentMode === "CASH"
            ? outgoingForm.depositAccountName
            : null,
      });
      toast.success("Vendor payment details updated successfully");
      setVendorPayDialog({ open: false, assignment: null });
      loadVendorAssignments();
    } catch {
      toast.error("Failed to update vendor payment");
    } finally {
      setUpdatingVendorId(null);
    }
  };

  const openHistory = async (entry: AccountingEntry) => {
    setHistoryDialog({ open: true, entry: { ...entry, history: undefined } });
    try {
      const history = await accountingService.getEntryHistory(entry.id);
      setHistoryDialog((current) =>
        current.entry?.id === entry.id
          ? { open: true, entry: { ...entry, history } }
          : current,
      );
    } catch {
      toast.error("Failed to load payment history");
    }
  };

  const canApprove = hasPermission(
    (user as any)?.permissions || (user as any)?.customPermissions,
    "accounting.approve",
    user?.role,
  );

  // Filtered lists
  const filteredVendors = vendorAssignments.filter((a) => {
    const vName =
      typeof a.vendorId === "object" && a.vendorId?.name
        ? a.vendorId.name
        : a.vendorName || a.name || (typeof a.vendorId === "string" ? a.vendorId : "Vendor");
    const vType =
      typeof a.vendorId === "object" && a.vendorId?.type
        ? a.vendorId.type
        : a.category || a.vendorType || "HOTEL";

    if (!vName) return false;

    const matchesSearch =
      vName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (a.tripName || "").toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (a.tripCode || "").toLowerCase().includes(vendorSearch.toLowerCase());

    const matchesType =
      vendorTypeFilter === "ALL" || String(vType).toUpperCase() === String(vendorTypeFilter).toUpperCase();
    const matchesStatus =
      vendorStatusFilter === "ALL" || a.paymentStatus === vendorStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate stats for KPIs — all use date-filtered data
  // totalApprovedCollection = sum of dynamicInflows (already date-filtered booking payments)
  // NOTE: dynamicInflows is defined BELOW (after mergedEntries) so we compute this lazily from rawTransactions later
  const outstandingCustomers = bookings
    .filter((b) => {
      const paid = Number(b.advancePaid ?? b.advance ?? b.paidAmount ?? 0);
      const total = Number(b.totalAmount ?? b.totalPrice ?? 0);
      return total > 0 && paid < total;
    })
    .reduce((sum, b) => {
      const paid = Number(b.advancePaid ?? b.advance ?? b.paidAmount ?? 0);
      const total = Number(b.totalAmount ?? b.totalPrice ?? 0);
      return sum + (total - paid);
    }, 0);
  const outstandingBookingsCount = bookings.filter((b) => {
    const paid = Number(b.advancePaid ?? b.advance ?? b.paidAmount ?? 0);
    const total = Number(b.totalAmount ?? b.totalPrice ?? 0);
    return total > 0 && paid < total;
  }).length;
  const outstandingVendors = vendorAssignments.reduce(
    (sum, a) => sum + Math.max(0, (a.totalAmount || 0) - (a.paidAmount || 0)),
    0,
  );
  const outstandingVendorsCount = vendorAssignments.filter(
    (a) => a.paymentStatus !== "paid" && (a.totalAmount || 0) > (a.paidAmount || 0),
  ).length;

  // cashFlowData is computed AFTER rawTransactions is defined (below)

  // Map ALL collected booking payments into income transactions
  const bookingEntries = bookings
    .filter((b) => {
      const paid = Number(
        b.advancePaid ??
          b.advance ??
          b.paidAmount ??
          b.receivedAmount ??
          b.totalPaid ??
          b.amountPaid ??
          0,
      );
      return paid > 0;
    })
    .map((b) => {
      const paid = Number(
        b.advancePaid ??
          b.advance ??
          b.paidAmount ??
          b.receivedAmount ??
          b.totalPaid ??
          b.amountPaid ??
          0,
      );
      const bId = b.bookingId || b.id || `BK-${b._id}`;
      return {
        id: `bk-entry-${b.id || b._id || b.bookingId}`,
        bookingId: bId,
        booking: {
          bookingId: bId,
          fullName: b.fullName || b.name || b.passengerName || "Guest",
          tripName: b.tripName || b.tripCode || "Trip",
          totalAmount: Number(b.totalAmount || b.totalPrice || 0),
        },
        amount: paid,
        paymentMode: b.paymentMode || b.payment_method || "UPI",
        status: "APPROVED",
        createdAt:
          typeof b.createdAt === "string"
            ? b.createdAt
            : new Date().toISOString(),
        salesperson: b.salesAdmin
          ? { id: b.salesAdmin.id, name: b.salesAdmin.name, email: b.salesAdmin.email }
          : undefined,
      };
    });

  // Merge unique entries: include ALL collected booking payments and manual ledger entries
  const entryMap = new Map();
  bookingEntries.forEach((be) => {
    entryMap.set(be.id, be);
  });
  (entries || []).forEach((e) => {
    if (e.id) {
      entryMap.set(e.id, e);
    }
  });

  const mergedEntries = Array.from(entryMap.values());

  // Helper: check if a date string / ISO date falls within active date window
  const dateInRange = (dateStr: string | undefined): boolean => {
    if (selectedPreset === "All Time") return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    // Compare at day-level precision — strip time
    const dayStart = new Date(activeDateStart.getFullYear(), activeDateStart.getMonth(), activeDateStart.getDate());
    const dayEnd = new Date(activeDateEnd.getFullYear(), activeDateEnd.getMonth(), activeDateEnd.getDate(), 23, 59, 59);
    return d >= dayStart && d <= dayEnd;
  };

  // Dynamic Collections (Approved entries with positive collected amount, filtered by date)
  const dynamicInflows = mergedEntries
    .filter((e) => e.status === "APPROVED" && (Number(e.amount) || 0) > 0 && dateInRange(e.createdAt))
    .map((e) => {
      const rawMode = String(e.paymentMode || e.mode || "").toUpperCase().trim();
      const isCash = rawMode === "CASH" || rawMode.includes("CASH") || rawMode.includes("MONEY");
      const isUpi = rawMode === "UPI" || rawMode.includes("UPI") || rawMode.includes("QR");

      return {
        id: e.id,
        originalEntry: e,
        date: e.createdAt.split("T")[0],
        time: new Date(e.createdAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        type: "Income",
        particulars: `Received from ${e.booking?.fullName || e.booking?.name || "Guest"}`,
        subParticulars: "Booking Payment",
        reference: e.booking?.tripName || "Trip",
        account: isCash ? "Cash Account / Cash Book" : isUpi ? "UPI / QR Account" : "ICICI Bank A/c",
        mode: isCash ? "Cash" : isUpi ? "UPI" : "Bank Transfer",
        inflow: e.amount,
        outflow: 0,
        status: "APPROVED",
        category: "Booking Payment",
        categoryColor: "bg-blue-500",
        addedBy: e.salesperson?.name || "System",
      };
    });

  // Dynamic Payouts (Paid vendor assignments, filtered by payment date)
  const dynamicOutflows = vendorAssignments
    .filter((a) => (a.paidAmount || 0) > 0 && dateInRange(a.updatedAt || a.createdAt))
    .map((a) => ({
      id: a._id || a.id,
      originalEntry: a,
      date: a.updatedAt
        ? a.updatedAt.split("T")[0]
        : new Date().toISOString().split("T")[0],
      time: "12:00 PM",
      type: "Expense",
      particulars: `Paid to ${typeof a.vendorId === "object" ? a.vendorId.name : "Vendor"}`,
      subParticulars: "Vendor Payment",
      reference: a.tripCode || "Trip",
      account: "HDFC Bank A/c",
      mode: "Bank Transfer",
      inflow: 0,
      outflow: a.paidAmount,
      status: "APPROVED",
      category:
        typeof a.vendorId === "object" && a.vendorId.type
          ? a.vendorId.type.toUpperCase() === "HOTEL"
            ? "Hotel"
            : a.vendorId.type.toUpperCase() === "TRANSPORT"
              ? "Transport"
              : a.vendorId.type.toUpperCase() === "ACTIVITY"
                ? "Activity"
                : a.vendorId.type.toUpperCase() === "GUIDE"
                  ? "Guide"
                  : "Misc Direct Expenses"
          : "Misc Direct Expenses",
      categoryColor: "bg-green-500",
      addedBy: "System",
    }));

  // Dynamic Office Expenses (filtered by expense date)
  const dynamicOfficeExpenses = officeExpenses.filter((e) => dateInRange(e.date || e.createdAt)).map((e) => ({
    id: e._id || e.id,
    originalEntry: e,
    date: e.date,
    time: "10:00 AM",
    type: "Expense",
    particulars: e.note || "Office Expense",
    subParticulars: e.category || "Utilities",
    reference: "—",
    account: e.outgoingPaymentMode === "CASH" ? "Cash" : "ICICI Bank A/c",
    mode: e.outgoingPaymentMode || "UPI",
    inflow: 0,
    outflow: e.amount,
    status: "APPROVED",
    category: e.category || "Utilities",
    categoryColor: "bg-orange-500",
    addedBy: "Admin",
  }));

  const officeExpensesRows =
    dynamicOfficeExpenses.length > 0
      ? dynamicOfficeExpenses.map((e) => ({
          date: e.date,
          cat: e.subParticulars || "Miscellaneous",
          desc: e.particulars || "Office Operational Expense",
          vendor: e.originalEntry?.payeeName || "Vendor / Staff",
          account: e.account || "—",
          amount: e.outflow || 0,
          mode: e.mode || "UPI",
          rec: e.originalEntry?.referenceNumber || "—",
          trip: "—",
          addedBy: e.addedBy || "Admin",
          icon: CreditCard,
          iconColor: "bg-orange-50 text-orange-600",
        }))
      : [];

  const rawTransactions = [
    ...dynamicInflows,
    ...dynamicOutflows,
    ...dynamicOfficeExpenses,
  ];

  // ── Date-filtered KPI values (computed from rawTransactions) ──────────────
  const totalApprovedCollection = rawTransactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + (t.inflow || 0), 0);
  const totalVendorPaid = rawTransactions
    .filter((t) => t.type === "Expense" && t.subParticulars === "Vendor Payment")
    .reduce((sum, t) => sum + (t.outflow || 0), 0);
  const totalOfficeExpenses = rawTransactions
    .filter((t) => t.type === "Expense" && t.subParticulars !== "Vendor Payment")
    .reduce((sum, t) => sum + (t.outflow || 0), 0);
  const cashInHand = totalApprovedCollection - totalVendorPaid - totalOfficeExpenses;

  // ── Dynamic bank summary (start from 0 — only real transactions) ──────────
  const iciciBalance = rawTransactions.reduce(
    (sum, t) =>
      sum + (t.account === "ICICI Bank A/c" ? t.inflow - t.outflow : 0),
    0,
  );
  const hdfcBalance = rawTransactions.reduce(
    (sum, t) =>
      sum + (t.account === "HDFC Bank A/c" ? t.inflow - t.outflow : 0),
    0,
  );
  const cashBalance = rawTransactions.reduce(
    (sum, t) => sum + (t.account === "Cash" ? t.inflow - t.outflow : 0),
    0,
  );

  // ── Dynamic cashFlowData: group transactions by day within the active window ──
  const buildCashFlowData = () => {
    // Generate all days in the active date window
    const days: { name: string; dateKey: string }[] = [];
    const cursor = new Date(activeDateStart);
    cursor.setHours(0, 0, 0, 0);
    const windowEnd = new Date(activeDateEnd);
    windowEnd.setHours(23, 59, 59, 999);

    // Limit to 31 days max to keep chart readable
    let count = 0;
    while (cursor <= windowEnd && count < 31) {
      const label = cursor.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const key = cursor.toISOString().split("T")[0];
      days.push({ name: label, dateKey: key });
      cursor.setDate(cursor.getDate() + 1);
      count++;
    }

    // Bucket transactions per day
    return days.map(({ name, dateKey }) => {
      const dayTx = rawTransactions.filter((t) => {
        const txDate = (t.date || "").substring(0, 10);
        return txDate === dateKey;
      });
      const collection = dayTx.filter((t) => t.type === "Income").reduce((s, t) => s + (t.inflow || 0), 0);
      const vendorPay = dayTx.filter((t) => t.type === "Expense" && t.subParticulars === "Vendor Payment").reduce((s, t) => s + (t.outflow || 0), 0);
      const expenses = dayTx.filter((t) => t.type === "Expense" && t.subParticulars !== "Vendor Payment").reduce((s, t) => s + (t.outflow || 0), 0);
      return { name, Collection: collection, "Vendor Payments": vendorPay, Expenses: expenses };
    });
  };

  const cashFlowData = buildCashFlowData();

  const totalCollection = rawTransactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + t.inflow, 0);
  const totalVendorPayments = rawTransactions
    .filter(
      (t) =>
        t.type === "Expense" &&
        t.category !== "Utilities" &&
        t.category !== "Rent" &&
        t.category !== "Salaries",
    )
    .reduce((sum, t) => sum + t.outflow, 0);
  const totalOfficeExpensesVal = rawTransactions
    .filter(
      (t) =>
        t.type === "Expense" &&
        (t.category === "Utilities" ||
          t.category === "Rent" ||
          t.category === "Salaries"),
    )
    .reduce((sum, t) => sum + t.outflow, 0);
  const totalExpenses = totalVendorPayments + totalOfficeExpensesVal;
  const totalOutstandingVal = vendorAssignments
    .filter((a) => a.paymentStatus !== "paid")
    .reduce((sum, a) => sum + (a.totalAmount - (a.paidAmount || 0)), 0);

  const hotelExpenses = rawTransactions
    .filter((t) => t.type === "Expense" && t.category === "Hotel")
    .reduce((sum, t) => sum + t.outflow, 0);
  const transportExpenses = rawTransactions
    .filter((t) => t.type === "Expense" && t.category === "Transport")
    .reduce((sum, t) => sum + t.outflow, 0);
  const guideExpenses = rawTransactions
    .filter((t) => t.type === "Expense" && t.category === "Guide")
    .reduce((sum, t) => sum + t.outflow, 0);
  const officeExpensesSum = totalOfficeExpensesVal;
  const otherExpensesSum =
    totalExpenses -
    hotelExpenses -
    transportExpenses -
    guideExpenses -
    officeExpensesSum;

  const expensesData = [
    { name: "Hotel Bookings", value: hotelExpenses, color: "#3B82F6" },
    { name: "Transport", value: transportExpenses, color: "#10B981" },
    { name: "Guide & Staff", value: guideExpenses, color: "#8B5CF6" },
    { name: "Office Expenses", value: officeExpensesSum, color: "#F59E0B" },
    {
      name: "Other Expenses",
      value: otherExpensesSum >= 0 ? otherExpensesSum : 0,
      color: "#EF4444",
    },
  ];

  const horizontalBarsData = [
    { name: "Accommodation", value: hotelExpenses, color: "#3B82F6" },
    { name: "Transport", value: transportExpenses, color: "#10B981" },
    { name: "Guide & Staff", value: guideExpenses, color: "#8B5CF6" },
    { name: "Office Expenses", value: officeExpensesSum, color: "#F59E0B" },
    {
      name: "Other",
      value: otherExpensesSum >= 0 ? otherExpensesSum : 0,
      color: "#EF4444",
    },
  ];

  const bankSummary = [
    { name: "ICICI Bank A/c", amount: iciciBalance, icon: "bank" },
    { name: "HDFC Bank A/c", amount: hdfcBalance, icon: "bank" },
    { name: "Cash", amount: cashBalance, icon: "cash" },
  ];

  const [customBankAccounts, setCustomBankAccounts] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("yc_custom_bank_accounts");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        code: "ICICI",
        name: "ICICI Bank",
        nick: "Operations Account",
        num: "****9482",
        holder: "YouthCamping Travel Pvt. Ltd.",
        type: "Current Account",
        branch: "Ahmedabad Main Branch",
        ifsc: "ICIC000124",
        bal: iciciBalance,
        openBal: 585300,
        rec: "Yesterday",
        status: "Active",
      },
      {
        code: "HDFC",
        name: "HDFC Bank",
        nick: "Customer Collection",
        num: "****8234",
        holder: "YouthCamping Travel Pvt. Ltd.",
        type: "Current Account",
        branch: "Ahmedabad Gota Branch",
        ifsc: "HDFC000556",
        bal: hdfcBalance,
        openBal: 325500,
        rec: "Today",
        status: "Active",
      },
      {
        code: "Cash",
        name: "Cash In Hand",
        nick: "Cash Account (Office)",
        num: "OFFICE CASH",
        holder: "Office Cash",
        type: "Cash Account",
        branch: "Ahmedabad Office",
        ifsc: "—",
        bal: cashBalance,
        openBal: 160000,
        rec: "Today",
        status: "Active",
      },
    ];
  });

  const saveCustomBankAccounts = (accounts: any[]) => {
    setCustomBankAccounts(accounts);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("yc_custom_bank_accounts", JSON.stringify(accounts));
      } catch {}
    }
  };

  const bankAccountsListGlobal = customBankAccounts;

  const pendingVendorPayments = vendorAssignments
    .filter((a) => a.paymentStatus !== "paid" && (a.totalAmount || 0) > (a.paidAmount || 0))
    .slice(0, 5)
    .map((a) => ({
      vendor: typeof a.vendorId === "object" ? a.vendorId.name : (a.vendorName || "Vendor"),
      trip: a.tripCode || "—",
      dueDate: a.dueDate
        ? new Date(a.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
      amount: Math.max(0, (a.totalAmount || 0) - (a.paidAmount || 0)),
    }));

  const tripProfitability =
    reports?.revenuePerTrip?.map((r: any) => {
      const tripVendors = vendorAssignments.filter(
        (v) => v.tripRef?.title === r.tripName || v.tripCode === r.tripName,
      );
      const vendorCost = tripVendors.reduce((sum, v) => sum + v.totalAmount, 0);
      const trainCost = Number(r.trainTicketCost || 0);
      const totalCost = vendorCost + trainCost;
      const vendorPaid = tripVendors.reduce((sum, v) => sum + (v.paidAmount || 0), 0);
      const totalPaid = vendorPaid + trainCost;
      const profit = r.amount - totalCost;
      const pct = r.amount > 0 ? Math.round((profit / r.amount) * 100) : 0;
      return {
        name: r.tripName,
        date: "Active",
        revenue: r.amount,
        vendorCost,
        trainCost,
        cost: totalCost,
        profit,
        pct,
        paid: totalPaid,
        pending: Math.max(0, totalCost - totalPaid),
      };
    }) || [];

  // Helper to parse date + time into absolute timestamp
  const parseDateTime = (dateStr: string, timeStr: string) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = (time || "12:00").split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    const d = new Date(dateStr);
    d.setHours(hours || 12, minutes || 0, 0, 0);
    return d.getTime();
  };

  // Sort chronological oldest to newest to compute running balances correctly
  const sortedChronological = [...rawTransactions].sort((a, b) => {
    const timeA = parseDateTime(a.date, a.time);
    const timeB = parseDateTime(b.date, b.time);
    return timeA - timeB;
  });

  // Running balance starts at 0 (only real transactions)
  let currentBalance = 0;
  const computedTransactions = sortedChronological.map((t) => {
    if (t.type === "Income") {
      currentBalance += t.inflow;
    } else {
      currentBalance -= t.outflow;
    }
    return {
      ...t,
      balance: currentBalance,
    };
  });

  // Re-sort newest first for display
  const finalTransactions = [...computedTransactions].reverse();

  // Group by Date for UI Rendering
  const groupedTransactions: Record<string, typeof finalTransactions> = {};
  finalTransactions.forEach((t) => {
    const d = new Date(t.date);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const customHeader = `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()} (${daysOfWeek[d.getDay()]})`;

    if (!groupedTransactions[customHeader]) {
      groupedTransactions[customHeader] = [];
    }
    groupedTransactions[customHeader].push(t);
  });

  // Dynamic variables for Cash Book tab
  const cashTransactions = rawTransactions.filter(
    (t) => t.account === "Cash" || t.mode === "Cash",
  );
  const groupedCashTransactions: Record<string, typeof finalTransactions> = {};
  const sortedCashChronological = [...cashTransactions].sort((a, b) => {
    const timeA = parseDateTime(a.date, a.time);
    const timeB = parseDateTime(b.date, b.time);
    return timeA - timeB;
  });
  let currentCashBalance = 160000;
  const computedCashTransactions = sortedCashChronological.map((t) => {
    if (t.type === "Income") {
      currentCashBalance += t.inflow;
    } else {
      currentCashBalance -= t.outflow;
    }
    return {
      ...t,
      balance: currentCashBalance,
    };
  });
  const finalCashTransactions = [...computedCashTransactions].reverse();
  finalCashTransactions.forEach((t) => {
    const d = new Date(t.date);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const customHeader = `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()} (${daysOfWeek[d.getDay()]})`;

    if (!groupedCashTransactions[customHeader]) {
      groupedCashTransactions[customHeader] = [];
    }
    groupedCashTransactions[customHeader].push(t);
  });

  const cashHandlers: Record<
    string,
    { name: string; role: string; cashin: number; cashout: number }
  > = {};
  cashTransactions.forEach((t) => {
    const name = t.addedBy || "System";
    if (!cashHandlers[name]) {
      cashHandlers[name] = { name, role: "Staff", cashin: 0, cashout: 0 };
    }
    if (t.type === "Income") {
      cashHandlers[name].cashin += t.inflow;
    } else {
      cashHandlers[name].cashout += t.outflow;
    }
  });
  const dynamicCashHandlers = Object.values(cashHandlers);

  const totalCashIn = cashTransactions.reduce((sum, t) => sum + t.inflow, 0);
  const totalCashOut = cashTransactions.reduce((sum, t) => sum + t.outflow, 0);
  const netCashMovement = totalCashIn - totalCashOut;
  const cashInCount = cashTransactions.filter(
    (t) => t.type === "Income",
  ).length;
  const cashOutCount = cashTransactions.filter(
    (t) => t.type === "Expense",
  ).length;

  // Dynamic Profit & Loss Computations
  const plRevenue = rawTransactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + t.inflow, 0);

  // Direct costs calculated from vendor assignments across departures
  const plHotelCost = vendorAssignments
    .filter((a) => {
      const vType = typeof a.vendorId === "object" ? a.vendorId?.type : a.category;
      return String(vType).toUpperCase() === "HOTEL";
    })
    .reduce((sum, a) => sum + (a.totalAmount || 0), 0);

  const plTransportCost = vendorAssignments
    .filter((a) => {
      const vType = typeof a.vendorId === "object" ? a.vendorId?.type : a.category;
      return String(vType).toUpperCase() === "TRANSPORT";
    })
    .reduce((sum, a) => sum + (a.totalAmount || 0), 0);

  const plGuideCost = vendorAssignments
    .filter((a) => {
      const vType = typeof a.vendorId === "object" ? a.vendorId?.type : a.category;
      return String(vType).toUpperCase() === "GUIDE";
    })
    .reduce((sum, a) => sum + (a.totalAmount || 0), 0);

  const plActivityCost = vendorAssignments
    .filter((a) => {
      const vType = typeof a.vendorId === "object" ? a.vendorId?.type : a.category;
      return String(vType).toUpperCase() === "ACTIVITY";
    })
    .reduce((sum, a) => sum + (a.totalAmount || 0), 0);

  const plMiscDirectCost = vendorAssignments
    .filter((a) => {
      const vType = typeof a.vendorId === "object" ? a.vendorId?.type : a.category;
      const t = String(vType).toUpperCase();
      return t !== "HOTEL" && t !== "TRANSPORT" && t !== "GUIDE" && t !== "ACTIVITY";
    })
    .reduce((sum, a) => sum + (a.totalAmount || 0), 0);

  const plDirectCost =
    plHotelCost + plTransportCost + plGuideCost + plActivityCost + plMiscDirectCost;

  // Operating costs from office expenses
  const plRentCost = officeExpensesRows
    .filter((r) => r.cat.toLowerCase().includes("rent"))
    .reduce((sum, r) => sum + r.amount, 0);

  const plUtilitiesCost = officeExpensesRows
    .filter((r) => r.cat.toLowerCase().includes("utilit") || r.cat.toLowerCase().includes("net"))
    .reduce((sum, r) => sum + r.amount, 0);

  const plSalariesCost = officeExpensesRows
    .filter((r) => r.cat.toLowerCase().includes("salar"))
    .reduce((sum, r) => sum + r.amount, 0);

  const plMiscOperatingCost = officeExpensesRows
    .filter(
      (r) =>
        !r.cat.toLowerCase().includes("rent") &&
        !r.cat.toLowerCase().includes("utilit") &&
        !r.cat.toLowerCase().includes("net") &&
        !r.cat.toLowerCase().includes("salar"),
    )
    .reduce((sum, r) => sum + r.amount, 0);

  const plOperatingCost =
    plRentCost + plUtilitiesCost + plSalariesCost + plMiscOperatingCost;

  const plGrossProfit = plRevenue - plDirectCost;
  const plNetProfit = plGrossProfit - plOperatingCost;
  const plGrossMargin =
    plRevenue > 0 ? ((plGrossProfit / plRevenue) * 100).toFixed(2) : "0";
  const plNetMargin =
    plRevenue > 0 ? ((plNetProfit / plRevenue) * 100).toFixed(2) : "0";

  // Detailed breakdowns
  const plBookingRev = plRevenue;
  const plOtherRev = 0;

  // Trips and Refunds helpers for Profit & Loss
  const sortedTripsByProfit = [...tripProfitability].sort(
    (a, b) => b.profit - a.profit,
  );
  const topProfitableTrips = sortedTripsByProfit
    .filter((t) => t.profit >= 0)
    .slice(0, 5);
  const lossMakingTrips = sortedTripsByProfit.filter((t) => t.profit < 0);

  const dynamicRefunds = rawTransactions.filter(
    (t) => t.category?.toLowerCase() === "refund",
  );
  const totalRefundsSum = dynamicRefunds.reduce((sum, t) => sum + t.outflow, 0);
  const completedRefundsSum = dynamicRefunds
    .filter(
      (t) =>
        t.status?.toLowerCase() === "approved" ||
        t.particulars?.toLowerCase().includes("completed"),
    )
    .reduce((sum, t) => sum + t.outflow, 0);
  const pendingRefundsSum = totalRefundsSum - completedRefundsSum;

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "control_center", label: "Control Center (Verification Queues)" },
    { id: "transactions", label: "Transactions & Ledger" },
    { id: "cash_book", label: "Cash Book" },
    { id: "bank_accounts", label: "Collection Accounts" },
    { id: "vendor_payments", label: "Vendor Payments" },
    { id: "office_expenses", label: "Office Expenses" },
    { id: "profit_loss", label: "Profit & Loss" },
    { id: "trip_profitability", label: "Trip Profitability" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <div className="space-y-3 md:space-y-6 pb-28 md:pb-20 p-3 md:p-6 animate-fade-in bg-[#F4F7FB] min-h-screen">
      {/* Header and Filter controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 border-b border-[#E2E8F0] pb-3 sm:pb-4 bg-white -mx-3 md:-mx-6 -mt-3 md:-mt-6 p-3 md:p-6 shadow-sm">
        <div className="min-w-0">
          <h1 className="text-base md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Banknote className="w-4 h-4 md:w-5 md:h-5 text-[#F97316] shrink-0" />
            Accounting{" "}
            {activeTab === "overview" && (
              <span className="text-slate-400 font-medium text-xs md:text-sm truncate">
                / Overview
              </span>
            )}
            {activeTab === "control_center" && (
              <span className="text-slate-400 font-medium text-xs md:text-sm truncate">
                / Control Center
              </span>
            )}
            {activeTab === "cash_book" && (
              <span className="text-slate-400 font-medium text-xs md:text-sm truncate">
                / Cash Book
              </span>
            )}
            {activeTab === "bank_accounts" && (
              <span className="text-slate-400 font-medium text-xs md:text-sm truncate">
                / Collection Accounts
              </span>
            )}
          </h1>
          <p className="hidden md:block text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
            {activeTab === "cash_book"
              ? "Record all cash inflows and outflows across accounts."
              : activeTab === "bank_accounts"
                ? "Manage official company and individual collection accounts, cash registers, and fund submissions."
                : activeTab === "control_center"
                  ? "Finance control center, verification queues, and audit trail."
                  : "Manage transactions, collections, vendor disbursements, cash books and trip profitability."}
          </p>
          {/* Mobile: compact active-period line replaces the long uppercase blurb */}
          <p className="md:hidden text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
            {selectedPreset} · {dateRange}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
          {activeTab === "cash_book" && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 md:h-8.5 text-xs font-semibold rounded-lg md:rounded-[4px] border-slate-200 bg-white text-slate-650 flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Import
            </Button>
          )}

          {activeTab !== "control_center" && (
            <>
              {/* Date Range Picker (desktop only — mobile uses the preset bar below) */}
              <div className="relative hidden sm:block">
                <Input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="h-8.5 text-xs font-semibold rounded-[4px] border-[#E2E8F0] bg-white text-slate-700 pl-3.5 pr-8 w-56 shadow-xs"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                  Date
                </span>
              </div>

              {activeTab === "bank_accounts" ? (
                <Button
                  size="sm"
                  onClick={() => setShowAddCollectionAccountModal(true)}
                  className="h-9 md:h-8.5 flex-1 sm:flex-none px-3 md:px-4 rounded-lg md:rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="truncate">Add Collection Account</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowCreate(true)}
                  className="h-9 md:h-8.5 flex-1 sm:flex-none px-3 md:px-4 rounded-lg md:rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  {activeTab === "cash_book" ? "New Entry" : "Add Payment"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs — scroll-snapped strip on mobile, underline row on desktop */}
      <div
        ref={tabStripRef}
        className="flex items-center w-full md:border-b md:border-[#E2E8F0] bg-transparent p-0 md:h-9 rounded-none gap-2 md:gap-6 justify-start mb-3 md:mb-6 overflow-x-auto no-scrollbar snap-x scroll-px-3 -mx-3 px-3 md:mx-0 md:px-0"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => handleMainTabChange(tab.id)}
            className={cn(
              "shrink-0 snap-start whitespace-nowrap text-[11px] md:text-xs font-semibold shadow-none transition-all cursor-pointer",
              "rounded-full border px-3 py-1.5 md:rounded-none md:border-0 md:border-b-2 md:px-1 md:pb-2 md:pt-1.5 md:bg-transparent md:hover:bg-transparent",
              activeTab === tab.id
                ? "bg-[#0B1329] border-[#0B1329] text-white font-bold md:bg-transparent md:border-[#F97316] md:text-[#F97316]"
                : "bg-white border-slate-200 text-slate-600 md:border-transparent md:text-slate-500 md:hover:text-slate-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTROL CENTER TAB (Verification Queues & Separation of Duties Engine) */}
      {activeTab === "control_center" && (
        <div className="-mx-6 -mt-6">
          <FinanceControlCenterPage />
        </div>
      )}

      {/* Interactive Date Preset Bar for other tabs */}
      {activeTab !== "control_center" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 bg-white p-2 md:p-2.5 rounded-xl md:rounded-[4px] border border-slate-200 shadow-xs mb-3 md:mb-6">
          <div className="flex w-full sm:w-auto gap-1 sm:flex-wrap overflow-x-auto no-scrollbar snap-x text-[11px] md:text-xs font-semibold text-slate-500">
            {[
              "Today",
              "Yesterday",
              "This Week",
              "This Month",
              "Last Month",
              "This Financial Year",
              "All Time",
              "Custom Range",
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => applyDatePreset(preset)}
                className={cn(
                  "shrink-0 snap-start whitespace-nowrap px-2.5 md:px-3 py-1.5 rounded-full md:rounded-[3px] transition-all cursor-pointer",
                  selectedPreset === preset
                    ? "bg-orange-50 border border-[#F97316]/50 text-[#F97316] font-extrabold shadow-2xs"
                    : "border border-slate-200 md:border-transparent hover:bg-slate-50 hover:text-slate-800",
                )}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Range input: always on desktop, on mobile only for a custom range */}
          <div
            className={cn(
              "items-center gap-2 w-full sm:w-auto",
              selectedPreset === "Custom Range" ? "flex" : "hidden sm:flex",
            )}
          >
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
              Range:
            </span>
            <Input
              value={dateRange}
              onChange={(e) => {
                setSelectedPreset("Custom Range");
                setDateRange(e.target.value);
              }}
              placeholder="01 Aug 2026 - 31 Aug 2026"
              className="h-8 sm:h-7 text-xs flex-1 sm:flex-none sm:w-52 rounded-lg sm:rounded-[4px] border-[#E2E8F0] bg-white font-semibold text-slate-700 shadow-none"
            />
          </div>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-3 md:space-y-6">
          {/* 6 KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-2 md:gap-3.5">
            {[
              {
                label: "Total Collection",
                val: totalApprovedCollection,
                subtitle: `${dynamicInflows.length} payment${dynamicInflows.length !== 1 ? "s" : ""} received`,
                type: "up",
              },
              {
                label: "Total Payments (Vendors)",
                val: totalVendorPaid,
                subtitle: "Vendor disbursements",
                type: "neutral",
              },
              {
                label: "Office Expenses",
                val: totalOfficeExpenses,
                subtitle: `${dynamicOfficeExpenses.length} expense${dynamicOfficeExpenses.length !== 1 ? "s" : ""} logged`,
                type: "neutral",
              },
              {
                label: "Cash in Hand",
                val: Math.max(0, cashInHand),
                subtitle: cashInHand < 0 ? "Deficit" : "Net available",
                type: cashInHand >= 0 ? "up" : "down",
              },
              {
                label: "Outstanding (Customers)",
                val: outstandingCustomers,
                subtitle: `${outstandingBookingsCount} booking${outstandingBookingsCount !== 1 ? "s" : ""} unpaid`,
                type: "neutral",
              },
              {
                label: "Outstanding (Vendors)",
                val: outstandingVendors,
                subtitle: `${outstandingVendorsCount} vendor${outstandingVendorsCount !== 1 ? "s" : ""} pending`,
                type: "neutral",
              },
            ].map((card, i) => (
              <Card
                key={i}
                className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-4 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-w-0"
              >
                <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                  {card.label}
                </div>
                <div
                  title={`₹ ${card.val.toLocaleString("en-IN")}`}
                  className="text-base md:text-lg font-bold text-slate-800 mt-1 md:mt-2 tabular-nums truncate"
                >
                  ₹ {card.val.toLocaleString("en-IN")}
                </div>
                {card.subtitle && (
                  <div className="text-[10px] text-slate-500 font-medium mt-1 md:mt-1.5 truncate">
                    {card.subtitle}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
            {/* 1. Cash Flow Overview Line Chart */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cash Flow Overview
                </h3>
                <Select defaultValue="week">
                  <SelectTrigger className="h-7 text-[10px] w-24 rounded-[4px] border-slate-200">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px]">
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={9}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 4 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="Collection"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Vendor Payments"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Expenses"
                      stroke="#F97316"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Collection
                  </span>
                  <span className="text-sm font-bold text-[#10B981] mt-0.5 block">
                    ₹ {totalCollection.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Vendor Payments
                  </span>
                  <span className="text-sm font-bold text-[#EF4444] mt-0.5 block">
                    ₹ {totalVendorPayments.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Expenses
                  </span>
                  <span className="text-sm font-bold text-[#F97316] mt-0.5 block">
                    ₹ {totalOfficeExpensesVal.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* 2. Pending Vendor Payments Table */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pending Vendor Payments
                </h3>
                <button
                  onClick={() => handleMainTabChange("vendor_payments")}
                  className="text-[10px] font-bold text-primary-orange hover:underline uppercase"
                >
                  View All
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-2">Vendor</th>
                      <th className="pb-2">Trip</th>
                      <th className="pb-2">Due Date</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingVendorPayments.length > 0 ? (
                      pendingVendorPayments.map((p, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-50/50 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-2.5 font-semibold text-slate-700 truncate max-w-[90px]">
                            {p.vendor}
                          </td>
                          <td className="py-2.5 text-slate-500 font-medium">
                            {p.trip}
                          </td>
                          <td className="py-2.5 text-slate-500 font-medium">
                            {p.dueDate}
                          </td>
                          <td className="py-2.5 text-right font-bold text-red-500">
                            ₹{p.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-10 text-slate-400 text-[11px]"
                        >
                          All vendor payments settled.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Total Outstanding</span>
                <span className="text-red-500">
                  ₹ {totalOutstandingVal.toLocaleString()}
                </span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {/* 3. Recent Transactions List */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recent Transactions
                </h3>
                <button
                  onClick={() => handleMainTabChange("transactions")}
                  className="text-[10px] font-bold text-primary-orange hover:underline uppercase"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[280px] pr-1">
                {entries.slice(0, 5).map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start text-xs border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-700 truncate max-w-[150px]">
                        {entry.booking?.fullName || "Guest"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {entry.paymentMode === "CASH"
                          ? "Cash"
                          : entry.paymentMode === "UPI"
                            ? "UPI"
                            : "Bank"}{" "}
                        • {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-bold",
                        entry.status === "APPROVED"
                          ? "text-emerald-500"
                          : "text-amber-500",
                      )}
                    >
                      {entry.status === "APPROVED" ? "+" : "•"} ₹
                      {entry.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 4. Top Expenses Donut Chart */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Top Expenses (Month)
                </h3>
                <button
                  onClick={() => handleMainTabChange("reports")}
                  className="text-[10px] font-bold text-primary-orange hover:underline uppercase"
                >
                  View All
                </button>
              </div>

              <div className="flex items-center justify-center h-[140px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expensesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    Total
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    ₹{totalExpenses.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {expensesData.map((exp, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-[10px] text-slate-550 font-semibold"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: exp.color }}
                      />
                      <span>{exp.name}</span>
                    </div>
                    <span>₹{exp.value.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 5. Expense by Category Horizontal Bars */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Expense by Category
                </h3>
                <button
                  onClick={() => handleMainTabChange("reports")}
                  className="text-[10px] font-bold text-primary-orange hover:underline uppercase"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3.5 flex-1 pr-1">
                {(() => {
                  const totalExpenseVal =
                    horizontalBarsData.reduce(
                      (sum, item) => sum + item.value,
                      0,
                    ) || 1;
                  return horizontalBarsData.map((item, i) => {
                    const pct = Math.round(
                      (item.value / totalExpenseVal) * 100,
                    );
                    return (
                      <div key={i} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center font-semibold text-slate-600">
                          <span>{item.name}</span>
                          <span>
                            ₹{item.value.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-none overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>

            {/* 6. Bank & Cash Summary */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bank & Cash Summary
                </h3>
                <button
                  onClick={() => handleMainTabChange("bank_accounts")}
                  className="text-[10px] font-bold text-primary-orange hover:underline uppercase"
                >
                  View All
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {bankSummary.map((b, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {b.icon === "bank" ? (
                          <Building2 className="w-4 h-4 text-slate-500" />
                        ) : (
                          <IndianRupee className="w-4 h-4 text-slate-500" />
                        )}
                      </span>
                      <span className="font-bold text-slate-700">{b.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      ₹{b.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Total Available Balance</span>
                <span className="text-emerald-500">
                  ₹{" "}
                  {(iciciBalance + hdfcBalance + cashBalance).toLocaleString()}
                </span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
            {/* 8. Trip Profitability Summary Table */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Trip Profitability Summary
                </h3>
                <button
                  onClick={() => handleMainTabChange("trip_profitability")}
                  className="text-[10px] font-bold text-primary-orange hover:underline uppercase"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-2.5">Trip Name</th>
                      <th className="pb-2.5">Dep Date</th>
                      <th className="pb-2.5 text-right">Revenue</th>
                      <th className="pb-2.5 text-right">Cost</th>
                      <th className="pb-2.5 text-right">Gross Profit</th>
                      <th className="pb-2.5 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripProfitability.map((item, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-50/50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-2.5 font-semibold text-slate-700 truncate max-w-[160px]">
                          {item.name}
                        </td>
                        <td className="py-2.5 text-slate-500 font-medium">
                          {item.date}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-700">
                          ₹{item.revenue.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-slate-550">
                          ₹{item.cost.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-500">
                          ₹{item.profit.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px]">
                            {item.pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-6">
              {/* 7. Quick Actions Panel */}
              <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="p-3 bg-slate-50 border border-slate-100 hover:bg-[#F97316]/5 hover:border-[#F97316]/20 transition-all rounded-[4px] flex flex-col items-center justify-center text-center gap-1.5 group"
                  >
                    <ArrowUpRight className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-700">
                      Add Collection
                    </span>
                  </button>
                  <button
                    onClick={() => handleMainTabChange("vendor_payments")}
                    className="p-3 bg-slate-50 border border-slate-100 hover:bg-[#F97316]/5 hover:border-[#F97316]/20 transition-all rounded-[4px] flex flex-col items-center justify-center text-center gap-1.5 group"
                  >
                    <ArrowDownRight className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-700">
                      Vendor Payment
                    </span>
                  </button>
                  <button
                    onClick={() => handleMainTabChange("office_expenses")}
                    className="p-3 bg-slate-50 border border-slate-100 hover:bg-[#F97316]/5 hover:border-[#F97316]/20 transition-all rounded-[4px] flex flex-col items-center justify-center text-center gap-1.5 group"
                  >
                    <CreditCard className="w-5 h-5 text-[#F97316] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-700">
                      Record Expense
                    </span>
                  </button>
                  <button
                    onClick={() => handleMainTabChange("bank_accounts")}
                    className="p-3 bg-slate-50 border border-slate-100 hover:bg-[#F97316]/5 hover:border-[#F97316]/20 transition-all rounded-[4px] flex flex-col items-center justify-center text-center gap-1.5 group"
                  >
                    <ArrowRightLeft className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-700">
                      Bank Transfer
                    </span>
                  </button>
                </div>
              </Card>

              {/* 9. Monthly Summary Card */}
              <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Monthly Summary (July 2024)
                </h3>

                <div className="space-y-2">
                  {[
                    {
                      label: "Total Revenue",
                      val: totalCollection,
                      color: "text-slate-800",
                    },
                    {
                      label: "Total Vendor Payments",
                      val: totalVendorPayments,
                      color: "text-red-500",
                    },
                    {
                      label: "Total Office Expenses",
                      val: totalOfficeExpensesVal,
                      color: "text-red-500",
                    },
                    {
                      label: "Gross Profit",
                      val:
                        totalCollection -
                        totalVendorPayments -
                        totalOfficeExpensesVal,
                      color: "text-emerald-500",
                      bold: true,
                    },
                  ].map((sum, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs py-1 font-semibold"
                    >
                      <span
                        className={cn(
                          "text-slate-500",
                          sum.bold && "text-slate-700 font-bold",
                        )}
                      >
                        {sum.label}
                      </span>
                      <span className={cn("font-bold", sum.color)}>
                        ₹{sum.val.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-xs py-1.5 border-t border-slate-100 font-semibold">
                    <span className="text-slate-500">Profit Margin</span>
                    <span className="font-extrabold text-slate-800">
                      {totalCollection > 0
                        ? (
                            ((totalCollection -
                              totalVendorPayments -
                              totalOfficeExpensesVal) /
                              totalCollection) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* CASH BOOK TAB */}
      {activeTab === "cash_book" && (
        <div className="space-y-3 md:space-y-6">
          {/* 4 KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            {[
              {
                label: "Opening Cash Balance",
                val: 160000,
                desc: "Starting Cash",
                type: "neutral",
              },
              {
                label: "Total Cash Inflow",
                val: totalCashIn,
                desc: `${cashInCount} Transactions`,
                type: "up",
              },
              {
                label: "Total Cash Outflow",
                val: totalCashOut,
                desc: `${cashOutCount} Transactions`,
                type: "down",
              },
              {
                label: "Closing Cash Balance",
                val: 160000 + totalCashIn - totalCashOut,
                desc: `Current Cash`,
                type: "blue",
              },
            ].map((card, i) => (
              <Card
                key={i}
                className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-2.5 md:p-4.5 bg-white shadow-sm flex items-center gap-2.5 md:gap-4 min-w-0"
              >
                <div
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base shrink-0",
                    card.type === "up"
                      ? "bg-emerald-50 text-emerald-600"
                      : card.type === "down"
                        ? "bg-red-50 text-red-500"
                        : card.type === "blue"
                          ? "bg-blue-50 text-blue-500"
                          : "bg-slate-50 text-slate-600",
                  )}
                >
                  {card.type === "up" ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : card.type === "down" ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : card.type === "blue" ? (
                    <IndianRupee className="w-5 h-5" />
                  ) : (
                    <Compass className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                    {card.label}
                  </div>
                  <div
                    title={`₹ ${card.val.toLocaleString("en-IN")}`}
                    className="text-sm md:text-base font-black mt-1 text-slate-800 tabular-nums truncate"
                  >
                    ₹ {card.val.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[9px] text-slate-450 font-semibold mt-0.5 truncate">
                    {card.desc}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sub-tabs layout */}
          <div className="flex border-b border-slate-200 gap-4 md:gap-6 text-[11px] md:text-xs font-bold text-slate-400 overflow-x-auto no-scrollbar whitespace-nowrap">
            <button className="border-b-2 border-[#F97316] text-[#F97316] pb-2 px-1">
              All Transactions
            </button>
            <button className="hover:text-slate-700 pb-2 px-1">
              Cash Received
            </button>
            <button className="hover:text-slate-700 pb-2 px-1">
              Cash Paid
            </button>
          </div>

          {/* Filters & Table Card */}
          <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
            {/* Filter Toolbar */}
            <div className="flex flex-wrap gap-2 items-center bg-slate-50/50 p-2.5 rounded-[4px] border border-slate-100">
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search particulars..."
                  className="h-8 pl-8 text-xs rounded-[4px] border-slate-200 bg-white"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="h-8 text-[11px] w-28 bg-white border-slate-200 rounded-[4px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="all">All Categories</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="h-8 text-[11px] w-32 bg-white border-slate-200 rounded-[4px]">
                  <SelectValue placeholder="All Cash Handlers" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="all">All Cash Handlers</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="h-8 text-[11px] w-24 bg-white border-slate-200 rounded-[4px]">
                  <SelectValue placeholder="All Purposes" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="all">All Purposes</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="h-8 text-[11px] w-32 bg-white border-slate-200 rounded-[4px]">
                  <SelectValue placeholder="All Approval Status" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="all">All Approval Status</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="h-8 text-[11px] w-24 bg-white border-slate-200 rounded-[4px]">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="all">All Users</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2.5 text-slate-500 hover:text-slate-800 text-[11px] font-bold border border-slate-200 rounded-[4px] bg-white ml-auto"
              >
                <Filter className="w-3.5 h-3.5 mr-1" /> Filters
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2.5 text-slate-400 hover:text-slate-600 text-[11px] font-semibold"
              >
                Clear Filters
              </Button>
            </div>

            {/* Cash Book Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                    <th className="px-3.5 py-2.5">Date & Time</th>
                    <th className="px-3.5 py-2.5">Type</th>
                    <th className="px-3.5 py-2.5">Particulars</th>
                    <th className="px-3.5 py-2.5">Purpose / Trip</th>
                    <th className="px-3.5 py-2.5 text-right">Cash In (₹)</th>
                    <th className="px-3.5 py-2.5 text-right">Cash Out (₹)</th>
                    <th className="px-3.5 py-2.5 text-right">Balance (₹)</th>
                    <th className="px-3.5 py-2.5">Received By / Paid To</th>
                    <th className="px-3.5 py-2.5">Approved By</th>
                    <th className="px-3.5 py-2.5">Approval Status</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(groupedCashTransactions).length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-3.5 py-8 text-center text-slate-400 italic"
                      >
                        No cash transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    Object.keys(groupedCashTransactions).map((dateHeader) => (
                      <Fragment key={dateHeader}>
                        <tr className="bg-slate-50/80 font-bold text-slate-600 border-b border-slate-100">
                          <td
                            colSpan={11}
                            className="px-3.5 py-2 text-[10px] uppercase tracking-wide"
                          >
                            {dateHeader}
                          </td>
                        </tr>
                        {groupedCashTransactions[dateHeader].map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors"
                          >
                            <td className="px-3.5 py-2.5 text-slate-500 font-medium whitespace-nowrap">
                              {row.date} {row.time || "10:20 AM"}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span
                                className={cn(
                                  "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[2px]",
                                  row.type === "Income"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-500",
                                )}
                              >
                                {row.type}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">
                                  {row.particulars}
                                </span>
                                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                  {row.subParticulars || "Cash Book Entry"}
                                </span>
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-500 font-bold">
                              {row.reference}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">
                              {row.inflow > 0
                                ? row.inflow.toLocaleString()
                                : "—"}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-red-500">
                              {row.outflow > 0
                                ? row.outflow.toLocaleString()
                                : "—"}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-slate-700">
                              ₹ {row.balance.toLocaleString()}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">
                                  {row.addedBy}
                                </span>
                                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                  Staff
                                </span>
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-660 font-semibold">
                              System
                            </td>
                            <td className="px-3.5 py-2.5">
                              <div className="flex flex-col">
                                <span className="text-emerald-600 font-bold">
                                  Approved
                                </span>
                                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                  {row.date}
                                </span>
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button className="p-1 hover:bg-slate-50 rounded text-slate-400 border border-slate-100">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Bottom Summaries: Cash Handler, Movement, and Approval Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
            {/* Cash Handler Summary */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">
                Cash Handler Summary{" "}
                <span className="text-slate-400 text-[10px] font-normal normal-case ml-1">
                  (This Period)
                </span>
              </h3>
              <div className="space-y-4.5">
                {dynamicCashHandlers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No cash handler data available.
                  </p>
                ) : (
                  dynamicCashHandlers.map((handler: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs font-semibold text-slate-650"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-slate-600 uppercase text-[10px]">
                          {handler.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {handler.name}
                          </span>
                          <span className="text-[9px] text-slate-450 font-normal">
                            {handler.role}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div>
                          <span className="text-slate-400 text-[9px]">
                            Cash In:
                          </span>{" "}
                          <span className="text-emerald-600 font-bold">
                            ₹ {handler.cashin.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-0.5">
                          <span className="text-slate-400 text-[9px]">
                            Cash Out:
                          </span>{" "}
                          <span className="text-red-500 font-bold">
                            ₹ {handler.cashout.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Cash Movement Summary */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">
                Cash Movement Summary
              </h3>
              <div className="space-y-4 text-xs font-bold text-slate-650">
                <div className="flex justify-between items-center">
                  <span className="text-slate-450">Total Cash In</span>
                  <div className="text-right">
                    <span className="text-slate-750 font-black">
                      ₹ {totalCashIn.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-normal mt-0.5">
                      {cashInCount} Transactions
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450">Total Cash Out</span>
                  <div className="text-right">
                    <span className="text-slate-750 font-black">
                      ₹ {totalCashOut.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-normal mt-0.5">
                      {cashOutCount} Transactions
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t pt-3.5">
                  <span className="text-slate-800 font-black">
                    Net Cash Movement
                  </span>
                  <div className="text-right">
                    <span
                      className={cn(
                        "font-black text-sm",
                        netCashMovement >= 0
                          ? "text-emerald-600"
                          : "text-red-500",
                      )}
                    >
                      ₹ {netCashMovement.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-normal mt-0.5">
                      (Inflow - Outflow)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Approval Summary */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">
                Approval Summary
              </h3>
              <div className="space-y-4 text-xs font-bold text-slate-650">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{" "}
                    Approved
                  </span>
                  <div className="text-right">
                    <span className="text-slate-750 font-black">
                      {
                        entries.filter(
                          (e) =>
                            String(e.paymentMode || "").toUpperCase().includes("CASH") && e.status === "APPROVED",
                        ).length
                      }{" "}
                      Transactions
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      ₹{" "}
                      {entries
                        .filter(
                          (e) =>
                            String(e.paymentMode || "").toUpperCase().includes("CASH") && e.status === "APPROVED",
                        )
                        .reduce((sum, e) => sum + e.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />{" "}
                    Pending Approval
                  </span>
                  <div className="text-right">
                    <span className="text-slate-750 font-black">
                      {
                        entries.filter(
                          (e) =>
                            String(e.paymentMode || "").toUpperCase().includes("CASH") && e.status === "PENDING",
                        ).length
                      }{" "}
                      Transactions
                    </span>
                    <span className="text-[10px] text-amber-500 block mt-0.5">
                      ₹{" "}
                      {entries
                        .filter(
                          (e) =>
                            String(e.paymentMode || "").toUpperCase().includes("CASH") && e.status === "PENDING",
                        )
                        .reduce((sum, e) => sum + e.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />{" "}
                    Rejected
                  </span>
                  <div className="text-right">
                    <span className="text-slate-750 font-black">
                      {
                        entries.filter(
                          (e) =>
                            String(e.paymentMode || "").toUpperCase().includes("CASH") && e.status === "REJECTED",
                        ).length
                      }{" "}
                      Transactions
                    </span>
                    <span className="text-[10px] text-red-500 block mt-0.5">
                      ₹{" "}
                      {entries
                        .filter(
                          (e) =>
                            String(e.paymentMode || "").toUpperCase().includes("CASH") && e.status === "REJECTED",
                        )
                        .reduce((sum, e) => sum + e.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* COLLECTION ACCOUNTS TAB */}
      {(activeTab === "bank_accounts") && (
        <div className="space-y-3 md:space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-[4px] border border-[#E2E8F0] p-4 bg-white shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                TOTAL COLLECTED
              </p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                ₹ {personalCollectionsSummary.totalCollected.toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-2">
                Total inflows collected across all Company & Individual receiving accounts
              </p>
            </Card>

            <Card className="rounded-[4px] border border-[#E2E8F0] p-4 bg-white shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                TOTAL TRANSFERRED
              </p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                ₹ {personalCollectionsSummary.totalSubmitted.toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-2">
                Funds transferred/settled to YouthCamping central treasury
              </p>
            </Card>

            <Card className="rounded-[4px] border border-[#E2E8F0] p-4 bg-white shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                PENDING IN ACCOUNTS
              </p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                ₹ {personalCollectionsSummary.totalPending.toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-2">
                Net remaining balance held in collection accounts
              </p>
            </Card>
          </div>

          {/* Action & Filter Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-3.5 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center flex-1 max-w-xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={personalSearch}
                  onChange={(e) => setPersonalSearch(e.target.value)}
                  placeholder="Search collection account, holder, bank, UPI..."
                  className="h-8.5 w-full pl-8 text-xs rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="w-36">
                <Select
                  value={personalStatusFilter}
                  onValueChange={setPersonalStatusFilter}
                >
                  <SelectTrigger className="h-8.5 text-xs font-semibold border-slate-200 bg-white text-slate-700 rounded-[4px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px]">
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending Balance</SelectItem>
                    <SelectItem value="SETTLED">Settled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setShowAddCollectionAccountModal(true)}
              className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Account
            </Button>
          </div>

          {/* Collection Accounts Table */}
          <Card className="rounded-[4px] border border-[#E2E8F0] overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 border-r border-slate-100">COLLECTION ACCOUNT</th>
                    <th className="p-3 border-r border-slate-100">ACCOUNT DETAILS</th>
                    <th className="p-3 border-r border-slate-100 text-right">TOTAL COLLECTED</th>
                    <th className="p-3 border-r border-slate-100 text-right">TOTAL TRANSFERRED</th>
                    <th className="p-3 border-r border-slate-100 text-right">PENDING BALANCE</th>
                    <th className="p-3 border-r border-slate-100 text-center">STATUS</th>
                    <th className="p-3 border-r border-slate-100">LAST COLLECTION</th>
                    <th className="p-3 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {loadingPersonalCollections ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                        Loading collection accounts...
                      </td>
                    </tr>
                  ) : personalCollections.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                        No collection accounts found. Click "Add Account" to create one.
                      </td>
                    </tr>
                  ) : (
                    personalCollections
                      .filter((p) => {
                        const q = personalSearch.toLowerCase();
                        const matchSearch =
                          !personalSearch ||
                          (p.accountName || p.name || "").toLowerCase().includes(q) ||
                          (p.accountHolderName || p.email || "").toLowerCase().includes(q) ||
                          (p.bankName || "").toLowerCase().includes(q) ||
                          (p.upiId || "").toLowerCase().includes(q) ||
                          (p.accountType || "").toLowerCase().includes(q);
                        const matchStatus =
                          personalStatusFilter === "ALL" ||
                          p.status.toUpperCase() === personalStatusFilter.toUpperCase();
                        return matchSearch && matchStatus;
                      })
                      .map((account) => {
                        const isSettled =
                          account.status === "Settled" ||
                          account.status === "SETTLED" ||
                          account.pending === 0;

                        return (
                          <tr
                            key={account.id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="p-3 border-r border-slate-100">
                              <p className="font-extrabold text-slate-800 text-xs">
                                {account.accountName || account.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {account.accountHolderName || account.email || "—"}
                              </p>
                            </td>
                            <td className="p-3 border-r border-slate-100 text-slate-600 text-xs">
                              {account.bankName && (
                                <p className="font-semibold text-slate-700 text-[11px]">{account.bankName}</p>
                              )}
                              {account.maskedAccountNumber && (
                                <p className="font-mono text-[10px] text-slate-400">{account.maskedAccountNumber}</p>
                              )}
                              {account.upiId && (
                                <p className="font-mono text-[10px] text-blue-600">{account.upiId}</p>
                              )}
                              {!account.bankName && !account.maskedAccountNumber && !account.upiId && (
                                <span className="text-[10px] text-slate-400 font-mono">—</span>
                              )}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-700">
                              ₹ {account.totalCollected.toLocaleString("en-IN")}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-700">
                              ₹ {account.totalSubmitted.toLocaleString("en-IN")}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right font-extrabold text-slate-800">
                              ₹ {account.pending.toLocaleString("en-IN")}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-center">
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  isSettled ? "text-emerald-600" : "text-amber-600",
                                )}
                              >
                                {isSettled ? "Settled" : "Pending"}
                              </span>
                            </td>
                            <td className="p-3 border-r border-slate-100 text-slate-500 font-medium text-[11px]">
                              {account.lastCollection
                                ? new Date(account.lastCollection).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenPersonDetail(account)}
                                  className="h-7 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-200 shadow-xs transition-colors"
                                  title="View Account Detail Ledger"
                                >
                                  Ledger
                                </button>
                                <button
                                  onClick={() => handleOpenRecordSubmission(account.id)}
                                  className="h-7 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-200 shadow-xs transition-colors"
                                  title="Record Fund Transfer to Company"
                                >
                                  Transfer
                                </button>
                                <button
                                  onClick={() => setAccountToDelete(account)}
                                  className="h-7 px-3 text-xs font-medium text-red-600 bg-white hover:bg-red-50 rounded border border-red-200 shadow-xs transition-colors"
                                  title="Delete Account"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* VENDOR PAYMENTS TAB */}
      {activeTab === "vendor_payments" && (
        <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Vendor Payments Queue
            </h3>

            {/* Vendor Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search vendor, trip code..."
                  className="h-8 pl-8 text-xs rounded-[4px] border-[#E2E8F0]"
                />
              </div>
              <Select
                value={vendorStatusFilter}
                onValueChange={setVendorStatusFilter}
              >
                <SelectTrigger className="h-8 text-xs w-32 rounded-[4px] border-[#E2E8F0]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3">Total Cost</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Due Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((v, i) => {
                  const vendor =
                    typeof v.vendorId === "object"
                      ? v.vendorId
                      : { name: "Vendor" };
                  const balance = v.totalAmount - (v.paidAmount || 0);
                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {vendor.name}
                      </td>
                      <td className="px-4 py-3 text-slate-555">
                        {v.tripName} ({v.tripCode})
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        ₹{v.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        ₹{(v.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-red-500">
                        ₹{balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border",
                            v.paymentStatus === "paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                              : "bg-red-50 text-red-700 border-red-250",
                          )}
                        >
                          {v.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOutgoingForm({
                              paidAmount: v.paidAmount || 0,
                              paymentStatus: v.paymentStatus || "pending",
                              outgoingPaymentMode:
                                v.outgoingPaymentMode || "CASH",
                              onlinePersonAccount: v.onlinePersonAccount || "",
                              cashDepositorName: v.cashDepositorName || "",
                              depositAccountName: v.depositAccountName || "",
                              notes: v.notes || "",
                            });
                            setVendorPayDialog({ open: true, assignment: v });
                          }}
                          className="h-7 text-[10px] uppercase font-bold border border-slate-150 rounded-[4px] hover:bg-slate-50"
                        >
                          Disburse
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* OFFICE EXPENSES TAB */}
      {activeTab === "office_expenses" && (
        <div className="space-y-3 md:space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Office Expenses Table */}
            <Card className="flex-1 rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5">Description</th>
                      <th className="px-3.5 py-2.5">Vendor / Paid To</th>
                      <th className="px-3.5 py-2.5">Paid By</th>
                      <th className="px-3.5 py-2.5 text-right">Amount (₹)</th>
                      <th className="px-3.5 py-2.5">Payment Mode</th>
                      <th className="px-3.5 py-2.5">Receipt / Invoice</th>
                      <th className="px-3.5 py-2.5">Trip (Optional)</th>
                      <th className="px-3.5 py-2.5">Added By</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officeExpensesRows.length > 0 ? officeExpensesRows.map((row, idx) => {
                      const Icon = row.icon || CreditCard;
                      return (
                        <tr
                          key={idx}
                          className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-slate-500 font-medium whitespace-nowrap">
                            {row.date}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                              <span
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-slate-100",
                                  row.iconColor,
                                )}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </span>
                              {row.cat}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-650 font-semibold">
                            {row.desc}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600 font-semibold">
                            {row.vendor}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500 font-medium">
                            {row.account}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-slate-800">
                            {row.amount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500 font-semibold">
                            {row.mode}
                          </td>
                          <td className="px-3.5 py-2.5">
                            {row.rec !== "—" ? (
                              <span className="inline-flex items-center gap-1 text-red-500 hover:underline cursor-pointer font-bold">
                                <FileText className="w-3.5 h-3.5" /> {row.rec}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-450">
                            {row.trip}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500 font-medium">
                            {row.addedBy}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <button className="p-1 hover:bg-slate-50 rounded text-slate-400 border border-slate-100">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={11} className="px-4 py-10 text-center text-slate-400 text-xs font-semibold">
                          No office expenses recorded for this period. Click <span className="text-[#F97316] font-bold">+ Add Payment</span> to log one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Right: Sidebar widgets */}
            <div className="w-full lg:w-80 space-y-6 shrink-0">
              {/* Expense Summary */}
              <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-3.5">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Expense Summary
                  </h3>
                </div>
                <div className="space-y-2.5 text-xs font-bold text-slate-650">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">
                      Total Expenses
                    </span>
                    <span className="text-slate-800 font-black">₹ 0.00</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">
                      This Month
                    </span>
                    <span className="text-slate-800 font-black">₹ 0.00</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">
                      Last Month
                    </span>
                    <span className="text-slate-800 font-black">₹ 0.00</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">
                      This Week
                    </span>
                    <span className="text-slate-800 font-black">₹ 0.00</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">
                      Yesterday
                    </span>
                    <span className="text-slate-800 font-black">₹ 0.00</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">Today</span>
                    <span className="text-slate-800 font-black">₹ 0.00</span>
                  </div>
                </div>
              </Card>

              {/* Top Categories Donut Chart */}
              <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">
                  Top Categories{" "}
                  <span className="text-slate-400 text-[10px] font-normal normal-case ml-1">
                    (This Month)
                  </span>
                </h3>

                <div className="flex items-center justify-center h-[130px] relative my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: "No Data", value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#8B5CF6" />
                        <Cell fill="#F59E0B" />
                        <Cell fill="#10B981" />
                        <Cell fill="#6B7280" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[11px] font-black text-slate-800">
                      ₹ 0.00
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      Total
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] font-semibold text-slate-650 flex items-center justify-center h-24 text-slate-400">
                  No categories to display
                </div>
              </Card>

              {/* Recent Expenses */}
              <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Recent Expenses
                  </h3>
                  <button className="text-[10px] font-bold text-[#F97316] hover:underline">
                    View All
                  </button>
                </div>
                <div className="space-y-3.5 text-xs font-semibold">
                  {[
                    {
                      name: "Electricity Bill - Office",
                      amount: 8450,
                      date: "03 Jul 2024",
                    },
                    {
                      name: "Office Rent - July 2024",
                      amount: 50000,
                      date: "03 Jul 2024",
                    },
                    {
                      name: "Facebook Ads - June",
                      amount: 12375.6,
                      date: "02 Jul 2024",
                    },
                    {
                      name: "Internet Bill - July 2024",
                      amount: 1299,
                      date: "03 Jul 2024",
                    },
                  ].map((expense, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">
                          {expense.name}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          {expense.date}
                        </span>
                      </div>
                      <span className="font-black text-slate-800">
                        ₹ {expense.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTIONS TAB (UNIFIED FINANCIAL LOG) */}
      {activeTab === "transactions" && (
        <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Transactions
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                All your money in and out, in one place
              </p>
            </div>

            {/* Toolbar Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions..."
                  className="h-8 pl-8 text-xs rounded-[4px] border-slate-200 bg-white"
                />
              </div>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger className="h-8 text-xs w-28 bg-white border-slate-200 rounded-[4px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">Type</th>
                  <th className="px-3.5 py-2.5">Particulars</th>
                  <th className="px-3.5 py-2.5">Trip / Reference</th>
                  <th className="px-3.5 py-2.5">Account</th>
                  <th className="px-3.5 py-2.5">Payment Mode</th>
                  <th className="px-3.5 py-2.5 text-right">Income (₹)</th>
                  <th className="px-3.5 py-2.5 text-right">Expense (₹)</th>
                  <th className="px-3.5 py-2.5 text-right">Balance (₹)</th>
                  <th className="px-3.5 py-2.5">Category</th>
                  <th className="px-3.5 py-2.5">Added By</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedTransactions).map((dateHeader) => (
                  <Fragment key={dateHeader}>
                    {/* Day Section Header Row */}
                    <tr className="bg-slate-50/80 font-bold text-slate-600 border-b border-slate-100">
                      <td
                        colSpan={12}
                        className="px-3.5 py-2 text-[10px] uppercase tracking-wide"
                      >
                        {dateHeader}
                      </td>
                    </tr>
                    {groupedTransactions[dateHeader].map((t, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors"
                      >
                        <td className="px-3.5 py-2.5 text-slate-500 font-medium">
                          {t.date}{" "}
                          <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                            {t.time || "10:20 AM"}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[2px]",
                              t.type === "Income"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-500",
                            )}
                          >
                            {t.type === "Income" ? (
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            ) : (
                              <ArrowDownRight className="w-2.5 h-2.5" />
                            )}
                            {t.type}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">
                              {t.particulars}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                              {t.subParticulars || "Transfer"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 font-semibold">
                          {t.reference}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 font-semibold">
                          {t.account}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 font-semibold">
                          {t.mode}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">
                          {t.inflow > 0
                            ? t.inflow.toLocaleString("en-IN")
                            : "—"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-red-500">
                          {t.outflow > 0
                            ? t.outflow.toLocaleString("en-IN")
                            : "—"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-slate-700">
                          ₹ {t.balance.toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1.5">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                t.categoryColor || "bg-blue-500",
                              )}
                            />
                            {t.category}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 font-semibold">
                          {t.addedBy}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                toast.success("Receipt downloaded successfully")
                              }
                              className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors border border-slate-100"
                              title="Download Receipt"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (t.originalEntry) {
                                  setHistoryDialog({
                                    open: true,
                                    entry: t.originalEntry,
                                  });
                                } else {
                                  toast.error(
                                    "Details not available for this record",
                                  );
                                }
                              }}
                              className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors border border-slate-100"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 mt-2 gap-4 text-xs font-bold text-slate-700">
            <div>Total Transactions: {rawTransactions.length}</div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Total Income
                </span>
                <span className="text-emerald-500 font-black text-sm">
                  ₹{" "}
                  {rawTransactions
                    .filter((t) => t.type === "Income")
                    .reduce((sum, t) => sum + t.inflow, 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Total Expense
                </span>
                <span className="text-red-500 font-black text-sm">
                  ₹{" "}
                  {rawTransactions
                    .filter((t) => t.type === "Expense")
                    .reduce((sum, t) => sum + t.outflow, 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Net Flow
                </span>
                <span
                  className={cn(
                    "font-black text-sm",
                    rawTransactions
                      .filter((t) => t.type === "Income")
                      .reduce((sum, t) => sum + t.inflow, 0) -
                      rawTransactions
                        .filter((t) => t.type === "Expense")
                        .reduce((sum, t) => sum + t.outflow, 0) >=
                      0
                      ? "text-emerald-500"
                      : "text-red-500",
                  )}
                >
                  ₹{" "}
                  {(
                    rawTransactions
                      .filter((t) => t.type === "Income")
                      .reduce((sum, t) => sum + t.inflow, 0) -
                    rawTransactions
                      .filter((t) => t.type === "Expense")
                      .reduce((sum, t) => sum + t.outflow, 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* PAYMENTS TAB (CUSTOMER LEDGER LIST) */}
      {activeTab === "payments" && (
        <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between shadow-none p-0 bg-transparent">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search booking / customer / trip…"
                className="h-8 pl-8 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger className="h-8 text-xs w-36 rounded-[4px] border-[#E2E8F0]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fMode} onValueChange={setFMode}>
                <SelectTrigger className="h-8 text-xs w-36 rounded-[4px] border-[#E2E8F0]">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="ALL">All Modes</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Guest / Trip</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mergedEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/admin/bookings?id=${entry.booking?.id || entry.booking?.bookingId || entry.bookingId}`,
                          )
                        }
                        className="font-mono text-orange-600 hover:text-orange-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        title="Open Booking Workspace"
                      >
                        #{entry.booking?.bookingId || entry.bookingId}
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col text-slate-800 font-bold">
                        <span>{entry.booking?.fullName}</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                          {entry.booking?.tripName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      ₹{entry.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-550">
                      {MODE_LABELS[entry.paymentMode] || entry.paymentMode}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border",
                          entry.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                            : entry.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border-amber-250"
                              : "bg-red-50 text-red-750 border-red-250",
                        )}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openHistory(entry)}
                          className="h-7 px-2 border border-slate-100 hover:bg-slate-50 rounded-[4px]"
                        >
                          <History className="w-3.5 h-3.5" />
                        </Button>
                        {entry.status === "PENDING" && canApprove && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(entry.id)}
                              className="h-7 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px]"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setRejectDialog({
                                  open: true,
                                  entryId: entry.id,
                                })
                              }
                              className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-[4px]"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PROFIT & LOSS TAB */}
      {activeTab === "profit_loss" && (
        <div className="space-y-3 md:space-y-6">
          {/* Metrics Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3.5">
            {[
              {
                label: "Total Revenue",
                val: plRevenue.toLocaleString("en-IN"),
                sub: `Collected from bookings in period`,
                type: "neutral",
              },
              {
                label: "Total Direct Cost",
                val: plDirectCost.toLocaleString("en-IN"),
                sub: `Vendor & trip expenses`,
                type: "neutral",
              },
              {
                label: "Gross Profit",
                val: plGrossProfit.toLocaleString("en-IN"),
                sub: `Gross Margin: ${plGrossMargin}%`,
                type: "neutral",
              },
              {
                label: "Total Operating Expense",
                val: plOperatingCost.toLocaleString("en-IN"),
                sub: `Office & overhead costs`,
                type: "neutral",
              },
              {
                label: "Net Profit",
                val: plNetProfit.toLocaleString("en-IN"),
                sub: `Net Margin: ${plNetMargin}%`,
                type: plNetProfit >= 0 ? "up" : "down",
              },
            ].map((card, i) => (
              <Card
                key={i}
                className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-4 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-w-0"
              >
                <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                  {card.label}
                </div>
                <div
                  title={`₹ ${card.val}`}
                  className="text-base md:text-lg font-black text-slate-800 mt-1 md:mt-2 tabular-nums truncate"
                >
                  ₹ {card.val}
                </div>
                {card.sub && (
                  <div className="text-[9.5px] text-slate-450 font-bold mt-1 truncate">
                    {card.sub}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Income Statement Detailed breakdown row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-6">
            {/* Income Card */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm flex flex-col justify-between min-h-[350px]">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2">
                  Income
                </h3>
                <div className="mt-3.5 space-y-3 text-[11.5px] font-semibold text-slate-650">
                  {[
                    {
                      p: "Booking Revenue",
                      a: plBookingRev.toLocaleString("en-IN"),
                    },
                    {
                      p: "Other Income",
                      a: plOtherRev.toLocaleString("en-IN"),
                    },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <span>{row.p}</span>
                      <span className="text-slate-800 font-bold">
                        ₹ {row.a}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-3 mt-4 text-xs font-black text-slate-850">
                <span className="text-emerald-650">Total Income</span>
                <span className="text-emerald-650">
                  ₹ {plRevenue.toLocaleString("en-IN")}
                </span>
              </div>
            </Card>

            {/* Direct Trip Expenses Card */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm flex flex-col justify-between min-h-[350px]">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2">
                  Direct Trip Expenses (Cost of Sales)
                </h3>
                <div className="mt-3.5 space-y-3 text-[11.5px] font-semibold text-slate-650">
                  {[
                    { p: "Hotels", a: plHotelCost.toLocaleString("en-IN") },
                    {
                      p: "Tempo / Transport",
                      a: plTransportCost.toLocaleString("en-IN"),
                    },
                    {
                      p: "Vendor Activities",
                      a: plActivityCost.toLocaleString("en-IN"),
                    },
                    {
                      p: "Guide Charges",
                      a: plGuideCost.toLocaleString("en-IN"),
                    },
                    {
                      p: "Misc. Trip Expenses",
                      a: plMiscDirectCost.toLocaleString("en-IN"),
                    },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <span>{row.p}</span>
                      <span className="text-slate-800 font-bold">
                        ₹ {row.a}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-3 mt-4 text-xs font-black text-slate-850">
                <span className="text-red-500">Total Direct Cost</span>
                <span className="text-red-500">
                  ₹ {plDirectCost.toLocaleString("en-IN")}
                </span>
              </div>
            </Card>

            {/* Office & Operating Expenses Card */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm flex flex-col justify-between min-h-[350px]">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2">
                  Office & Operating Expenses
                </h3>
                <div className="mt-3.5 space-y-3 text-[11.5px] font-semibold text-slate-650">
                  {[
                    {
                      p: "Salaries",
                      a: plSalariesCost.toLocaleString("en-IN"),
                    },
                    { p: "Office Rent", a: plRentCost.toLocaleString("en-IN") },
                    {
                      p: "Electricity & Utilities",
                      a: plUtilitiesCost.toLocaleString("en-IN"),
                    },
                    {
                      p: "Miscellaneous",
                      a: plMiscOperatingCost.toLocaleString("en-IN"),
                    },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <span>{row.p}</span>
                      <span className="text-slate-800 font-bold">
                        ₹ {row.a}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-3 mt-4 text-xs font-black text-slate-855">
                <span className="text-amber-600">Total Operating Expenses</span>
                <span className="text-amber-600">
                  ₹ {plOperatingCost.toLocaleString("en-IN")}
                </span>
              </div>
            </Card>

            {/* Profit Summary & Charts Card */}
            <div className="space-y-3 md:space-y-6">
              <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2">
                  Profit Summary
                </h3>
                <div className="space-y-3.5 text-[11px] font-semibold text-slate-650">
                  <div className="flex justify-between items-center">
                    <span>Total Revenue</span>
                    <span className="font-bold text-slate-800">
                      ₹ {plRevenue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Less: Total Direct Cost</span>
                    <span className="font-bold text-slate-850">
                      - ₹ {plDirectCost.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2.5 font-bold text-blue-600">
                    <span>Gross Profit</span>
                    <span>₹ {plGrossProfit.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pl-2">
                    <span>Less: Operating Expenses</span>
                    <span>- ₹ {plOperatingCost.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2.5 font-extrabold text-emerald-650 text-xs">
                    <span>Net Profit</span>
                    <span>₹ {plNetProfit.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] text-slate-500 font-bold">
                    <span>Net Profit Margin</span>
                    <span>{plNetMargin}%</span>
                  </div>
                </div>
              </Card>

              {/* Revenue vs Expenses Trend Chart */}
              <Card className="rounded-[4px] border border-[#E2E8F0] p-4 bg-white shadow-sm space-y-2">
                <h4 className="text-[10.5px] font-black text-slate-800 uppercase tracking-wide">
                  Revenue vs Expenses Trend
                </h4>
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={8} stroke="#94a3b8" />
                      <YAxis fontSize={8} stroke="#94a3b8" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="Collection"
                        stroke="#10B981"
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Vendor Payments"
                        stroke="#EF4444"
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>

          {/* Monthly Comparison and Profitable Trips Register Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-6">
            {/* Monthly Comparison */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2">
                Monthly Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-2">Month</th>
                      <th className="pb-2 text-right">Revenue (₹)</th>
                      <th className="pb-2 text-right">Direct Cost (₹)</th>
                      <th className="pb-2 text-right">Op. Expenses (₹)</th>
                      <th className="pb-2 text-right">Net Profit (₹)</th>
                      <th className="pb-2 text-right">Margin (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      {
                        m: "Jul 2024",
                        r: plRevenue.toLocaleString("en-IN"),
                        c: plDirectCost.toLocaleString("en-IN"),
                        e: plOperatingCost.toLocaleString("en-IN"),
                        p: plNetProfit.toLocaleString("en-IN"),
                        pct: `${plNetMargin}%`,
                      },
                      {
                        m: "Jun 2024",
                        r: "0",
                        c: "0",
                        e: "0",
                        p: "0",
                        pct: "0%",
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 text-slate-800 font-bold">
                          {row.m}
                        </td>
                        <td className="py-2 text-right font-semibold text-slate-700">
                          {row.r}
                        </td>
                        <td className="py-2 text-right text-slate-550">
                          {row.c}
                        </td>
                        <td className="py-2 text-right text-slate-550">
                          {row.e}
                        </td>
                        <td className="py-2 text-right font-bold text-emerald-650">
                          {row.p}
                        </td>
                        <td className="py-2 text-right font-bold text-slate-650">
                          {row.pct}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Top Profitable Trips */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2">
                Top Profitable Trips{" "}
                <span className="text-slate-400 text-[10px] font-normal normal-case ml-1">
                  (This Period)
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-2">Trip / Departure</th>
                      <th className="pb-2 text-right">Revenue (₹)</th>
                      <th className="pb-2 text-right">Cost (₹)</th>
                      <th className="pb-2 text-right">Profit (₹)</th>
                      <th className="pb-2 text-right">Margin (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {topProfitableTrips.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-slate-400 italic"
                        >
                          No trip profitability data available.
                        </td>
                      </tr>
                    ) : (
                      topProfitableTrips.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 text-slate-800 font-bold">
                            {row.name}
                          </td>
                          <td className="py-2 text-right font-semibold text-slate-700">
                            {row.revenue.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 text-right text-slate-550">
                            {row.cost.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 text-right font-bold text-emerald-650">
                            {row.profit.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 text-right font-bold text-emerald-700">
                            {row.pct}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Loss Making Trips */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2">
                Loss Making Trips{" "}
                <span className="text-slate-400 text-[10px] font-normal normal-case ml-1">
                  (This Period)
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-2">Trip / Departure</th>
                      <th className="pb-2 text-right">Loss (₹)</th>
                      <th className="pb-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lossMakingTrips.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center py-8 text-slate-400 italic"
                        >
                          No loss-making departures this period.
                        </td>
                      </tr>
                    ) : (
                      lossMakingTrips.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 text-slate-800 font-bold">
                            {row.name}
                          </td>
                          <td className="py-2 text-right font-bold text-red-600">
                            {row.profit.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 text-slate-550 text-[10px] pl-3">
                            Operating Under Budget
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Net Profit Donut Chart Widget */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm flex flex-col justify-between">
              <h4 className="text-[10.5px] font-black text-slate-800 uppercase tracking-wide">
                Monthly Net Profit
              </h4>
              <div className="h-[140px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={horizontalBarsData.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={8} stroke="#94a3b8" />
                    <YAxis fontSize={8} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Refund Summary, Adjustments, Other Income, Notes Footer Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-6">
            {/* Refund Summary */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-orange-500" /> Refund
                Summary
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-[10.5px] font-bold text-slate-500">
                <div className="p-2 bg-slate-50 rounded-[4px]">
                  <p className="text-slate-400 text-[8px] uppercase">
                    Total Refunds
                  </p>
                  <p className="text-slate-800 text-xs font-extrabold mt-1">
                    ₹ {totalRefundsSum.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-2 bg-emerald-50/50 rounded-[4px]">
                  <p className="text-emerald-700 text-[8px] uppercase">
                    Completed
                  </p>
                  <p className="text-emerald-700 text-xs font-extrabold mt-1">
                    ₹ {completedRefundsSum.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-2 bg-amber-50/50 rounded-[4px]">
                  <p className="text-amber-700 text-[8px] uppercase">Pending</p>
                  <p className="text-amber-700 text-xs font-extrabold mt-1">
                    ₹ {pendingRefundsSum.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </Card>

            {/* Adjustments */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-500" /> Adjustments
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-[10.5px] font-bold text-slate-500">
                <div className="p-2 bg-slate-50 rounded-[4px]">
                  <p className="text-slate-400 text-[8px] uppercase">
                    Total Adj.
                  </p>
                  <p className="text-slate-800 text-xs font-extrabold mt-1">
                    ₹ 15,600
                  </p>
                </div>
                <div className="p-2 bg-emerald-50/50 rounded-[4px]">
                  <p className="text-emerald-700 text-[8px] uppercase">
                    Credit Notes
                  </p>
                  <p className="text-emerald-700 text-xs font-extrabold mt-1">
                    ₹ 10,600
                  </p>
                </div>
                <div className="p-2 bg-red-50/50 rounded-[4px]">
                  <p className="text-red-700 text-[8px] uppercase">
                    Debit Notes
                  </p>
                  <p className="text-red-700 text-xs font-extrabold mt-1">
                    ₹ 5,000
                  </p>
                </div>
              </div>
            </Card>

            {/* Other Income */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Other
                Income
              </h3>
              <div className="grid grid-cols-2 gap-2 text-center text-[10.5px] font-bold text-slate-500">
                <div className="p-2 bg-slate-50 rounded-[4px]">
                  <p className="text-slate-400 text-[8px] uppercase">
                    Total Other Inc.
                  </p>
                  <p className="text-slate-800 text-xs font-extrabold mt-1">
                    ₹ 3,000
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-[4px]">
                  <p className="text-slate-400 text-[8px] uppercase">
                    Misc. Income
                  </p>
                  <p className="text-slate-800 text-xs font-extrabold mt-1">
                    ₹ 3,000
                  </p>
                </div>
              </div>
            </Card>

            {/* Notes */}
            <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Notes
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                All figures are based on confirmed bookings and recorded
                expenses.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* TRIP PROFITABILITY TAB */}
      {activeTab === "trip_profitability" && (
        <Card className="rounded-xl md:rounded-[4px] border border-[#E2E8F0] p-3 md:p-5 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Trip-wise Profitability Register
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Trip Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Vendor Cost</th>
                  <th className="px-4 py-3 text-right">Train Ticket Cost</th>
                  <th className="px-4 py-3 text-right">Total Ops Cost</th>
                  <th className="px-4 py-3 text-right">Gross Profit</th>
                  <th className="px-4 py-3 text-right">Margin %</th>
                  <th className="px-4 py-3 text-right">Disbursed</th>
                  <th className="px-4 py-3 text-right">Pending Payables</th>
                </tr>
              </thead>
              <tbody>
                {tripProfitability.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-slate-550 font-medium">
                      {item.date}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      ₹{item.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-550">
                      ₹{(item.vendorCost || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                      ₹{(item.trainCost || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      ₹{item.cost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-500">
                      ₹{item.profit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">
                      {item.pct}%
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ₹{item.paid.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-500">
                      ₹{item.pending.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-3 md:space-y-6">
          {/* Popular Reports Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Popular Reports
              </h3>
              <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase">
                View All Reports →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-2 md:gap-3.5">
              {[
                {
                  label: "Profit & Loss Statement",
                  desc: "View income, expenses and net profit for a selected period.",
                  icon: <ClipboardCheck className="w-4 h-4 text-purple-650" />,
                  bg: "bg-purple-50/50",
                },
                {
                  label: "Cash Book Report",
                  desc: "Detailed report of all cash transactions.",
                  icon: <Building2 className="w-4 h-4 text-emerald-650" />,
                  bg: "bg-emerald-50/50",
                },
                {
                  label: "Bank Statement Report",
                  desc: "Transactions summary for all bank accounts.",
                  icon: <IndianRupee className="w-4 h-4 text-blue-650" />,
                  bg: "bg-blue-50/50",
                },
                {
                  label: "Vendor Payment Report",
                  desc: "Outstanding, paid and overpaid to vendors.",
                  icon: <Truck className="w-4 h-4 text-amber-650" />,
                  bg: "bg-amber-50/50",
                },
                {
                  label: "Expense Report",
                  desc: "All office and operational expenses summary.",
                  icon: <CreditCard className="w-4 h-4 text-indigo-650" />,
                  bg: "bg-indigo-50/50",
                },
                {
                  label: "Booking Revenue Report",
                  desc: "Revenue summary by bookings and departures.",
                  icon: <FileText className="w-4 h-4 text-pink-650" />,
                  bg: "bg-pink-50/50",
                },
              ].map((r, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E2E8F0] rounded-xl md:rounded-[6px] p-3 md:p-4 shadow-3xs flex flex-col justify-between min-h-[110px] md:min-h-[140px] hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <div>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center mb-3",
                        r.bg,
                      )}
                    >
                      {r.icon}
                    </div>
                    <p className="font-extrabold text-slate-800 text-[11.5px] leading-tight">
                      {r.label}
                    </p>
                    <p className="text-[9.5px] text-slate-450 font-medium mt-1.5 leading-normal">
                      {r.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-3.5 items-center">
            <div className="flex flex-col gap-1 w-44">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                Date Range
              </span>
              <Input
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-8.5 text-[11px] rounded-[4px] border-slate-200 bg-white text-slate-700 font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1 w-44">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                Report Type
              </span>
              <select className="h-8.5 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Reports</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 w-44">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                Group By
              </span>
              <select className="h-8.5 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>Select</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 w-44">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                Compare With (Optional)
              </span>
              <select className="h-8.5 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>Select</option>
              </select>
            </div>

            <button className="h-8.5 text-[11px] font-bold border border-slate-200 rounded-[4px] px-4 bg-white hover:bg-slate-50 text-slate-755 flex items-center gap-1.5 ml-auto self-end shadow-3xs">
              <Filter className="w-3.5 h-3.5 text-slate-455" /> Apply Filters
            </button>
          </div>

          {/* All Reports list */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              All Reports
            </h3>
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">
                    <th className="p-3 border-r border-slate-100 w-12 text-center"></th>
                    <th className="p-3 border-r border-slate-100 w-[24%]">
                      REPORT NAME
                    </th>
                    <th className="p-3 border-r border-slate-100 w-[26%]">
                      DESCRIPTION
                    </th>
                    <th className="p-3 border-r border-slate-100">PERIOD</th>
                    <th className="p-3 border-r border-slate-100">
                      GENERATED ON
                    </th>
                    <th className="p-3 border-r border-slate-100">
                      GENERATED BY
                    </th>
                    <th className="p-3 border-r border-slate-100 w-20">
                      FORMAT
                    </th>
                    <th className="p-3 text-center w-28">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {[
                    {
                      name: "Profit & Loss Statement",
                      desc: "Income, expenses and net profit summary",
                      per: "01 Jul 2024 - 03 Jul 2024",
                      on: "03 Jul 2024 10:45 AM",
                      by: "Hemal Patel",
                      fmt: "PDF",
                      fmtClass: "text-red-600 bg-red-50 border-red-100",
                      icon: (
                        <ClipboardCheck className="w-4 h-4 text-purple-600" />
                      ),
                    },
                    {
                      name: "Cash Book Report",
                      desc: "All cash in and cash out transactions",
                      per: "01 Jul 2024 - 03 Jul 2024",
                      on: "03 Jul 2024 10:30 AM",
                      by: "Suresh Bhai",
                      fmt: "Excel",
                      fmtClass:
                        "text-emerald-700 bg-emerald-50 border-emerald-100",
                      icon: <Building2 className="w-4 h-4 text-emerald-600" />,
                    },
                    {
                      name: "Bank Statement Report",
                      desc: "Bank transactions summary",
                      per: "01 Jul 2024 - 03 Jul 2024",
                      on: "03 Jul 2024 10:15 AM",
                      by: "Suresh Bhai",
                      fmt: "PDF",
                      fmtClass: "text-red-600 bg-red-50 border-red-100",
                      icon: <IndianRupee className="w-4 h-4 text-blue-600" />,
                    },
                    {
                      name: "Vendor Payment Report",
                      desc: "Outstanding, paid and overpaid summary",
                      per: "01 Jul 2024 - 03 Jul 2024",
                      on: "03 Jul 2024 09:50 AM",
                      by: "Parth Parmar",
                      fmt: "Excel",
                      fmtClass:
                        "text-emerald-700 bg-emerald-50 border-emerald-100",
                      icon: <Truck className="w-4 h-4 text-amber-600" />,
                    },
                    {
                      name: "Office Expense Report",
                      desc: "All office and operational expenses",
                      per: "01 Jul 2024 - 03 Jul 2024",
                      on: "03 Jul 2024 09:40 AM",
                      by: "Neeki Sharma",
                      fmt: "Excel",
                      fmtClass:
                        "text-emerald-700 bg-emerald-50 border-emerald-100",
                      icon: <CreditCard className="w-4 h-4 text-indigo-600" />,
                    },
                    {
                      name: "Booking Revenue Report",
                      desc: "Revenue summary by bookings and departures",
                      per: "01 Jul 2024 - 03 Jul 2024",
                      on: "03 Jul 2024 09:20 AM",
                      by: "Hemal Patel",
                      fmt: "PDF",
                      fmtClass: "text-red-600 bg-red-50 border-red-100",
                      icon: <FileText className="w-4 h-4 text-pink-600" />,
                    },
                    {
                      name: "Trip Profitability Report",
                      desc: "Profitability by trips and departures",
                      per: "01 Jul 2024 - 03 Jul 2024",
                      on: "03 Jul 2024 09:10 AM",
                      by: "Hemal Patel",
                      fmt: "Excel",
                      fmtClass:
                        "text-emerald-700 bg-emerald-50 border-emerald-100",
                      icon: <Compass className="w-4 h-4 text-cyan-600" />,
                    },
                    {
                      name: "TDS / Tax Summary",
                      desc: "TDS deducted and tax summary report",
                      per: "01 Jul 2024 - 03 Jul 2024",
                      on: "03 Jul 2024 08:50 AM",
                      by: "Suresh Bhai",
                      fmt: "PDF",
                      fmtClass: "text-red-600 bg-red-50 border-red-100",
                      icon: <Sliders className="w-4 h-4 text-amber-600" />,
                    },
                    {
                      name: "Payment Collection Report",
                      desc: "Customer payments collection summary",
                      per: "01 Jul 2024 - 03 Jul 2024",
                      on: "03 Jul 2024 08:35 AM",
                      by: "Suresh Bhai",
                      fmt: "Excel",
                      fmtClass:
                        "text-emerald-700 bg-emerald-50 border-emerald-100",
                      icon: <Users className="w-4 h-4 text-emerald-600" />,
                    },
                    {
                      name: "Account Summary Report",
                      desc: "All accounts summary report",
                      per: "01 Jul 2024 - 03 Jul 2024",
                      on: "03 Jul 2024 08:20 AM",
                      by: "Hemal Patel",
                      fmt: "PDF",
                      fmtClass: "text-red-600 bg-red-50 border-red-100",
                      icon: <Building2 className="w-4 h-4 text-purple-650" />,
                    },
                  ].map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3 text-center border-r border-slate-100">
                        {row.icon}
                      </td>
                      <td className="p-3 border-r border-slate-100 font-bold text-slate-800">
                        {row.name}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-slate-550 font-medium">
                        {row.desc}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-slate-600 font-semibold">
                        {row.per}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-slate-500 font-medium">
                        {row.on}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-slate-600 font-bold">
                        {row.by}
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <span
                          className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-[3px] border block w-fit tracking-wider",
                            row.fmtClass,
                          )}
                        >
                          {row.fmt}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button className="h-7 w-7 text-slate-400 hover:bg-slate-50 rounded flex items-center justify-center border border-slate-150">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="h-7 w-7 text-slate-400 hover:bg-slate-50 rounded flex items-center justify-center border border-slate-150">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom summary bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-3 flex items-center justify-between text-xs font-semibold">
              <span>Showing 1 to 10 of 28 reports</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Show</span>
                <select className="h-7 text-[10px] font-bold border border-slate-200 bg-white rounded px-1 cursor-pointer">
                  <option>10</option>
                </select>
                <span className="text-slate-400">per page</span>
              </div>
            </div>

            {/* Custom Report Builder Banner */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-[6px] p-4 flex items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-[12.5px]">
                    Need something specific?
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Use Custom Report Builder to create reports exactly how you
                    want.
                  </p>
                </div>
              </div>
              <button className="h-8.5 text-[11px] font-bold border border-slate-200 rounded-[4px] px-4 bg-white hover:bg-slate-50 text-slate-755 flex items-center gap-1 shadow-3xs">
                Open Report Builder <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS & DIALOGS --- */}

      {/* Create Payment Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-[4px] border border-slate-200 bg-white p-5 shadow-md">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-sm font-bold uppercase tracking-tight text-slate-800">
              Add Collection Entry
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-semibold mt-1">
              Log a new traveler payment collection for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Select Booking
              </label>
              <Select
                value={form.bookingId}
                onValueChange={(val) => setForm({ ...form, bookingId: val })}
              >
                <SelectTrigger className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]">
                  <SelectValue placeholder="Select Booking" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px] max-h-60">
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.bookingId}>
                      {b.fullName || b.name} ({b.bookingId}) - {b.tripName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(() => {
                const selectedB = bookings.find(
                  (b) => b.bookingId === form.bookingId || b.id === form.bookingId,
                );
                if (!selectedB) return null;
                const total = Number(
                  selectedB.totalAmount || selectedB.totalPrice || 0,
                );
                const paid = Number(
                  selectedB.advancePaid || selectedB.advance || 0,
                );
                const rem = Math.max(0, total - paid);

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1.5 text-xs mt-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">
                        {selectedB.fullName || selectedB.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {selectedB.phone || selectedB.mobile || "No phone"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      Trip: <strong>{selectedB.tripName || "Trip"}</strong>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-center text-[10px]">
                      <div className="bg-white p-1 rounded border border-slate-100">
                        <div className="text-slate-400 font-bold">TOTAL</div>
                        <div className="font-mono font-bold text-slate-800">
                          ₹{total.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white p-1 rounded border border-slate-100">
                        <div className="text-emerald-600 font-bold">PAID</div>
                        <div className="font-mono font-bold text-emerald-700">
                          ₹{paid.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white p-1 rounded border border-slate-100">
                        <div className="text-amber-600 font-bold">DUE</div>
                        <div className="font-mono font-bold text-amber-700">
                          ₹{rem.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {rem > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, amount: String(rem) }))
                        }
                        className="w-full text-center text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 py-1 rounded transition-colors"
                      >
                        Autofill Due Balance (₹{rem.toLocaleString()})
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Amount (₹)
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Payment Mode
              </label>
              <Select
                value={form.paymentMode}
                onValueChange={(val) => setForm({ ...form, paymentMode: val })}
              >
                <SelectTrigger className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Reference Number (Optional)
              </label>
              <Input
                placeholder="e.g. UPI transaction ID / Bank Ref"
                value={form.referenceNumber}
                onChange={(e) =>
                  setForm({ ...form, referenceNumber: e.target.value })
                }
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Internal Notes
              </label>
              <Textarea
                placeholder="e.g. Paid in cash during briefing..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="text-xs rounded-[4px] border-[#E2E8F0]"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-[#E2E8F0]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreate(false)}
              className="h-8.5 px-4 rounded-[4px] font-semibold text-xs border border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white"
            >
              {creating ? "Saving..." : "Submit Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          setRejectDialog({ open, entryId: open ? rejectDialog.entryId : "" })
        }
      >
        <DialogContent className="max-w-md bg-white rounded-[4px] p-5 shadow-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">
              Reject Collection Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide a reason for rejecting this payment record.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Textarea
              placeholder="e.g. Amount mismatch / Incorrect transaction ID reference"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs rounded-[4px]"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialog({ open: false, entryId: "" })}
              className="h-8 rounded-[4px] border border-slate-200"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={rejecting}
              className="h-8 rounded-[4px]"
            >
              {rejecting ? "Rejecting..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={historyDialog.open}
        onOpenChange={(open) =>
          setHistoryDialog({ open, entry: open ? historyDialog.entry : null })
        }
      >
        <DialogContent className="max-w-md bg-white rounded-[4px] p-5 shadow-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">
              Audit History
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {historyDialog.entry?.history?.length > 0 ? (
              historyDialog.entry.history.map((h: any) => (
                <div
                  key={h.id}
                  className="text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0 space-y-1"
                >
                  <div className="flex justify-between items-center text-slate-500 font-semibold">
                    <span>{h.actor?.name || "System"}</span>
                    <span>{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-800 font-bold">{h.action}</p>
                  {h.notes && (
                    <p className="text-slate-550 italic">{h.notes}</p>
                  )}
                </div>
              ))
            ) : (
              // Fallback if no robust log array is returned from backend
              <>
                <div className="text-xs border-b border-slate-100 pb-2 space-y-1">
                  <div className="flex justify-between items-center text-slate-500 font-semibold">
                    <span>
                      {historyDialog.entry?.salesperson?.name ||
                        historyDialog.entry?.actionedBy?.name ||
                        "System Actor"}
                    </span>
                    <span>
                      {new Date(
                        historyDialog.entry?.createdAt || Date.now(),
                      ).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-800 font-bold">
                    Transaction Recorded
                  </p>
                  <p className="text-slate-550 italic">
                    Initial record created in the ledger.
                  </p>
                </div>
                {historyDialog.entry?.updatedAt &&
                  historyDialog.entry?.updatedAt !==
                    historyDialog.entry?.createdAt && (
                    <div className="text-xs pb-2 space-y-1 mt-2">
                      <div className="flex justify-between items-center text-slate-500 font-semibold">
                        <span>
                          {historyDialog.entry?.actionedBy?.name ||
                            "Finance Operations"}
                        </span>
                        <span>
                          {new Date(
                            historyDialog.entry.updatedAt,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-800 font-bold">Status Updated</p>
                      <p className="text-slate-550 italic">
                        Moved to {historyDialog.entry.status || "Processed"}
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryDialog({ open: false, entry: null })}
              className="h-8 rounded-[4px] border border-slate-200 w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Outgoing Vendor Payment Allocation Modal */}
      <Dialog
        open={vendorPayDialog.open}
        onOpenChange={(open) =>
          setVendorPayDialog({
            open,
            assignment: open ? vendorPayDialog.assignment : null,
          })
        }
      >
        <DialogContent className="max-w-md bg-white rounded-[4px] p-5 shadow-md">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-sm font-bold uppercase tracking-tight text-slate-800">
              Record Vendor Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-semibold mt-1">
              Disburse vendor payments and record allocation details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordVendorPayment} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Vendor
              </label>
              <Input
                readOnly
                value={
                  typeof vendorPayDialog.assignment?.vendorId === "object"
                    ? vendorPayDialog.assignment.vendorId.name
                    : "Vendor"
                }
                className="h-8.5 text-xs bg-slate-50 border-[#E2E8F0] rounded-[4px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Total Due (₹)
                </label>
                <Input
                  readOnly
                  value={
                    vendorPayDialog.assignment
                      ? vendorPayDialog.assignment.totalAmount -
                        (vendorPayDialog.assignment.paidAmount || 0)
                      : 0
                  }
                  className="h-8.5 text-xs bg-slate-50 border-[#E2E8F0] rounded-[4px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Amount Paid (₹)
                </label>
                <Input
                  type="number"
                  value={outgoingForm.paidAmount}
                  onChange={(e) =>
                    setOutgoingForm({
                      ...outgoingForm,
                      paidAmount: Number(e.target.value),
                    })
                  }
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Disbursement Status
              </label>
              <Select
                value={outgoingForm.paymentStatus}
                onValueChange={(val) =>
                  setOutgoingForm({ ...outgoingForm, paymentStatus: val })
                }
              >
                <SelectTrigger className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="paid">Fully Settled</SelectItem>
                  <SelectItem value="partial">Partially Paid</SelectItem>
                  <SelectItem value="pending">Pending Settle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Payment Mode
              </label>
              <Select
                value={outgoingForm.outgoingPaymentMode}
                onValueChange={(val) =>
                  setOutgoingForm({ ...outgoingForm, outgoingPaymentMode: val })
                }
              >
                <SelectTrigger className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="CASH">Cash Drawer</SelectItem>
                  <SelectItem value="ONLINE">
                    Bank Transfer (UPI/IMPS)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {outgoingForm.outgoingPaymentMode === "ONLINE" ? (
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Bank Account ID / Transaction Ref
                </label>
                <Input
                  placeholder="e.g. HDFC Current A/c Txn 99482"
                  value={outgoingForm.onlinePersonAccount}
                  onChange={(e) =>
                    setOutgoingForm({
                      ...outgoingForm,
                      onlinePersonAccount: e.target.value,
                    })
                  }
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Depositor Name
                  </label>
                  <Input
                    placeholder="e.g. Guide / Lead"
                    value={outgoingForm.cashDepositorName}
                    onChange={(e) =>
                      setOutgoingForm({
                        ...outgoingForm,
                        cashDepositorName: e.target.value,
                      })
                    }
                    className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Source Drawer
                  </label>
                  <Input
                    placeholder="e.g. Main Safe"
                    value={outgoingForm.depositAccountName}
                    onChange={(e) =>
                      setOutgoingForm({
                        ...outgoingForm,
                        depositAccountName: e.target.value,
                      })
                    }
                    className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Disbursement Notes
              </label>
              <Textarea
                placeholder="Details of receipt, cheque reference, or handovers..."
                value={outgoingForm.notes}
                onChange={(e) =>
                  setOutgoingForm({ ...outgoingForm, notes: e.target.value })
                }
                className="text-xs border-[#E2E8F0] rounded-[4px]"
                rows={2}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setVendorPayDialog({ open: false, assignment: null })
                }
                className="h-8.5 px-4 rounded-[4px] font-semibold text-xs border border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white"
              >
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Bank Account Modal */}
      <Dialog open={showEditBankModal} onOpenChange={setShowEditBankModal}>
        <DialogContent className="rounded-[4px] border-[#E2E8F0] p-6 bg-white shadow-lg max-w-md">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {editingBankIdx === -1 ? "Add New Bank Account" : "Edit Bank Details"}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {editingBankIdx === -1
                ? "Enter banking details to register a new bank account or cash drawer"
                : "Modify details for the selected bank account"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBank} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                Bank Name
              </label>
              <Input
                value={bankDetailsForm.name}
                onChange={(e) =>
                  setBankDetailsForm({
                    ...bankDetailsForm,
                    name: e.target.value,
                  })
                }
                className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                Account Nickname
              </label>
              <Input
                value={bankDetailsForm.nick}
                onChange={(e) =>
                  setBankDetailsForm({
                    ...bankDetailsForm,
                    nick: e.target.value,
                  })
                }
                className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  Account Number
                </label>
                <Input
                  value={bankDetailsForm.num}
                  onChange={(e) =>
                    setBankDetailsForm({
                      ...bankDetailsForm,
                      num: e.target.value,
                    })
                  }
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  IFSC Code
                </label>
                <Input
                  value={bankDetailsForm.ifsc}
                  onChange={(e) =>
                    setBankDetailsForm({
                      ...bankDetailsForm,
                      ifsc: e.target.value,
                    })
                  }
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  Branch
                </label>
                <Input
                  value={bankDetailsForm.branch}
                  onChange={(e) =>
                    setBankDetailsForm({
                      ...bankDetailsForm,
                      branch: e.target.value,
                    })
                  }
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-455">
                  Opening Balance
                </label>
                <Input
                  type="number"
                  value={bankDetailsForm.openBal}
                  onChange={(e) =>
                    setBankDetailsForm({
                      ...bankDetailsForm,
                      openBal: Number(e.target.value),
                    })
                  }
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                Account Holder
              </label>
              <Input
                value={bankDetailsForm.holder}
                onChange={(e) =>
                  setBankDetailsForm({
                    ...bankDetailsForm,
                    holder: e.target.value,
                  })
                }
                className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                required
              />
            </div>

            <DialogFooter className="pt-4 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEditBankModal(false)}
                className="h-8.5 px-4 rounded-[4px] font-semibold text-xs border border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Collection Account Detail Ledger Modal */}
      <Dialog open={showPersonDetailModal} onOpenChange={setShowPersonDetailModal}>
        <DialogContent className="rounded-[6px] border-[#E2E8F0] p-6 bg-white shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <div className="flex justify-between items-center pr-6">
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-extrabold text-slate-800">
                    {personDetailData?.employee?.name || selectedPersonForDetail?.accountName || selectedPersonForDetail?.name || "Collection Account Ledger"}
                  </DialogTitle>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    {personDetailData?.employee?.accountType || selectedPersonForDetail?.accountType || "ACCOUNT"}
                  </span>
                </div>
                <DialogDescription className="text-xs text-slate-400 font-semibold mt-0.5">
                  {personDetailData?.employee?.email || selectedPersonForDetail?.accountHolderName || selectedPersonForDetail?.email} · Collection & Transfer Ledger
                </DialogDescription>
              </div>
              <span
                className={cn(
                  "text-[10px] font-black px-2.5 py-1 rounded-[4px] uppercase tracking-wider",
                  (personDetailData?.summary?.status || selectedPersonForDetail?.status) === "SETTLED" ||
                    (personDetailData?.summary?.status || selectedPersonForDetail?.status) === "Settled"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-amber-50 text-amber-600 border border-amber-200",
                )}
              >
                {personDetailData?.summary?.status || selectedPersonForDetail?.status || "PENDING"}
              </span>
            </div>
          </DialogHeader>

          {loadingPersonDetail ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
              Loading collection ledger...
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {/* Summary Cards Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-[4px] p-3.5">
                  <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Total Collected</p>
                  <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                    ₹ {(personDetailData?.summary?.totalCollected || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-[4px] p-3.5">
                  <p className="text-[9.5px] font-bold text-emerald-600 uppercase tracking-wider">Total Transferred</p>
                  <p className="text-lg font-extrabold text-emerald-600 mt-0.5">
                    ₹ {(personDetailData?.summary?.totalSubmitted || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-amber-50/50 border border-amber-200/60 rounded-[4px] p-3.5">
                  <p className="text-[9.5px] font-bold text-amber-600 uppercase tracking-wider">Pending Balance</p>
                  <p className="text-lg font-extrabold text-amber-600 mt-0.5">
                    ₹ {(personDetailData?.summary?.pending || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Transactions Ledger
                </h4>
                <Button
                  size="sm"
                  onClick={() => handleOpenRecordSubmission(selectedPersonForDetail?.id)}
                  className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Record Fund Transfer to Company
                </Button>
              </div>

              {/* Collections Transactions Table */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Collection Receipts & Inflows ({personDetailData?.collectionTransactions?.length || 0})
                </h5>
                <div className="border border-slate-200 rounded-[4px] overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Booking ID</th>
                        <th className="p-2.5">Customer / Passenger</th>
                        <th className="p-2.5">Trip</th>
                        <th className="p-2.5">Mode</th>
                        <th className="p-2.5 text-right">Amount Collected</th>
                        <th className="p-2.5">Ref / Txn ID</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(personDetailData?.collectionTransactions || []).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-slate-400 text-xs">
                            No collection transactions recorded in this account
                          </td>
                        </tr>
                      ) : (
                        personDetailData.collectionTransactions.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-slate-500 whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="p-2.5 font-bold">
                              {tx.bookingDbId ? (
                                <Link
                                  to={`/admin/bookings/${tx.bookingDbId}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-bold"
                                  title="Open Booking 360 Workspace"
                                >
                                  #{tx.bookingId}
                                </Link>
                              ) : (
                                <span className="text-slate-800 font-bold">#{tx.bookingId}</span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-700 font-semibold">
                              <div>
                                <p>{tx.customerName}</p>
                                {tx.phone && tx.phone !== "N/A" && (
                                  <p className="text-[10px] text-slate-400 font-mono">{tx.phone}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 text-slate-600 text-[11px] font-medium">
                              {tx.tripName || "—"}
                            </td>
                            <td className="p-2.5 font-bold text-slate-600">{tx.paymentMode}</td>
                            <td className="p-2.5 text-right font-extrabold text-slate-800">
                              ₹ {tx.amountCollected.toLocaleString("en-IN")}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-500">{tx.reference}</td>
                            <td className="p-2.5 text-slate-400 text-[11px]">{tx.notes}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submissions Transactions Table */}
              <div className="space-y-2 pt-2">
                <h5 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Fund Transfers & Submissions to Company ({personDetailData?.submissionTransactions?.length || 0})
                </h5>
                <div className="border border-slate-200 rounded-[4px] overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-emerald-50/60 border-b border-emerald-100 text-[9px] font-bold text-emerald-700 uppercase">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5 text-right">Amount Transferred</th>
                        <th className="p-2.5">Payment Mode</th>
                        <th className="p-2.5">Reference Number</th>
                        <th className="p-2.5">Recorded By</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(personDetailData?.submissionTransactions || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 text-xs">
                            No transfers recorded yet
                          </td>
                        </tr>
                      ) : (
                        personDetailData.submissionTransactions.map((sub: any) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-slate-500 whitespace-nowrap">
                              {new Date(sub.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="p-2.5 text-right font-extrabold text-emerald-600">
                              ₹ {sub.amountSubmitted.toLocaleString("en-IN")}
                            </td>
                            <td className="p-2.5 font-bold text-slate-700">{sub.paymentMode}</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-500">{sub.reference}</td>
                            <td className="p-2.5 text-slate-600 font-semibold">{sub.recordedBy}</td>
                            <td className="p-2.5 text-slate-400 text-[11px]">{sub.notes}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Fund Transfer / Submission Modal */}
      <Dialog open={showRecordSubmissionModal} onOpenChange={setShowRecordSubmissionModal}>
        <DialogContent className="rounded-[4px] border-[#E2E8F0] p-6 bg-white shadow-lg max-w-md">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-600" /> Record Fund Transfer / Submission
            </DialogTitle>
            <DialogDescription className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Record when money from a collection account is transferred or settled into YouthCamping central treasury
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEmployeePayment} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                From Collection Account
              </label>
              <Select
                value={submissionForm.employeeAdminId}
                onValueChange={(val) => setSubmissionForm({ ...submissionForm, employeeAdminId: val })}
              >
                <SelectTrigger className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px] font-semibold">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  {personalCollections.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.accountName || p.name} (Pending: ₹{p.pending.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  Amount Transferred (₹)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 25000"
                  value={submissionForm.amount}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, amount: e.target.value })}
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  Payment Mode
                </label>
                <Select
                  value={submissionForm.paymentMode}
                  onValueChange={(val) => setSubmissionForm({ ...submissionForm, paymentMode: val })}
                >
                  <SelectTrigger className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px] font-semibold">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px]">
                    <SelectItem value="BANK_TRANSFER">BANK TRANSFER</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CASH">CASH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                Reference / UTR / Transaction ID
              </label>
              <Input
                placeholder="e.g. UTR9281039120"
                value={submissionForm.referenceNumber}
                onChange={(e) => setSubmissionForm({ ...submissionForm, referenceNumber: e.target.value })}
                className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                Notes / Remarks
              </label>
              <Input
                placeholder="Transferred to YouthCamping HDFC Account"
                value={submissionForm.notes}
                onChange={(e) => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
                className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRecordSubmissionModal(false)}
                className="h-8.5 px-4 rounded-[4px] font-semibold text-xs border border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingPayment}
                className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submittingPayment ? "Recording..." : "Record Transfer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Collection Account Modal */}
      <Dialog open={showAddCollectionAccountModal} onOpenChange={setShowAddCollectionAccountModal}>
        <DialogContent className="rounded-[4px] border-[#E2E8F0] p-6 bg-white shadow-lg max-w-md">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-500" /> Add Collection Account
            </DialogTitle>
            <DialogDescription className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Create an official Company, Individual, or Cash receiving account
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCollectionAccount} className="space-y-3.5 pt-4 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                Account Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Nikulbhai Patel Account or YouthCamping HDFC"
                value={newAccForm.accountName}
                onChange={(e) => setNewAccForm({ ...newAccForm, accountName: e.target.value })}
                className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  Account Type
                </label>
                <Select
                  value={newAccForm.accountType}
                  onValueChange={(val) => setNewAccForm({ ...newAccForm, accountType: val })}
                >
                  <SelectTrigger className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px] font-semibold">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px]">
                    <SelectItem value="COMPANY">Company Account</SelectItem>
                    <SelectItem value="INDIVIDUAL">Individual Account</SelectItem>
                    <SelectItem value="BANK">Bank Account</SelectItem>
                    <SelectItem value="UPI">UPI Account</SelectItem>
                    <SelectItem value="CASH">Cash Desk</SelectItem>
                    <SelectItem value="CARD">Card POS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  Account Holder Name
                </label>
                <Input
                  placeholder="e.g. Nikulbhai Patel"
                  value={newAccForm.accountHolderName}
                  onChange={(e) => setNewAccForm({ ...newAccForm, accountHolderName: e.target.value })}
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  UPI ID (Optional)
                </label>
                <Input
                  placeholder="e.g. nikulbhai@upi"
                  value={newAccForm.upiId}
                  onChange={(e) => setNewAccForm({ ...newAccForm, upiId: e.target.value })}
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  Bank Name (Optional)
                </label>
                <Input
                  placeholder="e.g. State Bank of India"
                  value={newAccForm.bankName}
                  onChange={(e) => setNewAccForm({ ...newAccForm, bankName: e.target.value })}
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  Account Number (Optional)
                </label>
                <Input
                  placeholder="e.g. 50200084920192"
                  value={newAccForm.accountNumber}
                  onChange={(e) => setNewAccForm({ ...newAccForm, accountNumber: e.target.value })}
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                  IFSC Code (Optional)
                </label>
                <Input
                  placeholder="e.g. SBIN0004821"
                  value={newAccForm.ifsc}
                  onChange={(e) => setNewAccForm({ ...newAccForm, ifsc: e.target.value.toUpperCase() })}
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px] font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCollectionAccountModal(false)}
                disabled={savingAccount}
                className="h-8.5 px-4 rounded-[4px] font-semibold text-xs border border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingAccount || !newAccForm.accountName.trim()}
                className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white"
              >
                {savingAccount ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Account Confirmation Modal */}
      <Dialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <DialogContent className="rounded-[4px] border-[#E2E8F0] p-6 bg-white shadow-lg max-w-sm">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-sm font-bold text-slate-800">
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete this collection account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAccountToDelete(null)}
              disabled={deletingAccount}
              className="h-8 px-4 rounded-[4px] font-semibold text-xs border border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="h-8 px-4 rounded-[4px] font-semibold text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingAccount ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
