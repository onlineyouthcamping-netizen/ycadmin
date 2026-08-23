export type VendorMenuItem = {
  id?: string;
  name: string;
  type: string;
  inclusions: string;
  ratePerPerson?: number;
  isVeg?: boolean;
};

export type VendorMenuSource = {
  vendorName: string;
  vendorId?: string;
  city?: string;
  items: VendorMenuItem[];
  mealPlanLabel?: string;
};

function asArray(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mealTypeLabel(raw: string): string {
  const t = String(raw || "").toUpperCase();
  if (t.includes("BREAK")) return "Breakfast";
  if (t.includes("LUNCH")) return "Lunch";
  if (t.includes("DINNER")) return "Dinner";
  if (t.includes("SNACK") || t.includes("TEA")) return "Snacks";
  if (t.includes("BUFF")) return "Buffet";
  if (t.includes("THALI")) return "Thali";
  if (t === "MAP" || t === "AP" || t === "CP" || t === "EP") return t;
  return raw || "Meal";
}

function dishText(t: any): string {
  if (t == null) return "";
  if (typeof t === "string") return t.trim();
  if (Array.isArray(t)) {
    return t
      .map((x) => (typeof x === "string" ? x : x?.name || x?.item || x?.dish || ""))
      .filter(Boolean)
      .join(", ");
  }
  return String(
    t.inclusions || t.menuDescription || t.description || t.menu || t.dishes || t.items || "",
  ).trim();
}

function fromTariff(t: any, idx: number): VendorMenuItem | null {
  if (t == null) return null;
  if (typeof t === "string") {
    const s = t.trim();
    if (!s) return null;
    return { id: `menu-${idx}`, name: mealTypeLabel(s), type: mealTypeLabel(s), inclusions: s };
  }
  if (typeof t !== "object") return null;
  const name = String(t.name || t.mealType || t.title || t.packageName || "").trim();
  const inclusions = dishText(t);
  const type = mealTypeLabel(t.type || t.mealType || t.category || name);
  if (!name && !inclusions) return null;
  const rate = Number(t.perPaxRate ?? t.ratePerPerson ?? t.rate ?? t.amount ?? 0);
  return {
    id: t.id || `menu-${idx}`,
    name: name || type,
    type,
    inclusions,
    ratePerPerson: Number.isFinite(rate) && rate > 0 ? rate : undefined,
    isVeg: t.isVeg !== false && t.veg !== false,
  };
}

/** Parse vendor-directory meal tariffs / food rates / mealPlans JSON. */
export function parseVendorFoodMenu(vendor: any): VendorMenuSource | null {
  if (!vendor) return null;
  const vendorName = String(
    vendor.name || vendor.hotelName || vendor.vendorName || vendor.vendor?.name || "",
  ).trim();
  const city = String(vendor.city || vendor.location || vendor.vendor?.city || "").trim();
  const vendorId =
    (typeof vendor.vendorId === "string" && vendor.vendorId) ||
    vendor.vendor?.id ||
    vendor.id;

  const fromTariffs = asArray(vendor.mealTariffs).map(fromTariff).filter(Boolean) as VendorMenuItem[];
  const fromPlans = asArray(vendor.mealPlans).map(fromTariff).filter(Boolean) as VendorMenuItem[];
  const fromFoodRates = asArray(vendor.foodRates).map(fromTariff).filter(Boolean) as VendorMenuItem[];
  const fromMenu = asArray(vendor.foodMenu || vendor.menu || vendor.menuItems || vendor.dishes)
    .map(fromTariff)
    .filter(Boolean) as VendorMenuItem[];
  const nested = vendor.vendor ? parseVendorFoodMenu(vendor.vendor) : null;
  const nestedVendorId = vendor.vendorId && typeof vendor.vendorId === "object"
    ? parseVendorFoodMenu(vendor.vendorId)
    : null;

  const seen = new Set<string>();
  const items: VendorMenuItem[] = [];
  [
    ...fromTariffs,
    ...fromPlans,
    ...fromFoodRates,
    ...fromMenu,
    ...(nested?.items || []),
    ...(nestedVendorId?.items || []),
  ].forEach((item) => {
    const key = `${item.type}|${item.name}|${item.inclusions}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  });

  let mealPlanLabel: string | undefined;
  if (typeof vendor.mealPlans === "string" && !vendor.mealPlans.trim().startsWith("[")) {
    mealPlanLabel = vendor.mealPlans.trim();
  }
  if (!mealPlanLabel && nested?.mealPlanLabel) mealPlanLabel = nested.mealPlanLabel;

  if (items.length === 0 && !mealPlanLabel) return null;
  return {
    vendorName: vendorName || nested?.vendorName || "Vendor",
    vendorId,
    city: city || nested?.city,
    items,
    mealPlanLabel,
  };
}

export type DayMealGroup = { type: string; dishes: string };

const MEAL_ORDER = ["Breakfast", "Lunch", "Dinner", "Snacks", "Thali", "Buffet"];

/** Full per-meal dish lists for a control-sheet day. Never collapse to just "Breakfast & Dinner" when dishes exist. */
export function formatDayMeals(
  menu: VendorMenuSource | null | undefined,
  itineraryMeals?: string,
): { groups: DayMealGroup[]; source: "vendor" | "itinerary" | "none" } {
  const buckets = new Map<string, string[]>();
  (menu?.items || []).forEach((item) => {
    const dishes = (item.inclusions || "").trim() || (item.name && item.name !== item.type ? item.name : "");
    if (!dishes) return;
    const list = buckets.get(item.type) || [];
    if (!list.includes(dishes)) list.push(dishes);
    buckets.set(item.type, list);
  });

  const groups: DayMealGroup[] = [];
  const used = new Set<string>();
  MEAL_ORDER.forEach((type) => {
    if (!buckets.has(type)) return;
    groups.push({ type, dishes: (buckets.get(type) || []).join("; ") });
    used.add(type);
  });
  buckets.forEach((dishes, type) => {
    if (used.has(type)) return;
    groups.push({ type, dishes: dishes.join("; ") });
  });

  if (groups.length > 0) return { groups, source: "vendor" };

  const stub = String(itineraryMeals || menu?.mealPlanLabel || "").trim();
  if (stub && stub !== "—") {
    return { groups: [{ type: "Plan", dishes: stub }], source: "itinerary" };
  }
  return { groups: [], source: "none" };
}

export function compactMealSummary(menu: VendorMenuSource | null | undefined, itineraryMeals?: string): string {
  const formatted = formatDayMeals(menu, itineraryMeals);
  if (formatted.source === "vendor") {
    return formatted.groups.map((g) => `${g.type}: ${g.dishes}`).join(" · ");
  }
  return formatted.groups[0]?.dishes || "";
}

export function namesRoughlyMatch(a: string, b: string): boolean {
  const na = String(a || "").trim().toLowerCase();
  const nb = String(b || "").trim().toLowerCase();
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

export function matchMenuToStay(
  menus: VendorMenuSource[],
  hotelName: string,
  stayLocation: string,
  vendorId?: string,
): VendorMenuSource | null {
  if (vendorId) {
    const byId = menus.find((m) => m.vendorId && String(m.vendorId) === String(vendorId));
    if (byId) return byId;
  }
  const hotel = String(hotelName || "").trim();
  const usableHotel =
    hotel &&
    hotel !== "—" &&
    !hotel.toUpperCase().includes("PENDING") &&
    !hotel.includes("Night Journey");
  if (usableHotel) {
    const withDishes = menus.find(
      (m) => namesRoughlyMatch(m.vendorName, hotel) && m.items.some((i) => i.inclusions),
    );
    if (withDishes) return withDishes;
    const byHotel = menus.find((m) => namesRoughlyMatch(m.vendorName, hotel));
    if (byHotel) return byHotel;
  }
  const stay = String(stayLocation || "").trim();
  if (!stay) return null;
  const byCityWithDishes = menus.find(
    (m) => m.city && namesRoughlyMatch(m.city, stay) && m.items.some((i) => i.inclusions),
  );
  if (byCityWithDishes) return byCityWithDishes;
  return menus.find((m) => m.city && namesRoughlyMatch(m.city, stay)) || null;
}
