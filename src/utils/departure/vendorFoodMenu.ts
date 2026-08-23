export type VendorMenuItem = {
  id?: string;
  name: string;
  type: string;
  inclusions: string;
  ratePerPerson?: number;
  isVeg?: boolean;
};

export type FoodMenuIncluded = {
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  snacks?: boolean;
};

export type VendorMenuSource = {
  vendorName: string;
  vendorId?: string;
  city?: string;
  aliases?: string[];
  items: VendorMenuItem[];
  mealPlanLabel?: string;
  included?: FoodMenuIncluded;
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
    t.inclusions || t.menuDescription || t.menuDescription || t.description || t.menu || t.dishes || t.items || "",
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
  const type = mealTypeLabel(t.type || t.mealType || t.mealType || t.category || name);
  if (!name && !inclusions) return null;
  const rate = Number(t.perPaxRate ?? t.ratePerPerson ?? t.rate ?? t.amount ?? 0);
  return {
    id: t.id || `menu-${idx}`,
    name: name || type,
    inclusions,
    type,
    ratePerPerson: Number.isFinite(rate) && rate > 0 ? rate : undefined,
    isVeg: t.isVeg !== false && t.veg !== false,
  };
}

function parseNotesMeta(notes: unknown): any {
  if (typeof notes !== "string" || !notes.trim().startsWith("{")) return {};
  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseIncluded(raw: unknown): FoodMenuIncluded | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const out: FoodMenuIncluded = {};
  (["breakfast", "lunch", "dinner", "snacks"] as const).forEach((k) => {
    if (typeof o[k] === "boolean") out[k] = o[k] as boolean;
  });
  return Object.keys(out).length ? out : undefined;
}

/** Infer inclusion from CP / MAP / AP / EP labels without overriding explicit flags. */
export function includedFromMealPlanLabel(label?: string): FoodMenuIncluded | undefined {
  const t = String(label || "").toUpperCase();
  if (!t) return undefined;
  if (/\bEP\b/.test(t) || t.includes("ROOM ONLY")) {
    return { breakfast: false, lunch: false, dinner: false, snacks: false };
  }
  if (/\bAP\b/.test(t) || t.includes("AMERICAN")) {
    return { breakfast: true, lunch: true, dinner: true };
  }
  if (/\bMAP\b/.test(t) || t.includes("MODIFIED")) {
    return { breakfast: true, lunch: false, dinner: true };
  }
  if (/\bCP\b/.test(t) || t.includes("CONTINENTAL")) {
    return { breakfast: true, lunch: false, dinner: false };
  }
  return undefined;
}

export function parseItineraryMealFlags(itineraryMeals?: string): FoodMenuIncluded | undefined {
  const raw = String(itineraryMeals || "").trim();
  if (!raw || raw === "—") return undefined;
  const t = raw.toUpperCase();
  const hasBreak = t.includes("BREAK");
  const hasLunch = t.includes("LUNCH");
  const hasDinner = t.includes("DINNER");
  const hasSnacks = t.includes("SNACK") || t.includes("TEA");
  if (!hasBreak && !hasLunch && !hasDinner && !hasSnacks) return undefined;
  return {
    breakfast: hasBreak,
    lunch: hasLunch,
    dinner: hasDinner,
    snacks: hasSnacks,
  };
}

function mealKeyForType(type: string): keyof FoodMenuIncluded | null {
  const t = String(type || "").toUpperCase();
  if (t.includes("BREAK")) return "breakfast";
  if (t.includes("LUNCH")) return "lunch";
  if (t.includes("DINNER")) return "dinner";
  if (t.includes("SNACK") || t.includes("TEA")) return "snacks";
  return null;
}

function isMealAllowed(
  type: string,
  itineraryFlags?: FoodMenuIncluded,
  vendorFlags?: FoodMenuIncluded,
): boolean {
  const key = mealKeyForType(type);
  if (!key) {
    return !itineraryFlags || Object.values(itineraryFlags).some(Boolean);
  }
  if (itineraryFlags && itineraryFlags[key] === false) return false;
  if (itineraryFlags && itineraryFlags[key] === true) {
    if (vendorFlags && vendorFlags[key] === false) return false;
    return true;
  }
  if (!itineraryFlags && vendorFlags && vendorFlags[key] === false) return false;
  return true;
}

