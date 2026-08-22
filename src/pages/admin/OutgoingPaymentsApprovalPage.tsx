import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Truck,
  Compass,
  User,
  Search,
  RotateCw,
  ExternalLink,
  Eye,
  Upload,
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
import { canReviewVendorPayout, canApproveVendorPayoutFounder } from "@/utils/collectionVerification";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  extractBillReference,
  formatVendorService,
  sanitizePlainLabel,
} from "@/utils/vendorDisplayText";
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

const PILL =
  "inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap transition-colors";
const PILL_ACTIVE = "bg-[#0B1528] text-white";
const PILL_IDLE = "border border-[#E8EEF4] bg-white text-slate-600 hover:bg-[#F4F7FB]";

export default function OutgoingPaymentsApprovalPage({
  hideHeader = false,
}: OutgoingPaymentsApprovalPageProps) {
  const { admin: currentUser } = useAuthStore();
  const canReview = canReviewVendorPayout(currentUser);
  const canFounderVerify = canApproveVendorPayoutFounder(currentUser);

  const [vendorItems, setVendorItems] = useState<VendorPaymentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeCategory, setActiveCategory] = useState<OutgoingCategory>("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<"review" | "approve" | "upload" | "view-proof" | null>(null);
  const [payoutNotes, setPayoutNotes] = useState("");
  const [proofUrlInput, setProofUrlInput] = useState("");
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
        category: sanitizePlainLabel(v.category || v.vendorType, "Hotels"),
        vendorName: sanitizePlainLabel(v.vendorName, "Vendor"),
        tripName: sanitizePlainLabel(v.tripName || v.tripTitle, "Trip"),
        tripId: v.tripId,
        departureDate: v.departureDate || null,
        serviceDescription: v.serviceDescription || (v as any).notes || v.vendorType || v.category || "Service",
        notes: (v as any).notes || (v as any).remarks || "",
        operationalLinked: Boolean(v.operationalLinked),
        departureHref: v.departureHref || null,
        billReference: extractBillReference(
          v.billReference || (v as any).transactionRef,
          v.id,
        ),
        totalCost,
        paidAmount,
        outstandingAmount,
        overpaidAmount: Number((v as any).overpaidAmount || Math.max(0, paidAmount - totalCost)),
        isOverpaid,
        approvalStatus: (v as any).approvalStatus || "PENDING",
        status: v.paymentStatus || (v as any).status || "PENDING",
        requiresFounderApproval: Boolean((v as any).requiresFounderApproval),
        proofUrl:
          (v as any).proofUrl ||
          (v as any).invoiceFileUrl ||
          (v as any).invoiceProof ||
          (v as any).advanceProofUrl ||
          (v as any).settlementProofUrl ||
          null,
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
        const service = formatVendorService(item);
        return (
          item.vendorName.toLowerCase().includes(q) ||
          item.tripName.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          service.primary.toLowerCase().includes(q) ||
          service.secondary.toLowerCase().includes(q) ||
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

  const closeAction = () => {
    setActionType(null);
    setSelectedItem(null);
    setPayoutNotes("");
    setProofUrlInput("");
  };

  const persistProofIfNeeded = async (item: any) => {
    const next = (proofUrlInput || item.proofUrl || "").trim();
    if (!next) return null;
    if (next !== item.proofUrl) {
      await financeApprovalsService.uploadVendorPaymentProof(item.id, {
        proofFileUrl: next,
        proofFileName: "vendor_payout_proof",
      });
    }
    return next;
  };

  const handleVendorAction = async () => {
    if (!selectedItem || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "upload") {
        if (!proofUrlInput.trim()) {
          toast.error("Upload a receipt, screenshot, or PDF first");
          return;
        }
        await financeApprovalsService.uploadVendorPaymentProof(selectedItem.id, {
          proofFileUrl: proofUrlInput.trim(),
          proofFileName: "vendor_payout_proof",
        });
        toast.success("Payment proof attached to this payout");
        closeAction();
        loadData();
        return;
      }

      const proof = await persistProofIfNeeded(selectedItem);
      if (!proof) {
        toast.error("Payment proof is required before review or verify. Upload it first.");
        setActionType("upload");
        return;
      }

      if (actionType === "review") {
        await financeApprovalsService.reviewVendorPaymentFC(selectedItem.id, {
          reason: payoutNotes.trim() || undefined,
          invoiceFileUrl: proof,
        });
        toast.success("Finance Controller review recorded. Founder verification is still required.");
      } else if (actionType === "approve") {
        await financeApprovalsService.approveVendorPaymentFounder(selectedItem.id, {
          reason: payoutNotes.trim() || undefined,
          invoiceFileUrl: proof,
        });
        toast.success("Founder verified this vendor payout");
      }
      closeAction();
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Vendor approval failed");
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
    <div className="min-w-0 space-y-2 font-sans antialiased text-[#162B45]">
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

      <dl className="grid grid-cols-3 divide-x divide-[#E3EAF2] overflow-hidden rounded-lg border border-[#E3EAF2] bg-white">
        <div className="flex min-w-0 flex-col gap-1 px-3 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#74839A]">
            Pending Bills
          </dt>
          <dd className="text-[18px] font-bold tabular-nums leading-none text-[#162B45]">
            {loading ? "—" : pendingBills.length}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-1 px-3 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#74839A]">
            Outstanding
          </dt>
          <dd className="whitespace-nowrap text-[18px] font-bold tabular-nums leading-none text-[#B91C1C]">
            {loading ? "—" : formatINR(totalOutstanding)}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-1 px-3 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#74839A]">
            Paid
          </dt>
          <dd className="whitespace-nowrap text-[18px] font-bold tabular-nums leading-none text-[#15803D]">
            {loading ? "—" : formatINR(totalPaid)}
          </dd>
        </div>
      </dl>

      <div className="min-w-0 overflow-hidden rounded-lg border border-[#E3EAF2] bg-white">
        <div className="flex min-w-0 flex-col gap-2 border-b border-[#E3EAF2] px-2.5 py-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
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
                className={cn(PILL, activeCategory === cat.key ? PILL_ACTIVE : PILL_IDLE)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
              {[
                { key: "ALL", label: "All" },
                { key: "PENDING", label: "Pending" },
                { key: "PAID", label: "Settled" },
                { key: "REJECTED", label: "Rejected" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(PILL, statusFilter === tab.key ? PILL_ACTIVE : PILL_IDLE)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative min-w-0 flex-1 lg:w-52 lg:flex-none">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#74839A]" />
              <Input
                placeholder="Search vendor, departure, service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 w-full pl-8 text-[11px]"
              />
            </div>
            {hideHeader && (
              <Button
                onClick={loadData}
                variant="outline"
                className="h-7 shrink-0 px-2.5 text-[10px] font-semibold"
              >
                <RotateCw className={cn("mr-1 h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
            )}
          </div>
        </div>

        <div className="min-w-0 overflow-x-auto">
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
            <table className="w-max min-w-[1100px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[88px]" />
                <col className="w-[168px]" />
                <col className="w-[200px]" />
                <col className="w-[176px]" />
                <col className="w-[104px]" />
                <col className="w-[104px]" />
                <col className="w-[120px]" />
                <col className="w-[88px]" />
                <col className="w-[220px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#E3EAF2] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-2.5 py-2">Category</th>
                  <th className="px-2.5 py-2">Vendor</th>
                  <th className="px-2.5 py-2">Departure / Trip</th>
                  <th className="px-2.5 py-2">Service</th>
                  <th className="px-2.5 py-2 text-right">Total</th>
                  <th className="px-2.5 py-2 text-right">Paid</th>
                  <th className="px-2.5 py-2 text-right">Outstanding</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {aggregatedItems.map((item) => {
                  const label = vendorStatusLabel(item);
                  const service = formatVendorService(item);
                  const showFcApprove = canReview && label === "Pending";
                  const showFounderVerify = canFounderVerify && label === "Reviewed";
                  const settled = label === "Settled";
                  const proofUrl = item.proofUrl;
                  return (
                    <tr key={item.id} className="border-b border-[#EEF2F6] last:border-b-0 hover:bg-[#F8FAFC]">
                      <td className="px-2.5 py-1.5 align-middle">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {getCategoryIcon(item.category)}
                          <span className="truncate text-[11px] font-semibold">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5 align-middle font-semibold">
                        <span className="block truncate" title={item.vendorName}>
                          {item.vendorName}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 align-middle text-slate-600">
                        <div className="min-w-0">
                          <p className="truncate leading-tight" title={item.tripName}>
                            <span className="font-medium text-[#162B45]">{item.tripName}</span>
                            {item.departureDate && (
                              <span className="text-[11px] font-normal text-slate-400">
                                {" "}
                                · {safeFormatDate(item.departureDate)}
                              </span>
                            )}
                          </p>
                          {item.operationalLinked && item.departureHref ? (
                            <Link
                              to={item.departureHref}
                              className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#C2410C] hover:underline"
                            >
                              View Departure
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          ) : (
                            <span className="mt-0.5 inline-flex rounded bg-slate-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                              Unavailable
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5 align-middle text-slate-600">
                        <div className="min-w-0" title={service.tooltip}>
                          <p className="truncate leading-tight text-[#162B45]">{service.primary}</p>
                          {service.secondary && (
                            <p className="truncate text-[10px] leading-tight text-slate-400">
                              {service.secondary}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5 align-middle text-right font-mono text-[12px] tabular-nums whitespace-nowrap">
                        {formatINR(item.totalCost)}
                      </td>
                      <td
                        className={cn(
                          "px-2.5 py-1.5 align-middle text-right font-mono text-[12px] tabular-nums whitespace-nowrap",
                          settled ? "font-semibold text-[#15803D]" : "text-slate-600",
                        )}
                      >
                        {formatINR(item.paidAmount)}
                      </td>
                      <td className="px-2.5 py-1.5 align-middle text-right font-mono text-[12px] font-semibold tabular-nums whitespace-nowrap">
                        {item.isOverpaid ? (
                          <span className="text-amber-700">Overpaid {formatINR(item.overpaidAmount)}</span>
                        ) : (
                          <span className={item.outstandingAmount > 0 ? "text-[#B91C1C]" : "text-slate-400"}>
                            {formatINR(Math.max(0, item.outstandingAmount))}
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-1.5 align-middle">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold uppercase",
                            settled
                              ? "bg-green-50 text-green-700 border-green-200"
                              : label === "Rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : label === "Overpaid"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : label === "Reviewed"
                                    ? "bg-sky-50 text-sky-700 border-sky-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200",
                          )}
                        >
                          {label}
                        </Badge>
                      </td>
                      <td className="px-2.5 py-1.5 align-middle">
                        <div className="flex flex-wrap items-center gap-1">
                          {proofUrl ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(item);
                                setActionType("view-proof");
                                setProofUrlInput(proofUrl);
                              }}
                              className="h-7 px-2 text-[10px] font-semibold"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View proof
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(item);
                                setActionType("upload");
                                setProofUrlInput("");
                              }}
                              className="h-7 px-2 text-[10px] font-semibold border-amber-300 bg-amber-50 text-amber-800"
                            >
                              <Upload className="mr-1 h-3 w-3" />
                              Upload proof
                            </Button>
                          )}
                          {settled ? (
                            <span className="text-[10px] italic text-slate-400">Settled</span>
                          ) : (
                            <>
                              {showFcApprove && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setActionType("review");
                                    setProofUrlInput(proofUrl || "");
                                  }}
                                  className="h-7 px-2 text-[10px] font-semibold"
                                >
                                  FC Approve
                                </Button>
                              )}
                              {showFounderVerify && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setActionType("approve");
                                    setProofUrlInput(proofUrl || "");
                                  }}
                                  className="h-7 px-2 text-[10px] font-semibold bg-[#0B1528] text-white"
                                >
                                  Founder Verify
                                </Button>
                              )}
                              {!showFcApprove && !showFounderVerify && (
                                <span className="text-[10px] italic text-slate-400">
                                  {label === "Reviewed" ? "Awaiting Founder" : "Awaiting review"}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={Boolean(actionType)} onOpenChange={(open) => { if (!open) closeAction(); }}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {actionType === "review"
                ? "FC approve vendor payout"
                : actionType === "approve"
                  ? "Founder verify vendor payout"
                  : actionType === "view-proof"
                    ? "Payment proof"
                    : "Upload payment proof"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Two-step vendor approval: Finance Controller reviews, then Founder verifies. Proof stays on this payout even if Departure Hub is unlinked.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (() => {
            const service = formatVendorService(selectedItem);
            const previewUrl = proofUrlInput || selectedItem.proofUrl;
            return (
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Vendor</span>
                  <span className="truncate font-semibold text-right" title={selectedItem.vendorName}>
                    {selectedItem.vendorName}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Departure / Trip</span>
                  <span className="truncate text-right" title={selectedItem.tripName}>{selectedItem.tripName}</span>
                </div>
                {!selectedItem.operationalLinked && (
                  <p className="text-[10px] text-slate-400">Operational record unavailable — proof is stored on this payout.</p>
                )}
                <div className="flex justify-between gap-3">
                  <span className="shrink-0 text-slate-500">Service</span>
                  <span className="max-w-[240px] truncate text-right" title={service.tooltip}>
                    {service.primary}
                    {service.secondary ? ` · ${service.secondary}` : ""}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Total / Paid</span>
                  <span className="font-mono">
                    {formatINR(selectedItem.totalCost)} / {formatINR(selectedItem.paidAmount)}
                  </span>
                </div>
              </div>
              {previewUrl && (actionType === "view-proof" || actionType === "review" || actionType === "approve") && (
                <div className="space-y-2">
                  {/\.pdf($|\?)/i.test(previewUrl) ? (
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-blue-700 underline">
                      Open PDF proof
                    </a>
                  ) : (
                    <img src={previewUrl} alt="Vendor payout proof" className="max-h-56 w-full rounded border object-contain bg-white" />
                  )}
                </div>
              )}
              {actionType !== "view-proof" && (
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700">Payment proof (image or PDF)</label>
                  <ImageUpload
                    label="Upload receipt / screenshot"
                    value={proofUrlInput}
                    onUpload={(url) => setProofUrlInput(url)}
                    compact
                    accept="image/*,.pdf,application/pdf"
                  />
                </div>
              )}
              {(actionType === "review" || actionType === "approve") && (
                <Input
                  placeholder="Notes (optional)"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="h-8 text-xs"
                />
              )}
            </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeAction}>
              Close
            </Button>
            {actionType !== "view-proof" && (
              <Button size="sm" disabled={actionLoading} onClick={handleVendorAction} className="bg-[#0B1528] text-white">
                {actionType === "upload"
                  ? "Save proof"
                  : actionType === "review"
                    ? "Confirm FC approve"
                    : "Confirm Founder verify"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
