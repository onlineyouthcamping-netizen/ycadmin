import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Banknote,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  Building2,
  CreditCard,
  Download,
  Eye,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  X,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  ShieldCheck,
  AlertTriangle,
  Ticket,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Smartphone,
  Receipt,
  FileCheck,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import {
  collectionAccountsService,
  type CollectionAccount,
} from "@/services/collectionAccounts.service";
import { tripsService } from "@/services/trips.service";
import { bookingsService } from "@/services/bookings.service";
import api from "@/services/api";
import { cn, formatINR, safeFormatDate, safeFormatDateTime } from "@/lib/utils";

type TabId =
  | "overview"
  | "verification"
  | "payments"
  | "expenses"
  | "riya"
  | "accounts"
  | "profitability";

export default function AccountingPage() {
  const { admin: user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab Normalization
  const normalizeTab = (raw: string | null): TabId => {
    const t = (raw || "").toLowerCase().trim();
    if (["verification", "queue", "approvals", "pending"].includes(t))
      return "verification";
    if (["payments", "incoming", "collections", "sales_payments", "sales"].includes(t))
      return "payments";
    if (
      [
        "expenses",
        "vendor_payments",
        "office_expenses",
        "vendors",
        "disbursements",
        "outflows",
      ].includes(t)
    )
      return "expenses";
    if (["riya", "train", "tickets", "train_portal", "riya_wallet"].includes(t))
      return "riya";
    if (["accounts", "bank_accounts", "cash_book", "bank", "banks", "cash"].includes(t))
      return "accounts";
    if (["profitability", "trip_profitability", "profit_loss", "pnl", "reports"].includes(t))
      return "profitability";
    return "overview";
  };

  const rawTabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabId>(() => normalizeTab(rawTabParam));

  useEffect(() => {
    const nextTab = normalizeTab(searchParams.get("tab"));
    setActiveTab((prev) => (prev !== nextTab ? nextTab : prev));
  }, [searchParams]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tab);
    setSearchParams(nextParams, { replace: true });
  };

  // Main Data States
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [vendorPayments, setVendorPayments] = useState<any[]>([]);
  const [collectionAccounts, setCollectionAccounts] = useState<CollectionAccount[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<{
    pendingClientPayments: any[];
    pendingStationPayments: any[];
    pendingVendorPayments: any[];
    totalPendingCount: number;
  }>({
    pendingClientPayments: [],
    pendingStationPayments: [],
    pendingVendorPayments: [],
    totalPendingCount: 0,
  });
  const [riyaData, setRiyaData] = useState<{
    account: any;
    totalRechargeAmount: number;
    totalTicketsIssuedCount: number;
    totalTicketCostConsumed: number;
    totalRefunds: number;
    availableRiyaBalance: number;
    recharges: any[];
    tickets: any[];
  }>({
    account: null,
    totalRechargeAmount: 0,
    totalTicketsIssuedCount: 0,
    totalTicketCostConsumed: 0,
    totalRefunds: 0,
    availableRiyaBalance: 0,
    recharges: [],
    tickets: [],
  });

  // Search & Filter States
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("ALL");
  const [riyaSearch, setRiyaSearch] = useState("");

  // Selected Account for Ledger Drawer Modal
  const [selectedAccountForLedger, setSelectedAccountForLedger] =
    useState<CollectionAccount | null>(null);
  const [accountLedgerData, setAccountLedgerData] = useState<any | null>(null);
  const [loadingAccountLedger, setLoadingAccountLedger] = useState(false);

  // Modals
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showSubmitFundsModal, setShowSubmitFundsModal] = useState(false);
  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false);
  const [showRecordIncomeModal, setShowRecordIncomeModal] = useState(false);
  const [showRechargeRiyaModal, setShowRechargeRiyaModal] = useState(false);
  const [rejectModalState, setRejectModalState] = useState<{
    open: boolean;
    type: "client" | "vendor" | "station";
    id: string;
    reason: string;
    title: string;
  } | null>(null);

  // In-App Proof Preview Modal
  const [proofPreviewModal, setProofPreviewModal] = useState<{
    open: boolean;
    title: string;
    subtitle?: string;
    imageUrl: string;
    amount?: number;
    method?: string;
    date?: string;
    txnId?: string;
    accountName?: string;
    status?: string;
  } | null>(null);

  // Forms
  const [newAccForm, setNewAccForm] = useState({
    accountName: "",
    accountHolderName: "",
    accountType: "COMPANY",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
  });
  const [submitFundsForm, setSubmitFundsForm] = useState({
    accountId: "",
    amount: "",
    submissionMode: "BANK_TRANSFER",
    referenceNumber: "",
    notes: "",
  });
  const [rechargeRiyaForm, setRechargeRiyaForm] = useState({
    sourceAccountId: "",
    amount: "",
    referenceNumber: "",
    notes: "",
  });
  const [newExpenseForm, setNewExpenseForm] = useState({
    category: "Transport",
    vendorName: "",
    tripId: "",
    amount: "",
    paymentMode: "BANK_TRANSFER",
    collectionAccountId: "",
    transactionId: "",
    proofUrl: "",
    remarks: "",
  });
  const [newIncomeForm, setNewIncomeForm] = useState({
    bookingId: "",
    amount: "",
    paymentMode: "UPI",
    collectionAccountId: "",
    transactionId: "",
    proofUrl: "",
    notes: "",
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  // Load All Finance Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes, aRes, vRes, qRes, rRes] = await Promise.all([
        bookingsService.getAll({ page: 1, limit: 1000 }).catch(() => ({ data: [] })),
        tripsService.getAll().catch(() => []),
        collectionAccountsService.getAccounts().catch(() => ({ data: [] })),
        api.get("/payments/vendor-payments").catch(() => ({ data: { data: [] } })),
        api.get("/payments/verification-queue").catch(() => ({ data: { data: {} } })),
        api.get("/payments/riya-summary").catch(() => ({ data: { data: {} } })),
      ]);

      const bList = Array.isArray((bRes as any)?.data)
        ? (bRes as any).data
        : Array.isArray(bRes)
          ? bRes
          : [];
      setBookings(bList);
      setTrips(Array.isArray(tRes) ? tRes : []);
      setCollectionAccounts(
        Array.isArray((aRes as any)?.data) ? (aRes as any).data : [],
      );

      const vList = Array.isArray((vRes as any)?.data?.data)
        ? (vRes as any).data.data
        : Array.isArray(vRes?.data)
          ? vRes.data
          : [];
      setVendorPayments(vList);

      if (qRes?.data?.data) {
        setVerificationQueue({
          pendingClientPayments: qRes.data.data.pendingClientPayments || [],
          pendingStationPayments: qRes.data.data.pendingStationPayments || [],
          pendingVendorPayments: qRes.data.data.pendingVendorPayments || [],
          totalPendingCount: qRes.data.data.totalPendingCount || 0,
        });
      }

      if (rRes?.data?.data) {
        setRiyaData(rRes.data.data);
      }
    } catch (err) {
      console.error("Finance data load error:", err);
      toast.error("Failed to refresh finance controller data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Single Account Ledger
  const handleOpenAccountLedger = async (acc: CollectionAccount) => {
    setSelectedAccountForLedger(acc);
    setLoadingAccountLedger(true);
    try {
      const data = await collectionAccountsService.getAccountLedger(acc.id);
      setAccountLedgerData(data);
    } catch {
      toast.error("Failed to load account ledger details");
    } finally {
      setLoadingAccountLedger(false);
    }
  };

  // Handlers for Modals
  const handleRecordIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncomeForm.bookingId) {
      toast.error("Please select a booking");
      return;
    }
    if (!newIncomeForm.amount || Number(newIncomeForm.amount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    if (newIncomeForm.paymentMode !== "CASH" && !newIncomeForm.collectionAccountId) {
      toast.error("Please select the receiving bank / online account for this online payment");
      return;
    }
    setSubmittingAction(true);
    try {
      await api.post(`/payments/client/add/${newIncomeForm.bookingId}`, {
        amount: Number(newIncomeForm.amount),
        paymentMode: newIncomeForm.paymentMode,
        collectionAccountId: newIncomeForm.collectionAccountId || undefined,
        transactionId: newIncomeForm.transactionId || undefined,
        proofUrl: newIncomeForm.proofUrl || undefined,
        status: "Pending Verification",
        notes: newIncomeForm.notes || undefined,
      });
      toast.success("Client payment recorded & submitted for Finance verification!");
      setShowRecordIncomeModal(false);
      setNewIncomeForm({
        bookingId: "",
        amount: "",
        paymentMode: "UPI",
        collectionAccountId: "",
        transactionId: "",
        proofUrl: "",
        notes: "",
      });
      loadData();
    } catch {
      toast.error("Failed to record client payment");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseForm.tripId) {
      toast.error("Please select a trip");
      return;
    }
    if (!newExpenseForm.vendorName.trim()) {
      toast.error("Please enter a vendor / payee name");
      return;
    }
    if (!newExpenseForm.amount || Number(newExpenseForm.amount) <= 0) {
      toast.error("Please enter a valid expense amount");
      return;
    }
    if (newExpenseForm.paymentMode !== "CASH" && !newExpenseForm.proofUrl) {
      toast.error("Payment proof / screenshot URL is mandatory for online vendor disbursements");
      return;
    }
    setSubmittingAction(true);
    try {
      await api.post(`/payments/vendor/${newExpenseForm.tripId}`, {
        vendorName: newExpenseForm.vendorName.trim(),
        category: newExpenseForm.category,
        agreedAmount: Number(newExpenseForm.amount),
        advancePaid: Number(newExpenseForm.amount),
        paymentMode: newExpenseForm.paymentMode,
        collectionAccountId: newExpenseForm.collectionAccountId || undefined,
        transactionId: newExpenseForm.transactionId || undefined,
        invoiceProof: newExpenseForm.proofUrl || undefined,
        remarks: newExpenseForm.remarks || undefined,
        status: "Pending Approval",
      });
      toast.success("Expense recorded & submitted for Finance verification!");
      setShowRecordExpenseModal(false);
      setNewExpenseForm({
        category: "Transport",
        vendorName: "",
        tripId: "",
        amount: "",
        paymentMode: "BANK_TRANSFER",
        collectionAccountId: "",
        transactionId: "",
        proofUrl: "",
        remarks: "",
      });
      loadData();
    } catch {
      toast.error("Failed to record expense");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRechargeRiyaWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeRiyaForm.sourceAccountId) {
      toast.error("Please select the source bank / fund account");
      return;
    }
    if (!rechargeRiyaForm.amount || Number(rechargeRiyaForm.amount) <= 0) {
      toast.error("Please enter a valid recharge amount");
      return;
    }
    const riyaAcc = collectionAccounts.find((a) =>
      a.accountName.toLowerCase().includes("riya"),
    );
    if (!riyaAcc) {
      toast.error("Riya Train Portal Account not found in treasury");
      return;
    }
    setSubmittingAction(true);
    try {
      await collectionAccountsService.recordTransfer({
        fromAccountId: rechargeRiyaForm.sourceAccountId,
        toAccountId: riyaAcc.id,
        amount: Number(rechargeRiyaForm.amount),
        paymentMode: "BANK_TRANSFER",
        referenceNumber: rechargeRiyaForm.referenceNumber,
        notes: rechargeRiyaForm.notes || "Riya Portal Wallet Recharge for Train Bookings",
      });
      toast.success(
        `Successfully recharged Riya Wallet with ${formatINR(Number(rechargeRiyaForm.amount))}!`,
      );
      setShowRechargeRiyaModal(false);
      setRechargeRiyaForm({
        sourceAccountId: "",
        amount: "",
        referenceNumber: "",
        notes: "",
      });
      loadData();
    } catch {
      toast.error("Failed to recharge Riya Wallet");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccForm.accountName.trim()) {
      toast.error("Please enter account name");
      return;
    }
    setSubmittingAction(true);
    try {
      await collectionAccountsService.createAccount({
        accountName: newAccForm.accountName.trim(),
        accountHolderName:
          newAccForm.accountHolderName.trim() || newAccForm.accountName.trim(),
        accountType: newAccForm.accountType as any,
        bankName: newAccForm.bankName.trim() || undefined,
        accountNumber: newAccForm.accountNumber.trim() || undefined,
        ifsc: newAccForm.ifsc.trim() || undefined,
        upiId: newAccForm.upiId.trim() || undefined,
        paymentMethods: ["UPI", "BANK_TRANSFER", "CASH"],
        isActive: true,
      });
      toast.success(`Account "${newAccForm.accountName}" created successfully!`);
      setShowAddAccountModal(false);
      setNewAccForm({
        accountName: "",
        accountHolderName: "",
        accountType: "COMPANY",
        bankName: "",
        accountNumber: "",
        ifsc: "",
        upiId: "",
      });
      loadData();
    } catch {
      toast.error("Failed to add account");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSubmitFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitFundsForm.accountId) {
      toast.error("Please select an account");
      return;
    }
    if (!submitFundsForm.amount || Number(submitFundsForm.amount) <= 0) {
      toast.error("Please enter submission amount");
      return;
    }
    setSubmittingAction(true);
    try {
      await collectionAccountsService.recordAccountSubmission(
        submitFundsForm.accountId,
        {
          amount: Number(submitFundsForm.amount),
          submissionMode: submitFundsForm.submissionMode,
          referenceNumber: submitFundsForm.referenceNumber || undefined,
          notes: submitFundsForm.notes || undefined,
        },
      );
      toast.success("Funds submission recorded successfully!");
      setShowSubmitFundsModal(false);
      setSubmitFundsForm({
        accountId: "",
        amount: "",
        submissionMode: "BANK_TRANSFER",
        referenceNumber: "",
        notes: "",
      });
      loadData();
    } catch {
      toast.error("Failed to record fund submission");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Verification Actions
  const handleVerifyClientPayment = async (paymentId: string) => {
    try {
      await api.patch(`/payments/client/verify/${paymentId}`, {
        status: "Verified",
      });
      toast.success("Payment verified & reconciled!");
      loadData();
    } catch {
      toast.error("Failed to verify payment");
    }
  };

  const handleVerifyVendorPayment = async (paymentId: string) => {
    try {
      await api.patch(`/payments/vendor/verify/${paymentId}`, {
        status: "Paid",
      });
      toast.success("Vendor payment verified & approved!");
      loadData();
    } catch {
      toast.error("Failed to verify vendor payment");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalState) return;
    if (!rejectModalState.reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setSubmittingAction(true);
    try {
      if (rejectModalState.type === "client") {
        await api.patch(`/payments/client/verify/${rejectModalState.id}`, {
          status: "Rejected",
          remarks: rejectModalState.reason,
        });
      } else if (rejectModalState.type === "vendor") {
        await api.patch(`/payments/vendor/verify/${rejectModalState.id}`, {
          status: "Rejected",
          remarks: rejectModalState.reason,
        });
      }
      toast.success("Payment marked as rejected and sent for correction");
      setRejectModalState(null);
      loadData();
    } catch {
      toast.error("Failed to reject payment");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Compute all client receipts across bookings
  const allClientReceipts = useMemo(() => {
    const list: any[] = [];
    bookings.forEach((b) => {
      const payments = b.clientPayments || b.paymentHistory || [];
      if (Array.isArray(payments) && payments.length > 0) {
        payments.forEach((p: any) => {
          list.push({
            id: p.id || `${b.id}-${p.amount}-${p.createdAt}`,
            bookingId: b.bookingId || b.id,
            customerName: b.fullName || b.customerName || "Customer",
            phone: b.phone || b.mobile || "—",
            tripName: b.tripName || "—",
            departureDate: b.departureDate,
            amount: Number(p.amount) || 0,
            paymentMode: p.paymentMode || "UPI",
            accountName:
              p.collectionAccount?.accountName ||
              (p.paymentMode === "CASH" ? "Office Cash Desk" : "Primary Company Bank"),
            transactionId: p.transactionId || p.utrNumber || "—",
            status: p.status || "Verified",
            proofUrl: p.proofUrl || p.proofImageUrl,
            date: p.paymentDate || p.createdAt || b.createdAt,
            remarks: p.remarks || p.notes || "—",
          });
        });
      } else if (Number(b.advancePaid) > 0) {
        list.push({
          id: `adv-${b.id}`,
          bookingId: b.bookingId || b.id,
          customerName: b.fullName || b.customerName || "Customer",
          phone: b.phone || b.mobile || "—",
          tripName: b.tripName || "—",
          departureDate: b.departureDate,
          amount: Number(b.advancePaid) || 0,
          paymentMode: b.paymentMode || "UPI",
          accountName: b.paymentMode === "CASH" ? "Office Cash Desk" : "Primary Company Bank",
          transactionId: b.transactionId || "—",
          status: "Verified",
          proofUrl: b.paymentScreenshotUrl,
          date: b.createdAt,
          remarks: "Advance Paid on Booking",
        });
      }
    });

    return list.sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
  }, [bookings]);

  // Aggregate Treasury Metrics
  const treasurySummary = useMemo(() => {
    const totalInflow = allClientReceipts
      .filter((r) => r.status === "Verified")
      .reduce((sum, r) => sum + r.amount, 0);

    const totalOutflow =
      vendorPayments
        .filter((v) => v.status === "Paid" || v.status === "Verified")
        .reduce((sum, v) => sum + (Number(v.advancePaid) || 0), 0) +
      riyaData.totalTicketCostConsumed;

    const totalReceivables = bookings.reduce(
      (sum, b) => sum + (Number(b.remainingAmount) || 0),
      0,
    );

    const totalPayables = vendorPayments
      .filter((v) => v.status !== "Paid" && v.status !== "Rejected")
      .reduce((sum, v) => sum + (Number(v.remainingPayable || v.agreedAmount) || 0), 0);

    const netLiquidity = totalInflow - totalOutflow;

    return {
      totalInflow,
      totalOutflow,
      netLiquidity,
      totalReceivables,
      totalPayables,
    };
  }, [allClientReceipts, vendorPayments, riyaData, bookings]);

  // Filtered Client Receipts
  const filteredReceipts = useMemo(() => {
    return allClientReceipts.filter((r) => {
      const matchesSearch =
        paymentSearch === "" ||
        r.customerName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        r.bookingId.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        r.phone.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        r.tripName.toLowerCase().includes(paymentSearch.toLowerCase());

      const matchesMode =
        paymentModeFilter === "ALL" ||
        r.paymentMode?.toUpperCase() === paymentModeFilter;

      const matchesStatus =
        paymentStatusFilter === "ALL" ||
        r.status?.toLowerCase() === paymentStatusFilter.toLowerCase();

      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [allClientReceipts, paymentSearch, paymentModeFilter, paymentStatusFilter]);

  // Filtered Vendor Expenses
  const filteredExpenses = useMemo(() => {
    return vendorPayments.filter((v) => {
      const matchesSearch =
        expenseSearch === "" ||
        v.vendorName?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        v.trip?.title?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        v.category?.toLowerCase().includes(expenseSearch.toLowerCase());

      const matchesCategory =
        expenseCategoryFilter === "ALL" ||
        v.category?.toLowerCase() === expenseCategoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [vendorPayments, expenseSearch, expenseCategoryFilter]);

  // Filtered Riya Tickets
  const filteredRiyaTickets = useMemo(() => {
    return (riyaData.tickets || []).filter((t: any) => {
      if (!riyaSearch.trim()) return true;
      const q = riyaSearch.toLowerCase();
      return (
        t.travelerName?.toLowerCase().includes(q) ||
        t.pnr?.toLowerCase().includes(q) ||
        t.trainNumber?.toLowerCase().includes(q) ||
        t.booking?.fullName?.toLowerCase().includes(q) ||
        t.booking?.tripName?.toLowerCase().includes(q)
      );
    });
  }, [riyaData.tickets, riyaSearch]);

  // Trip Profitability Breakdown
  const tripProfitabilityList = useMemo(() => {
    const tripMap: Record<string, any> = {};

    trips.forEach((t) => {
      tripMap[t.id] = {
        tripId: t.id,
        tripTitle: t.title,
        tripCode: t.tripCode || t.slug || "—",
        destination: t.destination || "—",
        totalPax: 0,
        grossRevenue: 0,
        collectedRevenue: 0,
        ticketCost: 0,
        vendorCost: 0,
        totalCost: 0,
        grossProfit: 0,
        marginPercent: 0,
      };
    });

    // Add Bookings revenue
    bookings.forEach((b) => {
      const tId = b.tripId;
      if (tripMap[tId]) {
        tripMap[tId].totalPax += Number(b.numberOfTravelers) || 1;
        tripMap[tId].grossRevenue += Number(b.totalAmount || b.amount) || 0;
        tripMap[tId].collectedRevenue += Number(b.advancePaid) || 0;
      }
    });

    // Add Vendor costs
    vendorPayments.forEach((v) => {
      const tId = v.tripId;
      if (tripMap[tId]) {
        tripMap[tId].vendorCost += Number(v.advancePaid || v.agreedAmount) || 0;
      }
    });

    // Add Ticket costs from Riya
    (riyaData.tickets || []).forEach((t: any) => {
      const tId = t.booking?.tripId;
      if (tId && tripMap[tId] && t.ticketStatus !== "CANCELLED") {
        tripMap[tId].ticketCost += Number(t.ticketAmount) || 0;
      }
    });

    return Object.values(tripMap)
      .map((item: any) => {
        const totalCost = item.vendorCost + item.ticketCost;
        const grossProfit = item.collectedRevenue - totalCost;
        const marginPercent =
          item.collectedRevenue > 0
            ? Math.round((grossProfit / item.collectedRevenue) * 100 * 10) / 10
            : 0;
        return {
          ...item,
          totalCost,
          grossProfit,
          marginPercent,
        };
      })
      .filter((item) => item.grossRevenue > 0 || item.totalCost > 0)
      .sort((a, b) => b.grossProfit - a.grossProfit);
  }, [trips, bookings, vendorPayments, riyaData.tickets]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Breadcrumb & Executive Title Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30 px-6 py-3.5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-600 rounded-xl text-white shadow-sm shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  Finance Controller & Treasury
                </h1>
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] font-black uppercase px-2"
                >
                  Live Ledger
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Authoritative money ledger, Riya wallet portal, verification queue & P&L
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-8.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowRechargeRiyaModal(true)}
              className="h-8.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5 mr-1.5" />
              Recharge Riya
            </Button>
            <Button
              size="sm"
              onClick={() => setShowRecordIncomeModal(true)}
              className="h-8.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              + Income
            </Button>
            <Button
              size="sm"
              onClick={() => setShowRecordExpenseModal(true)}
              className="h-8.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
            >
              <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
              + Expense
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <PieIcon className="w-3.5 h-3.5" />
            Overview
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("verification")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative",
              activeTab === "verification"
                ? "bg-orange-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verification Queue
            {verificationQueue.totalPendingCount > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                  activeTab === "verification"
                    ? "bg-white text-orange-600"
                    : "bg-orange-600 text-white",
                )}
              >
                {verificationQueue.totalPendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("payments")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
              activeTab === "payments"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Incoming Collections
            <span className="text-[10px] text-slate-400 font-normal">
              ({allClientReceipts.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("expenses")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
              activeTab === "expenses"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            Outgoing Disbursements
            <span className="text-[10px] text-slate-400 font-normal">
              ({vendorPayments.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("riya")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
              activeTab === "riya"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Ticket className="w-3.5 h-3.5 text-indigo-400" />
            Riya Train Wallet
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-black px-1.5",
                activeTab === "riya"
                  ? "bg-indigo-700 text-white border-indigo-500"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200",
              )}
            >
              {formatINR(riyaData.availableRiyaBalance)}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("accounts")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
              activeTab === "accounts"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            Treasury & Bank Ledgers
            <span className="text-[10px] text-slate-400 font-normal">
              ({collectionAccounts.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("profitability")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
              activeTab === "profitability"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <PieIcon className="w-3.5 h-3.5 text-orange-500" />
            Trip & Departure P&L
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ──────────────────────── TAB 1: OVERVIEW ──────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Verified Inflow
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {formatINR(treasurySummary.totalInflow)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  From booking advances & station collections
                </p>
              </Card>

              <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Verified Outflow
                  </span>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {formatINR(treasurySummary.totalOutflow)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Vendors, train tickets & ops expenses
                </p>
              </Card>

              <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Net Treasury Balance
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-2xl font-black",
                      treasurySummary.netLiquidity >= 0
                        ? "text-emerald-600"
                        : "text-rose-600",
                    )}
                  >
                    {formatINR(treasurySummary.netLiquidity)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Across bank accounts, cash desk & wallets
                </p>
              </Card>

              <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Riya Wallet Balance
                  </span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-600">
                    {formatINR(riyaData.availableRiyaBalance)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {riyaData.totalTicketsIssuedCount} tickets issued · Live IRCTC balance
                </p>
              </Card>
            </div>

            {/* Quick Verification Alert if pending */}
            {verificationQueue.totalPendingCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-600 text-white rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-orange-950">
                      {verificationQueue.totalPendingCount} Financial Transactions Awaiting
                      Verification
                    </h4>
                    <p className="text-[11px] text-orange-700">
                      Incoming client payments, station collections, and vendor disbursements need
                      Controller sign-off before reconciliation.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleTabChange("verification")}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer"
                >
                  Open Verification Queue
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            )}

            {/* Account Quick Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-600" />
                  Finance Accounts & Money Positions
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTabChange("accounts")}
                  className="text-xs font-bold text-orange-600 hover:bg-orange-50 cursor-pointer"
                >
                  View All Ledgers →
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {collectionAccounts.map((acc) => (
                  <Card
                    key={acc.id}
                    onClick={() => handleOpenAccountLedger(acc)}
                    className="p-4 bg-white hover:bg-slate-50/80 border border-slate-200 rounded-xl shadow-xs cursor-pointer transition-all hover:border-orange-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {acc.accountName}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-black uppercase px-1.5",
                          acc.accountType === "CASH"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : acc.accountName.toLowerCase().includes("riya")
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-blue-50 text-blue-700 border-blue-200",
                        )}
                      >
                        {acc.accountType}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {acc.bankName || acc.accountHolderName}
                    </p>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Balance:</span>
                      <span className="text-base font-black text-slate-900">
                        {formatINR(acc.pending || 0)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Top Trips P&L Snippet */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-600" />
                  Top Trip Profitability & Margins
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTabChange("profitability")}
                  className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                >
                  Full P&L Report →
                </Button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Trip Name</th>
                      <th className="py-2.5 px-4 text-center">Pax</th>
                      <th className="py-2.5 px-4 text-right">Revenue</th>
                      <th className="py-2.5 px-4 text-right">Ticket Cost (Riya)</th>
                      <th className="py-2.5 px-4 text-right">Vendor Cost</th>
                      <th className="py-2.5 px-4 text-right">Gross Profit</th>
                      <th className="py-2.5 px-4 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tripProfitabilityList.slice(0, 5).map((t) => (
                      <tr key={t.tripId} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {t.tripTitle}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-700">
                          {t.totalPax}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {formatINR(t.collectedRevenue)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-indigo-600 font-semibold">
                          {formatINR(t.ticketCost)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-rose-600 font-semibold">
                          {formatINR(t.vendorCost)}
                        </td>
                        <td
                          className={cn(
                            "py-2.5 px-4 text-right font-black",
                            t.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600",
                          )}
                        >
                          {formatINR(t.grossProfit)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-slate-800">
                          {t.marginPercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB 2: VERIFICATION QUEUE ──────────────────────── */}
        {activeTab === "verification" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-600" />
                  Finance Controller Verification Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Final gatekeeper layer. Verify proof screenshots, reconcile accounts, or reject
                  with mandatory reason.
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-black px-3 py-1"
              >
                {verificationQueue.totalPendingCount} Pending Action
              </Badge>
            </div>

            {/* Sub-Queue: Pending Client Receipts */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Pending Client & Booking Receipts (
                  {verificationQueue.pendingClientPayments?.length || 0})
                </span>
              </div>

              {verificationQueue.pendingClientPayments?.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  No pending client receipts in verification queue. All caught up!
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Booking / Customer</th>
                      <th className="py-2.5 px-4">Trip</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4">Mode / Account</th>
                      <th className="py-2.5 px-4">Proof</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verificationQueue.pendingClientPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {p.booking?.fullName || "Customer"}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Ref: {p.booking?.bookingId || p.bookingId} · {p.booking?.phone}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {p.booking?.tripName || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-emerald-600">
                          {formatINR(p.amount)}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {p.paymentMode}
                          </Badge>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {p.collectionAccount?.accountName || "Default Account"}
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          {p.proofUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setProofPreviewModal({
                                  open: true,
                                  title: `Payment Proof - ${p.booking?.fullName}`,
                                  subtitle: `Booking Ref: ${p.booking?.bookingId}`,
                                  imageUrl: p.proofUrl,
                                  amount: p.amount,
                                  date: safeFormatDate(p.createdAt),
                                })
                              }
                              className="h-7 text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View Proof
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-400">No Proof</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleVerifyClientPayment(p.id)}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setRejectModalState({
                                  open: true,
                                  type: "client",
                                  id: p.id,
                                  reason: "",
                                  title: `Reject Client Payment - ${p.booking?.fullName} (${formatINR(p.amount)})`,
                                })
                              }
                              className="h-7 px-2.5 text-rose-600 hover:bg-rose-50 border-rose-200 text-[11px] font-bold cursor-pointer"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Sub-Queue: Pending Vendor Outgoing Payouts */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  Pending Vendor & Operational Payouts (
                  {verificationQueue.pendingVendorPayments?.length || 0})
                </span>
              </div>

              {verificationQueue.pendingVendorPayments?.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  No pending vendor disbursements in verification queue. All caught up!
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Vendor / Payee</th>
                      <th className="py-2.5 px-4">Trip</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4">Paid From Account</th>
                      <th className="py-2.5 px-4">Invoice / Proof</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verificationQueue.pendingVendorPayments.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {v.vendorName}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {v.serviceDescription || "Service Payment"}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {v.trip?.title || "—"}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {v.category}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-rose-600">
                          {formatINR(v.advancePaid || v.agreedAmount)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 font-semibold">
                          {v.collectionAccount?.accountName || "Primary Bank"}
                        </td>
                        <td className="py-2.5 px-4">
                          {v.invoiceProof ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setProofPreviewModal({
                                  open: true,
                                  title: `Vendor Invoice Proof - ${v.vendorName}`,
                                  subtitle: `Trip: ${v.trip?.title}`,
                                  imageUrl: v.invoiceProof,
                                  amount: v.advancePaid,
                                  date: safeFormatDate(v.createdAt),
                                })
                              }
                              className="h-7 text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View Invoice
                            </Button>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-bold">
                              Missing Proof
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleVerifyVendorPayment(v.id)}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setRejectModalState({
                                  open: true,
                                  type: "vendor",
                                  id: v.id,
                                  reason: "",
                                  title: `Reject Vendor Payment - ${v.vendorName} (${formatINR(v.advancePaid || v.agreedAmount)})`,
                                })
                              }
                              className="h-7 px-2.5 text-rose-600 hover:bg-rose-50 border-rose-200 text-[11px] font-bold cursor-pointer"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB 3: INCOMING COLLECTIONS ──────────────────────── */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search by customer, booking ref, phone, trip..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    className="pl-8.5 h-8.5 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={paymentModeFilter}
                  onChange={(e) => setPaymentModeFilter(e.target.value)}
                  className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700"
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash Desk</option>
                </select>

                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending verification">Pending Verification</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Receipts Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Customer / Booking</th>
                    <th className="py-2.5 px-4">Trip</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4">Receiving Account</th>
                    <th className="py-2.5 px-4">Mode / UTR</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No client receipts match current search & filter.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                          {safeFormatDate(r.date)}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {r.customerName}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Ref: {r.bookingId} · {r.phone}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 truncate max-w-[160px]">
                          {r.tripName}
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-emerald-600">
                          {formatINR(r.amount)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800 font-semibold">
                          {r.accountName}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-slate-700">{r.paymentMode}</span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {r.transactionId}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold",
                              r.status?.toLowerCase() === "verified"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : r.status?.toLowerCase() === "rejected"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-orange-50 text-orange-700 border-orange-200",
                            )}
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {r.proofUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setProofPreviewModal({
                                  open: true,
                                  title: `Payment Screenshot - ${r.customerName}`,
                                  subtitle: `Booking Ref: ${r.bookingId}`,
                                  imageUrl: r.proofUrl,
                                  amount: r.amount,
                                  date: safeFormatDate(r.date),
                                })
                              }
                              className="h-7 text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Proof
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB 4: OUTGOING DISBURSEMENTS ──────────────────────── */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search by vendor, trip, category..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="pl-8.5 h-8.5 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Hotels">Hotels / Camps</option>
                  <option value="Transport">Transport / Fleets</option>
                  <option value="Guides">Guides / Leaders</option>
                  <option value="Activities">Activities / Permits</option>
                  <option value="Office">Office Ops</option>
                </select>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Vendor / Payee</th>
                    <th className="py-2.5 px-4">Trip</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right">Agreed Cost</th>
                    <th className="py-2.5 px-4 text-right">Paid Outflow</th>
                    <th className="py-2.5 px-4">Paid From Account</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Invoice Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No vendor disbursements match current search & filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                          {safeFormatDate(v.paymentDate || v.createdAt)}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {v.vendorName}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {v.serviceDescription || "Vendor Service"}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 truncate max-w-[160px]">
                          {v.trip?.title || "—"}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {v.category}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-500 font-semibold">
                          {formatINR(v.agreedAmount)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-rose-600">
                          {formatINR(v.advancePaid)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800 font-semibold">
                          {v.collectionAccount?.accountName || "Primary Bank"}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold",
                              v.status?.toLowerCase() === "paid" ||
                                v.status?.toLowerCase() === "verified"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : v.status?.toLowerCase() === "rejected"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-orange-50 text-orange-700 border-orange-200",
                            )}
                          >
                            {v.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {v.invoiceProof ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setProofPreviewModal({
                                  open: true,
                                  title: `Vendor Invoice - ${v.vendorName}`,
                                  subtitle: `Trip: ${v.trip?.title}`,
                                  imageUrl: v.invoiceProof,
                                  amount: v.advancePaid,
                                  date: safeFormatDate(v.paymentDate || v.createdAt),
                                })
                              }
                              className="h-7 text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB 5: RIYA TRAIN PORTAL & WALLET ──────────────────────── */}
        {activeTab === "riya" && (
          <div className="space-y-6">
            {/* Top Riya Wallet KPI Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-indigo-900 text-white rounded-xl border border-indigo-800 shadow-sm col-span-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    Riya Portal Available Balance
                  </span>
                  <Ticket className="w-5 h-5 text-indigo-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-3xl font-black text-white">
                    {formatINR(riyaData.availableRiyaBalance)}
                  </span>
                  <Badge className="bg-indigo-700 text-indigo-100 text-[10px] font-black border-0">
                    LIVE IRCTC WALLET
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowRechargeRiyaModal(true)}
                    className="bg-white hover:bg-indigo-50 text-indigo-950 text-xs font-bold h-8 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    + Recharge Riya Wallet
                  </Button>
                </div>
              </Card>

              <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Recharges
                </span>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  {formatINR(riyaData.totalRechargeAmount)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {riyaData.recharges?.length || 0} recharge transfers logged
                </p>
              </Card>

              <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tickets Consumed
                </span>
                <div className="mt-2 text-2xl font-black text-indigo-600">
                  {formatINR(riyaData.totalTicketCostConsumed)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {riyaData.totalTicketsIssuedCount} tickets issued from portal
                </p>
              </Card>
            </div>

            {/* Ticket Consumption Ledger */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-indigo-600" />
                  Authoritative Train Ticket Cost Ledger (Direct from Ticketing)
                </h3>
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search traveler, PNR, train #, trip..."
                    value={riyaSearch}
                    onChange={(e) => setRiyaSearch(e.target.value)}
                    className="pl-8.5 h-8 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Journey Date</th>
                      <th className="py-2.5 px-4">Traveler / Passenger</th>
                      <th className="py-2.5 px-4">Trip & Departure</th>
                      <th className="py-2.5 px-4">PNR / Train Number</th>
                      <th className="py-2.5 px-4 text-right">Authoritative Cost</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Riya Deduction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRiyaTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No train tickets match current search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRiyaTickets.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50/60 font-medium">
                          <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                            {safeFormatDate(t.journeyDate || t.createdAt)}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {t.travelerName}
                            <div className="text-[10px] text-slate-400 font-normal">
                              Booking: {t.booking?.fullName} (Ref: {t.bookingId})
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-slate-700">
                            {t.booking?.tripName || "—"}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-mono font-bold text-slate-900">
                              {t.pnr || "PENDING"}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              {t.trainNumber} {t.trainName}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right font-black text-indigo-600">
                            {formatINR(Number(t.ticketAmount) || 0)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold",
                                t.ticketStatus === "CONFIRMED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : t.ticketStatus === "CANCELLED"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200",
                              )}
                            >
                              {t.ticketStatus}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-600">
                            - {formatINR(Number(t.ticketAmount) || 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB 6: TREASURY & BANK LEDGERS ──────────────────────── */}
        {activeTab === "accounts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-600" />
                  Treasury Accounts & Cash Desks
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full double-entry money ledgers. Trace exact source and destination of every
                  rupee.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowSubmitFundsModal(true)}
                  className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                  Transfer Funds
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowAddAccountModal(true)}
                  className="h-8 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  + Add Account
                </Button>
              </div>
            </div>

            {/* Account Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {collectionAccounts.map((acc) => (
                <Card
                  key={acc.id}
                  className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-black uppercase px-2",
                          acc.accountType === "CASH"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : acc.accountName.toLowerCase().includes("riya")
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-blue-50 text-blue-700 border-blue-200",
                        )}
                      >
                        {acc.accountType}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {acc.isActive ? "Active" : "Archived"}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 mt-2.5">
                      {acc.accountName}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {acc.accountHolderName}
                    </p>

                    {acc.bankName && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        {acc.bankName} {acc.accountNumber && `· ${acc.accountNumber}`}
                      </p>
                    )}
                    {acc.upiId && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        UPI: {acc.upiId}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-xs text-slate-500 font-semibold">
                        Reconciled Balance:
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {formatINR(acc.pending || 0)}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAccountLedger(acc)}
                      className="w-full h-8 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      View Full Ledger
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB 7: TRIP & DEPARTURE P&L ──────────────────────── */}
        {activeTab === "profitability" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-orange-600" />
                Trip & Departure Profitability (P&L)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact net margin calculation: Total Verified Inflow − (Authoritative Ticket Cost +
                Verified Vendor Payouts + Guides).
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">Trip Code / Title</th>
                    <th className="py-3 px-4 text-center">Booked Pax</th>
                    <th className="py-3 px-4 text-right">Gross Selling Price</th>
                    <th className="py-3 px-4 text-right">Verified Revenue</th>
                    <th className="py-3 px-4 text-right">Train Tickets (Riya)</th>
                    <th className="py-3 px-4 text-right">Vendor Direct Costs</th>
                    <th className="py-3 px-4 text-right">Total Operational Costs</th>
                    <th className="py-3 px-4 text-right">Gross Profit</th>
                    <th className="py-3 px-4 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tripProfitabilityList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No active trips with financial data recorded yet.
                      </td>
                    </tr>
                  ) : (
                    tripProfitabilityList.map((t) => (
                      <tr key={t.tripId} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {t.tripTitle}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Code: {t.tripCode} · {t.destination}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {t.totalPax}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 font-semibold">
                          {formatINR(t.grossRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          {formatINR(t.collectedRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-indigo-600 font-semibold">
                          {formatINR(t.ticketCost)}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 font-semibold">
                          {formatINR(t.vendorCost)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {formatINR(t.totalCost)}
                        </td>
                        <td
                          className={cn(
                            "py-3 px-4 text-right font-black",
                            t.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600",
                          )}
                        >
                          {formatINR(t.grossProfit)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-black text-[11px] px-2",
                              t.marginPercent >= 20
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : t.marginPercent >= 0
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200",
                            )}
                          >
                            {t.marginPercent}%
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────── DIALOG: RECORD CLIENT INCOME ──────────────────────── */}
      <Dialog open={showRecordIncomeModal} onOpenChange={setShowRecordIncomeModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Record Client Booking Payment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordIncome} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Select Booking / Customer *
              </label>
              <select
                required
                value={newIncomeForm.bookingId}
                onChange={(e) =>
                  setNewIncomeForm((prev) => ({ ...prev, bookingId: e.target.value }))
                }
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs focus:ring-1 focus:ring-orange-500"
              >
                <option value="">-- Choose a Booking --</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.fullName || b.customerName || "Customer"} · Ref: {b.bookingId || b.id} (
                    {b.tripName || "Trip"}) · Due: {formatINR(b.remainingAmount || 0)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹) *</label>
                <Input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={newIncomeForm.amount}
                  onChange={(e) =>
                    setNewIncomeForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="h-9 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Mode *</label>
                <select
                  value={newIncomeForm.paymentMode}
                  onChange={(e) =>
                    setNewIncomeForm((prev) => ({ ...prev, paymentMode: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="CASH">Cash Desk</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Receiving Account (Where money was credited) *
              </label>
              <select
                required={newIncomeForm.paymentMode !== "CASH"}
                value={newIncomeForm.collectionAccountId}
                onChange={(e) =>
                  setNewIncomeForm((prev) => ({
                    ...prev,
                    collectionAccountId: e.target.value,
                  }))
                }
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
              >
                <option value="">-- Choose Receiving Account --</option>
                {collectionAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.bankName || acc.accountType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Transaction Ref / UTR</label>
              <Input
                placeholder="UPI Ref ID or Bank UTR"
                value={newIncomeForm.transactionId}
                onChange={(e) =>
                  setNewIncomeForm((prev) => ({ ...prev, transactionId: e.target.value }))
                }
                className="h-9 text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Proof / Screenshot URL
              </label>
              <Input
                placeholder="https://... (Payment screenshot link)"
                value={newIncomeForm.proofUrl}
                onChange={(e) =>
                  setNewIncomeForm((prev) => ({ ...prev, proofUrl: e.target.value }))
                }
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRecordIncomeModal(false)}
                className="h-8.5 text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {submittingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Submit to Verification"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: RECORD VENDOR EXPENSE ──────────────────────── */}
      <Dialog open={showRecordExpenseModal} onOpenChange={setShowRecordExpenseModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              Record Vendor / Operational Outflow
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordExpense} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Trip *</label>
              <select
                required
                value={newExpenseForm.tripId}
                onChange={(e) =>
                  setNewExpenseForm((prev) => ({ ...prev, tripId: e.target.value }))
                }
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs focus:ring-1 focus:ring-orange-500"
              >
                <option value="">-- Choose a Trip --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.destination || "Trip"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category *</label>
                <select
                  value={newExpenseForm.category}
                  onChange={(e) =>
                    setNewExpenseForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="Hotels">Hotels / Camps</option>
                  <option value="Transport">Transport / Fleet</option>
                  <option value="Guides">Guides / Leaders</option>
                  <option value="Activities">Activities / Permits</option>
                  <option value="Office">Office Ops / Rent</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor / Payee *</label>
                <Input
                  required
                  placeholder="e.g. Manali Volvo Travels"
                  value={newExpenseForm.vendorName}
                  onChange={(e) =>
                    setNewExpenseForm((prev) => ({ ...prev, vendorName: e.target.value }))
                  }
                  className="h-9 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount Paid (₹) *</label>
                <Input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={newExpenseForm.amount}
                  onChange={(e) =>
                    setNewExpenseForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="h-9 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Mode *</label>
                <select
                  value={newExpenseForm.paymentMode}
                  onChange={(e) =>
                    setNewExpenseForm((prev) => ({ ...prev, paymentMode: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Paid From Account (Source of Funds) *
              </label>
              <select
                required
                value={newExpenseForm.collectionAccountId}
                onChange={(e) =>
                  setNewExpenseForm((prev) => ({
                    ...prev,
                    collectionAccountId: e.target.value,
                  }))
                }
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
              >
                <option value="">-- Choose Account --</option>
                {collectionAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} (Balance: {formatINR(acc.pending || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Invoice / Proof Screenshot URL {newExpenseForm.paymentMode !== "CASH" && "*"}
              </label>
              <Input
                required={newExpenseForm.paymentMode !== "CASH"}
                placeholder="https://... (Mandatory for online disbursements)"
                value={newExpenseForm.proofUrl}
                onChange={(e) =>
                  setNewExpenseForm((prev) => ({ ...prev, proofUrl: e.target.value }))
                }
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRecordExpenseModal(false)}
                className="h-8.5 text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {submittingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Submit to Verification"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: RECHARGE RIYA WALLET ──────────────────────── */}
      <Dialog open={showRechargeRiyaModal} onOpenChange={setShowRechargeRiyaModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-indigo-950 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-600" />
              Recharge Riya Train Portal Wallet
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRechargeRiyaWallet} className="space-y-3.5 mt-2 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-[11px] text-indigo-800 font-medium">
                Money movements from your bank to the Riya portal are treated as inter-account
                transfers, not immediate trip expenses. Real costs are deducted automatically as
                individual passenger tickets are issued.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Source Bank / Treasury Account *
              </label>
              <select
                required
                value={rechargeRiyaForm.sourceAccountId}
                onChange={(e) =>
                  setRechargeRiyaForm((prev) => ({
                    ...prev,
                    sourceAccountId: e.target.value,
                  }))
                }
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
              >
                <option value="">-- Select Source Bank Account --</option>
                {collectionAccounts
                  .filter((a) => !a.accountName.toLowerCase().includes("riya"))
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} (Available: {formatINR(acc.pending || 0)})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Recharge Amount (₹) *</label>
              <Input
                type="number"
                required
                placeholder="e.g. 10000"
                value={rechargeRiyaForm.amount}
                onChange={(e) =>
                  setRechargeRiyaForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="h-9 text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Bank Reference / Deposit UTR
              </label>
              <Input
                placeholder="UTR / Deposit transaction ID"
                value={rechargeRiyaForm.referenceNumber}
                onChange={(e) =>
                  setRechargeRiyaForm((prev) => ({
                    ...prev,
                    referenceNumber: e.target.value,
                  }))
                }
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRechargeRiyaModal(false)}
                className="h-8.5 text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                {submittingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Execute Recharge"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: REJECT MODAL WITH REASON ──────────────────────── */}
      <Dialog
        open={Boolean(rejectModalState)}
        onOpenChange={(open) => {
          if (!open) setRejectModalState(null);
        }}
      >
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-rose-950 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              {rejectModalState?.title || "Reject Payment"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2 text-xs">
            <p className="text-slate-600 font-medium">
              Please enter the mandatory rejection reason. The payment will return to pending /
              correction state with this audit trail note.
            </p>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Rejection Reason *</label>
              <Input
                required
                placeholder="e.g. Screenshot blurry, UTR mismatch with bank statement..."
                value={rejectModalState?.reason || ""}
                onChange={(e) =>
                  setRejectModalState((prev) => (prev ? { ...prev, reason: e.target.value } : null))
                }
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectModalState(null)}
                className="h-8.5 text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={submittingAction}
                onClick={handleConfirmReject}
                className="h-8.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {submittingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: ADD ACCOUNT ──────────────────────── */}
      <Dialog open={showAddAccountModal} onOpenChange={setShowAddAccountModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              Add Bank / Treasury Account
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddAccount} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Account Display Name *</label>
              <Input
                required
                placeholder="e.g. HDFC Main Operating, Cash Desk"
                value={newAccForm.accountName}
                onChange={(e) =>
                  setNewAccForm((prev) => ({ ...prev, accountName: e.target.value }))
                }
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Type *</label>
                <select
                  value={newAccForm.accountType}
                  onChange={(e) =>
                    setNewAccForm((prev) => ({ ...prev, accountType: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="COMPANY">Company Bank Account</option>
                  <option value="CASH">Office Cash Desk</option>
                  <option value="INDIVIDUAL">Director / Personal Account</option>
                  <option value="OTHER">Custom / Partner Wallet</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                <Input
                  placeholder="e.g. HDFC Bank, SBI"
                  value={newAccForm.bankName}
                  onChange={(e) =>
                    setNewAccForm((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                  className="h-9 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                <Input
                  placeholder="Account Number"
                  value={newAccForm.accountNumber}
                  onChange={(e) =>
                    setNewAccForm((prev) => ({ ...prev, accountNumber: e.target.value }))
                  }
                  className="h-9 text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
                <Input
                  placeholder="e.g. HDFC0001234"
                  value={newAccForm.ifsc}
                  onChange={(e) =>
                    setNewAccForm((prev) => ({ ...prev, ifsc: e.target.value }))
                  }
                  className="h-9 text-xs font-medium uppercase"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">UPI ID</label>
              <Input
                placeholder="e.g. youthcamping@hdfcbank"
                value={newAccForm.upiId}
                onChange={(e) =>
                  setNewAccForm((prev) => ({ ...prev, upiId: e.target.value }))
                }
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddAccountModal(false)}
                className="h-8.5 text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
              >
                {submittingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Save Account"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: TRANSFER / SUBMIT FUNDS ──────────────────────── */}
      <Dialog open={showSubmitFundsModal} onOpenChange={setShowSubmitFundsModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              Transfer / Submit Treasury Funds
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitFunds} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">From Account *</label>
              <select
                required
                value={submitFundsForm.accountId}
                onChange={(e) =>
                  setSubmitFundsForm((prev) => ({ ...prev, accountId: e.target.value }))
                }
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
              >
                <option value="">-- Choose Account --</option>
                {collectionAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} (Balance: {formatINR(acc.pending || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Transfer Amount (₹) *</label>
                <Input
                  type="number"
                  required
                  placeholder="e.g. 25000"
                  value={submitFundsForm.amount}
                  onChange={(e) =>
                    setSubmitFundsForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="h-9 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mode *</label>
                <select
                  value={submitFundsForm.submissionMode}
                  onChange={(e) =>
                    setSubmitFundsForm((prev) => ({
                      ...prev,
                      submissionMode: e.target.value,
                    }))
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / Deposit</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Handover Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Reference / Deposit Slip Number
              </label>
              <Input
                placeholder="Bank Slip Number or UTR"
                value={submitFundsForm.referenceNumber}
                onChange={(e) =>
                  setSubmitFundsForm((prev) => ({
                    ...prev,
                    referenceNumber: e.target.value,
                  }))
                }
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubmitFundsModal(false)}
                className="h-8.5 text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {submittingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Record Transfer"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DRAWER/MODAL: ACCOUNT LEDGER ──────────────────────── */}
      <Dialog
        open={Boolean(selectedAccountForLedger)}
        onOpenChange={(open) => {
          if (!open) setSelectedAccountForLedger(null);
        }}
      >
        <DialogContent className="max-w-4xl bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                Account Ledger: {selectedAccountForLedger?.accountName}
              </DialogTitle>
              <Badge variant="outline" className="text-xs font-black">
                {selectedAccountForLedger?.accountType}
              </Badge>
            </div>
          </DialogHeader>

          {loadingAccountLedger ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
            </div>
          ) : (
            <div className="space-y-4 mt-2 text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold">Total Inflows</span>
                  <div className="text-base font-black text-emerald-600">
                    {formatINR(accountLedgerData?.metrics?.totalCollected || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold">Total Outflows</span>
                  <div className="text-base font-black text-rose-600">
                    {formatINR(
                      (accountLedgerData?.metrics?.totalSubmitted || 0) +
                        (accountLedgerData?.metrics?.totalVendorPaid || 0),
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold">Live Balance</span>
                  <div className="text-base font-black text-slate-900">
                    {formatINR(accountLedgerData?.metrics?.totalPending || 0)}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Reference / Description</th>
                      <th className="py-2.5 px-3 text-right">Inflow (+)</th>
                      <th className="py-2.5 px-3 text-right">Outflow (−)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Client Payments */}
                    {(accountLedgerData?.clientPayments || []).map((cp: any) => (
                      <tr key={cp.id} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2 px-3 text-slate-500">
                          {safeFormatDate(cp.paymentDate || cp.createdAt)}
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-700">Client Payment</td>
                        <td className="py-2 px-3">
                          {cp.booking?.fullName} (Ref: {cp.bookingId}) · {cp.paymentMode}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-emerald-600">
                          + {formatINR(cp.amount)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">—</td>
                      </tr>
                    ))}

                    {/* Vendor Payments */}
                    {(accountLedgerData?.vendorPayments || []).map((vp: any) => (
                      <tr key={vp.id} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2 px-3 text-slate-500">
                          {safeFormatDate(vp.paymentDate || vp.createdAt)}
                        </td>
                        <td className="py-2 px-3 font-bold text-rose-700">Vendor Outflow</td>
                        <td className="py-2 px-3">
                          {vp.vendorName} ({vp.category}) · Trip: {vp.trip?.title}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">—</td>
                        <td className="py-2 px-3 text-right font-black text-rose-600">
                          − {formatINR(vp.advancePaid)}
                        </td>
                      </tr>
                    ))}

                    {/* Submissions / Transfers */}
                    {(accountLedgerData?.submissions || []).map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2 px-3 text-slate-500">
                          {safeFormatDate(sub.createdAt)}
                        </td>
                        <td className="py-2 px-3 font-bold text-blue-700">Fund Transfer</td>
                        <td className="py-2 px-3">
                          {sub.notes || "Inter-account transfer / Submission"}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-emerald-600">
                          + {formatINR(sub.amount)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">—</td>
                      </tr>
                    ))}

                    {/* Train Tickets (For Riya Wallet) */}
                    {(accountLedgerData?.trainTickets || []).map((tt: any) => (
                      <tr key={tt.id} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2 px-3 text-slate-500">
                          {safeFormatDate(tt.journeyDate || tt.createdAt)}
                        </td>
                        <td className="py-2 px-3 font-bold text-indigo-700">Train Ticket Issued</td>
                        <td className="py-2 px-3">
                          {tt.travelerName} (PNR: {tt.pnr || "—"}) · Booking Ref: {tt.bookingId}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">—</td>
                        <td className="py-2 px-3 text-right font-black text-indigo-600">
                          − {formatINR(Number(tt.ticketAmount) || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── IN-APP PROOF PREVIEW MODAL ──────────────────────── */}
      <Dialog
        open={Boolean(proofPreviewModal?.open)}
        onOpenChange={(open) => {
          if (!open) setProofPreviewModal(null);
        }}
      >
        <DialogContent className="max-w-2xl bg-white p-0 rounded-2xl border border-slate-200 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                <Eye className="w-4 h-4 text-orange-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white truncate">
                  {proofPreviewModal?.title || "Payment Proof / Screenshot"}
                </h3>
                {proofPreviewModal?.subtitle && (
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {proofPreviewModal.subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProofPreviewModal(null)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 flex items-center justify-center p-4 min-h-[380px] max-h-[75vh] overflow-auto">
            {proofPreviewModal?.imageUrl ? (
              <img
                src={proofPreviewModal.imageUrl}
                alt="Payment Proof Screenshot"
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
              />
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p className="text-xs font-semibold">No image preview available</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-100">
            <p className="text-[11px] text-slate-500">
              Amount: <strong>{formatINR(proofPreviewModal?.amount || 0)}</strong> · Date:{" "}
              {proofPreviewModal?.date}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProofPreviewModal(null)}
              className="h-8 text-xs font-bold px-4 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
