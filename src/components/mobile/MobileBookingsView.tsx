import React, { useState } from "react";
import { Phone, MessageSquare, CreditCard, Share2, Edit2, Search, Filter, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingItem {
  id: string;
  bookingId: string;
  customerName: string;
  phone: string;
  tripName: string;
  departureDate: string;
  totalPrice: number;
  paidAmount: number;
  balance: number;
  status: "CONFIRMED" | "PENDING" | "CANCELLED";
}

interface MobileBookingsViewProps {
  bookings?: BookingItem[];
  onSelectBooking?: (booking: BookingItem) => void;
  onCollectPayment?: (booking: BookingItem) => void;
}

export const MobileBookingsView: React.FC<MobileBookingsViewProps> = ({
  bookings = [],
  onSelectBooking,
  onCollectPayment,
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");

  const sampleBookings: BookingItem[] = [
    { id: "1", bookingId: "BK-2026-948", customerName: "Rahul Verma", phone: "+91 9876543210", tripName: "Manali Backpacking", departureDate: "05 Aug 2026", totalPrice: 12999, paidAmount: 8000, balance: 4999, status: "CONFIRMED" },
    { id: "2", bookingId: "BK-2026-949", customerName: "Priya Sharma", phone: "+91 9812345678", tripName: "Kerala Road Trip", departureDate: "12 Aug 2026", totalPrice: 19999, paidAmount: 19999, balance: 0, status: "CONFIRMED" },
    { id: "3", bookingId: "BK-2026-950", customerName: "Vikas Patel", phone: "+91 9765432109", tripName: "Spiti Valley Expedition", departureDate: "18 Aug 2026", totalPrice: 22000, paidAmount: 5000, balance: 17000, status: "PENDING" },
  ];

  const list = bookings.length > 0 ? bookings : sampleBookings;

  const filtered = list.filter((b) => {
    const matchesSearch =
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.bookingId.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search);

    if (filter === "pending") return matchesSearch && b.balance > 0;
    if (filter === "confirmed") return matchesSearch && b.balance === 0;
    return matchesSearch;
  });

  return (
    <div className="space-y-3 pb-20">
      {/* Mobile Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking ID, customer or phone..."
            className="w-full h-11 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#FF5400] font-semibold text-slate-800 shadow-2xs"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="h-11 text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 text-slate-700 outline-none shadow-2xs cursor-pointer"
        >
          <option value="all">All</option>
          <option value="pending">Due Balance</option>
          <option value="confirmed">Fully Paid</option>
        </select>
      </div>

      {/* Bookings Card List */}
      <div className="space-y-3">
        {filtered.map((b) => (
          <div
            key={b.id}
            onClick={() => onSelectBooking?.(b)}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3 active:bg-slate-50 transition-all cursor-pointer"
          >
            {/* Header: Customer Name & Status */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.bookingId}</span>
                <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{b.customerName}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{b.tripName} • {b.departureDate}</p>
              </div>

              <div className="text-right">
                <span
                  className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider block mb-1",
                    b.balance === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}
                >
                  {b.balance === 0 ? "FULLY PAID" : `DUE ₹${b.balance.toLocaleString()}`}
                </span>
                <span className="text-[11px] font-extrabold text-slate-900 block">₹{b.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Quick 1-Thumb Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${b.phone}`}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all"
                  aria-label="Call Customer"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${b.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center active:scale-95 transition-all"
                  aria-label="WhatsApp Customer"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                {b.balance > 0 && (
                  <button
                    type="button"
                    onClick={() => onCollectPayment?.(b)}
                    className="h-9 px-3.5 rounded-xl bg-[#FF5400] text-white hover:bg-[#e04a00] text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Collect ₹{b.balance}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectBooking?.(b)}
                  className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center active:scale-95 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileBookingsView;
