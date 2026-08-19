import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RotateCw,
  DollarSign,
  ArrowDownRight,
  Banknote,
  FileText,
  Eye,
  User,
  ShieldCheck,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  Layers,
  Building,
  ChevronDown,
  ChevronUp,
  CheckCheck,
} from "lucide-react";
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
import { cn, safeFormatDate } from "@/lib/utils";
import { financeControllerService } from "@/services/financeController.service";
import { useAuthStore } from "@/store/auth.store";
import { useStaffUsers } from "@/hooks/useStaffUsers";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IncomingPaymentItem, CashSubmissionItem } from "@/types";

interface IncomingPaymentsApprovalPageProps {
  hideHeader?: boolean;
}

export default function IncomingPaymentsApprovalPage({
  hideHeader = false,
}: IncomingPaymentsApprovalPageProps) {
  const { admin: currentUser } = useAuthStore();
  const { staffUsers } = useStaffUsers();

  const userRole = (currentUser?.role || "").toLowerCase();
  const isSuperuserFounder =
    ["superadmin", "founder", "admin"].includes(userRole) ||
    (currentUser as any)?.isSuperuser ||
    (currentUser?.email && currentUser.email.toLowerCase().includes("hemal"));

  const [incomingPayments, setIncomingPayments] = useState<IncomingPaymentItem[]>([]);
  const [cashSubmissions, setCashSubmissions] = useState<CashSubmissionItem[]>([]);
  const [stationCashData, setStationCashData] = useState<{
    summary: any;
    dateGroups: any[];
    allCollections: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentType, setPaymentType] = useState<"all" | "online" | "cash" | "station_cash">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [selectedStationDate, setSelectedStationDate] = useState<string>("ALL");
  const [expandedStationKeys, setExpandedStationKeys] = useState<Record<string, boolean>>({});

  // Actions
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [actionModalType, setActionModalType] = useState<"verify" | "reject" | "station_batch" | null>(null);
  const [selectedStationBatch, setSelectedStationBatch] = useState<any>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, cashRes, stationRes] = await Promise.all([
        financeControllerService.getIncomingQueue({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          search: search.trim() || undefined,
          limit: 50,
        }).catch(() => ({ data: [], pagination: {} })),
        financeControllerService.getCashQueue({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          search: search.trim() || undefined,
          limit: 50,
        }).catch(() => ({ data: [], pagination: {} })),
        financeControllerService.getStationCashQueue({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          search: search.trim() || undefined,
        }).catch(() => ({ summary: {}, dateGroups: [], allCollections: [] })),
      ]);
      setIncomingPayments(incRes?.data || []);
      setCashSubmissions(cashRes?.data || []);
      setStationCashData(stationRes || { summary: {}, dateGroups: [], allCollections: [] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to load incoming payments");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignApprover = async (paymentId: string, assigneeId: string) => {
    setAssigningId(paymentId);
    try {
      await financeControllerService.assignIncomingPayment(
        paymentId,
        assigneeId === "UNASSIGNED" ? null : assigneeId
      );
      toast.success("Approval assignee updated");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to assign approver");
    } finally {
      setAssigningId(null);
    }
  };

  const handleBatchVerifyStation = (batch: any) => {
    if (!isSuperuserFounder) {
      toast.error("Station cash approvals are restricted to Founder / Superadmin accounts only.");
      return;
    }
    setSelectedStationBatch(batch);
    setActionNotes("");
    setActionModalType("station_batch");
  };

  const confirmBatchVerify = async () => {
    if (!selectedStationBatch) return;
    setActionLoading(true);
    try {
      const ids = selectedStationBatch.items.map((i: any) => i.id);
      await financeControllerService.batchVerifyStationCash({
        collectionIds: ids,
        tripId: selectedStationBatch.tripId,
        departureDate: selectedStationBatch.departureDate,
        station: selectedStationBatch.station,
        action: "APPROVE",
        notes: actionNotes.trim() || undefined,
      });
      toast.success(`Batch verified ${ids.length} passenger cash collections successfully`);
      setActionModalType(null);
      setSelectedStationBatch(null);
      setActionNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Batch verification failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleStationAction = async (item: any, action: "APPROVE" | "REJECT") => {
    if (!isSuperuserFounder) {
      toast.error("Station cash approvals are restricted to Founder / Superadmin accounts only.");
      return;
    }
    setActionLoading(true);
    try {
      await financeControllerService.batchVerifyStationCash({
        collectionIds: [item.id],
        action,
        notes: action === "APPROVE" ? "Single verified by Founder" : "Rejected by Founder",
      });
      toast.success(action === "APPROVE" ? "Station collection verified" : "Station collection rejected");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpandStation = (key: string) => {
    setExpandedStationKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Merge items for normal table
  const allItems = [
    ...incomingPayments.map((p) => ({
      id: p.id,
      type: "ONLINE_OR_BANK",
      bookingId: p.bookingId,
      customerName: p.customerName || "Customer",
      amount: p.amount,
      paymentMode: p.paymentMode || "PAYMENT_LINK",
      reference: p.transactionRef || p.gatewayReference || p.referenceNumber || "—",
      date: p.receivedAt || p.createdAt,
      status: p.status,
      collectedBy: p.submittedBy || "Online Gateway / Bank",
      assigneeId: (p as any).actionedById || (p.raw as any)?.actionedById || null,
      assigneeName: (p as any).actionedBy || (p.raw as any)?.actionedBy?.name || null,
      notes: p.notes,
      raw: p,
    })),
    ...cashSubmissions.map((c) => ({
      id: c.id,
      type: "CASH_HANDOVER",
      bookingId: c.bookingId,
      customerName: c.customerName || "Traveler",
      amount: c.submittedAmount || c.expectedAmount,
      paymentMode: "CASH_HANDOVER",
      reference: c.id?.slice(-8),
      date: c.submittedAt || c.createdAt,
      status: c.status,
      collectedBy: c.salespersonName || "Sales Executive",
      assigneeId: (c as any).actionedById || (c.raw as any)?.actionedById || null,
      assigneeName: (c as any).actionedBy?.name || (c.raw as any)?.actionedBy?.name || null,
      notes: c.notes,
      raw: c,
    })),
  ].filter((item) => {
    if (paymentType === "online" && item.type !== "ONLINE_OR_BANK") return false;
    if (paymentType === "cash" && item.type !== "CASH_HANDOVER") return false;
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (assigneeFilter === "ME" && item.assigneeId !== currentUser?.id) return false;
    if (assigneeFilter === "UNASSIGNED" && item.assigneeId) return false;
    return true;
  });

  const stationCollectionsCount = stationCashData?.allCollections?.length || 0;
  const stationPendingCount = stationCashData?.summary?.pendingCount || 0;
  const stationVerifiedCount = stationCashData?.summary?.verifiedCount || 0;
  const stationTotalCash = stationCashData?.summary?.totalCashCollected || 0;
  const stationPendingCash = stationCashData?.summary?.totalCashPending || 0;
  const stationVerifiedCash = stationCashData?.summary?.totalCashVerified || 0;

  const pendingCount = paymentType === "station_cash"
    ? stationPendingCount
    : allItems.filter((i) => i.status === "PENDING_VERIFICATION" || i.status === "PENDING_HANDOVER" || i.status === "PENDING").length;

  const verifiedCount = paymentType === "station_cash"
    ? stationVerifiedCount
    : allItems.filter((i) => i.status === "VERIFIED" || i.status === "APPROVED" || i.status === "COMPLETED").length;

  const totalVerifiedSum = paymentType === "station_cash"
    ? stationVerifiedCash
    : allItems.filter((i) => i.status === "VERIFIED" || i.status === "APPROVED").reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const totalPendingSum = paymentType === "station_cash"
    ? stationPendingCash
    : allItems.filter((i) => i.status === "PENDING_VERIFICATION" || i.status === "PENDING_HANDOVER" || i.status === "PENDING").reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const handleVerify = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    try {
      if (selectedPayment.type === "CASH_HANDOVER") {
        await financeControllerService.performCashAction(selectedPayment.id, {
          action: "APPROVE",
          notes: actionNotes.trim() || undefined,
        });
      } else {
        await financeControllerService.performIncomingAction(selectedPayment.id, {
          action: "VERIFY",
          notes: actionNotes.trim() || undefined,
        });
      }
      toast.success("Payment verified and approved successfully");
      setActionModalType(null);
      setSelectedPayment(null);
      setActionNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Verification failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!actionNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActionLoading(true);
    try {
      if (selectedPayment.type === "CASH_HANDOVER") {
        await financeControllerService.performCashAction(selectedPayment.id, {
          action: "REJECT",
          reason: actionNotes.trim(),
        });
      } else {
        await financeControllerService.performIncomingAction(selectedPayment.id, {
          action: "REJECT",
          reason: actionNotes.trim(),
        });
      }
      toast.success("Payment rejected");
      setActionModalType(null);
      setSelectedPayment(null);
      setActionNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-3 font-sans antialiased text-[#162B45]">
      {/* 1. COMPACT HEADER */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2]">
          <div className="space-y-0.5">
            <h1 className="text-[22px] font-[600] text-[#162B45] tracking-tight leading-none font-montserrat flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#FF4D00]" />
              Incoming Payments Verification
            </h1>
            <p className="text-[#74839A] text-[12px] font-[500] leading-none">
              Review and approve customer collections, bank transfers, payment links, and cash submissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
              <Input
                placeholder="Search Booking ID, UTR, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8.5 w-64 pl-8 text-[11px] rounded bg-white border-[#E3EAF2] placeholder-[#74839A]/60 focus:border-[#FF4D00] outline-none"
              />
            </div>
            <Button
              onClick={loadData}
              className="h-8.5 bg-white hover:bg-slate-50 border border-[#E3EAF2] rounded px-3 text-[#162B45] text-[11px] font-[600] flex items-center gap-1 shadow-sm transition-all"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#74839A]" /> Refresh
            </Button>
          </div>
        </div>
      )}

      {/* 2. MONEY MANIFEST */}
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#DCE5ED] bg-[#F8FAFC] lg:grid-cols-4">
        {/* KPI 1: Pending Verification */}
        <div className="relative min-h-[86px] border-b border-r border-[#DCE5ED] bg-white p-3.5 lg:border-b-0">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#74839A]">
              Needs review
            </p>
            <h3 className="mt-2 text-[22px] font-bold leading-none text-[#C56A08] tabular-nums">
              {loading ? "..." : pendingCount}
            </h3>
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-[#8293A3]">
            Payment entries
          </p>
          <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-[#C56A08]">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 2: Pending Volume */}
        <div className="relative min-h-[86px] border-b border-[#DCE5ED] bg-white p-3.5 lg:border-b-0 lg:border-r">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#74839A]">
              Awaiting credit
            </p>
            <h3 className="mt-2 text-[20px] font-bold leading-none text-[#1769AA] tabular-nums">
              {loading ? "..." : `₹${totalPendingSum.toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-[#8293A3]">
            Pending value
          </p>
          <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#1769AA]">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 3: Verified Today */}
        <div className="relative min-h-[86px] border-r border-[#DCE5ED] bg-white p-3.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#74839A]">
              Reconciled
            </p>
            <h3 className="mt-2 text-[22px] font-bold leading-none text-[#138A68] tabular-nums">
              {loading ? "..." : verifiedCount}
            </h3>
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-[#8293A3]">
            Verified entries
          </p>
          <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-[#138A68]">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 4: Verified Total Value */}
        <div className="relative min-h-[86px] bg-white p-3.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#74839A]">
              Cleared value
            </p>
            <h3 className="mt-2 text-[20px] font-bold leading-none text-[#13283F] tabular-nums">
              {loading ? "..." : `₹${totalVerifiedSum.toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-[#8293A3]">
            Verified inflow
          </p>
          <div className="absolute right-3.5 top-3.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. REVIEW WORKSPACE */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-[#DCE5ED] bg-white">
        {/* Filters Header */}
        <div className="space-y-3 border-b border-[#E5ECF2] bg-[#FBFCFD] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[13px] font-bold text-[#13283F]">
                Payment review queue
              </h3>
              <p className="mt-0.5 text-[10px] text-[#8293A3]">
                Match references, assign an approver, then clear the entry.
              </p>
            </div>
            <Button
              onClick={loadData}
              variant="outline"
              className="h-8 shrink-0 rounded-lg border-[#DCE5ED] bg-white px-2.5 text-[10px] font-bold text-[#526A7F] shadow-none hover:bg-slate-50"
            >
              <RotateCw
                className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>

          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="inline-flex shrink-0 rounded-lg border border-[#DCE5ED] bg-[#EDF3F7] p-0.5">
              <button
                onClick={() => setPaymentType("all")}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[10px] font-bold transition-all",
                  paymentType === "all"
                    ? "bg-white text-[#E84712] shadow-sm"
                    : "text-[#61778A] hover:text-[#13283F]"
                )}
              >
                All <span className="ml-1 text-[9px] opacity-60">{allItems.length}</span>
              </button>
              <button
                onClick={() => setPaymentType("online")}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[10px] font-bold transition-all",
                  paymentType === "online"
                    ? "bg-white text-[#E84712] shadow-sm"
                    : "text-[#61778A] hover:text-[#13283F]"
                )}
              >
                Bank & online <span className="ml-1 text-[9px] opacity-60">{incomingPayments.length}</span>
              </button>
              <button
                onClick={() => setPaymentType("cash")}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[10px] font-bold transition-all",
                  paymentType === "cash"
                    ? "bg-white text-[#E84712] shadow-sm"
                    : "text-[#61778A] hover:text-[#13283F]"
                )}
              >
                Sales Cash <span className="ml-1 text-[9px] opacity-60">{cashSubmissions.length}</span>
              </button>
              <button
                onClick={() => setPaymentType("station_cash")}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[10px] font-bold transition-all flex items-center gap-1",
                  paymentType === "station_cash"
                    ? "bg-white text-[#E84712] shadow-sm"
                    : "text-[#61778A] hover:text-[#13283F]"
                )}
              >
                <MapPin className="w-3 h-3 text-[#E84712]" />
                Station Cash (Date-wise) <span className="ml-1 text-[9px] opacity-60">{stationCollectionsCount}</span>
              </button>
            </div>

            {paymentType === "station_cash" ? (
              <Select value={selectedStationDate} onValueChange={setSelectedStationDate}>
                <SelectTrigger className="h-8 w-44 shrink-0 rounded-lg border-[#DCE5ED] bg-white text-[10px] font-semibold">
                  <Calendar className="w-3 h-3 text-[#FF5A1F] mr-1.5" />
                  <SelectValue placeholder="Filter Departure Date" />
                </SelectTrigger>
                <SelectContent className="rounded">
                  <SelectItem value="ALL">All Departure Dates</SelectItem>
                  {stationCashData?.dateGroups?.map((dg) => (
                    <SelectItem key={dg.departureDate} value={dg.departureDate}>
                      {safeFormatDate(dg.departureDate)} (₹{dg.totalAmount.toLocaleString("en-IN")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="h-8 w-36 shrink-0 rounded-lg border-[#DCE5ED] bg-white text-[10px] font-semibold">
                  <SelectValue placeholder="Assignee Filter" />
                </SelectTrigger>
                <SelectContent className="rounded">
                  <SelectItem value="ALL">All Assignees</SelectItem>
                  <SelectItem value="ME">Assigned to Me</SelectItem>
                  <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto no-scrollbar rounded-lg bg-[#EDF3F7] p-0.5">
              {[
                { key: "ALL", label: "ALL" },
                { key: "PENDING_VERIFICATION", label: "PENDING" },
                { key: "VERIFIED", label: "VERIFIED" },
                { key: "REJECTED", label: "REJECTED" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all",
                    statusFilter === tab.key
                      ? "bg-white text-[#13283F] shadow-sm"
                      : "text-[#74839A] hover:text-[#13283F]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-0 flex-1 lg:w-52 lg:flex-none">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8293A3]" />
              <Input
                placeholder={paymentType === "station_cash" ? "Station, Trip, Passenger..." : "Booking, customer or UTR"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-lg border-[#DCE5ED] bg-white pl-8 text-[10px] outline-none focus:border-[#FF5A1F]"
              />
            </div>
          </div>
          </div>
        </div>

        {/* ── CONDITIONAL VIEW: STATION CASH (DATE-WISE GROUPED) VS ONLINE/CASH TABLE ── */}
        {paymentType === "station_cash" ? (
          <div className="p-3 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !stationCashData?.dateGroups || stationCashData.dateGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-[220px]">
                <MapPin className="w-8 h-8 text-slate-300 mb-2" />
                <h4 className="text-[12px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">
                  No Station Cash Collections Found
                </h4>
                <p className="text-[10px] text-[#74839A] mt-1">
                  All station passenger cash collections are fully reconciled or none recorded for the selected filter.
                </p>
              </div>
            ) : (
              stationCashData.dateGroups
                .filter((dg) => selectedStationDate === "ALL" || selectedStationDate === dg.departureDate)
                .map((dg) => (
                  <div key={dg.departureDate} className="space-y-3 rounded-xl border border-[#DCE5ED] bg-[#F8FAFC]/50 p-3">
                    {/* Departure Date Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3EAF2] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF0EA] text-[#E84712]">
                          <Calendar className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-[13px] font-bold text-[#13283F] flex items-center gap-2">
                            Departure Date: {safeFormatDate(dg.departureDate)}
                            <Badge variant="outline" className="text-[9px] bg-white border-slate-200 text-slate-600">
                              {dg.passengersCount} Collections
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {dg.stationsCount} station desk(s) active on this departure
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-[13px] font-bold font-mono text-green-600">
                            ₹{Number(dg.totalAmount).toLocaleString("en-IN")}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Verified: ₹{Number(dg.verifiedAmount).toLocaleString("en-IN")} · Pending: ₹{Number(dg.pendingAmount).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Station Groups */}
                    <div className="space-y-2.5">
                      {dg.stationGroups.map((sg: any) => {
                        const isExpanded = expandedStationKeys[sg.stationKey] !== false; // expanded by default
                        return (
                          <div key={sg.stationKey} className="overflow-hidden rounded-lg border border-[#DCE5ED] bg-white shadow-2xs">
                            {/* Station Group Banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FBFCFE] px-3.5 py-2.5 border-b border-[#E8EEF4]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-orange-100 text-orange-700 font-bold text-[10px]">
                                  <MapPin className="w-3.5 h-3.5" />
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-[12px] font-bold text-[#13283F] truncate">
                                      {sg.tripName}
                                    </h4>
                                    <Badge variant="outline" className="text-[9px] bg-slate-100 text-slate-700 font-mono">
                                      {sg.station}
                                    </Badge>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                                    <span>👤 Collectors: {sg.collectors.join(", ") || "Station Staff"}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right mr-1">
                                  <span className="text-[12px] font-bold font-mono text-green-600 block">
                                    ₹{Number(sg.totalAmount).toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    {sg.pendingItems > 0 ? (
                                      <span className="text-amber-600 font-semibold">{sg.pendingItems} Pending Review</span>
                                    ) : (
                                      <span className="text-green-600 font-semibold">All {sg.verifiedItems} Verified</span>
                                    )}
                                  </span>
                                </div>

                                {sg.pendingItems > 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleBatchVerifyStation(sg)}
                                    disabled={!isSuperuserFounder}
                                    title={!isSuperuserFounder ? "Founder access required" : "Batch verify all collections at this station"}
                                    className="h-7 text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                                  >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Verify Station Batch (₹{sg.pendingAmount.toLocaleString("en-IN")})
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpandStation(sg.stationKey)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>

                            {/* Passenger Collections Table within Station */}
                            {isExpanded && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50/70 border-b border-[#E8EEF4] text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                      <th className="px-3.5 py-2">Booking ID</th>
                                      <th className="px-3.5 py-2">Passenger / Contact</th>
                                      <th className="px-3.5 py-2 text-right">Cash Collected</th>
                                      <th className="px-3.5 py-2">Receipt Number</th>
                                      <th className="px-3.5 py-2">Collected By</th>
                                      <th className="px-3.5 py-2">Time</th>
                                      <th className="px-3.5 py-2">Status</th>
                                      <th className="px-3.5 py-2 text-right pr-3.5">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#E8EEF4] text-[10.5px]">
                                    {sg.items.map((item: any) => (
                                      <tr key={item.id} className="hover:bg-[#F8FAFD] transition-colors">
                                        <td className="px-3.5 py-2 font-mono font-bold text-[#E84712]">
                                          {item.bookingId}
                                        </td>
                                        <td className="px-3.5 py-2">
                                          <div className="font-bold text-[#13283F]">{item.collectedFrom}</div>
                                          {item.collectedFromMobile && (
                                            <div className="text-[9.5px] text-slate-400 font-mono">{item.collectedFromMobile}</div>
                                          )}
                                        </td>
                                        <td className="px-3.5 py-2 text-right font-mono font-bold text-green-600 text-[11px]">
                                          ₹{Number(item.amount).toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-3.5 py-2 font-mono text-slate-600 text-[10px]">
                                          {item.receiptNumber}
                                        </td>
                                        <td className="px-3.5 py-2 text-slate-500 font-medium">
                                          {item.collectorName}
                                        </td>
                                        <td className="px-3.5 py-2 text-slate-400 font-mono text-[9.5px]">
                                          {item.collectedAt ? new Date(item.collectedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                                        </td>
                                        <td className="px-3.5 py-2">
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-[8.5px] font-bold uppercase",
                                              item.status === "VERIFIED"
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : item.status === "REJECTED"
                                                ? "bg-red-50 text-red-700 border-red-200"
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                            )}
                                          >
                                            {item.status === "VERIFIED" ? "Verified" : item.status === "REJECTED" ? "Rejected" : "Pending Verification"}
                                          </Badge>
                                        </td>
                                        <td className="px-3.5 py-2 text-right pr-3.5">
                                          {item.status === "PENDING_VERIFICATION" ? (
                                            <div className="flex items-center justify-end gap-1">
                                              <Button
                                                size="sm"
                                                disabled={!isSuperuserFounder}
                                                onClick={() => handleSingleStationAction(item, "APPROVE")}
                                                className="h-6 px-2 text-[9px] font-bold bg-green-600 hover:bg-green-700 text-white"
                                              >
                                                Verify
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={!isSuperuserFounder}
                                                onClick={() => handleSingleStationAction(item, "REJECT")}
                                                className="h-6 px-2 text-[9px] font-bold text-red-600 border-red-200 hover:bg-red-50"
                                              >
                                                Reject
                                              </Button>
                                            </div>
                                          ) : (
                                            <span className="text-[9.5px] text-slate-400 italic">
                                              {item.verifiedBy ? `Verified by ${item.verifiedBy}` : "Verified"}
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : (
          /* Normal Online & Sales Cash Payments Table */
          <>
            <div className="hidden overflow-x-auto lg:block">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : allItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center h-[200px]">
                  <CreditCard className="w-8 h-8 text-slate-300 mb-2" />
                  <h4 className="text-[11.5px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">
                    No Incoming Payments Pending
                  </h4>
                  <p className="text-[10px] text-[#74839A] mt-1">
                    All customer collections and cash handovers are up to date.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-[#E3EAF2] text-[9.5px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
                      <th className="px-4 py-2.5">Booking ID</th>
                      <th className="px-4 py-2.5">Customer / Group</th>
                      <th className="px-4 py-2.5">Payment Mode / Type</th>
                      <th className="px-4 py-2.5">UTR / Reference</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5">Collected By</th>
                      <th className="px-4 py-2.5">Approval Assignee</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3EAF2] text-[11px] font-semibold text-[#162B45]">
                    {allItems.map((item) => {
                      const isCash =
                        item.type === "CASH_HANDOVER" ||
                        item.paymentMode?.toUpperCase().includes("CASH");

                      return (
                        <tr key={item.id} className="hover:bg-[#F8FAFD] transition-colors h-[44px]">
                          <td className="px-4 py-2 font-bold font-mono text-[#FF4D00]">
                            {item.bookingId || "—"}
                          </td>
                          <td className="px-4 py-2 font-bold text-[#162B45]">
                            {item.customerName}
                          </td>
                          <td className="px-4 py-2">
                            {isCash ? (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-bold bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1 w-fit"
                              >
                                <ShieldCheck className="w-2.5 h-2.5 text-amber-600" />
                                Cash (Superuser / Founder)
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-bold bg-blue-50 text-blue-800 border-blue-200 w-fit"
                              >
                                {item.paymentMode?.replace(/_/g, " ")} (Finance Hub)
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-700 text-[10.5px]">
                            {item.reference || "—"}
                          </td>
                          <td className="px-4 py-2 text-right font-mono font-bold text-green-600 text-[12px]">
                            ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-2 text-slate-500 font-medium text-[10.5px]">
                            {item.collectedBy}
                          </td>
                          <td className="px-4 py-2">
                            {item.status === "PENDING_VERIFICATION" ||
                            item.status === "PENDING_HANDOVER" ||
                            item.status === "PENDING" ? (
                              <Select
                                value={item.assigneeId || "UNASSIGNED"}
                                onValueChange={(val) => handleAssignApprover(item.id, val)}
                                disabled={assigningId === item.id}
                              >
                                <SelectTrigger className="h-6.5 text-[10px] w-36 rounded border-slate-200 bg-white font-medium">
                                  <SelectValue placeholder="Assign Approver" />
                                </SelectTrigger>
                                <SelectContent className="rounded">
                                  <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                                  {staffUsers.map((staff) => (
                                    <SelectItem key={staff.id} value={staff.id}>
                                      {staff.name} ({staff.role || "Staff"})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-medium">
                                {item.assigneeName || "Finance Team"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-500 font-mono text-[10.5px]">
                            {safeFormatDate(item.date)}
                          </td>
                          <td className="px-4 py-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-bold uppercase",
                                item.status === "VERIFIED" || item.status === "APPROVED" || item.status === "COMPLETED"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : item.status === "REJECTED"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-right pr-4">
                            {item.status === "PENDING_VERIFICATION" ||
                            item.status === "PENDING_HANDOVER" ||
                            item.status === "PENDING" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {isCash && !isSuperuserFounder ? (
                                  <Button
                                    size="sm"
                                    disabled
                                    title="Cash approvals are restricted to Superuser / Founder accounts only"
                                    className="h-6.5 text-[9.5px] font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1"
                                  >
                                    Superuser Only
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedPayment(item);
                                        setActionModalType("verify");
                                      }}
                                      className="h-6.5 text-[9.5px] font-bold bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      {isCash ? "Approve Cash" : "Verify Online"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedPayment(item);
                                        setActionModalType("reject");
                                      }}
                                      className="h-6.5 text-[9.5px] font-bold text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic font-medium">
                                Verified
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="divide-y divide-[#E5ECF2] lg:hidden">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF5A1F] border-t-transparent" />
                </div>
              ) : allItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <CreditCard className="mb-2 h-8 w-8 text-slate-300" />
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#13283F]">
                    Queue clear
                  </h4>
                  <p className="mt-1 text-[10px] text-[#8293A3]">
                    No incoming payments match this filter.
                  </p>
                </div>
              ) : (
                allItems.map((item) => {
                  const isCash =
                    item.type === "CASH_HANDOVER" ||
                    item.paymentMode?.toUpperCase().includes("CASH");
                  const isPending =
                    item.status === "PENDING_VERIFICATION" ||
                    item.status === "PENDING_HANDOVER" ||
                    item.status === "PENDING";

                  return (
                    <div key={item.id} className="space-y-3 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-mono text-[11px] font-bold text-[#E84712]">
                            {item.bookingId || "—"}
                          </div>
                          <div className="mt-0.5 truncate text-[13px] font-bold text-[#13283F]">
                            {item.customerName}
                          </div>
                          <div className="mt-1 text-[10px] text-[#8293A3]">
                            {safeFormatDate(item.date)} · {item.collectedBy}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[15px] font-bold tabular-nums text-[#138A68]">
                            ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "mt-1 text-[8px] font-bold uppercase",
                              item.status === "VERIFIED" ||
                                item.status === "APPROVED" ||
                                item.status === "COMPLETED"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : item.status === "REJECTED"
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700",
                            )}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg border border-[#E5ECF2] bg-[#FBFCFD] px-2.5 py-2">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-[#8293A3]">
                            Mode
                          </div>
                          <div className="mt-0.5 font-semibold text-[#13283F]">
                            {isCash ? "Cash handover" : item.paymentMode?.replace(/_/g, " ")}
                          </div>
                        </div>
                        <div className="rounded-lg border border-[#E5ECF2] bg-[#FBFCFD] px-2.5 py-2">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-[#8293A3]">
                            Reference
                          </div>
                          <div className="mt-0.5 truncate font-mono font-semibold text-[#13283F]">
                            {item.reference || "—"}
                          </div>
                        </div>
                      </div>

                      {isPending ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          {isCash && !isSuperuserFounder ? (
                            <Button
                              size="sm"
                              disabled
                              className="h-9 w-full text-[10px] font-bold"
                            >
                              Superuser approval required
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(item);
                                  setActionModalType("verify");
                                }}
                                className="h-9 flex-1 bg-green-600 text-[10px] font-bold hover:bg-green-700"
                              >
                                {isCash ? "Approve cash" : "Verify payment"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPayment(item);
                                  setActionModalType("reject");
                                }}
                                className="h-9 flex-1 border-red-200 text-[10px] font-bold text-red-600 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STATION BATCH VERIFICATION MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={actionModalType === "station_batch"} onOpenChange={() => setActionModalType(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-green-700 flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-green-600" />
              Verify Station Cash Batch
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Sign off on all cash collections at this departure station in one click.
            </DialogDescription>
          </DialogHeader>

          {selectedStationBatch && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Trip & Station:</span>
                  <span className="font-semibold text-slate-800">{selectedStationBatch.tripName} · {selectedStationBatch.station}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Departure Date:</span>
                  <span className="font-semibold text-slate-800">{safeFormatDate(selectedStationBatch.departureDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collections Count:</span>
                  <span className="font-semibold text-slate-800">{selectedStationBatch.items?.length || 0} passengers</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5">
                  <span className="text-slate-700 font-bold">Total Batch Amount:</span>
                  <span className="font-mono font-bold text-green-600 text-sm">
                    ₹{Number(selectedStationBatch.pendingAmount || selectedStationBatch.totalAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Founder Verification Notes (Optional)
                </label>
                <Input
                  placeholder="e.g. Physical cash received & verified with station lead"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionModalType(null)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={confirmBatchVerify}
              className="h-8 text-xs font-bold bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Station Batch Verified
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          VERIFY CONFIRMATION MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={actionModalType === "verify"} onOpenChange={() => setActionModalType(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Verify & Approve Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Confirm that this payment has been deposited into the company bank account.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking ID:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedPayment.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{selectedPayment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-mono font-bold text-green-600 text-sm">
                    ₹{Number(selectedPayment.amount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode / Reference:</span>
                  <span className="font-mono text-slate-700">{selectedPayment.paymentMode} · {selectedPayment.reference}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Verification Notes (Optional)
                </label>
                <Input
                  placeholder="e.g. Bank credit confirmed on statement"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionModalType(null)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleVerify}
              className="h-8 text-xs font-bold bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Verified
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          REJECT PAYMENT MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={actionModalType === "reject"} onOpenChange={() => setActionModalType(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-700 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Payment Entry
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide a mandatory reason for rejecting this payment entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <label className="text-[10px] font-bold uppercase text-red-600">
              Rejection Reason (Required)
            </label>
            <Textarea
              placeholder="State reason (e.g. UTR mismatch, payment declined by bank)..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="text-xs resize-none h-20 border-red-300"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionModalType(null)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleReject}
              className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


