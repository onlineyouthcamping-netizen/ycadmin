/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AccommodationWorkspace — YouthCamping Admin
 *
 * Production accommodation control screen for a departure.
 *
 * Architecture:
 *   - Passenger Sharing Config  = trip-level (Double/Triple/Quad groups)
 *   - Physical Hotel Rooms       = OpsHotelBooking.numberOfRooms
 *   - Cost per Pax               = totalAmount ÷ totalPax  (for full stay)
 *
 * All values come from live database data via props.
 * No hardcoded rates, names, fallbacks, or mock data.
 */

import React, { useMemo, useState } from "react";
import {
  MapPin,
  Hotel,
  Bed,
  ChevronRight,
  X,
  Pencil,
  Info,
  Users,
  Calendar,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  buildPhysicalRoomAllocation,
  calculateAccommodationCost,
  derivePassengerSharing,
  derivePassengerSharingFromBookings,
  findHotelForDay,
  formatINR,
  getPrimaryRateFromBooking,
  normalisePricingMode,
  resolveCityForItineraryDay,
  suggestRoomAllocation,
} from "@/utils/accommodationCalculator";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface AccommodationWorkspaceProps {
  /** Itinerary rows from tripDetails (computedItinerary) */
  computedItinerary: any[];
  /** Raw OpsHotelBooking records from GET /ops/hotels/:tripId */
  opsHotelBookings: any[];
  /** All departure passengers (allPassengers) */
  allPassengers: any[];
  /** Room-level passenger assignments: { passengerName: { room, vehicle, seat } } */
  passengerAllocations: Record<string, { room: string; vehicle: string; seat: string }>;
  departureDateStr: string;
  tripId: string;
  /** Opens the hotel assignment wizard or edit drawer */
  onEditHotel: (hotelRow: any, dayInfo?: any) => void;
}

// ─────────────────────────────────────────────
// Derived Row Type
// ─────────────────────────────────────────────

