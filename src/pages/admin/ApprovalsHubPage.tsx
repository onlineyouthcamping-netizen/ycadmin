import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ClipboardCheck,
  ShieldCheck,
  Train,
  CreditCard,
  Building2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { bookingVerificationService } from "@/services/bookingVerification.service";
import { financeControllerService } from "@/services/financeController.service";
import VerificationQueuePage from "./VerificationQueuePage";
import IncomingPaymentsApprovalPage from "./IncomingPaymentsApprovalPage";
import OutgoingPaymentsApprovalPage from "./OutgoingPaymentsApprovalPage";
import RefundRequestsPage from "./RefundRequestsPage";

export type ApprovalTab =
  | "train-verification"
  | "booking-verification"
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
    key: "train-verification",
    label: "1. Train Ticket Approvals",
    icon: Train,
    description: "Review and verify train tickets, PNRs, berths and ticket allowances",
  },
  {
    key: "booking-verification",
    label: "2. Document & Booking Verification",
    icon: ShieldCheck,
    description: "Verify passenger documents, ID proofs, medical & traveler manifests",
  },
  {
    key: "payment-approvals",
    label: "3. Incoming Payments",
    icon: CreditCard,
    description: "Approve customer online collections, bank transfers and cash submissions",
  },
  {
    key: "vendor-bills",
    label: "4. Outgoing Vendor Payments",
    icon: Building2,
    description: "Verify payouts for Hotels, Transport, Activities, Guides & Ticketing balance",
  },
  {
    key: "refund-requests",
    label: "5. Refund Requests & Credits",
    icon: RefreshCw,
    description: "Review customer cancellation refunds and store credit notes",
  },
];

export default function ApprovalsHubPage() {
  const { admin } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as ApprovalTab;
  const activeTab: ApprovalTab =
    tabParam && TABS.some((t) => t.key === tabParam)
      ? tabParam
      : "train-verification";

  const [bookingPendingCount, setBookingPendingCount] = useState<number>(0);
  const [trainPendingCount, setTrainPendingCount] = useState<number>(0);
  const [incomingPendingCount, setIncomingPendingCount] = useState<number>(0);
  const [vendorPendingCount, setVendorPendingCount] = useState<number>(0);
  const [refundPendingCount, setRefundPendingCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [verifRes, trainRes, incRes, cashRes, vendorRes, refundRes] = await Promise.all([
          bookingVerificationService.getVerificationQueue({ page: 1, limit: 1 }).catch(() => ({ total: 0 })),
          bookingVerificationService.getTrainTicketVerificationQueue({ page: 1, limit: 1 }).catch(() => ({ total: 0 })),
          financeControllerService.getIncomingQueue({ status: "PENDING_VERIFICATION", limit: 1 }).catch(() => ({ data: [] })),
          financeControllerService.getCashQueue({ status: "PENDING_HANDOVER", limit: 1 }).catch(() => ({ data: [] })),
          financeControllerService.getVendorQueue({ limit: 1 }).catch(() => ({ data: [] })),
          financeControllerService.refunds.list({ status: "PENDING_APPROVAL", limit: 1 }).catch(() => ({ data: [] })),
        ]);
        setBookingPendingCount(verifRes?.total || 0);
        setTrainPendingCount(trainRes?.total || 0);
        setIncomingPendingCount((incRes?.data?.length || 0) + (cashRes?.data?.length || 0));
        setVendorPendingCount(vendorRes?.data?.length || 0);
        setRefundPendingCount(refundRes?.data?.length || 0);
      } catch (err) {
        // silent fail
      }
    };
    fetchCounts();
  }, []);

  const handleTabChange = (key: ApprovalTab) => {
    setSearchParams({ tab: key });
  };

  const getBadgeCount = (key: ApprovalTab) => {
    if (key === "train-verification") return trainPendingCount;
    if (key === "booking-verification") return bookingPendingCount;
    if (key === "payment-approvals") return incomingPendingCount;
    if (key === "vendor-bills") return vendorPendingCount;
    if (key === "refund-requests") return refundPendingCount;
    return 0;
  };

  return (
    <div className="space-y-4 font-sans antialiased text-[#0B1528] p-1 bg-transparent min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2] bg-transparent">
        <div className="space-y-0.5">
          <h1 className="text-[22px] font-[600] text-[#162B45] tracking-tight leading-none flex items-center gap-2 font-montserrat">
            <ClipboardCheck className="w-5 h-5 text-[#FF4D00]" />
            Approval Center
          </h1>
          <p className="text-[#74839A] text-[12px] font-[500] leading-none">
            Review and approve pending requests across all operational modules.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const badgeCount = getBadgeCount(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[11.5px] font-bold whitespace-nowrap transition-all border shadow-2xs",
                isActive
                  ? "bg-white text-[#FF4D00] border-[#FF4D00] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900",
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-[#FF4D00]" : "text-slate-400")} />
              <span>{tab.label}</span>
              {badgeCount > 0 && (
                <span
                  className={cn(
                    "text-[9.5px] font-black px-1.5 py-0.2 rounded-full",
                    isActive
                      ? "bg-orange-100 text-[#FF4D00]"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 min-h-[500px]">
        {activeTab === "train-verification" && (
          <VerificationQueuePage defaultQueue="train" hideHeader={true} hideSideNav={true} />
        )}
        {activeTab === "booking-verification" && (
          <VerificationQueuePage defaultQueue="booking" hideHeader={true} hideSideNav={true} />
        )}
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
    </div>
  );
}
