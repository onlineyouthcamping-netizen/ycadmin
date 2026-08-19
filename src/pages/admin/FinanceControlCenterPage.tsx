import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Ticket,
  Building2,
  History,
  Eye,
  FileText,
  CreditCard,
  UserCheck,
  Lock,
  MessageSquare,
  AlertCircle,
  Sliders,
  DollarSign,
  TrendingUp,
  Receipt,
  ExternalLink,
  ChevronRight,
  Info,
  Truck,
  Compass,
  FileCheck,
  Plus,
  Tag,
  Upload,
  Layers,
  Calendar,
  Check,
  X,
  FileDown,
  User,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { cn, formatINR, safeFormatDate } from "@/lib/utils";
import { financeControllerService } from "@/services/financeController.service";
import { api } from "@/services/api";
import {
  FinanceStatusBadge,
  MoneyAmount,
  FinanceEmptyState,
  FinanceLoadingBlock,
  FinanceQueueCard,
  FinanceKpiCard,
  FinanceTable,
  FinanceTableHead,
  financeTd,
  financePrimaryBtn,
  FinancePrimaryButton,
  FinanceApproveButton,
  FinanceRejectButton,
} from "@/modules/finance/finance.ui";
import type {
  FinanceControlCenterStats,
  CashSubmissionItem,
  IncomingPaymentItem,
  VendorPaymentRequestItem,
  TicketFinanceAuditItem,
  DiscrepancyItem,
  FinancialAuditLogItem,
  DeparturePayoutItem,
  MiscellaneousExpenseItem,
  RefundTransactionItem,
  CouponItem,
  FinanceTicketItem,
  ServiceRegistryItem,
  TaskAllotmentItem,
  TaskDashboardData,
  AuditLogItem,
} from "@/types";

type QueueTab =
  | "cash"
  | "incoming"
  | "vendor"
  | "departures"
  | "ticketing"
  | "refunds"
  | "credits"
  | "ticket_repository"
  | "tasks"
  | "coupons"
  | "expenses"
  | "discrepancies"
  | "audit";

