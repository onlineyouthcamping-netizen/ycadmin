/**
 * Train ticketing UI helpers for the booking Ticketing tab.
 *
 * Req/non-req is decided at booking confirmation time via:
 * - `trainTicketRequired` (explicit flag)
 * - `trainTicketStatus` set on confirm (PENDING / CONFIRMED / SELF_BOOKED / NOT_REQUIRED / …)
 *
 * Matches PassengerTimeline / PassengerDrawer conventions.
 */

const NON_REQUIRED_STATUSES = new Set([
  "NOT_REQUIRED",
  "NOT_BOOKED",
  "SELF_BOOKED",
  "SELF BOOKED",
]);

const ACTIVE_REQUIRED_STATUSES = new Set([
  "PENDING",
  "PENDING_VERIFICATION",
  "BOOKED",
  "WAITLISTED",
  "CONFIRMED",
  "RAC",
  "ISSUED",
  "DRAFT",
]);

/** Ticket work is complete for ops purposes. */
const DONE_STATUSES = new Set([
  "CONFIRMED",
  "BOOKED",
  "ISSUED",
  "SELF_BOOKED",
  "SELF BOOKED",
  "RAC",
  "WAITLISTED",
]);

export function normalizeTrainTicketStatus(status?: string | null): string {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

/**
 * Whether company/ops must issue a train ticket for this booking.
 * Prefer flags written at confirmation; fall back to status vocabulary.
 */
export function isTrainTicketRequired(booking: {
  trainTicketRequired?: boolean | null;
  trainTicketStatus?: string | null;
  status?: string | null;
} | null | undefined): boolean {
  if (!booking) return false;

  const ticketStatus = normalizeTrainTicketStatus(booking.trainTicketStatus);

  if (booking.trainTicketRequired === false) return false;
  if (NON_REQUIRED_STATUSES.has(ticketStatus)) return false;
  if (booking.trainTicketRequired === true) return true;
  if (ACTIVE_REQUIRED_STATUSES.has(ticketStatus)) return true;

  // Confirmed bookings historically defaulted trainTicketStatus to PENDING at confirm.
  const bookingStatus = String(booking.status || "").toLowerCase();
  if (bookingStatus === "confirmed" && ticketStatus && ticketStatus !== "NOT_REQUIRED") {
    return true;
  }

  return false;
}

export function trainTicketRequirementLabel(
  booking: Parameters<typeof isTrainTicketRequired>[0],
): "req" | "non-req" {
  return isTrainTicketRequired(booking) ? "req" : "non-req";
}

export function isTrainTicketDone(ticket: {
  ticketStatus?: string | null;
  status?: string | null;
} | null | undefined): boolean {
  if (!ticket) return false;
  const st = normalizeTrainTicketStatus(
    ticket.ticketStatus || (ticket as any).status,
  );
  return DONE_STATUSES.has(st);
}

/** Human label for row status — clearer than bare PENDING. */
export function trainTicketProgressLabel(ticket: {
  ticketStatus?: string | null;
  status?: string | null;
} | null | undefined): string {
  if (!ticket) return "ticket is not done";
  const st = normalizeTrainTicketStatus(
    ticket.ticketStatus || (ticket as any).status,
  );
  if (!st || st === "PENDING" || st === "PENDING_VERIFICATION" || st === "DRAFT") {
    return "ticket is not done";
  }
  return st.replace(/_/g, " ");
}

/**
 * Group / summary train icon: green when ticketing is clear, red when work remains.
 * Non-req bookings are treated as clear (green).
 */
export function isGroupTrainTicketingDone(
  booking: Parameters<typeof isTrainTicketRequired>[0],
  tickets: Array<{ ticketStatus?: string | null; status?: string | null }> = [],
): boolean {
  if (!isTrainTicketRequired(booking)) return true;

  const live = tickets.filter((t) => {
    const st = normalizeTrainTicketStatus(
      t.ticketStatus || (t as any).status,
    );
    return st !== "CANCELLED";
  });

  if (live.length === 0) return false;
  return live.every((t) => isTrainTicketDone(t));
}
