import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Truck,
  Compass,
  User,
  Search,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Link } from "react-router-dom";
import { financeControllerService } from "@/services/financeController.service";
import { financeApprovalsService } from "@/services/financeApprovals.service";
import { useAuthStore } from "@/store/auth.store";
import { canVerifyCollection } from "@/utils/collectionVerification";
import type { VendorPaymentRequestItem } from "@/types";

interface OutgoingPaymentsApprovalPageProps {
  hideHeader?: boolean;
}

type OutgoingCategory = "all" | "Hotels" | "Transport" | "Activities" | "Guides";

function formatINR(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function vendorStatusLabel(item: {
  approvalStatus?: string;
  status?: string;
  isOverpaid?: boolean;
}) {
  const approval = String(item.approvalStatus || "").toUpperCase();
  const status = String(item.status || "").toUpperCase();
  if (approval === "REJECTED" || status === "REJECTED") return "Rejected";
  if (approval === "APPROVED_FOUNDER" || status === "PAID") return "Settled";
  if (approval === "REVIEWED_FINANCE_CONTROLLER") return "Reviewed";
  if (item.isOverpaid) return "Overpaid";
  return "Pending";
}

export default function OutgoingPaymentsApprovalPage({
  hideHeader = false,
}: OutgoingPaymentsApprovalPageProps) {
  const { admin: currentUser } = useAuthStore();
  const canAct = canVerifyCollection(currentUser);
  const role = String(currentUser?.role || "").toLowerCase();
  const isFounder = ["founder", "superadmin", "super_admin"].includes(role) || canVerifyCollection(currentUser) && role !== "finance_controller";
  const isFinanceController = role === "finance_controller";

  const [vendorItems, setVendorItems] = useState<VendorPaymentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeCategory, setActiveCategory] = useState<OutgoingCategory>("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<"review" | "approve" | null>(null);
  const [payoutNotes, setPayoutNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const vRes = await financeControllerService.getVendorQueue({ limit: 100 }).catch(() => ({ data: [] }));
      setVendorItems(vRes?.data || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load vendor payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const aggregatedItems = vendorItems
    .map((v) => {
      const totalCost = Number((v as any).totalCost ?? v.agreedTariff ?? 0);
      const paidAmount = Number(v.paidAmount || 0);
      const outstandingAmount = Number(
        (v as any).outstandingAmount ?? totalCost - paidAmount,
      );
      const isOverpaid = Boolean((v as any).isOverpaid) || outstandingAmount < 0;
      return {
        id: v.id,
        category: v.category || v.vendorType || "Hotels",
        vendorName: v.vendorName || "Vendor",
        tripName: v.tripName || v.tripTitle || "Trip",
        tripId: v.tripId,
        departureDate: v.departureDate || null,
        serviceDescription: v.serviceDescription || v.vendorType || v.category || "Service",
        operationalLinked: Boolean(v.operationalLinked),
        departureHref: v.departureHref || null,
        billReference: v.billReference || (v as any).transactionRef || `BILL-${String(v.id || "").slice(-6)}`,
        totalCost,
        paidAmount,
        outstandingAmount,
        overpaidAmount: Number((v as any).overpaidAmount || Math.max(0, paidAmount - totalCost)),
        isOverpaid,
        approvalStatus: (v as any).approvalStatus || "PENDING",
        status: v.paymentStatus || (v as any).status || "PENDING",
        requiresFounderApproval: Boolean((v as any).requiresFounderApproval),
        raw: v,
      };
    })
    .filter((item) => {
      if (activeCategory !== "all" && String(item.category) !== activeCategory) return false;
      const label = vendorStatusLabel(item);
      if (statusFilter === "PENDING" && label !== "Pending" && label !== "Reviewed") return false;
      if (statusFilter === "PAID" && label !== "Settled" && label !== "Overpaid") return false;
      if (statusFilter === "REJECTED" && label !== "Rejected") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.vendorName.toLowerCase().includes(q) ||
          item.tripName.toLowerCase().includes(q) ||
          item.serviceDescription.toLowerCase().includes(q) ||
          item.billReference.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const pendingBills = aggregatedItems.filter((i) => {
    const label = vendorStatusLabel(i);
    return label === "Pending" || label === "Reviewed";
  });
  const totalOutstanding = aggregatedItems.reduce(
    (sum, i) => sum + Math.max(0, Number(i.outstandingAmount || 0)),
    0,
  );
  const totalPaid = aggregatedItems.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0);

  const handleVendorAction = async () => {
    if (!selectedItem || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "review") {
        await financeApprovalsService.reviewVendorPaymentFC(selectedItem.id, {
          reason: payoutNotes.trim() || undefined,
          directClear: !selectedItem.requiresFounderApproval && isFinanceController,
        });
        toast.success(
          selectedItem.requiresFounderApproval
            ? "Reviewed. Founder approval still required."
            : "Vendor bill reviewed",
        );
      } else {
        await financeApprovalsService.approveVendorPaymentFounder(selectedItem.id, {
          reason: payoutNotes.trim() || undefined,
        });
        toast.success("Vendor payout approved");
      }
      setActionType(null);
      setSelectedItem(null);
      setPayoutNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Vendor approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (String(cat)) {
      case "Transport":
        return <Truck className="w-3.5 h-3.5 text-amber-600" />;
      case "Activities":
        return <Compass className="w-3.5 h-3.5 text-[#C2410C]" />;
      case "Guides":
        return <User className="w-3.5 h-3.5 text-green-700" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-3 font-sans antialiased text-[#162B45]">
      {!hideHeader && (
        <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2]">
          <div className="space-y-0.5">
            <h1 className="text-[22px] font-semibold text-[#162B45] tracking-tight leading-none">
              Vendor payments
            </h1>
            <p className="text-[#74839A] text-[12px] font-medium">
              Departure Hub liabilities. Finance Controller reviews, Founder approves when required.
            </p>
          </div>
          <Button
            onClick={loadData}
            className="h-8 bg-white hover:bg-slate-50 border border-[#E3EAF2] rounded px-3 text-[#162B45] text-[11px] font-semibold"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#74839A] mr-1" /> Refresh
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="bg-white border border-[#E3EAF2] rounded-lg p-3.5">
          <p className="text-[11px] font-semibold text-[#74839A] uppercase tracking-wide">Pending Bills</p>
          <h3 className="mt-1 text-[22px] font-bold text-[#162B45] tabular-nums">
            {loading ? "—" : pendingBills.length}
          </h3>
        </div>
        <div className="bg-white border border-[#E3EAF2] rounded-lg p-3.5">
          <p className="text-[11px] font-semibold text-[#74839A] uppercase tracking-wide">Outstanding</p>
          <h3 className="mt-1 text-[22px] font-bold text-[#162B45] tabular-nums">
            {loading ? "—" : formatINR(totalOutstanding)}
          </h3>
        </div>
        <div className="bg-white border border-[#E3EAF2] rounded-lg p-3.5">
          <p className="text-[11px] font-semibold text-[#74839A] uppercase tracking-wide">Paid</p>
          <h3 className="mt-1 text-[22px] font-bold text-[#162B45] tabular-nums">
            {loading ? "—" : formatINR(totalPaid)}
          </h3>
        </div>
      </div>

      <div className="bg-white border border-[#E3EAF2] rounded-lg overflow-hidden">
        <div className="p-3.5 border-b border-[#E3EAF2] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1 overflow-x-auto">
            {([
              { key: "all", label: "All" },
              { key: "Hotels", label: "Hotels" },
              { key: "Transport", label: "Transport" },
              { key: "Activities", label: "Activities" },
              { key: "Guides", label: "Guides" },
            ] as const).map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap",
                  activeCategory === cat.key
                    ? "bg-[#0B1528] text-white"
                    : "bg-white border border-[#E3EAF2] text-slate-600",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[
                { key: "ALL", label: "All" },
                { key: "PENDING", label: "Pending" },
                { key: "PAID", label: "Settled" },
                { key: "REJECTED", label: "Rejected" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-bold uppercase",
                    statusFilter === tab.key ? "bg-slate-900 text-white" : "text-slate-500",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
              <Input
                placeholder="Search vendor, departure, service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-52 pl-8 text-[11px]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#C2410C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : aggregatedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="w-8 h-8 text-slate-300 mb-2" />
              <h4 className="text-[12px] font-semibold text-[#162B45]">No vendor bills</h4>
              <p className="text-[11px] text-[#74839A] mt-1">Departure Hub has no open liabilities for this filter.</p>
            </div>
          ) : (
            <table className="w-full min-w-[860px] text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E3EAF2] text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Vendor</th>
                  <th className="px-4 py-2.5">Departure / Trip</th>
                  <th className="px-4 py-2.5">Service</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5 text-right">Paid</th>
                  <th className="px-4 py-2.5 text-right">Outstanding</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EAF2] text-[12px]">
                {aggregatedItems.map((item) => {
                  const label = vendorStatusLabel(item);
                  const showReview = canAct && (isFinanceController || isFounder) && label === "Pending";
                  const showApprove = canAct && isFounder && (label === "Reviewed" || (label === "Pending" && !item.requiresFounderApproval));
                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(item.category)}
                          <span className="font-semibold text-[11px]">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 font-semibold">{item.vendorName}</td>
                      <td className="px-4 py-2 text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          <span>{item.tripName}</span>
                          {item.departureDate && (
                            <span className="text-[10px] text-slate-400">
                              {safeFormatDate(item.departureDate)}
                            </span>
                          )}
                          {item.operationalLinked && item.departureHref ? (
                            <Link
                              to={item.departureHref}
                              className="text-[10px] font-semibold text-[#C2410C] hover:underline w-fit"
                            >
                              View Departure
                            </Link>
                          ) : (
                            <span className="text-[10px] text-slate-400">Operational record unavailable</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-slate-600">{item.serviceDescription}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatINR(item.totalCost)}</td>
                      <td className="px-4 py-2 text-right font-mono text-green-700">{formatINR(item.paidAmount)}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold">
                        {item.isOverpaid ? (
                          <span className="text-amber-700">Overpaid {formatINR(item.overpaidAmount)}</span>
                        ) : (
                          <span className={item.outstandingAmount > 0 ? "text-red-700" : "text-slate-500"}>
                            {formatINR(Math.max(0, item.outstandingAmount))}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold uppercase",
                            label === "Settled"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : label === "Rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : label === "Overpaid"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200",
                          )}
                        >
                          {label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right pr-4">
                        {label === "Settled" ? (
                          <span className="text-[10px] text-slate-400 italic">Settled</span>
                        ) : !canAct ? (
                          <span className="text-[10px] text-slate-400 italic">Awaiting review</span>
                        ) : (
                          <div className="flex justify-end gap-1">
                            {showReview && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setActionType("review");
                                }}
                                className="h-7 text-[10px] font-semibold"
                              >
                                Review
                              </Button>
                            )}
                            {showApprove && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setActionType("approve");
                                }}
                                className="h-7 text-[10px] font-semibold bg-[#0B1528] text-white"
                              >
                                Approve
                              </Button>
                            )}
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

      <Dialog open={Boolean(actionType)} onOpenChange={() => setActionType(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {actionType === "review" ? "Review vendor bill" : "Approve vendor payout"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Two-step vendor approval. Finance Controller reviews first; Founder approves when the balance requires it.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor</span>
                  <span className="font-semibold">{selectedItem.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Departure / Trip</span>
                  <span>{selectedItem.tripName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service</span>
                  <span>{selectedItem.serviceDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total / Paid</span>
                  <span className="font-mono">
                    {formatINR(selectedItem.totalCost)} / {formatINR(selectedItem.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{selectedItem.isOverpaid ? "Overpaid" : "Outstanding"}</span>
                  <span className="font-mono font-semibold">
                    {formatINR(selectedItem.isOverpaid ? selectedItem.overpaidAmount : Math.max(0, selectedItem.outstandingAmount))}
                  </span>
                </div>
              </div>
              <Input
                placeholder="Notes (optional)"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button size="sm" disabled={actionLoading} onClick={handleVendorAction} className="bg-[#0B1528] text-white">
              {actionType === "review" ? "Confirm review" : "Confirm approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
