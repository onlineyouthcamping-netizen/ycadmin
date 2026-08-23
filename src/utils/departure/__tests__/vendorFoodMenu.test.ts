import { describe, expect, it } from "vitest";
import { compactMealSummary, parseVendorFoodMenu } from "../vendorFoodMenu";

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
    expect(compactMealSummary(menu)).toBe("Breakfast · Dinner");
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
});
