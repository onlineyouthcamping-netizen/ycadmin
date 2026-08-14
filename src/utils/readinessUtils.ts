export interface ReadinessParams {
  stats?: {
    totalParticipants?: number;
    totalRevenue?: number;
    customerOutstanding?: number;
    customerPaid?: number;
  } | null;
  vendors?: any[] | null;
  fleet?: any[] | null;
  documents?: any[] | null;
}

/**
 * Single source of truth for departure readiness calculation.
 * Safely handles null, undefined, empty, and partial data states.
 */
export function calculateReadinessScore(
  params?: ReadinessParams | null,
): number {
  if (!params) return 0;
  let score = 0;

  const { stats, vendors, fleet, documents } = params;

  // 1. Participant count check (+20%)
  const totalParticipants = Number(stats?.totalParticipants) || 0;
  if (totalParticipants > 0) {
    score += 20;
  }

  // 2. Revenue collection check (+30%)
  const totalRevenue = Number(stats?.totalRevenue) || 0;
  const customerOutstanding = Number(stats?.customerOutstanding) || 0;
  const customerPaid = Number(stats?.customerPaid) || 0;

  if (totalRevenue > 0 && customerOutstanding <= 0) {
    score += 30;
  } else if (totalRevenue > 0) {
    const paidRatio = customerPaid / totalRevenue;
    score += Math.round(Math.min(1, Math.max(0, paidRatio)) * 30);
  }

  // 3. Hotel confirmation check (+15%)
  const safeVendors = Array.isArray(vendors) ? vendors : [];
  const hotels = safeVendors.filter((v: any) => v && v.vendorType === "hotel");
  if (hotels.length > 0) {
    const confirmed = hotels.filter(
      (h: any) =>
        h &&
        (h.paymentStatus === "paid" ||
          h.status === "CONFIRMED" ||
          h.status === "Confirmed" ||
          h.confirmed === true),
    ).length;
    score += Math.round((confirmed / hotels.length) * 15);
  }

  // 4. Guide / Tour leader assignment (+15%)
  const guides = safeVendors.filter(
    (v: any) => v && (v.vendorType === "guide" || v.vendorType === "tour_lead"),
  );
  if (guides.length > 0) {
    score += 15;
  }

  // 5. Vehicle / Transport allocation (+10%)
  const safeFleet = Array.isArray(fleet) ? fleet : [];
  const transports = safeVendors.filter(
    (v: any) => v && v.vendorType === "transport",
  );
  if (transports.length > 0 || safeFleet.filter(Boolean).length > 0) {
    score += 10;
  }

  // 6. Documents verification (+10%)
  const safeDocs = Array.isArray(documents) ? documents : [];
  const verifiedDocs = safeDocs.filter(
    (d: any) =>
      d && (d.status === "VERIFIED" || d.verificationStatus === "VERIFIED"),
  ).length;
  if (verifiedDocs > 0) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}
