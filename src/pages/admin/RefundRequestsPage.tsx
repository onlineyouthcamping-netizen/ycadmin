import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RotateCw,
  CreditCard,
  Building2,
  FileText,
  DollarSign,
  User,
  ArrowRight,
  ShieldCheck,
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
import { toast } from "sonner";
import { cn, safeFormatDate } from "@/lib/utils";
import { financeControllerService } from "@/services/financeController.service";
import type { RefundTransactionItem } from "@/types";

interface RefundRequestsPageProps {
  hideHeader?: boolean;
}

export default function RefundRequestsPage({ hideHeader = false }: RefundRequestsPageProps) {
  const [refunds, setRefunds] = useState<RefundTransactionItem[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeSubTab, setActiveSubTab] = useState<"refunds" | "credits">("refunds");

  // Action states
  const [selectedRefund, setSelectedRefund] = useState<RefundTransactionItem | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [refundApprovalRef, setRefundApprovalRef] = useState("");
  const [refundRejectReason, setRefundRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [refundsRes, creditsRes] = await Promise.all([
        financeControllerService.refunds.list({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          search: search.trim() || undefined,
          limit: 50,
        }).catch(() => ({ data: [], pagination: {} })),
        financeControllerService.credits.getActive().catch(() => []),
      ]);
      setRefunds(refundsRes?.data || []);
      setCredits(creditsRes || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load refund requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived counts
  const pendingRefunds = refunds.filter((r) => r.status === "PENDING_APPROVAL");
  const approvedRefunds = refunds.filter((r) => r.status === "APPROVED" || r.status === "COMPLETED");
  const totalPendingAmount = pendingRefunds.reduce(
    (sum, r) => sum + (Number(r.refundAmount) || 0) + (Number(r.creditNoteAmount) || 0),
    0
  );
  const totalCreditsBalance = credits.reduce(
    (sum, c) => sum + (Number(c.remainingBalance) || 0),
    0
  );

  const handleApprove = async () => {
    if (!selectedRefund) return;
    setActionLoading(true);
    try {
      await financeControllerService.refunds.approve(selectedRefund.id, {
        refundReference: refundApprovalRef.trim() || undefined,
      });
      toast.success("Refund approved successfully");
      setShowApproveDialog(false);
      setSelectedRefund(null);
      setRefundApprovalRef("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve refund");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRefund) return;
    if (!refundRejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActionLoading(true);
    try {
      await financeControllerService.refunds.reject(selectedRefund.id, refundRejectReason.trim());
      toast.success("Refund rejected");
      setShowRejectDialog(false);
      setSelectedRefund(null);
      setRefundRejectReason("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject refund");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-3 font-sans antialiased text-[#162B45]">
      {/* 1. HEADER (if not embedded) */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2]">
          <div className="space-y-0.5">
            <h1 className="text-[22px] font-[600] text-[#162B45] tracking-tight leading-none font-montserrat flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#F97316]" />
              Refund Requests & Store Credits
            </h1>
            <p className="text-[#74839A] text-[12px] font-[500] leading-none">
              Review and approve customer cancellation refunds and manage store credit notes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
              <Input
                placeholder="Search Booking ID, reason, status..."
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
      <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl border border-[#DCE5ED] bg-[#F8FAFC] lg:grid-cols-4 lg:gap-0">
        {/* KPI 1: Pending Approvals */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Pending Approvals
            </p>
            <h3 className="text-[20px] font-extrabold text-[#D97706] leading-none mt-1">
              {loading ? "..." : pendingRefunds.length}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Awaiting finance approval
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-amber-50 flex items-center justify-center text-[#D97706] border border-amber-100 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 2: Total Pending Refund Value */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Pending Refund Value
            </p>
            <h3 className="text-[20px] font-extrabold text-rose-600 leading-none mt-1">
              {loading ? "..." : `₹${totalPendingAmount.toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Cash & credit claims
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 3: Store Credits Available */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Active Store Credits
            </p>
            <h3 className="text-[20px] font-extrabold text-emerald-600 leading-none mt-1">
              {loading ? "..." : `₹${totalCreditsBalance.toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            {credits.length} credit notes issued
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 4: Approved & Processed */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Processed Refunds
            </p>
            <h3 className="text-[20px] font-extrabold text-blue-600 leading-none mt-1">
              {loading ? "..." : approvedRefunds.length}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Successfully completed
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CARD */}
      <div className="bg-white border border-[#E3EAF2] rounded-[8px] shadow-[0_1px_2px_rgba(15,23,42,0.02)] overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="p-3.5 border-b border-[#E3EAF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/70">
              <button
                onClick={() => setActiveSubTab("refunds")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                  activeSubTab === "refunds"
                    ? "bg-white text-[#F97316] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refund Requests ({refunds.length})
              </button>
              <button
                onClick={() => setActiveSubTab("credits")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                  activeSubTab === "credits"
                    ? "bg-white text-[#F97316] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Store Credit Ledger ({credits.length})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeSubTab === "refunds" && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded">
                {[
                  { key: "ALL", label: "ALL" },
                  { key: "PENDING_APPROVAL", label: "PENDING" },
                  { key: "APPROVED", label: "APPROVED" },
                  { key: "COMPLETED", label: "COMPLETED" },
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
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7.5 w-48 pl-8 text-[11px] rounded bg-slate-50 border-[#E3EAF2] focus:border-[#F97316] outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4. CONTENT TABLE */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeSubTab === "refunds" ? (
            refunds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-[200px]">
                <RefreshCw className="w-8 h-8 text-slate-300 mb-2" />
                <h4 className="text-[11.5px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">
                  No Refund Requests Found
                </h4>
                <p className="text-[10px] text-[#74839A] mt-1">
                  There are no pending customer refund requests in this queue.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-[#E3EAF2] text-[9.5px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
                    <th className="px-4 py-2.5">Booking ID</th>
                    <th className="px-4 py-2.5">Refund Reason</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5 text-right">Cash Portion</th>
                    <th className="px-4 py-2.5 text-right">Credit Note</th>
                    <th className="px-4 py-2.5">Requested Date</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EAF2] text-[11px] font-semibold text-[#162B45]">
                  {refunds.map((ref) => (
                    <tr key={ref.id} className="hover:bg-[#F8FAFD] transition-colors h-[44px]">
                      <td className="px-4 py-2 font-bold font-mono text-[#F97316]">
                        {ref.bookingId}
                      </td>
                      <td className="px-4 py-2 text-slate-700 font-medium capitalize">
                        {ref.refundReason?.replace(/_/g, " ") || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-[9px] font-bold bg-slate-50">
                          {ref.refundMethod}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">
                        {Number(ref.refundAmount || 0) > 0
                          ? `₹${Number(ref.refundAmount || 0).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-orange-600">
                        {Number(ref.creditNoteAmount || 0) > 0
                          ? `₹${Number(ref.creditNoteAmount || 0).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-500 font-mono text-[10.5px]">
                        {safeFormatDate(ref.createdAt)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold uppercase",
                            ref.status === "COMPLETED" || ref.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ref.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {ref.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right pr-4">
                        {ref.status === "PENDING_APPROVAL" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRefund(ref);
                                setShowApproveDialog(true);
                              }}
                              className="h-6.5 text-[9.5px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRefund(ref);
                                setShowRejectDialog(true);
                              }}
                              className="h-6.5 text-[9.5px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">
                            Processed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            /* STORE CREDITS TABLE */
            credits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-[200px]">
                <CreditCard className="w-8 h-8 text-slate-300 mb-2" />
                <h4 className="text-[11.5px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">
                  No Active Store Credits
                </h4>
                <p className="text-[10px] text-[#74839A] mt-1">
                  No unused credit notes are currently recorded in the system.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-[#E3EAF2] text-[9.5px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
                    <th className="px-4 py-2.5">Credit Code</th>
                    <th className="px-4 py-2.5">Origin Booking</th>
                    <th className="px-4 py-2.5 text-right">Original Amount</th>
                    <th className="px-4 py-2.5 text-right">Total Used</th>
                    <th className="px-4 py-2.5 text-right">Remaining Balance</th>
                    <th className="px-4 py-2.5">Expiry</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EAF2] text-[11px] font-semibold text-[#162B45]">
                  {credits.map((cred) => (
                    <tr key={cred.id || cred.code} className="hover:bg-[#F8FAFD] transition-colors h-[44px]">
                      <td className="px-4 py-2 font-mono font-bold text-slate-900">
                        {cred.code || cred.id}
                      </td>
                      <td className="px-4 py-2 font-mono text-[#F97316]">
                        {cred.bookingId || "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-medium text-slate-700">
                        ₹{Number(cred.originalAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-medium text-slate-500">
                        ₹{Number(cred.totalUsed || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-emerald-600">
                        ₹{Number(cred.remainingBalance || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2 text-slate-500 font-mono text-[10.5px]">
                        {cred.expiresAt ? safeFormatDate(cred.expiresAt) : "No Expiry"}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold uppercase",
                            Number(cred.remainingBalance || 0) > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          )}
                        >
                          {Number(cred.remainingBalance || 0) > 0 ? "Active" : "Exhausted"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          APPROVE REFUND MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Approve Customer Refund
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Confirm bank disbursement or store credit note issuance.
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking ID:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedRefund.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Refund:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{Number(selectedRefund.refundAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Store Credit:</span>
                  <span className="font-mono font-bold text-orange-600">
                    ₹{Number(selectedRefund.creditNoteAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Bank UTR / Transaction Reference (Optional)
                </label>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApproveDialog(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleApprove}
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          REJECT REFUND MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Reject Refund Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide a mandatory reason for rejecting this refund request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <label className="text-[10px] font-bold uppercase text-rose-600">
              Rejection Reason (Required)
            </label>
            <Textarea
              placeholder="State reason for rejecting refund..."
              value={refundRejectReason}
              onChange={(e) => setRefundRejectReason(e.target.value)}
              className="text-xs resize-none h-20 border-rose-300"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectDialog(false)}
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
