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
  QrCode,
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

  const handleVerifyStationPayment = async (paymentId: string) => {
    try {
      await api.post(`/station-payments/${paymentId}/verify-upi`, {
        action: "VERIFY",
      });
      toast.success("Station UPI payment verified & reconciled!");
      loadData();
    } catch {
      toast.error("Failed to verify station payment");
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
      } else if (rejectModalState.type === "station") {
        await api.post(`/station-payments/${rejectModalState.id}/verify-upi`, {
          action: "REJECT",
          rejectionReason: rejectModalState.reason,
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

  const filterSelectClass =
    "h-8 min-w-0 cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-2.5 text-[12px] font-medium text-slate-700 shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40";

  const financeTabs: {
    id: TabId;
    label: string;
    meta?: string;
    alert?: boolean;
  }[] = [
    { id: "overview", label: "Overview" },
    {
      id: "verification",
      label: "Verification",
      meta:
        verificationQueue.totalPendingCount > 0
          ? String(verificationQueue.totalPendingCount)
          : undefined,
      alert: verificationQueue.totalPendingCount > 0,
    },
    { id: "payments", label: "Collections in", meta: String(allClientReceipts.length) },
    { id: "expenses", label: "Payouts out", meta: String(vendorPayments.length) },
    {
      id: "riya",
      label: "Riya wallet",
      meta: formatINR(riyaData.availableRiyaBalance),
    },
    { id: "accounts", label: "Treasury", meta: String(collectionAccounts.length) },
    { id: "profitability", label: "Trip P&L" },
  ];

  return (
    <div className="min-h-0 min-w-0 space-y-3 text-[#0B1528] antialiased">
      {/* ─── Header + tab bar ─── */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-[#E8EEF4] bg-white">
        <div className="flex min-w-0 flex-col gap-3 px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="text-[17px] font-semibold tracking-tight text-[#0B1528] md:text-[18px]">
                Finance controller
              </h1>
              <span className="shrink-0 rounded-md border border-[#E8EEF4] bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                Live ledger
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Money ledger, verification queue, Riya wallet and trip margins.
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-8 gap-1.5 rounded-md border-[#E8EEF4] bg-white px-2.5 text-[12px] font-medium text-slate-600 shadow-none hover:bg-[#F4F7FB] hover:text-[#0B1528]"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", loading && "animate-spin text-[#FF4D00]")}
                strokeWidth={1.75}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRechargeRiyaModal(true)}
              className="h-8 gap-1.5 rounded-md border-[#E8EEF4] bg-white px-2.5 text-[12px] font-medium text-slate-700 shadow-none hover:bg-[#F4F7FB]"
            >
              <Ticket className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              Recharge Riya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecordExpenseModal(true)}
              className="h-8 gap-1.5 rounded-md border-[#E8EEF4] bg-white px-2.5 text-[12px] font-medium text-slate-700 shadow-none hover:bg-[#F4F7FB]"
            >
              <TrendingDown className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              Record expense
            </Button>
            <Button
              size="sm"
              onClick={() => setShowRecordIncomeModal(true)}
              className="h-8 gap-1.5 rounded-md bg-[#FF4D00] px-3.5 text-[12px] font-medium text-white shadow-none transition-colors hover:bg-[#E04400]"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              Record income
            </Button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="min-w-0 overflow-x-auto no-scrollbar border-t border-[#E8EEF4]">
          <div className="flex flex-nowrap px-1.5 text-[12px] font-medium md:px-2.5">
            {financeTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-2.5 transition-colors cursor-pointer sm:px-3",
                    isActive
                      ? "border-[#FF4D00] font-semibold text-[#FF4D00]"
                      : "border-transparent text-slate-500 hover:border-[#E8EEF4] hover:text-[#0B1528]",
                  )}
                >
                  {tab.label}
                  {tab.meta && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                        tab.alert
                          ? "bg-[#FF4D00] text-white"
                          : isActive
                            ? "bg-[#FFF2ED] text-[#FF4D00]"
                            : "bg-[#F4F7FB] text-slate-500",
                      )}
                    >
                      {tab.meta}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="min-w-0 space-y-3">
        {/* ──────────────────────── TAB 1: OVERVIEW ──────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-3">
            {/* Money position strip */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-[#E8EEF4] bg-white">
              <div className="grid grid-cols-2 divide-x divide-y divide-[#E8EEF4] lg:grid-cols-4 lg:divide-y-0">
                {[
                  {
                    label: "Verified inflow",
                    value: formatINR(treasurySummary.totalInflow),
                    hint: "Booking advances and station collections",
                    tone: "text-[#0B1528]",
                  },
                  {
                    label: "Verified outflow",
                    value: formatINR(treasurySummary.totalOutflow),
                    hint: "Vendors, train tickets and ops expenses",
                    tone: "text-[#0B1528]",
                  },
                  {
                    label: "Net treasury balance",
                    value: formatINR(treasurySummary.netLiquidity),
                    hint: "Across bank accounts, cash desk and wallets",
                    tone:
                      treasurySummary.netLiquidity >= 0
                        ? "text-[#0B1528]"
                        : "text-rose-600",
                  },
                  {
                    label: "Riya wallet balance",
                    value: formatINR(riyaData.availableRiyaBalance),
                    hint: `${riyaData.totalTicketsIssuedCount} tickets issued from portal`,
                    tone: "text-[#0B1528]",
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="min-w-0 px-3 py-2.5 md:px-4 md:py-3">
                    <p className="truncate text-[11px] font-medium text-slate-500">
                      {kpi.label}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-lg font-semibold leading-tight tracking-tight tabular-nums md:text-xl",
                        kpi.tone,
                      )}
                    >
                      {kpi.value}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {kpi.hint}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Verification Alert if pending */}
            {verificationQueue.totalPendingCount > 0 && (
              <div className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-[#FFD9C7] bg-[#FFF7F3] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between md:px-4">
                <div className="flex min-w-0 items-start gap-2.5">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D00]"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#0B1528]">
                      {verificationQueue.totalPendingCount} transactions awaiting your
                      sign-off
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Client payments, station collections and vendor payouts stay
                      unreconciled until verified.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleTabChange("verification")}
                  className="h-8 shrink-0 gap-1.5 self-start rounded-md bg-[#FF4D00] px-3 text-[12px] font-medium text-white shadow-none hover:bg-[#E04400] sm:self-auto"
                >
                  Open queue
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Button>
              </div>
            )}

            {/* Account Quick Cards */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-[#E8EEF4] bg-white">
              <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[#E8EEF4] px-3 py-2.5 md:px-4">
                <h3 className="truncate text-[12px] font-semibold text-[#0B1528]">
                  Accounts and money positions
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabChange("accounts")}
                  className="shrink-0 text-[11px] font-medium text-[#FF4D00] transition-colors hover:text-[#E04400]"
                >
                  View all ledgers
                </button>
              </div>

              <div className="grid grid-cols-1 divide-y divide-[#E8EEF4] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 sm:divide-x">
                {collectionAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleOpenAccountLedger(acc)}
                    className="min-w-0 px-3 py-2.5 text-left transition-colors hover:bg-[#F8FAFC] md:px-4 md:py-3 sm:border-b sm:border-[#E8EEF4] lg:border-b-0"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="truncate text-[12px] font-medium text-[#0B1528]">
                        {acc.accountName}
                      </span>
                      <span className="shrink-0 rounded border border-[#E8EEF4] bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        {acc.accountType}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {acc.bankName || acc.accountHolderName}
                    </p>
                    <p className="mt-1.5 text-base font-semibold tracking-tight tabular-nums text-[#0B1528]">
                      {formatINR(acc.pending || 0)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Trips P&L Snippet */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-[#E8EEF4] bg-white">
              <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[#E8EEF4] px-3 py-2.5 md:px-4">
                <h3 className="truncate text-[12px] font-semibold text-[#0B1528]">
                  Top trips by margin
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabChange("profitability")}
                  className="shrink-0 text-[11px] font-medium text-[#FF4D00] transition-colors hover:text-[#E04400]"
                >
                  Full P&L report
                </button>
              </div>

              <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[12px]">
                  <thead className="border-b border-[#E8EEF4] bg-[#F8FAFC] text-[11px] font-medium text-slate-500">
                    <tr>
                      <th className="py-2 px-3 md:px-4">Trip</th>
                      <th className="py-2 px-3 text-center md:px-4">Pax</th>
                      <th className="py-2 px-3 text-right md:px-4">Revenue</th>
                      <th className="py-2 px-3 text-right md:px-4">Ticket cost</th>
                      <th className="py-2 px-3 text-right md:px-4">Vendor cost</th>
                      <th className="py-2 px-3 text-right md:px-4">Gross profit</th>
                      <th className="py-2 px-3 text-right md:px-4">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF4]">
                    {tripProfitabilityList.slice(0, 5).map((t) => (
                      <tr key={t.tripId} className="transition-colors hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-3 font-medium text-[#0B1528] md:px-4">
                          {t.tripTitle}
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums text-slate-600 md:px-4">
                          {t.totalPax}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium tabular-nums text-[#0B1528] md:px-4">
                          {formatINR(t.collectedRevenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 md:px-4">
                          {formatINR(t.ticketCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 md:px-4">
                          {formatINR(t.vendorCost)}
                        </td>
                        <td
                          className={cn(
                            "py-2.5 px-3 text-right font-medium tabular-nums md:px-4",
                            t.grossProfit >= 0 ? "text-[#0B1528]" : "text-rose-600",
                          )}
                        >
                          {formatINR(t.grossProfit)}
                        </td>
                        <td className="py-2.5 px-3 text-right md:px-4">
                          <span
                            className={cn(
                              "inline-flex rounded border px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                              t.marginPercent >= 0
                                ? "border-[#E8EEF4] bg-[#F8FAFC] text-slate-600"
                                : "border-rose-100 bg-rose-50 text-rose-600",
                            )}
                          >
                            {t.marginPercent}%
                          </span>
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
          <div className="space-y-3">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-tight text-[#0B1528]">
                  Verification queue
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  Check the proof, then verify or reject with a reason. Nothing
                  reconciles until you sign off.
                </p>
              </div>
              <span className="shrink-0 self-start rounded-md border border-[#FFD9C7] bg-[#FFF7F3] px-2 py-1 text-[11px] font-medium text-[#FF4D00]">
                {verificationQueue.totalPendingCount} pending
              </span>
            </div>

            {/* Sub-Queue: Pending Client Receipts */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-[#E8EEF4] bg-white">
              <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[#E8EEF4] px-3 py-2.5 md:px-4">
                <span className="truncate text-[12px] font-semibold text-[#0B1528]">
                  Client and booking receipts
                </span>
                <span className="shrink-0 rounded bg-[#F4F7FB] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-slate-500">
                  {verificationQueue.pendingClientPayments?.length || 0}
                </span>
              </div>

              {verificationQueue.pendingClientPayments?.length === 0 ? (
                <div className="px-4 py-10 text-center text-[12px] text-slate-400">
                  Nothing waiting here. All client receipts are verified.
                </div>
              ) : (
                <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-[12px]">
                  <thead className="border-b border-[#E8EEF4] bg-[#F8FAFC] text-[11px] font-medium text-slate-500">
                    <tr>
                      <th className="py-2.5 px-4">Booking / Customer</th>
                      <th className="py-2.5 px-4">Trip</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4">Mode / Account</th>
                      <th className="py-2.5 px-4">Proof</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF4]">
                    {verificationQueue.pendingClientPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-[#F8FAFC]/60 font-medium">
                        <td className="py-2.5 px-4 font-medium text-[#0B1528]">
                          {p.booking?.fullName || "Customer"}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Ref: {p.booking?.bookingId || p.bookingId} · {p.booking?.phone}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {p.booking?.tripName || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">
                          {formatINR(p.amount)}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-medium">
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
                              className="h-7 gap-1 rounded-md px-2 text-[11px] font-medium text-slate-600 hover:bg-[#F4F7FB] hover:text-[#0B1528] cursor-pointer"
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
                              className="h-7 gap-1 rounded-md bg-[#0B1528] px-2.5 text-[11px] font-medium text-white shadow-none hover:bg-[#152238] cursor-pointer"
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
                              className="h-7 gap-1 rounded-md border-[#E8EEF4] px-2.5 text-[11px] font-medium text-slate-600 shadow-none hover:bg-[#F4F7FB] hover:text-rose-600 cursor-pointer"
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
                </div>
              )}
            </div>

            {/* Sub-Queue: Pending Station Online Collections (UPI) */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  Pending Station Online Collections (UPI) (
                  {verificationQueue.pendingStationPayments?.length || 0})
                </span>
              </div>

              {verificationQueue.pendingStationPayments?.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  No pending station online collections in verification queue. All caught up!
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Booking / Passenger</th>
                      <th className="py-2.5 px-4">Station & Collector</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4">UPI UTR & Account</th>
                      <th className="py-2.5 px-4">Proof Screenshot</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verificationQueue.pendingStationPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {p.booking?.fullName || p.collectedFrom || "Passenger"}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Ref: {p.booking?.bookingId || p.bookingId} · Receipt: {p.receiptNumber}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          <span className="font-bold text-slate-900">{p.station}</span>
                          <div className="text-[10px] text-slate-500">
                            By: {p.collectedBy?.name || "Station Staff"}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-blue-600">
                          {formatINR(p.amount)}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-200">
                            UTR: {p.utrNumber || "N/A"}
                          </Badge>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {p.receivingAccount?.accountName || "Company Bank Account"}
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          {p.proofImageUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setProofPreviewModal({
                                  open: true,
                                  title: `Station Payment Proof - ${p.booking?.fullName || p.collectedFrom}`,
                                  subtitle: `Station: ${p.station} · UTR: ${p.utrNumber}`,
                                  imageUrl: p.proofImageUrl,
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
                              onClick={() => handleVerifyStationPayment(p.id)}
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
                                  type: "station",
                                  id: p.id,
                                  reason: "",
                                  title: `Reject Station Payment - ${p.booking?.fullName || p.collectedFrom} (${formatINR(p.amount)})`,
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
            <div className="min-w-0 overflow-hidden rounded-xl border border-[#E8EEF4] bg-white">
              <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[#E8EEF4] px-3 py-2.5 md:px-4">
                <span className="truncate text-[12px] font-semibold text-[#0B1528]">
                  Vendor and operational payouts
                </span>
                <span className="shrink-0 rounded bg-[#F4F7FB] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-slate-500">
                  {verificationQueue.pendingVendorPayments?.length || 0}
                </span>
              </div>

              {verificationQueue.pendingVendorPayments?.length === 0 ? (
                <div className="px-4 py-10 text-center text-[12px] text-slate-400">
                  Nothing waiting here. All vendor payouts are approved.
                </div>
              ) : (
                <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-[12px]">
                  <thead className="border-b border-[#E8EEF4] bg-[#F8FAFC] text-[11px] font-medium text-slate-500">
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
                  <tbody className="divide-y divide-[#E8EEF4]">
                    {verificationQueue.pendingVendorPayments.map((v: any) => (
                      <tr key={v.id} className="hover:bg-[#F8FAFC]/60 font-medium">
                        <td className="py-2.5 px-4 font-medium text-[#0B1528]">
                          {v.vendorName}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {v.serviceDescription || "Service Payment"}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {v.trip?.title || "—"}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {v.category}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-rose-600">
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
                              className="h-7 gap-1 rounded-md px-2 text-[11px] font-medium text-slate-600 hover:bg-[#F4F7FB] hover:text-[#0B1528] cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View Invoice
                            </Button>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-600">
                              Missing Proof
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleVerifyVendorPayment(v.id)}
                              className="h-7 gap-1 rounded-md bg-[#0B1528] px-2.5 text-[11px] font-medium text-white shadow-none hover:bg-[#152238] cursor-pointer"
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
                              className="h-7 gap-1 rounded-md border-[#E8EEF4] px-2.5 text-[11px] font-medium text-slate-600 shadow-none hover:bg-[#F4F7FB] hover:text-rose-600 cursor-pointer"
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
                </div>
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
                  className="h-8.5 px-3 rounded-lg border border-[#E8EEF4] bg-white text-xs font-medium text-slate-600"
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash Desk</option>
                </select>

                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="h-8.5 px-3 rounded-lg border border-[#E8EEF4] bg-white text-xs font-medium text-slate-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending verification">Pending Verification</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Receipts Table */}
            <div className="bg-white border border-[#E8EEF4] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E8EEF4] bg-[#F8FAFC] text-[11px] font-medium text-slate-500">
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
                <tbody className="divide-y divide-[#E8EEF4]">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No client receipts match current search & filter.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F8FAFC]/60 font-medium">
                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                          {safeFormatDate(r.date)}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#0B1528]">
                          {r.customerName}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Ref: {r.bookingId} · {r.phone}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 truncate max-w-[160px]">
                          {r.tripName}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">
                          {formatINR(r.amount)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800 font-semibold">
                          {r.accountName}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-medium text-slate-600">{r.paymentMode}</span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {r.transactionId}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium",
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
                              className="h-7 gap-1 rounded-md px-2 text-[11px] font-medium text-slate-600 hover:bg-[#F4F7FB] hover:text-[#0B1528] cursor-pointer"
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
          <div className="space-y-3">
            {/* Expenses panel */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-[#E8EEF4] bg-white">
              <div className="flex min-w-0 flex-col gap-2 border-b border-[#E8EEF4] px-3 py-2.5 lg:flex-row lg:items-center">
                <div className="relative w-full min-w-0 lg:w-72">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    strokeWidth={1.75}
                  />
                  <Input
                    placeholder="Search vendor, trip or category"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="h-8 rounded-md border-[#E8EEF4] bg-white pl-8 text-[12px] font-medium text-[#0B1528] shadow-none placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#FF4D00]/40"
                  />
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    className={filterSelectClass}
                    aria-label="Filter by category"
                  >
                    <option value="ALL">All categories</option>
                    <option value="Hotels">Hotels and camps</option>
                    <option value="Transport">Transport and fleets</option>
                    <option value="Guides">Guides and leaders</option>
                    <option value="Activities">Activities and permits</option>
                    <option value="Office">Office ops</option>
                  </select>
                </div>

                <span className="text-[11px] font-medium text-slate-400 lg:ml-auto">
                  Showing {filteredExpenses.length} payouts
                </span>
              </div>

              <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-[12px]">
                <thead className="border-b border-[#E8EEF4] bg-[#F8FAFC] text-[11px] font-medium text-slate-500">
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
                <tbody className="divide-y divide-[#E8EEF4]">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No vendor disbursements match current search & filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((v) => (
                      <tr key={v.id} className="hover:bg-[#F8FAFC]/60 font-medium">
                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                          {safeFormatDate(v.paymentDate || v.createdAt)}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#0B1528]">
                          {v.vendorName}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {v.serviceDescription || "Vendor Service"}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 truncate max-w-[160px]">
                          {v.trip?.title || "—"}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {v.category}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-500 font-semibold">
                          {formatINR(v.agreedAmount)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-rose-600">
                          {formatINR(v.advancePaid)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800 font-semibold">
                          {v.collectionAccount?.accountName || "Primary Bank"}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium",
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
                              className="h-7 gap-1 rounded-md px-2 text-[11px] font-medium text-slate-600 hover:bg-[#F4F7FB] hover:text-[#0B1528] cursor-pointer"
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
          </div>
        )}

        {/* ──────────────────────── TAB 5: RIYA TRAIN PORTAL & WALLET ──────────────────────── */}
        {activeTab === "riya" && (
          <div className="space-y-3">
            {/* Top Riya Wallet KPI Card */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Card className="col-span-1 rounded-xl border border-[#152238] bg-[#0B1528] p-4 text-white md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-300">
                    Riya portal available balance
                  </span>
                  <Ticket className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                  <span className="text-2xl font-semibold tracking-tight tabular-nums text-white">
                    {formatINR(riyaData.availableRiyaBalance)}
                  </span>
                  <span className="rounded border border-[#24314A] bg-[#152238] px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                    Live IRCTC wallet
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowRechargeRiyaModal(true)}
                    className="h-8 gap-1.5 rounded-md bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none hover:bg-[#F4F7FB]"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Recharge wallet
                  </Button>
                </div>
              </Card>

              <Card className="rounded-xl border border-[#E8EEF4] bg-white p-4">
                <span className="text-[11px] font-medium text-slate-500">
                  Total recharges
                </span>
                <div className="mt-2 text-xl font-semibold tracking-tight tabular-nums text-[#0B1528]">
                  {formatINR(riyaData.totalRechargeAmount)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {riyaData.recharges?.length || 0} recharge transfers logged
                </p>
              </Card>

              <Card className="rounded-xl border border-[#E8EEF4] bg-white p-4">
                <span className="text-[11px] font-medium text-slate-500">
                  Tickets consumed
                </span>
                <div className="mt-2 text-xl font-semibold tracking-tight tabular-nums text-[#0B1528]">
                  {formatINR(riyaData.totalTicketCostConsumed)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {riyaData.totalTicketsIssuedCount} tickets issued from portal
                </p>
              </Card>
            </div>

            {/* Ticket Consumption Ledger */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-[#E8EEF4] bg-white">
              <div className="flex min-w-0 flex-col gap-2 border-b border-[#E8EEF4] px-3 py-2.5 lg:flex-row lg:items-center md:px-4">
                <h3 className="min-w-0 text-[12px] font-semibold text-[#0B1528]">
                  Train ticket cost ledger
                </h3>
                <div className="relative w-full min-w-0 lg:ml-auto lg:w-72">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    strokeWidth={1.75}
                  />
                  <Input
                    placeholder="Search traveller, PNR or train"
                    value={riyaSearch}
                    onChange={(e) => setRiyaSearch(e.target.value)}
                    className="h-8 rounded-md border-[#E8EEF4] bg-white pl-8 text-[12px] font-medium text-[#0B1528] shadow-none placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#FF4D00]/40"
                  />
                </div>
              </div>

              <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-[12px]">
                  <thead className="border-b border-[#E8EEF4] bg-[#F8FAFC] text-[11px] font-medium text-slate-500">
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
                  <tbody className="divide-y divide-[#E8EEF4]">
                    {filteredRiyaTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No train tickets match current search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRiyaTickets.map((t: any) => (
                        <tr key={t.id} className="hover:bg-[#F8FAFC]/60 font-medium">
                          <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                            {safeFormatDate(t.journeyDate || t.createdAt)}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[#0B1528]">
                            {t.travelerName}
                            <div className="text-[10px] text-slate-400 font-normal">
                              Booking: {t.booking?.fullName} (Ref: {t.bookingId})
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-slate-700">
                            {t.booking?.tripName || "—"}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-mono font-medium text-[#0B1528]">
                              {t.pnr || "PENDING"}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              {t.trainNumber} {t.trainName}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-[#0B1528]">
                            {formatINR(Number(t.ticketAmount) || 0)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-medium",
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
                          <td className="py-2.5 px-4 text-right font-mono font-medium tabular-nums text-slate-600">
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
          <div className="space-y-3">
            <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-tight text-[#0B1528]">
                  Treasury accounts and cash desks
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  Every account with its reconciled balance and full money ledger.
                </p>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSubmitFundsModal(true)}
                  className="h-8 gap-1.5 rounded-md border-[#E8EEF4] bg-white px-2.5 text-[12px] font-medium text-slate-700 shadow-none hover:bg-[#F4F7FB]"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                  Transfer funds
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowAddAccountModal(true)}
                  className="h-8 gap-1.5 rounded-md bg-[#FF4D00] px-3.5 text-[12px] font-medium text-white shadow-none hover:bg-[#E04400]"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Add account
                </Button>
              </div>
            </div>

            {/* Account Cards Grid */}
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {collectionAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex min-w-0 flex-col justify-between rounded-xl border border-[#E8EEF4] bg-white p-4"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="shrink-0 rounded border border-[#E8EEF4] bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        {acc.accountType}
                      </span>
                      <span className="truncate text-[11px] text-slate-400">
                        {acc.isActive ? "Active" : "Archived"}
                      </span>
                    </div>

                    <h4 className="mt-2 truncate text-[13px] font-semibold text-[#0B1528]">
                      {acc.accountName}
                    </h4>
                    <p className="mt-0.5 truncate text-[12px] text-slate-500">
                      {acc.accountHolderName}
                    </p>

                    {acc.bankName && (
                      <p className="mt-1 truncate text-[11px] text-slate-400">
                        {acc.bankName} {acc.accountNumber && `· ${acc.accountNumber}`}
                      </p>
                    )}
                    {acc.upiId && (
                      <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                        UPI: {acc.upiId}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 border-t border-[#E8EEF4] pt-3">
                    <div className="mb-2.5 flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-medium text-slate-500">
                        Reconciled balance
                      </span>
                      <span className="text-base font-semibold tracking-tight tabular-nums text-[#0B1528]">
                        {formatINR(acc.pending || 0)}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAccountLedger(acc)}
                      className="h-8 w-full gap-1.5 rounded-md border-[#E8EEF4] bg-white text-[12px] font-medium text-slate-600 shadow-none hover:bg-[#F4F7FB] hover:text-[#0B1528]"
                    >
                      <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                      View ledger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB 7: TRIP & DEPARTURE P&L ──────────────────────── */}
        {activeTab === "profitability" && (
          <div className="space-y-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-tight text-[#0B1528]">
                Trip profitability
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Verified revenue minus train tickets, vendor payouts and guide costs,
                per trip.
              </p>
            </div>

            {/* Roll-up strip */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-[#E8EEF4] bg-white">
              <div className="grid grid-cols-2 divide-x divide-y divide-[#E8EEF4] lg:grid-cols-4 lg:divide-y-0">
                {(() => {
                  const totals = tripProfitabilityList.reduce(
                    (acc, t) => ({
                      revenue: acc.revenue + (Number(t.collectedRevenue) || 0),
                      cost: acc.cost + (Number(t.totalCost) || 0),
                      profit: acc.profit + (Number(t.grossProfit) || 0),
                      pax: acc.pax + (Number(t.totalPax) || 0),
                    }),
                    { revenue: 0, cost: 0, profit: 0, pax: 0 },
                  );
                  const blendedMargin =
                    totals.revenue > 0
                      ? Math.round((totals.profit / totals.revenue) * 1000) / 10
                      : 0;

                  return [
                    { label: "Verified revenue", value: formatINR(totals.revenue) },
                    { label: "Operational cost", value: formatINR(totals.cost) },
                    {
                      label: "Gross profit",
                      value: formatINR(totals.profit),
                      tone: totals.profit >= 0 ? "text-[#0B1528]" : "text-rose-600",
                    },
                    { label: "Blended margin", value: `${blendedMargin}%` },
                  ].map((kpi) => (
                    <div key={kpi.label} className="min-w-0 px-3 py-2.5 md:px-4 md:py-3">
                      <p className="truncate text-[11px] font-medium text-slate-500">
                        {kpi.label}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-lg font-semibold leading-tight tracking-tight tabular-nums md:text-xl",
                          kpi.tone || "text-[#0B1528]",
                        )}
                      >
                        {kpi.value}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-xl border border-[#E8EEF4] bg-white">
              <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[#E8EEF4] px-3 py-2.5 md:px-4">
                <h3 className="truncate text-[12px] font-semibold text-[#0B1528]">
                  Per-trip breakdown
                </h3>
                <span className="shrink-0 text-[11px] font-medium text-slate-400">
                  {tripProfitabilityList.length} trips
                </span>
              </div>

              <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[1080px] text-left text-[12px]">
                  <thead className="border-b border-[#E8EEF4] bg-[#F8FAFC] text-[11px] font-medium text-slate-500">
                    <tr>
                      <th className="px-3 py-2 md:px-4">Trip</th>
                      <th className="px-3 py-2 text-center md:px-4">Pax</th>
                      <th className="px-3 py-2 text-right md:px-4">Gross price</th>
                      <th className="px-3 py-2 text-right md:px-4">Verified revenue</th>
                      <th className="px-3 py-2 text-right md:px-4">Train tickets</th>
                      <th className="px-3 py-2 text-right md:px-4">Vendor cost</th>
                      <th className="px-3 py-2 text-right md:px-4">Total cost</th>
                      <th className="px-3 py-2 text-right md:px-4">Gross profit</th>
                      <th className="px-3 py-2 text-right md:px-4">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF4]">
                    {tripProfitabilityList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-10 text-center text-[12px] text-slate-400"
                        >
                          No trips have financial activity yet.
                        </td>
                      </tr>
                    ) : (
                      tripProfitabilityList.map((t) => (
                        <tr
                          key={t.tripId}
                          className="transition-colors hover:bg-[#F8FAFC]"
                        >
                          <td className="min-w-0 px-3 py-2.5 md:px-4">
                            <p className="truncate font-medium text-[#0B1528]">
                              {t.tripTitle}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {t.tripCode} · {t.destination}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 text-center tabular-nums text-slate-600 md:px-4">
                            {t.totalPax}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-400 md:px-4">
                            {formatINR(t.grossRevenue)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium tabular-nums text-[#0B1528] md:px-4">
                            {formatINR(t.collectedRevenue)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-600 md:px-4">
                            {formatINR(t.ticketCost)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-600 md:px-4">
                            {formatINR(t.vendorCost)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-600 md:px-4">
                            {formatINR(t.totalCost)}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2.5 text-right font-medium tabular-nums md:px-4",
                              t.grossProfit >= 0 ? "text-[#0B1528]" : "text-rose-600",
                            )}
                          >
                            {formatINR(t.grossProfit)}
                          </td>
                          <td className="px-3 py-2.5 text-right md:px-4">
                            <span
                              className={cn(
                                "inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                                t.marginPercent >= 20
                                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                  : t.marginPercent >= 0
                                    ? "border-[#E8EEF4] bg-[#F8FAFC] text-slate-600"
                                    : "border-rose-100 bg-rose-50 text-rose-600",
                              )}
                            >
                              {t.marginPercent}%
                            </span>
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
      </div>

      {/* ──────────────────────── DIALOG: RECORD CLIENT INCOME ──────────────────────── */}
      <Dialog open={showRecordIncomeModal} onOpenChange={setShowRecordIncomeModal}>
        <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] max-w-md flex-col overflow-y-auto rounded-xl border border-[#E8EEF4] bg-white p-4 text-[#0B1528] shadow-xl sm:max-h-[90vh] sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#0B1528] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Record Client Booking Payment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordIncome} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-medium text-slate-600 block mb-1">
                Select Booking / Customer *
              </label>
              <select
                required
                value={newIncomeForm.bookingId}
                onChange={(e) =>
                  setNewIncomeForm((prev) => ({ ...prev, bookingId: e.target.value }))
                }
                className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
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
                <label className="font-medium text-slate-600 block mb-1">Amount (₹) *</label>
                <Input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={newIncomeForm.amount}
                  onChange={(e) =>
                    setNewIncomeForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="h-9 rounded-md border-[#E8EEF4] text-[12px] font-medium shadow-none focus-visible:ring-1 focus-visible:ring-[#FF4D00]/40"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Payment Mode *</label>
                <select
                  value={newIncomeForm.paymentMode}
                  onChange={(e) =>
                    setNewIncomeForm((prev) => ({ ...prev, paymentMode: e.target.value }))
                  }
                  className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="CASH">Cash Desk</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-600 block mb-1">
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
                className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
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
              <label className="font-medium text-slate-600 block mb-1">Transaction Ref / UTR</label>
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
              <label className="font-medium text-slate-600 block mb-1">
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
                className="h-8 rounded-md border-[#E8EEF4] px-3 text-[12px] font-medium text-[#0B1528] shadow-none hover:bg-[#F4F7FB] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8 gap-1.5 rounded-md bg-[#FF4D00] px-3.5 text-[12px] font-medium text-white shadow-none hover:bg-[#E04400] cursor-pointer"
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
        <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] max-w-md flex-col overflow-y-auto rounded-xl border border-[#E8EEF4] bg-white p-4 text-[#0B1528] shadow-xl sm:max-h-[90vh] sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#0B1528] flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              Record Vendor / Operational Outflow
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordExpense} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-medium text-slate-600 block mb-1">Select Trip *</label>
              <select
                required
                value={newExpenseForm.tripId}
                onChange={(e) =>
                  setNewExpenseForm((prev) => ({ ...prev, tripId: e.target.value }))
                }
                className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
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
                <label className="font-medium text-slate-600 block mb-1">Category *</label>
                <select
                  value={newExpenseForm.category}
                  onChange={(e) =>
                    setNewExpenseForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
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
                <label className="font-medium text-slate-600 block mb-1">Vendor / Payee *</label>
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
                <label className="font-medium text-slate-600 block mb-1">Amount Paid (₹) *</label>
                <Input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={newExpenseForm.amount}
                  onChange={(e) =>
                    setNewExpenseForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="h-9 rounded-md border-[#E8EEF4] text-[12px] font-medium shadow-none focus-visible:ring-1 focus-visible:ring-[#FF4D00]/40"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Payment Mode *</label>
                <select
                  value={newExpenseForm.paymentMode}
                  onChange={(e) =>
                    setNewExpenseForm((prev) => ({ ...prev, paymentMode: e.target.value }))
                  }
                  className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-600 block mb-1">
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
                className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
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
              <label className="font-medium text-slate-600 block mb-1">
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
                className="h-8 rounded-md border-[#E8EEF4] px-3 text-[12px] font-medium text-[#0B1528] shadow-none hover:bg-[#F4F7FB] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8 gap-1.5 rounded-md bg-[#FF4D00] px-3.5 text-[12px] font-medium text-white shadow-none hover:bg-[#E04400] cursor-pointer"
              >
                {submittingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Submit to verification"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: RECHARGE RIYA WALLET ──────────────────────── */}
      <Dialog open={showRechargeRiyaModal} onOpenChange={setShowRechargeRiyaModal}>
        <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] max-w-md flex-col overflow-y-auto rounded-xl border border-[#E8EEF4] bg-white p-4 text-[#0B1528] shadow-xl sm:max-h-[90vh] sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#0B1528] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#0B1528]" />
              Recharge Riya Train Portal Wallet
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRechargeRiyaWallet} className="space-y-3.5 mt-2 text-xs">
            <div className="p-3 bg-[#F8FAFC] border border-[#E8EEF4] rounded-xl">
              <p className="text-[11px] text-slate-600 font-medium">
                Money movements from your bank to the Riya portal are treated as inter-account
                transfers, not immediate trip expenses. Real costs are deducted automatically as
                individual passenger tickets are issued.
              </p>
            </div>

            <div>
              <label className="font-medium text-slate-600 block mb-1">
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
                className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
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
              <label className="font-medium text-slate-600 block mb-1">Recharge Amount (₹) *</label>
              <Input
                type="number"
                required
                placeholder="e.g. 10000"
                value={rechargeRiyaForm.amount}
                onChange={(e) =>
                  setRechargeRiyaForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="h-9 rounded-md border-[#E8EEF4] text-[12px] font-medium shadow-none focus-visible:ring-1 focus-visible:ring-[#FF4D00]/40"
              />
            </div>

            <div>
              <label className="font-medium text-slate-600 block mb-1">
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
                className="h-8 rounded-md border-[#E8EEF4] px-3 text-[12px] font-medium text-[#0B1528] shadow-none hover:bg-[#F4F7FB] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8 gap-1.5 rounded-md bg-[#FF4D00] px-3.5 text-[12px] font-medium text-white shadow-none hover:bg-[#E04400] cursor-pointer"
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
        <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] max-w-md flex-col overflow-y-auto rounded-xl border border-[#E8EEF4] bg-white p-4 text-[#0B1528] shadow-xl sm:max-h-[90vh] sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-rose-950 flex items-center gap-2">
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
              <label className="font-medium text-slate-600 block mb-1">Rejection Reason *</label>
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
                className="h-8 rounded-md border-[#E8EEF4] px-3 text-[12px] font-medium text-[#0B1528] shadow-none hover:bg-[#F4F7FB] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={submittingAction}
                onClick={handleConfirmReject}
                className="h-8 gap-1.5 rounded-md bg-rose-600 px-3.5 text-[12px] font-medium text-white shadow-none hover:bg-rose-700 cursor-pointer"
              >
                {submittingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Confirm rejection"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: ADD ACCOUNT ──────────────────────── */}
      <Dialog open={showAddAccountModal} onOpenChange={setShowAddAccountModal}>
        <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] max-w-md flex-col overflow-y-auto rounded-xl border border-[#E8EEF4] bg-white p-4 text-[#0B1528] shadow-xl sm:max-h-[90vh] sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#0B1528] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF4D00]" />
              Add Bank / Treasury Account
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddAccount} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-medium text-slate-600 block mb-1">Account Display Name *</label>
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
                <label className="font-medium text-slate-600 block mb-1">Account Type *</label>
                <select
                  value={newAccForm.accountType}
                  onChange={(e) =>
                    setNewAccForm((prev) => ({ ...prev, accountType: e.target.value }))
                  }
                  className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
                >
                  <option value="COMPANY">Company Bank Account</option>
                  <option value="CASH">Office Cash Desk</option>
                  <option value="INDIVIDUAL">Director / Personal Account</option>
                  <option value="OTHER">Custom / Partner Wallet</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Bank Name</label>
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
                <label className="font-medium text-slate-600 block mb-1">Account Number</label>
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
                <label className="font-medium text-slate-600 block mb-1">IFSC Code</label>
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
              <label className="font-medium text-slate-600 block mb-1">UPI ID</label>
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
                className="h-8 rounded-md border-[#E8EEF4] px-3 text-[12px] font-medium text-[#0B1528] shadow-none hover:bg-[#F4F7FB] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8 gap-1.5 rounded-md bg-[#FF4D00] px-3.5 text-[12px] font-medium text-white shadow-none hover:bg-[#E04400] cursor-pointer"
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
        <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] max-w-md flex-col overflow-y-auto rounded-xl border border-[#E8EEF4] bg-white p-4 text-[#0B1528] shadow-xl sm:max-h-[90vh] sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#0B1528] flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              Transfer / Submit Treasury Funds
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitFunds} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-medium text-slate-600 block mb-1">From Account *</label>
              <select
                required
                value={submitFundsForm.accountId}
                onChange={(e) =>
                  setSubmitFundsForm((prev) => ({ ...prev, accountId: e.target.value }))
                }
                className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
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
                <label className="font-medium text-slate-600 block mb-1">Transfer Amount (₹) *</label>
                <Input
                  type="number"
                  required
                  placeholder="e.g. 25000"
                  value={submitFundsForm.amount}
                  onChange={(e) =>
                    setSubmitFundsForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="h-9 rounded-md border-[#E8EEF4] text-[12px] font-medium shadow-none focus-visible:ring-1 focus-visible:ring-[#FF4D00]/40"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Mode *</label>
                <select
                  value={submitFundsForm.submissionMode}
                  onChange={(e) =>
                    setSubmitFundsForm((prev) => ({
                      ...prev,
                      submissionMode: e.target.value,
                    }))
                  }
                  className="h-9 w-full cursor-pointer rounded-md border border-[#E8EEF4] bg-white px-3 text-[12px] font-medium text-[#0B1528] shadow-none focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/40"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / Deposit</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Handover Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-600 block mb-1">
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
                className="h-8 rounded-md border-[#E8EEF4] px-3 text-[12px] font-medium text-[#0B1528] shadow-none hover:bg-[#F4F7FB] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8 gap-1.5 rounded-md bg-[#FF4D00] px-3.5 text-[12px] font-medium text-white shadow-none hover:bg-[#E04400] cursor-pointer"
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
        <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] max-w-4xl flex-col overflow-y-auto rounded-xl border border-[#E8EEF4] bg-white p-4 text-[#0B1528] shadow-xl sm:max-h-[88vh] sm:p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-[#0B1528] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#FF4D00]" />
                Account Ledger: {selectedAccountForLedger?.accountName}
              </DialogTitle>
              <Badge variant="outline" className="text-xs font-semibold">
                {selectedAccountForLedger?.accountType}
              </Badge>
            </div>
          </DialogHeader>

          {loadingAccountLedger ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF4D00]" />
            </div>
          ) : (
            <div className="space-y-4 mt-2 text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E8EEF4]">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Total Inflows</span>
                  <div className="text-base font-semibold text-emerald-600">
                    {formatINR(accountLedgerData?.metrics?.totalCollected || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Total Outflows</span>
                  <div className="text-base font-semibold text-rose-600">
                    {formatINR(
                      (accountLedgerData?.metrics?.totalSubmitted || 0) +
                        (accountLedgerData?.metrics?.totalVendorPaid || 0),
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Live Balance</span>
                  <div className="text-base font-semibold text-[#0B1528]">
                    {formatINR(accountLedgerData?.metrics?.totalPending || 0)}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="border border-[#E8EEF4] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#E8EEF4] bg-[#F8FAFC] text-[11px] font-medium text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Reference / Description</th>
                      <th className="py-2.5 px-3 text-right">Inflow (+)</th>
                      <th className="py-2.5 px-3 text-right">Outflow (−)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF4]">
                    {/* Client Payments */}
                    {(accountLedgerData?.clientPayments || []).map((cp: any) => (
                      <tr key={cp.id} className="hover:bg-[#F8FAFC]/60 font-medium">
                        <td className="py-2 px-3 text-slate-500">
                          {safeFormatDate(cp.paymentDate || cp.createdAt)}
                        </td>
                        <td className="py-2 px-3 font-medium text-emerald-700">Client payment</td>
                        <td className="py-2 px-3">
                          {cp.booking?.fullName} (Ref: {cp.bookingId}) · {cp.paymentMode}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                          + {formatINR(cp.amount)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">—</td>
                      </tr>
                    ))}

                    {/* Vendor Payments */}
                    {(accountLedgerData?.vendorPayments || []).map((vp: any) => (
                      <tr key={vp.id} className="hover:bg-[#F8FAFC]/60 font-medium">
                        <td className="py-2 px-3 text-slate-500">
                          {safeFormatDate(vp.paymentDate || vp.createdAt)}
                        </td>
                        <td className="py-2 px-3 font-medium text-rose-600">Vendor outflow</td>
                        <td className="py-2 px-3">
                          {vp.vendorName} ({vp.category}) · Trip: {vp.trip?.title}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">—</td>
                        <td className="py-2 px-3 text-right font-semibold text-rose-600">
                          − {formatINR(vp.advancePaid)}
                        </td>
                      </tr>
                    ))}

                    {/* Submissions / Transfers */}
                    {(accountLedgerData?.submissions || []).map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-[#F8FAFC]/60 font-medium">
                        <td className="py-2 px-3 text-slate-500">
                          {safeFormatDate(sub.createdAt)}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-600">Fund transfer</td>
                        <td className="py-2 px-3">
                          {sub.notes || "Inter-account transfer / Submission"}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                          + {formatINR(sub.amount)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">—</td>
                      </tr>
                    ))}

                    {/* Train Tickets (For Riya Wallet) */}
                    {(accountLedgerData?.trainTickets || []).map((tt: any) => (
                      <tr key={tt.id} className="hover:bg-[#F8FAFC]/60 font-medium">
                        <td className="py-2 px-3 text-slate-500">
                          {safeFormatDate(tt.journeyDate || tt.createdAt)}
                        </td>
                        <td className="py-2 px-3 font-medium text-[#0B1528]">Train ticket issued</td>
                        <td className="py-2 px-3">
                          {tt.travelerName} (PNR: {tt.pnr || "—"}) · Booking Ref: {tt.bookingId}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">—</td>
                        <td className="py-2 px-3 text-right font-semibold text-[#0B1528]">
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
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] min-h-0 max-w-2xl flex-col overflow-hidden rounded-xl border border-[#E8EEF4] bg-white p-0 shadow-xl sm:max-h-[90vh]">
          <div className="flex shrink-0 items-center justify-between gap-2 bg-[#0B1528] px-4 py-3 text-white sm:px-5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-[#152238] rounded-md shrink-0">
                <Eye className="w-4 h-4 text-slate-300" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
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

          <div className="flex min-h-[240px] min-w-0 flex-1 items-center justify-center overflow-auto bg-[#0B1528] p-3 sm:min-h-[380px] sm:p-4">
            {proofPreviewModal?.imageUrl ? (
              <img
                src={proofPreviewModal.imageUrl}
                alt="Payment proof screenshot"
                className="max-h-full w-auto max-w-full rounded-md border border-[#152238] object-contain"
              />
            ) : (
              <div className="py-12 text-center text-slate-400">
                <p className="text-[12px] font-medium">No image preview available</p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 border-t border-[#E8EEF4] bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="min-w-0 break-words text-[11px] text-slate-500">
              Amount: <strong>{formatINR(proofPreviewModal?.amount || 0)}</strong> · Date:{" "}
              {proofPreviewModal?.date}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProofPreviewModal(null)}
              className="h-8 gap-1.5 rounded-md border-[#E8EEF4] px-3 text-[12px] font-medium text-[#0B1528] shadow-none hover:bg-[#F4F7FB] cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
