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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { opsService } from "@/services/ops.service";
import api from "@/services/api";
import { cn, formatINR, safeFormatDate, safeFormatDateTime } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type TabId = "overview" | "payments" | "expenses" | "accounts" | "profitability";

export default function AccountingPage() {
  const { admin: user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab Normalization
  const normalizeTab = (raw: string | null): TabId => {
    const t = (raw || "").toLowerCase().trim();
    if (["payments", "incoming", "collections", "sales_payments", "sales"].includes(t))
      return "payments";
    if (["expenses", "vendor_payments", "office_expenses", "vendors", "disbursements", "outflows"].includes(t))
      return "expenses";
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

  // Date Range Presets
  const [selectedPreset, setSelectedPreset] = useState("This Month");
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
      return;
    }

    setActiveDateStart(start);
    setActiveDateEnd(end);
    setDateRange(`${fmt(start)} - ${fmt(end)}`);
  };

  // Main Data States
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [vendorPayments, setVendorPayments] = useState<any[]>([]);
  const [collectionAccounts, setCollectionAccounts] = useState<CollectionAccount[]>([]);
  const [officeExpenses, setOfficeExpenses] = useState<any[]>([]);

  // Search & Filter States per tab
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("ALL");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("ALL");
  const [expenseTypeTab, setExpenseTypeTab] = useState<"ALL" | "TRIP_VENDORS" | "OFFICE">("ALL");

  // Selected Account for Ledger Drawer Modal
  const [selectedAccountForLedger, setSelectedAccountForLedger] = useState<CollectionAccount | null>(null);
  const [accountLedgerData, setAccountLedgerData] = useState<any | null>(null);
  const [loadingAccountLedger, setLoadingAccountLedger] = useState(false);

  // Modals
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showSubmitFundsModal, setShowSubmitFundsModal] = useState(false);
  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false);
  const [showRecordIncomeModal, setShowRecordIncomeModal] = useState(false);

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
  const [newExpenseForm, setNewExpenseForm] = useState({
    category: "Transport",
    vendorName: "",
    tripId: "",
    amount: "",
    paymentMode: "BANK_TRANSFER",
    collectionAccountId: "",
    customPayerName: "",
    transactionId: "",
    remarks: "",
  });
  const [newIncomeForm, setNewIncomeForm] = useState({
    bookingId: "",
    amount: "",
    paymentMode: "UPI",
    collectionAccountId: "",
    transactionId: "",
    notes: "",
  });
  const [submittingAction, setSubmittingAction] = useState(false);

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
    setSubmittingAction(true);
    try {
      await api.post(`/payments/client/add/${newIncomeForm.bookingId}`, {
        amount: Number(newIncomeForm.amount),
        paymentMode: newIncomeForm.paymentMode,
        collectionAccountId: newIncomeForm.collectionAccountId || undefined,
        transactionId: newIncomeForm.transactionId || undefined,
        notes: newIncomeForm.notes || undefined,
      });
      toast.success("Client payment recorded successfully!");
      setShowRecordIncomeModal(false);
      setNewIncomeForm({
        bookingId: "",
        amount: "",
        paymentMode: "UPI",
        collectionAccountId: "",
        transactionId: "",
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
        remarks: newExpenseForm.remarks || undefined,
        status: "PAID",
      });
      toast.success("Expense recorded successfully!");
      setShowRecordExpenseModal(false);
      setNewExpenseForm({
        category: "Transport",
        vendorName: "",
        tripId: "",
        amount: "",
        paymentMode: "BANK_TRANSFER",
        collectionAccountId: "",
        customPayerName: "",
        transactionId: "",
        remarks: "",
      });
      loadData();
    } catch {
      toast.error("Failed to record expense");
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
        isActive: true,
      });
      toast.success(
        `Account "${newAccForm.accountName}" created successfully!`,
      );
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

  // Load All Finance Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes, aRes, vRes, qRes] = await Promise.all([
        bookingsService
          .getAll({ page: 1, limit: 1000 })
          .catch(() => ({ data: [] })),
        tripsService.getAll().catch(() => []),
        collectionAccountsService.getAccounts().catch(() => ({ data: [] })),
        api
          .get("/payments/vendor-payments")
          .catch(() => ({ data: { data: [] } })),
        api
          .get("/payments/vendor-payables-queue")
          .catch(() => ({ data: { data: [] } })),
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
      const qList = Array.isArray((qRes as any)?.data?.data)
        ? (qRes as any).data.data
        : Array.isArray(qRes?.data)
          ? qRes.data
          : [];

      // Combine both recorded payments and payables queue
      const combinedVendors = [...vList];
      qList.forEach((q: any) => {
        if (!combinedVendors.some((v: any) => v.id === q.id)) {
          combinedVendors.push({
            id: q.id,
            vendorName: q.vendorName || q.vendorId?.name || "Vendor Partner",
            category: q.category || q.vendorType || "Transport",
            tripName: q.tripName || q.tripTitle,
            tripId: q.tripId,
            agreedAmount: q.totalAmount || q.agreedCost || 0,
            advancePaid: q.paidAmount || 0,
            remainingPayable: q.balanceAmount || q.outstandingAmount || 0,
            paymentMode: q.outgoingPaymentMode || "BANK_TRANSFER",
            status:
              q.paymentStatus ||
              (q.paidAmount >= q.totalAmount && q.totalAmount > 0
                ? "PAID"
                : "PENDING"),
            createdAt: q.createdAt || new Date().toISOString(),
          });
        }
      });
      setVendorPayments(combinedVendors);
    } catch {
      toast.error("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Account Ledger when Selected
  const openAccountLedger = async (acc: CollectionAccount) => {
    setSelectedAccountForLedger(acc);
    setLoadingAccountLedger(true);
    try {
      const res = await collectionAccountsService.getAccountLedger(acc.id);
      setAccountLedgerData(res.data || null);
    } catch {
      toast.error("Failed to load account ledger");
    } finally {
      setLoadingAccountLedger(false);
    }
  };

  // ─── Extract All Client Receipts from Bookings & Payments Tracker ───
  const allClientReceipts = useMemo(() => {
    const receipts: any[] = [];
    bookings.forEach((b) => {
      const clientHistory = Array.isArray(b.clientPayments)
        ? b.clientPayments
        : Array.isArray(b.paymentHistory)
          ? b.paymentHistory
          : [];

      if (clientHistory.length > 0) {
        clientHistory.forEach((h: any, idx: number) => {
          const amt = Number(h.amount || h.advancePaid || 0);
          if (amt > 0) {
            receipts.push({
              id: h.id || `RCP-${b.bookingId || b.id}-${idx}`,
              bookingId: b.bookingId || b.id,
              customerName: b.fullName || b.customerName || b.name || "Customer",
              phone: b.phone || b.mobile || "—",
              tripTitle: b.tripName || b.trip?.title || "Trip Booking",
              departureDate: b.departureDate || "—",
              date: h.paymentDate || h.date || b.createdAt?.substring(0, 10) || "—",
              amount: amt,
              paymentMode: h.paymentMode || h.method || "UPI",
              collectionAccountId: h.collectionAccountId || null,
              collectionAccount: h.collectionAccount || null,
              accountName:
                h.collectionAccount?.accountName ||
                h.accountName ||
                "YouthCamping Company Account",
              transactionId: h.transactionId || h.txnId || "—",
              proofUrl: h.proofUrl || h.receiptUrl || "",
              status: h.status || "VERIFIED",
              booking: b,
            });
          }
        });
      } else {
        const paid = Number(b.advancePaid || b.totalPaid || b.amountPaid || 0);
        if (paid > 0) {
          receipts.push({
            id: `RCP-${b.bookingId || b.id}`,
            bookingId: b.bookingId || b.id,
            customerName: b.fullName || b.customerName || b.name || "Customer",
            phone: b.phone || b.mobile || "—",
            tripTitle: b.tripName || b.trip?.title || "Trip Booking",
            departureDate: b.departureDate || "—",
            date: b.createdAt?.substring(0, 10) || "—",
            amount: paid,
            paymentMode: b.paymentMode || "UPI",
            collectionAccountId: null,
            accountName: "YouthCamping Company Account",
            transactionId: b.transactionId || "—",
            proofUrl: b.paymentProof || "",
            status: "VERIFIED",
            booking: b,
          });
        }
      }
    });

    return receipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);

  // Date Filtered Collections & Outflows
  const filteredReceipts = useMemo(() => {
    return allClientReceipts.filter((r) => {
      const rDate = new Date(r.date);
      if (!isNaN(rDate.getTime())) {
        if (rDate < activeDateStart || rDate > activeDateEnd) return false;
      }
      if (paymentModeFilter !== "ALL" && r.paymentMode?.toUpperCase() !== paymentModeFilter) {
        return false;
      }
      if (paymentSearch.trim()) {
        const q = paymentSearch.toLowerCase();
        const match =
          r.customerName?.toLowerCase().includes(q) ||
          r.bookingId?.toLowerCase().includes(q) ||
          r.phone?.toLowerCase().includes(q) ||
          r.tripTitle?.toLowerCase().includes(q) ||
          r.transactionId?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allClientReceipts, activeDateStart, activeDateEnd, paymentModeFilter, paymentSearch]);

  // All Expenses (Vendor Payouts + Office Expenses)
  const allExpenses = useMemo(() => {
    const list: any[] = [];

    // Vendor Payments
    vendorPayments.forEach((v) => {
      const agreed = Number(v.agreedAmount || 0);
      const paid = Number(v.advancePaid || 0);
      const balance = Math.max(0, agreed - paid);
      list.push({
        id: v.id,
        type: "VENDOR",
        payee: v.vendorName || "Vendor",
        category: v.category || "Hotels",
        tripTitle: v.trip?.title || v.tripName || "Trip Service",
        departureDate: v.departureDate ? safeFormatDate(v.departureDate) : "—",
        date: v.paymentDate ? safeFormatDate(v.paymentDate) : safeFormatDate(v.createdAt),
        rawDate: v.paymentDate || v.createdAt,
        agreedAmount: agreed,
        paidAmount: paid,
        balanceDue: balance,
        paymentMode: v.paymentMode || "BANK_TRANSFER",
        collectionAccountId: v.collectionAccountId,
        accountName: v.collectionAccount?.accountName || v.paidBy || "Company Account",
        transactionId: v.transactionId || "—",
        proofUrl: v.invoiceProof || v.proofUrl || "",
        status: v.status || (paid >= agreed && agreed > 0 ? "PAID" : paid > 0 ? "ADVANCE PAID" : "PENDING"),
      });
    });

    // Office Expenses
    officeExpenses.forEach((oe) => {
      list.push({
        id: oe.id,
        type: "OFFICE",
        payee: oe.payee || oe.title || "Office Expense",
        category: oe.category || "Office",
        tripTitle: "General Operational",
        departureDate: "—",
        date: safeFormatDate(oe.date || oe.createdAt),
        rawDate: oe.date || oe.createdAt,
        agreedAmount: Number(oe.amount || 0),
        paidAmount: Number(oe.amount || 0),
        balanceDue: 0,
        paymentMode: oe.paymentMode || "CASH",
        collectionAccountId: oe.collectionAccountId,
        accountName: oe.accountName || "Cash Desk",
        transactionId: oe.transactionId || "—",
        proofUrl: oe.proofUrl || "",
        status: "PAID",
      });
    });

    return list.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
  }, [vendorPayments, officeExpenses]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((e) => {
      const eDate = new Date(e.rawDate);
      if (!isNaN(eDate.getTime())) {
        if (eDate < activeDateStart || eDate > activeDateEnd) return false;
      }
      if (expenseTypeTab === "TRIP_VENDORS" && e.type !== "VENDOR") return false;
      if (expenseTypeTab === "OFFICE" && e.type !== "OFFICE") return false;
      if (expenseCategoryFilter !== "ALL" && e.category?.toUpperCase() !== expenseCategoryFilter.toUpperCase()) {
        return false;
      }
      if (expenseSearch.trim()) {
        const q = expenseSearch.toLowerCase();
        const match =
          e.payee?.toLowerCase().includes(q) ||
          e.tripTitle?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.transactionId?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allExpenses, activeDateStart, activeDateEnd, expenseTypeTab, expenseCategoryFilter, expenseSearch]);

  // Executive KPI Aggregations
  const totalCollections = useMemo(() => {
    return filteredReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [filteredReceipts]);

  const totalExpensePaid = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);
  }, [filteredExpenses]);

  const outstandingCustomerReceivables = useMemo(() => {
    return bookings.reduce((sum, b) => {
      const total = Number(b.totalAmount || b.totalPrice || 0);
      const paid = Number(b.advancePaid || b.totalPaid || b.paidAmount || 0);
      return sum + Math.max(0, total - paid);
    }, 0);
  }, [bookings]);

  const totalAvailableLiquidity = useMemo(() => {
    return collectionAccounts.reduce((sum, a) => sum + (Number(a.pending) || 0), 0);
  }, [collectionAccounts]);

  // Trip Profitability Calculations
  const tripProfitabilityList = useMemo(() => {
    return trips.map((trip) => {
      const tripBookings = bookings.filter(
        (b) =>
          (b.tripId === trip.id ||
            b.tripName?.toLowerCase() === trip.title?.toLowerCase()) &&
          b.status !== "Cancelled" &&
          b.bookingStatus !== "Cancelled",
      );

      const totalPax = tripBookings.reduce((sum, b) => {
        const pCount = Array.isArray(b.passengers) && b.passengers.length > 0
          ? b.passengers.length
          : Number(b.numberOfPassengers || b.travelerCount || 1);
        return sum + pCount;
      }, 0);

      const totalRevenue = tripBookings.reduce((sum, b) => {
        return sum + Number(b.totalAmount || b.totalPrice || 0);
      }, 0);

      const tripVendors = vendorPayments.filter(
        (v) => v.tripId === trip.id || v.tripName?.toLowerCase() === trip.title?.toLowerCase(),
      );

      const totalVendorCost = tripVendors.reduce((sum, v) => {
        return sum + Number(v.agreedAmount || v.advancePaid || 0);
      }, 0);

      const grossProfit = totalRevenue - totalVendorCost;
      const marginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

      return {
        id: trip.id,
        title: trip.title,
        tripCode: trip.tripCode || trip.shortName || trip.id.substring(0, 5).toUpperCase(),
        destination: trip.destination || "Himalayas",
        totalPax,
        totalRevenue,
        totalVendorCost,
        grossProfit,
        marginPct,
      };
    });
  }, [trips, bookings, vendorPayments]);

  // Print Receipt PDF
  const generateReceiptPDF = (receipt: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download payment receipt.");
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${receipt.customerName}</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; margin: 0; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 20px; font-weight: 800; color: #ea580c; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 13px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
            th { background: #0f172a; color: white; padding: 10px 14px; text-align: left; }
            td { border-bottom: 1px solid #e2e8f0; padding: 12px 14px; }
            .amount { font-size: 20px; font-weight: 900; color: #16a34a; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">YouthCamping</div>
              <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Official Payment Confirmation Voucher</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 11px; margin: 0; color: #64748b;">Receipt ID: <strong>${receipt.id}</strong></p>
              <p style="font-size: 11px; margin: 4px 0 0 0; color: #64748b;">Date: <strong>${receipt.date}</strong></p>
            </div>
          </div>
          <div class="grid">
            <div class="box">
              <p style="font-weight: bold; margin: 0 0 6px 0; color: #475569; font-size: 11px; text-transform: uppercase;">Customer Details</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">${receipt.customerName}</p>
              <p style="margin: 4px 0 0 0; color: #64748b;">Phone: ${receipt.phone}</p>
              <p style="margin: 4px 0 0 0; color: #64748b;">Booking Ref: ${receipt.bookingId}</p>
            </div>
            <div class="box">
              <p style="font-weight: bold; margin: 0 0 6px 0; color: #475569; font-size: 11px; text-transform: uppercase;">Trip Information</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">${receipt.tripTitle}</p>
              <p style="margin: 4px 0 0 0; color: #64748b;">Departure Date: ${receipt.departureDate}</p>
              <p style="margin: 4px 0 0 0; color: #64748b;">Account: ${receipt.accountName}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Payment Method</th><th>Transaction Reference</th><th style="text-align: right;">Amount Paid (₹)</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${receipt.paymentMode}</strong></td>
                <td>${receipt.transactionId}</td>
                <td style="text-align: right;" class="amount">₹${Number(receipt.amount).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
          <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8;">
            Thank you for traveling with YouthCamping! This is a computer-generated confirmation.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 p-4 md:p-6 bg-[#F8FAFC] min-h-screen text-slate-800">
      {/* ─── HEADER & TOP CONTROLS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-orange-600" />
            Finance & Accounts
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time income, vendor expenses, bank accounts, and trip margins.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={loadData}
            variant="outline"
            className="h-8.5 text-xs font-bold gap-1.5 border-slate-200 bg-white hover:bg-slate-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-orange-600")} />
            Refresh
          </Button>

          {activeTab === "accounts" ? (
            <>
              <Button
                size="sm"
                onClick={() => setShowSubmitFundsModal(true)}
                variant="outline"
                className="h-8.5 text-xs font-bold gap-1.5 border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
                Submit / Transfer Funds
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddAccountModal(true)}
                className="h-8.5 text-xs font-bold gap-1.5 bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => setShowRecordExpenseModal(true)}
                variant="outline"
                className="h-8.5 text-xs font-bold gap-1.5 border-slate-200 text-slate-800 bg-white hover:bg-slate-50"
              >
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                + Record Expense
              </Button>
              <Button
                size="sm"
                onClick={() => setShowRecordIncomeModal(true)}
                className="h-8.5 text-xs font-bold gap-1.5 bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
              >
                <TrendingUp className="w-3.5 h-3.5 text-white" />
                + Record Income
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ─── 5 STREAMLINED TABS STRIP ─── */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-0">
        {[
          { id: "overview" as TabId, label: "Overview & Summary", icon: Layers },
          { id: "payments" as TabId, label: "Client Receipts (Income)", icon: TrendingUp },
          { id: "expenses" as TabId, label: "Vendor & Operating Expenses", icon: TrendingDown },
          { id: "accounts" as TabId, label: "Bank & Cash Accounts", icon: Wallet },
          { id: "profitability" as TabId, label: "Trip Profitability (P&L)", icon: PieIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                isActive
                  ? "border-orange-600 text-orange-600 bg-orange-50/40 rounded-t-lg"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-lg",
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-orange-600" : "text-slate-400")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── INTERACTIVE DATE PRESET BAR ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold text-slate-600">
          {["Today", "Yesterday", "This Week", "This Month", "Last Month", "This Financial Year", "All Time"].map(
            (preset) => (
              <button
                key={preset}
                onClick={() => applyDatePreset(preset)}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap text-[11px]",
                  selectedPreset === preset
                    ? "bg-slate-900 text-white font-bold"
                    : "hover:bg-slate-100 text-slate-600",
                )}
              >
                {preset}
              </button>
            ),
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{dateRange}</span>
        </div>
      </div>

      {/* ──────────────────────── TAB 1: EXECUTIVE OVERVIEW ──────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* 4 Core Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Total Collections (Income)
                </p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {formatINR(totalCollections)}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                  {filteredReceipts.length} receipts verified
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Total Expenses (Outflows)
                </p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">
                  {formatINR(totalExpensePaid)}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                  {filteredExpenses.length} vendor & office payouts
                </p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Net Available Liquidity
                </p>
                <h3
                  className={cn(
                    "text-2xl font-black mt-1",
                    totalAvailableLiquidity >= 0 ? "text-blue-600" : "text-amber-600",
                  )}
                >
                  {formatINR(totalAvailableLiquidity)}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                  Across {collectionAccounts.length} bank & cash accounts
                </p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Customer Receivables Due
                </p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">
                  {formatINR(outstandingCustomerReceivables)}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                  Uncollected balances from bookings
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </Card>
          </div>

          {/* Quick 2-Column Split: Cashflow Chart & Top Trips */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Top Trip Margins */}
            <Card className="p-4 bg-white border-slate-200 rounded-xl shadow-xs lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Top Trips by Revenue & Margin
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">Top 5 Performers</span>
              </div>
              <div className="divide-y divide-slate-100">
                {tripProfitabilityList.slice(0, 5).map((t, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{t.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.totalPax} Pax · Revenue: {formatINR(t.totalRevenue)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-emerald-700">{formatINR(t.grossProfit)}</p>
                      <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                        {t.marginPct}% Margin
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Right: Bank Accounts Quick Balances */}
            <Card className="p-4 bg-white border-slate-200 rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Treasury & Bank Balances
                </h3>
                <button
                  onClick={() => handleTabChange("accounts")}
                  className="text-[11px] font-bold text-orange-600 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {collectionAccounts.slice(0, 4).map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => openAccountLedger(acc)}
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                        {acc.accountName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {acc.bankName || acc.accountType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-xs">
                        {formatINR(acc.pending || 0)}
                      </p>
                      <span className="text-[9px] font-bold text-blue-600">Click for Ledger</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ──────────────────────── TAB 2: CLIENT RECEIPTS (INCOME) ──────────────────────── */}
      {activeTab === "payments" && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search by customer, phone, booking ID..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="pl-9 h-9 text-xs font-medium border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[11px] font-bold text-slate-500">Mode:</span>
              <div className="flex gap-1 overflow-x-auto no-scrollbar text-xs font-bold">
                {["ALL", "UPI", "BANK_TRANSFER", "CASH"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentModeFilter(mode)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] transition-colors border",
                      paymentModeFilter === mode
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    {mode === "ALL" ? "All Modes" : mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#74839A] font-bold text-[10px] uppercase">
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer / Booking</th>
                  <th className="p-3">Trip Title</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3">Receiving Account</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                      No client payment receipts found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-600 whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="p-3">
                        <p className="font-extrabold text-slate-900">{r.customerName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          ID: {r.bookingId} · {r.phone}
                        </p>
                      </td>
                      <td className="p-3 font-bold text-slate-700 max-w-[200px] truncate">
                        {r.tripTitle}
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          {r.paymentMode}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        {r.accountName}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                        {formatINR(r.amount)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[10px]">
                          VERIFIED ✓
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.proofUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setProofPreviewModal({
                                  open: true,
                                  title: `Receipt Proof — ${r.customerName}`,
                                  subtitle: `Booking ${r.bookingId} · Amount: ${formatINR(r.amount)}`,
                                  imageUrl: r.proofUrl,
                                  amount: r.amount,
                                  method: r.paymentMode,
                                  date: r.date,
                                  txnId: r.transactionId,
                                  accountName: r.accountName,
                                  status: "VERIFIED",
                                })
                              }
                              className="p-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded"
                              title="View Screenshot Proof"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => generateReceiptPDF(r)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Download Receipt PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────── TAB 3: VENDOR & OPERATING EXPENSES ──────────────────────── */}
      {activeTab === "expenses" && (
        <div className="space-y-3">
          {/* Subtabs & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search by vendor, trip, invoice..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="pl-9 h-9 text-xs font-medium border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar text-xs font-bold">
              {["ALL", "Hotels", "Transport", "Guides", "Activities", "Office"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setExpenseCategoryFilter(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] transition-colors border",
                    expenseCategoryFilter.toUpperCase() === cat.toUpperCase()
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#74839A] font-bold text-[10px] uppercase">
                  <th className="p-3">Date</th>
                  <th className="p-3">Payee / Vendor</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Trip / Purpose</th>
                  <th className="p-3 text-right">Agreed Total</th>
                  <th className="p-3 text-right">Paid Amount</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3">Paid From Account</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">
                      No expenses found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-600 whitespace-nowrap">
                        {e.date}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900">
                        {e.payee}
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-700 max-w-[180px] truncate">
                        {e.tripTitle}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {formatINR(e.agreedAmount)}
                      </td>
                      <td className="p-3 text-right font-black text-blue-600">
                        {formatINR(e.paidAmount)}
                      </td>
                      <td className="p-3 text-right font-black text-rose-600">
                        {formatINR(e.balanceDue)}
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded text-[10px]">
                          {e.accountName}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                            e.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : e.status === "ADVANCE PAID"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200",
                          )}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {e.proofUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setProofPreviewModal({
                                open: true,
                                title: `Expense Proof — ${e.payee}`,
                                subtitle: `${e.category} · Trip: ${e.tripTitle}`,
                                imageUrl: e.proofUrl,
                                amount: e.paidAmount,
                                method: e.paymentMode,
                                date: e.date,
                                txnId: e.transactionId,
                                accountName: e.accountName,
                                status: e.status,
                              })
                            }
                            className="p-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded"
                            title="View Payment Proof"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
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

      {/* ──────────────────────── TAB 4: BANK & CASH ACCOUNTS ──────────────────────── */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {collectionAccounts.map((acc) => (
              <Card
                key={acc.id}
                className="p-4 bg-white border-slate-200 rounded-xl shadow-xs hover:border-orange-500 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{acc.accountName}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {acc.bankName ? `${acc.bankName} (${acc.accountNumber || acc.maskedAccountNumber})` : acc.accountType}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded",
                        acc.accountType === "CASH" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800",
                      )}
                    >
                      {acc.accountType}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Inflow</p>
                      <p className="font-extrabold text-emerald-600">{formatINR(acc.totalCollected || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Outflows / Transferred</p>
                      <p className="font-extrabold text-slate-600">
                        {formatINR((acc.totalSubmitted || 0) + (acc.totalVendorPaid || 0))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">Available Balance:</span>
                    <span className="text-sm font-black text-slate-900">{formatINR(acc.pending || 0)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => openAccountLedger(acc)}
                    variant="outline"
                    className="w-full h-8 text-xs font-bold bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    View Ledger
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────── TAB 5: TRIP PROFITABILITY (P&L) ──────────────────────── */}
      {activeTab === "profitability" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[#74839A] font-bold text-[10px] uppercase">
                <th className="p-3">Trip Title</th>
                <th className="p-3">Code</th>
                <th className="p-3 text-center">Confirmed Pax</th>
                <th className="p-3 text-right">Total Revenue</th>
                <th className="p-3 text-right">Vendor Expenses</th>
                <th className="p-3 text-right">Gross Margin</th>
                <th className="p-3 text-center">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tripProfitabilityList.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-extrabold text-slate-900">{t.title}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-500 font-bold">{t.tripCode}</td>
                  <td className="p-3 text-center font-bold text-slate-700">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-extrabold">
                      {t.totalPax} Pax
                    </span>
                  </td>
                  <td className="p-3 text-right font-black text-slate-900">{formatINR(t.totalRevenue)}</td>
                  <td className="p-3 text-right font-black text-rose-600">{formatINR(t.totalVendorCost)}</td>
                  <td className="p-3 text-right font-black text-emerald-600">{formatINR(t.grossProfit)}</td>
                  <td className="p-3 text-center">
                    <span
                      className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded border",
                        t.marginPct >= 30
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : t.marginPct > 0
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200",
                      )}
                    >
                      {t.marginPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ──────────────────────── MODAL: ACCOUNT LEDGER ──────────────────────── */}
      <Dialog
        open={Boolean(selectedAccountForLedger)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAccountForLedger(null);
            setAccountLedgerData(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl bg-white p-0 rounded-2xl border border-slate-200 overflow-hidden shadow-2xl">
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white">
                Account Ledger: {selectedAccountForLedger?.accountName}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedAccountForLedger?.bankName || selectedAccountForLedger?.accountType}
              </p>
            </div>
            <button
              onClick={() => setSelectedAccountForLedger(null)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {loadingAccountLedger ? (
              <div className="py-12 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600" />
                <p className="text-xs font-semibold mt-2">Loading transactions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Collected</p>
                    <p className="text-sm font-black text-emerald-600">
                      {formatINR(accountLedgerData?.metrics?.totalCollected || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Outflows</p>
                    <p className="text-sm font-black text-rose-600">
                      {formatINR(
                        (accountLedgerData?.metrics?.totalSubmitted || 0) +
                          (accountLedgerData?.metrics?.totalVendorPaid || 0),
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Net Balance</p>
                    <p className="text-sm font-black text-slate-900">
                      {formatINR(accountLedgerData?.metrics?.pending || 0)}
                    </p>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[#74839A] font-bold text-[10px] uppercase">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Description / Source</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(accountLedgerData?.clientPayments || []).map((cp: any) => (
                      <tr key={cp.id}>
                        <td className="p-2.5 text-slate-500 font-semibold">{safeFormatDate(cp.createdAt)}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {cp.booking?.fullName || "Client Receipt"} · {cp.booking?.bookingId}
                        </td>
                        <td className="p-2.5">
                          <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                            INFLOW (RECEIPT)
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-black text-emerald-600">
                          +{formatINR(cp.amount)}
                        </td>
                      </tr>
                    ))}
                    {(accountLedgerData?.vendorPayments || []).map((vp: any) => (
                      <tr key={vp.id}>
                        <td className="p-2.5 text-slate-500 font-semibold">{safeFormatDate(vp.createdAt)}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          Vendor Payout: {vp.vendorName} · {vp.trip?.title || "Trip"}
                        </td>
                        <td className="p-2.5">
                          <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                            OUTFLOW (VENDOR)
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-black text-rose-600">
                          -{formatINR(vp.advancePaid)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── IN-APP PROOF PREVIEW POPUP MODAL ──────────────────────── */}
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
                  {proofPreviewModal?.title || "Payment Proof / Receipt"}
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
              Amount: <strong>{formatINR(proofPreviewModal?.amount || 0)}</strong> · Date: {proofPreviewModal?.date}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProofPreviewModal(null)}
              className="h-8 text-xs font-bold px-4"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: RECORD CLIENT INCOME ──────────────────────── */}
      <Dialog open={showRecordIncomeModal} onOpenChange={setShowRecordIncomeModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Record Client Payment / Income
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordIncome} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Booking / Customer *</label>
              <select
                required
                value={newIncomeForm.bookingId}
                onChange={(e) => setNewIncomeForm((prev) => ({ ...prev, bookingId: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs focus:ring-1 focus:ring-orange-500"
              >
                <option value="">-- Choose a Booking --</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.fullName || b.customerName || "Customer"} · Ref: {b.bookingId || b.id} (
                    {b.tripName || "Trip"})
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
                  onChange={(e) => setNewIncomeForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="h-9 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Mode *</label>
                <select
                  value={newIncomeForm.paymentMode}
                  onChange={(e) => setNewIncomeForm((prev) => ({ ...prev, paymentMode: e.target.value }))}
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
              <label className="font-bold text-slate-700 block mb-1">Receiving Account</label>
              <select
                value={newIncomeForm.collectionAccountId}
                onChange={(e) =>
                  setNewIncomeForm((prev) => ({ ...prev, collectionAccountId: e.target.value }))
                }
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
              >
                <option value="">Default Company Account</option>
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
                onChange={(e) => setNewIncomeForm((prev) => ({ ...prev, transactionId: e.target.value }))}
                className="h-9 text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Notes</label>
              <Input
                placeholder="Optional payment notes"
                value={newIncomeForm.notes}
                onChange={(e) => setNewIncomeForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRecordIncomeModal(false)}
                className="h-8.5 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: RECORD VENDOR / OPERATING EXPENSE ──────────────────────── */}
      <Dialog open={showRecordExpenseModal} onOpenChange={setShowRecordExpenseModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              Record Vendor / Operating Expense
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordExpense} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Trip *</label>
              <select
                required
                value={newExpenseForm.tripId}
                onChange={(e) => setNewExpenseForm((prev) => ({ ...prev, tripId: e.target.value }))}
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
                <label className="font-bold text-slate-700 block mb-1">Expense Category *</label>
                <select
                  value={newExpenseForm.category}
                  onChange={(e) => setNewExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="Hotels">Hotels / Camps</option>
                  <option value="Transport">Transport / Fleet</option>
                  <option value="Guides">Guides / Leaders</option>
                  <option value="Activities">Activities / Permits</option>
                  <option value="Office">Office Ops / Rent</option>
                  <option value="Marketing">Marketing / Ads</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor / Payee Name *</label>
                <Input
                  required
                  placeholder="e.g. Manali Volvo Travels"
                  value={newExpenseForm.vendorName}
                  onChange={(e) => setNewExpenseForm((prev) => ({ ...prev, vendorName: e.target.value }))}
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
                  onChange={(e) => setNewExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="h-9 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Mode *</label>
                <select
                  value={newExpenseForm.paymentMode}
                  onChange={(e) => setNewExpenseForm((prev) => ({ ...prev, paymentMode: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Paid From Account</label>
              <select
                value={newExpenseForm.collectionAccountId}
                onChange={(e) =>
                  setNewExpenseForm((prev) => ({ ...prev, collectionAccountId: e.target.value }))
                }
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
              >
                <option value="">Primary Company Bank Account</option>
                {collectionAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} (Balance: {formatINR(acc.pending || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Transaction Ref / UTR</label>
              <Input
                placeholder="Bank UTR or TXN reference"
                value={newExpenseForm.transactionId}
                onChange={(e) => setNewExpenseForm((prev) => ({ ...prev, transactionId: e.target.value }))}
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRecordExpenseModal(false)}
                className="h-8.5 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: ADD BANK / CASH ACCOUNT ──────────────────────── */}
      <Dialog open={showAddAccountModal} onOpenChange={setShowAddAccountModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-600" />
              Add Bank / Cash Collection Account
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddAccount} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Account Display Name *</label>
              <Input
                required
                placeholder="e.g. HDFC Company Main, Cash Collection Desk"
                value={newAccForm.accountName}
                onChange={(e) => setNewAccForm((prev) => ({ ...prev, accountName: e.target.value }))}
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Type *</label>
                <select
                  value={newAccForm.accountType}
                  onChange={(e) => setNewAccForm((prev) => ({ ...prev, accountType: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="COMPANY">Company Bank Account</option>
                  <option value="CASH">Cash Collection Desk</option>
                  <option value="PERSONAL">Staff / Director Account</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                <Input
                  placeholder="e.g. HDFC Bank, SBI"
                  value={newAccForm.bankName}
                  onChange={(e) => setNewAccForm((prev) => ({ ...prev, bankName: e.target.value }))}
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
                  onChange={(e) => setNewAccForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                  className="h-9 text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
                <Input
                  placeholder="e.g. HDFC0001234"
                  value={newAccForm.ifsc}
                  onChange={(e) => setNewAccForm((prev) => ({ ...prev, ifsc: e.target.value }))}
                  className="h-9 text-xs font-medium uppercase"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">UPI ID</label>
              <Input
                placeholder="e.g. youthcamping@hdfcbank"
                value={newAccForm.upiId}
                onChange={(e) => setNewAccForm((prev) => ({ ...prev, upiId: e.target.value }))}
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddAccountModal(false)}
                className="h-8.5 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── DIALOG: SUBMIT / TRANSFER FUNDS ──────────────────────── */}
      <Dialog open={showSubmitFundsModal} onOpenChange={setShowSubmitFundsModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              Submit / Transfer Cash & Funds
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitFunds} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">From Account / Cash Desk *</label>
              <select
                required
                value={submitFundsForm.accountId}
                onChange={(e) => setSubmitFundsForm((prev) => ({ ...prev, accountId: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
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
                  onChange={(e) => setSubmitFundsForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="h-9 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transfer Mode *</label>
                <select
                  value={submitFundsForm.submissionMode}
                  onChange={(e) => setSubmitFundsForm((prev) => ({ ...prev, submissionMode: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="BANK_TRANSFER">Bank Deposit / Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Handover Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Reference / Deposit Slip Number</label>
              <Input
                placeholder="Bank Slip Number or UTR"
                value={submitFundsForm.referenceNumber}
                onChange={(e) => setSubmitFundsForm((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                className="h-9 text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Notes</label>
              <Input
                placeholder="e.g. Cash collected from trip deposited to HDFC"
                value={submitFundsForm.notes}
                onChange={(e) => setSubmitFundsForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubmitFundsModal(false)}
                className="h-8.5 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="h-8.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Record Transfer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
