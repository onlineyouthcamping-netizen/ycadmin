import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CreditCard,
  Building2,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { financeControllerService } from "@/services/financeController.service";
import { financeApprovalsService } from "@/services/financeApprovals.service";
import IncomingPaymentsApprovalPage from "./IncomingPaymentsApprovalPage";
import OutgoingPaymentsApprovalPage from "./OutgoingPaymentsApprovalPage";
import RefundRequestsPage from "./RefundRequestsPage";

export type ApprovalTab =
  | "payment-approvals"
  | "vendor-bills"
  | "refund-requests";

const TABS: {
  key: ApprovalTab;
  label: string;
  icon: any;
  description: string;
}[] = [
  {
    key: "payment-approvals",
    label: "1. Incoming Payments",
    icon: CreditCard,
    description:
      "Approve customer online collections, bank transfers and cash submissions",
  },
  {
    key: "vendor-bills",
    label: "2. Outgoing Vendor Payments",
    icon: Building2,
    description:
      "Verify payouts for Hotels, Transport, Activities, Guides & ops balance",
  },
  {
    key: "refund-requests",
    label: "3. Refund Requests & Credits",
    icon: RefreshCw,
    description: "Review customer cancellation refunds and store credit notes",
  },
];

export default function ApprovalsHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as ApprovalTab | string | null;
  const activeTab: ApprovalTab =
    tabParam && TABS.some((t) => t.key === tabParam)
      ? (tabParam as ApprovalTab)
      : "payment-approvals";

  const [incomingPendingCount, setIncomingPendingCount] = useState<number>(0);
  const [vendorPendingCount, setVendorPendingCount] = useState<number>(0);
  const [refundPendingCount, setRefundPendingCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [pendingApprovalsRes, refundRes] = await Promise.all([
          financeApprovalsService
            .getPendingApprovals()
            .catch(() => ({ pendingApprovals: { breakdown: { collectionsPendingFC: 0, collectionsAwaitingFounder: 0, vendorPendingFC: 0, vendorAwaitingFounder: 0 } } })),
          financeControllerService.refunds
            .list({ status: "PENDING_APPROVAL", limit: 1 })
            .catch(() => ({ data: [] })),
        ]);

        const breakdown = pendingApprovalsRes?.pendingApprovals?.breakdown;
        if (breakdown) {
          setIncomingPendingCount(
            (breakdown.collectionsPendingFC || 0) + (breakdown.collectionsAwaitingFounder || 0)
          );
          setVendorPendingCount(
            (breakdown.vendorPendingFC || 0) + (breakdown.vendorAwaitingFounder || 0)
          );
        }
        setRefundPendingCount(refundRes?.data?.length || 0);
      } catch {
        // silent fail
      }
    };
    fetchCounts();
  }, []);

  const handleTabChange = (key: ApprovalTab) => {
    setSearchParams({ tab: key });
  };

  const getBadgeCount = (key: ApprovalTab) => {
    if (key === "payment-approvals") return incomingPendingCount;
    if (key === "vendor-bills") return vendorPendingCount;
    if (key === "refund-requests") return refundPendingCount;
    return 0;
  };

  const activeConfig = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];
  const totalOpen =
    incomingPendingCount + vendorPendingCount + refundPendingCount;

  return (
    <div className="min-h-0 space-y-3 font-sans text-[#13283F] antialiased">
      <section className="relative overflow-hidden rounded-2xl bg-[#10263D] px-4 py-4 text-white shadow-[0_12px_32px_rgba(16,38,61,0.16)] md:px-6 md:py-5">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 h-52 w-52 rounded-full border-[28px] border-white/[0.04]"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF5A1F] shadow-[0_6px_16px_rgba(255,90,31,0.35)]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-300">
                Finance control desk
              </span>
            </div>
            <h1 className="text-[22px] font-bold tracking-[-0.03em] md:text-[26px]">
              Approvals
            </h1>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-300 md:text-[13px]">
              Review money moving into and out of YouthCamping.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-3.5 py-2.5 backdrop-blur-sm">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Open actions
              </div>
              <div className="mt-0.5 text-xl font-bold tabular-nums">
                {totalOpen}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-[10px] leading-4 text-slate-300">
              Across all
              <br />
              finance queues
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Approval queues"
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const badgeCount = getBadgeCount(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "group flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F]/40",
                isActive
                  ? "border-[#FF5A1F]/40 bg-white shadow-[0_8px_24px_rgba(15,35,55,0.08)]"
                  : "border-[#DCE5ED] bg-white/65 hover:border-[#B7C7D6] hover:bg-white",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  isActive
                    ? "bg-[#FFF0EA] text-[#E84712]"
                    : "bg-[#EDF3F7] text-[#6B8195]",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-[12px] font-bold",
                    isActive ? "text-[#13283F]" : "text-[#526A7F]",
                  )}
                >
                  {tab.label.replace(/^\d+\.\s*/, "")}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-[#8293A3]">
                  {badgeCount ? `${badgeCount} need review` : "Queue clear"}
                </span>
              </span>
              <ArrowRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform",
                  isActive
                    ? "translate-x-0 text-[#FF5A1F]"
                    : "-translate-x-1 text-slate-300 group-hover:translate-x-0",
                )}
              />
            </button>
          );
        })}
      </nav>

      <section className="overflow-hidden rounded-2xl border border-[#DCE5ED] bg-white shadow-[0_6px_22px_rgba(15,35,55,0.06)]">
        <header className="flex flex-col gap-2 border-b border-[#E5ECF2] px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#FF5A1F]">
              Active queue
            </div>
            <h2 className="mt-0.5 text-[15px] font-bold tracking-[-0.01em] text-[#13283F]">
              {activeConfig.label.replace(/^\d+\.\s*/, "")}
            </h2>
          </div>
          <p className="max-w-lg text-[11px] leading-4 text-[#718598]">
            {activeConfig.description}
          </p>
        </header>
        <div className="p-3 md:p-4">
        {activeTab === "payment-approvals" && (
          <IncomingPaymentsApprovalPage hideHeader={true} />
        )}
        {activeTab === "vendor-bills" && (
          <OutgoingPaymentsApprovalPage hideHeader={true} />
        )}
        {activeTab === "refund-requests" && (
          <RefundRequestsPage hideHeader={true} />
        )}
        </div>
      </section>
    </div>
  );
}
