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
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Utensils,
  Eye,
  Check,
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
import { toast } from "sonner";
import { cn, safeFormatDate } from "@/lib/utils";
import { financeControllerService } from "@/services/financeController.service";
import { financeApprovalsService } from "@/services/financeApprovals.service";
import { useAuthStore } from "@/store/auth.store";

interface OutgoingPaymentsApprovalPageProps {
  hideHeader?: boolean;
}

type OutgoingCategory = "all" | "hotels" | "transport" | "activities" | "guides" | "tripwise";

export default function OutgoingPaymentsApprovalPage({
  hideHeader = false,
}: OutgoingPaymentsApprovalPageProps) {
  const { admin: currentUser } = useAuthStore();
  const userRole = (currentUser?.role || "").toLowerCase();
  const isSuperuserFounder =
    ["superadmin", "founder", "admin"].includes(userRole) ||
    (currentUser as any)?.isSuperuser ||
    (currentUser?.email && currentUser.email.toLowerCase().includes("hemal"));

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeCategory, setActiveCategory] = useState<OutgoingCategory>("tripwise");

  // Trip-wise Data
  const [tripGroups, setTripGroups] = useState<any[]>([]);
  const [allVendorItems, setAllVendorItems] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<{
    totalAgreed: number;
    totalPaid: number;
    totalDue: number;
    totalTrips: number;
    totalVendors: number;
    pendingBillsCount: number;
  }>({
    totalAgreed: 0,
    totalPaid: 0,
    totalDue: 0,
    totalTrips: 0,
    totalVendors: 0,
    pendingBillsCount: 0,
  });

  const [expandedTripIds, setExpandedTripIds] = useState<Record<string, boolean>>({});

  // Payout / Approval action modal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "pay" | "reject" | null>(null);
  const [paymentMode, setPaymentMode] = useState("BANK_TRANSFER");
  const [transactionRef, setTransactionRef] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tripAccountsRes, pendingApprovalsRes] = await Promise.all([
        financeControllerService.getTripWiseVendorAccounts({
          search: search.trim() || undefined,
        }).catch(() => ({
          success: false,
          summary: { totalAgreed: 0, totalPaid: 0, totalDue: 0, totalTrips: 0, totalVendors: 0, pendingBillsCount: 0 },
          tripGroups: [],
          items: [],
        })),
        financeApprovalsService.getPendingApprovals().catch(() => null),
      ]);

      if (tripAccountsRes && tripAccountsRes.tripGroups) {
        setTripGroups(tripAccountsRes.tripGroups);
        setAllVendorItems(tripAccountsRes.items || []);
        setSummaryData(tripAccountsRes.summary || {
          totalAgreed: 0,
          totalPaid: 0,
          totalDue: 0,
          totalTrips: 0,
          totalVendors: 0,
          pendingBillsCount: 0,
        });

        // Expand all trips by default for high visibility
        const expandedMap: Record<string, boolean> = {};
        tripAccountsRes.tripGroups.forEach((tg: any) => {
          expandedMap[tg.tripId] = true;
        });
        setExpandedTripIds(expandedMap);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load vendor payout accounts");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTripExpand = (tripId: string) => {
    setExpandedTripIds((prev) => ({ ...prev, [tripId]: !prev[tripId] }));
  };

  const getCategoryIcon = (cat: string) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("hotel") || c.includes("stay") || c.includes("accommodation")) {
      return <Building2 className="w-3.5 h-3.5 text-blue-500" />;
    }
    if (c.includes("trans") || c.includes("fleet") || c.includes("vehicle") || c.includes("bus")) {
      return <Truck className="w-3.5 h-3.5 text-amber-500" />;
    }
    if (c.includes("act") || c.includes("permit") || c.includes("raft")) {
      return <Compass className="w-3.5 h-3.5 text-orange-500" />;
    }
    if (c.includes("guide") || c.includes("leader") || c.includes("trek")) {
      return <User className="w-3.5 h-3.5 text-emerald-600" />;
    }
    return <Utensils className="w-3.5 h-3.5 text-slate-500" />;
  };

  // Filtered flat items for table view
  const filteredFlatItems = allVendorItems.filter((item) => {
    if (activeCategory !== "all" && activeCategory !== "tripwise") {
      if (activeCategory === "hotels" && item.category !== "HOTELS") return false;
      if (activeCategory === "transport" && item.category !== "TRANSPORT") return false;
      if (activeCategory === "activities" && item.category !== "ACTIVITIES") return false;
      if (activeCategory === "guides" && item.category !== "GUIDES") return false;
    }
    if (statusFilter !== "ALL") {
      if (statusFilter === "PENDING_APPROVAL") {
        if (item.status === "Paid" || item.approvalStatus === "APPROVED_FOUNDER") return false;
      } else if (statusFilter === "PAID") {
        if (item.status !== "Paid" && item.approvalStatus !== "APPROVED_FOUNDER") return false;
      } else if (statusFilter === "REJECTED") {
        if (item.status !== "Rejected" && item.approvalStatus !== "REJECTED") return false;
      }
    }
    return true;
  });

  const handleAction = async () => {
    if (!selectedItem || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "approve") {
        if (isSuperuserFounder) {
          await financeApprovalsService.approveVendorPaymentFounder(selectedItem.id, {
            reason: actionNotes.trim() || undefined,
          });
          toast.success("Founder signed off & approved vendor payout");
        } else {
          await financeApprovalsService.reviewVendorPaymentFC(selectedItem.id, {
            reason: actionNotes.trim() || undefined,
          });
          toast.success("Finance Controller verified vendor payout");
        }
      } else if (actionType === "pay") {
        await financeControllerService.performVendorAction(selectedItem.id, {
          action: "APPROVE_AND_PAY",
          paidAmount: Number(selectedItem.remainingPayable || selectedItem.agreedAmount || 0),
          paymentMode,
          transactionRef: transactionRef.trim() || undefined,
          notes: actionNotes.trim() || undefined,
        });
        toast.success("Vendor payment recorded & disbursed");
      } else if (actionType === "reject") {
        if (!actionNotes.trim()) {
          toast.error("Please provide a reason for rejecting this payout");
          setActionLoading(false);
          return;
        }
        await financeApprovalsService.rejectVendorPayment(selectedItem.id, actionNotes.trim());
        toast.success("Vendor payout rejected");
      }

      setActionType(null);
      setSelectedItem(null);
      setTransactionRef("");
      setActionNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-3 font-sans antialiased text-[#162B45]">
      {/* 1. HEADER */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2]">
          <div className="space-y-0.5">
            <h1 className="text-[22px] font-[600] text-[#162B45] tracking-tight leading-none font-montserrat flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF5A1F]" />
              Outgoing Vendor Accounts & Liabilities
            </h1>
            <p className="text-[#74839A] text-[12px] font-[500] leading-none">
              Trip-wise vendor accounts calculation and approval management across Hotels, Transport, Activities, and Guides.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
              <Input
                placeholder="Search trip, hotel, transport, guide..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8.5 w-64 pl-8 text-[11px] rounded bg-white border-[#E3EAF2] placeholder-[#74839A]/60 focus:border-[#FF5A1F] outline-none"
              />
            </div>
            <Button
              onClick={loadData}
              className="h-8.5 bg-white hover:bg-slate-50 border border-[#E3EAF2] rounded px-3 text-[#162B45] text-[11px] font-[600] flex items-center gap-1 shadow-sm transition-all"
            >
              <RotateCw className={cn("w-3.5 h-3.5 text-[#74839A]", loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>
      )}

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl border border-[#DCE5ED] bg-[#F8FAFC] lg:grid-cols-4 lg:gap-0">
        {/* KPI 1: Pending Bills */}
        <div className="bg-white border-b border-r border-[#E3EAF2] p-3.5 h-[84px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between lg:border-b-0">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Pending Bills
            </p>
            <h3 className="text-[20px] font-extrabold text-[#D97706] leading-none mt-1">
              {loading ? "..." : summaryData.pendingBillsCount}
            </h3>
          </div>
          <p className="text-[9.5px] text-[#74839A] font-semibold leading-none">
            Awaiting Founder / FC review
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-amber-50 flex items-center justify-center text-[#D97706] border border-amber-100 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 2: Total Outstanding Liabilities */}
        <div className="bg-white border-b border-r border-[#E3EAF2] p-3.5 h-[84px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between lg:border-b-0">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Outstanding Liabilities
            </p>
            <h3 className="text-[20px] font-extrabold text-red-600 leading-none mt-1">
              {loading ? "..." : `₹${Math.round(summaryData.totalDue).toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="text-[9.5px] text-[#74839A] font-semibold leading-none">
            Due across {summaryData.totalTrips} active trips
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 3: Disbursed Payments */}
        <div className="bg-white border-b border-r border-[#E3EAF2] p-3.5 h-[84px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between lg:border-b-0">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Disbursed Payments
            </p>
            <h3 className="text-[20px] font-extrabold text-emerald-600 leading-none mt-1">
              {loading ? "..." : `₹${Math.round(summaryData.totalPaid).toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="text-[9.5px] text-[#74839A] font-semibold leading-none">
            Paid to operational vendors
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 4: Total Contracted */}
        <div className="bg-white p-3.5 h-[84px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
              Total Contracted Cost
            </p>
            <h3 className="text-[20px] font-extrabold text-slate-900 leading-none mt-1">
              {loading ? "..." : `₹${Math.round(summaryData.totalAgreed).toLocaleString("en-IN")}`}
            </h3>
          </div>
          <p className="text-[9.5px] text-[#74839A] font-semibold leading-none">
            {summaryData.totalVendors} vendor contracts
          </p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-orange-50 flex items-center justify-center text-[#FF5A1F] border border-orange-100 shrink-0">
            <Building2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. CATEGORY & VIEW STRIP */}
      <div className="bg-white border border-[#E3EAF2] rounded-[8px] shadow-[0_1px_2px_rgba(15,23,42,0.02)] overflow-hidden flex flex-col">
        <div className="p-3 border-b border-[#E3EAF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFD]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 shrink-0">
              <button
                onClick={() => setActiveCategory("tripwise")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all flex items-center gap-1.5",
                  activeCategory === "tripwise"
                    ? "bg-white text-[#FF5A1F] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Layers className="w-3.5 h-3.5 text-[#FF5A1F]" />
                Trip-Wise Accounts <span className="ml-1 text-[9px] opacity-60">({tripGroups.length})</span>
              </button>
              <button
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all",
                  activeCategory === "all"
                    ? "bg-white text-[#FF5A1F] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                All Liabilities <span className="ml-1 text-[9px] opacity-60">({allVendorItems.length})</span>
              </button>
              <button
                onClick={() => setActiveCategory("hotels")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all",
                  activeCategory === "hotels"
                    ? "bg-white text-[#FF5A1F] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                🏨 Hotels / Stays
              </button>
              <button
                onClick={() => setActiveCategory("transport")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all",
                  activeCategory === "transport"
                    ? "bg-white text-[#FF5A1F] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                🚐 Transport Fleet
              </button>
              <button
                onClick={() => setActiveCategory("activities")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all",
                  activeCategory === "activities"
                    ? "bg-white text-[#FF5A1F] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                🎯 Activities & Permits
              </button>
              <button
                onClick={() => setActiveCategory("guides")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all",
                  activeCategory === "guides"
                    ? "bg-white text-[#FF5A1F] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                🧭 Guides & Leaders
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded border border-slate-200/60">
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
                    "px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all",
                    statusFilter === tab.key
                      ? "bg-white text-[#162B45] shadow-xs"
                      : "text-[#74839A] hover:text-[#162B45]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 4. CONDITIONAL VIEW: TRIP-WISE ACCOUNTS VS FLAT TABLE ── */}
        {activeCategory === "tripwise" ? (
          /* ── TRIP-WISE ACCOUNT MANAGEMENT WORKSPACE ── */
          <div className="p-3.5 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tripGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-[200px]">
                <Building2 className="w-8 h-8 text-slate-300 mb-2" />
                <h4 className="text-[11.5px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">
                  No Trip Vendor Accounts Found
                </h4>
                <p className="text-[10px] text-[#74839A] mt-1">
                  Vendor contracts and operational bookings will appear here grouped by trip.
                </p>
              </div>
            ) : (
              tripGroups.map((tg) => {
                const isExpanded = Boolean(expandedTripIds[tg.tripId]);
                const percentPaid = tg.totalAgreed > 0 ? Math.min(100, Math.round((tg.totalPaid / tg.totalAgreed) * 100)) : 0;

                return (
                  <div
                    key={tg.tripId}
                    className="border border-[#DCE5ED] rounded-xl bg-white shadow-xs overflow-hidden transition-all"
                  >
                    {/* Trip Header Card */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-[#E3EAF2] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-[12px] bg-[#FFF0EB] text-[#FF5A1F] border border-[#FFD9CC] px-2 py-0.5 rounded">
                            {tg.tripCode}
                          </span>
                          <h3 className="font-bold text-[14px] text-[#13283F] tracking-tight">
                            {tg.tripTitle}
                          </h3>
                          <Badge variant="outline" className="text-[9.5px] font-semibold text-slate-500 bg-slate-50 border-slate-200">
                            <MapPin className="w-2.5 h-2.5 mr-1 text-slate-400" />
                            {tg.tripLocation}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-3">
                          <span>📋 {tg.items.length} Vendor Contracts</span>
                          {tg.pendingApprovals > 0 ? (
                            <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                              ⏳ {tg.pendingApprovals} Pending Approval
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[10px]">✓ All Reviewed</span>
                          )}
                        </p>
                      </div>

                      {/* Total Calculations for this Trip */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[#74839A]">Total Agreed</p>
                          <p className="text-[13px] font-bold font-mono text-slate-900">
                            ₹{Math.round(tg.totalAgreed).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Paid Out</p>
                          <p className="text-[13px] font-bold font-mono text-emerald-600">
                            ₹{Math.round(tg.totalPaid).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right bg-red-50/70 border border-red-200 px-3 py-1 rounded-lg">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-red-700">Due Balance</p>
                          <p className="text-[14px] font-extrabold font-mono text-red-600">
                            ₹{Math.round(tg.totalDue).toLocaleString("en-IN")}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTripExpand(tg.tripId)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 ml-1"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${percentPaid}%` }}
                        title={`${percentPaid}% Paid`}
                      />
                      <div
                        className="bg-red-400 h-full transition-all duration-500"
                        style={{ width: `${100 - percentPaid}%` }}
                        title={`${100 - percentPaid}% Outstanding Due`}
                      />
                    </div>

                    {/* 5-Category Live Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-100 bg-[#FAFBFD] border-b border-[#E3EAF2] text-[10.5px]">
                      {/* Hotels */}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Hotels / Stays ({tg.categories.hotels.count})</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Agreed: ₹{Math.round(tg.categories.hotels.agreed).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between font-mono font-bold text-red-600 text-[11px]">
                          <span>Due:</span>
                          <span>₹{Math.round(tg.categories.hotels.due).toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Transport */}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                          <Truck className="w-3.5 h-3.5 text-amber-500" />
                          <span>Transport Fleet ({tg.categories.transport.count})</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Agreed: ₹{Math.round(tg.categories.transport.agreed).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between font-mono font-bold text-red-600 text-[11px]">
                          <span>Due:</span>
                          <span>₹{Math.round(tg.categories.transport.due).toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                          <Compass className="w-3.5 h-3.5 text-orange-500" />
                          <span>Activities ({tg.categories.activities.count})</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Agreed: ₹{Math.round(tg.categories.activities.agreed).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between font-mono font-bold text-red-600 text-[11px]">
                          <span>Due:</span>
                          <span>₹{Math.round(tg.categories.activities.due).toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Guides */}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Guides & Leaders ({tg.categories.guides.count})</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Agreed: ₹{Math.round(tg.categories.guides.agreed).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between font-mono font-bold text-red-600 text-[11px]">
                          <span>Due:</span>
                          <span>₹{Math.round(tg.categories.guides.due).toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Meals & Other */}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                          <Utensils className="w-3.5 h-3.5 text-purple-600" />
                          <span>Meals & Other ({tg.categories.meals_other.count})</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Agreed: ₹{Math.round(tg.categories.meals_other.agreed).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between font-mono font-bold text-red-600 text-[11px]">
                          <span>Due:</span>
                          <span>₹{Math.round(tg.categories.meals_other.due).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Under-trip Vendor Table */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-[#E3EAF2] text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="px-3.5 py-2">Category</th>
                              <th className="px-3.5 py-2">Vendor / Payee</th>
                              <th className="px-3.5 py-2">Service Description</th>
                              <th className="px-3.5 py-2">Date</th>
                              <th className="px-3.5 py-2 text-right">Agreed Cost</th>
                              <th className="px-3.5 py-2 text-right">Advance Paid</th>
                              <th className="px-3.5 py-2 text-right">Due Balance</th>
                              <th className="px-3.5 py-2">Status</th>
                              <th className="px-3.5 py-2 text-right pr-3.5">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8EEF4] text-[10.5px]">
                            {tg.items.map((item: any) => {
                              const isPaid = item.status === "Paid" || item.approvalStatus === "APPROVED_FOUNDER";
                              const isFCReviewed = item.approvalStatus === "REVIEWED_FINANCE_CONTROLLER";

                              return (
                                <tr key={item.id} className="hover:bg-[#F8FAFD] transition-colors">
                                  <td className="px-3.5 py-2">
                                    <div className="flex items-center gap-1.5">
                                      {getCategoryIcon(item.category)}
                                      <span className="font-bold text-[9.5px] text-slate-700 uppercase">
                                        {item.categoryLabel || item.category}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3.5 py-2 font-bold text-[#13283F]">
                                    {item.vendorName}
                                  </td>
                                  <td className="px-3.5 py-2 text-slate-600">
                                    {item.serviceDescription || "Vendor Service"}
                                  </td>
                                  <td className="px-3.5 py-2 text-slate-500 font-mono text-[9.5px]">
                                    {item.departureDate ? safeFormatDate(item.departureDate) : "Trip Term"}
                                  </td>
                                  <td className="px-3.5 py-2 text-right font-mono font-bold text-slate-900">
                                    ₹{Math.round(item.agreedAmount || 0).toLocaleString("en-IN")}
                                  </td>
                                  <td className="px-3.5 py-2 text-right font-mono font-medium text-emerald-600">
                                    ₹{Math.round(item.advancePaid || 0).toLocaleString("en-IN")}
                                  </td>
                                  <td className="px-3.5 py-2 text-right font-mono font-bold text-red-600 text-[11.5px]">
                                    ₹{Math.round(item.remainingPayable || 0).toLocaleString("en-IN")}
                                  </td>
                                  <td className="px-3.5 py-2">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[8.5px] font-bold uppercase",
                                        isPaid
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : isFCReviewed
                                          ? "bg-purple-50 text-purple-700 border-purple-200"
                                          : item.status === "Rejected"
                                          ? "bg-rose-50 text-rose-700 border-rose-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      )}
                                    >
                                      {isPaid
                                        ? "Paid / Settled"
                                        : isFCReviewed
                                        ? "FC Reviewed (Awaiting Founder)"
                                        : item.status || "Pending Approval"}
                                    </Badge>
                                  </td>
                                  <td className="px-3.5 py-2 text-right pr-3.5">
                                    {!isPaid ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setSelectedItem(item);
                                            setActionType("approve");
                                          }}
                                          className={cn(
                                            "h-6 px-2 text-[9px] font-bold text-white shadow-none",
                                            isSuperuserFounder
                                              ? "bg-emerald-600 hover:bg-emerald-700"
                                              : "bg-blue-600 hover:bg-blue-700"
                                          )}
                                        >
                                          {isSuperuserFounder ? "👑 Founder Approve" : "FC Review"}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedItem(item);
                                            setActionType("pay");
                                          }}
                                          className="h-6 px-2 text-[9px] font-bold text-[#FF5A1F] border-[#FFD9CC] hover:bg-[#FFF0EB]"
                                        >
                                          Pay / Settle
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedItem(item);
                                            setActionType("reject");
                                          }}
                                          className="h-6 px-1.5 text-[9px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                                        >
                                          Reject
                                        </Button>
                                      </div>
                                    ) : (
                                      <span className="text-[9.5px] text-emerald-600 font-semibold italic">
                                        ✓ Reconciled
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ── FLAT TABLE VIEW FOR ALL LIABILITIES / SPECIFIC CATEGORIES ── */
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredFlatItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-[200px]">
                <Building2 className="w-8 h-8 text-slate-300 mb-2" />
                <h4 className="text-[11.5px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">
                  No Outgoing Liabilities
                </h4>
                <p className="text-[10px] text-[#74839A] mt-1">
                  All operational vendor payouts are settled.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-[#E3EAF2] text-[9.5px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Vendor / Payee</th>
                    <th className="px-4 py-2.5">Trip / Route</th>
                    <th className="px-4 py-2.5 text-right">Agreed Cost</th>
                    <th className="px-4 py-2.5 text-right">Paid</th>
                    <th className="px-4 py-2.5 text-right">Due Balance</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EAF2] text-[11px] font-semibold text-[#162B45]">
                  {filteredFlatItems.map((item) => {
                    const isPaid = item.status === "Paid" || item.approvalStatus === "APPROVED_FOUNDER";
                    const isFCReviewed = item.approvalStatus === "REVIEWED_FINANCE_CONTROLLER";

                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFD] transition-colors h-[44px]">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            {getCategoryIcon(item.category)}
                            <span className="font-bold text-[10px] text-slate-700 uppercase tracking-tight">
                              {item.categoryLabel || item.category}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 font-bold text-[#162B45]">
                          {item.vendorName}
                        </td>
                        <td className="px-4 py-2 text-slate-600 font-medium">
                          <span className="font-mono text-[#FF5A1F] font-bold mr-1">{item.tripCode}</span>
                          {item.tripTitle}
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">
                          ₹{Math.round(item.agreedAmount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-medium text-emerald-600">
                          ₹{Math.round(item.advancePaid || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-red-600 text-[12px]">
                          ₹{Math.round(item.remainingPayable || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold uppercase",
                              isPaid
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isFCReviewed
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : item.status === "Rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {isPaid
                              ? "Paid / Settled"
                              : isFCReviewed
                              ? "FC Reviewed (Awaiting Founder)"
                              : item.status || "Pending Approval"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right pr-4">
                          {!isPaid ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setActionType("approve");
                                }}
                                className={cn(
                                  "h-6.5 text-[9.5px] font-bold text-white shadow-none",
                                  isSuperuserFounder
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-blue-600 hover:bg-blue-700"
                                )}
                              >
                                {isSuperuserFounder ? "👑 Founder Approve" : "FC Review"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setActionType("pay");
                                }}
                                className="h-6.5 text-[9.5px] font-bold text-[#FF5A1F] border-[#FFD9CC] hover:bg-[#FFF0EB]"
                              >
                                Pay / Settle
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setActionType("reject");
                                }}
                                className="h-6.5 text-[9.5px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-semibold italic">
                              ✓ Reconciled
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
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          APPROVE / PAY / REJECT VENDOR PAYOUT MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(actionType)} onOpenChange={() => setActionType(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF5A1F]" />
              {actionType === "approve"
                ? isSuperuserFounder
                  ? "👑 Founder Sign-Off & Approval"
                  : "Finance Controller Review"
                : actionType === "pay"
                ? "Disburse Vendor Payout"
                : "Reject Vendor Payout"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {actionType === "approve"
                ? isSuperuserFounder
                  ? "Final Founder sign-off. Approving will authorize the release of funds to this vendor partner."
                  : "Confirm and review the contracted invoice tariff before passing to Founder for disbursement."
                : actionType === "pay"
                ? "Record the bank transfer or cash disbursement voucher for this vendor."
                : "Provide a reason for rejecting this vendor invoice."}
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
                  <span className="font-medium text-slate-800">{selectedItem.tripTitle || selectedItem.tripCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-slate-800">{selectedItem.categoryLabel || selectedItem.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Agreed Cost:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{Math.round(selectedItem.agreedAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Balance:</span>
                  <span className="font-mono font-bold text-red-600 text-sm">
                    ₹{Math.round(selectedItem.remainingPayable || selectedItem.dueAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {actionType === "pay" && (
                <>
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
                </>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  {actionType === "reject" ? "Rejection Reason (Required)" : "Notes (Optional)"}
                </label>
                <Input
                  placeholder={
                    actionType === "reject"
                      ? "e.g. Invoice discrepancy with contracted transport rate sheet"
                      : "e.g. Verified against hotel check-in manifest"
                  }
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
              onClick={() => setActionType(null)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleAction}
              className={cn(
                "h-8 text-xs font-bold text-white shadow-none",
                actionType === "reject"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : actionType === "pay"
                  ? "bg-[#FF5A1F] hover:bg-[#E84712]"
                  : isSuperuserFounder
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {actionType === "reject"
                ? "Confirm Rejection"
                : actionType === "pay"
                ? "Confirm Disbursement"
                : isSuperuserFounder
                ? "Confirm Founder Approved"
                : "Confirm FC Verified"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
