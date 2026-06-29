import React, { useState } from "react";
import { ClipboardCheck, Train } from "lucide-react";
import VerificationQueuePage from "./VerificationQueuePage";
import TicketApprovalsPage from "./TicketApprovalsPage";

type TabId = "bookings" | "tickets";

export default function ApprovalsHubPage() {
  const [activeTab, setActiveTab] = useState<TabId>("bookings");

  const menuItems = [
    { id: "bookings", label: "Booking Verification", icon: ClipboardCheck },
    { id: "tickets", label: "Train Ticket Approvals", icon: Train }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-100">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Verification & <span className="text-primary">Approvals</span></h1>
          <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">Review and verify booking documents, payments, and train tickets</p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Secondary Vertical Menu (Scroll Tabs on Mobile) */}
        <div className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar pb-3 lg:pb-0 gap-1 bg-slate-50/50 p-2 rounded-2xl border border-slate-100 lg:sticky lg:top-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabId)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-white text-primary border-l-[3.5px] border-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary animate-pulse" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Main Content Panel */}
        <div className="lg:col-span-9 animate-fade-in">
          {activeTab === "bookings" && <VerificationQueuePage />}
          {activeTab === "tickets" && <TicketApprovalsPage />}
        </div>
      </div>
    </div>
  );
}
