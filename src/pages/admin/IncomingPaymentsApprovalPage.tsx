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
    (currentUser as any)?.isSuperuser;

  const [incomingPayments, setIncomingPayments] = useState<IncomingPaymentItem[]>([]);
  const [cashSubmissions, setCashSubmissions] = useState<CashSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentType, setPaymentType] = useState<"all" | "online" | "cash">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");

  // Actions
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [actionModalType, setActionModalType] = useState<"verify" | "reject" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, cashRes] = await Promise.all([
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
      ]);
      setIncomingPayments(incRes?.data || []);
      setCashSubmissions(cashRes?.data || []);
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

  // Merge items
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

  const pendingCount = allItems.filter(
    (i) => i.status === "PENDING_VERIFICATION" || i.status === "PENDING_HANDOVER" || i.status === "PENDING"
  ).length;
  const verifiedCount = allItems.filter(
    (i) => i.status === "VERIFIED" || i.status === "APPROVED" || i.status === "COMPLETED"
  ).length;
  const totalVerifiedSum = allItems
    .filter((i) => i.status === "VERIFIED" || i.status === "APPROVED")
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalPendingSum = allItems
    .filter((i) => i.status === "PENDING_VERIFICATION" || i.status === "PENDING_HANDOVER" || i.status === "PENDING")
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

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
    <div className="space-y-4 font-sans select-none antialiased text-[#162B45]">
      {/* 1. COMPACT HEADER */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2]">
          <div className="space-y-0.5">
            <h1 className="text-[22px] font-[600] text-[#162B45] tracking-tight leading-none font-montserrat flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#F97316]" />
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
                className="h-8.5 w-64 pl-8 text-[11px] rounded bg-white border-[#E3EAF2] placeholder-[#74839A]/60 focus:border-[#F97316] outline-none"
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

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-4 gap-4">
        {/* KPI 1: Pending Verification */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Pending Verification
            </p>
            <h3 className="text-[20px] font-extrabold text-[#D97706] leading-none mt-1">
              {loading ? "..." : pendingCount}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Awaiting finance approval
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-amber-50 flex items-center justify-center text-[#D97706] border border-amber-100 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 2: Pending Volume */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Pending Volume
            </p>
            <h3 className="text-[20px] font-extrabold text-blue-600 leading-none mt-1">
              {loading ? "..." : `₹${totalPendingSum.toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Awaiting bank reconciliation
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 3: Verified Today */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Verified Payments
            </p>
            <h3 className="text-[20px] font-extrabold text-emerald-600 leading-none mt-1">
              {loading ? "..." : verifiedCount}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Credited & reconciled
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 4: Verified Total Value */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Total Collections
            </p>
            <h3 className="text-[20px] font-extrabold text-slate-900 leading-none mt-1">
              {loading ? "..." : `₹${totalVerifiedSum.toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Customer booking inflows
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100 shrink-0">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. TABLE WORKSPACE */}
      <div className="bg-white border border-[#E3EAF2] rounded-[8px] shadow-[0_1px_2px_rgba(15,23,42,0.02)] overflow-hidden flex flex-col">
        {/* Filters Header */}
        <div className="p-3.5 border-b border-[#E3EAF2] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/70">
              <button
                onClick={() => setPaymentType("all")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                  paymentType === "all"
                    ? "bg-white text-[#F97316] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                All Payments ({allItems.length})
              </button>
              <button
                onClick={() => setPaymentType("online")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                  paymentType === "online"
                    ? "bg-white text-[#F97316] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Online & Bank Transfers ({incomingPayments.length})
              </button>
              <button
                onClick={() => setPaymentType("cash")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                  paymentType === "cash"
                    ? "bg-white text-[#F97316] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Cash Payments & Submissions ({cashSubmissions.length})
              </button>
            </div>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="h-8 text-xs w-40 rounded border-[#E3EAF2] bg-white font-semibold">
                <SelectValue placeholder="Assignee Filter" />
              </SelectTrigger>
              <SelectContent className="rounded">
                <SelectItem value="ALL">All Assignees</SelectItem>
                <SelectItem value="ME">Assigned to Me</SelectItem>
                <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded">
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
                    "px-2.5 py-1 rounded text-[9.5px] font-extrabold uppercase tracking-wider transition-all",
                    statusFilter === tab.key
                      ? "bg-white text-[#162B45] shadow-xs"
                      : "text-[#74839A] hover:text-[#162B45]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
              <Input
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7.5 w-48 pl-8 text-[11px] rounded bg-slate-50 border-[#E3EAF2] focus:border-[#F97316] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
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
                      <td className="px-4 py-2 font-bold font-mono text-[#F97316]">
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
                      <td className="px-4 py-2 text-right font-mono font-bold text-emerald-600 text-[12px]">
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
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : item.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
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
                                  className="h-6.5 text-[9.5px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
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
                                  className="h-6.5 text-[9.5px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
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
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VERIFY CONFIRMATION MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={actionModalType === "verify"} onOpenChange={() => setActionModalType(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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
                  <span className="font-mono font-bold text-emerald-600 text-sm">
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
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
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
            <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Reject Payment Entry
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide a mandatory reason for rejecting this payment entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <label className="text-[10px] font-bold uppercase text-rose-600">
              Rejection Reason (Required)
            </label>
            <Textarea
              placeholder="State reason (e.g. UTR mismatch, payment declined by bank)..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="text-xs resize-none h-20 border-rose-300"
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
              className="h-8 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
