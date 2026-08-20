export type PermissionKey =
  | "dashboard.view"
  | "trips.view"
  | "trips.create"
  | "trips.edit"
  | "trips.publish"
  | "trips.archive"
  | "trips.delete"
  | "bookings.view"
  | "bookings.create"
  | "bookings.edit"
  | "bookings.approve"
  | "bookings.reject"
  | "bookings.verify"
  | "payments.view"
  | "payments.edit"
  | "inquiries.view"
  | "inquiries.create"
  | "inquiries.edit"
  | "quotations.view"
  | "quotations.create"
  | "quotations.edit"
  | "customers.view"
  | "customers.export"
  | "customers.timeline.view"
  | "seo.view"
  | "seo.edit"
  | "guides.view"
  | "guides.manage"
  | "operations.view"
  | "operations.edit"
  | "ops.view"
  | "ops.manage"
  | "ops.allocate"
  | "ops.checklist"
  | "vendors.view"
  | "vendors.create"
  | "vendors.edit"
  | "vendors.import"
  | "reports.view"
  | "reports.export"
  | "users.view"
  | "users.manage"
  | "roles.manage"
  | "staff_profiles.view"
  | "staff_profiles.manage"
  | "roles_permissions.manage"
  | "payroll.view"
  | "payroll.manage"
  | "attendance.view"
  | "attendance.manage"
  | "marketing.social"
  | "accounting.view"
  | "accounting.submit"
  | "accounting.approve"
  | "finance.control_center.view"
  | "finance.incoming.verify"
  | "finance.incoming.approve"
  | "finance.cash.verify"
  | "finance.cash.approve"
  | "finance.cash.reject"
  | "finance.outgoing.verify"
  | "finance.outgoing.approve"
  | "finance.outgoing.pay"
  | "finance.tickets.verify"
  | "finance.tickets.approve"
  | "finance.refund.create"
  | "finance.refund.view"
  | "finance.refund.approve"
  | "finance.refund.reject"
  | "finance.credit.view"
  | "finance.credit.apply"
  | "finance.coupons.view"
  | "finance.coupons.manage"
  | "finance.ticketing.view"
  | "finance.ticketing.create"
  | "finance.ticketing.verify"
  | "finance.ticketing.approve"
  | "finance.ticketing.bulk"
  | "finance.services.view"
  | "finance.services.manage"
  | "finance.services.verify"
  | "finance.tasks.view"
  | "finance.tasks.manage"
  | "finance.tasks.comment"
  | "finance.audit.view"
  | "finance.audit.export"
  | "finance.accounting.view"
  | "finance.accounting.manage"
  | "finance.discrepancy.manage"
  | "finance.reports.export"
  | "tickets.view"
  | "tickets.create"
  | "tickets.edit"
  | "tickets.submit"
  | "tickets.approve"
  | "tickets.templates.manage"
  | "emails.view"
  | "emails.send"
  | "emails.manage_templates"
  | "company_documents.view"
  | "audit.view"
  | "hr.view"
  | "settings.view"
  | "settings.edit";

type FounderUser = {
  role?: string;
  email?: string | null;
  name?: string | null;
  isSuperuser?: boolean;
} | null;

/** Route-guard: founder-only pages (App.tsx `founderOnly` routes). */
export function isFounder(user: FounderUser): boolean {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  return (
    user.role === "superadmin" &&
    (email === "hemal.patel@youthcamping.online" || email.includes("hemal"))
  );
}

/** Email-based founder identity (Hemal Patel). */
export function isFounderByEmail(user: FounderUser): boolean {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  return (
    email.includes("hemal") || email === "hemal.patel@youthcamping.online"
  );
}

/** Nav access for staff/users/access-control (email or name match). */
export function isFounderIdentity(user: FounderUser): boolean {
  if (!user) return false;
  const name = (user.name || "").toLowerCase().trim();
  return isFounderByEmail(user) || name.includes("hemal");
}

/** Display label: founder by email or superadmin role. */
export function isFounderForDisplay(user: FounderUser): boolean {
  if (!user) return false;
  return isFounderByEmail(user) || user.role === "superadmin";
}

/** Mobile nav: founder email or elevated roles. */
export function isMobileNavFounder(user: FounderUser): boolean {
  if (!user) return false;
  return (
    isFounderByEmail(user) ||
    user.role === "superadmin" ||
    user.role === "admin"
  );
}

/** Finance approvals: superuser / founder / admin / hemal email. */
export function isSuperuserFounder(user: FounderUser): boolean {
  if (!user) return false;
  const userRole = (user.role || "").toLowerCase();
  return (
    ["superadmin", "founder", "admin"].includes(userRole) ||
    !!user.isSuperuser ||
    isFounderByEmail(user)
  );
}
