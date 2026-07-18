import { Search, RotateCw, Filter, FileDown, Link2, HelpCircle, Wallet, Ticket, ShieldAlert, Compass, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BookingsToolbarProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  quickFilter: string;
  setQuickFilter: (val: string) => void;
  showSidebar: boolean;
  setShowSidebar: (val: boolean) => void;
  fetchAll: () => void;
  handleExportCSV: () => void;
  setShowTrips: (val: boolean) => void;
}

export function BookingsToolbar({
  searchInput,
  setSearchInput,
  quickFilter,
  setQuickFilter,
  showSidebar,
  setShowSidebar,
  fetchAll,
  handleExportCSV,
  setShowTrips
}: BookingsToolbarProps) {
  const chips = [
    { label: 'Needs Attention', value: 'needs_attention', count: 4, icon: HelpCircle },
    { label: 'Payment Pending', value: 'payment_pending', count: 6, icon: Wallet },
    { label: 'Ticket Pending', value: 'ticket_pending', count: 3, icon: Ticket },
    { label: 'Operations Pending', value: 'ops_pending', count: 2, icon: ShieldAlert },
    { label: 'Today\'s Departure', value: 'today_departure', count: 1, icon: Compass },
    { label: 'Refund Approval', value: 'refund_approval', count: 0, icon: AlertCircle },
    { label: 'Completed', value: 'completed_bookings', count: 18, icon: CheckCircle2 }
  ];

  return (
    <div className="flex flex-col shrink-0">
      {/* MAIN TOOLBAR */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-6 h-14 font-sans shadow-xs">
        <div className="flex items-center gap-4 flex-1">
          <div className="font-extrabold text-slate-800 text-sm tracking-tight hidden md:block">Bookings</div>
          <div className="flex-1 max-w-[320px] relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input 
              type="text" 
              className="w-full h-8 pl-8 pr-3 bg-[#F8FAFC] hover:bg-slate-100/30 focus:bg-white border-slate-200 rounded-[6px] text-xs outline-none transition-colors" 
              placeholder="Search bookings..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-[6px] border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer" onClick={fetchAll} title="Refresh">
            <RotateCw className="w-4 h-4" />
          </button>
          <button 
            className={cn(
              "w-8 h-8 rounded-[6px] border flex items-center justify-center transition-colors cursor-pointer", 
              showSidebar ? "bg-[#FF6B00]/10 border-[#FF6B00]/20 text-[#FF6B00]" : "border-slate-200 hover:bg-slate-50 text-slate-600"
            )} 
            onClick={() => setShowSidebar(!showSidebar)} 
            title="Toggle Sidebar Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-[6px] border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer" onClick={handleExportCSV} title="Export CSV">
            <FileDown className="w-4 h-4" />
          </button>
          <button className="hidden sm:flex h-8 px-3.5 border border-slate-200 hover:bg-slate-50 rounded-[6px] text-xs text-slate-700 font-semibold items-center gap-1.5 transition-colors cursor-pointer bg-white" onClick={() => setShowTrips(true)} title="Trip Manager">
            <Link2 className="w-3.5 h-3.5" /> Trips
          </button>
        </div>
      </div>

      {/* ACTION CHIPS BAR */}
      <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex-shrink-0 no-scrollbar">
        {chips.map(chip => {
          const isActive = quickFilter === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => setQuickFilter(isActive ? 'confirmed_bookings' : chip.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-xs transition-colors whitespace-nowrap",
                isActive 
                  ? "bg-[#0F172A] border-[#0F172A] text-white" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <chip.icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-500")} />
              <span>{chip.label}</span>
              <span className={cn(
                "px-1.5 rounded-full text-[9px]",
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