function aliasList(vendor: any, meta: any): string[] {
  const raw = [
    vendor.serviceName,
    vendor.alias,
    vendor.hotelName,
    vendor.propertyName,
    vendor.displayName,
    ...(asArray(vendor.aliases)),
    ...(asArray(meta?.aliases)),
    ...(asArray(meta?.aka)),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  raw.forEach((x) => {
    const s = String(x || "").trim();
    if (!s) return;
    const k = s.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(s);
  });
  return out;
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

  const meta = parseNotesMeta(vendor.notes);
  const fromTariffs = asArray(vendor.mealTariffs || vendor.mealTariffs).map(fromTariff).filter(Boolean) as VendorMenuItem[];
  const fromPlans = asArray(vendor.mealPlans).map(fromTariff).filter(Boolean) as VendorMenuItem[];
  const fromFoodRates = asArray(vendor.foodRates || vendor.foodRates).map(fromTariff).filter(Boolean) as VendorMenuItem[];
  const fromMenu = asArray(vendor.foodMenu || vendor.menu || vendor.menuItems || vendor.dishes)
    .map(fromTariff)
    .filter(Boolean) as VendorMenuItem[];
  const fromNotes = asArray(meta?.foodMenu).map(fromTariff).filter(Boolean) as VendorMenuItem[];

  const nested = vendor.vendor ? parseVendorFoodMenu(vendor.vendor) : null;
  const nestedVendorId =
    vendor.vendorId && typeof vendor.vendorId === "object"
      ? parseVendorFoodMenu(vendor.vendorId)
      : null;

  const seen = new Set<string>();
  const items: VendorMenuItem[] = [];
  [
    ...fromTariffs,
    ...fromPlans,
    ...fromFoodRates,
    ...fromMenu,
    ...fromNotes,
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

  const included =
    parseIncluded(vendor.foodMenuIncluded) ||
    parseIncluded(meta?.foodMenuIncluded) ||
    nested?.included;

  const aliases = [
    ...aliasList(vendor, meta),
    ...(nested?.aliases || []),
  ];

  if (items.length === 0 && !mealPlanLabel) return null;
  return {
    vendorName: vendorName || nested?.vendorName || "Vendor",
    vendorId,
    city: city || nested?.city,
    aliases: aliases.length ? aliases : undefined,
    items,
    mealPlanLabel,
    included,
  };
}

export type DayMealGroup = { type: string; dishes: string };

const MEAL_ORDER = ["Breakfast", "Lunch", "Dinner", "Snacks", "Thali", "Buffet"];

export function tidyMealPlanLabel(raw: string): string {
  return String(raw || "")
    .replace(/^\s*PLAN\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function joinMealNames(parts: string[]): string {
  const unique: string[] = [];
  parts.forEach((p) => {
    if (!unique.includes(p)) unique.push(p);
  });
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} & ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")} & ${unique[unique.length - 1]}`;
}

/** Booking/itinerary strings like "Break, LUNCH & dINNER" → "Breakfast, Lunch & Dinner". */
export function titleCaseMealPlan(raw: string): string {
  const t = tidyMealPlanLabel(raw);
  if (!t) return "";
  const u = t.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
  if (u === "EP" || u.includes("ROOM ONLY")) return "Room only";
  if (u === "AP") return "Breakfast, Lunch & Dinner";
  if (u === "MAP") return "Breakfast & Dinner";
  if (u === "CP") return "Breakfast";

  const parts: string[] = [];
  if (/\bBREAK/.test(u) || /\bBF\b/.test(u)) parts.push("Breakfast");
  if (/\bLUNCH/.test(u)) parts.push("Lunch");
  if (/\bDINNER/.test(u)) parts.push("Dinner");
  if (/\bSNACK/.test(u) || /\bTEA/.test(u)) parts.push("Snacks");
  const named = joinMealNames(parts);
  if (named) return named;
  return t.replace(/\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function flattenDishes(text: string): string {
  return text
    .split(/[\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

/** Full per-meal dish lists for a control-sheet day. Never collapse to just "Breakfast & Dinner" when dishes exist. */
export function formatDayMeals(
  menu: VendorMenuSource | null | undefined,
  itineraryMeals?: string,
): { groups: DayMealGroup[]; source: "vendor" | "itinerary" | "none" } {
  const itineraryFlags = parseItineraryMealFlags(itineraryMeals);
  const buckets = new Map<string, string[]>();
  (menu?.items || []).forEach((item) => {
    if (!isMealAllowed(item.type, itineraryFlags, menu?.included)) return;
    const dishes =
      (item.inclusions || "").trim() || (item.name && item.name !== item.type ? item.name : "");
    if (!dishes) return;
    const list = buckets.get(item.type) || [];
    const flat = flattenDishes(dishes);
    if (flat && !list.includes(flat)) list.push(flat);
    buckets.set(item.type, list);
  });

  const groups: DayMealGroup[] = [];
  const used = new Set<string>();
  MEAL_ORDER.forEach((type) => {
    if (!buckets.has(type)) return;
    groups.push({ type, dishes: (buckets.get(type) || []).join(", ") });
    used.add(type);
  });
  buckets.forEach((dishes, type) => {
    if (used.has(type)) return;
    groups.push({ type, dishes: dishes.join(", ") });
  });

  if (groups.length > 0) return { groups, source: "vendor" };

  const stub = titleCaseMealPlan(String(itineraryMeals || menu?.mealPlanLabel || ""));
  if (stub && stub !== "—") {
    return { groups: [{ type: "Meals", dishes: stub }], source: "itinerary" };
  }
  return { groups: [], source: "none" };
}

export function collapseIdenticalMealGroups(groups: DayMealGroup[]): DayMealGroup[] {
  const byDish = new Map<string, string[]>();
  groups.forEach((g) => {
    const key = flattenDishes(g.dishes).toLowerCase();
    if (!key) return;
    const types = byDish.get(key) || [];
    const label = g.type === "Meals" ? titleCaseMealPlan(g.dishes) : g.type;
    if (!types.includes(label)) types.push(label);
    byDish.set(key, types);
  });
  const out: DayMealGroup[] = [];
  byDish.forEach((types, key) => {
    const dishes = groups.find((g) => flattenDishes(g.dishes).toLowerCase() === key)?.dishes || "";
    out.push({ type: joinMealNames(types), dishes });
  });
  return out;
}

export function mealChipLabel(
  groups: DayMealGroup[],
  itineraryMeals?: string,
  source?: "vendor" | "itinerary" | "none",
): string {
  if (source === "vendor") {
    const types = groups.map((g) => g.type).filter((t) => t && t !== "Meals");
    if (types.length) return joinMealNames(types);
  }
  return titleCaseMealPlan(itineraryMeals || groups[0]?.dishes || "") || groups[0]?.dishes || "";
}

export function compactMealSummary(menu: VendorMenuSource | null | undefined, itineraryMeals?: string): string {
  const formatted = formatDayMeals(menu, itineraryMeals);
  if (formatted.source === "vendor") {
    return formatted.groups.map((g) => `${g.type}: ${g.dishes}`).join(" · ");
  }
  return formatted.groups[0]?.dishes || "";
}

const GENERIC_STAY_TOKENS = new Set([
  "hotel",
  "stay",
  "cottage",
  "camp",
  "homestay",
  "resort",
  "inn",
  "lodge",
  "guest",
  "house",
  "night",
  "journey",
  "pending",
  "standard",
  "property",
  "rooms",
  "room",
  "the",
  "and",
  "for",
  "near",
]);

export function distinctiveNameTokens(raw: string): string[] {
  return String(raw || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !GENERIC_STAY_TOKENS.has(t));
}

export function namesRoughlyMatch(a: string, b: string): boolean {
  const na = String(a || "").trim().toLowerCase();
  const nb = String(b || "").trim().toLowerCase();
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const ta = distinctiveNameTokens(na);
  const tb = distinctiveNameTokens(nb);
  if (ta.length === 0 || tb.length === 0) return false;
  return ta.some((t) => tb.includes(t) || nb.includes(t)) || tb.some((t) => na.includes(t));
}

function vendorLabels(menu: VendorMenuSource): string[] {
  return [menu.vendorName, ...(menu.aliases || [])].filter(Boolean);
}

function menuMatchesHotel(menu: VendorMenuSource, hotel: string): boolean {
  return vendorLabels(menu).some((label) => namesRoughlyMatch(label, hotel));
}

function menuMatchesCity(menu: VendorMenuSource, place: string): boolean {
  if (!place) return false;
  if (menu.city && namesRoughlyMatch(menu.city, place)) return true;
  const placeTokens = distinctiveNameTokens(place);
  if (menu.city) {
    const cityTokens = distinctiveNameTokens(menu.city);
    if (cityTokens.some((t) => placeTokens.includes(t) || place.toLowerCase().includes(t))) return true;
  }
  return false;
}

function pickPreferred(candidates: VendorMenuSource[]): VendorMenuSource | null {
  if (candidates.length === 0) return null;
  const withDishes = candidates.find((m) => m.items.some((i) => i.inclusions));
  return withDishes || candidates[0];
}

export function matchMenuToStay(
  menus: VendorMenuSource[],
  hotelName: string,
  stayLocation: string,
  vendorId?: string,
): VendorMenuSource | null {
  if (vendorId) {
    const byId = menus.filter((m) => m.vendorId && String(m.vendorId) === String(vendorId));
    const picked = pickPreferred(byId);
    if (picked) return picked;
  }
  const hotel = String(hotelName || "").trim();
  const usableHotel =
    hotel &&
    hotel !== "—" &&
    !hotel.toUpperCase().includes("PENDING") &&
    !hotel.includes("Night Journey");
  if (usableHotel) {
    const byHotel = menus.filter((m) => menuMatchesHotel(m, hotel));
    const picked = pickPreferred(byHotel);
    if (picked) return picked;
    const byHotelCity = menus.filter((m) => menuMatchesCity(m, hotel));
    const cityPick = pickPreferred(byHotelCity);
    if (cityPick) return cityPick;
  }
  const stay = String(stayLocation || "").trim();
  if (!stay) return null;
  const byStay = menus.filter((m) => menuMatchesCity(m, stay) || menuMatchesHotel(m, stay));
  return pickPreferred(byStay);
}

const MEALS_LINE = /^\s*(meals?|meal plan|food|breakfast|lunch|dinner)\s*[:\-–]/i;
const HOTEL_LINE = /^\s*(hotel\/?\s*stay|hotel|stay|accommodation|property)\s*[:\-–]/i;
const DUMP_LINE =
  /^\s*(itinerary|package|inclusions?|exclusions?|day\s*\d+|overnight|check[- ]?in|check[- ]?out)\s*[:\-–]?/i;
const KEEP_HINT = /report|pickup|pick-up|pick up|reporting|assembly|briefing|activity|activities|rafting|trek|permit|timing|time\b/i;

export function compactTripControlRemarks(
  raw: string,
  opts?: { hotelName?: string },
): string {
  const text = String(raw || "").trim();
  if (!text) return "";
  const hotel = String(opts?.hotelName || "").trim().toLowerCase();
  const chunks = text
    .split(/\n+|•+|;\s+(?=[A-Z])/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const kept: string[] = [];
  for (const line of chunks) {
    if (MEALS_LINE.test(line)) continue;
    if (HOTEL_LINE.test(line)) continue;
    if (/^\s*meals?\b/i.test(line) && /breakfast|lunch|dinner/i.test(line)) continue;
    if (hotel && hotel !== "—" && !hotel.includes("pending") && namesRoughlyMatch(line, hotel) && line.length < 80) {
      continue;
    }
    if (DUMP_LINE.test(line) && !KEEP_HINT.test(line)) continue;
    kept.push(line);
  }

  const useful = kept.filter((line) => KEEP_HINT.test(line) || line.length <= 140);
  const compact = (useful.length ? useful : kept).join(" · ");
  if (!compact) return "";
  if (compact.length > 220 && useful.length) return useful.slice(0, 3).join(" · ");
  if (compact.length > 280) return `${compact.slice(0, 260).trim()}…`;
  return compact;
}
