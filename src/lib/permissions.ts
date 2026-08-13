// Frontend Role-Permission mapping mirroring the backend rules

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  BOOKINGS_VIEW: "bookings.view",
  BOOKINGS_VERIFY: "bookings.verify",
  ACCOUNTING_VIEW: "accounting.view",
  USERS_VIEW: "users.view",
  TASKS_VIEW: "tasks.view",
  VENDORS_VIEW: "vendors.view",
  TRIPS_VIEW: "trips.view",
  OPS_VIEW: "ops.view",
  ANNOUNCEMENTS_VIEW: "announcements.view",
  SETTINGS_VIEW: "settings.view",
  REPORTS_VIEW: "reports.view",
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: [
    "dashboard.view",
    "trips.view",
    "trips.create",
    "trips.edit",
    "trips.publish",
    "trips.archive",
    "trips.delete",
    "bookings.view",
    "bookings.create",
    "bookings.edit",
    "bookings.approve",
    "bookings.reject",
    "payments.view",
    "payments.edit",
    "inquiries.view",
    "inquiries.create",
    "inquiries.edit",
    "quotations.view",
    "quotations.create",
    "quotations.edit",
    "customers.view",
    "customers.export",
    "pagebuilder.view",
    "pagebuilder.edit",
    "seo.view",
    "seo.edit",
    "guides.view",
    "guides.manage",
    "operations.view",
    "operations.edit",
    "reports.view",
    "reports.export",
    "users.view",
    "users.manage",
    "roles.manage",
    "audit.view",
    "settings.view",
    "settings.edit",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.submit",
    "tickets.approve",
    "tickets.reopen",
    "tickets.bulk",
    "tickets.templates.manage",
    "tickets.alerts.view",
    "accounting.view",
    "accounting.edit",
    "emails.manage_templates",
    "station_payments.view",
    "station_payments.collect",
    "station_payments.edit_before_handover",
    "station_payments.cancel",
    "station_payments.handover",
    "station_payments.receive",
    "station_payments.reconcile",
    "station_payments.export",
    "station_payments.resend_receipt",
    "station_payments.manage_accounts",
    "station_payments.verify_upi",
  ],

  admin: [
    "dashboard.view",
    "trips.view",
    "trips.create",
    "trips.edit",
    "trips.publish",
    "trips.archive",
    "bookings.view",
    "bookings.create",
    "bookings.edit",
    "bookings.approve",
    "bookings.reject",
    "payments.view",
    "payments.edit",
    "inquiries.view",
    "inquiries.create",
    "inquiries.edit",
    "quotations.view",
    "quotations.create",
    "quotations.edit",
    "customers.view",
    "guides.view",
    "guides.manage",
    "operations.view",
    "operations.edit",
    "reports.view",
    "reports.export",
    "settings.view",
    "hr.view",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.submit",
    "tickets.approve",
    "tickets.reopen",
    "tickets.bulk",
    "tickets.templates.manage",
    "tickets.alerts.view",
    "emails.manage_templates",
    "station_payments.view",
    "station_payments.collect",
    "station_payments.handover",
    "station_payments.receive",
    "station_payments.reconcile",
    "station_payments.resend_receipt",
  ],

  sales: [
    "dashboard.view",
    "bookings.view",
    "bookings.create",
    "bookings.edit",
    "payments.view",
    "inquiries.view",
    "inquiries.create",
    "inquiries.edit",
    "quotations.view",
    "quotations.create",
    "quotations.edit",
    "hr.view",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.submit",
    "tickets.bulk",
    "tickets.alerts.view",
  ],

  operations: [
    "dashboard.view",
    "trips.view",
    "bookings.view",
    "bookings.edit",
    "operations.view",
    "operations.edit",
    "guides.view",
    "hr.view",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.submit",
    "tickets.approve",
    "tickets.reopen",
    "tickets.bulk",
    "tickets.templates.manage",
    "tickets.alerts.view",
    "station_payments.view",
    "station_payments.collect",
    "station_payments.handover",
  ],

  finance: [
    "dashboard.view",
    "bookings.view",
    "bookings.edit",
    "payments.view",
    "payments.edit",
    "reports.view",
    "hr.view",
    "accounting.view",
    "accounting.edit",
    "station_payments.view",
    "station_payments.collect",
    "station_payments.receive",
    "station_payments.reconcile",
    "station_payments.manage_accounts",
  ],

  guide: [
    "dashboard.view",
    "trips.view",
    "bookings.view",
    "operations.view",
    "operations.edit",
    "hr.view",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.submit",
    "tickets.approve",
  ],

  viewer: [
    "dashboard.view",
    "trips.view",
    "bookings.view",
    "inquiries.view",
    "quotations.view",
    "reports.view",
  ],

  booking_verifier: [
    "dashboard.view",
    "bookings.view",
    "bookings.verify",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.submit",
    "tickets.approve",
    "tickets.reopen",
    "tickets.bulk",
    "tickets.templates.manage",
    "tickets.alerts.view",
  ],
};

const ROLE_PERMISSIONS_SETS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(ROLE_PERMISSIONS).map(([k, v]) => [k, new Set(v)]),
);

export function hasPermission(
  permissionsOrRole: readonly string[] | string | null | undefined,
  required: string,
  role?: string,
): boolean {
  if (typeof permissionsOrRole === "string") {
    const normalizedRole = permissionsOrRole.toLowerCase();
    if (normalizedRole === "superadmin" || normalizedRole === "founder") return true;
    const set = ROLE_PERMISSIONS_SETS[normalizedRole];
    if (!set) return false;
    return set.has(required);
  }

  const normRole = role?.toLowerCase();
  if (normRole === "superadmin" || normRole === "founder") return true;

  if (role) {
    const normalizedRole = role.toLowerCase();
    const roleSet = ROLE_PERMISSIONS_SETS[normalizedRole];
    if (roleSet && roleSet.has(required)) return true;
  }

  if (!permissionsOrRole) return false;
  return permissionsOrRole.includes(required);
}

export function hasAnyPermission(
  permissions: readonly string[] | null | undefined,
  requiredPermissions: string[],
  role?: string,
): boolean {
  const normRole = role?.toLowerCase();
  if (normRole === "superadmin" || normRole === "founder") return true;
  if (!permissions) return false;
  return requiredPermissions.some((p) => permissions.includes(p));
}

export function hasAllPermissions(
  permissions: readonly string[] | null | undefined,
  requiredPermissions: string[],
  role?: string,
): boolean {
  const normRole = role?.toLowerCase();
  if (normRole === "superadmin" || normRole === "founder") return true;
  if (!permissions) return false;
  return requiredPermissions.every((p) => permissions.includes(p));
}
