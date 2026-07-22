import { ADMIN_ROUTES } from "../config/routes.config";
import { COMPONENT_REGISTRY } from "../config/componentRegistry";
import { isFounder } from "../config/permissions.config";

describe("Frontend Navigation & Central Route Configuration Suite", () => {
  test("Every route in ADMIN_ROUTES has a matching component in COMPONENT_REGISTRY", () => {
    ADMIN_ROUTES.forEach((route) => {
      expect(COMPONENT_REGISTRY[route.id]).toBeDefined();
    });
  });

  test("Every navigation route has valid label, path, and iconName", () => {
    const navRoutes = ADMIN_ROUTES.filter((r) => r.navigation?.visible);
    navRoutes.forEach((route) => {
      expect(route.label).toBeTruthy();
      expect(route.path.startsWith("/admin")).toBe(true);
      expect(route.navigation?.iconName).toBeTruthy();
    });
  });

  test("isFounder utility strictly identifies Hemal Patel as superadmin", () => {
    const founderUser = { role: "superadmin", email: "hemal.patel@youthcamping.online", name: "Hemal Patel" };
    const managerUser = { role: "admin", email: "suresh.chaudhary@youthcamping.online", name: "Suresh Chaudhary" };
    const salesUser = { role: "sales", email: "zeel.panchal@youthcamping.online", name: "Zeel Panchal" };

    expect(isFounder(founderUser)).toBe(true);
    expect(isFounder(managerUser)).toBe(false);
    expect(isFounder(salesUser)).toBe(false);
  });

  test("Founder-only routes are correctly flagged in metadata", () => {
    const founderRoutes = ADMIN_ROUTES.filter((r) => r.founderOnly);
    const founderRouteIds = founderRoutes.map((r) => r.id);

    expect(founderRouteIds).toContain("staff-profiles");
    expect(founderRouteIds).toContain("staff-profile-detail");
    expect(founderRouteIds).toContain("roles-permissions");
    expect(founderRouteIds).toContain("audit-logs");
  });
});