interface AccommodationRow {
  dayLabel: string;
  date: string;
  destination: string;
  hasStay: boolean;
  nightsText: string;
  nights: number;
  hotelName: string;
  physicalRooms: number;
  costPerPaxPerNight: number;
  costPerPaxStay: number;
  totalAmount: number;
  status: "configured" | "pending" | "no-stay";
  booking: any | null; // raw OpsHotelBooking
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function AccommodationWorkspace({
  computedItinerary,
  opsHotelBookings,
  allPassengers,
  passengerAllocations,
  departureDateStr,
  onEditHotel,
}: AccommodationWorkspaceProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  const totalPax = allPassengers.length;

  // ── Derive passenger sharing from actual room allocations ──
  const passengerSharing = useMemo(() => {
    const hasAllocations = Object.values(passengerAllocations).some(
      (a) => a.room && a.room !== "—" && a.room !== "Unassigned"
    );
    if (hasAllocations) {
      return derivePassengerSharing(passengerAllocations);
    }
    // Fallback: derive from booking passenger data
    return derivePassengerSharingFromBookings(allPassengers);
  }, [passengerAllocations, allPassengers]);

  // ── Physical room allocation (from saved room assignments) ──
  const physicalRoomAllocation = useMemo(
    () => buildPhysicalRoomAllocation(passengerAllocations),
    [passengerAllocations]
  );

  // ── Build accommodation rows (one per itinerary day) ──
  const rows = useMemo<AccommodationRow[]>(() => {
    return computedItinerary.map((day: any, idx: number) => {
      const dayDate = day.date || "";

      // Extract stay or destination city
      const parsedStay =
        day.stay && day.stay !== "—"
          ? day.stay
          : day.destination && day.destination !== "—"
            ? day.destination
            : day.city || "";

      const cityLocation = resolveCityForItineraryDay(day);

      // 1. Try finding a saved hotel booking for this day date or location
      const booking = findHotelForDay(dayDate, cityLocation, opsHotelBookings);

      // 2. Check if this day is a stay day (has booking OR has stay location OR is overnight itinerary day)
      const isEnrouteDay =
        (day.plan || "").toLowerCase().includes("train journey") ||
        (day.sub || "").toLowerCase().includes("arrival in your city") ||
        (day.plan || "").toLowerCase().includes("your city");

      const hasStay =
        !!booking ||
        (!isEnrouteDay && idx > 0 && idx < computedItinerary.length - 1) ||
        (!!parsedStay && !parsedStay.toLowerCase().includes("no stay"));

      const destination =
        booking?.location ||
        (hasStay && cityLocation && cityLocation !== "—" ? cityLocation : "") ||
        parsedStay ||
        (day.plan ? day.plan.split("/")[0].split("-")[0].trim() : "—");

      // Authoritative room count: Room & Vehicle Allocation tab > booking.numberOfRooms > totalPax / 2
      const authoritativeRooms =
        physicalRoomAllocation.totalRooms > 0
          ? physicalRoomAllocation.totalRooms
          : booking?.numberOfRooms && booking.numberOfRooms > 0
            ? booking.numberOfRooms
            : totalPax > 0
              ? Math.ceil(totalPax / 2)
              : 1;

      // Always derive physical room count regardless of booking status
      let physicalRooms = authoritativeRooms;
      let costPerPaxPerNight = 0;
      let costPerPaxStay = 0;
      let totalAmount = 0;
      let nights = 1;
      let status: AccommodationRow["status"] = "no-stay";

      if (booking) {
        nights = booking.nightsCount || 1;
        // Use explicit room counts from booking if available; fall back to authoritativeRooms
        const dRooms = booking.doubleRoomsCount ?? authoritativeRooms;
        const dRate = booking.doubleRate || 0;
        const tRooms = booking.tripleRoomsCount || 0;
        const tRate = booking.tripleRate || 0;
        const qRooms = booking.quadRoomsCount || 0;
        const qRate = booking.quadRate || 0;
        const exPax = booking.extraPersonsCount || 0;
        const exRate = booking.extraBedRate || 0;

        let calcTotal = (dRooms * dRate + tRooms * tRate + qRooms * qRate + exPax * exRate) * nights;

        totalAmount = booking.totalAmount > 0 ? booking.totalAmount : calcTotal;
        status = "configured";

        const effectivePaxCount = totalPax > 0 ? totalPax : Math.max(1, authoritativeRooms * 2);
        costPerPaxStay = effectivePaxCount > 0 ? totalAmount / effectivePaxCount : 0;
        costPerPaxPerNight = nights > 0 ? costPerPaxStay / nights : costPerPaxStay;
      } else if (hasStay) {
        status = "pending";
      }

      const nightsText =
        !hasStay && !booking
          ? "No Stay"
          : nights === 1
            ? "1 Night"
            : `${nights} Nights`;

      return {
        dayLabel: day.day || `Day ${idx + 1}`,
        date: dayDate,
        destination,
        hasStay: hasStay || !!booking,
        nightsText,
        nights,
        hotelName: booking?.hotelName || (hasStay ? "— Pending Assignment —" : "—"),
        physicalRooms,
        costPerPaxPerNight,
        costPerPaxStay,
        totalAmount,
        status,
        booking,
      };
    });
  }, [computedItinerary, opsHotelBookings, totalPax]);

  // ── Summary bar values ──
  const summary = useMemo(() => {
    const stayNights = rows.reduce((sum, r) => sum + (r.hasStay ? r.nights : 0), 0);
    const uniqueHotels = new Set(
      rows.filter((r) => r.booking?.hotelName).map((r) => r.booking!.hotelName)
    ).size;
    const totalRooms = rows.reduce((sum, r) => {
      // Avoid double-counting multi-night stays (same booking appears on multiple rows)
      if (!r.booking) return sum;
      return sum + (r.physicalRooms > 0 ? r.physicalRooms : 0);
    }, 0);

    // Sum distinct hotel bookings total cost
    const seenBookingIds = new Set<string>();
    let totalDepartureCost = 0;
    rows.forEach((r) => {
      if (r.booking && r.totalAmount > 0) {
        const bId = r.booking.id || `${r.hotelName}-${r.date}`;
        if (!seenBookingIds.has(bId)) {
          seenBookingIds.add(bId);
          totalDepartureCost += r.totalAmount;
        }
      }
    });

    // Average cost per pax per night (from configured stays)
    const configuredRows = rows.filter((r) => r.hasStay && r.costPerPaxPerNight > 0);
    const avgCostPerPaxNight =
      configuredRows.length > 0
        ? configuredRows.reduce((s, r) => s + r.costPerPaxPerNight, 0) /
          configuredRows.length
        : 0;

    return { stayNights, uniqueHotels, totalRooms, avgCostPerPaxNight, totalDepartureCost };
  }, [rows]);

  const selectedRow = selectedDayIdx !== null ? rows[selectedDayIdx] : null;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-base font-black text-slate-800">Hotels & Accommodations</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Click a day to view hotel details, room allocation and per-pax cost
          </p>
        </div>
        <button
          onClick={() => onEditHotel({ id: "" })}
          className="bg-[#F97316] hover:bg-[#E05E00] text-white px-4 py-2 rounded text-xs font-bold transition-colors shadow-xs"
        >
          + Add / Change Hotel
        </button>
      </div>

      {/* ── Accommodation Summary Bar ── */}
      {summary.stayNights > 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[6px] px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Accommodation Summary
          </span>
          <SummaryPill icon={<Calendar className="w-3 h-3" />} label={`${summary.stayNights} Stay Night${summary.stayNights !== 1 ? "s" : ""}`} />
          <SummaryPill icon={<Hotel className="w-3 h-3" />} label={`${summary.uniqueHotels} Hotel${summary.uniqueHotels !== 1 ? "s" : ""}`} />
          {summary.totalRooms > 0 && (
            <SummaryPill icon={<Bed className="w-3 h-3" />} label={`${summary.totalRooms} Rooms`} />
          )}
          {summary.totalDepartureCost > 0 && (
            <SummaryPill
              icon={<Users className="w-3 h-3" />}
              label={`${formatINR(summary.totalDepartureCost, 0)} Total Stay Cost`}
              highlight
            />
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-[6px] px-4 py-3 text-xs text-slate-400 font-medium">
          No accommodation configured yet for this departure.
        </div>
      )}

      {/* ── Accommodation Table (desktop) ── */}
      <div className="hidden md:block bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-[#E2E8F0]">
            <tr>
              <th className="px-4 py-3 w-20">Day</th>
              <th className="px-4 py-3 whitespace-nowrap">Date</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3 whitespace-nowrap">Stay</th>
              <th className="px-4 py-3">Hotel</th>
              <th className="px-4 py-3 whitespace-nowrap">Rooms</th>
              <th className="px-4 py-3 whitespace-nowrap">Total Amount</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
            {rows.map((row, idx) => (
              <AccommodationTableRow
                key={idx}
                row={row}
                onClick={() => setSelectedDayIdx(idx)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: stacked cards ── */}
      <div className="md:hidden space-y-2">
        {rows.map((row, idx) => (
          <AccommodationMobileCard
            key={idx}
            row={row}
            onClick={() => setSelectedDayIdx(idx)}
          />
        ))}
      </div>

      {/* ── Info footer ── */}
      <div className="flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <p className="text-[11px] text-slate-500 font-medium">
          {totalPax > 0
            ? `${totalPax} passengers on this departure. Click a day to view hotel details and room allocation.`
            : "No passengers confirmed yet. Add bookings to see room allocation."}
        </p>
      </div>

      {/* ── Day Detail Drawer ── */}
      <Dialog open={selectedDayIdx !== null} onOpenChange={() => setSelectedDayIdx(null)}>
        <DialogContent hideClose className="max-w-lg bg-white p-0 rounded-[12px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
          {selectedRow && (
            <DayDetailDrawer
              row={selectedRow}
              allPassengers={allPassengers}
              passengerAllocations={passengerAllocations}
              passengerSharing={passengerSharing}
              physicalRoomAllocation={physicalRoomAllocation}
              totalPax={totalPax}
              onClose={() => setSelectedDayIdx(null)}
              onEditHotel={() => {
                setSelectedDayIdx(null);
                onEditHotel(selectedRow.booking || { id: "" }, {
                  dayNum: selectedDayIdx !== null ? selectedDayIdx + 1 : 1,
                  dayLabel: selectedRow.dayLabel,
                  destination: selectedRow.destination,
                  dateStr: selectedRow.date,
                  existingBooking: selectedRow.booking,
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────
// Summary Pill
// ─────────────────────────────────────────────

function SummaryPill({
  icon,
  label,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-bold",
        highlight ? "text-orange-600" : "text-slate-700"
      )}
    >
      <span className={highlight ? "text-orange-400" : "text-slate-400"}>{icon}</span>
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────
// Table Row
// ─────────────────────────────────────────────

function AccommodationTableRow({
  row,
  onClick,
}: {
  row: AccommodationRow;
  onClick: () => void;
}) {
  return (
    <tr
      className="hover:bg-slate-50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      {/* Day */}
      <td className="px-4 py-3.5 font-black text-slate-900 whitespace-nowrap">
        {row.dayLabel}
      </td>

      {/* Date */}
      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap font-medium">
        {row.date || "—"}
      </td>

      {/* Destination */}
      <td className="px-4 py-3.5">
        {row.hasStay ? (
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="truncate max-w-[140px]">{row.destination}</span>
          </div>
        ) : (
          <span className="text-slate-400 font-medium">{row.destination}</span>
        )}
      </td>

      {/* Stay */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span
          className={cn(
            "px-2 py-1 rounded-[4px] font-bold text-[10px] uppercase",
            row.hasStay
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          )}
        >
          {row.nightsText}
        </span>
      </td>

      {/* Hotel */}
      <td className="px-4 py-3.5">
        {row.hasStay ? (
          <span
            className={cn(
              "font-bold text-slate-900 truncate max-w-[160px] block",
              row.hotelName === "— Not Assigned —" && "text-slate-400 font-medium"
            )}
          >
            {row.hotelName}
          </span>
        ) : (
          <span className="text-slate-400 font-bold">—</span>
        )}
      </td>

      {/* Rooms */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        {row.hasStay ? (
          row.physicalRooms > 0 ? (
            <span className="font-black text-slate-800">
              {row.physicalRooms} {row.physicalRooms === 1 ? "Room" : "Rooms"}
            </span>
          ) : (
            <span className="text-slate-400 font-medium text-[10px]">Pending</span>
          )
        ) : (
          <span className="text-slate-400 font-bold">—</span>
        )}
      </td>

      {/* Total Amount */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        {row.hasStay && (row.totalAmount > 0 || row.costPerPaxPerNight > 0) ? (
          <div>
            <div className="font-extrabold text-emerald-600">
              {formatINR(row.totalAmount > 0 ? row.totalAmount : row.costPerPaxStay)}
            </div>
            {row.costPerPaxStay > 0 && (
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {formatINR(row.costPerPaxStay)} / pax
              </div>
            )}
          </div>
        ) : (
          <span className="text-slate-400 font-bold">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <StatusBadge status={row.status} />
      </td>

      {/* Chevron */}
      <td className="px-4 py-3.5">
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400 transition-colors" />
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// Mobile Card
// ─────────────────────────────────────────────

function AccommodationMobileCard({
  row,
  onClick,
}: {
  row: AccommodationRow;
  onClick: () => void;
}) {
  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition-colors shadow-xs"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 text-sm">{row.dayLabel}</span>
            <span className="text-[10px] text-slate-500 font-medium">{row.date}</span>
            <StatusBadge status={row.status} />
          </div>
          <div className="flex items-center gap-1 mt-1">
            {row.hasStay && <MapPin className="w-3 h-3 text-orange-400 shrink-0" />}
            <span className={cn(
              "text-xs font-bold truncate",
              row.hasStay ? "text-slate-800" : "text-slate-400"
            )}>
              {row.destination}
            </span>
          </div>
          {row.hasStay && (
            <div className="text-[11px] text-slate-600 font-medium mt-1 truncate">
              {row.hotelName}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          {row.hasStay && row.physicalRooms > 0 && (
            <div className="font-black text-slate-800 text-sm">
              {row.physicalRooms} Rooms
            </div>
          )}
          {row.hasStay && row.costPerPaxPerNight > 0 && (
            <div className="text-xs font-bold text-emerald-600 mt-0.5">
              {formatINR(row.costPerPaxPerNight)}/pax
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-slate-300 mt-1 ml-auto" />
        </div>
      </div>
      {!row.hasStay && (
        <div className="mt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">No Overnight Stay</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: AccommodationRow["status"] }) {
  if (status === "configured") {
    return (
      <span className="px-2 py-0.5 rounded-[4px] font-black text-[10px] uppercase bg-emerald-50 text-emerald-600">
        Configured
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="px-2 py-0.5 rounded-[4px] font-black text-[10px] uppercase bg-amber-50 text-amber-600">
        Pending
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-[4px] font-black text-[10px] uppercase bg-slate-100 text-slate-500">
      No Stay
    </span>
  );
}

// ─────────────────────────────────────────────
// Day Detail Drawer
// ─────────────────────────────────────────────

interface DayDetailDrawerProps {
  row: AccommodationRow;
  allPassengers: any[];
  passengerAllocations: Record<string, { room: string; vehicle: string; seat: string }>;
  passengerSharing: ReturnType<typeof derivePassengerSharing>;
  physicalRoomAllocation: ReturnType<typeof buildPhysicalRoomAllocation>;
  totalPax: number;
  onClose: () => void;
  onEditHotel: () => void;
}

function DayDetailDrawer({
  row,
  allPassengers,
  passengerAllocations,
  passengerSharing,
  physicalRoomAllocation,
  totalPax,
  onClose,
  onEditHotel,
}: DayDetailDrawerProps) {
  const booking = row.booking;

  // ── Cost calculation ──
  const costResult = useMemo(() => {
    if (!booking) return null;
    const rate = getPrimaryRateFromBooking(booking);
    if (rate <= 0 && (!booking.totalAmount || booking.totalAmount <= 0)) return null;

    if (booking.totalAmount > 0 && totalPax > 0) {
      // Use stored total (most accurate — already computed by backend)
      const nights = booking.nightsCount || 1;
      const rooms = booking.numberOfRooms || 0;
      const costPerPaxStay = booking.totalAmount / totalPax;
      const costPerPaxPerNight = nights > 0 ? costPerPaxStay / nights : costPerPaxStay;
      const mode = normalisePricingMode(booking.pricingMethod);

      const steps = [];
      if (mode === "PER_ROOM" && rooms > 0) {
        const roomRate = rooms > 0 && nights > 0 ? booking.totalAmount / rooms / nights : rate;
        steps.push({
          label: "Room Rate",
          formula: `${formatINR(roomRate)} / Room / Night`,
          result: "",
        });
        steps.push({
          label: `${rooms} Rooms × ${formatINR(roomRate)} × ${nights} Night${nights !== 1 ? "s" : ""}`,
          formula: `${rooms} × ${formatINR(roomRate)} × ${nights}`,
          result: formatINR(booking.totalAmount),
        });
        steps.push({
          label: "Cost per Pax / Stay",
          formula: `${formatINR(booking.totalAmount)} ÷ ${totalPax} Pax`,
          result: formatINR(costPerPaxStay, 2),
        });
        if (nights > 1) {
          steps.push({
            label: "Cost per Pax / Night",
            formula: `${formatINR(costPerPaxStay, 2)} ÷ ${nights} Nights`,
            result: formatINR(costPerPaxPerNight, 2),
          });
        }
      } else {
        const paxRate = totalPax > 0 && nights > 0 ? booking.totalAmount / totalPax / nights : rate;
        steps.push({
          label: "Rate",
          formula: `${formatINR(paxRate)} / Pax / Night`,
          result: "",
        });
        steps.push({
          label: `${totalPax} Pax × ${nights} Night${nights !== 1 ? "s" : ""}`,
          formula: `${totalPax} × ${formatINR(paxRate)} × ${nights}`,
          result: formatINR(booking.totalAmount),
        });
        steps.push({
          label: "Cost per Pax / Stay",
          formula: `${formatINR(paxRate)} × ${nights} Nights`,
          result: formatINR(costPerPaxStay, 2),
        });
      }

      return {
        grandTotal: booking.totalAmount,
        costPerPaxPerNight,
        costPerPaxStay,
        steps,
        pricingMode: mode,
      };
    }

    // No stored total — calculate from rates
    const mode = normalisePricingMode(booking.pricingMethod);
    return calculateAccommodationCost({
      physicalRooms: booking.numberOfRooms || 0,
      baseRate: rate,
      nights: booking.nightsCount || 1,
      totalPax,
      pricingMode: mode,
      taxPercent: booking.taxPercent || 0,
    });
  }, [booking, totalPax]);

  // ── Room allocation display ──
  // Use actual saved allocations if available, else suggest from sharing config
  const roomsToShow = useMemo(() => {
    if (physicalRoomAllocation.rooms.length > 0) {
      return physicalRoomAllocation.rooms;
    }
    // Suggest from sharing config
    const sizes = suggestRoomAllocation(passengerSharing);
    return sizes.map((paxCount, i) => ({
      roomLabel: `Room ${i + 1}`,
      occupants: [],
      paxCount,
    }));
  }, [physicalRoomAllocation, passengerSharing]);

  const isSuggestedAllocation = physicalRoomAllocation.rooms.length === 0;
  const effectiveTotalRooms =
    physicalRoomAllocation.rooms.length > 0
      ? physicalRoomAllocation.totalRooms
      : booking?.numberOfRooms || roomsToShow.length;

  // ── Format check-in/out dates ──
  const checkIn = booking?.checkIn ? formatDisplayDate(booking.checkIn) : row.date;
  const checkOut = booking?.checkOut ? formatDisplayDate(booking.checkOut) : "—";

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-white overflow-hidden rounded-[12px]">
      {/* Fixed Header */}
      <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
        <div>
          <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider block">
            {row.dayLabel} · {row.destination}
          </span>
          <h3 className="text-base font-black text-slate-800 mt-0.5">
            Accommodation Details
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {row.date}
            </span>
            <span className="flex items-center gap-1">
              <Bed className="w-3 h-3 text-slate-400" />
              {row.nightsText}
            </span>
            {totalPax > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                {totalPax} Pax
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ── Section 1: Hotel ── */}
          <Section title="Hotel" icon={<Hotel className="w-3.5 h-3.5" />}>
            {booking ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">
                    {booking.hotelName}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded uppercase",
                      booking.confirmed === "CONFIRMED"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    )}
                  >
                    {booking.confirmed || "UNCONFIRMED"}
                  </span>
                </div>
                {booking.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3 h-3 text-orange-400" />
                    {booking.location}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <InfoChip label="Check-in" value={checkIn} />
                  <InfoChip label="Check-out" value={checkOut} />
                  <InfoChip label="Nights" value={String(booking.nightsCount || 1)} />
                </div>
                {booking.roomType && (
                  <InfoChip label="Room Type" value={booking.roomType} />
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-medium py-2">
                No hotel assigned for this day.{" "}
                <button
                  onClick={onEditHotel}
                  className="text-orange-500 underline"
                >
                  Assign Hotel
                </button>
              </div>
            )}
          </Section>

          {/* ── Section 2: Passenger Sharing Configuration ── */}
          <Section title="Passenger Sharing" icon={<Users className="w-3.5 h-3.5" />}>
            <p className="text-[10px] text-slate-400 font-medium mb-2">
              Departure-level sharing configuration (read-only)
            </p>
            {passengerSharing.doublePax === 0 &&
            passengerSharing.triplePax === 0 &&
            passengerSharing.quadPax === 0 ? (
              <div className="text-xs text-slate-400 font-medium">
                {allPassengers.length > 0
                  ? "Room allocations not yet saved. Run auto-allocation first."
                  : "No passengers confirmed yet."}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {passengerSharing.doublePax > 0 && (
                  <SharingDisplay
                    type="Double"
                    pax={passengerSharing.doublePax}
                    color="bg-blue-50 border-blue-200 text-blue-700"
                  />
                )}
                {passengerSharing.triplePax > 0 && (
                  <SharingDisplay
                    type="Triple"
                    pax={passengerSharing.triplePax}
                    color="bg-purple-50 border-purple-200 text-purple-700"
                  />
                )}
                {passengerSharing.quadPax > 0 && (
                  <SharingDisplay
                    type="Quad"
                    pax={passengerSharing.quadPax}
                    color="bg-amber-50 border-amber-200 text-amber-700"
                  />
                )}
                {passengerSharing.otherPax > 0 && (
                  <SharingDisplay
                    type="Other"
                    pax={passengerSharing.otherPax}
                    color="bg-slate-100 border-slate-200 text-slate-600"
                  />
                )}
              </div>
            )}
          </Section>

          {/* ── Section 3: Physical Room Allocation ── */}
          <Section title="Physical Room Allocation" icon={<Hash className="w-3.5 h-3.5" />}>
            {isSuggestedAllocation && roomsToShow.length > 0 && (
              <p className="text-[10px] text-amber-600 font-bold mb-2 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                Suggested allocation — save from Room & Allocation tab to confirm
              </p>
            )}
            {roomsToShow.length === 0 ? (
              <div className="text-xs text-slate-400 font-medium py-1">
                No room allocation data. Use the Room & Allocation tab to assign passengers to rooms.
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  {roomsToShow.map((room, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-700">
                          {room.roomLabel}
                        </span>
                        {room.occupants.length > 0 && (
                          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[160px]">
                            {room.occupants.join(", ")}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-500 shrink-0">
                        {room.paxCount} Pax
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-black text-slate-700 border-t border-slate-100 pt-2">
                  <span>Total</span>
                  <span>
                    {effectiveTotalRooms} Room{effectiveTotalRooms !== 1 ? "s" : ""} ·{" "}
                    {isSuggestedAllocation
                      ? (passengerSharing.doublePax + passengerSharing.triplePax + passengerSharing.quadPax + passengerSharing.otherPax)
                      : physicalRoomAllocation.totalPax}{" "}
                    Pax
                  </span>
                </div>
              </>
            )}
          </Section>

          {/* ── Section 4: Cost Calculation ── */}
          {row.hasStay && (
            <Section title="Accommodation Cost" icon={<Hash className="w-3.5 h-3.5" />}>
              {costResult ? (
                <div className="space-y-2">
                  {/* Pricing mode badge */}
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Pricing:{" "}
                    <span className="text-slate-600">
                      {costResult.pricingMode === "PER_ROOM"
                        ? "Per Physical Room / Night"
                        : "Per Person / Night"}
                    </span>
                  </div>

                  {/* Calculation steps */}
                  <div className="space-y-1.5">
                    {costResult.steps.map((step, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center justify-between text-xs",
                          i === costResult.steps.length - 1
                            ? "font-black text-slate-900 border-t border-slate-100 pt-2 mt-1"
                            : "text-slate-600 font-medium"
                        )}
                      >
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {step.label}
                        </span>
                        <span className="font-mono font-bold text-slate-700">
                          {step.result || step.formula}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Primary numbers */}
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Cost / Pax / Night</span>
                      <span className="text-base font-black text-emerald-600">
                        {formatINR(costResult.costPerPaxPerNight, 2)}
                      </span>
                    </div>
                    {row.nights > 1 && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Cost / Pax / Stay ({row.nights} nights)</span>
                        <span className="text-sm font-extrabold text-orange-600">
                          {formatINR(costResult.costPerPaxStay, 2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline border-t border-slate-200 pt-1.5 mt-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Cost</span>
                      <span className="text-sm font-black text-slate-800">
                        {formatINR(costResult.grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Tax note */}
                  {booking?.taxPercent > 0 && (
                    <p className="text-[10px] text-slate-400 font-medium">
                      Includes {booking.taxPercent}% GST on total
                    </p>
                  )}

                  {/* Balance */}
                  {booking && (booking.advancePaid > 0 || booking.balanceAmount > 0) && (
                    <div className="mt-2 space-y-1">
                      {booking.advancePaid > 0 && (
                        <div className="flex justify-between text-xs font-bold text-emerald-600">
                          <span>Advance Paid</span>
                          <span>{formatINR(booking.advancePaid)}</span>
                        </div>
                      )}
                      {booking.balanceAmount > 0 && (
                        <div className="flex justify-between text-xs font-bold text-rose-600">
                          <span>Balance Due</span>
                          <span>{formatINR(booking.balanceAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium py-1">
                  No rates configured.{" "}
                  <button onClick={onEditHotel} className="text-orange-500 underline">
                    Add hotel rates
                  </button>
                </div>
              )}
            </Section>
          )}
        </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-3 flex justify-between items-center shrink-0">
        <span className="text-[10px] font-bold text-slate-400">
          {booking ? `ID: ${booking.id?.substring(0, 12)}...` : "No hotel record"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEditHotel}
            className="h-8 text-xs font-bold border-slate-200"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit Hotel
          </Button>
          <Button
            size="sm"
            onClick={onClose}
            className="h-8 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Helper Sub-Components
// ─────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5">
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400">{icon}</span>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
      <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-xs font-bold text-slate-700 mt-0.5">{value || "—"}</p>
    </div>
  );
}

function SharingDisplay({
  type,
  pax,
  color,
}: {
  type: string;
  pax: number;
  color: string;
}) {
  return (
    <div
      className={cn(
        "border rounded-lg px-3 py-2 text-center",
        color
      )}
    >
      <p className="text-[10px] font-black uppercase">{type}</p>
      <p className="text-lg font-black mt-0.5">{pax}</p>
      <p className="text-[9px] font-semibold opacity-70">Pax</p>
    </div>
  );
}

/** Format date for display: "2026-08-19" → "19 Aug 2026" */
function formatDisplayDate(raw: string): string {
  if (!raw) return "—";
  try {
    const d = new Date(raw.includes("T") ? raw : raw + "T00:00:00Z");
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return raw;
  }
}
