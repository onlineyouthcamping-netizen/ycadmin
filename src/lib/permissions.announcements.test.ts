import { describe, expect, it } from "vitest";
import { hasPermission, PERMISSIONS, ROLE_PERMISSIONS } from "./permissions";
import { generalWidgets } from "@/modules/general/general.widgets";

describe("announcements dashboard widget permissions", () => {
  const announcementsWidget = generalWidgets.find((w) => w.id === "announcements");

  it("registers the announcements widget behind announcements.view", () => {
    expect(announcementsWidget).toBeDefined();
    expect(announcementsWidget?.permission).toBe(PERMISSIONS.ANNOUNCEMENTS_VIEW);
  });

  it("grants announcements.view to staff roles so the widget is visible", () => {
    const staffRoles = [
      "operations",
      "sales",
      "finance",
      "finance_controller",
      "admin",
      "guide",
      "viewer",
      "booking_verifier",
    ];

    for (const role of staffRoles) {
      expect(
        ROLE_PERMISSIONS[role]?.includes(PERMISSIONS.ANNOUNCEMENTS_VIEW),
        `${role} should include announcements.view`,
      ).toBe(true);
      expect(
        hasPermission([], PERMISSIONS.ANNOUNCEMENTS_VIEW, role),
        `${role} should pass hasPermission for announcements.view`,
      ).toBe(true);
    }
  });

  it("keeps announcement create (+ Add) gated to settings.view, not all staff", () => {
    expect(hasPermission([], PERMISSIONS.SETTINGS_VIEW, "operations")).toBe(
      false,
    );
    expect(hasPermission([], PERMISSIONS.SETTINGS_VIEW, "sales")).toBe(false);
    expect(hasPermission([], PERMISSIONS.SETTINGS_VIEW, "admin")).toBe(true);
    expect(hasPermission([], PERMISSIONS.SETTINGS_VIEW, "founder")).toBe(true);
    expect(hasPermission([], PERMISSIONS.SETTINGS_VIEW, "superadmin")).toBe(
      true,
    );
  });
});
