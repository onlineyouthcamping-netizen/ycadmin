import { describe, it, expect } from "vitest";
import { SETTINGS_TABS, isTabVisible } from "../pages/admin/settings/constants/tabs";
import { calculatePasswordStrength } from "../pages/admin/settings/components/PasswordStrengthMeter";

describe("Settings Page & Tab System Suite", () => {
  it("should define all 10 settings tabs with labels and icons", () => {
    expect(SETTINGS_TABS.length).toBe(10);
    const tabIds = SETTINGS_TABS.map((t) => t.id);
    expect(tabIds).toEqual([
      "account",
      "ui-notifications",
      "security",
      "devices",
      "preferences",
      "audit",
      "api-keys",
      "privacy",
      "billing",
      "integrations"
    ]);
  });

  it("should show all 10 tabs for Founder superadmin", () => {
    const founderEmail = "hemal.patel@youthcamping.online";
    const visibleTabs = SETTINGS_TABS.filter((t) => isTabVisible(t, "superadmin", founderEmail));
    expect(visibleTabs.length).toBe(10);
  });

  it("should hide Founder-only tabs for sales and operations roles", () => {
    const salesEmail = "sales@youthcamping.online";
    const salesTabs = SETTINGS_TABS.filter((t) => isTabVisible(t, "sales", salesEmail));
    
    // Founder-only (billing, api-keys) and admin-only (audit, integrations) must be restricted
    const salesTabIds = salesTabs.map((t) => t.id);
    expect(salesTabIds).not.toContain("billing");
    expect(salesTabIds).not.toContain("api-keys");
    expect(salesTabIds).not.toContain("audit");
    expect(salesTabIds).not.toContain("integrations");
    expect(salesTabs.length).toBe(6);
  });

  it("should accurately compute password strength scores", () => {
    expect(calculatePasswordStrength("123").score).toBe(1);
    expect(calculatePasswordStrength("12345678").score).toBe(2);
    expect(calculatePasswordStrength("Password123").score).toBe(3);
    expect(calculatePasswordStrength("Super@Secret2026!").score).toBe(4);
  });
});
