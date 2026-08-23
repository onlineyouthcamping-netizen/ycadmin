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
  if (t.includes("SNACK")) return "Snacks";
  if (t.includes("THALI")) return "Thali";
  if (t === "MAP" || t === "AP" || t === "CP" || t === "EP") return t;
  return raw || "Meal";
}

function fromTariff(t: any, idx: number): VendorMenuItem | null {
  if (!t || typeof t !== "object") return null;
  const name = String(t.name || t.mealType || t.title || "").trim();
  const inclusions = String(
    t.inclusions || t.menuDescription || t.description || t.items || "",
  ).trim();
  const type = mealTypeLabel(t.type || t.mealType || name);
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
  const vendorId = vendor.id || vendor.vendorId || vendor.vendor?.id;

  const fromTariffs = asArray(vendor.mealTariffs)
    .map(fromTariff)
    .filter(Boolean) as VendorMenuItem[];
  const fromPlans = asArray(vendor.mealPlans)
    .map(fromTariff)
    .filter(Boolean) as VendorMenuItem[];
  const fromFoodRates = asArray(vendor.foodRates)
    .map(fromTariff)
    .filter(Boolean) as VendorMenuItem[];
  const nested = vendor.vendor ? parseVendorFoodMenu(vendor.vendor) : null;

  const seen = new Set<string>();
  const items: VendorMenuItem[] = [];
  [...fromTariffs, ...fromPlans, ...fromFoodRates, ...(nested?.items || [])].forEach((item) => {
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

export function compactMealSummary(menu: VendorMenuSource | null | undefined, itineraryMeals?: string): string {
  if (itineraryMeals && itineraryMeals !== "—") {
    if (menu?.items?.length) return itineraryMeals;
    return itineraryMeals;
  }
  if (!menu) return "";
  if (menu.items.length > 0) {
    const types = [...new Set(menu.items.map((i) => i.type))];
    return types.join(" · ");
  }
  return menu.mealPlanLabel || "";
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
): VendorMenuSource | null {
  const hotel = String(hotelName || "").trim();
  if (hotel && hotel !== "—" && !hotel.toUpperCase().includes("PENDING") && !hotel.includes("Night Journey")) {
    const byHotel = menus.find((m) => namesRoughlyMatch(m.vendorName, hotel));
    if (byHotel) return byHotel;
  }
  const stay = String(stayLocation || "").trim();
  if (!stay) return null;
  return (
    menus.find((m) => m.city && namesRoughlyMatch(m.city, stay)) ||
    null
  );
}
