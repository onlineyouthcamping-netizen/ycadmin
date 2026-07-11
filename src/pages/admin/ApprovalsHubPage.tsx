import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ClipboardCheck, ShieldCheck, Ticket, CreditCard, Building2,
  RefreshCw, FileText, ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission } from "@/lib/permissions";
import VerificationQueuePage from "./VerificationQueuePage";
import TicketApprovalsPage from "./TicketApprovalsPage";

type ApprovalTab = "booking-verification" | "ticket-approvals" | "payment-approvals" | "vendor-bills" | "refund-requests" | "expense-claims";

const TABS: { key: ApprovalTab; label: string; icon: any; description: string }[] = [
  { key: "booking-verification", label: "Booking Verification", icon: ShieldCheck, description: "Verify booking details and documents" },
  { key: "ticket-approvals", label: "Ticket Approvals", icon: Ticket, description: "Review generated tickets before issuing" },
  { key: "payment-approvals", label: "Payment Approvals", icon: CreditCard, description: "Approve pending customer payments" },
  { key: "vendor-bills", label: "Vendor Bills", icon: Building2, description: "Review and approve vendor invoices" },
  { key: "refund-requests", label: "Refund Requests", icon: RefreshCw, description: "Process customer refund requests" },
  { key: "expense-claims", label: "Expense Claims", icon: FileText, description: "Approve employee expense claims" },
];

export default function ApprovalsHubPage() {
  const { admin } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as ApprovalTab;
  const [activeTab, setActiveTab] = useState<ApprovalTab>("booking-verification");

  useEffect(() => {
    if (tabParam && TABS.some(t => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (key: ApprovalTab) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  return (
    <div className="space-y-4 font-sans antialiased text-[#162B45] select-none p-4 bg-[#F4F7FB] min-h-screen -mx-6 -mt-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2] bg-transparent">
        <div className="space-y-0.5">
          <h1 className="text-[22px] font-[600] text-[#162B45] tracking-tight leading-none flex items-center gap-2">
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
          const isDisabled = !["booking-verification", "ticket-approvals"].includes(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => !isDisabled && handleTabChange(tab.key)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border",
                isActive
                  ? "bg-white text-[#F97316] border-[#F97316] shadow-sm"
                  : isDisabled
                    ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive && "text-[#F97316]")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[400px]">
        {activeTab === "booking-verification" && <VerificationQueuePage />}
        {activeTab === "ticket-approvals" && <TicketApprovalsPage />}
        {!["booking-verification", "ticket-approvals"].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <ClipboardCheck className="w-10 h-10 mb-3 text-slate-300" />
            <p className="text-sm font-semibold">Coming Soon</p>
            <p className="text-[11px] text-slate-400 mt-1">This approval module is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
}
