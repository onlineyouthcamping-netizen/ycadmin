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
    'users.manage', 'roles.manage', 'audit.view', 'settings.view', 'settings.edit'
  ],

  admin: [
    'dashboard.view', 'trips.view', 'trips.create', 'trips.edit', 'trips.publish',
    'trips.archive', 'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.approve',
    'bookings.reject', 'payments.view', 'payments.edit', 'inquiries.view', 'inquiries.create',
    'inquiries.edit', 'quotations.view', 'quotations.create', 'quotations.edit',
    'customers.view', 'guides.view', 'guides.manage', 'operations.view', 'operations.edit',
    'reports.view', 'reports.export', 'settings.view'
  ],

  sales: [
    'dashboard.view', 'bookings.view', 'bookings.create', 'bookings.edit', 'payments.view',
    'inquiries.view', 'inquiries.create', 'inquiries.edit', 'quotations.view',
    'quotations.create', 'quotations.edit'
  ],

  operations: [
    'dashboard.view', 'trips.view', 'bookings.view', 'bookings.edit', 'operations.view',
    'operations.edit', 'guides.view'
  ],

  finance: [
    'dashboard.view', 'bookings.view', 'bookings.edit', 'payments.view', 'payments.edit',
    'reports.view'
  ],

  guide: [
    'trips.view', 'bookings.view', 'operations.view', 'operations.edit'
  ],

  viewer: [
    'dashboard.view', 'trips.view', 'bookings.view', 'inquiries.view', 'quotations.view',
    'reports.view'
  ]
};

export function hasPermission(role: string | undefined | null, permission: string): boolean {
  if (!role) return false;
  if (role === 'superadmin') return true;
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;
  return allowed.includes(permission);
}
