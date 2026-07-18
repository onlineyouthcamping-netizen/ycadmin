// Frontend Role-Permission mapping mirroring the backend rules

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: [
    'dashboard.view', 'trips.view', 'trips.create', 'trips.edit', 'trips.publish',
    'trips.archive', 'trips.delete', 'bookings.view', 'bookings.create', 'bookings.edit',
    'bookings.approve', 'bookings.reject', 'payments.view', 'payments.edit', 'inquiries.view',
    'inquiries.create', 'inquiries.edit', 'quotations.view', 'quotations.create',
    'quotations.edit', 'customers.view', 'customers.export', 'pagebuilder.view',
    'pagebuilder.edit', 'seo.view', 'seo.edit', 'guides.view', 'guides.manage',
    'operations.view', 'operations.edit', 'reports.view', 'reports.export', 'users.view',
    'users.manage', 'roles.manage', 'audit.view', 'settings.view', 'settings.edit',
    'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.submit', 'tickets.approve',
    'tickets.reopen', 'tickets.bulk', 'tickets.templates.manage', 'tickets.alerts.view',
    'accounting.view', 'accounting.edit', 'emails.manage_templates'
  ],

  admin: [
    'dashboard.view', 'trips.view', 'trips.create', 'trips.edit', 'trips.publish',
    'trips.archive', 'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.approve',
    'bookings.reject', 'payments.view', 'payments.edit', 'inquiries.view', 'inquiries.create',
    'inquiries.edit', 'quotations.view', 'quotations.create', 'quotations.edit',
    'customers.view', 'guides.view', 'guides.manage', 'operations.view', 'operations.edit',
    'reports.view', 'reports.export', 'settings.view', 'hr.view',
    'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.submit', 'tickets.approve',
    'tickets.reopen', 'tickets.bulk', 'tickets.templates.manage', 'tickets.alerts.view',
    'accounting.view', 'accounting.edit', 'emails.manage_templates'
  ],

  sales: [
    'dashboard.view', 'bookings.view', 'bookings.create', 'bookings.edit', 'payments.view',
    'inquiries.view', 'inquiries.create', 'inquiries.edit', 'quotations.view',
    'quotations.create', 'quotations.edit', 'hr.view',
    'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.submit', 'tickets.bulk',
    'tickets.alerts.view'
  ],

  operations: [
    'dashboard.view', 'trips.view', 'bookings.view', 'bookings.edit', 'operations.view',
    'operations.edit', 'guides.view', 'hr.view',
    'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.submit', 'tickets.approve',
    'tickets.reopen', 'tickets.bulk', 'tickets.templates.manage', 'tickets.alerts.view'
  ],

  finance: [
    'dashboard.view', 'bookings.view', 'bookings.edit', 'payments.view', 'payments.edit',
    'reports.view', 'hr.view', 'accounting.view', 'accounting.edit'
  ],

  guide: [
    'dashboard.view', 'trips.view', 'bookings.view', 'operations.view', 'operations.edit', 'hr.view'
  ],

  viewer: [
    'dashboard.view', 'trips.view', 'bookings.view', 'inquiries.view', 'quotations.view',
    'reports.view'
  ],

  booking_verifier: [
    'dashboard.view', 'bookings.view', 'bookings.verify',
    'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.submit', 'tickets.approve',
    'tickets.reopen', 'tickets.bulk', 'tickets.templates.manage', 'tickets.alerts.view'
  ]
};

const ROLE_PERMISSIONS_SETS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(ROLE_PERMISSIONS).map(([k, v]) => [k, new Set(v)])
);

export function hasPermission(
  permissionsOrRole: readonly string[] | string | null | undefined,
  required: string,
  role?: string
): boolean {
  if (typeof permissionsOrRole === 'string') {
    const normalizedRole = permissionsOrRole.toLowerCase();
    if (normalizedRole === 'superadmin') return true;
    const set = ROLE_PERMISSIONS_SETS[normalizedRole];
    if (!set) return false;
    return set.has(required);
  }

  if (role?.toLowerCase() === "superadmin") return true;
  if (!permissionsOrRole) return false;
  return permissionsOrRole.includes(required);
}

export function hasAnyPermission(
  permissions: readonly string[] | null | undefined,
  requiredPermissions: string[],
  role?: string
): boolean {
  if (role?.toLowerCase() === "superadmin") return true;
  if (!permissions) return false;
  return requiredPermissions.some(p => permissions.includes(p));
}

export function hasAllPermissions(
  permissions: readonly string[] | null | undefined,
  requiredPermissions: string[],
  role?: string
): boolean {
  if (role?.toLowerCase() === "superadmin") return true;
  if (!permissions) return false;
  return requiredPermissions.every(p => permissions.includes(p));
}


