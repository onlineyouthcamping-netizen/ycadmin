import { describe, expect, it } from "vitest";
import {
  compactMealSummary,
  compactTripControlRemarks,
  formatDayMeals,
  matchMenuToStay,
  parseVendorFoodMenu,
} from "../vendorFoodMenu";

describe("vendorFoodMenu", () => {
  it("parses mealPlans JSON tariffs from vendor directory", () => {
    const menu = parseVendorFoodMenu({
      name: "Hotel Lake View",
      city: "Munnar",
      mealPlans: JSON.stringify([
        {
          id: "1",
          name: "Group Breakfast",
          type: "BREAKFAST",
          inclusions: "Tea, Paratha, Puri Bhaji",
          perPaxRate: 150,
          isVeg: true,
        },
        {
          id: "2",
          name: "Dinner Thali",
          type: "DINNER",
          inclusions: "Dal, Rice, Sabzi, Roti",
          perPaxRate: 350,
          isVeg: true,
        },
      ]),
    });
    expect(menu?.items).toHaveLength(2);
    expect(menu?.items[0].inclusions).toContain("Paratha");
    expect(compactMealSummary(menu)).toContain("Tea, Paratha, Puri Bhaji");
    expect(compactMealSummary(menu)).toContain("Dal, Rice");
    expect(compactMealSummary(menu, "Breakfast & Dinner")).toContain("Paratha");
  });

  it("parses DirectoryVendorFoodRate rows", () => {
    const menu = parseVendorFoodMenu({
      name: "Hill Kitchen",
      foodRates: [
        { mealType: "LUNCH", menuDescription: "Veg thali + buttermilk", ratePerPerson: 220, isVeg: true },
      ],
    });
    expect(menu?.items[0].type).toBe("Lunch");
    expect(menu?.items[0].inclusions).toContain("buttermilk");
  });

  it("parses foodMenu persisted on vendor notes for hotel profiles", () => {
    const menu = parseVendorFoodMenu({
      name: "Barpa Cottage",
      city: "Manali",
      mealPlans: "AP",
      notes: JSON.stringify({
        foodMenu: [
          { type: "LUNCH", name: "Lunch", inclusions: "Dal, rice, seasonal sabzi, roti" },
        ],
        foodMenuIncluded: { breakfast: false, lunch: true, dinner: true, snacks: false },
      }),
    });
    expect(menu?.mealPlanLabel).toBe("AP");
    expect(menu?.included?.breakfast).toBe(false);
    expect(formatDayMeals(menu).groups.find((g) => g.type === "Lunch")?.dishes).toContain("seasonal sabzi");
  });

  it("hides breakfast dishes when breakfast is not included", () => {
    const menu = parseVendorFoodMenu({
      name: "Barpa Cottage",
      foodMenu: [
        { type: "BREAKFAST", name: "Breakfast", inclusions: "poha, paratha" },
        { type: "DINNER", name: "Dinner", inclusions: "dal, rice, roti" },
      ],
      foodMenuIncluded: { breakfast: false, lunch: false, dinner: true, snacks: false },
    });
    const day = formatDayMeals(menu, "Breakfast & Dinner");
    expect(day.groups.find((g) => g.type === "Breakfast")).toBeUndefined();
    expect(day.groups.find((g) => g.type === "Dinner")?.dishes).toContain("dal, rice, roti");
  });

  it("gates vendor dishes by itinerary meal plan and strips PLAN prefix", () => {
    const menu = parseVendorFoodMenu({
      name: "Hotel Lake View",
      mealTariffs: [
        { type: "LUNCH", name: "Packed Lunch", inclusions: "Veg pulav, pickle, banana, buttermilk" },
        { type: "DINNER", name: "Dinner Thali", inclusions: "Dal fry, jeera rice, roti, gulab jamun" },
      ],
    });
    const day = formatDayMeals(menu, "PLAN Breakfast & Dinner");
    expect(day.source).toBe("vendor");
    expect(day.groups.find((g) => g.type === "Lunch")).toBeUndefined();
    expect(day.groups.find((g) => g.type === "Dinner")?.dishes).toContain("gulab jamun");

    const fallback = formatDayMeals(null, "PLAN Breakfast & Dinner");
    expect(fallback.source).toBe("itinerary");
    expect(fallback.groups[0]?.dishes).toBe("Breakfast & Dinner");
  });

  it("matches hotel stay by alias, substring, and city in itinerary hotel text", () => {
    const menus = [
      parseVendorFoodMenu({
        name: "Barpa Cottage",
        city: "Chitkul",
        aliases: ["Barpa"],
        foodMenu: [{ type: "DINNER", name: "Dinner", inclusions: "dal, rice" }],
      })!,
    ];
    expect(matchMenuToStay(menus, "Cottage in Chitkul/Sangla", "Sangla")?.vendorName).toBe("Barpa Cottage");
    expect(matchMenuToStay(menus, "Stay at Barpa", "Kinnaur")?.vendorName).toBe("Barpa Cottage");
  });

  it("strips duplicated meals and hotel lines from trip-control remarks", () => {
    const raw = [
      "Meals: Breakfast & Dinner",
      "Hotel/stay: Barpa Cottage",
      "Reporting time: 7:30 AM at Reckong Peo bus stand",
      "Day 3 itinerary dump with overnight stay and inclusions list",
    ].join("\n");
    const compact = compactTripControlRemarks(raw, { hotelName: "Barpa Cottage" });
    expect(compact.toLowerCase()).not.toContain("meals:");
    expect(compact.toLowerCase()).not.toContain("hotel/stay");
    expect(compact).toContain("Reporting time");
  });
});