export default function FinanceControlCenterPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { admin: currentUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTabFromApprovalHub: QueueTab | undefined =
    tabParam === "payment-approvals"
      ? "incoming"
      : tabParam === "vendor-bills"
      ? "vendor"
      : tabParam === "refund-requests"
      ? "refunds"
      : tabParam === "expense-claims"
      ? "expenses"
      : undefined;

  const rawActiveTab =
    (searchParams.get("queue") as QueueTab) ||
    (searchParams.get("subtab") as QueueTab) ||
    defaultTabFromApprovalHub ||
    "cash";
  const activeTab: QueueTab =
    rawActiveTab === "ticketing" || rawActiveTab === "ticket_repository"
      ? "cash"
      : rawActiveTab;

  // Data states
  const [stats, setStats] = useState<FinanceControlCenterStats | null>(null);
  const [cashQueue, setCashQueue] = useState<CashSubmissionItem[]>([]);
  const [incomingQueue, setIncomingQueue] = useState<IncomingPaymentItem[]>([]);
  const [departuresQueue, setDeparturesQueue] = useState<DeparturePayoutItem[]>([]);
  const [vendorQueue, setVendorQueue] = useState<VendorPaymentRequestItem[]>([]);
  const [ticketingQueue, setTicketingQueue] = useState<TicketFinanceAuditItem[]>([]);
  const [expensesQueue, setExpensesQueue] = useState<MiscellaneousExpenseItem[]>([]);
  const [discrepanciesQueue, setDiscrepanciesQueue] = useState<DiscrepancyItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLogItem[]>([]);

  // Sub-module data states
  const [refundsList, setRefundsList] = useState<RefundTransactionItem[]>([]);
  const [activeCreditsList, setActiveCreditsList] = useState<any[]>([]);
  const [couponsList, setCouponsList] = useState<CouponItem[]>([]);
  const [financeTicketsList, setFinanceTicketsList] = useState<FinanceTicketItem[]>([]);
  const [tasksList, setTasksList] = useState<TaskAllotmentItem[]>([]);
  const [taskDashboard, setTaskDashboard] = useState<TaskDashboardData | null>(null);
  const [auditTrailList, setAuditTrailList] = useState<AuditLogItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // ── Cash Verification Modal ──
  const [selectedCashItem, setSelectedCashItem] = useState<CashSubmissionItem | null>(null);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashAction, setCashAction] = useState<
    "APPROVE" | "APPROVE_WITH_DISCREPANCY" | "REJECT" | "REQUEST_CLARIFICATION" | "FLAG_DISCREPANCY"
  >("APPROVE");
  const [actionNotes, setActionNotes] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // ── Incoming Payment Modal ──
  const [selectedIncomingItem, setSelectedIncomingItem] = useState<IncomingPaymentItem | null>(null);
  const [isIncomingModalOpen, setIsIncomingModalOpen] = useState(false);
  const [incomingAction, setIncomingAction] = useState<"VERIFY" | "REJECT" | "FLAG_DISCREPANCY">("VERIFY");
  const [incomingNotes, setIncomingNotes] = useState("");
  const [incomingReason, setIncomingReason] = useState("");

  // ── Vendor Payout Modal ──
  const [selectedVendorItem, setSelectedVendorItem] = useState<VendorPaymentRequestItem | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorPayAmount, setVendorPayAmount] = useState<number>(0);
  const [vendorPayMode, setVendorPayMode] = useState("Bank Transfer");
  const [vendorTxnRef, setVendorTxnRef] = useState("");
  const [vendorNotes, setVendorNotes] = useState("");

  // ── Ticketing Price Audit Modal ──
  const [selectedTicketItem, setSelectedTicketItem] = useState<TicketFinanceAuditItem | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketAuditedCost, setTicketAuditedCost] = useState<number>(0);
  const [ticketAction, setTicketAction] = useState<"APPROVE" | "FLAG_VARIANCE" | "REJECT">("APPROVE");
  const [ticketNotes, setTicketNotes] = useState("");
  const [confirmTicketVerifyId, setConfirmTicketVerifyId] = useState<string | null>(null);

  // ── Unified Departure / Expense Review Modal ──
  const [selectedQueueItem, setSelectedQueueItem] = useState<{
    kind: "departure" | "expense";
    item: DeparturePayoutItem | MiscellaneousExpenseItem;
  } | null>(null);
  const [queueReviewAction, setQueueReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [queueActionNotes, setQueueActionNotes] = useState("");

  // ── Expenses sub-tab ──
  const [expenseSubTab, setExpenseSubTab] = useState<"MISCELLANEOUS" | "ACTIVITY">("MISCELLANEOUS");

  // ── Add Expense Modal ──
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [addExpenseForm, setAddExpenseForm] = useState({
    type: "MISCELLANEOUS" as "MISCELLANEOUS" | "ACTIVITY",
    tripId: "",
    departureDate: new Date().toISOString().split("T")[0],
    category: "MISCELLANEOUS",
    description: "",
    amount: 0,
    activity: "",
    totalAmount: 0,
    amountPaid: 0,
    paymentDate: "",
    paymentMode: "BANK_TRANSFER",
    remarks: "",
    receiptUrl: "",
  });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [expenseProofFile, setExpenseProofFile] = useState<File | null>(null);
  const [expenseProofPreview, setExpenseProofPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // ── Refunds & Credit Notes Modals ──
  const [refundSubTab, setRefundSubTab] = useState<"ALL" | "PENDING_APPROVAL" | "COMPLETED" | "REJECTED">("ALL");
  const [showCreateRefundModal, setShowCreateRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    bookingId: "",
    refundReason: "CUSTOMER_CANCELLATION",
    refundMethod: "CASH_REFUND" as "CASH_REFUND" | "CREDIT_NOTE" | "HYBRID",
    refundAmount: 0,
    creditNoteAmount: 0,
    notes: "",
  });
  const [selectedRefundForAction, setSelectedRefundForAction] = useState<RefundTransactionItem | null>(null);
  const [refundApprovalRef, setRefundApprovalRef] = useState("");
  const [refundRejectReason, setRefundRejectReason] = useState("");
  const [showRefundApproveDialog, setShowRefundApproveDialog] = useState(false);
  const [showRefundRejectDialog, setShowRefundRejectDialog] = useState(false);

  // Apply Credit Note Modal
  const [selectedCreditForApply, setSelectedCreditForApply] = useState<any | null>(null);
  const [applyCreditForm, setApplyCreditForm] = useState({
    targetBookingId: "",
    amountToUse: 0,
    notes: "",
  });
  const [showApplyCreditModal, setShowApplyCreditModal] = useState(false);

  // ── Coupons Modal & Validator ──
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscountAmount: 1000,
    minBookingAmount: 5000,
    maxUsesTotal: 100,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    status: "ACTIVE",
  });
  const [couponTestCode, setCouponTestCode] = useState("");
  const [couponTestAmount, setCouponTestAmount] = useState(10000);
  const [couponValidationResult, setCouponValidationResult] = useState<any | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // ── Ticket Repository & Bulk Upload ──
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkUploadResult, setBulkUploadResult] = useState<any | null>(null);
  const [singleTicketForm, setSingleTicketForm] = useState({
    bookingId: "",
    type: "TRAIN",
    pnr: "",
    ticketNumber: "",
    provider: "IRCTC",
    cost: 0,
    packageAllowance: 0,
    source: "",
    destination: "",
    notes: "",
  });

  // ── Task Board & Detail Drawer ──
  const [selectedTask, setSelectedTask] = useState<TaskAllotmentItem | null>(null);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskCommentText, setTaskCommentText] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    taskType: "OTHER",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    assignedToId: currentUser?.id || "",
    bookingId: "",
    deadline: "",
  });

  // ── Audit Diff Drawer ──
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [auditEntityFilter, setAuditEntityFilter] = useState("ALL");

  const handleTabChange = (queue: QueueTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("queue", queue);
    if (!next.has("tab")) {
      next.set("tab", "control_center");
    }
    setSearchParams(next, { replace: true });
  };

  const fetchAllData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [
        statsData,
        cashRes,
        incomingRes,
        vendorRes,
        ticketingRes,
        departuresData,
        expensesData,
        discrepanciesData,
        auditData,
      ] = await Promise.all([
        financeControllerService.getStats().catch(() => null),
        financeControllerService.getCashQueue({ status: statusFilter !== "ALL" ? statusFilter : undefined, search: debouncedSearch || undefined }).catch(() => ({ data: [], pagination: {} })),
        financeControllerService.getIncomingQueue({ status: statusFilter !== "ALL" ? statusFilter : undefined, search: debouncedSearch || undefined }).catch(() => ({ data: [], pagination: {} })),
        financeControllerService.getVendorQueue().catch(() => ({ data: [], pagination: {} })),
        financeControllerService.getTicketingQueue().catch(() => ({ data: [], pagination: {} })),
        financeControllerService.getDeparturesQueue().catch(() => []),
        financeControllerService.getExpensesQueue().catch(() => []),
        financeControllerService.getDiscrepanciesQueue().catch(() => []),
        financeControllerService.getAuditLog().catch(() => []),
      ]);

      setStats(statsData);
      setCashQueue(cashRes.data || []);
      setIncomingQueue(incomingRes.data || []);
      setVendorQueue(vendorRes.data || []);
      setTicketingQueue(ticketingRes.data || []);
      setDeparturesQueue(departuresData || []);
      setExpensesQueue(expensesData || []);
      setDiscrepanciesQueue(discrepanciesData || []);
      setAuditLogs(auditData || []);

      // Fetch sub-module records depending on active tab
      if (activeTab === "refunds" || activeTab === "credits") {
        const [refRes, credData] = await Promise.all([
          financeControllerService.refunds.list({ status: refundSubTab !== "ALL" ? refundSubTab : undefined }),
          financeControllerService.credits.getActive(),
        ]);
        setRefundsList(refRes.data || []);
        setActiveCreditsList(credData || []);
      } else if (activeTab === "coupons") {
        const coupRes = await financeControllerService.coupons.list();
        setCouponsList(coupRes.data || []);
      } else if (activeTab === "ticket_repository") {
        const tixRes = await financeControllerService.tickets.search({ query: searchQuery || undefined });
        setFinanceTicketsList(tixRes.data || []);
      } else if (activeTab === "tasks") {
        const [tasksRes, dashData] = await Promise.all([
          financeControllerService.tasks.list(),
          financeControllerService.tasks.getDashboard(),
        ]);
        setTasksList(tasksRes.data || []);
        setTaskDashboard(dashData || null);
      } else if (activeTab === "audit") {
        const auditRes = await financeControllerService.audit.list({ entityType: auditEntityFilter !== "ALL" ? auditEntityFilter : undefined });
        setAuditTrailList(auditRes.data || []);
      }
    } catch (err: any) {
      console.error("Error loading Finance Control Center data:", err);
      toast.error("Failed to load some finance queues");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, statusFilter, debouncedSearch, refundSubTab, auditEntityFilter]);

  // Debounce search input — wait 400ms after typing stops before firing API calls
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ── Cash Action Handlers ──
  const handleOpenCashModal = (item: CashSubmissionItem) => {
    setSelectedCashItem(item);
    setCashAction(item.hasDiscrepancy ? "APPROVE_WITH_DISCREPANCY" : "APPROVE");
    setActionNotes("");
    setActionReason("");
    setAdjustmentNote("");
    setIsCashModalOpen(true);
  };

  const handleCashActionSubmit = async () => {
    if (!selectedCashItem) return;

    if (currentUser?.id && selectedCashItem.salespersonId && currentUser.id === selectedCashItem.salespersonId) {
      toast.error("Separation of Duties: You cannot approve your own cash submission");
      return;
    }

    if (cashAction === "REJECT" && !actionReason.trim()) {
      toast.error("Rejection requires an explicit reason");
      return;
    }

    setIsSubmittingAction(true);
    try {
      await financeControllerService.performCashAction(selectedCashItem.id, {
        action: cashAction,
        notes: actionNotes.trim() || undefined,
        reason: actionReason.trim() || undefined,
        adjustmentNote: adjustmentNote.trim() || undefined,
      });

      toast.success(`Cash submission successfully ${cashAction.toLowerCase().replace(/_/g, " ")}`);
      setIsCashModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update cash submission");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleIncomingActionSubmit = async () => {
    if (!selectedIncomingItem) return;
    if (incomingAction === "REJECT" && !incomingReason.trim()) {
      toast.error("Rejection requires an explicit reason");
      return;
    }
    setIsSubmittingAction(true);
    try {
      await financeControllerService.performIncomingAction(selectedIncomingItem.id, {
        action: incomingAction,
        notes: incomingNotes.trim() || undefined,
        reason: incomingReason.trim() || undefined,
      });
      toast.success(`Incoming payment ${incomingAction.toLowerCase().replace(/_/g, " ")}`);
      setIsIncomingModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update incoming payment");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleVendorActionSubmit = async () => {
    if (!selectedVendorItem) return;
    if (!vendorPayAmount || vendorPayAmount <= 0) {
      toast.error("Enter a valid payout amount");
      return;
    }
    setIsSubmittingAction(true);
    try {
      await financeControllerService.performVendorAction(selectedVendorItem.id, {
        action: "RECORD_PAYMENT",
        paidAmount: vendorPayAmount,
        paymentMode: vendorPayMode,
        transactionRef: vendorTxnRef.trim() || undefined,
        notes: vendorNotes.trim() || undefined,
      });
      toast.success("Vendor payout recorded");
      setIsVendorModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record vendor payout");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleTicketAuditSubmit = async () => {
    if (!selectedTicketItem) return;
    setIsSubmittingAction(true);
    try {
      await financeControllerService.performTicketingAction(selectedTicketItem.id, {
        action: ticketAction,
        auditedCost: ticketAuditedCost || undefined,
        notes: ticketNotes.trim() || undefined,
      });
      toast.success(`Ticket audit ${ticketAction.toLowerCase().replace(/_/g, " ")}`);
      setIsTicketModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update ticket audit");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleOpenQueueReview = (
    kind: "departure" | "expense",
    item: DeparturePayoutItem | MiscellaneousExpenseItem
  ) => {
    setSelectedQueueItem({ kind, item });
    setQueueReviewAction("APPROVE");
    setQueueActionNotes("");
  };

  const handleAddExpenseSubmit = async () => {
    if (!addExpenseForm.tripId.trim()) {
      toast.error("Trip ID is required");
      return;
    }
    if (!addExpenseForm.departureDate) {
      toast.error("Departure date is required");
      return;
    }
    const amt = addExpenseForm.type === "ACTIVITY" ? addExpenseForm.totalAmount : addExpenseForm.amount;
    if (!amt || amt <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    const label = addExpenseForm.type === "ACTIVITY" ? addExpenseForm.activity : addExpenseForm.description;
    if (!label?.trim()) {
      toast.error(addExpenseForm.type === "ACTIVITY" ? "Activity name is required" : "Description is required");
      return;
    }
    setIsSubmittingExpense(true);
    try {
      let receiptUrl = addExpenseForm.receiptUrl;
      if (expenseProofFile && !receiptUrl) {
        setIsUploadingProof(true);
        const fd = new FormData();
        fd.append("image", expenseProofFile);
        const uploadRes = await api.post("/upload/single", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        receiptUrl = uploadRes.data?.url || "";
        setIsUploadingProof(false);
      }
      await financeControllerService.createExpense({
        ...addExpenseForm,
        receiptUrl,
        amount: addExpenseForm.type === "MISCELLANEOUS" ? addExpenseForm.amount : undefined,
        totalAmount: addExpenseForm.type === "ACTIVITY" ? addExpenseForm.totalAmount : undefined,
        amountPaid: addExpenseForm.type === "ACTIVITY" ? addExpenseForm.amountPaid : undefined,
      });
      toast.success("Expense recorded — awaiting approval");
      setShowAddExpenseModal(false);
      setExpenseProofFile(null);
      setExpenseProofPreview(null);
      fetchAllData();
    } catch (err: any) {
      setIsUploadingProof(false);
      toast.error(err.response?.data?.message || "Failed to create expense");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleQueueActionConfirm = async () => {
    if (!selectedQueueItem) return;
    if (queueReviewAction === "REJECT" && !queueActionNotes.trim()) {
      toast.error("Rejection requires an explicit reason");
      return;
    }
    setIsSubmittingAction(true);
    try {
      if (selectedQueueItem.kind === "departure") {
        await financeControllerService.performDepartureAction(selectedQueueItem.item.id, {
          action: queueReviewAction,
          notes: queueActionNotes.trim() || undefined,
        });
      } else {
        await financeControllerService.performExpenseAction(selectedQueueItem.item.id, {
          action: queueReviewAction,
          notes: queueActionNotes.trim() || undefined,
          reason: queueReviewAction === "REJECT" ? queueActionNotes.trim() || undefined : undefined,
        });
      }
      toast.success(queueReviewAction === "APPROVE" ? "Payment approved" : "Payment rejected");
      setSelectedQueueItem(null);
      setQueueActionNotes("");
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record decision");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ── Refund Action Handlers ──
  const handleCreateRefundSubmit = async () => {
    if (!refundForm.bookingId.trim()) {
      toast.error("Booking ID is required");
      return;
    }
    if (refundForm.refundMethod === "CASH_REFUND" && (!refundForm.refundAmount || refundForm.refundAmount <= 0)) {
      toast.error("Enter a valid refund amount");
      return;
    }
    if (refundForm.refundMethod === "CREDIT_NOTE" && (!refundForm.creditNoteAmount || refundForm.creditNoteAmount <= 0)) {
      toast.error("Enter a valid credit note amount");
      return;
    }

    try {
      const created = await financeControllerService.refunds.create(refundForm);
      toast.success(`Refund request #${created.id} created (PENDING_APPROVAL)`);
      setShowCreateRefundModal(false);
      setRefundForm({
        bookingId: "",
        refundReason: "CUSTOMER_CANCELLATION",
        refundMethod: "CASH_REFUND",
        refundAmount: 0,
        creditNoteAmount: 0,
        notes: "",
      });
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit refund request");
    }
  };

  const handleApproveRefund = async () => {
    if (!selectedRefundForAction) return;

    if (currentUser?.id && selectedRefundForAction.createdById && currentUser.id === selectedRefundForAction.createdById) {
      toast.error("Separation of Duties: Creator cannot approve own refund request");
      return;
    }

    try {
      await financeControllerService.refunds.approve(selectedRefundForAction.id, {
        refundReference: refundApprovalRef.trim() || undefined,
      });
      toast.success("Refund approved and processed");
      setShowRefundApproveDialog(false);
      setSelectedRefundForAction(null);
      setRefundApprovalRef("");
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve refund");
    }
  };

  const handleRejectRefund = async () => {
    if (!selectedRefundForAction) return;
    if (!refundRejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      await financeControllerService.refunds.reject(selectedRefundForAction.id, refundRejectReason.trim());
      toast.success("Refund rejected");
      setShowRefundRejectDialog(false);
      setSelectedRefundForAction(null);
      setRefundRejectReason("");
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject refund");
    }
  };

  // ── Apply Credit Note Handler ──
  const handleApplyCreditSubmit = async () => {
    if (!selectedCreditForApply) return;
    if (!applyCreditForm.targetBookingId.trim()) {
      toast.error("Target Booking ID is required");
      return;
    }
    const numAmount = Number(applyCreditForm.amountToUse);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount to use");
      return;
    }
    if (numAmount > (selectedCreditForApply.remainingBalance || 0)) {
      toast.error(`Cannot apply more than remaining balance of ₹${Number(selectedCreditForApply.remainingBalance || 0).toLocaleString("en-IN")}`);
      return;
    }

    try {
      await financeControllerService.credits.apply(selectedCreditForApply.refundId, {
        targetBookingId: applyCreditForm.targetBookingId.trim(),
        amountToUse: numAmount,
        notes: applyCreditForm.notes.trim() || undefined,
      });
      toast.success("Credit applied to booking successfully");
      setShowApplyCreditModal(false);
      setSelectedCreditForApply(null);
      setApplyCreditForm({ targetBookingId: "", amountToUse: 0, notes: "" });
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply credit");
    }
  };

  // ── Coupon Handlers ──
  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    try {
      if (editingCoupon) {
        await financeControllerService.coupons.update(editingCoupon.id, couponForm);
        toast.success("Coupon updated successfully");
      } else {
        await financeControllerService.coupons.create(couponForm);
        toast.success("Coupon created successfully");
      }
      setShowCouponModal(false);
      setEditingCoupon(null);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save coupon");
    }
  };

  const handleTestCouponValidation = async () => {
    if (!couponTestCode.trim()) {
      toast.error("Enter a coupon code to test");
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await financeControllerService.coupons.validate(couponTestCode.trim(), {
        bookingAmount: Number(couponTestAmount) || 0,
      });
      setCouponValidationResult(res);
      if (res.isValid) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      setCouponValidationResult(err.response?.data || { isValid: false, message: "Validation failed" });
      toast.error(err.response?.data?.message || "Coupon is invalid");
    } finally {
      setValidatingCoupon(false);
    }
  };

  // ── Ticket Bulk Upload ──
  const handleBulkUploadSubmit = async () => {
    if (!bulkCsvText.trim()) {
      toast.error("Please paste CSV data or rows");
      return;
    }

    try {
      const lines = bulkCsvText.trim().split("\n");
      const tickets: any[] = [];

      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 2) {
          const [pnr, bookingId, cost, provider, source, destination] = parts;
          if (pnr.toLowerCase() === "pnr") continue; // skip header
          tickets.push({
            pnr,
            bookingId,
            cost: Number(cost) || 0,
            provider: provider || "IRCTC",
            source: source || null,
            destination: destination || null,
          });
        }
      }

      if (tickets.length === 0) {
        toast.error("No valid CSV rows parsed. Format: PNR, BookingID, Cost, Provider, Source, Destination");
        return;
      }

      const result = await financeControllerService.tickets.bulkUpload(tickets);
      setBulkUploadResult(result);
      toast.success(`Processed: ${result.ingestedCount} ingested, ${result.duplicateCount} duplicates, ${result.unmatchedCount} unmatched`);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bulk upload failed");
    }
  };

  // ── Task Actions ──
  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    try {
      await financeControllerService.tasks.create({
        ...taskForm,
        assignedToId: taskForm.assignedToId || currentUser?.id,
      });
      toast.success("Task allotment created");
      setShowCreateTaskModal(false);
      setTaskForm({
        title: "",
        description: "",
        taskType: "OTHER",
        priority: "MEDIUM",
        assignedToId: currentUser?.id || "",
        bookingId: "",
        deadline: "",
      });
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create task");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await financeControllerService.tasks.updateStatus(taskId, { status: newStatus });
      toast.success(`Task status updated to ${newStatus}`);
      fetchAllData();
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update task");
    }
  };

  const handleAddTaskComment = async () => {
    if (!selectedTask || !taskCommentText.trim()) return;
    try {
      const comment = await financeControllerService.tasks.addComment(selectedTask.id, {
        comment: taskCommentText.trim(),
      });
      toast.success("Comment added");
      setSelectedTask((prev) => prev ? { ...prev, comments: [comment, ...(prev.comments || [])] } : null);
      setTaskCommentText("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    }
  };

  // ── CSV Audit Export ──
  const handleExportAuditCsv = async () => {
    try {
      const res = await financeControllerService.audit.getEntityTrail(
        auditEntityFilter !== "ALL" ? auditEntityFilter : "ALL",
        "ALL",
        "csv"
      );
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `financial_audit_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Audit CSV downloaded");
    } catch {
      toast.error("Failed to export audit CSV");
    }
  };

  const queueCounts: Record<QueueTab, number> = {
    cash: cashQueue.filter((c) => c.status === "PENDING").length,
    incoming: incomingQueue.filter((i) => i.status === "PENDING").length,
    vendor: vendorQueue.filter((v) => v.paymentStatus === "pending" || v.paymentStatus === "partial").length,
    departures: departuresQueue.filter((d) => d.status === "PENDING" || d.status === "APPROVED").length,
    ticketing: ticketingQueue.filter((t) => t.status === "PENDING").length,
    refunds: refundsList.filter((r) => r.status === "PENDING_APPROVAL").length,
    credits: activeCreditsList.length,
    ticket_repository: financeTicketsList.filter((t) => t.status === "PENDING_VERIFICATION").length,
    tasks: taskDashboard?.overdueCount || 0,
    coupons: couponsList.filter((c) => c.status === "ACTIVE").length,
    expenses: expensesQueue.filter((e) => e.status === "PENDING").length,
    discrepancies: discrepanciesQueue.filter((d) => d.status === "PENDING").length,
    audit: auditTrailList.length,
  };

  const queueTabs: { id: QueueTab; label: string }[] = [
    { id: "cash", label: "Cash" },
    { id: "incoming", label: "Incoming" },
    { id: "vendor", label: "Vendors" },
    { id: "refunds", label: "Refunds" },
    { id: "credits", label: "Credits" },
    { id: "tasks", label: "Tasks" },
    { id: "coupons", label: "Coupons" },
    { id: "departures", label: "Departures" },
    { id: "expenses", label: "Expenses" },
    { id: "discrepancies", label: "Discrepancies" },
    { id: "audit", label: "Audit" },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      <div className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
        !embedded && "border-b border-slate-200 pb-4",
      )}>
        {!embedded && (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#FF4D00]" />
              <h1 className="text-lg md:text-xl font-bold text-[#0B1528] tracking-tight">Finance Control Center</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Approvals, cash, refunds, vendors, and audit — one queue.
            </p>
          </div>
        )}

        <div className={cn("flex w-full flex-wrap items-center gap-2 sm:w-auto", embedded && "ml-auto sm:ml-auto")}>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={isRefreshing}
            className="h-8 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />
            Refresh
          </Button>

          {activeTab === "refunds" && (
            <FinancePrimaryButton onClick={() => setShowCreateRefundModal(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Request Refund
            </FinancePrimaryButton>
          )}

          {activeTab === "coupons" && (
            <FinancePrimaryButton
              onClick={() => {
                setEditingCoupon(null);
                setCouponForm({
                  code: "",
                  description: "",
                  discountType: "PERCENTAGE",
                  discountValue: 10,
                  maxDiscountAmount: 1000,
                  minBookingAmount: 5000,
                  maxUsesTotal: 100,
                  validFrom: new Date().toISOString().split("T")[0],
                  validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
                  status: "ACTIVE",
                });
                setShowCouponModal(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Coupon
            </FinancePrimaryButton>
          )}

          {activeTab === "ticket_repository" && (
            <FinancePrimaryButton onClick={() => setShowBulkUploadModal(true)}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Bulk CSV
            </FinancePrimaryButton>
          )}

          {activeTab === "expenses" && (
            <FinancePrimaryButton
              onClick={() => {
                setAddExpenseForm({
                  type: expenseSubTab,
                  tripId: "",
                  departureDate: new Date().toISOString().split("T")[0],
                  category: "MISCELLANEOUS",
                  description: "",
                  amount: 0,
                  activity: "",
                  totalAmount: 0,
                  amountPaid: 0,
                  paymentDate: "",
                  paymentMode: "BANK_TRANSFER",
                  remarks: "",
                  receiptUrl: "",
                });
                setShowAddExpenseModal(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Payment
            </FinancePrimaryButton>
          )}

          {activeTab === "tasks" && (
            <FinancePrimaryButton onClick={() => setShowCreateTaskModal(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Assign Task
            </FinancePrimaryButton>
          )}

          {activeTab === "audit" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAuditCsv}
              className="h-8 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <div className="mobile-grid-keep grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 md:gap-2.5">
        {[
          {
            id: "incoming" as QueueTab,
            label: "Incoming",
            val: queueCounts.incoming,
            sub: `${formatINR(stats?.todayCollections || 0)} today`,
            alert: true,
          },
          {
            id: "cash" as QueueTab,
            label: "Cash",
            val: queueCounts.cash,
            sub: `${formatINR(stats?.cashPendingAmount || 0)} pending`,
            alert: true,
          },
          {
            id: "vendor" as QueueTab,
            label: "Vendors",
            val: queueCounts.vendor,
            sub: "Outstanding payouts",
            alert: true,
          },
          {
            id: "refunds" as QueueTab,
            label: "Refunds",
            val: queueCounts.refunds,
            sub: "Needs approval",
            alert: true,
          },
          {
            id: "credits" as QueueTab,
            label: "Credits",
            val: queueCounts.credits,
            sub: "Store credit open",
            alert: false,
          },
          {
            id: "discrepancies" as QueueTab,
            label: "Discrepancies",
            val: queueCounts.discrepancies,
            sub: "Mismatches",
            alert: true,
          },
          {
            id: "tasks" as QueueTab,
            label: "Overdue",
            val: queueCounts.tasks,
            sub: `${taskDashboard?.completionRate || 0}% complete`,
            alert: true,
          },
        ].map((item) => (
          <FinanceKpiCard
            key={item.id}
            label={item.label}
            value={item.val}
            sub={item.sub}
            active={activeTab === item.id}
            alert={item.alert}
            onClick={() => handleTabChange(item.id)}
          />
        ))}
      </div>

      <div className="sticky top-0 z-20 -mx-1 bg-[#F4F7FB]/95 px-1 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto no-scrollbar">
          {queueTabs.map((tab) => {
            const count = queueCounts[tab.id];
            const showCount = ["cash", "incoming", "vendor", "ticketing", "refunds", "discrepancies", "expenses", "departures", "tasks"].includes(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "shrink-0 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-[#FF4D00] text-[#FF4D00]"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                {tab.label}
                {showCount && count > 0 && (
                  <span className={cn(
                    "ml-1.5 inline-flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full text-[10px] font-bold",
                    activeTab === tab.id ? "bg-[#FF4D00] text-white" : "bg-amber-100 text-amber-800",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && <FinanceLoadingBlock />}

      {/* ─────────────────────────────────────────────────────────────
          1. CASH VERIFICATION TAB
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "cash" && !isLoading && (
        <FinanceQueueCard
          title="Cash Verification"
          description="Match sales cash submissions to booking records before closing the handover."
          toolbar={
            <>
              <Input
                placeholder="Search salesperson, booking…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs w-full sm:w-56 bg-white"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-full sm:w-32 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        >
          {cashQueue.length === 0 ? (
            <FinanceEmptyState title="No cash submissions" description="Nothing matches the current filters." />
          ) : (
            <FinanceTable>
              <FinanceTableHead
                columns={[
                  { label: "Salesperson" },
                  { label: "Booking" },
                  { label: "Expected", align: "right" },
                  { label: "Submitted", align: "right" },
                  { label: "Difference", align: "right" },
                  { label: "Date" },
                  { label: "Status" },
                  { label: "Action", align: "right" },
                ]}
              />
              <tbody className="divide-y divide-slate-100">
                {cashQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className={cn(financeTd, "font-semibold text-slate-800")}>
                      {item.salespersonName}
                      <div className="text-[10px] text-slate-400 font-medium">{item.salespersonEmail || item.salespersonPhone || "Sales"}</div>
                    </td>
                    <td className={financeTd}>
                      <span className="font-mono font-bold text-slate-900">{item.bookingId}</span>
                      <div className="text-slate-500 text-[11px]">{item.customerName} • {item.tripName}</div>
                    </td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.expectedAmount} tone="muted" /></td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.submittedAmount} /></td>
                    <td className={cn(financeTd, "text-right")}>
                      <MoneyAmount
                        value={item.difference === 0 ? null : item.difference}
                        signed
                        tone={item.difference < 0 ? "debit" : "credit"}
                        empty="—"
                      />
                    </td>
                    <td className={cn(financeTd, "text-slate-500 font-mono text-[11px]")}>{safeFormatDate(item.submittedAt)}</td>
                    <td className={financeTd}><FinanceStatusBadge status={item.status} /></td>
                    <td className={cn(financeTd, "text-right")}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCashModal(item)}
                        className="h-7 text-xs font-semibold border-slate-200 hover:bg-slate-100 text-slate-700"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </FinanceTable>
          )}
        </FinanceQueueCard>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. INCOMING PAYMENTS TAB
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "incoming" && !isLoading && (
        <FinanceQueueCard
          title="Incoming Payments"
          description="Bank / UPI collections waiting for controller verification."
          toolbar={
            <Input
              placeholder="Search booking, reference…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs w-full sm:w-64 bg-white"
            />
          }
        >
          {incomingQueue.length === 0 ? (
            <FinanceEmptyState title="No incoming payments" description="Nothing is waiting for verification." />
          ) : (
            <FinanceTable>
              <FinanceTableHead
                columns={[
                  { label: "Booking" },
                  { label: "Customer" },
                  { label: "Amount", align: "right" },
                  { label: "Mode" },
                  { label: "Account" },
                  { label: "Booking Date" },
                  { label: "Trip Departure" },
                  { label: "Submitted by" },
                  { label: "Status" },
                  { label: "Action", align: "right" },
                ]}
              />
              <tbody className="divide-y divide-slate-100">
                {incomingQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className={cn(financeTd, "font-mono font-bold text-slate-900")}>{item.bookingId}</td>
                    <td className={financeTd}>
                      <span className="font-semibold text-slate-800">{item.customerName}</span>
                      <div className="text-[10px] text-slate-400">{item.tripName}</div>
                    </td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.amount} /></td>
                    <td className={financeTd}>
                      <span className="font-semibold text-slate-700">{item.paymentMode}</span>
                      <div className="font-mono text-[10px] text-slate-400">{item.referenceNumber || "—"}</div>
                    </td>
                    <td className={cn(financeTd, "text-slate-600")}>{item.collectionAccountName || item.bankName || "Primary"}</td>
                    <td className={cn(financeTd, "text-slate-500 whitespace-nowrap")}>
                      {item.bookingDate
                        ? new Date(item.bookingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className={cn(financeTd, "whitespace-nowrap")}>
                      {item.tripDepartureDate ? (
                        <span className={cn(
                          "font-semibold",
                          new Date(item.tripDepartureDate) < new Date()
                            ? "text-red-600"
                            : new Date(item.tripDepartureDate).getTime() - Date.now() < 7 * 86400000
                              ? "text-amber-600"
                              : "text-slate-700",
                        )}>
                          {new Date(item.tripDepartureDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className={cn(financeTd, "text-slate-500")}>{item.submittedBy}</td>
                    <td className={financeTd}><FinanceStatusBadge status={item.status} /></td>
                    <td className={cn(financeTd, "text-right")}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIncomingItem(item);
                          setIncomingAction("VERIFY");
                          setIncomingNotes("");
                          setIncomingReason("");
                          setIsIncomingModalOpen(true);
                        }}
                        className="h-7 text-xs font-semibold border-slate-200 hover:bg-slate-100 text-slate-700"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </FinanceTable>
          )}
        </FinanceQueueCard>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. OUTGOING / VENDOR PAYMENTS TAB
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "vendor" && !isLoading && (
        <FinanceQueueCard
          title="Vendor Payments"
          description="Trip-scoped vendor tariffs and outstanding disbursements."
        >
          {vendorQueue.length === 0 ? (
            <FinanceEmptyState title="No vendor payouts" description="No outstanding vendor payment requests." />
          ) : (
            <FinanceTable>
              <FinanceTableHead
                columns={[
                  { label: "Vendor" },
                  { label: "Trip" },
                  { label: "Service" },
                  { label: "Tariff", align: "right" },
                  { label: "Paid", align: "right" },
                  { label: "Outstanding", align: "right" },
                  { label: "Status" },
                  { label: "Action", align: "right" },
                ]}
              />
              <tbody className="divide-y divide-slate-100">
                {vendorQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className={cn(financeTd, "font-semibold text-slate-800")}>
                      {item.vendorName}
                      <div className="text-[10px] text-slate-400">{item.vendorPhone || "—"}</div>
                    </td>
                    <td className={financeTd}>
                      <span className="font-semibold text-slate-800">{item.tripTitle}</span>
                      <div className="text-[10px] text-slate-400">{item.tripLocation}</div>
                    </td>
                    <td className={cn(financeTd, "uppercase text-[10px] font-bold text-slate-600")}>{item.vendorType}</td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.agreedTariff} tone="muted" /></td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.paidAmount} tone="credit" /></td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.outstandingAmount} tone="outstanding" /></td>
                    <td className={financeTd}><FinanceStatusBadge status={item.paymentStatus} /></td>
                    <td className={cn(financeTd, "text-right")}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedVendorItem(item);
                          setVendorPayAmount(item.outstandingAmount);
                          setVendorPayMode("Bank Transfer");
                          setVendorTxnRef("");
                          setVendorNotes("");
                          setIsVendorModalOpen(true);
                        }}
                        className="h-7 text-xs font-semibold border-slate-200 hover:bg-slate-100 text-slate-700"
                      >
                        Record Payout
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </FinanceTable>
          )}
        </FinanceQueueCard>
      )}

      {activeTab === "ticketing" && !isLoading && (
        <FinanceQueueCard
          title="Ticket Margin Audit"
          description="Compare actual ticket cost against package allowance before approval."
        >
          {ticketingQueue.length === 0 ? (
            <FinanceEmptyState title="No tickets to audit" description="Ticketing queue is clear." />
          ) : (
            <FinanceTable>
              <FinanceTableHead
                columns={[
                  { label: "Booking" },
                  { label: "PNR / Train" },
                  { label: "Route" },
                  { label: "Cost", align: "right" },
                  { label: "Allowance", align: "right" },
                  { label: "Margin", align: "right" },
                  { label: "Status" },
                  { label: "Action", align: "right" },
                ]}
              />
              <tbody className="divide-y divide-slate-100">
                {ticketingQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className={financeTd}>
                      <span className="font-mono font-bold text-slate-900">{item.bookingId}</span>
                      <div className="text-[11px] text-slate-500">{item.customerName} • {item.tripName}</div>
                    </td>
                    <td className={financeTd}>
                      <span className="font-mono font-bold">{item.pnr}</span>
                      <div className="text-[10px] text-slate-400">{item.trainNo} · {item.preferredClass}</div>
                    </td>
                    <td className={cn(financeTd, "text-slate-600")}>{item.fromStation} → {item.toStation}</td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.actualTicketCost} /></td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.packageAllowance} tone="muted" /></td>
                    <td className={cn(financeTd, "text-right")}>
                      <MoneyAmount value={item.ticketingMargin} signed tone={item.ticketingMargin >= 0 ? "credit" : "debit"} />
                    </td>
                    <td className={financeTd}><FinanceStatusBadge status={item.status} /></td>
                    <td className={cn(financeTd, "text-right")}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicketItem(item);
                          setTicketAuditedCost(item.actualTicketCost);
                          setTicketAction(item.variance && item.variance !== 0 ? "FLAG_VARIANCE" : "APPROVE");
                          setTicketNotes("");
                          setIsTicketModalOpen(true);
                        }}
                        className="h-7 text-xs font-semibold border-slate-200"
                      >
                        Audit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </FinanceTable>
          )}
        </FinanceQueueCard>
      )}

      {activeTab === "departures" && !isLoading && (
        <FinanceQueueCard title="Departure Payouts" description="Guide and field payouts tied to departing trips.">
          {departuresQueue.length === 0 ? (
            <FinanceEmptyState title="No departure payouts" />
          ) : (
            <FinanceTable>
              <FinanceTableHead
                columns={[
                  { label: "Payout" },
                  { label: "Recipient" },
                  { label: "Trip" },
                  { label: "Amount", align: "right" },
                  { label: "Submitted" },
                  { label: "Status" },
                  { label: "Action", align: "right" },
                ]}
              />
              <tbody className="divide-y divide-slate-100">
                {departuresQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className={financeTd}>
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      <div className="text-[10px] text-slate-400 uppercase">{item.type}</div>
                    </td>
                    <td className={cn(financeTd, "text-slate-700")}>{item.recipient}</td>
                    <td className={cn(financeTd, "font-mono text-slate-600")}>{item.tripCode}</td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.amount} /></td>
                    <td className={cn(financeTd, "text-[11px] text-slate-500")}>{item.submittedBy} · {safeFormatDate(item.submittedAt)}</td>
                    <td className={financeTd}><FinanceStatusBadge status={item.status} /></td>
                    <td className={cn(financeTd, "text-right")}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenQueueReview("departure", item)}
                        className="h-7 text-xs font-semibold border-slate-200 hover:bg-slate-100 text-slate-700"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </FinanceTable>
          )}
        </FinanceQueueCard>
      )}

      {activeTab === "expenses" && !isLoading && (
        <FinanceQueueCard
          title={expenseSubTab === "MISCELLANEOUS" ? "Miscellaneous Expenses" : "Activity Payments"}
          description={
            expenseSubTab === "MISCELLANEOUS"
              ? "Office and field miscellaneous expense claims awaiting controller sign-off."
              : "Trip activity and operational payment claims awaiting controller sign-off."
          }
        >
          {/* Sub-tab switcher */}
          <div className="flex items-center gap-1 border-b border-slate-100 px-4 pt-1 pb-0 -mt-1">
            {(["MISCELLANEOUS", "ACTIVITY"] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setExpenseSubTab(sub)}
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap",
                  expenseSubTab === sub
                    ? "border-[#FF4D00] text-[#FF4D00]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {sub === "MISCELLANEOUS" ? "Miscellaneous" : "Activity Payments"}
                {(() => {
                  const cnt = expensesQueue.filter(
                    (e) => (e.type || "MISCELLANEOUS") === sub && e.status === "PENDING"
                  ).length;
                  return cnt > 0 ? (
                    <span className={cn(
                      "ml-1.5 inline-flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full text-[10px] font-bold",
                      expenseSubTab === sub ? "bg-[#FF4D00] text-white" : "bg-amber-100 text-amber-800"
                    )}>
                      {cnt}
                    </span>
                  ) : null;
                })()}
              </button>
            ))}
          </div>

          {(() => {
            const filtered = expensesQueue.filter(
              (e) => (e.type || "MISCELLANEOUS") === expenseSubTab
            );
            if (filtered.length === 0) {
              return (
                <FinanceEmptyState
                  title={`No ${expenseSubTab === "MISCELLANEOUS" ? "miscellaneous" : "activity"} expense claims`}
                  description="Use 'Add Payment' to log a new expense for controller review."
                />
              );
            }
            return (
              <FinanceTable>
                <FinanceTableHead
                  columns={[
                    { label: expenseSubTab === "MISCELLANEOUS" ? "Expense" : "Activity" },
                    { label: "Category" },
                    { label: "Amount", align: "right" },
                    { label: "Mode" },
                    { label: "Receipt / Proof" },
                    { label: "Submitted" },
                    { label: "Status" },
                    { label: "Actions", align: "right" },
                  ]}
                />
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className={cn(financeTd, "font-semibold text-slate-800")}>{item.title}</td>
                      <td className={cn(financeTd, "text-slate-600")}>{item.category}</td>
                      <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.amount} tone="debit" /></td>
                      <td className={financeTd}>{item.paymentMode}</td>
                      <td className={cn(financeTd, "text-[11px]")}>
                        {item.receiptUrl ? (
                          <a
                            href={item.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-mono"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Proof
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono">{item.receiptNumber || "—"}</span>
                        )}
                      </td>
                      <td className={cn(financeTd, "text-[11px] text-slate-500")}>{item.submittedBy} · {safeFormatDate(item.submittedAt)}</td>
                      <td className={financeTd}><FinanceStatusBadge status={item.status} /></td>
                      <td className={cn(financeTd, "text-right")}>
                        <div className="flex justify-end gap-1.5">
                          {item.status === "PENDING" || item.status === "Due" ? (
                            <>
                              <FinanceApproveButton
                                onClick={() => {
                                  setSelectedQueueItem({ kind: "expense", item });
                                  setQueueReviewAction("APPROVE");
                                  setQueueActionNotes("");
                                }}
                              >
                                Approve
                              </FinanceApproveButton>
                              <FinanceRejectButton
                                onClick={() => {
                                  setSelectedQueueItem({ kind: "expense", item });
                                  setQueueReviewAction("REJECT");
                                  setQueueActionNotes("");
                                }}
                              >
                                Reject
                              </FinanceRejectButton>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenQueueReview("expense", item)}
                              className="h-7 text-xs font-semibold border-slate-200 hover:bg-slate-100 text-slate-700"
                            >
                              Details
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </FinanceTable>
            );
          })()}
        </FinanceQueueCard>
      )}

      {activeTab === "discrepancies" && !isLoading && (
        <FinanceQueueCard title="Discrepancies" description="Flagged mismatches between expected and submitted amounts.">
          {discrepanciesQueue.length === 0 ? (
            <FinanceEmptyState title="No discrepancies" description="All submissions currently match expected amounts." />
          ) : (
            <FinanceTable>
              <FinanceTableHead
                columns={[
                  { label: "Type" },
                  { label: "Reference" },
                  { label: "Party" },
                  { label: "Expected", align: "right" },
                  { label: "Submitted", align: "right" },
                  { label: "Difference", align: "right" },
                  { label: "Reason" },
                  { label: "Status" },
                ]}
              />
              <tbody className="divide-y divide-slate-100">
                {discrepanciesQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className={financeTd}><FinanceStatusBadge status={item.type} /></td>
                    <td className={cn(financeTd, "font-mono font-bold")}>{item.sourceRef}</td>
                    <td className={financeTd}>
                      <span className="font-semibold">{item.salespersonName || item.customerName}</span>
                      <div className="text-[10px] text-slate-400">{item.tripName}</div>
                    </td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.expectedAmount} tone="muted" /></td>
                    <td className={cn(financeTd, "text-right")}><MoneyAmount value={item.submittedAmount} /></td>
                    <td className={cn(financeTd, "text-right")}>
                      <MoneyAmount value={item.difference} signed tone={item.difference < 0 ? "debit" : "credit"} />
                    </td>
                    <td className={cn(financeTd, "text-slate-600 max-w-[200px] truncate")}>{item.reason || "—"}</td>
                    <td className={financeTd}><FinanceStatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </FinanceTable>
          )}
        </FinanceQueueCard>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. REFUNDS TAB
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "refunds" && (
        <Card className="rounded-lg border border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Refund Requests Queue</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Separation of Duties approval workflow for cash bank transfers and store credit notes.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select value={refundSubTab} onValueChange={(v: any) => setRefundSubTab(v)}>
                <SelectTrigger className="h-8 text-xs w-40 bg-white">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Refund ID</th>
                    <th className="py-2.5 px-4">Booking & Customer</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4 text-right">Cash Amount</th>
                    <th className="py-2.5 px-4 text-right">Credit Amount</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refundsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No refund requests found.
                      </td>
                    </tr>
                  ) : (
                    refundsList.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{ref.id}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-800">{ref.bookingId}</span>
                          <div className="text-slate-500 text-[11px]">
                            {ref.booking?.fullName || ref.booking?.name || "Customer"}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{ref.refundReason.replace(/_/g, " ")}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {ref.refundMethod}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {Number(ref.refundAmount || 0) > 0 ? `₹${Number(ref.refundAmount || 0).toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#FF4D00]">
                          {Number(ref.creditNoteAmount || 0) > 0 ? `₹${Number(ref.creditNoteAmount || 0).toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              ref.status === "COMPLETED" || ref.status === "APPROVED"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : ref.status === "REJECTED"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {ref.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {ref.status === "PENDING_APPROVAL" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <FinanceApproveButton
                                onClick={() => {
                                  setSelectedRefundForAction(ref);
                                  setShowRefundApproveDialog(true);
                                }}
                              >
                                Approve
                              </FinanceApproveButton>
                              <FinanceRejectButton
                                onClick={() => {
                                  setSelectedRefundForAction(ref);
                                  setShowRefundRejectDialog(true);
                                }}
                              >
                                Reject
                              </FinanceRejectButton>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {ref.refundReference || ref.rejectionReason || "Closed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. CREDIT NOTES TAB
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "credits" && (
        <Card className="rounded-lg border border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Active Credit Notes Repository</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Track customer credit note balances, deductions, and impending expiration warnings.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Credit Code</th>
                    <th className="py-2.5 px-4">Origin Booking</th>
                    <th className="py-2.5 px-4 text-right">Original Amount</th>
                    <th className="py-2.5 px-4 text-right">Used</th>
                    <th className="py-2.5 px-4 text-right">Remaining Balance</th>
                    <th className="py-2.5 px-4">Validity / Expiry</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeCreditsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No active credit notes in system.
                      </td>
                    </tr>
                  ) : (
                    activeCreditsList.map((cred) => (
                      <tr key={cred.refundId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{cred.code || cred.refundId}</td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">{cred.bookingId}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                          ₹{Number(cred.originalAmount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-500">
                          ₹{Number(cred.totalUsed || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-green-600">
                          ₹{Number(cred.remainingBalance || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] text-slate-700">
                            {cred.expiresAt ? new Date(cred.expiresAt).toLocaleDateString("en-IN") : "No Expiry"}
                          </span>
                          {cred.isExpiringSoon && (
                            <Badge variant="outline" className="ml-1.5 text-[9px] bg-red-50 text-red-600 border-red-200">
                              Expiring Soon
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              cred.status === "ACTIVE"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : cred.status === "PARTIALLY_USED"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            )}
                          >
                            {cred.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedCreditForApply(cred);
                              setApplyCreditForm({
                                targetBookingId: "",
                                amountToUse: cred.remainingBalance,
                                notes: "",
                              });
                              setShowApplyCreditModal(true);
                            }}
                            className="h-7 text-xs font-bold bg-[#FF4D00] hover:bg-[#E04400] text-white shadow-2xs"
                          >
                            Apply Credit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. TICKET REPOSITORY & BULK UPLOAD TAB
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "ticket_repository" && (
        <div className="space-y-4">
          <Card className="rounded-lg border border-slate-200 shadow-xs bg-white">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Finance Ticket Repository</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Central IRCTC, flight, and transport ticket database linked directly to bookings and tariffs.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search PNR, Booking ID, passenger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs w-64 bg-white"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-4">PNR / Ticket #</th>
                      <th className="py-2.5 px-4">Type & Provider</th>
                      <th className="py-2.5 px-4">Booking & Customer</th>
                      <th className="py-2.5 px-4">Route</th>
                      <th className="py-2.5 px-4 text-right">Cost</th>
                      <th className="py-2.5 px-4 text-right">Allowance</th>
                      <th className="py-2.5 px-4 text-right">Margin</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financeTicketsList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          No tickets found in repository.
                        </td>
                      </tr>
                    ) : (
                      financeTicketsList.map((tix) => (
                        <tr key={tix.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {tix.pnr || tix.ticketNumber || "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">{tix.type}</span>
                            <div className="text-[10px] text-slate-400">{tix.provider}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-800">{tix.bookingId || "Unlinked"}</span>
                            <div className="text-[10px] text-slate-500">{tix.booking?.fullName || "—"}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {tix.source && tix.destination ? `${tix.source} ➔ ${tix.destination}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{Number(tix.cost || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {tix.packageAllowance !== null && tix.packageAllowance !== undefined
                              ? `₹${Number(tix.packageAllowance || 0).toLocaleString("en-IN")}`
                              : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span
                              className={cn(
                                tix.ticketingMargin !== null && tix.ticketingMargin >= 0
                                  ? "text-green-600"
                                  : tix.ticketingMargin !== null
                                  ? "text-red-600"
                                  : "text-slate-400"
                              )}
                            >
                              {tix.ticketingMargin !== null && tix.ticketingMargin !== undefined
                                ? `₹${Number(tix.ticketingMargin || 0).toLocaleString("en-IN")}`
                                : "—"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase",
                                tix.status === "VERIFIED"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : tix.status === "REJECTED"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                            >
                              {tix.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {tix.status === "PENDING_VERIFICATION" ? (
                              <Button
                                size="sm"
                                onClick={() => setConfirmTicketVerifyId(tix.id)}
                                className="h-7 text-xs font-bold bg-green-600 hover:bg-green-700 text-white shadow-2xs"
                              >
                                Verify
                              </Button>
                            ) : (
                              <span className="text-[11px] font-mono text-green-700 font-bold">
                                Verified
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. TASK BOARD & WORKLOAD DASHBOARD TAB
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* Workload Summary Strip */}
          {taskDashboard && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <Card className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-slate-400">Total Tasks</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{taskDashboard.totalTasks}</div>
              </Card>
              <Card className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-amber-600">Pending</div>
                <div className="text-xl font-extrabold text-amber-600 mt-1 font-mono">{taskDashboard.pendingCount}</div>
              </Card>
              <Card className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-blue-600">In Progress</div>
                <div className="text-xl font-extrabold text-blue-600 mt-1 font-mono">{taskDashboard.inProgressCount}</div>
              </Card>
              <Card className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-red-600">Blocked</div>
                <div className="text-xl font-extrabold text-red-600 mt-1 font-mono">{taskDashboard.blockedCount}</div>
              </Card>
              <Card className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-green-600">Completed</div>
                <div className="text-xl font-extrabold text-green-600 mt-1 font-mono">{taskDashboard.completedCount}</div>
              </Card>
              <Card className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-red-700">Overdue</div>
                <div className="text-xl font-extrabold text-red-700 mt-1 font-mono">{taskDashboard.overdueCount}</div>
              </Card>
            </div>
          )}

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { id: "PENDING", title: "Pending", color: "border-slate-300" },
              { id: "IN_PROGRESS", title: "In Progress", color: "border-blue-400" },
              { id: "BLOCKED", title: "Blocked", color: "border-red-400" },
              { id: "COMPLETED", title: "Completed", color: "border-green-400" },
              { id: "CANCELLED", title: "Cancelled", color: "border-slate-300" },
            ].map((col) => {
              const colTasks = tasksList.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className="bg-slate-50/80 rounded-lg p-3 border border-slate-200 flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                    <span className="text-xs font-bold text-slate-800">{col.title}</span>
                    <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                      {colTasks.length}
                    </Badge>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px] pr-1">
                    {colTasks.map((t) => {
                      const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== "COMPLETED";
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTask(t);
                            setShowTaskDrawer(true);
                          }}
                          className={cn(
                            "p-3 rounded-md bg-white border shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-1.5",
                            isOverdue ? "border-red-300 bg-red-50/20" : "border-slate-200"
                          )}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">{t.title}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-bold uppercase shrink-0",
                                t.priority === "URGENT"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : t.priority === "HIGH"
                                  ? "bg-[#FF4D00]/5 text-[#C2410C] border-[#FF4D00]/30"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              )}
                            >
                              {t.priority}
                            </Badge>
                          </div>

                          {t.bookingId && (
                            <div className="text-[10px] font-mono text-slate-500">
                              Booking: <span className="font-bold text-slate-700">{t.bookingId}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <span className="truncate">{t.assignedTo?.name || "Staff"}</span>
                            {t.deadline && (
                              <span className={cn("font-mono font-bold", isOverdue ? "text-red-600" : "text-slate-500")}>
                                {new Date(t.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. COUPONS TAB
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "coupons" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-lg border border-slate-200 shadow-xs bg-white">
              <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">Active Coupons & Discounts</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Manage promo codes, usage counters, and authoritative discount rules.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-4">Coupon Code</th>
                        <th className="py-2.5 px-4">Type & Value</th>
                        <th className="py-2.5 px-4">Usage Limits</th>
                        <th className="py-2.5 px-4">Max Discount</th>
                        <th className="py-2.5 px-4">Validity</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {couponsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No coupons created yet.
                          </td>
                        </tr>
                      ) : (
                        couponsList.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">{c.code}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₹${Number(c.discountValue || 0).toLocaleString("en-IN")}`}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {c.currentUsesCount} / {c.maxUsesTotal || "Unlimited"}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">
                              {c.maxDiscountAmount ? `₹${Number(c.maxDiscountAmount || 0).toLocaleString("en-IN")}` : "No Cap"}
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                              {new Date(c.validUntil).toLocaleDateString("en-IN")}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-bold uppercase",
                                  c.status === "ACTIVE"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                )}
                              >
                                {c.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCoupon(c);
                                  setCouponForm({
                                    code: c.code,
                                    description: c.description || "",
                                    discountType: c.discountType,
                                    discountValue: c.discountValue,
                                    maxDiscountAmount: c.maxDiscountAmount || 0,
                                    minBookingAmount: c.minBookingAmount || 0,
                                    maxUsesTotal: c.maxUsesTotal || 0,
                                    validFrom: new Date(c.validFrom).toISOString().split("T")[0],
                                    validUntil: new Date(c.validUntil).toISOString().split("T")[0],
                                    status: c.status,
                                  });
                                  setShowCouponModal(true);
                                }}
                                className="h-7 text-xs font-semibold border-slate-200 hover:bg-slate-100"
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Authoritative Coupon Tester */}
          <div>
            <Card className="rounded-lg border border-slate-200 shadow-xs bg-white">
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Authoritative Server Validator</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Simulate authoritative backend discount calculation against server logic.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Coupon Code</label>
                  <Input
                    value={couponTestCode}
                    onChange={(e) => setCouponTestCode(e.target.value.toUpperCase())}
                    placeholder="SUMMER2026"
                    className="h-8 text-xs font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Test Booking Amount (₹)</label>
                  <Input
                    type="number"
                    value={couponTestAmount}
                    onChange={(e) => setCouponTestAmount(Number(e.target.value))}
                    className="h-8 text-xs font-mono mt-1"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleTestCouponValidation}
                  disabled={validatingCoupon}
                  className="w-full h-8 text-xs font-bold bg-[#FF4D00] hover:bg-[#E04400] text-white"
                >
                  {validatingCoupon ? "Validating on Server..." : "Validate Coupon"}
                </Button>

                {couponValidationResult && (
                  <div
                    className={cn(
                      "p-3 rounded-lg border text-xs space-y-1.5",
                      couponValidationResult.isValid
                        ? "bg-green-50 border-green-200 text-green-900"
                        : "bg-red-50 border-red-200 text-red-900"
                    )}
                  >
                    <div className="font-bold">{couponValidationResult.message}</div>
                    {couponValidationResult.data && (
                      <div className="space-y-0.5 font-mono text-[11px] pt-1 border-t border-green-200/60">
                        <div>Original: ₹{Number(couponValidationResult.data.originalAmount || 0).toLocaleString("en-IN")}</div>
                        <div className="text-green-700 font-bold">
                          Discount: -₹{Number(couponValidationResult.data.discountAmount || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="font-extrabold">
                          Final Amount: ₹{Number(couponValidationResult.data.finalAmount || 0).toLocaleString("en-IN")}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. FINANCIAL AUDIT TRAIL TAB
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <Card className="rounded-lg border border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Immutable Financial Audit Trail</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Read-only chronological audit log of all financial modifications and approvals.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select value={auditEntityFilter} onValueChange={setAuditEntityFilter}>
                <SelectTrigger className="h-8 text-xs w-40 bg-white">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Entities</SelectItem>
                  <SelectItem value="BOOKING">Bookings</SelectItem>
                  <SelectItem value="REFUND">Refunds</SelectItem>
                  <SelectItem value="CREDIT">Credits</SelectItem>
                  <SelectItem value="TICKET">Tickets</SelectItem>
                  <SelectItem value="COUPON">Coupons</SelectItem>
                  <SelectItem value="TASK">Tasks</SelectItem>
                  <SelectItem value="SERVICE">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Entity</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Change Summary</th>
                    <th className="py-2.5 px-4">IP Address</th>
                    <th className="py-2.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditTrailList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No audit records found.
                      </td>
                    </tr>
                  ) : (
                    auditTrailList.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {log.changedBy || log.actorUserId || "System"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[9px] font-bold">
                            {log.entityType}
                          </Badge>
                          {log.bookingId && (
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">{log.bookingId}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[9px] font-bold uppercase",
                              log.action === "APPROVE" || log.action === "VERIFY"
                                ? "bg-green-100 text-green-700"
                                : log.action === "REJECT"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-800"
                            )}
                          >
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{log.changeSummary}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.ipAddress || "—"}</td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAuditLog(log);
                              setShowAuditDrawer(true);
                            }}
                            className="h-7 text-xs font-semibold text-slate-600 hover:text-slate-900"
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CASH VERIFICATION DRAWER / MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={isCashModalOpen} onOpenChange={setIsCashModalOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Cash Verification Review</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Booking: <span className="font-mono font-bold text-slate-800">{selectedCashItem?.bookingId}</span> • Salesperson:{" "}
              <span className="font-bold text-slate-800">{selectedCashItem?.salespersonName}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedCashItem && (
            <div className="space-y-4 py-2 text-xs">
              {/* Amounts summary */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Expected</div>
                  <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">
                    ₹{Number(selectedCashItem.expectedAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Submitted</div>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                    ₹{Number(selectedCashItem.submittedAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Difference</div>
                  <div
                    className={cn(
                      "font-mono font-extrabold text-sm mt-0.5",
                      selectedCashItem.difference === 0
                        ? "text-slate-500"
                        : (selectedCashItem.difference || 0) < 0
                        ? "text-red-600"
                        : "text-green-600"
                    )}
                  >
                    ₹{Number(selectedCashItem.difference || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Separation of Duties Warning */}
              {currentUser?.id && selectedCashItem.salespersonId && currentUser.id === selectedCashItem.salespersonId && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  Separation of Duties violation: You submitted this cash and cannot approve it.
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Controller Decision</label>
                <Select value={cashAction} onValueChange={(v: any) => setCashAction(v)}>
                  <SelectTrigger className="h-8 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVE">Approve Full Amount</SelectItem>
                    <SelectItem value="APPROVE_WITH_DISCREPANCY">Approve With Discrepancy Flag</SelectItem>
                    <SelectItem value="FLAG_DISCREPANCY">Flag Discrepancy for Re-settlement</SelectItem>
                    <SelectItem value="REJECT">Reject Submission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {cashAction === "REJECT" && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-red-600">Rejection Reason (Required)</label>
                  <Input
                    placeholder="State reason for rejecting cash submission..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="h-8 text-xs mt-1 border-red-300"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Audit Notes (Optional)</label>
                <Textarea
                  placeholder="Notes for financial audit log..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="text-xs resize-none h-16 mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCashModalOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCashActionSubmit}
              disabled={
                isSubmittingAction ||
                Boolean(currentUser?.id && selectedCashItem?.salespersonId && currentUser.id === selectedCashItem.salespersonId)
              }
              className={cn(
                "h-8 text-xs font-bold text-white shadow-xs",
                cashAction === "REJECT" ? "bg-red-600 hover:bg-red-700" : "bg-[#FF4D00] hover:bg-[#E04400]"
              )}
            >
              {isSubmittingAction ? "Processing..." : "Confirm Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          CREATE REFUND REQUEST MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showCreateRefundModal} onOpenChange={setShowCreateRefundModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Request Booking Refund</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Submit a refund or credit note request into the Finance Controller verification queue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Booking ID</label>
              <Input
                placeholder="BK-00123"
                value={refundForm.bookingId}
                onChange={(e) => setRefundForm({ ...refundForm, bookingId: e.target.value })}
                className="h-8 text-xs font-mono mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Refund Method</label>
              <Select
                value={refundForm.refundMethod}
                onValueChange={(v: any) => setRefundForm({ ...refundForm, refundMethod: v })}
              >
                <SelectTrigger className="h-8 text-xs bg-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH_REFUND">Cash / Direct Bank Transfer</SelectItem>
                  <SelectItem value="CREDIT_NOTE">Credit Note (Store Credit)</SelectItem>
                  <SelectItem value="HYBRID">Hybrid (Split Cash & Credit)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(refundForm.refundMethod === "CASH_REFUND" || refundForm.refundMethod === "HYBRID") && (
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Cash Refund Amount (₹)</label>
                <Input
                  type="number"
                  value={refundForm.refundAmount}
                  onChange={(e) => setRefundForm({ ...refundForm, refundAmount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
            )}

            {(refundForm.refundMethod === "CREDIT_NOTE" || refundForm.refundMethod === "HYBRID") && (
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Credit Note Amount (₹)</label>
                <Input
                  type="number"
                  value={refundForm.creditNoteAmount}
                  onChange={(e) => setRefundForm({ ...refundForm, creditNoteAmount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Reason</label>
              <Select
                value={refundForm.refundReason}
                onValueChange={(v) => setRefundForm({ ...refundForm, refundReason: v })}
              >
                <SelectTrigger className="h-8 text-xs bg-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER_CANCELLATION">Customer Cancellation</SelectItem>
                  <SelectItem value="TRIP_RESCHEDULE">Trip Reschedule</SelectItem>
                  <SelectItem value="PRICE_ADJUSTMENT">Price Adjustment</SelectItem>
                  <SelectItem value="OPERATIONAL_ISSUE">Operational Issue</SelectItem>
                  <SelectItem value="DUPLICATE_PAYMENT">Duplicate Payment</SelectItem>
                  <SelectItem value="OTHER">Other Reason</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Notes</label>
              <Textarea
                placeholder="Reasoning and customer details..."
                value={refundForm.notes}
                onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                className="text-xs resize-none h-16 mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreateRefundModal(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateRefundSubmit} className="h-8 text-xs font-bold bg-[#FF4D00] hover:bg-[#E04400] text-white">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          APPROVE REFUND DIALOG (WITH MANUAL UTR)
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showRefundApproveDialog} onOpenChange={setShowRefundApproveDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Approve & Process Refund</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Confirm financial approval and record manual bank UTR or store credit issuance.
            </DialogDescription>
          </DialogHeader>

          {selectedRefundForAction && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div>Booking: <span className="font-mono font-bold text-slate-900">{selectedRefundForAction.bookingId}</span></div>
                <div>Cash Portion: <span className="font-mono font-bold text-slate-900">₹{Number(selectedRefundForAction.refundAmount || 0).toLocaleString("en-IN")}</span></div>
                <div>Credit Portion: <span className="font-mono font-bold text-[#FF4D00]">₹{Number(selectedRefundForAction.creditNoteAmount || 0).toLocaleString("en-IN")}</span></div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Bank UTR / Transaction Reference (Manual)</label>
                <Input
                  placeholder="e.g. UTR-HDFC-998877"
                  value={refundApprovalRef}
                  onChange={(e) => setRefundApprovalRef(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRefundApproveDialog(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleApproveRefund} className="h-8 text-xs font-bold bg-green-600 hover:bg-green-700 text-white">
              Approve Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          REJECT REFUND DIALOG
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showRefundRejectDialog} onOpenChange={setShowRefundRejectDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-700">Reject Refund Request</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              An explicit reason is mandatory to reject a financial refund request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <label className="text-[10px] font-bold uppercase text-red-600">Rejection Reason</label>
            <Textarea
              placeholder="State reason for rejecting..."
              value={refundRejectReason}
              onChange={(e) => setRefundRejectReason(e.target.value)}
              className="text-xs resize-none h-20 border-red-300"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRefundRejectDialog(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleRejectRefund} className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white">
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          APPLY CREDIT NOTE MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showApplyCreditModal} onOpenChange={setShowApplyCreditModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Apply Credit Note</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Deduct balance from credit note towards a target booking.
            </DialogDescription>
          </DialogHeader>

          {selectedCreditForApply && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div>Credit Code: <span className="font-mono font-bold text-slate-900">{selectedCreditForApply.code || selectedCreditForApply.refundId}</span></div>
                <div>Available Balance: <span className="font-mono font-bold text-green-600">₹{Number(selectedCreditForApply.remainingBalance || 0).toLocaleString("en-IN")}</span></div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Target Booking ID</label>
                <Input
                  placeholder="BK-00999"
                  value={applyCreditForm.targetBookingId}
                  onChange={(e) => setApplyCreditForm({ ...applyCreditForm, targetBookingId: e.target.value })}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Amount to Use (₹)</label>
                <Input
                  type="number"
                  value={applyCreditForm.amountToUse}
                  max={selectedCreditForApply.remainingBalance}
                  onChange={(e) => setApplyCreditForm({ ...applyCreditForm, amountToUse: Number(e.target.value) })}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Notes (Optional)</label>
                <Input
                  placeholder="e.g. Applied for summer batch seat..."
                  value={applyCreditForm.notes}
                  onChange={(e) => setApplyCreditForm({ ...applyCreditForm, notes: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowApplyCreditModal(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleApplyCreditSubmit} className="h-8 text-xs font-bold bg-[#FF4D00] hover:bg-[#E04400] text-white">
              Confirm Deduction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          COUPON MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingCoupon ? "Edit Coupon Code" : "Create New Coupon"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Coupon Code</label>
              <Input
                placeholder="PROMO2026"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="h-8 text-xs font-mono font-bold mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Discount Type</label>
                <Select
                  value={couponForm.discountType}
                  onValueChange={(v) => setCouponForm({ ...couponForm, discountType: v })}
                >
                  <SelectTrigger className="h-8 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Discount Value</label>
                <Input
                  type="number"
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Max Cap Amount (₹)</label>
                <Input
                  type="number"
                  value={couponForm.maxDiscountAmount}
                  onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Min Booking Amount (₹)</label>
                <Input
                  type="number"
                  value={couponForm.minBookingAmount}
                  onChange={(e) => setCouponForm({ ...couponForm, minBookingAmount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Max Total Uses</label>
                <Input
                  type="number"
                  value={couponForm.maxUsesTotal}
                  onChange={(e) => setCouponForm({ ...couponForm, maxUsesTotal: Number(e.target.value) })}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Valid Until</label>
                <Input
                  type="date"
                  value={couponForm.validUntil}
                  onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCouponModal(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveCoupon} className="h-8 text-xs font-bold bg-[#FF4D00] hover:bg-[#E04400] text-white">
              Save Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          BULK CSV UPLOAD MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showBulkUploadModal} onOpenChange={setShowBulkUploadModal}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Bulk Ingest Tickets (CSV)</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Format: PNR, BookingID, Cost, Provider, Source, Destination
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <Textarea
              placeholder={`PNR,BookingID,Cost,Provider,Source,Destination\nPNR-998811,BK-001,1450,IRCTC,Delhi,Manali\nPNR-998822,BK-002,1800,IRCTC,Delhi,Shimla`}
              value={bulkCsvText}
              onChange={(e) => setBulkCsvText(e.target.value)}
              className="font-mono text-xs h-36 resize-none"
            />

            {bulkUploadResult && (
              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1 font-mono">
                <div className="text-green-700 font-bold">Ingested: {bulkUploadResult.ingestedCount}</div>
                <div className="text-amber-700 font-bold">Duplicates Skipped: {bulkUploadResult.duplicateCount}</div>
                <div className="text-red-700 font-bold">Unmatched Records: {bulkUploadResult.unmatchedCount}</div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkUploadModal(false)} className="h-8 text-xs">
              Close
            </Button>
            <Button size="sm" onClick={handleBulkUploadSubmit} className="h-8 text-xs font-bold bg-[#FF4D00] hover:bg-[#E04400] text-white">
              Parse & Ingest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          CREATE TASK MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showCreateTaskModal} onOpenChange={setShowCreateTaskModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Assign Operational Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Task Title</label>
              <Input
                placeholder="e.g. Confirm Volvo seats with operator"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Linked Booking ID (Optional)</label>
              <Input
                placeholder="BK-00123"
                value={taskForm.bookingId}
                onChange={(e) => setTaskForm({ ...taskForm, bookingId: e.target.value })}
                className="h-8 text-xs font-mono mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Priority</label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v: any) => setTaskForm({ ...taskForm, priority: v })}
                >
                  <SelectTrigger className="h-8 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Deadline</label>
                <Input
                  type="date"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Description</label>
              <Textarea
                placeholder="Detailed instructions..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="text-xs resize-none h-16 mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreateTaskModal(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateTask} className={financePrimaryBtn}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isIncomingModalOpen} onOpenChange={setIsIncomingModalOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B1528]">Verify Incoming Payment</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Booking <span className="font-mono font-bold text-slate-800">{selectedIncomingItem?.bookingId}</span>
              {" · "}
              {selectedIncomingItem?.customerName}
            </DialogDescription>
          </DialogHeader>
          {selectedIncomingItem && (
            <div className="space-y-3 py-1 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Amount</div>
                  <MoneyAmount value={selectedIncomingItem.amount} className="text-sm" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Mode</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedIncomingItem.paymentMode}</div>
                  <div className="font-mono text-[10px] text-slate-400">{selectedIncomingItem.referenceNumber || "No ref"}</div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Decision</label>
                <Select value={incomingAction} onValueChange={(v: any) => setIncomingAction(v)}>
                  <SelectTrigger className="h-8 text-xs bg-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VERIFY">Verify payment</SelectItem>
                    <SelectItem value="FLAG_DISCREPANCY">Flag discrepancy</SelectItem>
                    <SelectItem value="REJECT">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {incomingAction === "REJECT" && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-red-600">Rejection reason</label>
                  <Input value={incomingReason} onChange={(e) => setIncomingReason(e.target.value)} className="h-8 text-xs mt-1 border-red-300" />
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Notes</label>
                <Textarea value={incomingNotes} onChange={(e) => setIncomingNotes(e.target.value)} className="text-xs resize-none h-16 mt-1" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsIncomingModalOpen(false)} className="h-8 text-xs">Cancel</Button>
            <Button
              size="sm"
              onClick={handleIncomingActionSubmit}
              disabled={isSubmittingAction}
              className={cn("h-8 text-xs font-bold text-white", incomingAction === "REJECT" ? "bg-red-600 hover:bg-red-700" : financePrimaryBtn)}
            >
              {isSubmittingAction ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVendorModalOpen} onOpenChange={setIsVendorModalOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B1528]">Record Vendor Payout</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedVendorItem?.vendorName} · {selectedVendorItem?.tripTitle}
            </DialogDescription>
          </DialogHeader>
          {selectedVendorItem && (
            <div className="space-y-3 py-1 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tariff</div>
                  <MoneyAmount value={selectedVendorItem.agreedTariff} tone="muted" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Paid</div>
                  <MoneyAmount value={selectedVendorItem.paidAmount} tone="credit" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Outstanding</div>
                  <MoneyAmount value={selectedVendorItem.outstandingAmount} tone="outstanding" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">This payout (₹)</label>
                  <Input type="number" value={vendorPayAmount} onChange={(e) => setVendorPayAmount(Number(e.target.value))} className="h-8 text-xs font-mono mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Mode</label>
                  <Select value={vendorPayMode} onValueChange={setVendorPayMode}>
                    <SelectTrigger className="h-8 text-xs bg-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">UTR / reference</label>
                <Input value={vendorTxnRef} onChange={(e) => setVendorTxnRef(e.target.value)} className="h-8 text-xs font-mono mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Notes</label>
                <Textarea value={vendorNotes} onChange={(e) => setVendorNotes(e.target.value)} className="text-xs resize-none h-16 mt-1" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsVendorModalOpen(false)} className="h-8 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleVendorActionSubmit} disabled={isSubmittingAction} className={financePrimaryBtn}>
              {isSubmittingAction ? "Saving…" : "Confirm payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B1528]">Ticket Margin Audit</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedTicketItem?.pnr} · {selectedTicketItem?.bookingId}
            </DialogDescription>
          </DialogHeader>
          {selectedTicketItem && (
            <div className="space-y-3 py-1 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cost</div>
                  <MoneyAmount value={selectedTicketItem.actualTicketCost} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Allowance</div>
                  <MoneyAmount value={selectedTicketItem.packageAllowance} tone="muted" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Margin</div>
                  <MoneyAmount value={selectedTicketItem.ticketingMargin} signed tone={selectedTicketItem.ticketingMargin >= 0 ? "credit" : "debit"} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Audited cost (₹)</label>
                <Input type="number" value={ticketAuditedCost} onChange={(e) => setTicketAuditedCost(Number(e.target.value))} className="h-8 text-xs font-mono mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Decision</label>
                <Select value={ticketAction} onValueChange={(v: any) => setTicketAction(v)}>
                  <SelectTrigger className="h-8 text-xs bg-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVE">Approve</SelectItem>
                    <SelectItem value="FLAG_VARIANCE">Flag variance</SelectItem>
                    <SelectItem value="REJECT">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Notes</label>
                <Textarea value={ticketNotes} onChange={(e) => setTicketNotes(e.target.value)} className="text-xs resize-none h-16 mt-1" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsTicketModalOpen(false)} className="h-8 text-xs">Cancel</Button>
            <Button
              size="sm"
              onClick={handleTicketAuditSubmit}
              disabled={isSubmittingAction}
              className={cn("h-8 text-xs font-bold text-white", ticketAction === "REJECT" ? "bg-red-600 hover:bg-red-700" : financePrimaryBtn)}
            >
              {isSubmittingAction ? "Saving…" : "Confirm decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Unified Departure / Expense Review Modal ── */}
      <Dialog open={Boolean(selectedQueueItem)} onOpenChange={(open) => !open && setSelectedQueueItem(null)}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B1528]">
              Review {selectedQueueItem?.kind === "expense" ? "Expense" : "Departure Payout"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedQueueItem?.item.title}. Decision is recorded in the finance audit trail.
            </DialogDescription>
          </DialogHeader>

          {selectedQueueItem && (
            <div className="space-y-3 py-1 text-xs">
              {/* Summary row */}
              {selectedQueueItem.kind === "departure" ? (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Recipient</div>
                    <div className="font-semibold text-slate-800">{(selectedQueueItem.item as DeparturePayoutItem).recipient}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Trip</div>
                    <div className="font-mono text-slate-600">{(selectedQueueItem.item as DeparturePayoutItem).tripCode}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Amount</div>
                    <MoneyAmount value={selectedQueueItem.item.amount} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Category</div>
                      <div className="font-semibold text-slate-800">{(selectedQueueItem.item as MiscellaneousExpenseItem).category}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Mode</div>
                      <div className="text-slate-600">{(selectedQueueItem.item as MiscellaneousExpenseItem).paymentMode}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Amount</div>
                      <MoneyAmount value={selectedQueueItem.item.amount} tone="debit" />
                    </div>
                  </div>
                  {(selectedQueueItem.item as MiscellaneousExpenseItem).receiptUrl && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                      <Upload className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="text-[11px] text-blue-700 font-semibold">Payment Proof:</span>
                      <a
                        href={(selectedQueueItem.item as MiscellaneousExpenseItem).receiptUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 text-[11px] hover:underline font-mono truncate"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        View Receipt / Document
                      </a>
                    </div>
                  )}
                </>
              )}

              {/* Submitted by */}
              <div className="text-[11px] text-slate-500">
                Submitted by <span className="font-semibold text-slate-700">{selectedQueueItem.item.submittedBy}</span>
                {" · "}{safeFormatDate(selectedQueueItem.item.submittedAt)}
              </div>

              {/* Action selector */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Decision</label>
                <Select value={queueReviewAction} onValueChange={(v: any) => setQueueReviewAction(v)}>
                  <SelectTrigger className="h-8 text-xs bg-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVE">Approve</SelectItem>
                    <SelectItem value="REJECT">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes — required on reject */}
              <div>
                <label className={cn("text-[10px] font-bold uppercase", queueReviewAction === "REJECT" ? "text-red-600" : "text-slate-500")}>
                  {queueReviewAction === "REJECT" ? "Reason (required)" : "Notes (optional)"}
                </label>
                <Textarea
                  value={queueActionNotes}
                  onChange={(e) => setQueueActionNotes(e.target.value)}
                  placeholder={queueReviewAction === "REJECT" ? "Explain why this is being rejected…" : "Internal notes for the audit trail…"}
                  className={cn("text-xs resize-none h-16 mt-1", queueReviewAction === "REJECT" && "border-red-300")}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedQueueItem(null)} className="h-8 text-xs">Cancel</Button>
            <Button
              size="sm"
              onClick={handleQueueActionConfirm}
              disabled={isSubmittingAction}
              className={cn("h-8 text-xs font-bold text-white", queueReviewAction === "REJECT" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700")}
            >
              {isSubmittingAction ? "Saving…" : queueReviewAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Expense / Payment Modal ── */}
      <Dialog open={showAddExpenseModal} onOpenChange={(open) => { if (!open) { setShowAddExpenseModal(false); setExpenseProofFile(null); setExpenseProofPreview(null); } }}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B1528]">
              Add {addExpenseForm.type === "ACTIVITY" ? "Activity Payment" : "Miscellaneous Expense"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record an outgoing payment for controller approval. A receipt/proof URL is required for audit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            {/* Type toggle */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Payment Type</label>
              <div className="flex gap-2 mt-1">
                {(["MISCELLANEOUS", "ACTIVITY"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAddExpenseForm((f) => ({ ...f, type: t }))}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors",
                      addExpenseForm.type === t
                        ? "bg-[#FF4D00] text-white border-[#FF4D00]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    )}
                  >
                    {t === "MISCELLANEOUS" ? "Miscellaneous" : "Activity Payment"}
                  </button>
                ))}
              </div>
            </div>

            {/* Trip ID & departure date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Trip ID <span className="text-red-600">*</span></label>
                <Input
                  className="h-8 text-xs mt-1"
                  placeholder="e.g. cldxxxx…"
                  value={addExpenseForm.tripId}
                  onChange={(e) => setAddExpenseForm((f) => ({ ...f, tripId: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Departure Date <span className="text-red-600">*</span></label>
                <Input
                  type="date"
                  className="h-8 text-xs mt-1"
                  value={addExpenseForm.departureDate}
                  onChange={(e) => setAddExpenseForm((f) => ({ ...f, departureDate: e.target.value }))}
                />
              </div>
            </div>

            {addExpenseForm.type === "MISCELLANEOUS" ? (
              <>
                {/* Category & description */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500">Category</label>
                    <Select
                      value={addExpenseForm.category}
                      onValueChange={(v) => setAddExpenseForm((f) => ({ ...f, category: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MISCELLANEOUS">Miscellaneous</SelectItem>
                        <SelectItem value="OFFICE">Office</SelectItem>
                        <SelectItem value="TRAVEL">Travel</SelectItem>
                        <SelectItem value="FOOD">Food & Catering</SelectItem>
                        <SelectItem value="COMMUNICATION">Communication</SelectItem>
                        <SelectItem value="PRINTING">Printing</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500">Amount (₹) <span className="text-red-600">*</span></label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-xs mt-1"
                      placeholder="0"
                      value={addExpenseForm.amount || ""}
                      onChange={(e) => setAddExpenseForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Description <span className="text-red-600">*</span></label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="Brief description of the expense"
                    value={addExpenseForm.description}
                    onChange={(e) => setAddExpenseForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Activity fields */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Activity Name <span className="text-red-600">*</span></label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="e.g. River Rafting, Camping Equipment"
                    value={addExpenseForm.activity}
                    onChange={(e) => setAddExpenseForm((f) => ({ ...f, activity: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500">Total Amount (₹) <span className="text-red-600">*</span></label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-xs mt-1"
                      placeholder="0"
                      value={addExpenseForm.totalAmount || ""}
                      onChange={(e) => setAddExpenseForm((f) => ({ ...f, totalAmount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500">Amount Paid (₹)</label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-xs mt-1"
                      placeholder="0"
                      value={addExpenseForm.amountPaid || ""}
                      onChange={(e) => setAddExpenseForm((f) => ({ ...f, amountPaid: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500">Payment Date</label>
                    <Input
                      type="date"
                      className="h-8 text-xs mt-1"
                      value={addExpenseForm.paymentDate}
                      onChange={(e) => setAddExpenseForm((f) => ({ ...f, paymentDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Remarks</label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="Optional remarks"
                    value={addExpenseForm.remarks}
                    onChange={(e) => setAddExpenseForm((f) => ({ ...f, remarks: e.target.value }))}
                  />
                </div>
              </>
            )}

            {/* Payment mode */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Payment Mode</label>
              <Select
                value={addExpenseForm.paymentMode}
                onValueChange={(v) => setAddExpenseForm((f) => ({ ...f, paymentMode: v }))}
              >
                <SelectTrigger className="h-8 text-xs mt-1 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Proof Upload */}
            {(() => {
              const mode = addExpenseForm.paymentMode;
              const label =
                mode === "UPI" ? "Upload UPI Payment Screenshot" :
                mode === "CASH" ? "Upload Cash Payment Receipt" :
                mode === "BANK_TRANSFER" ? "Upload Bank Transfer Proof" :
                "Upload Payment Proof";
              const accept = "image/jpeg,image/png,application/pdf";
              const isPdf = expenseProofFile?.type === "application/pdf";
              return (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                    <Upload className="h-3 w-3" />
                    {label}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <label
                      className={cn(
                        "flex-1 flex items-center gap-2 h-8 px-3 border rounded-md cursor-pointer text-xs text-slate-500 hover:border-slate-400 transition-colors bg-white",
                        expenseProofFile ? "border-green-400 text-green-700" : "border-slate-200"
                      )}
                    >
                      <Upload className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {expenseProofFile ? expenseProofFile.name : "Choose file (JPG, PNG, PDF)"}
                      </span>
                      <input
                        type="file"
                        accept={accept}
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setExpenseProofFile(file);
                          setAddExpenseForm((f) => ({ ...f, receiptUrl: "" }));
                          if (file && file.type.startsWith("image/")) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setExpenseProofPreview(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          } else {
                            setExpenseProofPreview(null);
                          }
                        }}
                      />
                    </label>
                    {expenseProofFile && (
                      <button
                        type="button"
                        onClick={() => { setExpenseProofFile(null); setExpenseProofPreview(null); }}
                        className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {/* Image preview */}
                  {expenseProofPreview && (
                    <img
                      src={expenseProofPreview}
                      alt="Receipt preview"
                      className="mt-2 h-20 w-auto rounded-md border border-slate-200 object-contain"
                    />
                  )}
                  {/* PDF filename link */}
                  {expenseProofFile && isPdf && (
                    <p className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {expenseProofFile.name}
                    </p>
                  )}
                  {/* Fallback: paste URL if no file selected */}
                  {!expenseProofFile && (
                    <>
                      <p className="text-[10px] text-slate-400 mt-1">or paste a URL directly:</p>
                      <Input
                        className="h-8 text-xs mt-1"
                        placeholder="https://…"
                        value={addExpenseForm.receiptUrl}
                        onChange={(e) => setAddExpenseForm((f) => ({ ...f, receiptUrl: e.target.value }))}
                      />
                      {addExpenseForm.receiptUrl && (
                        <a
                          href={addExpenseForm.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 text-[10px] mt-1 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Preview link
                        </a>
                      )}
                    </>
                  )}
                  {isUploadingProof && (
                    <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Uploading proof…
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddExpenseModal(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddExpenseSubmit}
              disabled={isSubmittingExpense || isUploadingProof}
              className={cn("h-8 text-xs font-bold text-white", financePrimaryBtn)}
            >
              {isUploadingProof ? "Uploading…" : isSubmittingExpense ? "Saving…" : "Add Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmTicketVerifyId)} onOpenChange={(open) => !open && setConfirmTicketVerifyId(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B1528]">Verify ticket</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Confirm cost and allowance for this repository ticket. This cannot be undone from this screen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmTicketVerifyId(null)} className="h-8 text-xs">Cancel</Button>
            <Button
              size="sm"
              className="h-7 text-xs font-bold bg-green-600 hover:bg-green-700 text-white"
              onClick={async () => {
                const tix = financeTicketsList.find((t) => t.id === confirmTicketVerifyId);
                if (!tix) return;
                try {
                  await financeControllerService.tickets.verify(tix.id, {
                    cost: tix.cost,
                    packageAllowance: tix.packageAllowance || undefined,
                  });
                  toast.success(`Ticket ${tix.pnr || tix.id} verified`);
                  setConfirmTicketVerifyId(null);
                  fetchAllData();
                } catch (err: any) {
                  toast.error(err.response?.data?.message || "Verification failed");
                }
              }}
            >
              Confirm verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



