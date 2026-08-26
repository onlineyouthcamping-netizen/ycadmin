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

/** Ultra-simple ops states shown in Ticketing UI. */
export type SimpleTrainTicketState = "DONE" | "NOT_DONE" | "NOT_REQUIRED";

export function normalizeTrainTicketStatus(status?: string | null): string {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

/** Map API ticketStatus → Done / Not done / Not required. */
export function toSimpleTrainTicketState(ticket: {
  ticketStatus?: string | null;
  status?: string | null;
} | null | undefined): SimpleTrainTicketState {
  const st = normalizeTrainTicketStatus(
    ticket?.ticketStatus || (ticket as any)?.status,
  );
  if (st === "NOT_REQUIRED" || st === "NOT_BOOKED") return "NOT_REQUIRED";
  if (DONE_STATUSES.has(st)) return "DONE";
  return "NOT_DONE";
}

export function simpleTrainTicketStateLabel(
  state: SimpleTrainTicketState,
): string {
  if (state === "DONE") return "Done";
  if (state === "NOT_REQUIRED") return "Not required";
  return "Not done";
}

/**
 * Map simple UI state → API ticketStatus.
 * When the simple bucket is unchanged, keep the previous API value
 * (e.g. ISSUED stays ISSUED instead of forcing CONFIRMED).
 */
export function simpleTrainTicketStateToApi(
  state: SimpleTrainTicketState,
  previousApiStatus?: string | null,
): string {
  const prev = normalizeTrainTicketStatus(previousApiStatus);
  const prevSimple = toSimpleTrainTicketState({ ticketStatus: prev || null });
  if (prev && prevSimple === state && prev !== "CANCELLED") {
    return prev;
  }
  if (state === "DONE") return "CONFIRMED";
  if (state === "NOT_REQUIRED") return "NOT_REQUIRED";
  return "PENDING";
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

/** Human label for row status — Done / Not done / Not required (or Cancelled). */
export function trainTicketProgressLabel(ticket: {
  ticketStatus?: string | null;
  status?: string | null;
} | null | undefined): string {
  if (!ticket) return "Not done";
  const st = normalizeTrainTicketStatus(
    ticket.ticketStatus || (ticket as any).status,
  );
  if (st === "CANCELLED") return "Cancelled";
  return simpleTrainTicketStateLabel(toSimpleTrainTicketState(ticket));
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
