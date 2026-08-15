import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ClipboardCheck,
  ShieldCheck,
  Train,
  CreditCard,
  Building2,
  RefreshCw,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { bookingVerificationService } from "@/services/bookingVerification.service";
import VerificationQueuePage from "./VerificationQueuePage";
import FinanceControlCenterPage from "./FinanceControlCenterPage";

type ApprovalTab =
  | "booking-verification"
  | "train-verification"
  | "payment-approvals"
  | "vendor-bills"
  | "refund-requests"
  | "expense-claims";

const TABS: {
  key: ApprovalTab;
  label: string;
  icon: any;
  description: string;
}[] = [
  {
    key: "booking-verification",
    label: "Booking Verification",
    icon: ShieldCheck,
    description: "Verify booking details, customer documents & manifests",
  },
  {
    key: "train-verification",
    label: "Train Ticket Approvals",
    icon: Train,
    description: "Review and approve PNRs, berths and train tickets",
  },
  {
    key: "payment-approvals",
    label: "Payment Approvals",
    icon: CreditCard,
    description: "Approve pending customer payments and advances",
  },
  {
    key: "vendor-bills",
    label: "Vendor Bills",
    icon: Building2,
    description: "Review and approve vendor invoices & liabilities",
  },
  {
    key: "refund-requests",
    label: "Refund Requests",
    icon: RefreshCw,
    description: "Process customer cancellation refunds",
  },
  {
    key: "expense-claims",
    label: "Expense Claims",
    icon: FileText,
    description: "Approve operational and team expense claims",
  },
];

export default function ApprovalsHubPage() {
  const { admin } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as ApprovalTab;
  const activeTab: ApprovalTab =
    tabParam && TABS.some((t) => t.key === tabParam)
      ? tabParam
      : "booking-verification";

  const [bookingPendingCount, setBookingPendingCount] = useState<number>(0);
  const [trainPendingCount, setTrainPendingCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [verifRes, trainRes] = await Promise.all([
          bookingVerificationService.getVerificationQueue({ page: 1, limit: 1 }).catch(() => ({ total: 0 })),
          bookingVerificationService.getTrainTicketVerificationQueue({ page: 1, limit: 1 }).catch(() => ({ total: 0 })),
        ]);
        setBookingPendingCount(verifRes?.total || 0);
        setTrainPendingCount(trainRes?.total || 0);
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
    if (key === "booking-verification") return bookingPendingCount;
    if (key === "train-verification") return trainPendingCount;
    return 0;
  };

  return (
    <div className="space-y-4 font-sans antialiased text-[#162B45] select-none p-4 bg-[#F4F7FB] min-h-screen -mx-6 -mt-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2] bg-transparent">
        <div className="space-y-0.5">
          <h1 className="text-[22px] font-[600] text-[#162B45] tracking-tight leading-none flex items-center gap-2 font-montserrat">
            <ClipboardCheck className="w-5 h-5 text-[#F97316]" />
            Approval Center
          </h1>
          <p className="text-[#74839A] text-[12px] font-[500] leading-none">
            Review and approve pending requests across all modules.
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
                  ? "bg-white text-[#F97316] border-[#F97316] shadow-sm ring-1 ring-orange-200/50"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900",
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-[#F97316]" : "text-slate-400")} />
              <span>{tab.label}</span>
              {badgeCount > 0 && (
                <span
                  className={cn(
                    "text-[9.5px] font-black px-1.5 py-0.2 rounded-full",
                    isActive
                      ? "bg-orange-100 text-[#F97316]"
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
        {activeTab === "booking-verification" && (
          <VerificationQueuePage defaultQueue="booking" hideHeader={true} hideSideNav={true} />
        )}
        {activeTab === "train-verification" && (
          <VerificationQueuePage defaultQueue="train" hideHeader={true} hideSideNav={true} />
        )}
        {["payment-approvals", "vendor-bills", "refund-requests", "expense-claims"].includes(activeTab) && (
          <FinanceControlCenterPage embedded />
        )}
      </div>
    </div>
  );
}
