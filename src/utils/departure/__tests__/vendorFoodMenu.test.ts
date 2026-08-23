import { describe, expect, it } from "vitest";
import {
  compactMealSummary,
  formatDayMeals,
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
      }),
    });
    expect(menu?.mealPlanLabel).toBe("AP");
    expect(formatDayMeals(menu).groups.find((g) => g.type === "Lunch")?.dishes).toContain("seasonal sabzi");
  });

  it("groups lunch dishes in full rather than meal-type only", () => {
    const menu = parseVendorFoodMenu({
      name: "Hotel Lake View",
      mealTariffs: [
        { type: "LUNCH", name: "Packed Lunch", inclusions: "Veg pulav, pickle, banana, buttermilk" },
        { type: "DINNER", name: "Dinner Thali", inclusions: "Dal fry, jeera rice, roti, gulab jamun" },
      ],
    });
    const day = formatDayMeals(menu, "Breakfast & Dinner");
    expect(day.source).toBe("vendor");
    expect(day.groups.find((g) => g.type === "Lunch")?.dishes).toContain("Veg pulav");
    expect(day.groups.find((g) => g.type === "Dinner")?.dishes).toContain("gulab jamun");
  });
});
