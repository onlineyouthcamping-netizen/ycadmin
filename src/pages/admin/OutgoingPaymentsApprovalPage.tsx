import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Truck,
  Compass,
  User,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RotateCw,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  FileText,
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
import { toast } from "sonner";
import { cn, safeFormatDate } from "@/lib/utils";
import { financeControllerService } from "@/services/financeController.service";
import type { VendorPaymentRequestItem, DeparturePayoutItem, TicketFinanceAuditItem } from "@/types";

interface OutgoingPaymentsApprovalPageProps {
  hideHeader?: boolean;
}

type OutgoingCategory = "all" | "hotels" | "transport" | "activities" | "guides" | "train_ticketing";

export default function OutgoingPaymentsApprovalPage({
  hideHeader = false,
}: OutgoingPaymentsApprovalPageProps) {
  const [vendorItems, setVendorItems] = useState<VendorPaymentRequestItem[]>([]);
  const [departureItems, setDepartureItems] = useState<DeparturePayoutItem[]>([]);
  const [ticketingItems, setTicketingItems] = useState<TicketFinanceAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeCategory, setActiveCategory] = useState<OutgoingCategory>("all");

  // Payout action
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [paymentMode, setPaymentMode] = useState("BANK_TRANSFER");
  const [transactionRef, setTransactionRef] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, dRes, tRes] = await Promise.all([
        financeControllerService.getVendorQueue({ limit: 50 }).catch(() => ({ data: [], pagination: {} })),
        financeControllerService.getDeparturesQueue().catch(() => []),
        financeControllerService.getTicketingQueue({ limit: 50 }).catch(() => ({ data: [], pagination: {} })),
      ]);
      setVendorItems(vRes?.data || []);
      setDepartureItems(dRes || []);
      setTicketingItems(tRes?.data || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load outgoing payment requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate all outgoing liabilities
  const aggregatedItems = [
    // 1. Vendor Bills (Hotels, Transports, Activities, Guides)
    ...vendorItems.map((v) => ({
      id: v.id,
      category: (v.vendorType || "HOTEL").toLowerCase(),
      categoryLabel: v.vendorType || "HOTEL",
      vendorName: v.vendorName || "Operational Vendor",
      tripName: v.tripName || "Trip Operations",
      totalCost: v.amountRequested || v.cost || 0,
      paidAmount: v.paidAmount || 0,
      dueAmount: (v.amountRequested || v.cost || 0) - (v.paidAmount || 0),
      dueDate: v.dueDate || v.createdAt,
      status: v.status || "PENDING_APPROVAL",
      reference: v.invoiceNumber || `BILL-${v.id?.slice(-6)}`,
      raw: v,
      sourceType: "VENDOR_BILL",
    })),
    // 2. Train Ticketing Balances
    ...ticketingItems.map((t) => ({
      id: t.id,
      category: "train_ticketing",
      categoryLabel: "TRAIN TICKETING",
      vendorName: t.passengerName ? `IRCTC (${t.passengerName})` : "IRCTC / Rail Desk",
      tripName: t.trainNumber ? `Train ${t.trainNumber}` : "Railway Operations",
      totalCost: t.cost || 0,
      paidAmount: 0,
      dueAmount: t.cost || 0,
      dueDate: t.createdAt,
      status: t.status === "APPROVED" ? "APPROVED" : "PENDING_APPROVAL",
      reference: t.pnr || `TIX-${t.id?.slice(-6)}`,
      raw: t,
      sourceType: "TRAIN_TICKET",
    })),
    // 3. Departure Vendor Settlements
    ...departureItems.map((d) => ({
      id: d.id,
      category: "hotels",
      categoryLabel: "DEPARTURE SETTLEMENT",
      vendorName: d.tripName || "Departure Operations",
      tripName: `${d.tripCode || "DEP"} · ${d.departureDate || ""}`,
      totalCost: d.totalPayable || d.totalAmount || 0,
      paidAmount: d.totalPaid || 0,
      dueAmount: (d.totalPayable || d.totalAmount || 0) - (d.totalPaid || 0),
      dueDate: d.departureDate || d.createdAt,
      status: d.status || "PENDING_APPROVAL",
      reference: d.id?.slice(-8),
      raw: d,
      sourceType: "DEPARTURE_PAYOUT",
    })),
  ].filter((item) => {
    // Category filter
    if (activeCategory !== "all") {
      if (activeCategory === "hotels" && !["hotel", "hotels", "accommodation", "departure settlement"].includes(item.category.toLowerCase())) return false;
      if (activeCategory === "transport" && !["transport", "transportation", "bus", "cab"].includes(item.category.toLowerCase())) return false;
      if (activeCategory === "activities" && !["activity", "activities", "permit"].includes(item.category.toLowerCase())) return false;
      if (activeCategory === "guides" && !["guide", "guides", "leader", "trek leader"].includes(item.category.toLowerCase())) return false;
      if (activeCategory === "train_ticketing" && item.category !== "train_ticketing") return false;
    }
    // Status filter
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.vendorName.toLowerCase().includes(q) ||
        item.tripName.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingLiabilities = aggregatedItems.filter(
    (i) => i.status === "PENDING_APPROVAL" || i.status === "PENDING_PAYOUT" || i.status === "PENDING"
  );
  const totalPendingDue = pendingLiabilities.reduce((sum, i) => sum + Number(i.dueAmount || 0), 0);
  const totalPaidOut = aggregatedItems.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0);

  const handleApprovePayment = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      if (selectedItem.sourceType === "TRAIN_TICKET") {
        await financeControllerService.performTicketingAction(selectedItem.id, {
          action: "APPROVE",
          notes: payoutNotes.trim() || undefined,
        });
      } else {
        await financeControllerService.performVendorAction(selectedItem.id, {
          action: "APPROVE_AND_PAY",
          paidAmount: Number(selectedItem.dueAmount || 0),
          paymentMode,
          transactionRef: transactionRef.trim() || undefined,
          notes: payoutNotes.trim() || undefined,
        });
      }
      toast.success("Vendor payout approved successfully");
      setShowPayDialog(false);
      setSelectedItem(null);
      setTransactionRef("");
      setPayoutNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payout approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "hotels":
      case "hotel":
        return <Building2 className="w-3.5 h-3.5 text-blue-500" />;
      case "transport":
        return <Truck className="w-3.5 h-3.5 text-amber-500" />;
      case "activities":
      case "activity":
        return <Compass className="w-3.5 h-3.5 text-orange-500" />;
      case "guides":
      case "guide":
        return <User className="w-3.5 h-3.5 text-emerald-500" />;
      case "train_ticketing":
        return <Ticket className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4 font-sans select-none antialiased text-[#162B45]">
      {/* 1. HEADER */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2]">
          <div className="space-y-0.5">
            <h1 className="text-[22px] font-[600] text-[#162B45] tracking-tight leading-none font-montserrat flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#F97316]" />
              Outgoing Vendor Payments & Liabilities
            </h1>
            <p className="text-[#74839A] text-[12px] font-[500] leading-none">
              Verify and approve outgoing payouts for Hotels, Transport, Activities, Trek Guides, and Train Ticketing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
              <Input
                placeholder="Search vendor, trip, reference..."
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

      {/* 2. KPI METRICS */}
      <div className="grid grid-cols-4 gap-4">
        {/* KPI 1: Pending Approval Count */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Pending Bills
            </p>
            <h3 className="text-[20px] font-extrabold text-[#D97706] leading-none mt-1">
              {loading ? "..." : pendingLiabilities.length}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Awaiting payout approval
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-amber-50 flex items-center justify-center text-[#D97706] border border-amber-100 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 2: Total Pending Outflow */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Outstanding Liabilities
            </p>
            <h3 className="text-[20px] font-extrabold text-rose-600 leading-none mt-1">
              {loading ? "..." : `₹${totalPendingDue.toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Hotels, Fleet, Guides, Rail
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 3: Paid Out Volume */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Disbursed Payments
            </p>
            <h3 className="text-[20px] font-extrabold text-emerald-600 leading-none mt-1">
              {loading ? "..." : `₹${totalPaidOut.toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Paid to vendors & staff
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 4: Total Contracted */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Active Vendor Contracts
            </p>
            <h3 className="text-[20px] font-extrabold text-slate-900 leading-none mt-1">
              {loading ? "..." : aggregatedItems.length}
            </h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">
            Across active departures
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100 shrink-0">
            <Building2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN TABLE WITH 5 OPERATIONAL TABS */}
      <div className="bg-white border border-[#E3EAF2] rounded-[8px] shadow-[0_1px_2px_rgba(15,23,42,0.02)] overflow-hidden flex flex-col">
        {/* Category Tabs Header */}
        <div className="p-3.5 border-b border-[#E3EAF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/70 overflow-x-auto max-w-full">
              {[
                { key: "all", label: "All Liabilities", icon: Building2 },
                { key: "hotels", label: "🏨 Hotels / Stays", icon: Building2 },
                { key: "transport", label: "🚌 Transport Fleet", icon: Truck },
                { key: "activities", label: "🎯 Activities & Permits", icon: Compass },
                { key: "guides", label: "🧭 Guides & Leaders", icon: User },
                { key: "train_ticketing", label: "🚆 Train Ticketing", icon: Ticket },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key as OutgoingCategory)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap",
                    activeCategory === cat.key
                      ? "bg-white text-[#F97316] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded">
              {[
                { key: "ALL", label: "ALL" },
                { key: "PENDING_APPROVAL", label: "PENDING" },
                { key: "PAID", label: "PAID" },
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
                placeholder="Search vendor or trip..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7.5 w-48 pl-8 text-[11px] rounded bg-slate-50 border-[#E3EAF2] focus:border-[#F97316] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Liabilities Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : aggregatedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center h-[200px]">
              <Building2 className="w-8 h-8 text-slate-300 mb-2" />
              <h4 className="text-[11.5px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">
                No Outgoing Liabilities
              </h4>
              <p className="text-[10px] text-[#74839A] mt-1">
                All operational vendor payouts and train ticketing accounts are fully settled.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-[#E3EAF2] text-[9.5px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Vendor / Payee</th>
                  <th className="px-4 py-2.5">Trip / Route</th>
                  <th className="px-4 py-2.5">Bill / Ref</th>
                  <th className="px-4 py-2.5 text-right">Total Cost</th>
                  <th className="px-4 py-2.5 text-right">Paid</th>
                  <th className="px-4 py-2.5 text-right">Due Balance</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EAF2] text-[11px] font-semibold text-[#162B45]">
                {aggregatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFD] transition-colors h-[44px]">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(item.category)}
                        <span className="font-bold text-[10px] text-slate-700 uppercase tracking-tight">
                          {item.categoryLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 font-bold text-[#162B45]">
                      {item.vendorName}
                    </td>
                    <td className="px-4 py-2 text-slate-600 font-medium">
                      {item.tripName}
                    </td>
                    <td className="px-4 py-2 font-mono text-[#F97316] text-[10.5px]">
                      {item.reference}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">
                      ₹{Number(item.totalCost || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium text-emerald-600">
                      ₹{Number(item.paidAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-rose-600 text-[12px]">
                      ₹{Number(item.dueAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-bold uppercase",
                          item.status === "PAID" || item.status === "COMPLETED" || item.status === "APPROVED"
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
                      {item.status !== "PAID" && Number(item.dueAmount || 0) > 0 ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowPayDialog(true);
                          }}
                          className="h-6.5 text-[9.5px] font-bold bg-[#F97316] hover:bg-[#EA580C] text-white"
                        >
                          Approve Payout
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic font-medium">
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          APPROVE VENDOR PAYOUT MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#F97316]" />
              Approve Vendor Payout
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Confirm bank disbursement or voucher settlement for this operational expense.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor / Payee:</span>
                  <span className="font-bold text-slate-900">{selectedItem.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trip / Route:</span>
                  <span className="font-medium text-slate-800">{selectedItem.tripName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Balance:</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    ₹{Number(selectedItem.dueAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full h-8 text-xs rounded border border-slate-200 bg-white px-2 mt-1"
                >
                  <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                  <option value="UPI">Company UPI</option>
                  <option value="CASH">Trip Cash Handover</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Bank Reference / UTR Number
                </label>
                <Input
                  placeholder="e.g. UTR-HDFC-998877"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Approval Notes (Optional)
                </label>
                <Input
                  placeholder="e.g. Cleared 50% advance for Manali hotel rooms"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPayDialog(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleApprovePayment}
              className="h-8 text-xs font-bold bg-[#F97316] hover:bg-[#EA580C] text-white"
            >
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
