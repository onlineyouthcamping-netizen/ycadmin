import React, { useState, useMemo, useEffect } from "react";
import {
  Ticket,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserCheck,
  Edit2,
  Copy,
  Download,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isPassengerCancelled } from "@/utils/departure/passengerStatus";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DepartureTicketingProps {
  tripId: string;
  departureDateStr: string;
  tripDetails: any;
  allPassengers?: any[];
}

export type TrainTicketStatus =
  | "CONFIRMED"
  | "RAC"
  | "WAITLISTED"
  | "PENDING"
  | "SELF_BOOKED";

export interface PassengerTicketInfo {
  id: string;
  bookingRef: string;
  passengerName: string;
  gender: string;
  age: number;
  phone: string;
  trainRoute: string;
  pnrNumber: string;
  trainNumber: string;
  trainName: string;
  coach: string;
  seatBerth: string;
  status: TrainTicketStatus;
  notes: string;
}

export default function DepartureTicketing({
  tripId,
  departureDateStr,
  tripDetails,
  allPassengers = [],
}: DepartureTicketingProps) {
  // State for passenger tickets
  const [ticketsMap, setTicketsMap] = useState<Record<string, PassengerTicketInfo>>({});
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<PassengerTicketInfo | null>(null);
  const [formState, setFormState] = useState<Partial<PassengerTicketInfo>>({});

  // Initialize ticket manifest from authentic allPassengers data
  useEffect(() => {
    if (allPassengers && allPassengers.length > 0) {
      setTicketsMap((prev) => {
        const next = { ...prev };
        allPassengers.forEach((p, idx) => {
          if (isPassengerCancelled(p)) return;
          const key = p.id || `pax-${idx}-${p.name}`;
          const existing = prev[key];

          const rawOpt =
            p.trainOption ||
            p.trainClass ||
            p.rawPassenger?.trainOption ||
            p.rawPassenger?.trainClass ||
            "3 TIER AC TRAIN";

          const realPnr = existing?.pnrNumber || p.pnr || p.pnrNumber || p.rawPassenger?.pnr || "";
          const rawStatus = (
            existing?.status ||
            p.ticketStatus ||
            p.rawPassenger?.ticketStatus ||
            ""
          )
            .toUpperCase()
            .replace(/\s+/g, "_");

          let realStatus: TrainTicketStatus = "PENDING";
          if (rawStatus.includes("CONFIRM") || rawStatus.includes("ISSUED")) {
            realStatus = "CONFIRMED";
          } else if (rawStatus.includes("RAC")) {
            realStatus = "RAC";
          } else if (rawStatus.includes("WAIT")) {
            realStatus = "WAITLISTED";
          } else if (rawStatus.includes("SELF")) {
            realStatus = "SELF_BOOKED";
          }

          next[key] = {
            id: key,
            bookingRef: p.bookingRef || "—",
            passengerName: p.name || "Passenger",
            gender: p.gender || "—",
            age: p.age || 0,
            phone: p.phone || "—",
            trainRoute: rawOpt,
            pnrNumber: realPnr,
            trainNumber: existing?.trainNumber || p.trainNumber || "",
            trainName: existing?.trainName || p.trainName || rawOpt,
            coach: existing?.coach || p.coach || "",
            seatBerth: existing?.seatBerth || p.seat || p.seatBerth || "",
            status: realStatus,
            notes: existing?.notes || p.notes || "",
          };
        });
        return next;
      });
    }
  }, [allPassengers, tripDetails]);

  // Derived ticket list
  const ticketList = useMemo(() => {
    return Object.values(ticketsMap);
  }, [ticketsMap]);

  // Filtered ticket list
  const filteredTickets = useMemo(() => {
    return ticketList.filter((t) => {
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.passengerName.toLowerCase().includes(q) ||
        t.bookingRef.toLowerCase().includes(q) ||
        t.pnrNumber.toLowerCase().includes(q) ||
        t.trainName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [ticketList, statusFilter, search]);

  // Summary KPIs
  const kpiStats = useMemo(() => {
    const total = ticketList.length;
    const confirmed = ticketList.filter((t) => t.status === "CONFIRMED").length;
    const rac = ticketList.filter((t) => t.status === "RAC" || t.status === "WAITLISTED").length;
    const pending = ticketList.filter((t) => t.status === "PENDING").length;
    const selfBooked = ticketList.filter((t) => t.status === "SELF_BOOKED").length;

    return { total, confirmed, rac, pending, selfBooked };
  }, [ticketList]);

  // Update Status for single passenger
  const handleStatusChange = (id: string, newStatus: TrainTicketStatus) => {
    setTicketsMap((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          status: newStatus,
        },
      };
    });
    toast.success(`Ticket status updated to ${newStatus.replace("_", " ")}`);
  };

  // Open Edit Modal
  const handleOpenEdit = (t: PassengerTicketInfo) => {
    setSelectedTicket(t);
    setFormState({ ...t });
    setEditModalOpen(true);
  };

  // Save Modal Form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setTicketsMap((prev) => ({
      ...prev,
      [selectedTicket.id]: {
        ...selectedTicket,
        ...formState,
      } as PassengerTicketInfo,
    }));

    toast.success(`Ticket details updated for ${selectedTicket.passengerName}`);
    setEditModalOpen(false);
  };

  // Copy PNR to Clipboard
  const handleCopyPNR = (pnr: string) => {
    if (!pnr) return;
    navigator.clipboard.writeText(pnr);
    toast.success(`PNR ${pnr} copied to clipboard`);
  };

  // Bulk update all pending to confirmed
  const handleBulkConfirm = () => {
    setTicketsMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key].status === "PENDING" || next[key].status === "RAC") {
          next[key] = { ...next[key], status: "CONFIRMED" };
        }
      });
      return next;
    });
    toast.success("All pending tickets updated to CONFIRMED");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      toast.info("No tickets to export");
      return;
    }

    const headers = [
      "Booking Ref",
      "Passenger Name",
      "Age",
      "Gender",
      "PNR Number",
      "Train Option",
      "Train Name",
      "Coach",
      "Seat/Berth",
      "Status",
    ].join(",");

    const rows = filteredTickets.map((t) =>
      [
        `"${t.bookingRef}"`,
        `"${t.passengerName}"`,
        t.age,
        t.gender,
        `"${t.pnrNumber || "—"}"`,
        `"${t.trainRoute || "—"}"`,
        `"${t.trainName || "—"}"`,
        `"${t.coach || "—"}"`,
        `"${t.seatBerth || "—"}"`,
        t.status,
      ].join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `train_tickets_${tripId}_${departureDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* ──────────────── 1. SUMMARY KPI CARDS ──────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-1">
          <p className="text-2xl font-black text-slate-800">{kpiStats.total}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Passengers
          </p>
          <p className="text-[10px] text-slate-400 font-medium">On departure date</p>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-3.5 shadow-2xs space-y-1">
          <p className="text-2xl font-black text-emerald-600">{kpiStats.confirmed}</p>
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Confirmed
          </p>
          <p className="text-[10px] text-emerald-600 font-medium">
            {kpiStats.total > 0
              ? `${Math.round((kpiStats.confirmed / kpiStats.total) * 100)}% verified`
              : "0%"}
          </p>
        </div>

        <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-3.5 shadow-2xs space-y-1">
          <p className="text-2xl font-black text-amber-600">{kpiStats.rac}</p>
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" /> RAC / Waitlisted
          </p>
          <p className="text-[10px] text-amber-600 font-medium">Under queue verification</p>
        </div>

        <div className="bg-rose-50/50 border border-rose-200/60 rounded-lg p-3.5 shadow-2xs space-y-1">
          <p className="text-2xl font-black text-rose-600">{kpiStats.pending}</p>
          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-500" /> Pending PNR
          </p>
          <p className="text-[10px] text-rose-600 font-medium">Requires senior booking</p>
        </div>

        <div className="bg-blue-50/50 border border-blue-200/60 rounded-lg p-3.5 shadow-2xs space-y-1">
          <p className="text-2xl font-black text-blue-600">{kpiStats.selfBooked}</p>
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-blue-500" /> Self Booked
          </p>
          <p className="text-[10px] text-blue-600 font-medium">Direct traveler ticket</p>
        </div>
      </div>

      {/* ──────────────── 2. FILTER & ACTION TOOLBAR ──────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search passenger, PNR, booking ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-9 pr-3 text-xs border border-slate-200 rounded-[4px] bg-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs font-bold border border-slate-200 rounded-[4px] px-3 bg-white text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Ticket Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="RAC">RAC</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="PENDING">Pending</option>
            <option value="SELF_BOOKED">Self Booked</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {kpiStats.pending > 0 && (
            <Button
              onClick={handleBulkConfirm}
              variant="outline"
              className="h-8 text-xs font-bold border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100"
            >
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Confirm All Pending
            </Button>
          )}

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="h-8 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-slate-500" /> Export CSV
          </Button>
        </div>
      </div>

      {/* ──────────────── 3. PASSENGER TICKET MANIFEST TABLE ──────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Train Passenger Ticket Status Queue
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {filteredTickets.length} Passengers Listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3 w-10 text-center border-r border-slate-100">#</th>
                <th className="p-3 border-r border-slate-100 min-w-[180px]">PASSENGER NAME & REF</th>
                <th className="p-3 border-r border-slate-100 min-w-[150px]">TRAIN OPTION</th>
                <th className="p-3 border-r border-slate-100 min-w-[140px]">PNR NUMBER</th>
                <th className="p-3 border-r border-slate-100 min-w-[160px]">TRAIN & SEAT</th>
                <th className="p-3 border-r border-slate-100 min-w-[130px] text-center">TICKET STATUS</th>
                <th className="p-3 text-center w-24">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    No passengers match the active ticket status filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Index */}
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>

                    {/* Passenger Name */}
                    <td className="p-3 border-r border-slate-100">
                      <div className="font-bold text-slate-800 leading-tight">
                        {t.passengerName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                          {t.bookingRef}
                        </span>
                        <span>
                          {t.gender}, {t.age > 0 ? `${t.age} yrs` : "—"}
                        </span>
                      </div>
                    </td>

                    {/* Train Option */}
                    <td className="p-3 border-r border-slate-100">
                      <span className="text-xs font-semibold text-slate-700">
                        {t.trainRoute || "—"}
                      </span>
                    </td>

                    {/* PNR Number */}
                    <td className="p-3 border-r border-slate-100">
                      {t.pnrNumber ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200/60 tracking-wider">
                            {t.pnrNumber}
                          </span>
                          <button
                            onClick={() => handleCopyPNR(t.pnrNumber)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copy PNR"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not Booked</span>
                      )}
                    </td>

                    {/* Train & Seat */}
                    <td className="p-3 border-r border-slate-100">
                      {t.trainNumber || t.coach || t.seatBerth ? (
                        <>
                          <div className="font-bold text-slate-800">
                            {t.trainName} {t.trainNumber ? `(${t.trainNumber})` : ""}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {t.coach ? `Coach: ${t.coach}` : ""} {t.seatBerth ? `| Seat: ${t.seatBerth}` : ""}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Ticket Status */}
                    <td className="p-3 border-r border-slate-100 text-center">
                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleStatusChange(t.id, e.target.value as TrainTicketStatus)
                        }
                        className={cn(
                          "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border text-center outline-none cursor-pointer transition-all",
                          t.status === "CONFIRMED" &&
                            "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                          t.status === "RAC" &&
                            "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
                          t.status === "WAITLISTED" &&
                            "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
                          t.status === "PENDING" &&
                            "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
                          t.status === "SELF_BOOKED" &&
                            "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        )}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="RAC">RAC</option>
                        <option value="WAITLISTED">WAITLISTED</option>
                        <option value="SELF_BOOKED">SELF BOOKED</option>
                      </select>
                    </td>

                    {/* Action */}
                    <td className="p-3 text-center">
                      <Button
                        onClick={() => handleOpenEdit(t)}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────────────── 4. EDIT TICKET MODAL ──────────────── */}
      {editModalOpen && selectedTicket && (
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-black text-slate-800">
                Update Train Ticket — {selectedTicket.passengerName}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Edit PNR, train info, coach, and seat details for {selectedTicket.bookingRef}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveModal} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    PNR Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8219502931"
                    value={formState.pnrNumber || ""}
                    onChange={(e) => setFormState({ ...formState, pnrNumber: e.target.value })}
                    className="w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Ticket Status
                  </label>
                  <select
                    value={formState.status || "PENDING"}
                    onChange={(e) =>
                      setFormState({ ...formState, status: e.target.value as TrainTicketStatus })
                    }
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded focus:outline-none bg-white"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="RAC">RAC</option>
                    <option value="WAITLISTED">WAITLISTED</option>
                    <option value="SELF_BOOKED">SELF BOOKED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Train Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paschim Express"
                    value={formState.trainName || ""}
                    onChange={(e) => setFormState({ ...formState, trainName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Train Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12925"
                    value={formState.trainNumber || ""}
                    onChange={(e) => setFormState({ ...formState, trainNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Coach
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B3"
                    value={formState.coach || ""}
                    onChange={(e) => setFormState({ ...formState, coach: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Seat / Berth
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24 (Lower)"
                    value={formState.seatBerth || ""}
                    onChange={(e) => setFormState({ ...formState, seatBerth: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Train Option / Route
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3 TIER AC TRAIN"
                  value={formState.trainRoute || ""}
                  onChange={(e) => setFormState({ ...formState, trainRoute: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  variant="outline"
                  className="h-8 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-8 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white"
                >
                  Save Ticket Details
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
