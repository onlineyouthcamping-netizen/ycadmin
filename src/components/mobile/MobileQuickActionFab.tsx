import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  X,
  Ticket,
  UserPlus,
  FileText,
  CreditCard,
  DollarSign,
  MessageSquare,
  Phone,
  Search,
  QrCode,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileQuickActionFabProps {
  onOpenNewBooking: () => void;
  onOpenGlobalSearch: () => void;
}

export const MobileQuickActionFab: React.FC<MobileQuickActionFabProps> = ({
  onOpenNewBooking,
  onOpenGlobalSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      id: "booking",
      label: "New Booking",
      desc: "Record customer reservation",
      icon: Ticket,
      color: "bg-orange-50 text-[#FF5400] border-orange-100",
      onClick: () => {
        setIsOpen(false);
        onOpenNewBooking();
      },
    },
    {
      id: "lead",
      label: "New Lead",
      desc: "Add prospective inquiry",
      icon: UserPlus,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      onClick: () => {
        setIsOpen(false);
        navigate("/admin/inquiries?action=new");
      },
    },
    {
      id: "quotation",
      label: "Create Quotation",
      desc: "Generate trip itinerary PDF",
      icon: FileText,
      color: "bg-purple-50 text-purple-600 border-purple-100",
      onClick: () => {
        setIsOpen(false);
        navigate("/admin/quotations/new");
      },
    },
    {
      id: "payment",
      label: "Collect Payment",
      desc: "Record UPI / Cash collection",
      icon: CreditCard,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      onClick: () => {
        setIsOpen(false);
        navigate("/admin/bookings?action=collect");
      },
    },
    {
      id: "expense",
      label: "Add Expense",
      desc: "Log station or trip cost",
      icon: DollarSign,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      onClick: () => {
        setIsOpen(false);
        navigate("/admin/accounting?action=expense");
      },
    },
    {
      id: "search",
      label: "Search Anything",
      desc: "Instant booking or phone lookup",
      icon: Search,
      color: "bg-slate-50 text-slate-700 border-slate-200",
      onClick: () => {
        setIsOpen(false);
        onOpenGlobalSearch();
      },
    },
  ];

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-16 right-4 z-40 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-13 h-13 rounded-full bg-[#FF5400] text-white shadow-lg shadow-orange-500/30 flex items-center justify-center active:scale-90 transition-all border-2 border-white"
          aria-label="Quick Actions Menu"
        >
          <Plus className="w-6 h-6 stroke-[2.5px]" />
        </button>
      </div>

      {/* Quick Action Bottom Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-4 bg-white max-h-[85vh]"
        >
          <SheetHeader className="pb-3 border-b border-slate-100 text-left">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-base font-bold text-slate-900">
                  Quick Actions
                </SheetTitle>
                <p className="text-xs text-slate-500">
                  1-tap operational shortcuts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-2.5 py-4 overflow-y-auto max-h-[60vh]">
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={act.onClick}
                  className="flex flex-col text-left p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-2xs active:scale-98 transition-all"
                >
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-2.5 ${act.color}`}
                  >
                    <Icon className="w-4 h-4 stroke-[2px]" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {act.label}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    {act.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileQuickActionFab;
